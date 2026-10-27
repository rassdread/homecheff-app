import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { requireAdminCapability } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';
import { financialStripeSecret } from '@/lib/stripe-runtime-guard';
import { calculatePlatformFeeCents } from '@/lib/fees';
import {
  classifySellerTransferList,
  decideSellerTransferRecovery,
  type ListedSellerTransfer,
} from '@/lib/payments/seller-transfer-recovery';
import { isSuccessfulTransferRef, resolvePlatformFeeBps } from '@/lib/payments/seller-settlement';

export const dynamic = 'force-dynamic';

/**
 * Explicit recovery for a seller transfer whose Stripe idempotency key cached a failure.
 * Lists transfers first. Creates with a new generation key only when none exists.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const guard = await requireAdminCapability('MARKETPLACE.TRANSFERS.RECOVER');
  if (!guard.ok) return guard.response;

  const secret = financialStripeSecret();
  if (!secret) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }
  if (secret.startsWith('sk_live_')) {
    return NextResponse.json({ error: 'Live seller-transfer recovery is not authorized' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (body.confirmLiveMutation !== true || !reason) {
    return NextResponse.json(
      { error: 'confirmLiveMutation and reason are required' },
      { status: 400 },
    );
  }

  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          Product: { include: { seller: { include: { User: true } } } },
        },
      },
    },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const productId = typeof body.productId === 'string' ? body.productId : order.items[0]?.productId;
  const item = order.items.find((row) => row.productId === productId);
  if (!item) return NextResponse.json({ error: 'Order item not found' }, { status: 404 });

  const seller = item.Product?.seller?.User;
  if (!seller) return NextResponse.json({ error: 'Seller not found' }, { status: 404 });

  const payoutId = `payout_seller_${orderId}_${item.productId}`;
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
  if (isSuccessfulTransferRef(payout.providerRef)) {
    return NextResponse.json({
      ok: true,
      action: 'already_settled',
      transferId: payout.providerRef,
    });
  }

  const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
  const bps = await resolvePlatformFeeBps(seller.id);
  const sellerGrossCents = item.priceCents * item.quantity;
  const expectedAmountCents = Math.max(0, sellerGrossCents - calculatePlatformFeeCents(sellerGrossCents, bps / 100));

  let chargeId: string | null = null;
  let chargeRefunded = false;
  let chargeDisputed = false;
  let partialRefund = false;
  if (order.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId, {
      expand: ['payment_intent.latest_charge'],
    });
    const paymentIntent = session.payment_intent;
    const charge =
      paymentIntent && typeof paymentIntent === 'object' ? paymentIntent.latest_charge : null;
    if (charge && typeof charge === 'object') {
      chargeId = charge.id;
      chargeRefunded = charge.refunded === true;
      chargeDisputed = charge.disputed === true;
      partialRefund = (charge.amount_refunded ?? 0) > 0 && charge.refunded !== true;
    }
  }

  let lookup: ReturnType<typeof classifySellerTransferList> = { ok: false, reason: 'LOOKUP_FAILED' };
  try {
    const page = await stripe.transfers.list({ transfer_group: `order_${orderId}`, limit: 100 });
    const transfers: ListedSellerTransfer[] = page.data.map((transfer) => ({
      id: transfer.id,
      amount: transfer.amount,
      destination: typeof transfer.destination === 'string' ? transfer.destination : transfer.destination?.id ?? null,
      sourceTransaction:
        typeof transfer.source_transaction === 'string'
          ? transfer.source_transaction
          : transfer.source_transaction?.id ?? null,
      orderId: transfer.metadata?.orderId ?? null,
      productId: transfer.metadata?.productId ?? null,
    }));
    lookup = classifySellerTransferList({
      transfers,
      orderId,
      productId: item.productId,
      amountCents: payout.amountCents,
      chargeId,
      destination: seller.stripeConnectAccountId,
    });
  } catch (error) {
    console.error('[recover-seller-transfer] lookup failed', error instanceof Error ? error.message : error);
  }

  const decision = decideSellerTransferRecovery({
    lookup,
    localTransferId: isSuccessfulTransferRef(payout.providerRef) ? payout.providerRef : null,
    orderStatus: order.status,
    chargeRefunded,
    chargeDisputed,
    partialRefund,
    destination: seller.stripeConnectAccountId,
    destinationReady: Boolean(seller.stripeConnectAccountId && seller.stripeConnectOnboardingCompleted),
    platformAccountId: process.env.STRIPE_PLATFORM_ACCOUNT_ID || null,
    amountCents: payout.amountCents,
    expectedAmountCents,
    failedAttemptRecorded: true,
    recoveryCode: payout.transferFailureCode,
    explicitAdminRecovery: true,
    confirmNewGeneration: body.confirmNewGeneration === true,
    orderId,
    productId: item.productId,
    chargeId,
  });

  if (decision.action === 'adopt' || decision.action === 'already_settled') {
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        providerRef: decision.transferId,
        destinationConnectAccountId: seller.stripeConnectAccountId,
        transferFailureCode: null,
      },
    });
    await logAdminAction(guard.admin.user.id, 'SELLER_TRANSFER_ADOPTED', {
      targetType: 'payout',
      targetId: payout.id,
      oldValue: { providerRef: payout.providerRef },
      newValue: { providerRef: decision.transferId },
      reason,
    });
    return NextResponse.json({ ok: true, action: decision.action, transferId: decision.transferId });
  }

  if (decision.action !== 'create') {
    return NextResponse.json({ ok: false, action: decision.action, reason: decision.reason }, { status: 409 });
  }

  const claimed = await prisma.payout.updateMany({
    where: {
      id: payout.id,
      NOT: { providerRef: { startsWith: 'tr_' } },
    },
    data: {
      transferFailureCode: `RECOVERY_G${decision.generation}`,
      transferFailureAt: new Date(),
    },
  });
  if (claimed.count !== 1) {
    return NextResponse.json({ ok: false, reason: 'RECOVERY_IN_FLIGHT' }, { status: 409 });
  }

  try {
    const transfer = await stripe.transfers.create(
      {
        amount: payout.amountCents,
        currency: 'eur',
        destination: seller.stripeConnectAccountId!,
        transfer_group: `order_${orderId}`,
        source_transaction: chargeId || undefined,
        metadata: {
          orderId,
          productId: item.productId,
          sellerId: seller.id,
          recoveryGeneration: String(decision.generation),
          homecheff_app: 'true',
        },
      },
      { idempotencyKey: decision.idempotencyKey },
    );
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        providerRef: transfer.id,
        destinationConnectAccountId: seller.stripeConnectAccountId,
        transferFailureCode: null,
      },
    });
    await logAdminAction(guard.admin.user.id, 'SELLER_TRANSFER_RECOVERED', {
      targetType: 'payout',
      targetId: payout.id,
      oldValue: { providerRef: payout.providerRef, transferFailureCode: payout.transferFailureCode },
      newValue: { providerRef: transfer.id, generation: decision.generation },
      reason,
    });
    return NextResponse.json({
      ok: true,
      action: 'create',
      transferId: transfer.id,
      generation: decision.generation,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transfer_failed';
    await prisma.payout.update({
      where: { id: payout.id },
      data: {
        providerRef: `failed_${Date.now()}`,
        transferFailureCode: `RECOVERY_G${decision.generation}_FAILED`,
        transferFailureAt: new Date(),
      },
    });
    await logAdminAction(guard.admin.user.id, 'SELLER_TRANSFER_RECOVERY_FAILED', {
      targetType: 'payout',
      targetId: payout.id,
      oldValue: { providerRef: payout.providerRef },
      newValue: { transferFailureCode: `RECOVERY_G${decision.generation}_FAILED` },
      reason,
      meta: { error: message },
    });
    return NextResponse.json({ ok: false, reason: 'TRANSFER_FAILED', generation: decision.generation }, { status: 502 });
  }
}
