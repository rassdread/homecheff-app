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
  annualPensionFiscalAdjustmentCents,
  calculateEmployeePayslip2026,
  invertEmployeePayslipNet2026,
  type PayslipNetKind,
  type PayslipPensionStatus,
} from '../rulesets/nl/2026/employee-payslip';
import {
  annualEmploymentExtrasCents,
  thirteenthMonthFromContractualMonth,
  type EmploymentExtraPayResult,
  type EmploymentExtraPayStatus,
} from '../rulesets/nl/2026/employment-extras';
import {
  calculateCompanyCarAddition2026,
  companyCarOwnContributionMonthlyCents,
  type CompanyCarCategory,
  type CompanyCarOwnContributionStatus,
  type CompanyCarPrivateUse,
  type CompanyCarResult,
  type CompanyCarStatus,
  type CompanyCarYearMonth,
} from '../rulesets/nl/2026/company-car';
import {
  PAYROLL_FORWARD_MODEL,
  PAYROLL_INVERSE_MODEL,
  resolvePayrollTaxCredit,
  type PayrollTaxCreditChoice,
} from '../rulesets/nl/2026/payroll-white-monthly';
import { hasAdvancedFiscalIncome, reconstructAnnualWithHolidayPay, shouldAskHolidayPay } from './holiday-pay';
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
  bankNetMonthlyCents: number | null;
  withheldPayrollTaxCents: number | null;
  tabelloonCents: number | null;
  employeePensionCents: number | null;
  pensionStatus: PayslipPensionStatus;
  pensionExplicitZero: boolean;
  otherBankDeductionCents: number;
  companyCarAdditionCents: number;
  companyCarOwnContributionCents: number;
  employeeZvwCents: number;
  differenceCents: number | null;
  iterations: number | null;
  method: typeof PAYROLL_FORWARD_MODEL | typeof PAYROLL_INVERSE_MODEL | null;
  provenance: 'ESTIMATE' | 'DERIVED' | 'NONE';
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
  /**
   * Taxable employment pay beside the regular salary (13th month, bonus,
   * commission, taxable overtime). Null when not asked, not supplied or
   * unknown — never a factual zero.
   */
  employmentExtrasCents: number | null;
  employmentExtras: EmploymentExtraPayResult;
  /**
   * Annual taxable bijtelling privégebruik auto after the qualifying own
   * contribution. It raises the fiscal wage only — it is never cash salary.
   */
  companyCarTaxableAnnualCents: number | null;
  companyCar: CompanyCarResult;
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
    bankNetMonthlyCents: null,
    withheldPayrollTaxCents: null,
    tabelloonCents: null,
    employeePensionCents: null,
    pensionStatus: 'NOT_SUPPLIED',
    pensionExplicitZero: false,
    otherBankDeductionCents: 0,
    companyCarAdditionCents: 0,
    companyCarOwnContributionCents: 0,
    employeeZvwCents: 0,
    differenceCents: null,
    iterations: null,
    method: null,
    provenance: 'NONE',
  };
}

export function wizardPayslipInputs(state: WizardState): {
  pensionStatus: PayslipPensionStatus;
  employeePensionCents: number | null;
  otherBankDeductionCents: number;
  netKind: PayslipNetKind;
} {
  let pensionStatus: PayslipPensionStatus = 'NOT_SUPPLIED';
  let employeePensionCents: number | null = null;
  if (state.pensionDeductionStatus === 'NONE') {
    pensionStatus = 'NONE';
    employeePensionCents = 0;
  } else if (state.pensionDeductionStatus === 'UNKNOWN') {
    pensionStatus = 'UNKNOWN';
  } else if (state.pensionDeductionStatus === 'AMOUNT') {
    const cents = parseEuroInputToCents(state.pensionDeductionEuro);
    if (cents == null) {
      pensionStatus = 'UNKNOWN';
    } else {
      pensionStatus = 'AMOUNT';
      employeePensionCents = cents;
    }
  }
  const other = parseEuroInputToCents(state.otherPayslipDeductionEuro);
  const netKind: PayslipNetKind =
    state.netDepositKind === 'BANK_NET' ||
    state.netDepositKind === 'STATUTORY_NET' ||
    state.netDepositKind === 'UNKNOWN'
      ? state.netDepositKind
      : 'UNKNOWN';
  return {
    pensionStatus,
    employeePensionCents,
    otherBankDeductionCents: other ?? 0,
    netKind,
  };
}

/**
 * Employment extras are annual gross amounts from the payslip/contract, so they
 * are never reconstructed from a net figure and never carry a pension
 * deduction. They are skipped when the user supplied annual fiscal facts,
 * because a known jaaropgave already contains them.
 */
