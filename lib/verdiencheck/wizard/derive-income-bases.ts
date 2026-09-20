/**
 * User-known money facts → calculator income bases.
 * Never maps UNKNOWN to 0. Never claims gross == box1 == verzamelinkomen.
 * A same-number EMPLOYMENT_PROXY is only a provisional estimate when the user
 * confirms employment income is their only current income.
 */

import { parseEuroInputToCents } from '../domain/money';
import type { WizardState } from './schema';

export type IncomeBaseDerivation =
  | 'ADVANCED'
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
};

export function annualizeWizardEuro(
  raw: string,
  period: WizardState['amountEntryPeriod'],
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
  };
}

function canUseEmploymentProxy(state: WizardState): boolean {
  if (state.currentIncomeUnknown) return false;
  if (state.hasOtherIncome !== false) return false;
  return state.situationGroup === 'EMPLOYEE' || state.situationGroup === 'NONE';
}

/**
 * Advanced jaaropgave fields always win when any of them is filled.
 * Otherwise a single current-income fact may provisionally fill all bases
 * only when the user said they have no other current income.
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
    return { ...advanced, derivation: 'ADVANCED' };
  }

  if (state.currentIncomeUnknown) {
    return emptyBases('UNKNOWN');
  }

  const current = annualizeWizardEuro(state.currentIncomeEuro, period);
  if (current == null) {
    return emptyBases('UNKNOWN');
  }

  if (canUseEmploymentProxy(state)) {
    return {
      baselineGrossEmploymentIncomeCents: current,
      baselineBox1TaxableIncomeCents: current,
      baselineAggregateIncomeCents: current,
      baselineArbeidsinkomenCents: current,
      baselineAssessmentIncomeCents: current,
      baselineZvwContributionIncomeAlreadyUsedCents: current,
      derivation: 'EMPLOYMENT_PROXY',
    };
  }

  return {
    ...emptyBases('PARTIAL'),
    baselineGrossEmploymentIncomeCents: current,
  };
}

export function countDirectTaxFieldsInDefaultUi(): number {
  return 0;
}

export function countDirectTaxFieldsInAdvancedUi(): number {
  return 6;
}
