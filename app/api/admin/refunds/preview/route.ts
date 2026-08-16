import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  dryRunRefundSettlement,
  type RefundMode,
  type SellerAllocationInput,
} from '@/lib/payments/refund-settlement';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, role: true },
  });
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
  }
  return { user };
}

/**
 * POST /api/admin/refunds/preview
 * Read-only financial impact preview. Never mutates Stripe.
 */
export async function POST(req: NextRequest) {
  try {
    const authz = await requireAdmin();
    if ('error' in authz && authz.error) return authz.error;

    const body = await req.json();
    const orderId = body.orderId as string | undefined;
    const mode = (body.mode || 'FULL_BUYER_GROSS') as RefundMode;
    const allocations = body.allocations as SellerAllocationInput[] | undefined;
    const buyerRefundCentsOverride =
      typeof body.buyerRefundCents === 'number' ? body.buyerRefundCents : null;
    const includeCourierCents =
      typeof body.includeCourierCents === 'number'
        ? body.includeCourierCents
        : null;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    const plan = await dryRunRefundSettlement({
      orderId,
      mode,
      allocations,
      buyerRefundCentsOverride,
      includeCourierCents,
      includeBuyerSurcharge: body.includeBuyerSurcharge === true,
    });

    return NextResponse.json({
      dryRun: true,
      stripeMutated: false,
      preview: {
        buyerRefundCents: plan.buyerRefundCents,
        sellerReversalCents: plan.totals.sellerReversalCents,
        affiliateReversalCents: plan.totals.affiliateReversalCents,
        courierReversalCents: plan.totals.courierReversalCents,
        platformEconomicImpactCents: plan.totals.platformEconomicImpactCents,
        stripeFeeTreatment: plan.stripeFeeRefundTreatment,
        sellerLegs: plan.sellerLegs.map((l) => ({
          productId: l.productId,
          transferId: l.transferId,
          transferReversalCents: l.transferReversalCents,
          sellerConsiderationRefundCents: l.sellerConsiderationRefundCents,
          remainingAfterCents: l.remainingAfterCents,
        })),
      },
      plan,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'preview_failed';
    console.error('Refund preview error:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
