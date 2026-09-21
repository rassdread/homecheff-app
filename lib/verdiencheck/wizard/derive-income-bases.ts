/**
 * User-known money facts → calculator income bases.
 * Never maps UNKNOWN to 0. Never claims gross == box1 == verzamelinkomen.
 *
 * Payroll withholding is an input/derivation layer only. It does not replace
 * the certified annual Box 1 engine, and 12× withholding is never added as
 * a second tax cost.
 *
 * NET salary is inverted via the official 2026 white monthly table when the
 * Phase-3 employee route applies; otherwise via annual IB/credits. Never
 * treat net as taxable income.
 *
 * Holiday pay is reconstructed only for employee-like current income, never on
 * advanced fiscal/jaaropgave fields.
 */

import { parseEuroInputToCents } from '../domain/money';
import { estimateGrossFromNetSalary2026 } from '../nl2026/net-to-gross';
import {
  ownerHomeShareBps,
  resolveHousingTenure,
} from '../domain/housing';
import {
  calculateOwnerOccupiedHome2026,
  type OwnerOccupiedHomeResult,
} from '../rulesets/nl/2026/owner-occupied-home';
import {
  calculateEmployeePayroll2026,
  invertEmployeePayrollNet2026,
  PAYROLL_FORWARD_MODEL,
  PAYROLL_INVERSE_MODEL,
  resolvePayrollTaxCredit,
  type PayrollTaxCreditChoice,
} from '../rulesets/nl/2026/payroll-white-monthly';
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
  | 'PAYROLL_WHITE_MONTHLY_2026_PLUS_HOLIDAY'
  | 'PAYROLL_WHITE_MONTHLY_2026'
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
  | 'PAYROLL_WHITE_MONTHLY_2026'
  | 'NET_TO_GROSS_ESTIMATE'
  | 'EMPLOYMENT_ESTIMATE'
  | 'DERIVED_FROM_FISCAL_WAGE'
  | 'DERIVED_FROM_GROSS_EMPLOYMENT'
  | 'OWNER_OCCUPIED_HOME_2026'
  | 'UNKNOWN';

export type NetToGrossMethod =
  | 'BINARY_SEARCH_ANNUAL_IB_CREDITS'
  | 'WHITE_MONTHLY_TABLE_2026_INVERSE'
  | 'WHITE_MONTHLY_TABLE_2026_FORWARD'
  | null;

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