export function wizardEmploymentExtras(
  state: WizardState,
  options?: { contractualGrossMonthlyCents?: number | null },
): EmploymentExtraPayResult {
  if (hasAdvancedFiscalIncome(state) || state.currentIncomeUnknown) {
    return annualEmploymentExtrasCents({ status: 'NOT_SUPPLIED' });
  }
  const status: EmploymentExtraPayStatus =
    state.extraPayStatus === 'NONE' ||
    state.extraPayStatus === 'PROVIDED' ||
    state.extraPayStatus === 'UNKNOWN'
      ? state.extraPayStatus
      : 'NOT_SUPPLIED';
  if (status !== 'PROVIDED') return annualEmploymentExtrasCents({ status });

  let thirteenth: number | null = null;
  if (state.thirteenthMonthMode === 'ONE_MONTH') {
    const gross = contractualGrossMonthlyForExtras(
      state,
      options?.contractualGrossMonthlyCents ?? null,
    );
    thirteenth = gross == null ? null : thirteenthMonthFromContractualMonth(gross);
  } else if (state.thirteenthMonthMode === 'AMOUNT') {
    thirteenth = parseEuroInputToCents(state.thirteenthMonthEuro);
  } else if (state.thirteenthMonthMode === 'NONE') {
    thirteenth = 0;
  }
  return annualEmploymentExtrasCents({
    status,
    thirteenthMonthAnnualCents: thirteenth,
    bonusCommissionAnnualCents: parseEuroInputToCents(state.bonusCommissionEuro),
    overtimeOtherAnnualCents: parseEuroInputToCents(state.overtimeOtherPayEuro),
  });
}

function companyCarYearMonth(rawYear: string, rawMonth: string): CompanyCarYearMonth | null {
  const year = Number.parseInt(rawYear.trim(), 10);
  const month = Number.parseInt(rawMonth.trim(), 10);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  return { year, month };
}

/**
 * The bijtelling is a taxable benefit on top of the contractual wage. It is
 * skipped when the user supplied annual fiscal facts, because a known
 * jaaropgave already contains kolom 4.
 */
export function wizardCompanyCar(state: WizardState): CompanyCarResult {
  if (hasAdvancedFiscalIncome(state) || state.currentIncomeUnknown) {
    return calculateCompanyCarAddition2026({ status: 'NOT_SUPPLIED' });
  }
  const status: CompanyCarStatus =
    state.companyCarStatus === 'NONE' ||
    state.companyCarStatus === 'PROVIDED' ||
    state.companyCarStatus === 'UNKNOWN'
      ? state.companyCarStatus
      : 'NOT_SUPPLIED';
  if (status !== 'PROVIDED') return calculateCompanyCarAddition2026({ status });

  const privateUse: CompanyCarPrivateUse = state.companyCarPrivateUse ?? 'UNKNOWN';
  const category: CompanyCarCategory = state.companyCarCategory ?? 'UNKNOWN';
  const ownStatus: CompanyCarOwnContributionStatus =
    state.companyCarOwnContributionStatus === 'NONE' ||
    state.companyCarOwnContributionStatus === 'AMOUNT' ||
    state.companyCarOwnContributionStatus === 'UNKNOWN'
      ? state.companyCarOwnContributionStatus
      : 'NOT_SUPPLIED';
  const value = parseEuroInputToCents(state.companyCarValueEuro);
  return calculateCompanyCarAddition2026({
    status,
    privateUse,
    vehicleCategory: category,
    firstAdmission: companyCarYearMonth(
      state.companyCarFirstAdmissionYear,
      state.companyCarFirstAdmissionMonth,
    ),
    firstRegistrationNl: companyCarYearMonth(
      state.companyCarFirstRegistrationYear,
      state.companyCarFirstRegistrationMonth,
    ),
    catalogueValueCents: value,
    marketValueCents: value,
    availableSince2025:
      state.companyCarAvailableSince2025 === 'YES'
        ? true
        : state.companyCarAvailableSince2025 === 'NO'
          ? false
          : null,
    ownContributionStatus: ownStatus,
    ownContributionAnnualCents: parseEuroInputToCents(state.companyCarOwnContributionEuro),
  });
}

export function shouldOfferCompanyCar(state: WizardState): boolean {
  return shouldOfferEmploymentExtras(state);
}

