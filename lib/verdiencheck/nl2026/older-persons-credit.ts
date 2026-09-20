/**
 * Ouderenkorting 2026. Applies if AOW age is reached by 31 December 2026.
 * A/B use verzamelinkomen separately; extra ROW can reduce the credit.
 */

import {
  clampScaled,
  fromCents,
  max0Scaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  OUDERENKORTING_FULL_UNTIL_CENTS,
  OUDERENKORTING_MAX_CENTS,
  OUDERENKORTING_PHASEOUT_RATE,
  OUDERENKORTING_ZERO_FROM_CENTS,
} from '../rulesets/nl/2026/personal-tax-parameters';

export function calculateOlderPersonsTaxCredit2026(
  aggregateIncomeCents: number,
): number {
  if (!Number.isInteger(aggregateIncomeCents)) {
    throw new Error('aggregateIncomeCents must be integer cents');
  }
  if (aggregateIncomeCents < 0) {
    throw new Error('aggregateIncomeCents must be >= 0');
  }
  if (aggregateIncomeCents >= OUDERENKORTING_ZERO_FROM_CENTS) return 0;
  if (aggregateIncomeCents <= OUDERENKORTING_FULL_UNTIL_CENTS) {
    return OUDERENKORTING_MAX_CENTS;
  }
  const excess = fromCents(aggregateIncomeCents - OUDERENKORTING_FULL_UNTIL_CENTS);
  const reduction = mulRate(
    excess,
    OUDERENKORTING_PHASEOUT_RATE.n,
    OUDERENKORTING_PHASEOUT_RATE.d,
  );
  const credit = max0Scaled(fromCents(OUDERENKORTING_MAX_CENTS) - reduction);
  return toCentsRoundHalfUp(
    clampScaled(credit, BigInt(0), fromCents(OUDERENKORTING_MAX_CENTS)),
  );
}
