/**
 * IACK amounts. Eligibility is resolved separately.
 * Below-AOW and full-year AOW use different official 2026 tables.
 * REACHES_AOW_IN_2026 has no certified published formula.
 */

import {
  fromCents,
  max0Scaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  IACK_BELOW_AOW_MAX_CENTS,
  IACK_BELOW_AOW_RATE,
  IACK_FULL_YEAR_AOW_MAX_CENTS,
  IACK_FULL_YEAR_AOW_RATE,
  IACK_MAX_FROM_CENTS,
  IACK_ZERO_THROUGH_CENTS,
} from '../rulesets/nl/2026/personal-tax-parameters';

function assertCents(arbeidsinkomenCents: number): void {
  if (!Number.isInteger(arbeidsinkomenCents)) {
    throw new Error('arbeidsinkomenCents must be integer cents');
  }
  if (arbeidsinkomenCents < 0) {
    throw new Error('arbeidsinkomenCents must be >= 0');
  }
}

function iackAmount(
  arbeidsinkomenCents: number,
  rate: { n: bigint; d: bigint },
  maxCents: number,
): number {
  assertCents(arbeidsinkomenCents);
  if (arbeidsinkomenCents <= IACK_ZERO_THROUGH_CENTS) return 0;
  if (arbeidsinkomenCents >= IACK_MAX_FROM_CENTS) return maxCents;
  const extra = fromCents(arbeidsinkomenCents - IACK_ZERO_THROUGH_CENTS);
  return toCentsRoundHalfUp(
    max0Scaled(mulRate(extra, rate.n, rate.d)),
  );
}

export function calculateIack2026BelowAow(arbeidsinkomenCents: number): number {
  return iackAmount(
    arbeidsinkomenCents,
    IACK_BELOW_AOW_RATE,
    IACK_BELOW_AOW_MAX_CENTS,
  );
}

export function calculateIack2026FullYearAow(arbeidsinkomenCents: number): number {
  return iackAmount(
    arbeidsinkomenCents,
    IACK_FULL_YEAR_AOW_RATE,
    IACK_FULL_YEAR_AOW_MAX_CENTS,
  );
}
