/**
 * Official 2026 Dutch white monthly wage-tax table (below AOW).
 * Frozen in-repo. Never scraped at runtime. Not the annual Box 1 engine.
 *
 * Inverse policy: lowest gross whose forward statutory net is closest to
 * the target. Ties prefer the lower gross. Withholding uses the official
 * lower-row tabelloon; net = gross − withheld. No interpolation.
 */

import {
  WHITE_MONTHLY_TABLE_2026_ID,
  WHITE_MONTHLY_TABLE_2026_PACKED,
  WHITE_MONTHLY_TABLE_2026_SOURCE,
} from './payroll-white-monthly-data';
import { SRC_ZVW_2026 } from './sources';

export const PAYROLL_WHITE_MONTHLY_2026_ID = WHITE_MONTHLY_TABLE_2026_ID;
export const PAYROLL_FORWARD_MODEL = 'WHITE_MONTHLY_TABLE_2026_FORWARD' as const;
export const PAYROLL_INVERSE_MODEL = 'WHITE_MONTHLY_TABLE_2026_INVERSE' as const;
export const PAYROLL_INVERSE_GROSS_POLICY = 'LOWEST_GROSS_FOR_CLOSEST_FORWARD_NET' as const;
export const PAYROLL_CONFIDENCE = 'ESTIMATE' as const;
export const NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS = 0;

const TRIPLE = 3;
const ROW_COUNT = WHITE_MONTHLY_TABLE_2026_SOURCE.rowCount;
const STEP = WHITE_MONTHLY_TABLE_2026_SOURCE.stepCents;
const MIN_TABELLOON = WHITE_MONTHLY_TABLE_2026_SOURCE.minTabelloonCents;
const MAX_TABELLOON = WHITE_MONTHLY_TABLE_2026_SOURCE.maxTabelloonCents;
const ABOVE_NUM = WHITE_MONTHLY_TABLE_2026_SOURCE.aboveMaxRateNumerator;
const ABOVE_DEN = WHITE_MONTHLY_TABLE_2026_SOURCE.aboveMaxRateDenominator;
const MAX_SUPPORTED_GROSS_CENTS = 50_000_00;
const SEARCH_ITERS_CAP = 64;

if (WHITE_MONTHLY_TABLE_2026_PACKED.length !== ROW_COUNT * TRIPLE) {
  throw new Error('WHITE_MONTHLY_TABLE_2026 packed length mismatch');
}
if (WHITE_MONTHLY_TABLE_2026_PACKED[0] !== MIN_TABELLOON) {
  throw new Error('WHITE_MONTHLY_TABLE_2026 min tabelloon mismatch');
}
if (WHITE_MONTHLY_TABLE_2026_PACKED[(ROW_COUNT - 1) * TRIPLE] !== MAX_TABELLOON) {
  throw new Error('WHITE_MONTHLY_TABLE_2026 max tabelloon mismatch');
}

export const PAYROLL_WHITE_MONTHLY_2026_SOURCES = {
  table: WHITE_MONTHLY_TABLE_2026_SOURCE,
  zvw: SRC_ZVW_2026,
} as const;

export type PayrollTaxCreditChoice = 'YES' | 'NO' | 'UNKNOWN';

export type PayrollAssumption =
  | 'PAYROLL_TAX_CREDIT_ASSUMED_YES'
  | 'EMPLOYEE_ZVW_WERKGEVERSHEFFING_NOT_DEDUCTED'
  | 'BANK_NET_TREATED_AS_STATUTORY_NET'
  | 'NO_PENSION_OR_OTHER_DEDUCTIONS'
  | 'BELOW_MIN_TABELLOON_WITHHELD_ZERO'
  | 'ABOVE_MAX_TABELLOON_49_50_PERCENT';

