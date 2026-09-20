import type { AowBirthCohort2026, AowMonth2026 } from '../domain/aow';
import {
  addScaled,
  fromCents,
  max0Scaled,
  minScaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  BOX1_B1_MAX_CENTS,
  BOX1_B1_RATE,
  BOX1_B2_MAX_CENTS,
  BOX1_B2_RATE,
  BOX1_B3_RATE,
} from '../rulesets/nl/2026/core-constants';
import {
  BOX1_AOW_BORN_BEFORE_1946_B1_MAX_CENTS,
  BOX1_AOW_BORN_ON_OR_AFTER_1946_B1_MAX_CENTS,
  BOX1_AOW_RATE,
  BOX1_TRANSITION_B1_MAX_CENTS,
  BOX1_TRANSITION_SCHIJF1_RATE_BY_MONTH,
} from '../rulesets/nl/2026/personal-tax-parameters';

function assertBox1Cents(taxableBox1IncomeCents: number): void {
  if (!Number.isInteger(taxableBox1IncomeCents)) {
    throw new Error('taxableBox1IncomeCents must be integer cents');
  }
  if (taxableBox1IncomeCents < 0) {
    throw new Error('taxableBox1IncomeCents must be >= 0');
  }
}

function box1ThreeBrackets(input: {
  taxableBox1IncomeCents: number;
  bracket1MaxCents: number;
  bracket1Rate: { n: bigint; d: bigint };
}): number {
  assertBox1Cents(input.taxableBox1IncomeCents);
  const income = fromCents(input.taxableBox1IncomeCents);
  const b1 = fromCents(input.bracket1MaxCents);
  const b2 = fromCents(BOX1_B2_MAX_CENTS);
  const slice1 = minScaled(income, b1);
  const slice2 = minScaled(max0Scaled(income - b1), b2 - b1);
  const slice3 = max0Scaled(income - b2);
  const tax = addScaled(
    addScaled(
      mulRate(slice1, input.bracket1Rate.n, input.bracket1Rate.d),
      mulRate(slice2, BOX1_B2_RATE.n, BOX1_B2_RATE.d),
    ),
    mulRate(slice3, BOX1_B3_RATE.n, BOX1_B3_RATE.d),
  );
  return toCentsRoundHalfUp(tax);
}

export function calculateBox1Tax2026BelowAow(
  taxableBox1IncomeCents: number,
): number {
  return box1ThreeBrackets({
    taxableBox1IncomeCents,
    bracket1MaxCents: BOX1_B1_MAX_CENTS,
    bracket1Rate: BOX1_B1_RATE,
  });
}

export function calculateBox1Tax2026FullYearAow(
  taxableBox1IncomeCents: number,
  cohort: AowBirthCohort2026,
): number {
  const bracket1MaxCents =
    cohort === 'BORN_BEFORE_1946'
      ? BOX1_AOW_BORN_BEFORE_1946_B1_MAX_CENTS
      : BOX1_AOW_BORN_ON_OR_AFTER_1946_B1_MAX_CENTS;
  return box1ThreeBrackets({
    taxableBox1IncomeCents,
    bracket1MaxCents,
    bracket1Rate: BOX1_AOW_RATE,
  });
}

export function calculateBox1Tax2026ReachesAow(
  taxableBox1IncomeCents: number,
  aowMonth: AowMonth2026,
): number {
  return box1ThreeBrackets({
    taxableBox1IncomeCents,
    bracket1MaxCents: BOX1_TRANSITION_B1_MAX_CENTS,
    bracket1Rate: BOX1_TRANSITION_SCHIJF1_RATE_BY_MONTH[aowMonth],
  });
}
