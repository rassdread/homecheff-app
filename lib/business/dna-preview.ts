/**
 * Business DNA preview helpers — Phase 12C.
 * All preview, delta, and dashboard feature lists derive from getBusinessVisibilityProfile().
 */

import {
  getBusinessVisibilityProfile,
  listBusinessPlanIds,
  type BusinessPlanId,
  type BusinessVisibilityProfile,
  type FutureFeatureStatus,
} from './visibility-profile';

export type DnaPreviewFieldKind =
  | 'badge'
  | 'dots'
  | 'label'
  | 'status'
  | 'score'
  | 'locations';

export type DnaPreviewField = {
  labelKey: string;
  kind: DnaPreviewFieldKind;
  /** i18n key for text label values */
  textKey?: string;
  dots?: number;
  maxDots?: number;
  status?: FutureFeatureStatus;
  score?: number;
  locations?: number;
};

export type DnaFeatureItem = {
  key: string;
  comingSoon?: boolean;
};

const PLAN_ORDER: BusinessPlanId[] = listBusinessPlanIds();

function planRank(plan: BusinessPlanId): number {
  return PLAN_ORDER.indexOf(plan);
}

/** 0–100 visibility score from DNA — auditable, no fake metrics. */
export function computeVisibilityScore(profile: BusinessVisibilityProfile): number {
  const levelScore = profile.visibilityLevel * 18;
  const searchScore = profile.searchPriorityLevel * 6;
  const boostScore = Math.round(profile.rankingBoost * 200);
  const discoveryScore = Math.round((profile.discoveryBoost - 1) * 40);
  const bonus =
    (profile.verifiedBusiness ? 4 : 0) +
    (profile.regionalEligible ? 4 : 0) +
    (profile.homepageEligible ? 3 : 0) +
    (profile.homepageSpotlightEligible ? 3 : 0);
  return Math.min(100, levelScore + searchScore + boostScore + discoveryScore + bonus);
}

/** Live preview metric rows for subscription selector. */
export function buildLivePreviewFields(plan: BusinessPlanId): DnaPreviewField[] {
  const p = getBusinessVisibilityProfile(plan);
  return [
    {
      labelKey: 'business.dna.preview.badge',
      kind: 'badge',
      textKey: p.badge ? `business.plan.badge.${p.badge}` : 'business.dna.preview.noBadge',
    },
    {
      labelKey: 'business.dna.preview.visibilityLevel',
      kind: 'dots',
      dots: p.visibilityLevel,
      maxDots: 4,
    },
    {
      labelKey: 'business.dna.preview.discoveryLevel',
      kind: 'label',
      textKey: `business.dna.preview.discovery.${p.visibilityLevel}`,
    },
    {
      labelKey: 'business.dna.preview.searchPriority',
      kind: 'dots',
      dots: p.searchPriorityLevel,
      maxDots: 3,
    },
    {
      labelKey: 'business.dna.preview.analytics',
      kind: 'label',
      textKey: p.analyticsDisplayKey,
    },
    {
      labelKey: 'business.dna.preview.visibilityScore',
      kind: 'score',
      score: computeVisibilityScore(p),
    },
    {
      labelKey: 'business.dna.preview.homepage',
      kind: 'status',
      status: p.homepageSpotlightEligible
        ? 'included'
        : p.homepageEligible
          ? 'optional'
          : 'none',
    },
    {
      labelKey: 'business.dna.preview.regional',
      kind: 'status',
      status: p.regionalEligible ? 'included' : 'none',
    },
    {
      labelKey: 'business.dna.preview.websitePromotion',
      kind: 'status',
      status: p.websitePromotionStatus,
    },
    {
      labelKey: 'business.dna.preview.socialPromotion',
      kind: 'status',
      status: p.socialPromotionStatus,
    },
    {
      labelKey: 'business.dna.preview.locations',
      kind: 'locations',
      locations: p.multipleLocations,
    },
    {
      labelKey: 'business.dna.preview.aiMarketing',
      kind: 'status',
      status: p.futureAiMarketing ? 'future' : 'none',
    },
  ];
}

