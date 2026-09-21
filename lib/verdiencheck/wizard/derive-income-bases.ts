/**
 * User-known money facts → calculator income bases.
 * Never maps UNKNOWN to 0. Never claims gross == box1 == verzamelinkomen.
 *
 * A same-number employee estimate is allowed until payroll V2, but each basis
 * is independently DERIVED with its own provenance — not one annualIncome
 * copied into every field.
 *
 * NET salary is inverted via annual IB/credits — never treated as taxable income.
 * Holiday pay is reconstructed only for employee-like current income, never on
 * advanced fiscal/jaaropgave fields.
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
  | 'KNOWN_FISCAL_WAGE'
  | 'KNOWN_ASSESSMENT_INCOME'
  | 'ANNUAL_GROSS_ALREADY_INCLUSIVE'
  | 'RECONSTRUCTED_MONTHLY_GROSS_PLUS_HOLIDAY'
  | 'NET_TO_GROSS_ESTIMATE_PLUS_HOLIDAY'
  | 'NET_TO_GROSS_ESTIMATE'
  | 'EMPLOYMENT_PROXY'
  | 'PARTIAL'
  | 'UNKNOWN';

/** Phase 1 provenance kinds — no fake percentages, no second scoring system. */
export type IncomeAmountProvenanceKind = 'USER_PROVIDED' | 'DERIVED' | 'ESTIMATE' | 'UNKNOWN';

export type IncomeBasisSource =
  | 'KNOWN_ASSESSMENT_INCOME'
  | 'KNOWN_FISCAL_WAGE'
  | 'KNOWN_GROSS_EMPLOYMENT'
  | 'NET_TO_GROSS_ESTIMATE'
  | 'EMPLOYMENT_ESTIMATE'
  | 'DERIVED_FROM_FISCAL_WAGE'
  | 'DERIVED_FROM_GROSS_EMPLOYMENT'
  | 'UNKNOWN';

export type IncomeBasisProvenance = {
  kind: IncomeAmountProvenanceKind;
  source: IncomeBasisSource;
};

export type IncomeBasesProvenance = {
  contractualGross: IncomeBasisProvenance;
  fiscalWage: IncomeBasisProvenance;
  box1: IncomeBasisProvenance;
  aggregate: IncomeBasisProvenance;
  arbeidsinkomen: IncomeBasisProvenance;
  assessment: IncomeBasisProvenance;
  zvwUsed: IncomeBasisProvenance;
};

export type DerivedIncomeBases = {
  /** A — entered/annualized contractual wage before holiday add when holiday is extra. */
  contractualGrossEmploymentIncomeCents: number | null;
  /** B — fiscal wage; independently derived even when numerically equal to A. */
  fiscalWageCents: number | null;
  baselineGrossEmploymentIncomeCents: number | null;
  baselineBox1TaxableIncomeCents: number | null;
  baselineAggregateIncomeCents: number | null;
  baselineArbeidsinkomenCents: number | null;
  baselineAssessmentIncomeCents: number | null;
  householdAssessmentIncomeCents: number | null;
  /**
   * Contribution income already used for the 2026 Zvw cap.
   * Certified extra-ROW Zvw charges only remaining room.
   * Employee estimate: derived from fiscal/employment wage, not a generic annualIncome copy.
   */
  baselineZvwContributionIncomeAlreadyUsedCents: number | null;
  derivation: IncomeBaseDerivation;
  netToGrossMethod: 'BINARY_SEARCH_ANNUAL_IB_CREDITS' | null;
  netToGrossConfidence: 'ESTIMATE' | 'NONE' | null;
  holidayPayUnresolved: boolean;
  holidayPayCents: number | null;
  /** Summary of the derivation path. Per-basis truth lives in `basisProvenance`. */
  incomeSourcePrecedence: IncomeSourcePrecedence;
  basisProvenance: IncomeBasesProvenance;
};

const UNKNOWN_PROV: IncomeBasisProvenance = { kind: 'UNKNOWN', source: 'UNKNOWN' };

function unknownProvenance(): IncomeBasesProvenance {
  return {
    contractualGross: UNKNOWN_PROV,
    fiscalWage: UNKNOWN_PROV,
    box1: UNKNOWN_PROV,
    aggregate: UNKNOWN_PROV,
    arbeidsinkomen: UNKNOWN_PROV,
    assessment: UNKNOWN_PROV,
    zvwUsed: UNKNOWN_PROV,
  };
}

