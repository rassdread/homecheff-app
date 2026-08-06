/**
 * Promo discount policy — role-aware caps.
 *
 * Affiliates: commission-share discounts with configured maxima (unchanged).
 * Admins: may create platform promos at 0–100% of full price (or fixed amount).
 * Do NOT raise the global affiliate maximum to fix admin use-cases.
 */

import {
  MAIN_AFFILIATE_MAX_DISCOUNT_PCT,
  SUB_AFFILIATE_MAX_DISCOUNT_PCT,
  calculateSubscriptionPrice,
} from '@/lib/affiliate-config';

export const ADMIN_MAX_DISCOUNT_PCT = 100;
export const PLATFORM_PROMO_APPLIES_TO = 'PLATFORM' as const;
export const AFFILIATE_PROMO_APPLIES_TO = 'SUBSCRIPTION_ONLY' as const;

export type PromoDiscountActor = 'admin' | 'affiliate';

export type PlatformDiscountType = 'percent' | 'fixed';

export type PlatformPromoPurpose =
  | 'gift'
  | 'compensation'
  | 'launch'
  | 'testing'
  | 'marketing'
  | 'general';

/** Affiliate max (% of their commission share). Admin max = 100% of full price. */
export function resolveMaxDiscountPct(params: {
  actor: PromoDiscountActor;
  isSubAffiliate?: boolean;
}): number {
  if (params.actor === 'admin') {
    return ADMIN_MAX_DISCOUNT_PCT;
  }
  return params.isSubAffiliate
    ? SUB_AFFILIATE_MAX_DISCOUNT_PCT
    : MAIN_AFFILIATE_MAX_DISCOUNT_PCT;
}

export function assertDiscountWithinCap(params: {
  actor: PromoDiscountActor;
  discountPct: number;
  isSubAffiliate?: boolean;
}): { ok: true } | { ok: false; error: string; maxAllowed: number } {
  const maxAllowed = resolveMaxDiscountPct(params);
  if (params.discountPct < 0 || params.discountPct > 100) {
    return {
      ok: false,
      error: 'discountSharePct must be between 0 and 100',
      maxAllowed: ADMIN_MAX_DISCOUNT_PCT,
    };
  }
  if (params.actor === 'affiliate' && params.discountPct > maxAllowed) {
    const minCommissionPct = params.isSubAffiliate ? 25 : 20;
    return {
      ok: false,
      error: `Je moet altijd minimaal ${minCommissionPct}% van je commissie behouden. Maximum korting is ${maxAllowed}%`,
      maxAllowed,
    };
  }
  return { ok: true };
}

export function isPlatformPromo(promo: {
  affiliateId?: string | null;
  appliesTo?: string | null;
}): boolean {
  if (promo.appliesTo?.startsWith(PLATFORM_PROMO_APPLIES_TO)) return true;
  if (promo.appliesTo?.startsWith('PLATFORM_FIXED:')) return true;
  // Admin/platform rows: no affiliate owner (schema allows nullable affiliateId).
  return !promo.affiliateId;
}

/**
 * Platform admin discount: percent or fixed off the full subscription price.
 * No affiliate commission floor.
 */
export function calculatePlatformSubscriptionDiscount(
  basePriceCents: number,
  opts: {
    discountType: PlatformDiscountType;
    discountPercent?: number;
    discountCents?: number;
  },
): {
  discountCents: number;
  finalPriceCents: number;
  discountPercentApplied: number;
} {
  const base = Math.max(0, Math.round(basePriceCents));

  if (opts.discountType === 'fixed') {
    const raw = Math.max(0, Math.round(opts.discountCents ?? 0));
    const discountCents = Math.min(raw, base);
    return {
      discountCents,
      finalPriceCents: base - discountCents,
      discountPercentApplied: base > 0 ? Math.round((discountCents / base) * 100) : 0,
    };
  }

  const pct = Math.min(
    ADMIN_MAX_DISCOUNT_PCT,
    Math.max(0, Math.round(opts.discountPercent ?? 0)),
  );
  const discountCents = Math.round(base * (pct / 100));
  return {
    discountCents,
    finalPriceCents: base - discountCents,
    discountPercentApplied: pct,
  };
}

/**
 * Resolve subscription pricing for any promo code row.
 * Platform (admin) promos: % / fixed of full price.
 * Affiliate promos: existing commission-share math (caps applied inside).
 */
export function calculatePromoSubscriptionPricing(params: {
  basePriceCents: number;
  discountSharePct: number;
  affiliateId: string | null;
  appliesTo?: string | null;
  isSubAffiliate?: boolean;
  /** When appliesTo encodes fixed platform amount: PLATFORM_FIXED:<cents> */
  fixedDiscountCents?: number | null;
}): {
  discountCents: number;
  finalPriceCents: number;
  isPlatform: boolean;
  mode: 'platform_percent' | 'platform_fixed' | 'affiliate_commission_share';
} {
  const platform = isPlatformPromo({
    affiliateId: params.affiliateId,
    appliesTo: params.appliesTo,
  });

  if (platform) {
    const fixedFromApplies = parsePlatformFixedCents(params.appliesTo);
    const fixed = params.fixedDiscountCents ?? fixedFromApplies;
    if (fixed != null) {
      const result = calculatePlatformSubscriptionDiscount(params.basePriceCents, {
        discountType: 'fixed',
        discountCents: fixed,
      });
      return {
        discountCents: result.discountCents,
        finalPriceCents: result.finalPriceCents,
        isPlatform: true,
        mode: 'platform_fixed',
      };
    }
    const result = calculatePlatformSubscriptionDiscount(params.basePriceCents, {
      discountType: 'percent',
      discountPercent: params.discountSharePct,
    });
    return {
      discountCents: result.discountCents,
      finalPriceCents: result.finalPriceCents,
      isPlatform: true,
      mode: 'platform_percent',
    };
  }

  const pricing = calculateSubscriptionPrice(
    params.basePriceCents,
    params.discountSharePct,
    !!params.isSubAffiliate,
  );
  return {
    discountCents: pricing.discountCents,
    finalPriceCents: pricing.finalPriceCents,
    isPlatform: false,
    mode: 'affiliate_commission_share',
  };
}

export function encodePlatformFixedAppliesTo(discountCents: number): string {
  return `PLATFORM_FIXED:${Math.max(0, Math.round(discountCents))}`;
}

export function parsePlatformFixedCents(appliesTo?: string | null): number | null {
  if (!appliesTo?.startsWith('PLATFORM_FIXED:')) return null;
  const n = Number(appliesTo.slice('PLATFORM_FIXED:'.length));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
}

export function encodePlatformPercentAppliesTo(purpose?: PlatformPromoPurpose): string {
  const tag = purpose && purpose !== 'general' ? purpose : 'general';
  return `${PLATFORM_PROMO_APPLIES_TO}:${tag}`;
}