function pushIfChanged(
  out: DnaFeatureItem[],
  from: BusinessVisibilityProfile,
  to: BusinessVisibilityProfile,
  cond: boolean,
  key: string,
  comingSoon?: boolean,
) {
  if (cond && !out.some((x) => x.key === key)) {
    out.push({ key, comingSoon });
  }
}

/** Upgrade delta — only features that change between two plans. */
export function computeUpgradeDelta(
  fromPlan: BusinessPlanId,
  toPlan: BusinessPlanId,
): DnaFeatureItem[] {
  if (fromPlan === toPlan) return [];

  const from = getBusinessVisibilityProfile(fromPlan);
  const to = getBusinessVisibilityProfile(toPlan);
  const upgrading = planRank(toPlan) > planRank(fromPlan);
  if (!upgrading) return [];

  const out: DnaFeatureItem[] = [];

  pushIfChanged(out, from, to, !from.badge && !!to.badge, 'business.dna.delta.badge');
  pushIfChanged(
    out,
    from,
    to,
    to.visibilityLevel > from.visibilityLevel,
    'business.dna.delta.visibility',
  );
  pushIfChanged(
    out,
    from,
    to,
    to.searchPriorityLevel > from.searchPriorityLevel,
    'business.dna.delta.searchPriority',
  );
  pushIfChanged(
    out,
    from,
    to,
    to.rankingBoost > from.rankingBoost,
    'business.dna.delta.discoveryPriority',
  );
  pushIfChanged(
    out,
    from,
    to,
    to.analyticsDisplayKey !== from.analyticsDisplayKey,
    'business.dna.delta.analytics',
  );
  pushIfChanged(
    out,
    from,
    to,
    !from.verifiedBusiness && to.verifiedBusiness,
    'business.dna.delta.verified',
  );
  pushIfChanged(
    out,
    from,
    to,
    !from.localSearchPriority && to.localSearchPriority,
    'business.dna.delta.nearbyVisibility',
  );
  pushIfChanged(
    out,
    from,
    to,
    !from.regionalEligible && to.regionalEligible,
    'business.dna.delta.regional',
  );
  pushIfChanged(
    out,
    from,
    to,
    !from.homepageEligible && to.homepageEligible,
    'business.dna.delta.homepageEligible',
  );
  pushIfChanged(
    out,
    from,
    to,
    !from.homepageSpotlightEligible && to.homepageSpotlightEligible,
    'business.dna.delta.homepageSpotlight',
  );
  pushIfChanged(
    out,
    from,
    to,
    to.multipleLocations > from.multipleLocations,
    'business.dna.delta.locations',
  );
  pushIfChanged(
    out,
    from,
    to,
    from.websitePromotionStatus === 'none' && to.websitePromotionStatus === 'ready',
    'business.dna.delta.websiteReady',
    true,
  );
  pushIfChanged(
    out,
    from,
    to,
    from.socialPromotionStatus === 'none' && to.socialPromotionStatus === 'ready',
    'business.dna.delta.socialReady',
    true,
  );
  pushIfChanged(
    out,
    from,
    to,
    !from.futureAiMarketing && to.futureAiMarketing,
    'business.dna.delta.aiMarketing',
    true,
  );
  pushIfChanged(
    out,
    from,
    to,
    !from.campaignBuilder && to.campaignBuilder,
    'business.dna.delta.campaignBuilder',
    true,
  );
  pushIfChanged(
    out,
    from,
    to,
    !from.regionalCampaignEligible && to.regionalCampaignEligible,
    'business.dna.delta.regionalCampaigns',
    true,
  );
  pushIfChanged(
    out,
    from,
    to,
    to.commissionPercent < from.commissionPercent,
    'business.dna.delta.commission',
  );

  return out;
}

