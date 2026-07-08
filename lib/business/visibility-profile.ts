/**
 * Business DNA Profile — Phase 12A/12B SSOT.
 *
 * Single source of truth for subscription plan benefits:
 * commission, visibility, ranking, badges, analytics, permissions, and future flags.
 *
 * Every ranking, badge, analytics gate, affiliate fee context, and subscription UI
 * must read from getBusinessVisibilityProfile(). Do not scatter plan checks.
 */

export type BusinessPlanId = 'individual' | 'basic' | 'pro' | 'premium';

export type AnalyticsLevel = 'none' | 'basic' | 'pro' | 'premium';

export type BusinessBadgeKind = 'business' | 'pro' | 'premium' | null;

export type SupportLevel = 'standard' | 'business' | 'priority' | 'premium';

export type FutureFeatureStatus = 'none' | 'ready' | 'optional' | 'future' | 'included';

/** Max additive ranking boost from paid visibility (baseline profile). */
export const BUSINESS_VISIBILITY_RANK_CAP = 0.08;

/** Raw plan config stored in PLAN_CONFIG. */
type BusinessPlanConfig = {
  feeBps: number;
  feePercent: number;
  monthlyPriceCents: number;
  purposeKey: string;
  visibilityMultiplier: number;
  feedBoost: number;
  searchBoost: number;
  categoryBoost: number;
  nearbyBoost: number;
  recommendationBoost: number;
  visibilityLevel: 1 | 2 | 3 | 4;
  searchPriorityLevel: 0 | 1 | 2 | 3;
  homepageEligible: boolean;
  homepageSpotlightEligible: boolean;
  regionalEligible: boolean;
  categorySpotlightEligible: boolean;
  trendingEligible: boolean;
  businessBadge: BusinessBadgeKind;
  premiumBadge: boolean;
  analyticsLevel: AnalyticsLevel;
  analyticsDisplayKey: string;
  websiteVisible: boolean;
  socialsVisible: boolean;
  websitePromotionStatus: FutureFeatureStatus;
  socialPromotionStatus: FutureFeatureStatus;
  campaignEligible: boolean;
  regionalCampaignEligible: boolean;
  maxLocations: number;
  prioritySupport: SupportLevel;
  boostEligible: boolean;
  verifiedBusiness: boolean;
  premiumAnalytics: boolean;
  localSearchPriority: boolean;
  futureAiMarketing: boolean;
  futureMarketplaceCampaigns: boolean;
  futureBusinessTools: boolean;
  futureBusinessApi: boolean;
  futureFranchiseSupport: boolean;
};

/**
 * Complete Business DNA profile — returned by getBusinessVisibilityProfile().
 * Includes legacy field names (feePercent, feeBps) for backwards compatibility.
 */
export type BusinessVisibilityProfile = BusinessPlanConfig & {
  plan: BusinessPlanId;
  /** Alias for feePercent — commission charged on marketplace sales. */
  commissionPercent: number;
  /** Capped sum of ranking boost weights (never exceeds BUSINESS_VISIBILITY_RANK_CAP). */
  rankingBoost: number;
  /** Overall discovery multiplier (1 = organic). */
  discoveryBoost: number;
  /** Alias for businessBadge. */
  badge: BusinessBadgeKind;
  /** Alias for socialsVisible — future social promotion eligibility. */
  socialPromotion: boolean;
  /** Alias for maxLocations. */
  multipleLocations: number;
  /** Alias for campaignEligible. */
  campaignBuilder: boolean;
  /** Legacy alias — true when maxLocations > 1. */
  multipleLocationsEligible: boolean;
};

export type SellerSubscriptionInput = {
  subscriptionId?: string | null;
  subscriptionValidUntil?: Date | string | null;
  Subscription?: {
    name?: string | null;
    feeBps?: number | null;
  } | null;
};

