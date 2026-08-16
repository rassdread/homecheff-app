import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { planDisputeRecovery } from '@/lib/payments/dispute-settlement';

export const dynamic = 'force-dynamic';

/**
 * GET — list dispute settlements for admin desk
 * POST — read-only financial preview for an order + dispute amount
 */
export async function GET(req: NextRequest) {
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

  const rows = await prisma.disputeSettlement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    disputes: rows.map((r) => ({
      id: r.id,
      stripeDisputeId: r.stripeDisputeId,
      orderId: r.orderId,
      amountCents: r.amountCents,
      reason: r.reason,
      stripeStatus: r.stripeStatus,
      financialStatus: r.financialStatus,
      evidenceDueBy: r.evidenceDueBy,
      recoveredSellerCents: r.recoveredSellerCents,
      recoveredAffiliateCents: r.recoveredAffiliateCents,
      recoveredCourierCents: r.recoveredCourierCents,
      outstandingSellerCents: r.outstandingSellerCents,
      lastError: r.lastError,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
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

  const body = await req.json();
  const orderId = body.orderId as string | undefined;
  const disputeAmountCents =
    typeof body.disputeAmountCents === 'number'
      ? body.disputeAmountCents
      : undefined;
  const stripeDisputeId =
    (body.stripeDisputeId as string) || `preview_${orderId || 'unknown'}`;

  if (!orderId || disputeAmountCents == null) {
    return NextResponse.json(
      { error: 'orderId and disputeAmountCents required' },
      { status: 400 },
    );
  }

  const plan = await planDisputeRecovery({
    orderId,
    stripeDisputeId,
    disputeAmountCents,
  });

  return NextResponse.json({
    dryRun: true,
    stripeMutated: false,
    preview: {
      DISPUTE_AMOUNT: plan.disputeAmountCents,
      SELLER_RECOVERY: plan.sellerRecoveryCents,
      AFFILIATE_RECOVERY: plan.affiliateRecoveryCents,
      COURIER_RECOVERY: plan.courierRecoveryCents,
      PLATFORM_EXPOSURE: plan.platformExposureCents,
      STRIPE_FEES_EST: plan.stripeDisputeFeeCentsEstimated,
      UNRECOVERED: plan.recipientOutstandingCents,
    },
    plan,
  });
}
