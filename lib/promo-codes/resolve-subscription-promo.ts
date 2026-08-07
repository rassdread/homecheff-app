/**
 * Server-side subscription promo resolution.
 * UI must display quotes from this module — never invent discounts client-side.
 */

import { prisma } from '@/lib/prisma';
import {
  calculatePromoSubscriptionPricing,
  isPlatformPromo,
  parsePlatformFixedCents,
} from '@/lib/promo-codes/discount-policy';
import { normalizeSubscriptionName } from '@/lib/stripe';
import {
  SUBSCRIPTION_PLAN_KEYS,
  normalizePromoCodeInput,
  type PromoPricingQuote,
  type SubscriptionPlanKey,
} from '@/lib/promo-codes/subscription-promo-shared';
import { buildPromoDurationQuote } from '@/lib/promo-codes/platform-promo-duration';

export type { PromoPricingQuote, SubscriptionPlanKey };
export {
  SUBSCRIPTION_PLAN_KEYS,
  extractPromoCodeFromBody,
  normalizePromoCodeInput,
} from '@/lib/promo-codes/subscription-promo-shared';

export type ResolvedSubscriptionPromo = {
  valid: true;
  promo: {
    id: string;
    code: string;
    name: string | null;
    discountSharePct: number;
    affiliateId: string | null;
    appliesTo: string;
    isPlatform: boolean;
    discountMode: PromoPricingQuote['mode'];
    fixedDiscountCents: number | null;
    hasL2: boolean;
    isSubAffiliate: boolean;
    maxRedemptions: number | null;
    redemptionCount: number;
    endsAt: Date | null;
    discountDurationCycles: number | null;
    resumesAtListPrice: boolean;
    endsAutomatically: boolean;
    postPromotionAction: 'CONTINUE' | 'END';
    durationLabel: string | null;
  };
  quotes: Record<SubscriptionPlanKey, PromoPricingQuote>;
};

export type ResolvePromoFailure = {
  valid: false;
  error: string;
  /** Dutch message when available (UI may prefer). */
  errorNl?: string;
  reason:
    | 'missing_code'
    | 'not_found'
    | 'disabled'
    | 'not_started'
    | 'expired'
    | 'max_redemptions'
    | 'max_redemptions_per_user'
    | 'server_error';
};

async function loadPlanBasePrices(): Promise<Record<SubscriptionPlanKey, number>> {
  const out: Record<SubscriptionPlanKey, number> = {
    BASIC: 3900,
    PRO: 9900,
    PREMIUM: 19900,
  };

  for (const plan of SUBSCRIPTION_PLAN_KEYS) {
    const planName = normalizeSubscriptionName(plan);
    const row =
      (await prisma.subscription.findFirst({
        where: { name: planName, isActive: true },
      })) ??
      (await prisma.subscription.findUnique({
        where: { id: plan.toLowerCase() },
      }));
    if (row?.priceCents != null) {
      out[plan] = row.priceCents;
    }
  }

  return out;
}

export type ResolveSubscriptionPromoOptions = {
  /** When set, enforces maxRedemptionsPerUser against active redemptions. */
  userId?: string | null;
};

