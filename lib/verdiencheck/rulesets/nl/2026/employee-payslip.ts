/**
 * Employee payslip layer on the frozen 2026 white monthly table.
 *
 * Official treatment (Handboek Loonheffingen 2026, kolom 7):
 * the employee pension contribution withheld by the employer is an
 * aftrekpost for all payroll taxes. It lowers loon voor de loonheffingen
 * (tabelloon) BEFORE loonheffing is calculated. Employer pension is not
 * an employee bank deduction.
 *
 * Other generic payslip deductions default to BANK_ONLY: they lower the
 * amount paid out, not tabelloon / fiscal wage.
 *
 * The bijtelling privégebruik auto works the other way round (§11.2.4 kolom 4,
 * §23.3.1): it raises tabelloon without being paid in cash, so the withholding
 * grows while the deposit only drops by the extra tax. An own contribution for
 * private use is withheld from net pay (§23.3.7), so it lowers the deposit and
 * the taxable addition — two different ledgers, never the same euro twice.
 *
 * This module does not replace the certified table or the annual Box 1 engine.
 */

import { SRC_COMPANY_CAR_2026, SRC_PENSION_PAYROLL_2026 } from './sources';
import {
  calculateEmployeePayroll2026,
  invertEmployeePayrollNet2026,
  PAYROLL_FORWARD_MODEL,
  PAYROLL_INVERSE_MODEL,
  type PayrollAssumption,
  type PayrollUnresolved,
} from './payroll-white-monthly';

export const EMPLOYEE_PAYSLIP_2026_ID = 'NL-2026-EMPLOYEE-PAYSLIP-V1' as const;

export const EMPLOYEE_PAYSLIP_2026_SOURCES = {
  pensionPayroll: SRC_PENSION_PAYROLL_2026,
  companyCar: SRC_COMPANY_CAR_2026,
} as const;

export type PayslipPensionStatus = 'NONE' | 'AMOUNT' | 'UNKNOWN' | 'NOT_SUPPLIED';
export type PayslipNetKind = 'BANK_NET' | 'STATUTORY_NET' | 'UNKNOWN';

export type PayslipAssumption =
  | PayrollAssumption
  | 'EMPLOYEE_PENSION_REDUCES_TABELLOON'
  | 'PENSION_NOT_SUPPLIED_STANDARD_TABLE'
  | 'OTHER_DEDUCTION_BANK_ONLY'
  | 'BANK_NET_INVERSE_VIA_TABELLOON'
  | 'ANNUAL_PENSION_FISCAL_ESTIMATE_MONTHLY_TIMES_12'
  | 'HOLIDAY_PENSION_TREATMENT_UNKNOWN'
  | 'COMPANY_CAR_ADDITION_RAISES_TABELLOON'
  | 'COMPANY_CAR_ADDITION_NOT_PAID_IN_CASH'
  | 'COMPANY_CAR_OWN_CONTRIBUTION_WITHHELD_FROM_NET';

export type PayslipForwardOk = {
  status: 'OK';
  contractualGrossMonthlyCents: number;
  employeePensionCents: number | null;
  pensionStatus: PayslipPensionStatus;
  pensionExplicitZero: boolean;
  otherBankDeductionCents: number;
  companyCarAdditionCents: number;
  companyCarOwnContributionCents: number;
  tabelloonInputCents: number;
  tabelloonCents: number;
  withheldPayrollTaxCents: number;
  statutoryNetMonthlyCents: number;
  bankNetMonthlyCents: number;
  payrollTaxCreditApplied: boolean;
  method: typeof PAYROLL_FORWARD_MODEL;
  provenance: 'ESTIMATE' | 'DERIVED';
  assumptions: readonly PayslipAssumption[];
};

export type PayslipForwardResult = PayslipForwardOk | PayrollUnresolved;

export type PayslipInverseOk = {
  status: 'OK';
  estimatedGrossMonthlyCents: number;
  employeePensionCents: number | null;
  pensionStatus: PayslipPensionStatus;
  otherBankDeductionCents: number;
  companyCarAdditionCents: number;
  companyCarOwnContributionCents: number;
  tabelloonInputCents: number;
  tabelloonCents: number;
  withheldPayrollTaxCents: number;
  statutoryNetMonthlyCents: number;
  bankNetMonthlyCents: number;
  calculatedNetAtSolutionCents: number;
  differenceCents: number;
  iterations: number;
  payrollTaxCreditApplied: boolean;
  method: typeof PAYROLL_INVERSE_MODEL;
  provenance: 'ESTIMATE';
  assumptions: readonly PayslipAssumption[];
};

