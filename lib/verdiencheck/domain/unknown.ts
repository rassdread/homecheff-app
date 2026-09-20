/**
 * Explicit unknown — never encode as 0 or null.
 * 0 would look like “geen belastingwijziging”.
 */

export const UNKNOWN = { unknown: true as const };

export type UnknownValue = typeof UNKNOWN;

export function isUnknown(value: unknown): value is UnknownValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'unknown' in value &&
    (value as { unknown: unknown }).unknown === true
  );
}

export type CentsOrUnknown = number | UnknownValue;