export async function resolveSubscriptionPromo(
  rawCode: unknown,
  options: ResolveSubscriptionPromoOptions = {},
): Promise<ResolvedSubscriptionPromo | ResolvePromoFailure> {
  const code = normalizePromoCodeInput(rawCode);
  if (!code) {
    return { valid: false, error: 'Promo code is required', reason: 'missing_code' };
  }

  try {
    const promoCode = await prisma.promoCode.findUnique({
      where: { code },
      include: {
        affiliate: {
          include: { parentAffiliate: true },
        },
      },
    });

    if (!promoCode) {
      return { valid: false, error: 'Promo code not found', reason: 'not_found' };
    }
    if (promoCode.status !== 'ACTIVE') {
      return { valid: false, error: 'Promo code is disabled', reason: 'disabled' };
    }

    const now = new Date();
    if (promoCode.startsAt > now) {
      return { valid: false, error: 'Promo code is not yet active', reason: 'not_started' };
    }
    if (promoCode.endsAt && promoCode.endsAt < now) {
      return { valid: false, error: 'Promo code has expired', reason: 'expired' };
    }
    if (
      promoCode.maxRedemptions !== null &&
      promoCode.redemptionCount >= promoCode.maxRedemptions
    ) {
      return {
        valid: false,
        error: 'Promo code has reached maximum redemptions',
        errorNl: 'Deze promocode heeft het maximum aantal gebruikers bereikt.',
        reason: 'max_redemptions',
      };
    }

    if (options.userId && promoCode.maxRedemptionsPerUser != null) {
      const { evaluatePromoRedemptionLimits } = await import(
        '@/lib/promo-codes/redemption-limits'
      );
      const userActiveCount = await prisma.promoCodeRedemption.count({
        where: {
          promoCodeId: promoCode.id,
          userId: options.userId,
          status: { in: ['RESERVED', 'CONFIRMED'] },
        },
      });
      const decision = evaluatePromoRedemptionLimits({
        maxRedemptions: promoCode.maxRedemptions,
        maxRedemptionsPerUser: promoCode.maxRedemptionsPerUser,
        globalActiveCount: promoCode.redemptionCount,
        userActiveCount,
      });
      if (!decision.ok && decision.reason === 'max_redemptions_per_user') {
        return {
          valid: false,
          error: decision.error,
          errorNl: decision.errorNl,
          reason: 'max_redemptions_per_user',
        };
      }
    }

    const isSubAffiliate = !!promoCode.affiliate?.parentAffiliateId;
    const fixedDiscountCents = parsePlatformFixedCents(promoCode.appliesTo);
    const duration = buildPromoDurationQuote(
      (promoCode as { discountDurationCycles?: number | null }).discountDurationCycles,
      (promoCode as { postPromotionAction?: string | null }).postPromotionAction,
    );
    const bases = await loadPlanBasePrices();
    const quotes = {} as Record<SubscriptionPlanKey, PromoPricingQuote>;

    for (const plan of SUBSCRIPTION_PLAN_KEYS) {
      const pricing = calculatePromoSubscriptionPricing({
        basePriceCents: bases[plan],
        discountSharePct: promoCode.discountSharePct,
        affiliateId: promoCode.affiliateId,
        appliesTo: promoCode.appliesTo,
        isSubAffiliate,
      });
      quotes[plan] = {
        plan,
        basePriceCents: bases[plan],
        discountCents: pricing.discountCents,
        finalPriceCents: pricing.finalPriceCents,
        currency: 'eur',
        mode: pricing.mode,
        isPlatform: pricing.isPlatform,
        discountDurationCycles: duration.discountDurationCycles,
        resumesAtListPrice: duration.resumesAtListPrice,
        endsAutomatically: duration.endsAutomatically,
        postPromotionAction: duration.postPromotionAction,
      };
    }

    const sample = quotes.BASIC;
    return {
      valid: true,
      promo: {
        id: promoCode.id,
        code: promoCode.code,
        name: (promoCode as { name?: string | null }).name ?? null,
        discountSharePct: promoCode.discountSharePct,
        affiliateId: promoCode.affiliateId,
        appliesTo: promoCode.appliesTo,
        isPlatform: isPlatformPromo(promoCode),
        discountMode: sample.mode,
        fixedDiscountCents,
        hasL2: !!promoCode.affiliate?.parentAffiliate,
        isSubAffiliate,
        maxRedemptions: promoCode.maxRedemptions,
        redemptionCount: promoCode.redemptionCount,
        endsAt: promoCode.endsAt,
        discountDurationCycles: duration.discountDurationCycles,
        resumesAtListPrice: duration.resumesAtListPrice,
        endsAutomatically: duration.endsAutomatically,
        postPromotionAction: duration.postPromotionAction,
        durationLabel: duration.durationLabel,
      },
      quotes,
    };
  } catch (error) {
    console.error('[resolveSubscriptionPromo]', error);
    return {
      valid: false,
      error: 'Failed to validate promo code',
      reason: 'server_error',
    };
  }
}
