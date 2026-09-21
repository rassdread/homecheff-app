/**
 * User-known money facts → calculator income bases.
 * Never maps UNKNOWN to 0. Never claims gross == box1 == verzamelinkomen.
 * A same-number EMPLOYMENT_PROXY is only a provisional estimate when the user
 * confirms employment income is their only current income.
 * NET salary is inverted via annual IB/credits — never treated as taxable income.
 * Holiday pay is reconstructed only for employee-like current income, never on
 * advanced fiscal/yearopgave fields.
 */

import { parseEuroInputToCents } from '../domain/money';
import { estimateGrossFromNetSalary2026 } from '../nl2026/net-to-gross';
import { reconstructAnnualWithHolidayPay, shouldAskHolidayPay } from './holiday-pay';
import type { WizardState } from './schema';

export type IncomeBaseDerivation =
  | 'ADVANCED'
  | 'EMPLOYMENT_PROXY'
  | 'NET_EMPLOYMENT_ESTIMATE'
  | 'NET_UNRESOLVED'
  | 'PARTIAL'
  | 'UNKNOWN';

export type IncomeSourcePrecedence =
  | 'KNOWN_FISCAL_ASSESSMENT'
  | 'ANNUAL_GROSS_ALREADY_INCLUSIVE'
  | 'RECONSTRUCTED_MONTHLY_GROSS_PLUS_HOLIDAY'
  | 'NET_TO_GROSS_ESTIMATE_PLUS_HOLIDAY'
  | 'NET_TO_GROSS_ESTIMATE'
  | 'EMPLOYMENT_PROXY'
  | 'PARTIAL'
  | 'UNKNOWN';

export type DerivedIncomeBases = {
  baselineGrossEmploymentIncomeCents: number | null;
  baselineBox1TaxableIncomeCents: number | null;
  baselineAggregateIncomeCents: number | null;
  baselineArbeidsinkomenCents: number | null;
  baselineAssessmentIncomeCents: number | null;
  baselineZvwContributionIncomeAlreadyUsedCents: number | null;
  derivation: IncomeBaseDerivation;
  netToGrossMethod: 'BINARY_SEARCH_ANNUAL_IB_CREDITS' | null;
  netToGrossConfidence: 'ESTIMATE' | 'NONE' | null;
  holidayPayUnresolved: boolean;
  holidayPayCents: number | null;
  incomeSourcePrecedence: IncomeSourcePrecedence;
};

export function annualizeWizardEuro(
  raw: string,
  period: WizardState['amountEntryPeriod'] | WizardState['currentIncomePeriod'],
): number | null {
  const cents = parseEuroInputToCents(raw);
  if (cents == null) return null;
  return period === 'MONTH' ? cents * 12 : cents;
}

function emptyBases(derivation: IncomeBaseDerivation): DerivedIncomeBases {
  return {
    baselineGrossEmploymentIncomeCents: null,
    baselineBox1TaxableIncomeCents: null,
    baselineAggregateIncomeCents: null,
    baselineArbeidsinkomenCents: null,
    baselineAssessmentIncomeCents: null,
    baselineZvwContributionIncomeAlreadyUsedCents: null,
    derivation,
    netToGrossMethod: derivation === 'NET_UNRESOLVED' ? 'BINARY_SEARCH_ANNUAL_IB_CREDITS' : null,
    netToGrossConfidence: derivation === 'NET_UNRESOLVED' ? 'NONE' : null,
    holidayPayUnresolved: false,
    holidayPayCents: null,
    incomeSourcePrecedence: 'UNKNOWN',
  };
}

function canUseEmploymentProxy(state: WizardState): boolean {
  if (state.currentIncomeUnknown) return false;
  if (state.hasOtherIncome !== false) return false;
  return state.situationGroup === 'EMPLOYEE' || state.situationGroup === 'NONE';
}

function proxyFromAnnual(
  annual: number,
  derivation: IncomeBaseDerivation,
  extra: Pick<
    DerivedIncomeBases,
    | 'netToGrossMethod'
    | 'netToGrossConfidence'
    | 'holidayPayUnresolved'
    | 'holidayPayCents'
    | 'incomeSourcePrecedence'
  >,
): DerivedIncomeBases {
  return {
    baselineGrossEmploymentIncomeCents: annual,
    baselineBox1TaxableIncomeCents: annual,
    baselineAggregateIncomeCents: annual,
    baselineArbeidsinkomenCents: annual,
    baselineAssessmentIncomeCents: annual,
    baselineZvwContributionIncomeAlreadyUsedCents: annual,
    derivation,
    netToGrossMethod: extra.netToGrossMethod,
    netToGrossConfidence: extra.netToGrossConfidence,
    holidayPayUnresolved: extra.holidayPayUnresolved,
    holidayPayCents: extra.holidayPayCents,
    incomeSourcePrecedence: extra.incomeSourcePrecedence,
  };
}