export type PayslipInverseResult = PayslipInverseOk | PayrollUnresolved;

function pensionForTabelloon(input: {
  pensionStatus: PayslipPensionStatus;
  employeePensionCents: number | null;
}): { cents: number; reduces: boolean } {
  if (input.pensionStatus === 'AMOUNT' && input.employeePensionCents != null) {
    return { cents: input.employeePensionCents, reduces: true };
  }
  if (input.pensionStatus === 'NONE') {
    return { cents: 0, reduces: true };
  }
  return { cents: 0, reduces: false };
}

export function calculateEmployeePayslip2026(input: {
  contractualGrossMonthlyCents: number;
  payrollTaxCredit: boolean;
  pensionStatus: PayslipPensionStatus;
  employeePensionCents: number | null;
  otherBankDeductionCents?: number;
  /** Taxable addition after the qualifying own contribution, per month. */
  companyCarAdditionCents?: number;
  /** Own contribution for private use withheld from net pay, per month. */
  companyCarOwnContributionCents?: number;
}): PayslipForwardResult {
  const method = PAYROLL_FORWARD_MODEL;
  const gross = input.contractualGrossMonthlyCents;
  const other = Math.max(0, input.otherBankDeductionCents ?? 0);
  const car = Math.max(0, input.companyCarAdditionCents ?? 0);
  const carOwn = Math.max(0, input.companyCarOwnContributionCents ?? 0);
  if (!Number.isInteger(gross) || gross < 0) {
    return { status: 'UNRESOLVED', reason: 'INVALID_GROSS', method, confidence: 'NONE' };
  }
  const pension = pensionForTabelloon(input);
  if (pension.reduces && pension.cents > gross) {
    return { status: 'UNRESOLVED', reason: 'PENSION_EXCEEDS_GROSS', method, confidence: 'NONE' };
  }
  const tabelloonInput = gross + car - (pension.reduces ? pension.cents : 0);
  const table = calculateEmployeePayroll2026({
    grossMonthlyCents: tabelloonInput,
    payrollTaxCredit: input.payrollTaxCredit,
  });
  if (table.status !== 'OK') return table;

  // The addition is taxed but never paid out, so it leaves the deposit again.
  const statutoryNet = table.statutoryNetMonthlyCents - car;
  const bankNet = statutoryNet - other - carOwn;
  const assumptions: PayslipAssumption[] = [...table.assumptions];
  if (pension.reduces && pension.cents > 0) {
    assumptions.push('EMPLOYEE_PENSION_REDUCES_TABELLOON');
  } else if (input.pensionStatus === 'NOT_SUPPLIED' || input.pensionStatus === 'UNKNOWN') {
    assumptions.push('PENSION_NOT_SUPPLIED_STANDARD_TABLE');
  }
  if (other > 0) assumptions.push('OTHER_DEDUCTION_BANK_ONLY');
  if (car > 0) {
    assumptions.push('COMPANY_CAR_ADDITION_RAISES_TABELLOON');
    assumptions.push('COMPANY_CAR_ADDITION_NOT_PAID_IN_CASH');
  }
  if (carOwn > 0) assumptions.push('COMPANY_CAR_OWN_CONTRIBUTION_WITHHELD_FROM_NET');

  return {
    status: 'OK',
    contractualGrossMonthlyCents: gross,
    employeePensionCents:
      input.pensionStatus === 'NOT_SUPPLIED' || input.pensionStatus === 'UNKNOWN'
        ? null
        : pension.cents,
    pensionStatus: input.pensionStatus,
    pensionExplicitZero: input.pensionStatus === 'NONE',
    otherBankDeductionCents: other,
    companyCarAdditionCents: car,
    companyCarOwnContributionCents: carOwn,
    tabelloonInputCents: tabelloonInput,
    tabelloonCents: table.tabelloonCents,
    withheldPayrollTaxCents: table.withheldPayrollTaxCents,
    statutoryNetMonthlyCents: statutoryNet,
    bankNetMonthlyCents: bankNet,
    payrollTaxCreditApplied: table.payrollTaxCreditApplied,
    method,
    provenance: pension.reduces && pension.cents > 0 ? 'DERIVED' : 'ESTIMATE',
    assumptions,
  };
}

