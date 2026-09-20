/**
 * NL-2026 kinderopvangtoeslag — Stb. 2025, 233 bijlage I + Besluit KOT 2026-01-01.
 *
 * First child (Besluit art. 3):
 * 1. the child with the most hours;
 * 2. if tied, the child with the highest eligible cost;
 * 3. if still tied: FIRST_CHILD_CLASSIFICATION_UNKNOWN.
 * Not: oldest child.
 *
 * Table lookup is inclusive tot-en-met. No linear interpolation.
 */

import { UNKNOWN, isUnknown, type CentsOrUnknown } from '../domain/unknown';
import { MID_YEAR_CHANGE_NOT_SUPPORTED } from '../domain/household';
import type {
  ChildcareCareType,
  ChildcareEntry,
  ChildcareHousehold,
} from '../domain/childcare';
import {
  fromCents,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  KOT_MAX_HOURS_PER_MONTH,
  KOT_MAX_RATE_BSO_CENTS,
  KOT_MAX_RATE_CHILDMINDER_CENTS,
  KOT_MAX_RATE_DAYCARE_CENTS,
  KOT_ROUNDING,
  KOT_TABLE_2026,
} from '../rulesets/nl/2026/childcare-allowance-parameters';

export const CHILDCARE_ROUNDING_POLICY = KOT_ROUNDING;

export type ChildcareStatus =
  | 'OK'
  | 'ZERO'
  | 'UNKNOWN'
  | 'MID_YEAR_CHANGE_NOT_SUPPORTED'
  | 'FIRST_CHILD_CLASSIFICATION_UNKNOWN';

export type ChildcareBand = {
  fromCents: number;
  toCents: number | null;
  firstTenths: number;
  nextTenths: number;
};

export type ChildcareAllowanceResult = {
  status: ChildcareStatus;
  annualCents: CentsOrUnknown;
  firstChildKey: string | null;
  band: ChildcareBand | null;
  reason: string | null;
};

export type ChildcareAllowanceInput = {
  midYearHouseholdChange?: boolean;
  household: ChildcareHousehold;
  jointAssessmentIncomeCents: number;
};

export function officialMaxHourlyRateCents(type: ChildcareCareType): number {
  if (type === 'DAYCARE_CENTER') return KOT_MAX_RATE_DAYCARE_CENTS;
  if (type === 'AFTER_SCHOOL_CENTER') return KOT_MAX_RATE_BSO_CENTS;
  return KOT_MAX_RATE_CHILDMINDER_CENTS;
}

export function lookupChildcareBand2026(jointAssessmentIncomeCents: number): ChildcareBand {
  if (!Number.isInteger(jointAssessmentIncomeCents)) {
    throw new Error('jointAssessmentIncomeCents must be integer cents');
  }
  if (jointAssessmentIncomeCents < 0) {
    throw new Error('jointAssessmentIncomeCents must be >= 0');
  }
  for (let i = 0; i < KOT_TABLE_2026.length; i += 1) {
    const row = KOT_TABLE_2026[i];
    if (!row) continue;
    const next = KOT_TABLE_2026[i + 1];
    const toCents = next ? next.fromCents - 1 : null;
    if (jointAssessmentIncomeCents < row.fromCents) continue;
    if (toCents == null || jointAssessmentIncomeCents <= toCents) {
      return row;
    }
  }
  const last = KOT_TABLE_2026[KOT_TABLE_2026.length - 1];
  if (!last) throw new Error('KOT_TABLE_2026 empty');
  return last;
}

type ChildAgg = {
  childKey: string;
  hours: number;
  eligibleCostMonthlyCents: number;
};

function aggregateEntries(
  entries: readonly ChildcareEntry[],
): { status: 'OK'; children: ChildAgg[] } | { status: 'UNKNOWN'; reason: string } | { status: 'ZERO'; reason: string } {
  const byChild = new Map<string, ChildAgg>();
  let anyEligible = false;
  for (const entry of entries) {
    if (entry.providerEligibilityStatus === 'UNKNOWN') {
      return { status: 'UNKNOWN', reason: 'providerEligibility=UNKNOWN' };
    }
    if (entry.providerEligibilityStatus === 'NOT_ELIGIBLE') continue;
    if (entry.hoursPerMonth == null || entry.actualHourlyRateCents == null) {
      return { status: 'UNKNOWN', reason: 'childcareHoursOrRate=UNKNOWN' };
    }
    if (!Number.isInteger(entry.hoursPerMonth) || !Number.isInteger(entry.actualHourlyRateCents)) {
      throw new Error('childcare hours and rate must be integers');
    }
    if (entry.hoursPerMonth < 0 || entry.actualHourlyRateCents < 0) {
      throw new Error('childcare hours and rate must be >= 0');
    }
    const hours = Math.min(entry.hoursPerMonth, KOT_MAX_HOURS_PER_MONTH);
    const rate = Math.min(
      entry.actualHourlyRateCents,
      officialMaxHourlyRateCents(entry.careType),
    );
    const cost = hours * rate;
    anyEligible = true;
    const prev = byChild.get(entry.childKey);
    if (prev) {
      prev.hours += hours;
      prev.eligibleCostMonthlyCents += cost;
    } else {
      byChild.set(entry.childKey, {
        childKey: entry.childKey,
        hours,
        eligibleCostMonthlyCents: cost,
      });
    }
  }
  if (!anyEligible) return { status: 'ZERO', reason: 'NO_ELIGIBLE_PROVIDER' };
  return { status: 'OK', children: Array.from(byChild.values()) };
}

