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

function dashCell(): ComparisonCell {
  return { kind: 'dash' };
}

function percentCell(p: BusinessVisibilityProfile): ComparisonCell {
  return { kind: 'percent', value: p.commissionPercent };
}

function labelCell(key: string): ComparisonCell {
  return { kind: 'label', value: key };
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

/**
 * Public comparison rows.
 * Only fee and the live sponsored entitlement. Homepage, regional and other
 * Business DNA flags stay on the profile and are not shown as plan benefits.
 */
export function buildSubscriptionComparisonRows(): ComparisonRow[] {
  return [
    rowForProfiles('business.dna.compare.commission', (p) => percentCell(p)),
    rowForProfiles('business.dna.compare.sponsored', (p) =>
      p.plan === 'individual'
        ? dashCell()
        : labelCell(`business.dna.compare.sponsoredValue.${p.plan}`),
    ),
  ];
}

export function subscriptionComparisonColumns(): ComparisonColumnId[] {
  return [...COLUMNS];
}

const SPONSORED_BENEFIT_KEY: Partial<Record<BusinessPlanId, string>> = {
  basic: 'business.dna.benefit.sponsoredBasic',
  pro: 'business.dna.benefit.sponsoredPro',
  premium: 'business.dna.benefit.sponsoredPremium',
};

/** Customer-facing benefit lines. Sponsored entitlement only; fee is a separate row. */
export function growthBenefitKeysForPlan(plan: BusinessPlanId): string[] {
  const key = SPONSORED_BENEFIT_KEY[plan];
  return key ? [key] : [];
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
