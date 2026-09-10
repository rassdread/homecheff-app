/**
 * Public-facing HomeCheff earning economics — Stage 1 SoT locked values.
 *
 * Marketplace numbers import production calculation constants where possible.
 * Growth/Studio prices are audited against those products' production catalogs.
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

/** Growth monthly prices ex-VAT — homecheff-leads PLAN_CARD_COPY. */
export const PUBLIC_GROWTH_PLANS = [
  { key: 'free', monthlyEurExVat: 0, monthlyHc: 0, monthlyLeadQuota: 0 },
  { key: 'starter', monthlyEurExVat: 39, monthlyHc: 750, monthlyLeadQuota: 175 },
  { key: 'pro', monthlyEurExVat: 79, monthlyHc: 2800, monthlyLeadQuota: 850 },
  { key: 'business', monthlyEurExVat: 199, monthlyHc: 10000, monthlyLeadQuota: 3200 },
  { key: 'enterprise', monthlyEurExVat: 399, monthlyHc: 18000, monthlyLeadQuota: 5500 },
] as const;

/** 1 HC = €0.01 face — Growth V2 affiliate reserve. */
export const PUBLIC_GROWTH_HC_FACE_EUR = 0.01;

export const PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT = 50;
export const PUBLIC_GROWTH_COMMISSION_MONTHS = 12;
export const PUBLIC_GROWTH_CALCULATION_VERSION =
  'GROWTH_AFFILIATE_V2_RESIDUAL_HC' as const;
export const PUBLIC_GROWTH_ROLLOVER_MULTIPLIER = 3 as const;

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

/**
 * Public claim gate for Growth HC cross-platform marketing.
 * Only advertise Studio/Marketplace when Production cross-platform is independently verified PASS.
 * Verified 2026-09-10: Production flags activated + Growth wallet API recognizes
 * Growth-paid MARKETPLACE_ELIGIBLE lots for Studio + Marketplace eligibility.
 */
export const PUBLIC_GROWTH_HC_CROSS_PLATFORM_CLAIM: 'GROWTH_ONLY' | 'ECOSYSTEM' =
  'ECOSYSTEM';

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

/** @deprecated V1 gross example — prefer growthV2AffiliateCommissionCents / plan economics. */
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
 * Growth LIVE V2 residual-HC economics (homecheff-leads):
 * COMMISSIONABLE = max(0, NET_EX_VAT − INCLUDED_HC × €0.01)
 * Affiliate = 50% of that residual; MAIN/SUB = 10%/40% of same residual.
 * Lead quotas remain separate (175/850/3200/5500) and are NOT HC/3.
 */
export type GrowthPlanEconomics = {
  key: (typeof PUBLIC_GROWTH_PLANS)[number]['key'];
  label: string;
  priceEurExVat: number;
  includedHc: number;
  monthlyLeadQuota: number;
  hcReserveEur: number;
  /** Residual after full HC face reserve. */
  commissionableBaseEur: number;
  commissionableBasePercentOfPrice: number;
  /** HC face reserved from commission base. */
  directVariableCostEur: number;
  affiliatePercentOfBase: number;
  affiliateCommissionEur: number;
  recurring: true;
  commissionMonths: number;
  calculationVersion: typeof PUBLIC_GROWTH_CALCULATION_VERSION;
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

/** Cent-exact V2 residual: floor((netCents − hcFaceCents) × 5000 / 10000). */
export function growthV2AffiliateCommissionCents(
  netExVatCents: number,
  includedHc: number,
): {
  netExVatCents: number;
  hcReserveCents: number;
  commissionableCents: number;
  affiliateCommissionCents: number;
} {
  const net = Math.max(0, Math.floor(netExVatCents));
  const hcReserveCents = Math.max(0, Math.floor(includedHc));
  const commissionableCents = Math.max(0, net - hcReserveCents);
  const affiliateCommissionCents = Math.floor((commissionableCents * 5000) / 10_000);
  return { netExVatCents: net, hcReserveCents, commissionableCents, affiliateCommissionCents };
}

export function buildGrowthPlanEconomics(): GrowthPlanEconomics[] {
  return PUBLIC_GROWTH_PLANS.filter((p) => p.key !== 'free').map((p) => {
    const priceEurExVat = p.monthlyEurExVat;
    const netCents = Math.round(priceEurExVat * 100);
    const snap = growthV2AffiliateCommissionCents(netCents, p.monthlyHc);
    const hcReserveEur = snap.hcReserveCents / 100;
    const commissionableBaseEur = snap.commissionableCents / 100;
    const affiliateCommissionEur = snap.affiliateCommissionCents / 100;
    const commissionableBasePercentOfPrice =
      priceEurExVat > 0
        ? round2Public((commissionableBaseEur / priceEurExVat) * 100)
        : 0;
    return {
      key: p.key,
      label: GROWTH_PLAN_LABELS[p.key as keyof typeof GROWTH_PLAN_LABELS],
      priceEurExVat,
      includedHc: p.monthlyHc,
      monthlyLeadQuota: p.monthlyLeadQuota,
      hcReserveEur,
      commissionableBaseEur,
      commissionableBasePercentOfPrice,
      directVariableCostEur: hcReserveEur,
      affiliatePercentOfBase: PUBLIC_GROWTH_DIRECT_AFFILIATE_PERCENT,
      affiliateCommissionEur,
      recurring: true as const,
      commissionMonths: PUBLIC_GROWTH_COMMISSION_MONTHS,
      calculationVersion: PUBLIC_GROWTH_CALCULATION_VERSION,
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
    'GROWTH_V2_RESIDUAL_HC = max(0, NET_EX_VAT − INCLUDED_HC×€0.01); affiliate 50% of residual',
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