/**
 * Besluit kinderopvangtoeslag art. 3 leden 2–4.
 */
export function classifyFirstChild(
  children: readonly ChildAgg[],
): { status: 'OK'; firstKey: string } | { status: 'FIRST_CHILD_CLASSIFICATION_UNKNOWN' } {
  if (children.length === 0) {
    return { status: 'FIRST_CHILD_CLASSIFICATION_UNKNOWN' };
  }
  let maxHours = -1;
  for (const c of children) if (c.hours > maxHours) maxHours = c.hours;
  const byHours = children.filter((c) => c.hours === maxHours);
  if (byHours.length === 1 && byHours[0]) {
    return { status: 'OK', firstKey: byHours[0].childKey };
  }
  let maxCost = -1;
  for (const c of byHours) {
    if (c.eligibleCostMonthlyCents > maxCost) maxCost = c.eligibleCostMonthlyCents;
  }
  const byCost = byHours.filter((c) => c.eligibleCostMonthlyCents === maxCost);
  if (byCost.length === 1 && byCost[0]) {
    return { status: 'OK', firstKey: byCost[0].childKey };
  }
  return { status: 'FIRST_CHILD_CLASSIFICATION_UNKNOWN' };
}

export function calculateChildcareAllowance2026(
  input: ChildcareAllowanceInput,
): ChildcareAllowanceResult {
  if (input.midYearHouseholdChange === true) {
    return {
      status: 'MID_YEAR_CHANGE_NOT_SUPPORTED',
      annualCents: UNKNOWN,
      firstChildKey: null,
      band: null,
      reason: MID_YEAR_CHANGE_NOT_SUPPORTED,
    };
  }
  const hh = input.household;
  if (hh.hasToeslagPartner === 'UNKNOWN' || hh.hasToeslagPartner == null) {
    return {
      status: 'UNKNOWN',
      annualCents: UNKNOWN,
      firstChildKey: null,
      band: null,
      reason: 'toeslagPartner=UNKNOWN',
    };
  }
  if (hh.parentWorkStudyStatus == null || hh.parentWorkStudyStatus === 'UNKNOWN') {
    return {
      status: 'UNKNOWN',
      annualCents: UNKNOWN,
      firstChildKey: null,
      band: null,
      reason: 'parentWorkStudyStatus=UNKNOWN',
    };
  }
  if (hh.parentWorkStudyStatus === 'NOT_ELIGIBLE') {
    return {
      status: 'ZERO',
      annualCents: 0,
      firstChildKey: null,
      band: null,
      reason: 'parentWorkStudyStatus=NOT_ELIGIBLE',
    };
  }
  if (hh.workedMonthsInYear == null) {
    return {
      status: 'UNKNOWN',
      annualCents: UNKNOWN,
      firstChildKey: null,
      band: null,
      reason: 'workedMonthsInYear=UNKNOWN',
    };
  }
  if (hh.workedMonthsInYear < 1 || hh.workedMonthsInYear > 12) {
    return {
      status: 'UNKNOWN',
      annualCents: UNKNOWN,
      firstChildKey: null,
      band: null,
      reason: 'workedMonthsInYear=OUT_OF_RANGE',
    };
  }

  const agg = aggregateEntries(hh.entries);
  if (agg.status === 'UNKNOWN') {
    return {
      status: 'UNKNOWN',
      annualCents: UNKNOWN,
      firstChildKey: null,
      band: null,
      reason: agg.reason,
    };
  }
  if (agg.status === 'ZERO') {
    return {
      status: 'ZERO',
      annualCents: 0,
      firstChildKey: null,
      band: null,
      reason: agg.reason,
    };
  }

  const first = classifyFirstChild(agg.children);
  if (first.status === 'FIRST_CHILD_CLASSIFICATION_UNKNOWN') {
    return {
      status: 'FIRST_CHILD_CLASSIFICATION_UNKNOWN',
      annualCents: UNKNOWN,
      firstChildKey: null,
      band: null,
      reason: 'FIRST_CHILD_CLASSIFICATION_UNKNOWN',
    };
  }

  const band = lookupChildcareBand2026(input.jointAssessmentIncomeCents);
  const months = hh.workedMonthsInYear;
  let annualScaled = fromCents(0);
  for (const child of agg.children) {
    const tenths =
      child.childKey === first.firstKey ? band.firstTenths : band.nextTenths;
    const yearlyCost = child.eligibleCostMonthlyCents * months;
    annualScaled += mulRate(fromCents(yearlyCost), BigInt(tenths), BigInt(1000));
  }
  const annual = toCentsRoundHalfUp(annualScaled);
  return {
    status: annual === 0 ? 'ZERO' : 'OK',
    annualCents: annual,
    firstChildKey: first.firstKey,
    band,
    reason: null,
  };
}

export function childcareAnnualOrUnknown(
  result: ChildcareAllowanceResult,
): CentsOrUnknown {
  return result.annualCents;
}

export function isUnknownChildcare(result: ChildcareAllowanceResult): boolean {
  return isUnknown(result.annualCents);
}
