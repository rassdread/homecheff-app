/**
 * Taxable employment pay that is not part of the regular monthly salary:
 * 13th month / eindejaarsuitkering, bonus / gratificatie / provisie and
 * taxable overtime.
 *
 * Official treatment (Handboek Loonheffingen 2026):
 * - §11.2.3 kolom 3 lists salaris, provisie, overwerkloon, tantièmes and
 *   gratificaties as loon in geld uit tegenwoordige dienstbetrekking.
 * - §11.2.9 kolom 14 (loon voor de loonbelasting/volksverzekeringen) is
 *   kolom 3 + 4 + 5 − 7, so these amounts belong to the fiscal wage and,
 *   being loon uit tegenwoordige dienstbetrekking, to arbeidsinkomen.
 * - §9.3.6 the tabel voor bijzondere beloningen only determines how much is
 *   withheld at payment time. It is payroll withholding, not a final tax:
 *   the same paragraph describes the machtiging that lowers the percentage
 *   when it deviates from the income tax the employee will actually owe.
 *
 * Severance (ontslagvergoeding) is loon uit vroegere dienstbetrekking
 * (§17.2.6, groene tabel) and is therefore not part of this module.
 *
 * Pension is deliberately not applied to these amounts: whether a scheme
 * treats a 13th month, bonus or overtime as pensionable salary is
 * scheme-specific and was not modelled in the pension phase.
 */

import { SRC_EMPLOYMENT_EXTRAS_2026 } from './sources';

export const EMPLOYMENT_EXTRAS_2026_ID = 'NL-2026-EMPLOYMENT-EXTRAS-V1' as const;

export const EMPLOYMENT_EXTRAS_2026_SOURCES = {
  taxableWage: SRC_EMPLOYMENT_EXTRAS_2026,
} as const;

export type EmploymentExtraPayStatus = 'NONE' | 'PROVIDED' | 'UNKNOWN' | 'NOT_SUPPLIED';

export type EmploymentExtraAssumption =
  | 'EXTRAS_ARE_CURRENT_EMPLOYMENT_WAGE'
  | 'SPECIAL_RATE_WITHHOLDING_IS_PAYROLL_ONLY'
  | 'THIRTEENTH_MONTH_EQUALS_ONE_CONTRACTUAL_MONTH'
  | 'NO_PENSION_DEDUCTION_APPLIED_TO_EXTRAS'
  | 'EXTRAS_UNKNOWN_NOT_COUNTED';

export type EmploymentExtraPayInput = {
  status: EmploymentExtraPayStatus;
  thirteenthMonthAnnualCents?: number | null;
  bonusCommissionAnnualCents?: number | null;
  overtimeOtherAnnualCents?: number | null;
};

export type EmploymentExtraPayResult = {
  status: EmploymentExtraPayStatus;
  /** Annual gross total. 0 only when the user explicitly answered "none". */
  totalAnnualCents: number;
  thirteenthMonthAnnualCents: number | null;
  bonusCommissionAnnualCents: number | null;
  overtimeOtherAnnualCents: number | null;
  /** True only for an explicit "no extra pay" answer, never for UNKNOWN. */
  explicitNone: boolean;
  provided: boolean;
  /** UNKNOWN or an incomplete PROVIDED answer: the annual wage may be higher. */
  unknown: boolean;
  assumptions: readonly EmploymentExtraAssumption[];
};

function knownComponent(cents: number | null | undefined): number | null {
  if (cents == null) return null;
  if (!Number.isInteger(cents) || cents < 0) return null;
  return cents;
}

/**
 * A contractual 13th month is normally one gross month. The helper derives the
 * annual taxable amount only; it says nothing about what is actually paid out,
 * because the employer applies the special-remuneration table at payment.
 */
export function thirteenthMonthFromContractualMonth(
  contractualGrossMonthlyCents: number,
): number | null {
  if (!Number.isInteger(contractualGrossMonthlyCents) || contractualGrossMonthlyCents < 0) {
    return null;
  }
  return contractualGrossMonthlyCents;
}

export function annualEmploymentExtrasCents(
  input: EmploymentExtraPayInput,
): EmploymentExtraPayResult {
  const assumptions: EmploymentExtraAssumption[] = [];
  if (input.status === 'NONE') {
    return {
      status: 'NONE',
      totalAnnualCents: 0,
      thirteenthMonthAnnualCents: 0,
      bonusCommissionAnnualCents: 0,
      overtimeOtherAnnualCents: 0,
      explicitNone: true,
      provided: false,
      unknown: false,
      assumptions,
    };
  }
  if (input.status !== 'PROVIDED') {
    if (input.status === 'UNKNOWN') assumptions.push('EXTRAS_UNKNOWN_NOT_COUNTED');
    return {
      status: input.status,
      totalAnnualCents: 0,
      thirteenthMonthAnnualCents: null,
      bonusCommissionAnnualCents: null,
      overtimeOtherAnnualCents: null,
      explicitNone: false,
      provided: false,
      unknown: input.status === 'UNKNOWN',
      assumptions,
    };
  }

  const thirteenth = knownComponent(input.thirteenthMonthAnnualCents);
  const bonus = knownComponent(input.bonusCommissionAnnualCents);
  const overtime = knownComponent(input.overtimeOtherAnnualCents);
  const components = [thirteenth, bonus, overtime];
  const total = components.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const nothingEntered = components.every((value) => value == null);

  assumptions.push('EXTRAS_ARE_CURRENT_EMPLOYMENT_WAGE');
  assumptions.push('SPECIAL_RATE_WITHHOLDING_IS_PAYROLL_ONLY');
  if (total > 0) assumptions.push('NO_PENSION_DEDUCTION_APPLIED_TO_EXTRAS');
  if (nothingEntered) assumptions.push('EXTRAS_UNKNOWN_NOT_COUNTED');

  return {
    status: 'PROVIDED',
    totalAnnualCents: total,
    thirteenthMonthAnnualCents: thirteenth,
    bonusCommissionAnnualCents: bonus,
    overtimeOtherAnnualCents: overtime,
    explicitNone: false,
    provided: !nothingEntered,
    unknown: nothingEntered,
    assumptions,
  };
}