function prov(kind: IncomeAmountProvenanceKind, source: IncomeBasisSource): IncomeBasisProvenance {
  return { kind, source };
}

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
    contractualGrossEmploymentIncomeCents: null,
    fiscalWageCents: null,
    baselineGrossEmploymentIncomeCents: null,
    baselineBox1TaxableIncomeCents: null,
    baselineAggregateIncomeCents: null,
    baselineArbeidsinkomenCents: null,
    baselineAssessmentIncomeCents: null,
    householdAssessmentIncomeCents: null,
    baselineZvwContributionIncomeAlreadyUsedCents: null,
    derivation,
    netToGrossMethod: derivation === 'NET_UNRESOLVED' ? 'BINARY_SEARCH_ANNUAL_IB_CREDITS' : null,
    netToGrossConfidence: derivation === 'NET_UNRESOLVED' ? 'NONE' : null,
    holidayPayUnresolved: false,
    holidayPayCents: null,
    incomeSourcePrecedence: 'UNKNOWN',
    basisProvenance: unknownProvenance(),
  };
}

function canUseEmploymentProxy(state: WizardState): boolean {
  if (state.currentIncomeUnknown) return false;
  if (state.hasOtherIncome !== false) return false;
  return state.situationGroup === 'EMPLOYEE' || state.situationGroup === 'NONE';
}

function partnerAssessmentCents(state: WizardState): number | null {
  if (state.hasPartner !== true) return null;
  return annualizeWizardEuro(state.partnerAssessmentEuro, state.currentIncomePeriod);
}

