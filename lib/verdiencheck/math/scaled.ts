/**
 * Integer scaled arithmetic for NL-2026 money.
 * 1 cent = CENT_SCALE scaled units. No IEEE floats.
 *
 * Intermediate remainder below 1e-6 cent is truncated toward 0 when applying a
 * rate. Component outputs round once via ROUND_HALF_UP to whole cents.
 * Official aanslag rounding is not fully specified here:
 * ROUNDING_PENDING_CERTIFICATION.
 */

export const CENT_SCALE = BigInt(1_000_000);

export const ROUNDING_STRATEGY = 'ROUND_HALF_UP_TO_CENTS' as const;
export const ROUNDING_STATUS = 'ROUNDING_PENDING_CERTIFICATION' as const;

export type Scaled = bigint;

export function fromCents(cents: number): Scaled {
  if (!Number.isInteger(cents)) {
    throw new Error(`fromCents requires integer cents, got ${cents}`);
  }
  return BigInt(cents) * CENT_SCALE;
}

export function mulRate(scaled: Scaled, numer: bigint, denom: bigint): Scaled {
  if (denom === BigInt(0)) throw new Error('division by zero');
  return (scaled * numer) / denom;
}

export function addScaled(a: Scaled, b: Scaled): Scaled {
  return a + b;
}

export function subScaled(a: Scaled, b: Scaled): Scaled {
  return a - b;
}

export function minScaled(a: Scaled, b: Scaled): Scaled {
  return a < b ? a : b;
}

export function maxScaled(a: Scaled, b: Scaled): Scaled {
  return a > b ? a : b;
}

export function max0Scaled(s: Scaled): Scaled {
  return s < BigInt(0) ? BigInt(0) : s;
}

export function clampScaled(s: Scaled, lo: Scaled, hi: Scaled): Scaled {
  if (s < lo) return lo;
  if (s > hi) return hi;
  return s;
}

/** Round half away from zero to whole cents. */
export function toCentsRoundHalfUp(scaled: Scaled): number {
  const half = CENT_SCALE / BigInt(2);
  if (scaled >= BigInt(0)) {
    return Number((scaled + half) / CENT_SCALE);
  }
  return -Number((-scaled + half) / CENT_SCALE);
}
