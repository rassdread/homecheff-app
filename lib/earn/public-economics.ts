/**
 * Public-facing HomeCheff earning economics — Stage 1 SoT locked values.
 *
 * Marketplace numbers import production calculation constants where possible.
 * Growth/Studio prices are audited against those products' production catalogs (Stage 1).
 *
 * DO NOT invent rates. DO NOT publish stale 25%-per-side order allocator values.
 */

import { DEFAULT_PLATFORM_FEE_PERCENT } from '@/lib/fees';
import { MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE } from '@/lib/marketplace-affiliate-pool';
import {
  ATTRIBUTION_WINDOW_DAYS,
  COOKIE_TTL_DAYS,
  LEDGER_PENDING_DAYS,
  MIN_PAYOUT_AMOUNT_CENTS,
  AFFILIATE_BUSINESS_COMMISSION_PCT,
  SUB_AFFILIATE_BUSINESS_COMMISSION_PCT,
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT,
} from '@/lib/affiliate-config';
import { PRICING_TIERS } from '@/lib/pricing';

/** Seller Checkout platform fees (% of product seller gross). */
export const PUBLIC_MARKETPLACE_SELLER_FEES = {
  individual: {
    percent: DEFAULT_PLATFORM_FEE_PERCENT,
    monthlyEur: null as number | null,
  },
  basic: {
    percent: PRICING_TIERS.BUSINESS_BASIC.feePercentage,
    monthlyEur: PRICING_TIERS.BUSINESS_BASIC.monthlyFee,
  },
  pro: {
    percent: PRICING_TIERS.BUSINESS_PRO.feePercentage,
    monthlyEur: PRICING_TIERS.BUSINESS_PRO.monthlyFee,
  },
  premium: {
    percent: PRICING_TIERS.BUSINESS_PREMIUM.feePercentage,
    monthlyEur: PRICING_TIERS.BUSINESS_PREMIUM.monthlyFee,
  },
} as const;

export const PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT = DEFAULT_PLATFORM_FEE_PERCENT;

export const PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE =
  MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE;

export const PUBLIC_MAIN_PERCENT_OF_ELIGIBLE = Math.round(
  PARENT_AFFILIATE_BUSINESS_COMMISSION_PCT * 100,
);
export const PUBLIC_SUB_PERCENT_OF_ELIGIBLE = Math.round(
  SUB_AFFILIATE_BUSINESS_COMMISSION_PCT * 100,
);
export const PUBLIC_DIRECT_PERCENT_OF_ELIGIBLE = Math.round(
  AFFILIATE_BUSINESS_COMMISSION_PCT * 100,
);

export const PUBLIC_ATTRIBUTION_COOKIE_DAYS = COOKIE_TTL_DAYS;
export const PUBLIC_MARKETPLACE_REVENUE_WINDOW_DAYS = ATTRIBUTION_WINDOW_DAYS;
export const PUBLIC_LEDGER_PENDING_DAYS = LEDGER_PENDING_DAYS;
export const PUBLIC_MARKETPLACE_MIN_PAYOUT_EUR = MIN_PAYOUT_AMOUNT_CENTS / 100;

export const PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT = 12;

/** Growth monthly prices ex-VAT — Stage 1 (homecheff-leads PLAN_CARD_COPY). */
export const PUBLIC_GROWTH_PLANS = [
  { key: 'free', monthlyEurExVat: 0 },
  { key: 'starter', monthlyEurExVat: 39 },
  { key: 'pro', monthlyEurExVat: 79 },
  { key: 'business', monthlyEurExVat: 199 },
  { key: 'enterprise', monthlyEurExVat: 399 },
] as const;

export const PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT = 50;
export const PUBLIC_GROWTH_COMMISSION_MONTHS = 12;

/** Studio — live studio.homecheff.eu/api/billing/catalog CURRENT_NL_B2C. */
export const PUBLIC_STUDIO_PLANS = [
  { key: 'creator', monthlyEur: 15, yearlyEur: 150, monthlyHc: 900 },
  { key: 'pro', monthlyEur: 29, yearlyEur: 290, monthlyHc: 1800 },
  { key: 'studio', monthlyEur: 79, yearlyEur: 790, monthlyHc: 5000 },
] as const;

export const PUBLIC_STUDIO_PACKS = [
  { priceEur: 4.99, hc: 250 },
  { priceEur: 9.99, hc: 500 },
  { priceEur: 19.99, hc: 1000 },
  { priceEur: 49.99, hc: 2500 },
] as const;

export const PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL = 50;
export const PUBLIC_STUDIO_COMMISSION_MONTHS = 12;

/**
 * UI architecture hint only — do not hardcode permanent MAIN public enrollment.
 * Presentation/copy must remain compatible with selective regions/campaigns/invites.
 */
export type MainAffiliateEnrollmentMode =
  | 'OPEN'
  | 'INVITE_ONLY'
  | 'CLOSED'
  | 'CAMPAIGN_ONLY';

/** Not rendered as a public entitlement claim. */
export const PUBLIC_MAIN_ENROLLMENT_PRESENTATION_DEFAULT: MainAffiliateEnrollmentMode =
  'CAMPAIGN_ONLY';

export function marketplaceExamplePoolCents(
  saleEur = 100,
  feePercent = PUBLIC_DEFAULT_INDIVIDUAL_FEE_PERCENT,
) {
  const feeCents = Math.round(saleEur * 100 * (feePercent / 100));
  const poolCents = Math.floor(
    (feeCents * PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE) / 100,
  );
  return {
    saleEur,
    feePercent,
    feeCents,
    poolCents,
    feeEur: feeCents / 100,
    poolEur: poolCents / 100,
  };
}

export function growthDirectExampleEur(monthlyEurExVat: number) {
  return {
    monthlyEurExVat,
    affiliateEur:
      (monthlyEurExVat * PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT) / 100,
  };
}

export function deliveryExamplePoolCents(deliveryGrossEur = 20) {
  const feeCents = Math.round(
    deliveryGrossEur * 100 * (PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT / 100),
  );
  const poolCents = Math.floor(
    (feeCents * PUBLIC_AFFILIATE_POOL_MAX_PERCENT_OF_FEE) / 100,
  );
  return {
    deliveryGrossEur,
    feePercent: PUBLIC_DELIVERY_PLATFORM_FEE_PERCENT,
    feeEur: feeCents / 100,
    poolEur: poolCents / 100,
  };
}
