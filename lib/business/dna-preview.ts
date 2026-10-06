/**
 * Business DNA preview helpers — Phase 12C.
 * All preview, delta, and dashboard feature lists derive from getBusinessVisibilityProfile().
 */

import { growthBenefitKeysForPlan } from './subscription-comparison';
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

/** 0–100 profile strength score — informational only; does NOT reflect live feed ranking. */
export function computeVisibilityScore(profile: BusinessVisibilityProfile): number {
  const levelScore = profile.visibilityLevel * 12;
  const searchScore = profile.searchPriorityLevel * 4;
  const bonus =
    (profile.verifiedBusiness ? 8 : 0) +
    (profile.badge ? 6 : 0) +
    (profile.regionalEligible ? 4 : 0) +
    (profile.homepageEligible ? 3 : 0) +
    (profile.homepageSpotlightEligible ? 3 : 0) +
    (profile.premiumAnalytics ? 4 : 0);
  return Math.min(100, levelScore + searchScore + bonus);
}

/**
 * Preview rows a customer may see.
 * Homepage, regional, search-priority and future promotion flags are not included.
 */
export function buildLivePreviewFields(plan: BusinessPlanId): DnaPreviewField[] {
  const p = getBusinessVisibilityProfile(plan);
  const fields: DnaPreviewField[] = [
    {
      labelKey: 'business.dna.preview.badge',
      kind: 'badge',
      textKey: p.badge ? `business.plan.badge.${p.badge}` : 'business.dna.preview.noBadge',
    },
    {
      labelKey: 'business.dna.compare.commission',
      kind: 'label',
      textKey: 'business.dna.compare.commission',
    },
  ];
  const sponsored = growthBenefitKeysForPlan(plan)[0];
  if (sponsored) {
    fields.push({
      labelKey: 'business.dna.compare.sponsored',
      kind: 'label',
      textKey: sponsored,
    });
  }
  return fields;
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
  const fromSponsored = growthBenefitKeysForPlan(fromPlan)[0];
  const toSponsored = growthBenefitKeysForPlan(toPlan)[0];
  if (toSponsored && toSponsored !== fromSponsored) {
    out.push({ key: toSponsored });
  }
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
  const keys = [...growthBenefitKeysForPlan(plan)];
  if (p.badge) keys.push('business.dna.unlocked.badge');
  if (p.analyticsLevel === 'pro' || p.analyticsLevel === 'premium') {
    keys.push('business.dna.delta.analytics');
  }
  return keys;
}

/** Real differences on the next plan. Future modules are not listed. */
export function listLockedFeatureKeys(plan: BusinessPlanId): string[] {
  const next = nextUpgradePlan(plan);
  if (!next) return [];
  return computeUpgradeDelta(plan, next).map((item) => item.key);
}

/** Future modules are not presented as plan benefits. */
export function listComingSoonFeatureKeys(_plan: BusinessPlanId): string[] {
  return [];
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
  if (p.plan === 'pro') return 'business.dna.growthStatus.strong';
  if (p.badge) return 'business.dna.growthStatus.growing';
  return 'business.dna.growthStatus.starter';
}