const PLAN_CONFIG: Record<BusinessPlanId, BusinessPlanConfig> = {
  individual: {
    feeBps: 1200,
    feePercent: 12,
    monthlyPriceCents: 0,
    purposeKey: 'business.dna.purpose.individual',
    visibilityMultiplier: 1,
    feedBoost: 0,
    searchBoost: 0,
    categoryBoost: 0,
    nearbyBoost: 0,
    recommendationBoost: 0,
    visibilityLevel: 1,
    searchPriorityLevel: 0,
    homepageEligible: false,
    homepageSpotlightEligible: false,
    regionalEligible: false,
    categorySpotlightEligible: false,
    trendingEligible: false,
    businessBadge: null,
    premiumBadge: false,
    analyticsLevel: 'basic',
    analyticsDisplayKey: 'business.dna.analytics.basic',
    websiteVisible: false,
    socialsVisible: false,
    websitePromotionStatus: 'none',
    socialPromotionStatus: 'none',
    campaignEligible: false,
    regionalCampaignEligible: false,
    maxLocations: 1,
    prioritySupport: 'standard',
    boostEligible: false,
    verifiedBusiness: false,
    premiumAnalytics: false,
    localSearchPriority: false,
    futureAiMarketing: false,
    futureMarketplaceCampaigns: false,
    futureBusinessTools: false,
    futureBusinessApi: false,
    futureFranchiseSupport: false,
  },
  basic: {
    feeBps: 900,
    feePercent: 9,
    monthlyPriceCents: 3900,
    purposeKey: 'business.dna.purpose.basic',
    visibilityMultiplier: 1.05,
    feedBoost: 0.02,
    searchBoost: 0.015,
    categoryBoost: 0.01,
    nearbyBoost: 0.01,
    recommendationBoost: 0.01,
    visibilityLevel: 2,
    searchPriorityLevel: 1,
    homepageEligible: false,
    homepageSpotlightEligible: false,
    regionalEligible: false,
    categorySpotlightEligible: false,
    trendingEligible: false,
    businessBadge: 'business',
    premiumBadge: false,
    analyticsLevel: 'basic',
    analyticsDisplayKey: 'business.dna.analytics.business',
    websiteVisible: false,
    socialsVisible: false,
    websitePromotionStatus: 'none',
    socialPromotionStatus: 'none',
    campaignEligible: false,
    regionalCampaignEligible: false,
    maxLocations: 1,
    prioritySupport: 'business',
    boostEligible: true,
    verifiedBusiness: true,
    premiumAnalytics: false,
    localSearchPriority: true,
    futureAiMarketing: false,
    futureMarketplaceCampaigns: false,
    futureBusinessTools: false,
    futureBusinessApi: false,
    futureFranchiseSupport: false,
  },
  pro: {
    feeBps: 700,
    feePercent: 7,
    monthlyPriceCents: 9900,
    purposeKey: 'business.dna.purpose.pro',
    visibilityMultiplier: 1.1,
    feedBoost: 0.04,
    searchBoost: 0.03,
    categoryBoost: 0.03,
    nearbyBoost: 0.02,
    recommendationBoost: 0.03,
    visibilityLevel: 3,
    searchPriorityLevel: 2,
    homepageEligible: true,
    homepageSpotlightEligible: false,
    regionalEligible: true,
    categorySpotlightEligible: true,
    trendingEligible: true,
    businessBadge: 'pro',
    premiumBadge: false,
    analyticsLevel: 'pro',
    analyticsDisplayKey: 'business.dna.analytics.advanced',
    websiteVisible: true,
    socialsVisible: false,
    websitePromotionStatus: 'ready',
    socialPromotionStatus: 'none',
    campaignEligible: true,
    regionalCampaignEligible: false,
    maxLocations: 2,
    prioritySupport: 'priority',
    boostEligible: true,
    verifiedBusiness: true,
    premiumAnalytics: false,
    localSearchPriority: true,
    futureAiMarketing: false,
    futureMarketplaceCampaigns: true,
    futureBusinessTools: true,
    futureBusinessApi: false,
    futureFranchiseSupport: false,
  },
  premium: {
    feeBps: 500,
    feePercent: 5,
    monthlyPriceCents: 19900,
    purposeKey: 'business.dna.purpose.premium',
    visibilityMultiplier: 1.15,
    feedBoost: 0.06,
    searchBoost: 0.04,
    categoryBoost: 0.04,
    nearbyBoost: 0.03,
    recommendationBoost: 0.04,
    visibilityLevel: 4,
    searchPriorityLevel: 3,
    homepageEligible: true,
    homepageSpotlightEligible: true,
    regionalEligible: true,
    categorySpotlightEligible: true,
    trendingEligible: true,
    businessBadge: 'premium',
    premiumBadge: true,
    analyticsLevel: 'premium',
    analyticsDisplayKey: 'business.dna.analytics.premium',
    websiteVisible: true,
    socialsVisible: true,
    websitePromotionStatus: 'ready',
    socialPromotionStatus: 'ready',
    campaignEligible: true,
    regionalCampaignEligible: true,
    maxLocations: 99,
    prioritySupport: 'premium',
    boostEligible: true,
    verifiedBusiness: true,
    premiumAnalytics: true,
    localSearchPriority: true,
    futureAiMarketing: true,
    futureMarketplaceCampaigns: true,
    futureBusinessTools: true,
    futureBusinessApi: true,
    futureFranchiseSupport: true,
  },
};

