import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import {
  dryRunRefundSettlement,
  executeRefundSettlement,
  persistRefundPlan,
  type RefundMode,
  type SellerAllocationInput,
} from '@/lib/payments/refund-settlement';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

/**
 * POST /api/admin/refunds/execute
 *
 * Requires confirmLiveMutation: true AND confirmFinancialPreview: true.
 * Persists plan first, then reversals, then buyer refund.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const orderId = body.orderId as string | undefined;
    const mode = (body.mode || 'FULL_BUYER_GROSS') as RefundMode;
    const allocations = body.allocations as SellerAllocationInput[] | undefined;
    const reason = (body.reason as string) || 'Admin refund settlement';

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    if (body.confirmLiveMutation !== true || body.confirmFinancialPreview !== true) {
      return NextResponse.json(
        {
          error:
            'Both confirmLiveMutation and confirmFinancialPreview must be true. Use /api/admin/refunds/preview first.',
        },
        { status: 400 },
      );
    }

    // Hard stop: controlled live E1 order cannot be mutated without owner token
    if (
      orderId === 'b7df063b-a305-4129-a63f-3418bb6846df' &&
      body.ownerApprovalToken !== 'APPROVE_E1_REFUND_REVERSAL_TEST'
    ) {
      return NextResponse.json(
        {
          error:
            'Controlled E1 order blocked. Provide ownerApprovalToken=APPROVE_E1_REFUND_REVERSAL_TEST after dry-run approval.',
          LIVE_REFUND_SAFE_TO_TEST: 'blocked_pending_owner_approval',
        },
        { status: 403 },
      );
    }

    const plan = await dryRunRefundSettlement({
      orderId,
      mode,
      allocations,
      buyerRefundCentsOverride:
        typeof body.buyerRefundCents === 'number' ? body.buyerRefundCents : null,
      includeCourierCents:
        typeof body.includeCourierCents === 'number'
          ? body.includeCourierCents
          : null,
      includeBuyerSurcharge: body.includeBuyerSurcharge === true,
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
        notes: `RefundSettlement ${result.settlementId} order=${orderId} status=${result.status} buyer=${plan.buyerRefundCents} sellerRev=${plan.totals.sellerReversalCents} errors=${result.errors.join('; ') || 'none'}`,
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
      sellerReversals: result.sellerReversals,
      courierReversal: result.courierReversal,
      affiliate: result.affiliate,
      errors: result.errors,
      plan,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'execute_failed';
    console.error('Refund execute error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
