/**
 * Holiday-pay reconstruction for employee baseline income only.
 * Does not change certified box 1 / Zvw / allowance formulas.
 *
 * Official 2026 semantics:
 * - WML art. 15 / Rijksoverheid: statutory minimum vakantiebijslag is 8% of wage.
 * - 8% is a labour-law minimum, not a tax rate, and is not universal.
 * - Dienst Toeslagen: vakantiegeld counts in toetsingsinkomen.
 */

import { SRC_HOLIDAY_PAY_2026, SRC_TOETSINGSINKOMEN_HOLIDAY_2026 } from '../rulesets/nl/2026/sources';
import type { WizardState } from './schema';

export const STATUTORY_HOLIDAY_PAY_PERCENT = 8;

export const HOLIDAY_PAY_OFFICIAL_SOURCES = {
  statutoryMinimum: SRC_HOLIDAY_PAY_2026,
  toetsingsinkomen: SRC_TOETSINGSINKOMEN_HOLIDAY_2026,
} as const;

export type HolidayPayIncluded = 'YES' | 'NO' | 'UNKNOWN';
export type HolidayPayPercentMode = 'STATUTORY_8' | 'CUSTOM';

export function parseHolidayPercent(raw: string): number | null {
  const normalized = raw.trim().replace('%', '').replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return value;
}

export function holidayPayCents(annualWageCents: number, percent: number): number {
  if (!Number.isInteger(annualWageCents) || annualWageCents < 0) {
    throw new Error('annualWageCents must be a non-negative integer');
  }
  return Math.round((annualWageCents * percent) / 100);
}

export function hasAdvancedFiscalIncome(state: WizardState): boolean {
  return [
    state.baselineGrossEmploymentEuro,
    state.baselineBox1Euro,
    state.baselineAggregateEuro,
    state.baselineArbeidsinkomenEuro,
    state.baselineAssessmentEuro,
    state.baselineZvwUsedEuro,
  ].some((value) => value.trim() !== '');
}

export function shouldAskHolidayPay(state: WizardState): boolean {
  if (state.currentIncomeUnknown) return false;
  if (hasAdvancedFiscalIncome(state)) return false;
  return state.situationGroup === 'EMPLOYEE' || state.situationGroup === 'NONE';
}

export function resolvedHolidayIncluded(
  state: WizardState,
): HolidayPayIncluded | null {
  if (!shouldAskHolidayPay(state)) return 'YES';
  if (state.holidayPayIncluded == null) return null;
  return state.holidayPayIncluded;
}

export function holidayPercentForReconstruction(state: WizardState): number | null {
  if (state.holidayPayPercentMode === 'CUSTOM') {
    return parseHolidayPercent(state.holidayPayCustomPercent);
  }
  if (state.holidayPayPercentMode === 'STATUTORY_8' || state.holidayPayPercentMode == null) {
    return STATUTORY_HOLIDAY_PAY_PERCENT;
  }
  return null;
}

export type HolidayReconstruction =
  | {
      status: 'SKIPPED';
      annualCents: number;
      holidayCents: 0;
      unresolved: false;
    }
  | {
      status: 'INCLUDED';
      annualCents: number;
      holidayCents: 0;
      unresolved: false;
    }
  | {
      status: 'ADDED';
      annualCents: number;
      holidayCents: number;
      unresolved: false;
      percent: number;
    }
  | {
      status: 'UNRESOLVED';
      annualCents: number;
      holidayCents: 0;
      unresolved: true;
    };

export function reconstructAnnualWithHolidayPay(
  baseAnnualCents: number,
  state: WizardState,
): HolidayReconstruction {
  if (!shouldAskHolidayPay(state)) {
    return { status: 'SKIPPED', annualCents: baseAnnualCents, holidayCents: 0, unresolved: false };
  }
  const included = resolvedHolidayIncluded(state);
  if (included == null || included === 'UNKNOWN') {
    return { status: 'UNRESOLVED', annualCents: baseAnnualCents, holidayCents: 0, unresolved: true };
  }
  if (included === 'YES') {
    return { status: 'INCLUDED', annualCents: baseAnnualCents, holidayCents: 0, unresolved: false };
  }
  const percent = holidayPercentForReconstruction(state);
  if (percent == null) {
    return { status: 'UNRESOLVED', annualCents: baseAnnualCents, holidayCents: 0, unresolved: true };
  }
  const extra = holidayPayCents(baseAnnualCents, percent);
  return {
    status: 'ADDED',
    annualCents: baseAnnualCents + extra,
    holidayCents: extra,
    unresolved: false,
    percent,
  };
}