/** Immediate benefits when activating a plan (vs individual). */
export function listImmediateUpgradeBenefits(plan: BusinessPlanId): DnaFeatureItem[] {
  return computeUpgradeDelta('individual', plan);
}

export function listUnlockedFeatureKeys(plan: BusinessPlanId): string[] {
  const p = getBusinessVisibilityProfile(plan);
  const keys: string[] = [];
  if (p.badge) keys.push('business.dna.unlocked.badge');
  if (p.boostEligible) keys.push('business.dna.unlocked.discoveryBoost');
  if (p.localSearchPriority) keys.push('business.dna.unlocked.localSearch');
  if (p.verifiedBusiness) keys.push('business.dna.unlocked.verified');
  if (p.categorySpotlightEligible) keys.push('business.dna.unlocked.category');
  if (p.regionalEligible) keys.push('business.dna.unlocked.regional');
  if (p.homepageEligible) keys.push('business.dna.unlocked.homepage');
  if (p.homepageSpotlightEligible) keys.push('business.dna.unlocked.spotlight');
  if (p.premiumAnalytics) keys.push('business.dna.unlocked.premiumAnalytics');
  if (p.multipleLocations > 1) keys.push('business.dna.unlocked.multiLocation');
  keys.push(p.analyticsDisplayKey);
  return keys;
}

/** Features on higher plans not yet available on current plan. */
export function listLockedFeatureKeys(plan: BusinessPlanId): string[] {
  const current = getBusinessVisibilityProfile(plan);
  const locked = new Set<string>();

  for (const higher of PLAN_ORDER) {
    if (planRank(higher) <= planRank(plan)) continue;
    for (const item of computeUpgradeDelta(plan, higher)) {
      if (!item.comingSoon) locked.add(item.key);
    }
  }

  // Explicit locked growth items not in current plan
  if (!current.campaignBuilder) locked.add('business.dna.locked.campaignBuilder');
  if (!current.regionalCampaignEligible) locked.add('business.dna.locked.regionalCampaigns');
  if (current.websitePromotionStatus === 'none') locked.add('business.dna.locked.website');
  if (current.socialPromotionStatus === 'none') locked.add('business.dna.locked.social');
  if (!current.futureAiMarketing) locked.add('business.dna.locked.aiMarketing');

  return [...locked];
}

/** Coming-soon / ready-future features for current plan. */
export function listComingSoonFeatureKeys(plan: BusinessPlanId): string[] {
  const p = getBusinessVisibilityProfile(plan);
  const keys: string[] = [];
  if (p.websitePromotionStatus === 'ready') keys.push('business.dna.coming.website');
  if (p.socialPromotionStatus === 'ready') keys.push('business.dna.coming.social');
  if (p.futureAiMarketing) keys.push('business.dna.coming.aiMarketing');
  if (p.campaignBuilder) keys.push('business.dna.coming.campaignBuilder');
  if (p.regionalCampaignEligible) keys.push('business.dna.coming.regionalCampaigns');
  if (p.futureMarketplaceCampaigns) keys.push('business.dna.coming.marketplaceCampaigns');
  if (p.futureBusinessTools) keys.push('business.dna.coming.businessTools');
  return keys;
}

export function nextUpgradePlan(plan: BusinessPlanId): BusinessPlanId | null {
  const idx = planRank(plan);
  if (idx < 0 || idx >= PLAN_ORDER.length - 1) return null;
  const next = PLAN_ORDER[idx + 1];
  return next === 'individual' ? 'basic' : next;
}

export function growthStatusLabelKey(plan: BusinessPlanId): string {
  const p = getBusinessVisibilityProfile(plan);
  if (p.plan === 'premium') return 'business.dna.growthStatus.max';
  if (p.boostEligible && p.regionalEligible) return 'business.dna.growthStatus.strong';
  if (p.boostEligible) return 'business.dna.growthStatus.growing';
  return 'business.dna.growthStatus.starter';
}