const NAME_TO_PLAN: Record<string, BusinessPlanId> = {
  basic: 'basic',
  pro: 'pro',
  premium: 'premium',
};

/** Legacy fee bps from pre-12A plans — map to current plan ids. */
const LEGACY_FEE_BPS_TO_PLAN: Record<number, BusinessPlanId> = {
  700: 'basic',
  400: 'pro',
  200: 'premium',
};

const CURRENT_FEE_BPS_TO_PLAN: Record<number, BusinessPlanId> = {
  1200: 'individual',
  900: 'basic',
  700: 'pro',
  500: 'premium',
};

function isSubscriptionActive(validUntil?: Date | string | null): boolean {
  if (!validUntil) return false;
  const ts = validUntil instanceof Date ? validUntil.getTime() : Date.parse(String(validUntil));
  return Number.isFinite(ts) && ts > Date.now();
}

function computeRankingBoost(config: BusinessPlanConfig): number {
  const raw =
    config.feedBoost +
    config.searchBoost +
    config.categoryBoost +
    config.nearbyBoost +
    config.recommendationBoost;
  return Math.min(raw, BUSINESS_VISIBILITY_RANK_CAP);
}

function toBusinessDnaProfile(plan: BusinessPlanId): BusinessVisibilityProfile {
  const config = PLAN_CONFIG[plan] ?? PLAN_CONFIG.individual;
  return {
    plan,
    ...config,
    commissionPercent: config.feePercent,
    rankingBoost: computeRankingBoost(config),
    discoveryBoost: config.visibilityMultiplier,
    badge: config.businessBadge,
    socialPromotion: config.socialsVisible,
    multipleLocations: config.maxLocations,
    campaignBuilder: config.campaignEligible,
    multipleLocationsEligible: config.maxLocations > 1,
  };
}

/**
 * Resolve plan id from subscription name or fee bps.
 * Prefers active subscription; falls back to individual.
 */
export function resolveBusinessPlanId(input: SellerSubscriptionInput): BusinessPlanId {
  const active =
    Boolean(input.subscriptionId) && isSubscriptionActive(input.subscriptionValidUntil);
  if (!active) return 'individual';

  const name = input.Subscription?.name?.trim().toLowerCase();
  if (name && NAME_TO_PLAN[name]) return NAME_TO_PLAN[name];

  const feeBps = input.Subscription?.feeBps;
  if (typeof feeBps === 'number') {
    if (CURRENT_FEE_BPS_TO_PLAN[feeBps]) return CURRENT_FEE_BPS_TO_PLAN[feeBps];
    if (LEGACY_FEE_BPS_TO_PLAN[feeBps]) return LEGACY_FEE_BPS_TO_PLAN[feeBps];
  }

  return 'individual';
}

/** Business DNA SSOT — use for all plan benefit decisions. */
export function getBusinessVisibilityProfile(
  input: SellerSubscriptionInput | BusinessPlanId,
): BusinessVisibilityProfile {
  const plan = typeof input === 'string' ? input : resolveBusinessPlanId(input);
  return toBusinessDnaProfile(plan);
}

/** Alias — same SSOT entry point. */
export const getBusinessDnaProfile = getBusinessVisibilityProfile;

/** Platform fee percent for checkout/webhook — uses SSOT. */
export function resolvePlatformFeePercent(input: SellerSubscriptionInput): number {
  return getBusinessVisibilityProfile(input).commissionPercent;
}

/** Platform fee basis points for Prisma / ledger. */
export function resolvePlatformFeeBps(input: SellerSubscriptionInput): number {
  return getBusinessVisibilityProfile(input).feeBps;
}

export function businessPlanLabelKey(plan: BusinessPlanId): string | null {
  switch (plan) {
    case 'basic':
      return 'business.plan.badge.business';
    case 'pro':
      return 'business.plan.badge.pro';
    case 'premium':
      return 'business.plan.badge.premium';
    default:
      return null;
  }
}

export function listBusinessPlanIds(): BusinessPlanId[] {
  return ['individual', 'basic', 'pro', 'premium'];
}

/** Paid business plans offered via Stripe Billing on /sell. */
export const STRIPE_BUSINESS_PLAN_IDS = ['basic', 'pro', 'premium'] as const satisfies readonly BusinessPlanId[];

export type StripeBusinessPlanId = (typeof STRIPE_BUSINESS_PLAN_IDS)[number];

export function stripePlanKeyToBusinessPlanId(planKey: string): BusinessPlanId | null {
  const key = planKey.trim().toLowerCase();
  if (key === 'basic' || key === 'pro' || key === 'premium') return key;
  return null;
}
