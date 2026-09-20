/**
 * NL-2026 kindgebonden budget — Wet op het kindgebonden budget 2026-01-01
 * + Dienst Toeslagen 2026 drempelbedragen.
 *
 * Per-child ages. No children × flatAmount.
 * Art. 2 lid 11: maandelijkse aanspraak. V1 = FULL_YEAR_STABLE_SITUATION.
 */

import { UNKNOWN, isUnknown, type CentsOrUnknown } from '../domain/unknown';
import { MID_YEAR_CHANGE_NOT_SUPPORTED } from '../domain/household';
import type { Child, ChildBudgetHousehold } from '../domain/children';
import {
  fromCents,
  max0Scaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  KGB_AGE_12_TO_15_CENTS,
  KGB_AGE_16_TO_17_CENTS,
  KGB_ASSETS_PARTNER_CENTS,
  KGB_ASSETS_SINGLE_CENTS,
  KGB_PER_CHILD_CENTS,
  KGB_PHASEOUT,
  KGB_ROUNDING,
  KGB_SINGLE_PARENT_CENTS,
  KGB_THRESHOLD_PARTNER_CENTS,
  KGB_THRESHOLD_SINGLE_CENTS,
} from '../rulesets/nl/2026/child-budget-parameters';

export const CHILD_BUDGET_ROUNDING_POLICY = KGB_ROUNDING;
export const KGB_ASSETS_LIMITS = {
  singleCents: KGB_ASSETS_SINGLE_CENTS,
  partnerCents: KGB_ASSETS_PARTNER_CENTS,
} as const;

export type ChildBudgetStatus =
  | 'OK'
  | 'ZERO'
  | 'UNKNOWN'
  | 'MID_YEAR_CHANGE_NOT_SUPPORTED';

export type ChildBudgetResult = {
  status: ChildBudgetStatus;
  annualCents: CentsOrUnknown;
  reason: string | null;
};

export type ChildBudgetInput = {
  midYearHouseholdChange?: boolean;
  household: ChildBudgetHousehold;
  userAssessmentIncomeCents: number;
  partnerAssessmentIncomeCents?: number | null;
};

function ageRaiseCents(child: Child): CentsOrUnknown {
  if (child.eligibilityStatus === 'NOT_ELIGIBLE') return 0;
  if (child.eligibilityStatus === 'UNKNOWN') return UNKNOWN;
  if (child.receivesKinderbijslag === false) return 0;
  if (child.ageYears == null) return UNKNOWN;
  const age = child.ageYears;
  if (age < 0) return UNKNOWN;
  if (age >= 18) return 0;
  if (age >= 16) return KGB_AGE_16_TO_17_CENTS;
  if (age >= 12) return KGB_AGE_12_TO_15_CENTS;
  return 0;
}

function baseForChild(child: Child): CentsOrUnknown {
  if (child.eligibilityStatus === 'NOT_ELIGIBLE') return 0;
  if (child.eligibilityStatus === 'UNKNOWN') return UNKNOWN;
  if (child.receivesKinderbijslag === false) return 0;
  if (child.ageYears == null) return UNKNOWN;
  if (child.ageYears >= 18) return 0;
  if (child.ageYears < 0) return UNKNOWN;
  return KGB_PER_CHILD_CENTS;
}

export function calculateChildBudget2026(input: ChildBudgetInput): ChildBudgetResult {
  if (input.midYearHouseholdChange === true) {
    return {
      status: 'MID_YEAR_CHANGE_NOT_SUPPORTED',
      annualCents: UNKNOWN,
      reason: MID_YEAR_CHANGE_NOT_SUPPORTED,
    };
  }
  const hh = input.household;
  if (hh.childBudgetAssetsEligibility == null || hh.childBudgetAssetsEligibility === 'UNKNOWN') {
    return {
      status: 'UNKNOWN',
      annualCents: UNKNOWN,
      reason: 'childBudgetAssetsEligibility=UNKNOWN',
    };
  }
  if (hh.childBudgetAssetsEligibility === 'NOT_ELIGIBLE') {
    return { status: 'ZERO', annualCents: 0, reason: 'childBudgetAssetsEligibility=NOT_ELIGIBLE' };
  }
  if (hh.hasToeslagPartner === 'UNKNOWN' || hh.hasToeslagPartner == null) {
    return {
      status: 'UNKNOWN',
      annualCents: UNKNOWN,
      reason: 'toeslagPartner=UNKNOWN',
    };
  }
  if (!Number.isInteger(input.userAssessmentIncomeCents)) {
    throw new Error('userAssessmentIncomeCents must be integer cents');
  }

  const eligible = hh.children.filter((c) => c.eligibilityStatus !== 'NOT_ELIGIBLE');
  if (eligible.length === 0) {
    return { status: 'ZERO', annualCents: 0, reason: 'NO_ELIGIBLE_CHILDREN' };
  }

  let maxCents = 0;
  for (const child of hh.children) {
    const base = baseForChild(child);
    const raise = ageRaiseCents(child);
    if (isUnknown(base) || isUnknown(raise)) {
      return { status: 'UNKNOWN', annualCents: UNKNOWN, reason: 'childAgeOrEligibility=UNKNOWN' };
    }
    maxCents += base + raise;
  }
  if (maxCents === 0) {
    return { status: 'ZERO', annualCents: 0, reason: 'NO_KGB_AMOUNT' };
  }

  const hasPartner = hh.hasToeslagPartner === true;
  if (!hasPartner) maxCents += KGB_SINGLE_PARENT_CENTS;

  if (hasPartner && input.partnerAssessmentIncomeCents == null) {
    return {
      status: 'UNKNOWN',
      annualCents: UNKNOWN,
      reason: 'partnerAssessmentIncome=UNKNOWN',
    };
  }
  const partnerIncome = hasPartner ? (input.partnerAssessmentIncomeCents ?? 0) : 0;
  if (!Number.isInteger(partnerIncome) || partnerIncome < 0) {
    throw new Error('partnerAssessmentIncomeCents must be integer cents >= 0');
  }

  const toets = hasPartner
    ? input.userAssessmentIncomeCents + partnerIncome
    : input.userAssessmentIncomeCents;
  const drempel = hasPartner ? KGB_THRESHOLD_PARTNER_CENTS : KGB_THRESHOLD_SINGLE_CENTS;
  const above = Math.max(0, toets - drempel);
  const reduction = toCentsRoundHalfUp(
    mulRate(fromCents(above), KGB_PHASEOUT.n, KGB_PHASEOUT.d),
  );
  const annual = toCentsRoundHalfUp(max0Scaled(fromCents(maxCents - reduction)));

  return {
    status: annual === 0 ? 'ZERO' : 'OK',
    annualCents: annual,
    reason: annual === 0 ? 'PHASED_OUT' : null,
  };
}
