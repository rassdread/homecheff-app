/**
 * Canonical HomeCheff age bands.
 *
 * Source of truth is User.dateOfBirth via calculateAgeFromDob
 * (Europe/Amsterdam civil Y-M-D, birthday today counts).
 * Client flags such as isAdult / isMinor / over18 are never an input.
 */

import {
  calculateAgeFromDob,
  type AgeFromDobResult,
} from '@/lib/delivery/delivery-age';

export const MARKETPLACE_MIN_AGE = 13;
export const ADULT_AGE = 18;

export type AgeBand =
  | 'UNDER_13'
  | 'AGE_13_15'
  | 'AGE_16_17'
  | 'AGE_18_PLUS';

export type ResolvedAge =
  | {
      ok: true;
      ageYears: number;
      band: AgeBand;
    }
  | {
      ok: false;
      reason: 'MISSING_DOB' | 'INVALID_DOB';
    };

export function ageBandForYears(ageYears: number): AgeBand {
  if (ageYears < MARKETPLACE_MIN_AGE) return 'UNDER_13';
  if (ageYears <= 15) return 'AGE_13_15';
  if (ageYears <= 17) return 'AGE_16_17';
  return 'AGE_18_PLUS';
}

export function resolveAgeFromDob(
  dateOfBirth: Date | string | null | undefined,
  now: Date = new Date(),
): ResolvedAge {
  const calculated: AgeFromDobResult = calculateAgeFromDob(dateOfBirth, now);
  if (!calculated.ok) {
    return { ok: false, reason: calculated.reason };
  }
  return {
    ok: true,
    ageYears: calculated.ageYears,
    band: ageBandForYears(calculated.ageYears),
  };
}

export function isMinorBand(band: AgeBand | null | undefined): boolean {
  return band === 'AGE_13_15' || band === 'AGE_16_17';
}
