/**
 * Reverse an annual net employment amount to a gross/taxable proxy.
 * Payroll tables are not certified here — result is always an estimate.
 * Never treat net as taxable income. Never silently set NET == GROSS.
 */

import type { AgeTaxRegime2026 } from '../domain/income-bases';
import type { AowBirthCohort2026 } from '../domain/aow';
import { calculatePersonalTax2026 } from './personal-tax';

export const NET_TO_GROSS_METHOD = 'BINARY_SEARCH_ANNUAL_IB_CREDITS' as const;
export const NET_TO_GROSS_CONFIDENCE = 'ESTIMATE' as const;

export type NetToGrossResult =
  | {
      status: 'OK';
      grossCents: number;
      method: typeof NET_TO_GROSS_METHOD;
      confidence: typeof NET_TO_GROSS_CONFIDENCE;
    }
  | {
      status: 'UNRESOLVED';
      reason: string;
      method: typeof NET_TO_GROSS_METHOD;
      confidence: 'NONE';
    };

const MAX_GROSS_CENTS = 250_000_00;
const SEARCH_ITERS = 48;

function annualNetOfGross(input: {
  grossCents: number;
  regime: AgeTaxRegime2026;
  aowBirthCohort: AowBirthCohort2026 | null;
}): number | null {
  const slice = calculatePersonalTax2026({
    regime: input.regime,
    aowBirthCohort: input.aowBirthCohort,
    box1Cents: input.grossCents,
    aggregateCents: input.grossCents,
    arbeidsinkomenCents: input.grossCents,
    iackContext: null,
  });
  if (typeof slice.incomeTaxAfterCredits !== 'number') return null;
  return input.grossCents - slice.incomeTaxAfterCredits;
}

export function estimateGrossFromNetSalary2026(input: {
  netAnnualCents: number;
  regime: AgeTaxRegime2026 | null;
  aowBirthCohort?: AowBirthCohort2026 | null;
}): NetToGrossResult {
  const method = NET_TO_GROSS_METHOD;
  if (input.regime == null) {
    return { status: 'UNRESOLVED', reason: 'ageTaxRegime', method, confidence: 'NONE' };
  }
  if (input.regime === 'REACHES_AOW_IN_2026') {
    return { status: 'UNRESOLVED', reason: 'AOW_TRANSITION_YEAR', method, confidence: 'NONE' };
  }
  if (!Number.isInteger(input.netAnnualCents) || input.netAnnualCents < 0) {
    return { status: 'UNRESOLVED', reason: 'INVALID_NET', method, confidence: 'NONE' };
  }

  const taxInput = {
    regime: input.regime,
    aowBirthCohort: input.aowBirthCohort ?? null,
  };

  const netAt = (gross: number) =>
    annualNetOfGross({ grossCents: gross, ...taxInput });

  if (netAt(input.netAnnualCents) == null) {
    return { status: 'UNRESOLVED', reason: 'PERSONAL_TAX_UNKNOWN', method, confidence: 'NONE' };
  }

  let lo = input.netAnnualCents;
  let hi = Math.min(MAX_GROSS_CENTS, Math.max(input.netAnnualCents + 100, input.netAnnualCents * 2));
  let netHi = netAt(hi);
  while (netHi != null && netHi < input.netAnnualCents && hi < MAX_GROSS_CENTS) {
    hi = Math.min(MAX_GROSS_CENTS, hi + Math.max(hi, 100));
    netHi = netAt(hi);
  }
  if (netHi == null) {
    return { status: 'UNRESOLVED', reason: 'PERSONAL_TAX_UNKNOWN', method, confidence: 'NONE' };
  }
  if (netHi < input.netAnnualCents) {
    return { status: 'UNRESOLVED', reason: 'NET_ABOVE_SEARCH_RANGE', method, confidence: 'NONE' };
  }

  let best = hi;
  for (let i = 0; i < SEARCH_ITERS && lo < hi; i += 1) {
    const mid = lo + Math.floor((hi - lo) / 2);
    const n = netAt(mid);
    if (n == null) {
      return { status: 'UNRESOLVED', reason: 'PERSONAL_TAX_UNKNOWN', method, confidence: 'NONE' };
    }
    if (n >= input.netAnnualCents) {
      best = mid;
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }

  const check = netAt(best);
  if (check == null) {
    return { status: 'UNRESOLVED', reason: 'PERSONAL_TAX_UNKNOWN', method, confidence: 'NONE' };
  }
  if (best === input.netAnnualCents && check !== input.netAnnualCents) {
    return { status: 'UNRESOLVED', reason: 'CANNOT_INVERT', method, confidence: 'NONE' };
  }
  return {
    status: 'OK',
    grossCents: best,
    method,
    confidence: NET_TO_GROSS_CONFIDENCE,
  };
}
