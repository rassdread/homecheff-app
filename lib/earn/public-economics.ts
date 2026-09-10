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

function round2Public(n: number): number {
  return Math.round(n * 100) / 100;
}

export function growthDirectExampleEur(monthlyEurExVat: number) {
  return {
    monthlyEurExVat,
    affiliateEur: round2Public(
      (monthlyEurExVat * PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT) / 100,
    ),
  };
}

/** NL currency display — always two decimals with comma. */
export function formatPublicEurNl(eur: number): string {
  return eur.toLocaleString('nl-NL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPublicEurEn(eur: number): string {
  return eur.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPublicPercentNl(pct: number): string {
  return pct.toLocaleString('nl-NL', {
    minimumFractionDigits: Number.isInteger(pct) ? 0 : 1,
    maximumFractionDigits: 2,
  });
}

export function formatPublicPercentEn(pct: number): string {
  return pct.toLocaleString('en-GB', {
    minimumFractionDigits: Number.isInteger(pct) ? 0 : 1,
    maximumFractionDigits: 2,
  });
}

/**
 * Growth LIVE V1 economics (homecheff-leads process-growth-affiliate-commission):
 * commissionable base = paid subscription line ex-VAT (full net revenue).
 * Direct variable product cost is NOT deducted in V1.
 * Affiliate = 50% of that base; MAIN/SUB = 10%/40% of same base where applicable.
 */
export type GrowthPlanEconomics = {
  key: (typeof PUBLIC_GROWTH_PLANS)[number]['key'];
  label: string;
  priceEurExVat: number;
  /** Under live V1: equals price (full ex-VAT subscription is commissionable). */
  commissionableBaseEur: number;
  /** Share of price that is commissionable under V1 (100%). */
  commissionableBasePercentOfPrice: number;
  /** Direct/product cost deducted from commission base in V1. */
  directVariableCostEur: number;
  affiliatePercentOfBase: number;
  affiliateCommissionEur: number;
  recurring: true;
  commissionMonths: number;
};

const GROWTH_PLAN_LABELS: Record<
  Exclude<(typeof PUBLIC_GROWTH_PLANS)[number]['key'], 'free'>,
  string
> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
};

export function buildGrowthPlanEconomics(): GrowthPlanEconomics[] {
  return PUBLIC_GROWTH_PLANS.filter((p) => p.key !== 'free').map((p) => {
    const priceEurExVat = p.monthlyEurExVat;
    const affiliateCommissionEur = round2Public(
      (priceEurExVat * PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT) / 100,
    );
    return {
      key: p.key,
      label: GROWTH_PLAN_LABELS[p.key as keyof typeof GROWTH_PLAN_LABELS],
      priceEurExVat,
      commissionableBaseEur: priceEurExVat,
      commissionableBasePercentOfPrice: 100,
      directVariableCostEur: 0,
      affiliatePercentOfBase: PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT,
      affiliateCommissionEur,
      recurring: true as const,
      commissionMonths: PUBLIC_GROWTH_COMMISSION_MONTHS,
    };
  });
}

export const PUBLIC_GROWTH_PLAN_ECONOMICS = buildGrowthPlanEconomics();

/** Studio residual constants — mirrored from homecheff-leads ecosystem-platform-revenue.ts */
export const PUBLIC_STUDIO_VAT_RATE = 0.21;
export const PUBLIC_STUDIO_STRIPE_PCT = 0.014;
export const PUBLIC_STUDIO_STRIPE_FIXED_EUR = 0.25;
/** Min marketplace seller fee used for Model A HC treasury coverage (premium tier). */
export const PUBLIC_STUDIO_MODEL_A_MIN_FEE_BPS = 500;

function studioNetExVatFromGross(grossEur: number): number {
  return round2Public(grossEur / (1 + PUBLIC_STUDIO_VAT_RATE));
}

function studioEstimateStripeFeeEur(grossEur: number): number {
  return round2Public(
    grossEur * PUBLIC_STUDIO_STRIPE_PCT + PUBLIC_STUDIO_STRIPE_FIXED_EUR,
  );
}

function studioModelAMaxSellerExposureEur(hcGranted: number): number {
  const orderCents = Math.max(0, Math.floor(hcGranted));
  const platformFeeCents = Math.round(
    (orderCents * PUBLIC_STUDIO_MODEL_A_MIN_FEE_BPS) / 10_000,
  );
  return Math.max(0, orderCents - platformFeeCents) / 100;
}

/**
 * Studio eligible residual = net (ex VAT) − Stripe estimate − Model A HC treasury coverage.
 * Affiliate = 50% of that residual — not of list price.
 */
export type StudioPlanEconomics = {
  key: (typeof PUBLIC_STUDIO_PLANS)[number]['key'];
  label: string;
  priceEurGrossInclVat: number;
  includedHc: number;
  vatEur: number;
  netExVatEur: number;
  stripeFeeEur: number;
  hcTreasuryCoverageEur: number;
  /** Eligible / distributable platform residual (commissionable base). */
  distributableMarginEur: number;
  distributableMarginPercentOfGross: number;
  affiliatePercentOfResidual: number;
  affiliateCommissionEur: number;
  recurring: true;
  commissionMonths: number;
};

const STUDIO_PLAN_LABELS: Record<
  (typeof PUBLIC_STUDIO_PLANS)[number]['key'],
  string
> = {
  creator: 'Creator',
  pro: 'Pro',
  studio: 'Studio',
};

export function allocateStudioPlanEconomics(input: {
  key: (typeof PUBLIC_STUDIO_PLANS)[number]['key'];
  grossPriceEur: number;
  hcGranted: number;
}): StudioPlanEconomics {
  const netExVatEur = studioNetExVatFromGross(input.grossPriceEur);
  const vatEur = round2Public(input.grossPriceEur - netExVatEur);
  const stripeFeeEur = studioEstimateStripeFeeEur(input.grossPriceEur);
  const hcTreasuryCoverageEur = studioModelAMaxSellerExposureEur(input.hcGranted);
  const distributableMarginEur = round2Public(
    Math.max(0, netExVatEur - stripeFeeEur - hcTreasuryCoverageEur),
  );
  const affiliateCommissionEur = round2Public(
    (distributableMarginEur * PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL) /
      100,
  );
  const distributableMarginPercentOfGross =
    input.grossPriceEur > 0
      ? round2Public((distributableMarginEur / input.grossPriceEur) * 100)
      : 0;

  return {
    key: input.key,
    label: STUDIO_PLAN_LABELS[input.key],
    priceEurGrossInclVat: input.grossPriceEur,
    includedHc: input.hcGranted,
    vatEur,
    netExVatEur,
    stripeFeeEur,
    hcTreasuryCoverageEur,
    distributableMarginEur,
    distributableMarginPercentOfGross,
    affiliatePercentOfResidual: PUBLIC_STUDIO_AFFILIATE_PERCENT_OF_ELIGIBLE_RESIDUAL,
    affiliateCommissionEur,
    recurring: true,
    commissionMonths: PUBLIC_STUDIO_COMMISSION_MONTHS,
  };
}

export function buildStudioPlanEconomics(): StudioPlanEconomics[] {
  return PUBLIC_STUDIO_PLANS.map((p) =>
    allocateStudioPlanEconomics({
      key: p.key,
      grossPriceEur: p.monthlyEur,
      hcGranted: p.monthlyHc,
    }),
  );
}

export const PUBLIC_STUDIO_PLAN_ECONOMICS = buildStudioPlanEconomics();

export const PUBLIC_COMMISSION_BASE = {
  growth:
    'GROWTH_V1_PAID_SUBSCRIPTION_LINE_EX_VAT_FULL_NET — no HC/product cost deduction in live V1',
  studio:
    'STUDIO_ELIGIBLE_RESIDUAL = net_ex_VAT − Stripe_estimate − Model_A_HC_treasury_coverage',
} as const;

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
