/**
 * Subscription comparison table — Phase 12B.
 * All rows derived from Business DNA SSOT (visibility-profile.ts).
 */

import {
  getBusinessVisibilityProfile,
  listBusinessPlanIds,
  type BusinessPlanId,
  type BusinessVisibilityProfile,
  type FutureFeatureStatus,
} from './visibility-profile';

export type ComparisonColumnId = BusinessPlanId;

export type ComparisonCellKind =
  | 'percent'
  | 'check'
  | 'dash'
  | 'dots'
  | 'label'
  | 'locations'
  | 'status';

export type ComparisonCell = {
  kind: ComparisonCellKind;
  /** Raw value for percent/label/locations; dot count for dots; status key for status. */
  value?: string | number;
  status?: FutureFeatureStatus;
};

export type ComparisonRow = {
  featureKey: string;
  cells: Record<ComparisonColumnId, ComparisonCell>;
};

const COLUMNS: ComparisonColumnId[] = listBusinessPlanIds();

function dotsCell(level: number): ComparisonCell {
  return { kind: 'dots', value: level };
}

function statusCell(status: FutureFeatureStatus): ComparisonCell {
  return { kind: 'status', status };
}

function checkCell(): ComparisonCell {
  return { kind: 'check' };
}

function dashCell(): ComparisonCell {
  return { kind: 'dash' };
}

function percentCell(p: BusinessVisibilityProfile): ComparisonCell {
  return { kind: 'percent', value: p.commissionPercent };
}

function labelCell(key: string): ComparisonCell {
  return { kind: 'label', value: key };
}

function locationsCell(max: number): ComparisonCell {
  return { kind: 'locations', value: max };
}

function rowForProfiles(
  featureKey: string,
  build: (p: BusinessVisibilityProfile) => ComparisonCell,
): ComparisonRow {
  const cells = {} as Record<ComparisonColumnId, ComparisonCell>;
  for (const col of COLUMNS) {
    cells[col] = build(getBusinessVisibilityProfile(col));
  }
  return { featureKey, cells };
}

/** Growth-focused comparison rows for /sell — commission is one row, not the headline. */
export function buildSubscriptionComparisonRows(): ComparisonRow[] {
  return [
    rowForProfiles('business.dna.compare.commission', (p) => percentCell(p)),
    rowForProfiles('business.dna.compare.badge', (p) =>
      p.badge ? checkCell() : dashCell(),
    ),
    rowForProfiles('business.dna.compare.localVisibility', (p) =>
      dotsCell(p.visibilityLevel),
    ),
    rowForProfiles('business.dna.compare.searchPriority', (p) =>
      p.searchPriorityLevel === 0 ? dashCell() : dotsCell(p.searchPriorityLevel),
    ),
    rowForProfiles('business.dna.compare.analytics', (p) =>
      labelCell(p.analyticsDisplayKey),
    ),
    rowForProfiles('business.dna.compare.verifiedBusiness', (p) =>
      p.verifiedBusiness ? checkCell() : dashCell(),
    ),
    rowForProfiles('business.dna.compare.regionalVisibility', (p) =>
      p.regionalEligible ? checkCell() : dashCell(),
    ),
    rowForProfiles('business.dna.compare.homepageSpotlight', (p) => {
      if (p.homepageSpotlightEligible) return checkCell();
      if (p.homepageEligible) return statusCell('optional');
      return dashCell();
    }),
    rowForProfiles('business.dna.compare.websitePromotion', (p) =>
      statusCell(p.websitePromotionStatus),
    ),
    rowForProfiles('business.dna.compare.socialPromotion', (p) =>
      statusCell(p.socialPromotionStatus),
    ),
    rowForProfiles('business.dna.compare.aiMarketing', (p) =>
      p.futureAiMarketing ? statusCell('future') : dashCell(),
    ),
    rowForProfiles('business.dna.compare.locations', (p) =>
      locationsCell(p.multipleLocations),
    ),
    rowForProfiles('business.dna.compare.support', (p) =>
      labelCell(`business.dna.support.${p.prioritySupport}`),
    ),
  ];
}

export function subscriptionComparisonColumns(): ComparisonColumnId[] {
  return [...COLUMNS];
}

/** Growth benefit keys for plan cards — derived from DNA, not hardcoded. */
export function growthBenefitKeysForPlan(plan: BusinessPlanId): string[] {
  const p = getBusinessVisibilityProfile(plan);
  const keys: string[] = [];

  if (p.verifiedBusiness) keys.push('business.dna.benefit.verified');
  if (p.badge) keys.push('business.dna.benefit.badge');
  if (p.boostEligible) keys.push('business.dna.benefit.discoveryBoost');
  if (p.localSearchPriority) keys.push('business.dna.benefit.localSearch');
  if (p.categorySpotlightEligible) keys.push('business.dna.benefit.categoryFeatured');
  if (p.regionalEligible) keys.push('business.dna.benefit.regional');
  if (p.homepageEligible) keys.push('business.dna.benefit.homepageEligible');
  if (p.homepageSpotlightEligible) keys.push('business.dna.benefit.homepageSpotlight');
  if (p.campaignBuilder) keys.push('business.dna.benefit.campaigns');
  if (p.websitePromotionStatus === 'ready') keys.push('business.dna.benefit.websiteReady');
  if (p.socialPromotionStatus === 'ready') keys.push('business.dna.benefit.socialReady');
  if (p.premiumAnalytics) keys.push('business.dna.benefit.premiumAnalytics');
  if (p.multipleLocations > 1) keys.push('business.dna.benefit.multiLocation');

  keys.push(p.analyticsDisplayKey);
  return keys;
}

export function formatMonthlyPrice(plan: BusinessPlanId, locale = 'nl-NL'): string {
  const cents = getBusinessVisibilityProfile(plan).monthlyPriceCents;
  if (cents === 0) return '€0';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
