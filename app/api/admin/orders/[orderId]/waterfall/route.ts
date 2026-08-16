import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buildPaymentWaterfall } from '@/lib/payments/payment-waterfall';
import {
  isSuccessfulTransferRef,
  sellerPayoutId,
  sellerTransactionId,
} from '@/lib/payments/seller-settlement';
import { calculatePlatformFeeCents } from '@/lib/fees';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders/[orderId]/waterfall
 * Read-only multi-recipient financial truth for one Order.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { role: true },
  });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const orderId = params.orderId;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: { User: { select: { id: true, stripeConnectAccountId: true } } },
              },
            },
          },
        },
      },
      deliveryOrder: { select: { id: true, quotedFeeCents: true, deliveryFee: true } },
    },
  });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const sellerInputs = [];
  const settlementLegs = [];
  for (const item of order.items) {
    const sellerUserId = item.Product?.seller?.User?.id;
    if (!sellerUserId) continue;
    const gross = item.priceCents * item.quantity;
    const txn = await prisma.transaction.findUnique({
      where: { id: sellerTransactionId(orderId, item.productId) },
    });
    const payout = await prisma.payout.findUnique({
      where: { id: sellerPayoutId(orderId, item.productId) },
    });
    const feePercent = (txn?.platformFeeBps ?? 1200) / 100;
    sellerInputs.push({
      productId: item.productId,
      sellerUserId,
      sellerGrossCents: gross,
      platformFeePercent: feePercent,
      destinationConnectAccountId:
        payout?.destinationConnectAccountId ??
        item.Product?.seller?.User?.stripeConnectAccountId ??
        null,
    });
    settlementLegs.push({
      productId: item.productId,
      sellerUserId,
      sellerGrossCents: gross,
      platformFeeCents: calculatePlatformFeeCents(gross, feePercent),
      sellerNetCents: payout?.amountCents ?? Math.max(0, gross - calculatePlatformFeeCents(gross, feePercent)),
      transactionId: txn?.id ?? null,
      transactionStatus: txn?.status ?? null,
      payoutId: payout?.id ?? null,
      transferId: isSuccessfulTransferRef(payout?.providerRef)
        ? payout!.providerRef
        : null,
      destinationConnectAccountId: payout?.destinationConnectAccountId ?? null,
      transferStatus: isSuccessfulTransferRef(payout?.providerRef)
        ? 'SETTLED'
        : payout?.providerRef?.startsWith('failed_')
          ? 'FAILED'
          : payout
            ? 'PENDING'
            : 'MISSING',
    });
  }

  const deliveryGross =
    order.deliveryOrder?.quotedFeeCents ??
    order.deliveryOrder?.deliveryFee ??
    order.shippingCostCents ??
    0;

  const affiliateRows = await prisma.commissionLedger.findMany({
    where: {
      eventType: 'ORDER_PAID',
      meta: { path: ['orderId'], equals: orderId },
    },
    select: { amountCents: true, status: true, affiliateId: true },
  });
  const affiliateCommissionCents = affiliateRows
    .filter((r) => r.amountCents > 0 && r.status !== 'REVERSED')
    .reduce((s, r) => s + r.amountCents, 0);

  const waterfall = buildPaymentWaterfall({
    sellers: sellerInputs,
    deliveryGrossCents: typeof deliveryGross === 'number' ? deliveryGross : 0,
    affiliateCommissionCents,
  });

  const refunds = await prisma.refundSettlement.findMany({
    where: { orderId },
    select: {
      id: true,
      status: true,
      buyerRefundCents: true,
      stripeRefundId: true,
    },
  });
  const disputes = await prisma.disputeSettlement.findMany({
    where: { orderId },
    select: {
      id: true,
      stripeDisputeId: true,
      financialStatus: true,
      amountCents: true,
      recoveredSellerCents: true,
      outstandingSellerCents: true,
    },
  });

  const unsettled = settlementLegs.filter((l) => l.transferStatus !== 'SETTLED');

  return NextResponse.json({
    orderId,
    orderStatus: order.status,
    buyerPaidCents: order.totalAmount,
    waterfall,
    settlementLegs,
    affiliate: {
      commissionCents: affiliateCommissionCents,
      rows: affiliateRows.length,
      note: 'Funded from platform fee; Stripe transfer is batch payout when Connect ready',
    },
    courier: {
      deliveryGrossCents: waterfall.deliveryGrossCents,
      entitlementCents: waterfall.courierEntitlementCents,
      note: 'Ledger-only today (no Stripe Transfer in ensureDeliveryPayout)',
    },
    refunds,
    disputes,
    unsettled,
    unreconciledCents: waterfall.invariants.unreconciledCents,
  });
}
