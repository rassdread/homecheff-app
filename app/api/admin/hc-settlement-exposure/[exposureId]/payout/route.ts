import { NextRequest, NextResponse } from 'next/server';

import { requireAdminPermission } from '@/lib/admin-guard';
import {
  buildHcSellerTreasuryReadModel,
  evaluateHcSellerPayoutEligibilityById,
  executeHcSellerPayout,
} from '@/lib/hc/seller-payout/payout-service';
import { getHcSellerPayoutFlags } from '@/lib/hc/seller-payout/flags';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ exposureId: string }> };

/** GET — eligibility + treasury read model (no transfer). */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const { exposureId } = await params;
  const exposure = await prisma.marketplaceHcSettlementExposure.findUnique({
    where: { id: exposureId },
    include: {
      order: {
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          hcPaymentPhase: true,
        },
      },
      payoutAttempts: { orderBy: { attemptNumber: 'desc' }, take: 3 },
    },
  });
  if (!exposure) {
    return NextResponse.json({ ok: false, code: 'EXPOSURE_NOT_FOUND' }, { status: 404 });
  }

  const eligibility = await evaluateHcSellerPayoutEligibilityById(exposureId);
  const flags = getHcSellerPayoutFlags();
  const seller = await prisma.user.findUnique({
    where: { id: exposure.sellerUserId },
    select: {
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
    },
  });

  return NextResponse.json({
    ok: true,
    flags,
    exposure: {
      id: exposure.id,
      orderId: exposure.orderId,
      status: exposure.status,
      grossOrderCents: exposure.grossOrderCents,
      theoreticalPlatformFeeCents: exposure.theoreticalPlatformFeeCents,
      sellerNetExposureCents: exposure.sellerNetExposureCents,
      settlementSource: exposure.settlementSource,
      feeSourceType: exposure.feeSourceType,
      effectiveSellerFeeBps: exposure.effectiveSellerFeeBps,
      payoutReference: exposure.payoutReference,
      paidAt: exposure.paidAt,
    },
    treasury: buildHcSellerTreasuryReadModel(exposure),
    eligibility,
    destination: {
      ready: Boolean(seller?.stripeConnectAccountId && seller.stripeConnectOnboardingCompleted),
      hasAccount: Boolean(seller?.stripeConnectAccountId),
      onboardingCompleted: Boolean(seller?.stripeConnectOnboardingCompleted),
    },
    recentAttempts: exposure.payoutAttempts.map((a) => ({
      attemptNumber: a.attemptNumber,
      status: a.status,
      amountCents: a.amountCents,
      errorCode: a.errorCode,
      providerTransferRef: a.providerTransferRef,
    })),
  });
}

/** POST — explicit admin payout (gated; fails closed when flags OFF). */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const { exposureId } = await params;
  const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean; confirm?: boolean };
  if (!body.confirm && !body.dryRun) {
    return NextResponse.json(
      { ok: false, code: 'CONFIRMATION_REQUIRED', message: 'Set confirm:true or dryRun:true' },
      { status: 400 },
    );
  }

  const result = await executeHcSellerPayout({
    exposureId,
    adminUserId: guard.admin.user.id,
    dryRun: body.dryRun === true,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, ...result }, { status: 422 });
  }

  return NextResponse.json({ ok: true, ...result });
}
