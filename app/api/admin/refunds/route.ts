import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import {
  dryRunRefundSettlement,
  executeRefundSettlement,
  persistRefundPlan,
} from '@/lib/payments/refund-settlement';
import { sellerTransactionId } from '@/lib/payments/seller-settlement';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const transactionId = searchParams.get('transactionId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (transactionId) {
      where.transactionId = transactionId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    const refunds = await prisma.refund.findMany({
      where,
      include: {
        Transaction: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            Reservation: {
              include: {
                Listing: {
                  include: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    let filteredRefunds = refunds;
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { stripeSessionId: true, items: { select: { productId: true } } }
      });

      if (order) {
        const txnIds = new Set(
          order.items.map((i) => sellerTransactionId(orderId, i.productId)),
        );
        filteredRefunds = refunds.filter(
          (r) =>
            txnIds.has(r.transactionId) ||
            r.Transaction.providerRef === order.stripeSessionId,
        );
      }
    }

    const total = filteredRefunds.length;
    const totalAmount = filteredRefunds.reduce((sum, r) => sum + r.amountCents, 0);

    return NextResponse.json({
      refunds: filteredRefunds,
      total,
      totalAmount,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}

/**
 * Create refund via canonical refund-settlement engine.
 *
 * Preferred body:
 *   { orderId, mode?, amountCents?, confirmLiveMutation, confirmFinancialPreview, reason }
 *
 * Legacy body (transactionId + amountCents) is resolved to order when possible;
 * still requires confirm flags — never silent PI-only refund after seller transfer.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    let orderId = body.orderId as string | undefined;
    const transactionId = body.transactionId as string | undefined;
    const amountCents = body.amountCents as number | undefined;
    const reason = (body.reason as string) || 'Admin refund';

    if (!orderId && transactionId?.startsWith('txn_')) {
      // txn_{orderId}_{productId}
      const rest = transactionId.slice(4);
      const lastUnderscore = rest.lastIndexOf('_');
      if (lastUnderscore > 0) {
        orderId = rest.slice(0, lastUnderscore);
      }
    }

    if (!orderId && transactionId) {
      const tx = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });
      if (tx?.providerRef?.startsWith('cs_')) {
        const order = await prisma.order.findFirst({
          where: { stripeSessionId: tx.providerRef },
          select: { id: true },
        });
        orderId = order?.id;
      }
    }

    if (!orderId) {
      return NextResponse.json(
        {
          error:
            'orderId required (or resolvable transactionId). Use /api/admin/refunds/preview then confirm.',
        },
        { status: 400 },
      );
    }

    if (body.dryRun === true || body.previewOnly === true) {
      const plan = await dryRunRefundSettlement({
        orderId,
        mode: amountCents ? 'SELLER_CONSIDERATION' : 'FULL_BUYER_GROSS',
        buyerRefundCentsOverride: amountCents ?? null,
        allocations: amountCents
          ? await allocationsForOrderAmount(orderId, amountCents)
          : undefined,
      });
      return NextResponse.json({
        dryRun: true,
        preview: {
          buyerRefundCents: plan.buyerRefundCents,
          sellerReversalCents: plan.totals.sellerReversalCents,
          affiliateReversalCents: plan.totals.affiliateReversalCents,
          courierReversalCents: plan.totals.courierReversalCents,
          platformEconomicImpactCents: plan.totals.platformEconomicImpactCents,
          stripeFeeTreatment: plan.stripeFeeRefundTreatment,
        },
        plan,
      });
    }

    if (body.confirmLiveMutation !== true || body.confirmFinancialPreview !== true) {
      return NextResponse.json(
        {
          error:
            'Refund requires confirmLiveMutation=true and confirmFinancialPreview=true. Call preview first.',
          hint: 'POST /api/admin/refunds/preview',
        },
        { status: 400 },
      );
    }

    if (
      orderId === 'b7df063b-a305-4129-a63f-3418bb6846df' &&
      body.ownerApprovalToken !== 'APPROVE_E1_REFUND_REVERSAL_TEST'
    ) {
      return NextResponse.json(
        {
          error:
            'Controlled E1 order blocked until APPROVE_E1_REFUND_REVERSAL_TEST',
        },
        { status: 403 },
      );
    }

    const plan = await dryRunRefundSettlement({
      orderId,
      mode: body.mode || (amountCents ? 'SELLER_CONSIDERATION' : 'FULL_BUYER_GROSS'),
      buyerRefundCentsOverride: amountCents ?? null,
      allocations: body.allocations,
      reason,
      createdByAdminId: user.id,
    });

    const settlementIdem = `hc_rset_${plan.orderId}_${plan.buyerRefundIdempotencyKey}`;
    const persisted = await persistRefundPlan({
      plan,
      idempotencyKey: settlementIdem,
      createdByAdminId: user.id,
      reason,
    });

    const result = await executeRefundSettlement({
      stripe,
      plan,
      confirmLiveMutation: true,
      persist: false,
      settlementId: persisted.id,
      reason,
      createdByAdminId: user.id,
    });

    await prisma.adminAction.create({
      data: {
        id: `admin_action_${Date.now()}`,
        adminId: user.id,
        action: 'REFUND_SETTLEMENT_EXECUTED',
        notes: `RefundSettlement ${result.settlementId} via /api/admin/refunds. status=${result.status} buyer=${plan.buyerRefundCents}c sellerRev=${plan.totals.sellerReversalCents}c`,
      },
    });

    return NextResponse.json({
      settlementId: result.settlementId,
      status: result.status,
      stripeRefundId: result.stripeRefundId,
      preview: {
        buyerRefundCents: plan.buyerRefundCents,
        sellerReversalCents: plan.totals.sellerReversalCents,
        affiliateReversalCents: plan.totals.affiliateReversalCents,
        courierReversalCents: plan.totals.courierReversalCents,
        platformEconomicImpactCents: plan.totals.platformEconomicImpactCents,
      },
      errors: result.errors,
      refund: result.stripeRefundId
        ? { id: result.stripeRefundId, amountCents: plan.buyerRefundCents }
        : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create refund';
    console.error('Error creating refund:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function allocationsForOrderAmount(orderId: string, amountCents: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order?.items.length) return undefined;
  const first = order.items[0];
  return [
    {
      productId: first.productId,
      sellerConsiderationCents: Math.min(
        amountCents,
        first.priceCents * first.quantity,
      ),
    },
  ];
}