function holidayPrecedence(
  state: WizardState,
  reconstruction: { status: string; holidayCents: number },
  netEstimate: boolean,
): IncomeSourcePrecedence {
  if (reconstruction.status === 'INCLUDED' && state.currentIncomePeriod === 'YEAR') {
    return 'ANNUAL_GROSS_ALREADY_INCLUSIVE';
  }
  if (reconstruction.status === 'ADDED') {
    return netEstimate
      ? 'NET_TO_GROSS_ESTIMATE_PLUS_HOLIDAY'
      : 'RECONSTRUCTED_MONTHLY_GROSS_PLUS_HOLIDAY';
  }
  if (netEstimate) return 'NET_TO_GROSS_ESTIMATE';
  return 'EMPLOYMENT_PROXY';
}

/**
 * Advanced jaaropgave fields always win when any of them is filled.
 * Otherwise a single current-income fact may provisionally fill all bases
 * only when the user said they have no other current income.
 * NET input is inverted; it is never copied as taxable income.
 * Holiday pay is never added on top of advanced fiscal fields.
 */
export function deriveIncomeBasesFromUserFacts(state: WizardState): DerivedIncomeBases {
  const period = state.amountEntryPeriod;
  const advanced = {
    baselineGrossEmploymentIncomeCents: annualizeWizardEuro(state.baselineGrossEmploymentEuro, period),
    baselineBox1TaxableIncomeCents: annualizeWizardEuro(state.baselineBox1Euro, period),
    baselineAggregateIncomeCents: annualizeWizardEuro(state.baselineAggregateEuro, period),
    baselineArbeidsinkomenCents: annualizeWizardEuro(state.baselineArbeidsinkomenEuro, period),
    baselineAssessmentIncomeCents: annualizeWizardEuro(state.baselineAssessmentEuro, period),
    baselineZvwContributionIncomeAlreadyUsedCents: annualizeWizardEuro(
      state.baselineZvwUsedEuro,
      period,
    ),
  };
  const hasAdvanced = Object.values(advanced).some((value) => value != null);
  if (hasAdvanced) {
    return {
      ...advanced,
      derivation: 'ADVANCED',
      netToGrossMethod: null,
      netToGrossConfidence: null,
      holidayPayUnresolved: false,
      holidayPayCents: null,
      incomeSourcePrecedence: 'KNOWN_FISCAL_ASSESSMENT',
    };
  }

  if (state.currentIncomeUnknown) {
    return emptyBases('UNKNOWN');
  }

  const current = annualizeWizardEuro(state.currentIncomeEuro, state.currentIncomePeriod);
  if (current == null) {
    return emptyBases('UNKNOWN');
  }

  const netMode = state.currentIncomeBasis === 'NET';
  if (netMode) {
    if (!canUseEmploymentProxy(state)) {
      return emptyBases('NET_UNRESOLVED');
    }
    const inverted = estimateGrossFromNetSalary2026({
      netAnnualCents: current,
      regime: state.ageTaxRegime,
      aowBirthCohort: state.aowBirthCohort,
    });
    if (inverted.status !== 'OK') {
      return emptyBases('NET_UNRESOLVED');
    }
    const reconstructed = reconstructAnnualWithHolidayPay(inverted.grossCents, state);
    if (reconstructed.unresolved) {
      return {
        ...emptyBases('NET_UNRESOLVED'),
        holidayPayUnresolved: true,
        incomeSourcePrecedence: 'UNKNOWN',
      };
    }
    return proxyFromAnnual(reconstructed.annualCents, 'NET_EMPLOYMENT_ESTIMATE', {
      netToGrossMethod: 'BINARY_SEARCH_ANNUAL_IB_CREDITS',
      netToGrossConfidence: 'ESTIMATE',
      holidayPayUnresolved: false,
      holidayPayCents: reconstructed.holidayCents || null,
      incomeSourcePrecedence: holidayPrecedence(state, reconstructed, true),
    });
  }

  const reconstructed = reconstructAnnualWithHolidayPay(current, state);
  if (shouldAskHolidayPay(state) && reconstructed.unresolved) {
    return {
      ...emptyBases('UNKNOWN'),
      holidayPayUnresolved: true,
      incomeSourcePrecedence: 'UNKNOWN',
    };
  }

  if (canUseEmploymentProxy(state)) {
    return proxyFromAnnual(reconstructed.annualCents, 'EMPLOYMENT_PROXY', {
      netToGrossMethod: null,
      netToGrossConfidence: null,
      holidayPayUnresolved: false,
      holidayPayCents: reconstructed.holidayCents || null,
      incomeSourcePrecedence: holidayPrecedence(state, reconstructed, false),
    });
  }

  return {
    ...emptyBases('PARTIAL'),
    baselineGrossEmploymentIncomeCents: reconstructed.annualCents,
    holidayPayUnresolved: reconstructed.unresolved,
    holidayPayCents: reconstructed.holidayCents || null,
    incomeSourcePrecedence: 'PARTIAL',
  };
}

export function countDirectTaxFieldsInDefaultUi(): number {
  return 0;
}

export function countDirectTaxFieldsInAdvancedUi(): number {
  return 6;
}
