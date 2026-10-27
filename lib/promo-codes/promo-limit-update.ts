/**
 * Usage-limit edits do not change discount percent, duration, or existing redemptions.
 * PromoCode is enforced locally under a row lock. There is no Stripe promotion-code
 * id on this record, so a local max is the limit Stripe checkout does not override.
 */

export type PromoLimitDecision =
  | { ok: true; maxRedemptions: number | null }
  | { ok: false; error: string };

export function decidePromoMaxRedemptions(input: {
  activeRedemptions: number;
  nextMax: number | null;
}): PromoLimitDecision {
  if (input.nextMax === null) return { ok: true, maxRedemptions: null };
  if (!Number.isInteger(input.nextMax) || input.nextMax < 0) {
    return { ok: false, error: 'maxRedemptions must be a non-negative integer or null for unlimited' };
  }
  if (input.activeRedemptions < 0) {
    return { ok: false, error: 'active redemption count is invalid' };
  }
  if (input.nextMax < input.activeRedemptions) {
    return {
      ok: false,
      error: `maxRedemptions cannot be below completed and reserved uses (${input.activeRedemptions})`,
    };
  }
  return { ok: true, maxRedemptions: input.nextMax };
}

export function remainingRedemptions(input: {
  maxRedemptions: number | null;
  activeRedemptions: number;
}): number | null {
  if (input.maxRedemptions == null) return null;
  return Math.max(0, input.maxRedemptions - input.activeRedemptions);
}

export async function updatePromoRedemptionLimit(input: {
  promoCodeId: string;
  nextMax: number | null;
  endsAt: Date | null;
  endsAtProvided: boolean;
}): Promise<
  | {
      ok: true;
      promoCodeId: string;
      previousMax: number | null;
      maxRedemptions: number | null;
      activeRedemptions: number;
      remaining: number | null;
      endsAt: Date | null;
      discountSharePct: number;
      discountDurationCycles: number | null;
      stripeSync: 'LOCAL_AUTHORITATIVE';
    }
  | { ok: false; error: string; status: number }
> {
  const { prisma } = await import('@/lib/prisma');
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      Array<{
        id: string;
        maxRedemptions: number | null;
        discountSharePct: number;
        discountDurationCycles: number | null;
        endsAt: Date | null;
      }>
    >`
      SELECT id, "maxRedemptions", "discountSharePct", "discountDurationCycles", "endsAt"
      FROM "PromoCode"
      WHERE id = ${input.promoCodeId}
      FOR UPDATE
    `;
    const promo = locked[0];
    if (!promo) return { ok: false as const, error: 'Promo code not found', status: 404 };

    const activeRedemptions = await tx.promoCodeRedemption.count({
      where: { promoCodeId: promo.id, status: { in: ['RESERVED', 'CONFIRMED'] } },
    });
    const decision = decidePromoMaxRedemptions({
      activeRedemptions,
      nextMax: input.nextMax,
    });
    if (!decision.ok) return { ok: false as const, error: decision.error, status: 400 };

    const updated = await tx.promoCode.update({
      where: { id: promo.id },
      data: {
        maxRedemptions: decision.maxRedemptions,
        ...(input.endsAtProvided ? { endsAt: input.endsAt } : {}),
      },
      select: {
        id: true,
        maxRedemptions: true,
        endsAt: true,
        discountSharePct: true,
        discountDurationCycles: true,
      },
    });
    return {
      ok: true as const,
      promoCodeId: updated.id,
      previousMax: promo.maxRedemptions,
      maxRedemptions: updated.maxRedemptions,
      activeRedemptions,
      remaining: remainingRedemptions({
        maxRedemptions: updated.maxRedemptions,
        activeRedemptions,
      }),
      endsAt: updated.endsAt,
      discountSharePct: updated.discountSharePct,
      discountDurationCycles: updated.discountDurationCycles,
      stripeSync: 'LOCAL_AUTHORITATIVE' as const,
    };
  });
}