/** True when the youngtimer route applies, so the market value is asked instead. */
export function companyCarUsesMarketValue(state: WizardState): boolean {
  const year = Number.parseInt(state.companyCarFirstAdmissionYear.trim(), 10);
  if (!Number.isInteger(year)) return false;
  if (year < 2010) return true;
  return year === 2010 && state.companyCarAvailableSince2025 === 'YES';
}

/** The datum 1e tenaamstelling only matters before 2017 and for youngtimers. */
export function companyCarNeedsRegistrationDate(state: WizardState): boolean {
  const year = Number.parseInt(state.companyCarFirstAdmissionYear.trim(), 10);
  if (!Number.isInteger(year)) return false;
  const zeroEmission =
    state.companyCarCategory === 'ZERO_EMISSION' ||
    state.companyCarCategory === 'HYDROGEN' ||
    state.companyCarCategory === 'QUALIFYING_SOLAR';
  if (!zeroEmission) return false;
  return year < 2017;
}

export function companyCarAsksTransitionalYoungtimer(state: WizardState): boolean {
  return Number.parseInt(state.companyCarFirstAdmissionYear.trim(), 10) === 2010;
}

/** A "Ja" answer needs enough facts to apply an official 2026 rule. */
export function companyCarEntryValid(state: WizardState): boolean {
  if (state.companyCarStatus !== 'PROVIDED') return true;
  if (state.companyCarPrivateUse == null) return false;
  if (state.companyCarPrivateUse !== 'OVER_500') return true;
  if (state.companyCarCategory == null) return false;
  if (companyCarYearMonth(state.companyCarFirstAdmissionYear, state.companyCarFirstAdmissionMonth) == null) {
    return false;
  }
  if (
    companyCarNeedsRegistrationDate(state) &&
    companyCarYearMonth(
      state.companyCarFirstRegistrationYear,
      state.companyCarFirstRegistrationMonth,
    ) == null
  ) {
    return false;
  }
  if (companyCarAsksTransitionalYoungtimer(state) && state.companyCarAvailableSince2025 == null) {
    return false;
  }
  if (parseEuroInputToCents(state.companyCarValueEuro) == null) return false;
  if (state.companyCarOwnContributionStatus == null) return false;
  if (
    state.companyCarOwnContributionStatus === 'AMOUNT' &&
    parseEuroInputToCents(state.companyCarOwnContributionEuro) == null
  ) {
    return false;
  }
  return true;
}

export function shouldOfferEmploymentExtras(state: WizardState): boolean {
  if (state.currentIncomeUnknown) return false;
  if (hasAdvancedFiscalIncome(state)) return false;
  if (state.ageTaxRegime !== 'BELOW_AOW_2026') return false;
  if (state.hasOtherIncome !== false) return false;
  return state.situationGroup === 'EMPLOYEE' || state.situationGroup === 'NONE';
}

function contractualGrossMonthlyForExtras(
  state: WizardState,
  override: number | null,
): number | null {
  if (override != null) return override;
  if (state.currentIncomeBasis !== 'NET') {
    const annual = annualizeWizardEuro(state.currentIncomeEuro, state.currentIncomePeriod);
    return annual == null ? null : Math.round(annual / 12);
  }
  const payroll = payrollFromCurrentIncome(state);
  return payroll.used ? payroll.estimatedGrossMonthlyCents : null;
}

export function thirteenthMonthHelperAvailable(state: WizardState): boolean {
  return contractualGrossMonthlyForExtras(state, null) != null;
}