export type PayrollForwardOk = {
  status: 'OK';
  grossMonthlyCents: number;
  tabelloonCents: number;
  withheldPayrollTaxCents: number;
  employeeZvwCents: typeof NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS;
  statutoryNetMonthlyCents: number;
  payrollTaxCreditApplied: boolean;
  method: typeof PAYROLL_FORWARD_MODEL;
  confidence: typeof PAYROLL_CONFIDENCE;
  provenance: typeof PAYROLL_CONFIDENCE;
  tableId: typeof PAYROLL_WHITE_MONTHLY_2026_ID;
  aboveTable: boolean;
  assumptions: readonly PayrollAssumption[];
};

export type PayrollUnresolved = {
  status: 'UNRESOLVED';
  reason: string;
  method: typeof PAYROLL_FORWARD_MODEL | typeof PAYROLL_INVERSE_MODEL;
  confidence: 'NONE';
};

export type PayrollForwardResult = PayrollForwardOk | PayrollUnresolved;

export type PayrollInverseOk = {
  status: 'OK';
  estimatedGrossMonthlyCents: number;
  tabelloonCents: number;
  calculatedNetAtSolutionCents: number;
  differenceCents: number;
  iterations: number;
  withheldPayrollTaxCents: number;
  employeeZvwCents: typeof NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS;
  payrollTaxCreditApplied: boolean;
  method: typeof PAYROLL_INVERSE_MODEL;
  inversePolicy: typeof PAYROLL_INVERSE_GROSS_POLICY;
  confidence: typeof PAYROLL_CONFIDENCE;
  provenance: typeof PAYROLL_CONFIDENCE;
  tableId: typeof PAYROLL_WHITE_MONTHLY_2026_ID;
  aboveTable: boolean;
  assumptions: readonly PayrollAssumption[];
};

export type PayrollInverseResult = PayrollInverseOk | PayrollUnresolved;

function tabelloonAt(index: number): number {
  return WHITE_MONTHLY_TABLE_2026_PACKED[index * TRIPLE]!;
}

function withheldAt(index: number, payrollTaxCredit: boolean): number {
  return WHITE_MONTHLY_TABLE_2026_PACKED[index * TRIPLE + (payrollTaxCredit ? 2 : 1)]!;
}

function lastIndex(): number {
  return ROW_COUNT - 1;
}

function extraTaxAboveMax(excessCents: number): number {
  if (excessCents <= 0) return 0;
  return Math.floor((excessCents * ABOVE_NUM) / ABOVE_DEN);
}