export type PayrollSnapshot = {
  used: boolean;
  eligible: boolean;
  fallbackReason: string | null;
  payrollTaxCreditChoice: PayrollTaxCreditChoice | null;
  payrollTaxCreditApplied: boolean;
  payrollTaxCreditAssumed: boolean;
  estimatedGrossMonthlyCents: number | null;
  statutoryNetMonthlyCents: number | null;
  withheldPayrollTaxCents: number | null;
  tabelloonCents: number | null;
  employeeZvwCents: number;
  differenceCents: number | null;
  iterations: number | null;
  method: typeof PAYROLL_FORWARD_MODEL | typeof PAYROLL_INVERSE_MODEL | null;
  provenance: 'ESTIMATE' | 'NONE';
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
  netToGrossMethod: NetToGrossMethod;
  netToGrossConfidence: 'ESTIMATE' | 'NONE' | null;
  holidayPayUnresolved: boolean;
  holidayPayCents: number | null;
  /** Summary of the derivation path. Per-basis truth lives in `basisProvenance`. */
  incomeSourcePrecedence: IncomeSourcePrecedence;
  basisProvenance: IncomeBasesProvenance;
  payroll: PayrollSnapshot;
  ownerHome: OwnerOccupiedHomeResult;
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

function unusedPayroll(reason: string | null, eligible = false): PayrollSnapshot {
  const resolved = resolvePayrollTaxCredit(null);
  return {
    used: false,
    eligible,
    fallbackReason: reason,
    payrollTaxCreditChoice: null,
    payrollTaxCreditApplied: resolved.applied,
    payrollTaxCreditAssumed: resolved.assumed,
    estimatedGrossMonthlyCents: null,
    statutoryNetMonthlyCents: null,
    withheldPayrollTaxCents: null,
    tabelloonCents: null,
    employeeZvwCents: 0,
    differenceCents: null,
    iterations: null,
    method: null,
    provenance: 'NONE',
  };
}

function unusedOwnerHome(): OwnerOccupiedHomeResult {
  return calculateOwnerOccupiedHome2026({
    tenure: null,
    wozCents: null,
    interestStatus: null,
    deductibleInterestCents: null,
    shareBps: 10_000,
    shareAssumed: false,
    knownBox1: false,
    knownAssessment: false,
  });
}

export function ownerHomeFromWizard(
  state: WizardState,
  known: { box1: boolean; assessment: boolean },
): OwnerOccupiedHomeResult {
  const tenure = resolveHousingTenure(state);
  const share = ownerHomeShareBps({
    share: state.ownerHomeShare,
    customPercent: state.ownerHomeSharePercent,
    hasPartner: state.hasPartner,
  });
  return calculateOwnerOccupiedHome2026({
    tenure,
    wozCents: parseEuroInputToCents(state.wozValueEuro),
    interestStatus: state.mortgageInterestStatus,
    deductibleInterestCents: parseEuroInputToCents(state.deductibleMortgageInterestEuro),
    shareBps: share.bps,
    shareAssumed: share.assumed,
    knownBox1: known.box1,
    knownAssessment: known.assessment,
  });
}

function applyOwnerHome(bases: DerivedIncomeBases, state: WizardState): DerivedIncomeBases {
  const ownerHome = ownerHomeFromWizard(state, {
    box1: bases.basisProvenance.box1.kind === 'USER_PROVIDED',
    assessment: bases.basisProvenance.assessment.kind === 'USER_PROVIDED',
  });
  const adj = ownerHome.netOwnHomeBox1AdjustmentCents;
  if (adj == null || !ownerHome.applyToBox1) {
    return { ...bases, ownerHome };
  }

  const fiscal = bases.fiscalWageCents;
  let box1 = bases.baselineBox1TaxableIncomeCents;
  if (box1 == null && fiscal != null) box1 = fiscal;
  if (box1 == null) return { ...bases, ownerHome };
  box1 += adj;

  const aggregateUser = bases.basisProvenance.aggregate.kind === 'USER_PROVIDED';
  const assessmentUser = bases.basisProvenance.assessment.kind === 'USER_PROVIDED';
  const aggregate = aggregateUser ? bases.baselineAggregateIncomeCents : box1;
  const assessment = assessmentUser
    ? bases.baselineAssessmentIncomeCents
    : ownerHome.applyToAssessment
      ? box1
      : bases.baselineAssessmentIncomeCents;
  const ownerKind: IncomeAmountProvenanceKind =
    ownerHome.provenance === 'EXACT_RULE' ? 'DERIVED' : 'ESTIMATE';
  const box1Prov = prov(ownerKind, 'OWNER_OCCUPIED_HOME_2026');
  return {
    ...bases,
    baselineBox1TaxableIncomeCents: box1,
    baselineAggregateIncomeCents: aggregate,
    baselineAssessmentIncomeCents: assessment,
    householdAssessmentIncomeCents: householdAssessment(assessment, state),
    basisProvenance: {
      ...bases.basisProvenance,
      box1: box1Prov,
      aggregate: aggregateUser ? bases.basisProvenance.aggregate : box1Prov,
      assessment: assessmentUser ? bases.basisProvenance.assessment : box1Prov,
    },
    ownerHome,
  };
}

export function shouldAskPayrollTaxCredit(state: WizardState): boolean {
  if (state.currentIncomeUnknown) return false;
  if (state.currentIncomePeriod !== 'MONTH') return false;
  if (state.ageTaxRegime !== 'BELOW_AOW_2026') return false;
  if (state.hasOtherIncome === true) return false;
  return state.situationGroup === 'EMPLOYEE' || state.situationGroup === 'NONE';
}

export function payrollWhiteMonthlyEligible(state: WizardState): {
  ok: boolean;
  reason: string | null;
} {
  if (state.currentIncomeUnknown) return { ok: false, reason: 'INCOME_UNKNOWN' };
  if (state.currentIncomePeriod !== 'MONTH') return { ok: false, reason: 'NOT_MONTHLY' };
  if (state.ageTaxRegime !== 'BELOW_AOW_2026') return { ok: false, reason: 'NOT_BELOW_AOW' };
  if (state.hasOtherIncome === true) return { ok: false, reason: 'OTHER_INCOME' };
  if (state.hasOtherIncome !== false) return { ok: false, reason: 'OTHER_INCOME_UNRESOLVED' };
  if (!(state.situationGroup === 'EMPLOYEE' || state.situationGroup === 'NONE')) {
    return { ok: false, reason: 'NOT_EMPLOYEE_ROUTE' };
  }
  return { ok: true, reason: null };
}

function computePayrollSnapshot(
  state: WizardState,
  monthlyCents: number,
  basis: 'GROSS' | 'NET',
): PayrollSnapshot {
  const eligible = payrollWhiteMonthlyEligible(state);
  const resolved = resolvePayrollTaxCredit(state.payrollTaxCredit);
  if (!eligible.ok) {
    return {
      ...unusedPayroll(eligible.reason, false),
      payrollTaxCreditChoice: state.payrollTaxCredit,
      payrollTaxCreditApplied: resolved.applied,
      payrollTaxCreditAssumed: resolved.assumed,
    };
  }

  const assumptionsCredit: PayrollSnapshot['payrollTaxCreditChoice'] = resolved.choice;
  if (basis === 'GROSS') {
    const forward = calculateEmployeePayroll2026({
      grossMonthlyCents: monthlyCents,
      payrollTaxCredit: resolved.applied,
    });
    if (forward.status !== 'OK') {
      return {
        ...unusedPayroll(forward.reason, true),
        payrollTaxCreditChoice: assumptionsCredit,
        payrollTaxCreditApplied: resolved.applied,
        payrollTaxCreditAssumed: resolved.assumed,
      };
    }
    return {
      used: true,
      eligible: true,
      fallbackReason: null,
      payrollTaxCreditChoice: assumptionsCredit,
      payrollTaxCreditApplied: resolved.applied,
      payrollTaxCreditAssumed: resolved.assumed,
      estimatedGrossMonthlyCents: monthlyCents,
      statutoryNetMonthlyCents: forward.statutoryNetMonthlyCents,
      withheldPayrollTaxCents: forward.withheldPayrollTaxCents,
      tabelloonCents: forward.tabelloonCents,
      employeeZvwCents: forward.employeeZvwCents,
      differenceCents: 0,
      iterations: null,
      method: PAYROLL_FORWARD_MODEL,
      provenance: 'ESTIMATE',
    };
  }

  const inverted = invertEmployeePayrollNet2026({
    targetStatutoryNetMonthlyCents: monthlyCents,
    payrollTaxCredit: resolved.applied,
  });
  if (inverted.status !== 'OK') {
    return {
      ...unusedPayroll(inverted.reason, true),
      payrollTaxCreditChoice: assumptionsCredit,
      payrollTaxCreditApplied: resolved.applied,
      payrollTaxCreditAssumed: resolved.assumed,
    };
  }
  return {
    used: true,
    eligible: true,
    fallbackReason: null,
    payrollTaxCreditChoice: assumptionsCredit,
    payrollTaxCreditApplied: resolved.applied,
    payrollTaxCreditAssumed: resolved.assumed,
    estimatedGrossMonthlyCents: inverted.estimatedGrossMonthlyCents,
    statutoryNetMonthlyCents: inverted.calculatedNetAtSolutionCents,
    withheldPayrollTaxCents: inverted.withheldPayrollTaxCents,
    tabelloonCents: inverted.tabelloonCents,
    employeeZvwCents: inverted.employeeZvwCents,
    differenceCents: inverted.differenceCents,
    iterations: inverted.iterations,
    method: PAYROLL_INVERSE_MODEL,
    provenance: 'ESTIMATE',
  };
}

export function annualizeWizardEuro(
  raw: string,
  period: WizardState['amountEntryPeriod'] | WizardState['currentIncomePeriod'],
): number | null {
  const cents = parseEuroInputToCents(raw);
  if (cents == null) return null;
  return period === 'MONTH' ? cents * 12 : cents;
}

function emptyBases(derivation: IncomeBaseDerivation, payroll?: PayrollSnapshot): DerivedIncomeBases {
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
    payroll: payroll ?? unusedPayroll(derivation === 'UNKNOWN' ? 'UNKNOWN' : derivation),
    ownerHome: unusedOwnerHome(),
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
  payrollUsed: boolean,
): IncomeSourcePrecedence {
  if (reconstruction.status === 'INCLUDED' && state.currentIncomePeriod === 'YEAR') {
    return 'ANNUAL_GROSS_ALREADY_INCLUSIVE';
  }
  if (reconstruction.status === 'ADDED') {
    if (payrollUsed) return 'PAYROLL_WHITE_MONTHLY_2026_PLUS_HOLIDAY';
    return netEstimate
      ? 'NET_TO_GROSS_ESTIMATE_PLUS_HOLIDAY'
      : 'RECONSTRUCTED_MONTHLY_GROSS_PLUS_HOLIDAY';
  }
  if (payrollUsed) return 'PAYROLL_WHITE_MONTHLY_2026';
  if (netEstimate) return 'NET_TO_GROSS_ESTIMATE';
  return 'EMPLOYMENT_PROXY';
}

/**
 * Simple employee path: reconstructed annual gross may equal fiscal/box1/assessment
 * until housing/car exist. Each field is still independently derived.
 */
function deriveEmployeeEstimate(input: {
  contractualCents: number;
  reconstructedAnnual: number;
  holidayCents: number;
  derivation: Extract<IncomeBaseDerivation, 'EMPLOYMENT_PROXY' | 'NET_EMPLOYMENT_ESTIMATE'>;
  netEstimate: boolean;
  state: WizardState;
  reconstructionStatus: string;
  payroll: PayrollSnapshot;
}): DerivedIncomeBases {
  const annual = input.reconstructedAnnual;
  const estimateKind: IncomeAmountProvenanceKind = input.netEstimate ? 'ESTIMATE' : 'DERIVED';
  const payrollUsed = input.payroll.used;
  const grossSource: IncomeBasisSource = input.netEstimate
    ? payrollUsed
      ? 'PAYROLL_WHITE_MONTHLY_2026'
      : 'NET_TO_GROSS_ESTIMATE'
    : 'EMPLOYMENT_ESTIMATE';
  const fiscalSource: IncomeBasisSource = input.netEstimate
    ? payrollUsed
      ? 'PAYROLL_WHITE_MONTHLY_2026'
      : 'NET_TO_GROSS_ESTIMATE'
    : 'DERIVED_FROM_GROSS_EMPLOYMENT';
  const method: NetToGrossMethod = input.netEstimate
    ? payrollUsed
      ? 'WHITE_MONTHLY_TABLE_2026_INVERSE'
      : 'BINARY_SEARCH_ANNUAL_IB_CREDITS'
    : payrollUsed
      ? 'WHITE_MONTHLY_TABLE_2026_FORWARD'
      : null;
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
    netToGrossMethod: method,
    netToGrossConfidence: input.netEstimate ? 'ESTIMATE' : null,
    holidayPayUnresolved: false,
    holidayPayCents: input.holidayCents || null,
    incomeSourcePrecedence: holidayPrecedence(
      input.state,
      { status: input.reconstructionStatus, holidayCents: input.holidayCents },
      input.netEstimate,
      payrollUsed,
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
    payroll: input.payroll,
    ownerHome: unusedOwnerHome(),
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

function monthlyCurrentCents(state: WizardState): number | null {
  const cents = parseEuroInputToCents(state.currentIncomeEuro);
  if (cents == null) return null;
  if (state.currentIncomePeriod === 'MONTH') return cents;
  return null;
}

function payrollFromCurrentIncome(state: WizardState): PayrollSnapshot {
  const monthly = monthlyCurrentCents(state);
  const basis = state.currentIncomeBasis === 'NET' ? 'NET' : 'GROSS';
  if (monthly == null || state.currentIncomeUnknown) {
    return unusedPayroll('NO_MONTHLY_AMOUNT', payrollWhiteMonthlyEligible(state).ok);
  }
  return computePayrollSnapshot(state, monthly, basis);
}

/**
 * Advanced jaaropgave fields win per basis. Known assessment never overwrites
 * Box 1. Known fiscal wage never overwrites independently known assessment.
 * Holiday pay is never added on top of advanced fiscal fields.
 * Payroll may still estimate contractual monthly gross/net without replacing
 * stronger annual fiscal/assessment facts.
 */
export function deriveIncomeBasesFromUserFacts(state: WizardState): DerivedIncomeBases {
  return applyOwnerHome(deriveIncomeBasesCore(state), state);
}

function deriveIncomeBasesCore(state: WizardState): DerivedIncomeBases {
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

  const payroll = payrollFromCurrentIncome(state);
  const payrollContractualAnnual =
    payroll.used && payroll.estimatedGrossMonthlyCents != null
      ? payroll.estimatedGrossMonthlyCents * 12
      : null;

  if (hasAdvanced) {
    const fiscalWage = advancedBox1 ?? advancedGross;
    const contractual = advancedGross ?? payrollContractualAnnual;
    return {
      contractualGrossEmploymentIncomeCents: contractual,
      fiscalWageCents: fiscalWage,
      baselineGrossEmploymentIncomeCents: advancedGross,
      baselineBox1TaxableIncomeCents: advancedBox1,
      baselineAggregateIncomeCents: advancedAggregate,
      baselineArbeidsinkomenCents: advancedArbeids,
      baselineAssessmentIncomeCents: advancedAssessment,
      householdAssessmentIncomeCents: householdAssessment(advancedAssessment, state),
      baselineZvwContributionIncomeAlreadyUsedCents: advancedZvw,
      derivation: 'ADVANCED',
      netToGrossMethod: payroll.used
        ? payroll.method === PAYROLL_INVERSE_MODEL
          ? 'WHITE_MONTHLY_TABLE_2026_INVERSE'
          : 'WHITE_MONTHLY_TABLE_2026_FORWARD'
        : null,
      netToGrossConfidence: payroll.used ? 'ESTIMATE' : null,
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
            : payrollContractualAnnual != null
              ? prov('ESTIMATE', 'PAYROLL_WHITE_MONTHLY_2026')
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
      payroll,
      ownerHome: unusedOwnerHome(),
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
      return emptyBases('NET_UNRESOLVED', payroll);
    }
    const invertedAnnual = payroll.used && payroll.estimatedGrossMonthlyCents != null
      ? payroll.estimatedGrossMonthlyCents * 12
      : null;
    let contractual = invertedAnnual;
    let methodFallback = false;
    if (contractual == null) {
      methodFallback = true;
      const inverted = estimateGrossFromNetSalary2026({
        netAnnualCents: current,
        regime: state.ageTaxRegime,
        aowBirthCohort: state.aowBirthCohort,
      });
      if (inverted.status !== 'OK') {
        return emptyBases('NET_UNRESOLVED', payroll);
      }
      contractual = inverted.grossCents;
    }
    const reconstructed = reconstructAnnualWithHolidayPay(contractual, state);
    if (reconstructed.unresolved) {
      return {
        ...emptyBases('NET_UNRESOLVED', payroll),
        holidayPayUnresolved: true,
        incomeSourcePrecedence: 'UNKNOWN',
      };
    }
    return deriveEmployeeEstimate({
      contractualCents: contractual,
      reconstructedAnnual: reconstructed.annualCents,
      holidayCents: reconstructed.holidayCents,
      derivation: 'NET_EMPLOYMENT_ESTIMATE',
      netEstimate: true,
      state,
      reconstructionStatus: reconstructed.status,
      payroll: methodFallback ? { ...payroll, used: false, fallbackReason: payroll.fallbackReason ?? 'IB_CREDITS_FALLBACK' } : payroll,
    });
  }

  const reconstructed = reconstructAnnualWithHolidayPay(current, state);
  if (shouldAskHolidayPay(state) && reconstructed.unresolved) {
    return {
      ...emptyBases('UNKNOWN', payroll),
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
      payroll,
    });
  }

  return {
    ...emptyBases('PARTIAL', payroll),
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