function householdAssessment(
  userAssessment: number | null,
  state: WizardState,
): number | null {
  if (userAssessment == null) return null;
  const partner = partnerAssessmentCents(state);
  if (state.hasPartner === true && partner != null) return userAssessment + partner;
  return userAssessment;
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
 * Simple employee path: reconstructed annual gross may equal fiscal/box1/assessment
 * until payroll/housing/car exist. Each field is still independently derived.
 */
function deriveEmployeeEstimate(input: {
  contractualCents: number;
  reconstructedAnnual: number;
  holidayCents: number;
  derivation: Extract<IncomeBaseDerivation, 'EMPLOYMENT_PROXY' | 'NET_EMPLOYMENT_ESTIMATE'>;
  netEstimate: boolean;
  state: WizardState;
  reconstructionStatus: string;
}): DerivedIncomeBases {
  const annual = input.reconstructedAnnual;
  const estimateKind: IncomeAmountProvenanceKind = input.netEstimate ? 'ESTIMATE' : 'DERIVED';
  const grossSource: IncomeBasisSource = input.netEstimate
    ? 'NET_TO_GROSS_ESTIMATE'
    : 'EMPLOYMENT_ESTIMATE';
  const fiscalSource: IncomeBasisSource = input.netEstimate
    ? 'NET_TO_GROSS_ESTIMATE'
    : 'DERIVED_FROM_GROSS_EMPLOYMENT';
  return {
    contractualGrossEmploymentIncomeCents: input.contractualCents,
    fiscalWageCents: annual,
    baselineGrossEmploymentIncomeCents: annual,
    baselineBox1TaxableIncomeCents: annual,
    baselineAggregateIncomeCents: annual,
    baselineArbeidsinkomenCents: annual,
    baselineAssessmentIncomeCents: annual,
    householdAssessmentIncomeCents: householdAssessment(annual, input.state),
    baselineZvwContributionIncomeAlreadyUsedCents: annual,
    derivation: input.derivation,
    netToGrossMethod: input.netEstimate ? 'BINARY_SEARCH_ANNUAL_IB_CREDITS' : null,
    netToGrossConfidence: input.netEstimate ? 'ESTIMATE' : null,
    holidayPayUnresolved: false,
    holidayPayCents: input.holidayCents || null,
    incomeSourcePrecedence: holidayPrecedence(
      input.state,
      { status: input.reconstructionStatus, holidayCents: input.holidayCents },
      input.netEstimate,
    ),
    basisProvenance: {
      contractualGross: prov(input.netEstimate ? 'ESTIMATE' : 'USER_PROVIDED', grossSource),
      fiscalWage: prov(estimateKind, fiscalSource),
      box1: prov(estimateKind, 'DERIVED_FROM_FISCAL_WAGE'),
      aggregate: prov(estimateKind, 'DERIVED_FROM_FISCAL_WAGE'),
      arbeidsinkomen: prov(estimateKind, 'DERIVED_FROM_GROSS_EMPLOYMENT'),
      assessment: prov(estimateKind, 'DERIVED_FROM_FISCAL_WAGE'),
      zvwUsed: prov('DERIVED', 'DERIVED_FROM_FISCAL_WAGE'),
    },
  };
}

function advancedSummaryPrecedence(input: {
  gross: number | null;
  box1: number | null;
  aggregate: number | null;
  arbeids: number | null;
  assessment: number | null;
}): IncomeSourcePrecedence {
  const hasFiscal =
    input.gross != null || input.box1 != null || input.aggregate != null || input.arbeids != null;
  const hasAssessment = input.assessment != null;
  if (hasFiscal && hasAssessment) return 'KNOWN_FISCAL_ASSESSMENT';
  if (hasAssessment) return 'KNOWN_ASSESSMENT_INCOME';
  if (hasFiscal) return 'KNOWN_FISCAL_WAGE';
  return 'KNOWN_FISCAL_ASSESSMENT';
}

/**
 * Advanced jaaropgave fields win per basis. Known assessment never overwrites
 * Box 1. Known fiscal wage never overwrites independently known assessment.
 * Holiday pay is never added on top of advanced fiscal fields.
 */
export function deriveIncomeBasesFromUserFacts(state: WizardState): DerivedIncomeBases {
  const period = state.amountEntryPeriod;
  const advancedGross = annualizeWizardEuro(state.baselineGrossEmploymentEuro, period);
  const advancedBox1 = annualizeWizardEuro(state.baselineBox1Euro, period);
  const advancedAggregate = annualizeWizardEuro(state.baselineAggregateEuro, period);
  const advancedArbeids = annualizeWizardEuro(state.baselineArbeidsinkomenEuro, period);
  const advancedAssessment = annualizeWizardEuro(state.baselineAssessmentEuro, period);
  const advancedZvw = annualizeWizardEuro(state.baselineZvwUsedEuro, period);
  const hasAdvanced =
    advancedGross != null ||
    advancedBox1 != null ||
    advancedAggregate != null ||
    advancedArbeids != null ||
    advancedAssessment != null ||
    advancedZvw != null;

  if (hasAdvanced) {
    const fiscalWage = advancedBox1 ?? advancedGross;
    return {
      contractualGrossEmploymentIncomeCents: advancedGross,
      fiscalWageCents: fiscalWage,
      baselineGrossEmploymentIncomeCents: advancedGross,
      baselineBox1TaxableIncomeCents: advancedBox1,
      baselineAggregateIncomeCents: advancedAggregate,
      baselineArbeidsinkomenCents: advancedArbeids,
      baselineAssessmentIncomeCents: advancedAssessment,
      householdAssessmentIncomeCents: householdAssessment(advancedAssessment, state),
      baselineZvwContributionIncomeAlreadyUsedCents: advancedZvw,
      derivation: 'ADVANCED',
      netToGrossMethod: null,
      netToGrossConfidence: null,
      holidayPayUnresolved: false,
      holidayPayCents: null,
      incomeSourcePrecedence: advancedSummaryPrecedence({
        gross: advancedGross,
        box1: advancedBox1,
        aggregate: advancedAggregate,
        arbeids: advancedArbeids,
        assessment: advancedAssessment,
      }),
      basisProvenance: {
        contractualGross:
          advancedGross != null
            ? prov('USER_PROVIDED', 'KNOWN_GROSS_EMPLOYMENT')
            : UNKNOWN_PROV,
        fiscalWage:
          fiscalWage != null ? prov('USER_PROVIDED', 'KNOWN_FISCAL_WAGE') : UNKNOWN_PROV,
        box1: advancedBox1 != null ? prov('USER_PROVIDED', 'KNOWN_FISCAL_WAGE') : UNKNOWN_PROV,
        aggregate:
          advancedAggregate != null ? prov('USER_PROVIDED', 'KNOWN_FISCAL_WAGE') : UNKNOWN_PROV,
        arbeidsinkomen:
          advancedArbeids != null ? prov('USER_PROVIDED', 'KNOWN_FISCAL_WAGE') : UNKNOWN_PROV,
        assessment:
          advancedAssessment != null
            ? prov('USER_PROVIDED', 'KNOWN_ASSESSMENT_INCOME')
            : UNKNOWN_PROV,
        zvwUsed:
          advancedZvw != null ? prov('USER_PROVIDED', 'KNOWN_FISCAL_WAGE') : UNKNOWN_PROV,
      },
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
    return deriveEmployeeEstimate({
      contractualCents: inverted.grossCents,
      reconstructedAnnual: reconstructed.annualCents,
      holidayCents: reconstructed.holidayCents,
      derivation: 'NET_EMPLOYMENT_ESTIMATE',
      netEstimate: true,
      state,
      reconstructionStatus: reconstructed.status,
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
    return deriveEmployeeEstimate({
      contractualCents: current,
      reconstructedAnnual: reconstructed.annualCents,
      holidayCents: reconstructed.holidayCents,
      derivation: 'EMPLOYMENT_PROXY',
      netEstimate: false,
      state,
      reconstructionStatus: reconstructed.status,
    });
  }

  return {
    ...emptyBases('PARTIAL'),
    contractualGrossEmploymentIncomeCents: current,
    baselineGrossEmploymentIncomeCents: reconstructed.annualCents,
    holidayPayUnresolved: reconstructed.unresolved,
    holidayPayCents: reconstructed.holidayCents || null,
    incomeSourcePrecedence: 'PARTIAL',
    basisProvenance: {
      ...unknownProvenance(),
      contractualGross: prov('USER_PROVIDED', 'KNOWN_GROSS_EMPLOYMENT'),
    },
  };
}

export function countDirectTaxFieldsInDefaultUi(): number {
  return 0;
}

export function countDirectTaxFieldsInAdvancedUi(): number {
  return 6;
}
