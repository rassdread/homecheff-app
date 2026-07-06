/**
 * Barter openness resolution for forms and save payloads — Phase 5B-D.
 * Uses existing BarterOpenness enum only; no inference beyond accepted-values rule.
 */

import type { BarterOpenness } from '@prisma/client';

export const BARTER_OPENNESS_VALUES = [
  'MONEY',
  'MONEY_AND_BARTER',
  'BARTER_ONLY',
] as const satisfies readonly BarterOpenness[];

export type BarterOpennessValue = (typeof BARTER_OPENNESS_VALUES)[number];

export function isBarterOpennessValue(raw: unknown): raw is BarterOpennessValue {
  const s = String(raw ?? '').toUpperCase();
  return BARTER_OPENNESS_VALUES.includes(s as BarterOpennessValue);
}

/** Form prefill: preserve stored value; infer MONEY_AND_BARTER when accepted values exist but DB value is missing. */
export function resolveBarterOpennessForFormPrefill(
  raw: unknown,
  acceptedSpecializations: string[],
): BarterOpennessValue {
  if (isBarterOpennessValue(raw)) {
    return raw;
  }
  if (acceptedSpecializations.length > 0) {
    return 'MONEY_AND_BARTER';
  }
  return 'MONEY';
}

/**
 * Save payload: when accepted values are set and openness was never chosen (null),
 * default to MONEY_AND_BARTER so matching does not fall back to MONEY-only.
 * Explicit MONEY with accepted values is preserved (user choice via selector).
 */
export function resolveBarterOpennessForSave(input: {
  barterOpenness: BarterOpennessValue;
  acceptedSpecializations: string[];
}): BarterOpenness {
  return input.barterOpenness;
}

/** UI hint: bump to MONEY_AND_BARTER when user adds accepted values while still on default MONEY. */
export function suggestBarterOpennessAfterAcceptedValuesChange(
  current: BarterOpennessValue,
  acceptedCount: number,
): BarterOpennessValue {
  if (acceptedCount > 0 && current === 'MONEY') {
    return 'MONEY_AND_BARTER';
  }
  return current;
}

export function barterOpennessRequiresAcceptedValues(
  openness: BarterOpennessValue,
): boolean {
  return openness === 'BARTER_ONLY';
}
