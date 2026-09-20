import {
  clampScaled,
  fromCents,
  max0Scaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  AHK_FULL_MAX_INCOME_CENTS,
  AHK_MAX_CENTS,
  AHK_PHASEOUT_RATE,
  AHK_ZERO_FROM_CENTS,
} from '../rulesets/nl/2026/core-constants';
import {
  AHK_AOW_FULL_MAX_INCOME_CENTS,
  AHK_AOW_MAX_CENTS,
  AHK_AOW_PHASEOUT_RATE,
  AHK_AOW_ZERO_FROM_CENTS,
} from '../rulesets/nl/2026/personal-tax-parameters';

export function calculateGeneralTaxCredit2026BelowAow(
  aggregateIncomeCents: number,
): number {
  if (!Number.isInteger(aggregateIncomeCents)) {
    throw new Error('aggregateIncomeCents must be integer cents');
  }
  if (aggregateIncomeCents < 0) {
    throw new Error('aggregateIncomeCents must be >= 0');
  }
  if (aggregateIncomeCents >= AHK_ZERO_FROM_CENTS) return 0;
  if (aggregateIncomeCents <= AHK_FULL_MAX_INCOME_CENTS) {
    return AHK_MAX_CENTS;
  }
  const excess = fromCents(aggregateIncomeCents - AHK_FULL_MAX_INCOME_CENTS);
  const reduction = mulRate(
    excess,
    AHK_PHASEOUT_RATE.n,
    AHK_PHASEOUT_RATE.d,
  );
  const credit = max0Scaled(fromCents(AHK_MAX_CENTS) - reduction);
  return toCentsRoundHalfUp(
    clampScaled(credit, BigInt(0), fromCents(AHK_MAX_CENTS)),
  );
}

export function calculateGeneralTaxCredit2026FullYearAow(
  aggregateIncomeCents: number,
): number {
  if (!Number.isInteger(aggregateIncomeCents)) {
    throw new Error('aggregateIncomeCents must be integer cents');
  }
  if (aggregateIncomeCents < 0) {
    throw new Error('aggregateIncomeCents must be >= 0');
  }
  if (aggregateIncomeCents >= AHK_AOW_ZERO_FROM_CENTS) return 0;
  if (aggregateIncomeCents <= AHK_AOW_FULL_MAX_INCOME_CENTS) {
    return AHK_AOW_MAX_CENTS;
  }
  const excess = fromCents(aggregateIncomeCents - AHK_AOW_FULL_MAX_INCOME_CENTS);
  const reduction = mulRate(
    excess,
    AHK_AOW_PHASEOUT_RATE.n,
    AHK_AOW_PHASEOUT_RATE.d,
  );
  const credit = max0Scaled(fromCents(AHK_AOW_MAX_CENTS) - reduction);
  return toCentsRoundHalfUp(
    clampScaled(credit, BigInt(0), fromCents(AHK_AOW_MAX_CENTS)),
  );
}