/** A "Ja" answer needs at least one component we can actually use. */
export function employmentExtrasEntryValid(state: WizardState): boolean {
  const amountInvalid = (raw: string) =>
    raw.trim() !== '' && parseEuroInputToCents(raw) == null;
  if (amountInvalid(state.bonusCommissionEuro)) return false;
  if (amountInvalid(state.overtimeOtherPayEuro)) return false;
  if (state.thirteenthMonthMode === 'AMOUNT' && parseEuroInputToCents(state.thirteenthMonthEuro) == null) {
    return false;
  }
  const thirteenthKnown =
    state.thirteenthMonthMode === 'NONE' ||
    state.thirteenthMonthMode === 'AMOUNT' ||
    (state.thirteenthMonthMode === 'ONE_MONTH' && thirteenthMonthHelperAvailable(state));
  return (
    thirteenthKnown ||
    state.bonusCommissionEuro.trim() !== '' ||
    state.overtimeOtherPayEuro.trim() !== ''
  );
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

export function shouldOfferPayslipAccuracy(state: WizardState): boolean {
  return payrollWhiteMonthlyEligible(state).ok;
}

export function shouldAskNetDepositKind(state: WizardState): boolean {
  return shouldAskPayrollTaxCredit(state) && state.currentIncomeBasis === 'NET';
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
  const payslip = wizardPayslipInputs(state);
  const car = wizardCompanyCar(state);
  const carMonthly = car.taxableAdditionMonthlyCents ?? 0;
  const carOwnMonthly = companyCarOwnContributionMonthlyCents(car);
  if (basis === 'GROSS') {
    const forward = calculateEmployeePayslip2026({
      contractualGrossMonthlyCents: monthlyCents,
      payrollTaxCredit: resolved.applied,
      pensionStatus: payslip.pensionStatus,
      employeePensionCents: payslip.employeePensionCents,
      otherBankDeductionCents: payslip.otherBankDeductionCents,
      companyCarAdditionCents: carMonthly,
      companyCarOwnContributionCents: carOwnMonthly,
    });
    if (forward.status !== 'OK') {
      return {
        ...unusedPayroll(forward.reason, true),
        payrollTaxCreditChoice: assumptionsCredit,
        payrollTaxCreditApplied: resolved.applied,
        payrollTaxCreditAssumed: resolved.assumed,
        pensionStatus: payslip.pensionStatus,
        employeePensionCents: payslip.employeePensionCents,
        otherBankDeductionCents: payslip.otherBankDeductionCents,
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
      bankNetMonthlyCents: forward.bankNetMonthlyCents,
      withheldPayrollTaxCents: forward.withheldPayrollTaxCents,
      tabelloonCents: forward.tabelloonCents,
      employeePensionCents: forward.employeePensionCents,
      pensionStatus: forward.pensionStatus,
      pensionExplicitZero: forward.pensionExplicitZero,
      otherBankDeductionCents: forward.otherBankDeductionCents,
      companyCarAdditionCents: forward.companyCarAdditionCents,
      companyCarOwnContributionCents: forward.companyCarOwnContributionCents,
      employeeZvwCents: 0,
      differenceCents: 0,
      iterations: null,
      method: PAYROLL_FORWARD_MODEL,
      provenance: forward.provenance,
    };
  }

  const inverted = invertEmployeePayslipNet2026({
    targetNetMonthlyCents: monthlyCents,
    netKind: payslip.netKind,
    payrollTaxCredit: resolved.applied,
    pensionStatus: payslip.pensionStatus,
    employeePensionCents: payslip.employeePensionCents,
    otherBankDeductionCents: payslip.otherBankDeductionCents,
    companyCarAdditionCents: carMonthly,
    companyCarOwnContributionCents: carOwnMonthly,
  });
  if (inverted.status !== 'OK') {
    return {
      ...unusedPayroll(inverted.reason, true),
      payrollTaxCreditChoice: assumptionsCredit,
      payrollTaxCreditApplied: resolved.applied,
      payrollTaxCreditAssumed: resolved.assumed,
      pensionStatus: payslip.pensionStatus,
      employeePensionCents: payslip.employeePensionCents,
      otherBankDeductionCents: payslip.otherBankDeductionCents,
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
    statutoryNetMonthlyCents: inverted.statutoryNetMonthlyCents,
    bankNetMonthlyCents: inverted.bankNetMonthlyCents,
    withheldPayrollTaxCents: inverted.withheldPayrollTaxCents,
    tabelloonCents: inverted.tabelloonCents,
    employeePensionCents: inverted.employeePensionCents,
    pensionStatus: inverted.pensionStatus,
    pensionExplicitZero: payslip.pensionStatus === 'NONE',
    otherBankDeductionCents: inverted.otherBankDeductionCents,
    companyCarAdditionCents: inverted.companyCarAdditionCents,
    companyCarOwnContributionCents: inverted.companyCarOwnContributionCents,
    employeeZvwCents: 0,
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
    employmentExtrasCents: null,
    employmentExtras: annualEmploymentExtrasCents({ status: 'NOT_SUPPLIED' }),
    companyCarTaxableAnnualCents: null,
    companyCar: calculateCompanyCarAddition2026({ status: 'NOT_SUPPLIED' }),
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
  employmentExtras: EmploymentExtraPayResult;
  companyCar: CompanyCarResult;
}): DerivedIncomeBases {
  const estimateKind: IncomeAmountProvenanceKind = input.netEstimate ? 'ESTIMATE' : 'DERIVED';
  const payrollUsed = input.payroll.used;
  // Taxable extras are annual employment wage (Handboek Loonheffingen 2026,
  // kolom 3 → kolom 14), so they join the salary before the pension aftrekpost.
  const extras = input.employmentExtras;
  const annual = input.reconstructedAnnual + extras.totalAnnualCents;
  // The bijtelling is loon anders dan in geld (kolom 4). It belongs to the
  // fiscal wage but never to the cash wage, so it is added here and not to
  // `annual`, which drives the gross-salary presentation.
  const car = input.companyCar;
  const carAnnual = car.taxableAdditionAnnualCents ?? 0;
  const pensionAdj = annualPensionFiscalAdjustmentCents({
    pensionStatus: input.payroll.pensionStatus,
    employeePensionCents: input.payroll.employeePensionCents,
  });
  const fiscal = Math.max(0, annual + carAnnual - pensionAdj.cents);
  const fiscalKind: IncomeAmountProvenanceKind =
    pensionAdj.estimate || extras.unknown || car.unknown || car.ownContributionUnknown
      ? 'ESTIMATE'
      : estimateKind;
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
    fiscalWageCents: fiscal,
    baselineGrossEmploymentIncomeCents: annual,
    baselineBox1TaxableIncomeCents: fiscal,
    baselineAggregateIncomeCents: fiscal,
    // Arbeidsinkomen is taxable wage from current employment (art. 8.1 Wet IB
    // 2001). Employee pension reduces the taxable wage, so this basis follows
    // the fiscal wage, not the contractual gross.
    baselineArbeidsinkomenCents: fiscal,
    baselineAssessmentIncomeCents: fiscal,
    householdAssessmentIncomeCents: householdAssessment(fiscal, input.state),
    baselineZvwContributionIncomeAlreadyUsedCents: fiscal,
    derivation: input.derivation,
    netToGrossMethod: method,
    netToGrossConfidence: input.netEstimate ? 'ESTIMATE' : null,
    holidayPayUnresolved: false,
    holidayPayCents: input.holidayCents || null,
    employmentExtrasCents: extras.provided || extras.explicitNone ? extras.totalAnnualCents : null,
    employmentExtras: extras,
    companyCarTaxableAnnualCents: car.taxableAdditionAnnualCents,
    companyCar: car,
    incomeSourcePrecedence: holidayPrecedence(
      input.state,
      { status: input.reconstructionStatus, holidayCents: input.holidayCents },
      input.netEstimate,
      payrollUsed,
    ),
    basisProvenance: {
      contractualGross: prov(input.netEstimate ? 'ESTIMATE' : 'USER_PROVIDED', grossSource),
      fiscalWage: prov(fiscalKind, fiscalSource),
      box1: prov(fiscalKind, 'DERIVED_FROM_FISCAL_WAGE'),
      aggregate: prov(fiscalKind, 'DERIVED_FROM_FISCAL_WAGE'),
      arbeidsinkomen: prov(fiscalKind, 'DERIVED_FROM_GROSS_EMPLOYMENT'),
      assessment: prov(fiscalKind, 'DERIVED_FROM_FISCAL_WAGE'),
      zvwUsed: prov(pensionAdj.estimate ? 'ESTIMATE' : 'DERIVED', 'DERIVED_FROM_FISCAL_WAGE'),
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
  // Jaaropgave / aangifte fields are annual. Do not reuse amountEntryPeriod
  // (scenario turnover month/year) — that would ×12 a known toetsingsinkomen.
  const advancedGross = annualizeWizardEuro(state.baselineGrossEmploymentEuro, 'YEAR');
  const advancedBox1 = annualizeWizardEuro(state.baselineBox1Euro, 'YEAR');
  const advancedAggregate = annualizeWizardEuro(state.baselineAggregateEuro, 'YEAR');
  const advancedArbeids = annualizeWizardEuro(state.baselineArbeidsinkomenEuro, 'YEAR');
  const advancedAssessment = annualizeWizardEuro(state.baselineAssessmentEuro, 'YEAR');
  const advancedZvw = annualizeWizardEuro(state.baselineZvwUsedEuro, 'YEAR');
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
      // A known jaaropgave already contains 13th month, bonus, overtime and
      // the bijtelling in kolom 4. Adding those fields again would double
      // count them.
      employmentExtrasCents: null,
      employmentExtras: annualEmploymentExtrasCents({ status: 'NOT_SUPPLIED' }),
      companyCarTaxableAnnualCents: null,
      companyCar: calculateCompanyCarAddition2026({ status: 'NOT_SUPPLIED' }),
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
      employmentExtras: wizardEmploymentExtras(state, {
        contractualGrossMonthlyCents: Math.round(contractual / 12),
      }),
      companyCar: wizardCompanyCar(state),
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
      employmentExtras: wizardEmploymentExtras(state),
      companyCar: wizardCompanyCar(state),
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
