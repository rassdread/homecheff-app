import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';
import {
  assertDiscountWithinCap,
  encodePlatformFixedAppliesTo,
  encodePlatformPercentAppliesTo,
  type PlatformPromoPurpose,
} from '@/lib/promo-codes/discount-policy';
import { createAdminCoupon } from '@/lib/promo-codes/coupon-service';
import { parseDiscountDurationCycles } from '@/lib/promo-codes/platform-promo-duration';

export const dynamic = 'force-dynamic';

const PURPOSES = new Set<PlatformPromoPurpose>([
  'gift',
  'compensation',
  'launch',
  'testing',
  'marketing',
  'general',
  'invited_business',
  'pilot',
]);

function mapPromoRow(p: {
  id: string;
  code: string;
  name: string | null;
  status: string;
  discountSharePct: number;
  discountDurationCycles: number | null;
  maxRedemptionsPerUser: number | null;
  createdByAdminId: string | null;
  startsAt: Date;
  endsAt: Date | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  appliesTo: string;
  affiliateId: string | null;
  affiliate: {
    user: { id: string; name: string | null; email: string | null };
  } | null;
  _count: { businessSubscriptions: number };
}) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    status: p.status,
    discountSharePct: p.discountSharePct,
    discountDurationCycles: p.discountDurationCycles,
    maxRedemptionsPerUser: p.maxRedemptionsPerUser,
    createdByAdminId: p.createdByAdminId,
    startsAt: p.startsAt,
    endsAt: p.endsAt,
    maxRedemptions: p.maxRedemptions,
    redemptionCount: p.redemptionCount,
    appliesTo: p.appliesTo,
    isPlatform: !p.affiliateId,
    affiliate: p.affiliate
      ? {
          id: p.affiliateId,
          name: p.affiliate.user.name,
          email: p.affiliate.user.email,
        }
      : null,
    businessSubscriptionCount: p._count.businessSubscriptions,
  };
}

/** List promo codes for admin (affiliate + platform). ?platformOnly=1 for Admin Promotions. */
export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const platformOnly =
    req.nextUrl.searchParams.get('platformOnly') === '1' ||
    req.nextUrl.searchParams.get('platformOnly') === 'true';

  const promoCodes = await prisma.promoCode.findMany({
    where: platformOnly ? { affiliateId: null } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      affiliate: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { businessSubscriptions: true } },
    },
  });

  return NextResponse.json({
    promoCodes: promoCodes.map(mapPromoRow),
  });
}

/**
 * Create platform admin promo / coupon.
 *
 * Body:
 * - code (required)
 * - name?
 * - discountType: 'percent' | 'fixed' (default percent)
 * - discountValue: number — percent 0–100 or fixed cents
 * - discountDurationCycles?: 1–36 (billing months); omit for forever
 * - purpose?: gift | compensation | launch | testing | marketing | general | invited_business | pilot
 * - target?: 'subscription' | 'checkout'
 * - startsAt?, endsAt?, maxRedemptions?, maxRedemptionsPerUser?, description?
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const codeRaw = typeof body.code === 'string' ? body.code : '';
  const name =
    typeof body.name === 'string' && body.name.trim()
      ? body.name.trim().slice(0, 120)
      : null;
  const discountType = body.discountType === 'fixed' ? 'fixed' : 'percent';
  const discountValue = Number(body.discountValue ?? body.discountSharePct ?? body.discountPercent);
  const purposeRaw = typeof body.purpose === 'string' ? body.purpose : 'general';
  const purpose = (PURPOSES.has(purposeRaw as PlatformPromoPurpose)
    ? purposeRaw
    : 'general') as PlatformPromoPurpose;
  const target =
    body.target === 'checkout'
      ? 'checkout'
      : body.target === 'subscription'
        ? 'subscription'
        : discountType === 'fixed'
          ? 'checkout'
          : 'subscription';

  const durationParsed = parseDiscountDurationCycles(body.discountDurationCycles);
  if (!durationParsed.ok) {
    return NextResponse.json({ error: durationParsed.error }, { status: 400 });
  }

  if (!codeRaw.trim()) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  if (!Number.isFinite(discountValue)) {
    return NextResponse.json({ error: 'discountValue is required' }, { status: 400 });
  }

  // Checkout coupons (Stripe-adjacent Prisma Coupon) — percent or fixed, admin-only 0–100%.
  if (target === 'checkout') {
    const result = await createAdminCoupon({
      code: codeRaw,
      description: typeof body.description === 'string' ? body.description : purpose,
      discountType,
      discountValue,
      validFrom: body.startsAt ? new Date(body.startsAt) : new Date(),
      validUntil: body.endsAt ? new Date(body.endsAt) : null,
      isActive: true,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }

    await logAdminAction(guard.admin.user.id, 'PROMO_CODE_CREATED', {
      targetType: 'coupon',
      targetId: result.coupon.id,
      newValue: {
        code: result.coupon.code,
        discountType,
        discountValue,
        purpose,
        target,
      },
      reason: typeof body.reason === 'string' ? body.reason : purpose,
    });

    return NextResponse.json(
      { ok: true, kind: 'coupon', coupon: result.coupon },
      { status: 201 },
    );
  }

  // Subscription platform PromoCode — full-price percent or fixed (no affiliate cap).
  if (discountType === 'percent') {
    const cap = assertDiscountWithinCap({
      actor: 'admin',
      discountPct: discountValue,
    });
    if (!cap.ok) {
      return NextResponse.json({ error: cap.error }, { status: 400 });
    }
  } else if (discountValue < 0) {
    return NextResponse.json({ error: 'Fixed discount must be >= 0' }, { status: 400 });
  }

  const code = codeRaw.toUpperCase().trim();
  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: 'Promo code already exists' }, { status: 409 });
  }

  const appliesTo =
    discountType === 'fixed'
      ? encodePlatformFixedAppliesTo(discountValue)
      : encodePlatformPercentAppliesTo(purpose);

  const promoCode = await prisma.promoCode.create({
    data: {
      affiliateId: null,
      name,
      code,
      discountSharePct:
        discountType === 'percent' ? Math.round(discountValue) : 0,
      discountDurationCycles: durationParsed.value,
      maxRedemptionsPerUser:
        body.maxRedemptionsPerUser != null
          ? Number(body.maxRedemptionsPerUser)
          : null,
      createdByAdminId: guard.admin.user.id,
      startsAt: body.startsAt ? new Date(body.startsAt) : new Date(),
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      maxRedemptions: body.maxRedemptions != null ? Number(body.maxRedemptions) : null,
      redemptionCount: 0,
      status: 'ACTIVE',
      appliesTo,
    },
    include: {
      affiliate: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { businessSubscriptions: true } },
    },
  });

  await logAdminAction(guard.admin.user.id, 'PROMO_CODE_CREATED', {
    targetType: 'promo_code',
    targetId: promoCode.id,
    newValue: {
      code: promoCode.code,
      name,
      discountType,
      discountValue,
      discountDurationCycles: durationParsed.value,
      purpose,
      appliesTo,
      target: 'subscription',
    },
    reason: typeof body.reason === 'string' ? body.reason : purpose,
  });

  return NextResponse.json(
    {
      ok: true,
      kind: 'promo_code',
      promoCode: mapPromoRow(promoCode),
    },
    { status: 201 },
  );
}