function findLowerRowIndex(grossMonthlyCents: number): number {
  let lo = 0;
  let hi = lastIndex();
  while (lo < hi) {
    const mid = lo + Math.ceil((hi - lo) / 2);
    if (tabelloonAt(mid) <= grossMonthlyCents) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function baseAssumptions(input: {
  payrollTaxCredit: boolean;
  aboveTable: boolean;
  belowMin: boolean;
}): PayrollAssumption[] {
  const list: PayrollAssumption[] = [
    'EMPLOYEE_ZVW_WERKGEVERSHEFFING_NOT_DEDUCTED',
    'NO_PENSION_OR_OTHER_DEDUCTIONS',
  ];
  if (input.belowMin) list.push('BELOW_MIN_TABELLOON_WITHHELD_ZERO');
  if (input.aboveTable) list.push('ABOVE_MAX_TABELLOON_49_50_PERCENT');
  return list;
}

export function resolvePayrollTaxCredit(choice: PayrollTaxCreditChoice | null | undefined): {
  applied: boolean;
  assumed: boolean;
  choice: PayrollTaxCreditChoice;
} {
  if (choice === 'NO') return { applied: false, assumed: false, choice };
  if (choice === 'YES') return { applied: true, assumed: false, choice };
  return { applied: true, assumed: true, choice: choice === 'UNKNOWN' ? 'UNKNOWN' : 'UNKNOWN' };
}

export function calculateEmployeePayroll2026(input: {
  grossMonthlyCents: number;
  payrollTaxCredit: boolean;
}): PayrollForwardResult {
  const method = PAYROLL_FORWARD_MODEL;
  const gross = input.grossMonthlyCents;
  if (!Number.isInteger(gross) || gross < 0) {
    return { status: 'UNRESOLVED', reason: 'INVALID_GROSS', method, confidence: 'NONE' };
  }
  if (gross === 0) {
    return { status: 'UNRESOLVED', reason: 'ZERO_GROSS', method, confidence: 'NONE' };
  }
  if (gross > MAX_SUPPORTED_GROSS_CENTS) {
    return { status: 'UNRESOLVED', reason: 'GROSS_ABOVE_SUPPORTED_RANGE', method, confidence: 'NONE' };
  }

  const lhk = input.payrollTaxCredit;
  if (gross < MIN_TABELLOON) {
    return {
      status: 'OK',
      grossMonthlyCents: gross,
      tabelloonCents: gross,
      withheldPayrollTaxCents: 0,
      employeeZvwCents: NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS,
      statutoryNetMonthlyCents: gross,
      payrollTaxCreditApplied: lhk,
      method,
      confidence: PAYROLL_CONFIDENCE,
      provenance: PAYROLL_CONFIDENCE,
      tableId: PAYROLL_WHITE_MONTHLY_2026_ID,
      aboveTable: false,
      assumptions: baseAssumptions({ payrollTaxCredit: lhk, aboveTable: false, belowMin: true }),
    };
  }

  if (gross > MAX_TABELLOON) {
    const last = lastIndex();
    const tabelloon = tabelloonAt(last);
    const withheld = withheldAt(last, lhk) + extraTaxAboveMax(gross - MAX_TABELLOON);
    return {
      status: 'OK',
      grossMonthlyCents: gross,
      tabelloonCents: tabelloon,
      withheldPayrollTaxCents: withheld,
      employeeZvwCents: NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS,
      statutoryNetMonthlyCents: gross - withheld,
      payrollTaxCreditApplied: lhk,
      method,
      confidence: PAYROLL_CONFIDENCE,
      provenance: PAYROLL_CONFIDENCE,
      tableId: PAYROLL_WHITE_MONTHLY_2026_ID,
      aboveTable: true,
      assumptions: baseAssumptions({ payrollTaxCredit: lhk, aboveTable: true, belowMin: false }),
    };
  }

  const index = findLowerRowIndex(gross);
  const tabelloon = tabelloonAt(index);
  const withheld = withheldAt(index, lhk);
  return {
    status: 'OK',
    grossMonthlyCents: gross,
    tabelloonCents: tabelloon,
    withheldPayrollTaxCents: withheld,
    employeeZvwCents: NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS,
    statutoryNetMonthlyCents: gross - withheld,
    payrollTaxCreditApplied: lhk,
    method,
    confidence: PAYROLL_CONFIDENCE,
    provenance: PAYROLL_CONFIDENCE,
    tableId: PAYROLL_WHITE_MONTHLY_2026_ID,
    aboveTable: false,
    assumptions: baseAssumptions({ payrollTaxCredit: lhk, aboveTable: false, belowMin: false }),
  };
}

function considerCandidate(
  best: { gross: number; net: number; abs: number } | null,
  gross: number,
  targetNet: number,
  payrollTaxCredit: boolean,
): { gross: number; net: number; abs: number } | null {
  if (!Number.isInteger(gross) || gross <= 0 || gross > MAX_SUPPORTED_GROSS_CENTS) return best;
  const forward = calculateEmployeePayroll2026({
    grossMonthlyCents: gross,
    payrollTaxCredit,
  });
  if (forward.status !== 'OK') return best;
  const abs = Math.abs(forward.statutoryNetMonthlyCents - targetNet);
  if (
    best == null ||
    abs < best.abs ||
    (abs === best.abs && gross < best.gross)
  ) {
    return { gross, net: forward.statutoryNetMonthlyCents, abs };
  }
  return best;
}

function invertAboveMax(input: {
  targetNet: number;
  payrollTaxCredit: boolean;
}): PayrollInverseResult {
  const method = PAYROLL_INVERSE_MODEL;
  const lhk = input.payrollTaxCredit;
  const last = lastIndex();
  const lastW = withheldAt(last, lhk);
  const loStart = MAX_TABELLOON + 1;
  let hi = Math.min(
    MAX_SUPPORTED_GROSS_CENTS,
    Math.max(
      loStart + 100,
      Math.ceil(((input.targetNet + lastW) * ABOVE_DEN) / (ABOVE_DEN - ABOVE_NUM)) + STEP,
    ),
  );
  const netAtGross = (gross: number) => {
    const forward = calculateEmployeePayroll2026({
      grossMonthlyCents: gross,
      payrollTaxCredit: lhk,
    });
    return forward.status === 'OK' ? forward.statutoryNetMonthlyCents : null;
  };

  let netHi = netAtGross(hi);
  let growGuard = 0;
  while (netHi != null && netHi < input.targetNet && hi < MAX_SUPPORTED_GROSS_CENTS) {
    hi = Math.min(MAX_SUPPORTED_GROSS_CENTS, hi + Math.max(hi - MAX_TABELLOON, STEP));
    netHi = netAtGross(hi);
    growGuard += 1;
    if (growGuard > 24) break;
  }
  if (netHi == null) {
    return { status: 'UNRESOLVED', reason: 'ABOVE_MAX_UNRESOLVED', method, confidence: 'NONE' };
  }
  if (netHi < input.targetNet) {
    return { status: 'UNRESOLVED', reason: 'NET_ABOVE_SUPPORTED_RANGE', method, confidence: 'NONE' };
  }

  let lo = loStart;
  let best = hi;
  let iterations = growGuard;
  while (lo < hi && iterations < SEARCH_ITERS_CAP) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const n = netAtGross(mid);
    iterations += 1;
    if (n == null) {
      return { status: 'UNRESOLVED', reason: 'ABOVE_MAX_UNRESOLVED', method, confidence: 'NONE' };
    }
    if (n >= input.targetNet) {
      best = mid;
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  const left = Math.max(loStart, best - 1);
  const netBest = netAtGross(best);
  const netLeft = netAtGross(left);
  if (netBest == null) {
    return { status: 'UNRESOLVED', reason: 'ABOVE_MAX_UNRESOLVED', method, confidence: 'NONE' };
  }
  let chosen = best;
  if (netLeft != null) {
    const dBest = Math.abs(netBest - input.targetNet);
    const dLeft = Math.abs(netLeft - input.targetNet);
    if (dLeft < dBest || (dLeft === dBest && left < best)) chosen = left;
  }
  const forward = calculateEmployeePayroll2026({
    grossMonthlyCents: chosen,
    payrollTaxCredit: lhk,
  });
  if (forward.status !== 'OK') {
    return { status: 'UNRESOLVED', reason: 'ABOVE_MAX_UNRESOLVED', method, confidence: 'NONE' };
  }
  return {
    status: 'OK',
    estimatedGrossMonthlyCents: chosen,
    tabelloonCents: forward.tabelloonCents,
    calculatedNetAtSolutionCents: forward.statutoryNetMonthlyCents,
    differenceCents: forward.statutoryNetMonthlyCents - input.targetNet,
    iterations,
    withheldPayrollTaxCents: forward.withheldPayrollTaxCents,
    employeeZvwCents: NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS,
    payrollTaxCreditApplied: lhk,
    method,
    inversePolicy: PAYROLL_INVERSE_GROSS_POLICY,
    confidence: PAYROLL_CONFIDENCE,
    provenance: PAYROLL_CONFIDENCE,
    tableId: PAYROLL_WHITE_MONTHLY_2026_ID,
    aboveTable: true,
    assumptions: [
      ...baseAssumptions({ payrollTaxCredit: lhk, aboveTable: true, belowMin: false }),
      'BANK_NET_TREATED_AS_STATUTORY_NET',
    ],
  };
}

function finishInverse(input: {
  chosenGross: number;
  targetNet: number;
  payrollTaxCredit: boolean;
  iterations: number;
}): PayrollInverseResult {
  const method = PAYROLL_INVERSE_MODEL;
  const forward = calculateEmployeePayroll2026({
    grossMonthlyCents: input.chosenGross,
    payrollTaxCredit: input.payrollTaxCredit,
  });
  if (forward.status !== 'OK') {
    return { status: 'UNRESOLVED', reason: 'INVERSE_FORWARD_FAILED', method, confidence: 'NONE' };
  }
  return {
    status: 'OK',
    estimatedGrossMonthlyCents: input.chosenGross,
    tabelloonCents: forward.tabelloonCents,
    calculatedNetAtSolutionCents: forward.statutoryNetMonthlyCents,
    differenceCents: forward.statutoryNetMonthlyCents - input.targetNet,
    iterations: input.iterations,
    withheldPayrollTaxCents: forward.withheldPayrollTaxCents,
    employeeZvwCents: NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS,
    payrollTaxCreditApplied: input.payrollTaxCredit,
    method,
    inversePolicy: PAYROLL_INVERSE_GROSS_POLICY,
    confidence: PAYROLL_CONFIDENCE,
    provenance: PAYROLL_CONFIDENCE,
    tableId: PAYROLL_WHITE_MONTHLY_2026_ID,
    aboveTable: forward.aboveTable,
    assumptions: [
      ...forward.assumptions,
      'BANK_NET_TREATED_AS_STATUTORY_NET',
    ],
  };
}

export function invertEmployeePayrollNet2026(input: {
  targetStatutoryNetMonthlyCents: number;
  payrollTaxCredit: boolean;
}): PayrollInverseResult {
  const method = PAYROLL_INVERSE_MODEL;
  const target = input.targetStatutoryNetMonthlyCents;
  if (!Number.isInteger(target) || target < 0) {
    return { status: 'UNRESOLVED', reason: 'INVALID_NET', method, confidence: 'NONE' };
  }
  if (target === 0) {
    return { status: 'UNRESOLVED', reason: 'ZERO_NET', method, confidence: 'NONE' };
  }

  const lhk = input.payrollTaxCredit;
  let best: { gross: number; net: number; abs: number } | null = null;
  let iterations = 0;

  if (target < MIN_TABELLOON) {
    iterations += 1;
    best = considerCandidate(best, target, target, lhk);
  }

  const last = lastIndex();
  for (let i = 0; i <= last; i += 1) {
    const lo = tabelloonAt(i);
    const hiExclusive = i < last ? tabelloonAt(i + 1) : MAX_TABELLOON + 1;
    const withheld = withheldAt(i, lhk);
    const exactGross = target + withheld;
    iterations += 1;
    if (exactGross >= lo && exactGross < hiExclusive) {
      best = considerCandidate(best, exactGross, target, lhk);
    } else {
      best = considerCandidate(best, lo, target, lhk);
      best = considerCandidate(best, hiExclusive - 1, target, lhk);
    }
    if (best?.abs === 0) {
      break;
    }
  }

  const lastForward = calculateEmployeePayroll2026({
    grossMonthlyCents: MAX_TABELLOON,
    payrollTaxCredit: lhk,
  });
  if (lastForward.status === 'OK' && target > lastForward.statutoryNetMonthlyCents) {
    const above = invertAboveMax({ targetNet: target, payrollTaxCredit: lhk });
    if (above.status === 'OK') {
      best = considerCandidate(best, above.estimatedGrossMonthlyCents, target, lhk);
      iterations += above.iterations;
    }
  }

  if (best == null) {
    return { status: 'UNRESOLVED', reason: 'NO_INVERSE_CANDIDATE', method, confidence: 'NONE' };
  }
  return finishInverse({
    chosenGross: best.gross,
    targetNet: target,
    payrollTaxCredit: lhk,
    iterations,
  });
}

export function officialTableStepCents(): number {
  return STEP;
}
