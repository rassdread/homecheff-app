import {
  clampScaled,
  fromCents,
  max0Scaled,
  mulRate,
  toCentsRoundHalfUp,
} from '../math/scaled';
import {
  AK_T1_MAX_CENTS,
  AK_T1_RATE,
  AK_T2_BASE_CENTS,
  AK_T2_BASE_INCOME_CENTS,
  AK_T2_END_CENTS,
  AK_T2_RATE,
  AK_T3_BASE_CENTS,
  AK_T3_BASE_INCOME_CENTS,
  AK_T3_END_CENTS,
  AK_T3_RATE,
  AK_T4_BASE_CENTS,
  AK_T4_BASE_INCOME_CENTS,
  AK_T4_END_CENTS,
  AK_T4_PHASEOUT_RATE,
  AK_ZERO_FROM_CENTS,
} from '../rulesets/nl/2026/core-constants';
import {
  AK_AOW_T1_RATE,
  AK_AOW_T2_BASE_CENTS,
  AK_AOW_T2_RATE,
  AK_AOW_T3_BASE_CENTS,
  AK_AOW_T3_RATE,
  AK_AOW_T4_BASE_CENTS,
  AK_AOW_T4_PHASEOUT_RATE,
} from '../rulesets/nl/2026/personal-tax-parameters';

export function calculateEmploymentTaxCredit2026BelowAow(
  arbeidsinkomenCents: number,
): number {
  if (!Number.isInteger(arbeidsinkomenCents)) {
    throw new Error('arbeidsinkomenCents must be integer cents');
  }
  if (arbeidsinkomenCents < 0) {
    throw new Error('arbeidsinkomenCents must be >= 0');
  }
  if (arbeidsinkomenCents === 0) return 0;
  if (arbeidsinkomenCents >= AK_ZERO_FROM_CENTS) return 0;

  let scaled;
  if (arbeidsinkomenCents <= AK_T1_MAX_CENTS) {
    scaled = mulRate(
      fromCents(arbeidsinkomenCents),
      AK_T1_RATE.n,
      AK_T1_RATE.d,
    );
  } else if (arbeidsinkomenCents <= AK_T2_END_CENTS) {
    const extra = fromCents(arbeidsinkomenCents - AK_T2_BASE_INCOME_CENTS);
    scaled =
      fromCents(AK_T2_BASE_CENTS) +
      mulRate(extra, AK_T2_RATE.n, AK_T2_RATE.d);
  } else if (arbeidsinkomenCents <= AK_T3_END_CENTS) {
    const extra = fromCents(arbeidsinkomenCents - AK_T3_BASE_INCOME_CENTS);
    scaled =
      fromCents(AK_T3_BASE_CENTS) +
      mulRate(extra, AK_T3_RATE.n, AK_T3_RATE.d);
  } else if (arbeidsinkomenCents <= AK_T4_END_CENTS) {
    const extra = fromCents(arbeidsinkomenCents - AK_T4_BASE_INCOME_CENTS);
    scaled = max0Scaled(
      fromCents(AK_T4_BASE_CENTS) -
        mulRate(extra, AK_T4_PHASEOUT_RATE.n, AK_T4_PHASEOUT_RATE.d),
    );
  } else {
    return 0;
  }

  return toCentsRoundHalfUp(clampScaled(scaled, BigInt(0), fromCents(1_000_000_000)));
}

export function calculateEmploymentTaxCredit2026FullYearAow(
  arbeidsinkomenCents: number,
): number {
  if (!Number.isInteger(arbeidsinkomenCents)) {
    throw new Error('arbeidsinkomenCents must be integer cents');
  }
  if (arbeidsinkomenCents < 0) {
    throw new Error('arbeidsinkomenCents must be >= 0');
  }
  if (arbeidsinkomenCents === 0) return 0;
  if (arbeidsinkomenCents >= AK_ZERO_FROM_CENTS) return 0;

  let scaled;
  if (arbeidsinkomenCents <= AK_T1_MAX_CENTS) {
    scaled = mulRate(
      fromCents(arbeidsinkomenCents),
      AK_AOW_T1_RATE.n,
      AK_AOW_T1_RATE.d,
    );
  } else if (arbeidsinkomenCents <= AK_T2_END_CENTS) {
    const extra = fromCents(arbeidsinkomenCents - AK_T2_BASE_INCOME_CENTS);
    scaled =
      fromCents(AK_AOW_T2_BASE_CENTS) +
      mulRate(extra, AK_AOW_T2_RATE.n, AK_AOW_T2_RATE.d);
  } else if (arbeidsinkomenCents <= AK_T3_END_CENTS) {
    const extra = fromCents(arbeidsinkomenCents - AK_T3_BASE_INCOME_CENTS);
    scaled =
      fromCents(AK_AOW_T3_BASE_CENTS) +
      mulRate(extra, AK_AOW_T3_RATE.n, AK_AOW_T3_RATE.d);
  } else if (arbeidsinkomenCents <= AK_T4_END_CENTS) {
    const extra = fromCents(arbeidsinkomenCents - AK_T4_BASE_INCOME_CENTS);
    scaled = max0Scaled(
      fromCents(AK_AOW_T4_BASE_CENTS) -
        mulRate(extra, AK_AOW_T4_PHASEOUT_RATE.n, AK_AOW_T4_PHASEOUT_RATE.d),
    );
  } else {
    return 0;
  }

  return toCentsRoundHalfUp(clampScaled(scaled, BigInt(0), fromCents(1_000_000_000)));
}
