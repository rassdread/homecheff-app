/**
 * Activate a business subscription at €0 when a platform/admin promo
 * covers the full price — without creating a fake Stripe €0.01 charge.
 */

import { prisma } from '@/lib/prisma';
import { ATTRIBUTION_WINDOW_DAYS } from '@/lib/affiliate-config';
import { normalizeSubscriptionName } from '@/lib/stripe';

export async function activateFreeSubscriptionEntitlement(params: {
  userId: string;
  planKey: string;
  promoCodeId: string | null;
  attributionId: string | null;
  basePriceCents: number;
  finalPriceCents: number;
  /** Free entitlement window in days (defaults to plan durationDays). */
  durationDays?: number;
  /** Prefer billing-cycle duration from platform promo when set. */
  discountDurationCycles?: number | null;
}): Promise<{
  ok: true;
  planName: string;
  validUntil: Date;
  businessSubscriptionId: string;
  promoPeriodEndsAt: Date;
}> {
  const planName = normalizeSubscriptionName(params.planKey);
  const dbSubscription =
    (await prisma.subscription.findFirst({
      where: { name: planName, isActive: true },
    })) ??
    (await prisma.subscription.findUnique({
      where: { id: params.planKey.toLowerCase() },
    }));

  if (!dbSubscription) {
    throw new Error(`Subscription plan not found: ${params.planKey}`);
  }

  const now = new Date();
  const { billingCyclesToDurationDays } = await import(
    '@/lib/promo-codes/platform-promo-duration'
  );
  const fromCycles = billingCyclesToDurationDays(params.discountDurationCycles);
  const durationDays =
    fromCycles ?? params.durationDays ?? dbSubscription.durationDays ?? 365;
  const validUntil = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
  const endsAt = new Date(now.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  await prisma.sellerProfile.update({
    where: { userId: params.userId },
    data: {
      subscriptionId: dbSubscription.id,
      subscriptionValidUntil: validUntil,
      // No Stripe subscription for free entitlement
      stripeSubscriptionId: null,
    },
  });

  const existing = await prisma.businessSubscription.findUnique({
    where: { businessUserId: params.userId },
  });

  let businessSubscriptionId: string;
  if (existing) {
    const updated = await prisma.businessSubscription.update({
      where: { id: existing.id },
      data: {
        planId: dbSubscription.id,
        priceCents: params.finalPriceCents,
        currency: 'eur',
        status: 'active',
        promoCodeId: params.promoCodeId,
        attributionId: params.attributionId,
        startsAt: now,
        endsAt,
        stripeSubscriptionId: null,
      },
    });
    businessSubscriptionId = updated.id;
  } else {
    const created = await prisma.businessSubscription.create({
      data: {
        businessUserId: params.userId,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        planId: dbSubscription.id,
        priceCents: params.finalPriceCents,
        currency: 'eur',
        status: 'active',
        promoCodeId: params.promoCodeId,
        attributionId: params.attributionId,
        startsAt: now,
        endsAt,
      },
    });
    businessSubscriptionId = created.id;
  }

  if (params.promoCodeId) {
    await prisma.promoCode.update({
      where: { id: params.promoCodeId },
      data: { redemptionCount: { increment: 1 } },
    });
  }

  return { ok: true, planName, validUntil, businessSubscriptionId, promoPeriodEndsAt: validUntil };
}