export function invertEmployeePayslipNet2026(input: {
  targetNetMonthlyCents: number;
  netKind: PayslipNetKind;
  payrollTaxCredit: boolean;
  pensionStatus: PayslipPensionStatus;
  employeePensionCents: number | null;
  otherBankDeductionCents?: number;
  companyCarAdditionCents?: number;
  companyCarOwnContributionCents?: number;
}): PayslipInverseResult {
  const method = PAYROLL_INVERSE_MODEL;
  const other = Math.max(0, input.otherBankDeductionCents ?? 0);
  const car = Math.max(0, input.companyCarAdditionCents ?? 0);
  const carOwn = Math.max(0, input.companyCarOwnContributionCents ?? 0);
  const pension = pensionForTabelloon(input);
  const useBankInverse =
    input.netKind === 'BANK_NET' && (pension.reduces || other > 0 || car > 0 || carOwn > 0);

  // Forward: bankNet = tableNet(tabelloon) − car − other − ownContribution, so
  // the same canonical function is inverted rather than a second formula.
  const targetStatutory =
    input.targetNetMonthlyCents + car + (useBankInverse ? other + carOwn : 0);

  const inverted = invertEmployeePayrollNet2026({
    targetStatutoryNetMonthlyCents: targetStatutory,
    payrollTaxCredit: input.payrollTaxCredit,
  });
  if (inverted.status !== 'OK') return inverted;

  const tabelloonInput = inverted.estimatedGrossMonthlyCents;
  const gross = tabelloonInput - car + (useBankInverse ? pension.cents : 0);
  const forward = calculateEmployeePayslip2026({
    contractualGrossMonthlyCents: gross,
    payrollTaxCredit: input.payrollTaxCredit,
    pensionStatus: input.pensionStatus,
    employeePensionCents: input.employeePensionCents,
    otherBankDeductionCents: other,
    companyCarAdditionCents: car,
    companyCarOwnContributionCents: carOwn,
  });
  if (forward.status !== 'OK') return forward;

  const calculated = useBankInverse
    ? forward.bankNetMonthlyCents
    : forward.statutoryNetMonthlyCents;
  const assumptions: PayslipAssumption[] = [...forward.assumptions];
  if (useBankInverse) assumptions.push('BANK_NET_INVERSE_VIA_TABELLOON');
  if (!useBankInverse && (input.netKind === 'BANK_NET' || input.netKind === 'UNKNOWN')) {
    assumptions.push('BANK_NET_TREATED_AS_STATUTORY_NET');
  }

  return {
    status: 'OK',
    estimatedGrossMonthlyCents: gross,
    employeePensionCents: forward.employeePensionCents,
    pensionStatus: input.pensionStatus,
    otherBankDeductionCents: other,
    companyCarAdditionCents: car,
    companyCarOwnContributionCents: carOwn,
    tabelloonInputCents: forward.tabelloonInputCents,
    tabelloonCents: forward.tabelloonCents,
    withheldPayrollTaxCents: forward.withheldPayrollTaxCents,
    statutoryNetMonthlyCents: forward.statutoryNetMonthlyCents,
    bankNetMonthlyCents: forward.bankNetMonthlyCents,
    calculatedNetAtSolutionCents: calculated,
    differenceCents: calculated - input.targetNetMonthlyCents,
    iterations: inverted.iterations,
    payrollTaxCreditApplied: inverted.payrollTaxCreditApplied,
    method,
    provenance: 'ESTIMATE',
    assumptions,
  };
}

export function annualPensionFiscalAdjustmentCents(input: {
  pensionStatus: PayslipPensionStatus;
  employeePensionCents: number | null;
}): { cents: number; estimate: boolean } {
  if (input.pensionStatus === 'AMOUNT' && input.employeePensionCents != null) {
    return { cents: input.employeePensionCents * 12, estimate: true };
  }
  if (input.pensionStatus === 'NONE') {
    return { cents: 0, estimate: false };
  }
  return { cents: 0, estimate: false };
}
