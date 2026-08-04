/**
 * Authoritative commercial delivery age calculation (Phase 1).
 * Uses calendar DOB with birthday-has-occurred logic — not year subtraction alone.
 */

export const COMMERCIAL_DELIVERY_MIN_AGE = 18;

export const COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL =
  'Commerciële bezorgdiensten via HomeCheff zijn momenteel beschikbaar vanaf 18 jaar. Je account en andere mogelijkheden op HomeCheff blijven gewoon beschikbaar.';

export const COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_EN =
  'Commercial delivery services via HomeCheff are currently available from age 18. Your account and other HomeCheff features remain available.';

export type AgeFromDobResult =
  | { ok: true; ageYears: number }
  | { ok: false; reason: 'MISSING_DOB' | 'INVALID_DOB' };

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Compute whole years of age at `now` from date of birth.
 * Birthday today counts as having turned that age.
 */
export function calculateAgeFromDob(
  dateOfBirth: Date | string | null | undefined,
  now: Date = new Date()
): AgeFromDobResult {
  const dob = toDate(dateOfBirth);
  if (!dob) {
    return { ok: false, reason: dateOfBirth == null ? 'MISSING_DOB' : 'INVALID_DOB' };
  }
  if (dob.getTime() > now.getTime()) {
    return { ok: false, reason: 'INVALID_DOB' };
  }

  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  const dayDiff = now.getDate() - dob.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  if (age < 0 || age > 150) {
    return { ok: false, reason: 'INVALID_DOB' };
  }

  return { ok: true, ageYears: age };
}

export function isAtLeastCommercialDeliveryAge(
  dateOfBirth: Date | string | null | undefined,
  now: Date = new Date(),
  minAge: number = COMMERCIAL_DELIVERY_MIN_AGE
): boolean {
  const result = calculateAgeFromDob(dateOfBirth, now);
  return result.ok && result.ageYears >= minAge;
}

/**
 * Commercial eligibility from DOB when age gate is on.
 * Missing/invalid DOB → fail closed (not eligible).
 * When gate is off, callers should not use this for blocking.
 */
export function resolveCommercialDeliveryAgeYears(params: {
  dateOfBirth?: Date | string | null;
  /** Legacy profile integer — never sufficient alone when gate is on. */
  profileAge?: number | null;
  now?: Date;
  ageGateEnabled: boolean;
}): {
  eligible: boolean;
  ageYears: number | null;
  reason:
    | 'OK'
    | 'UNDERAGE'
    | 'MISSING_DOB'
    | 'INVALID_DOB'
    | 'GATE_DISABLED';
} {
  const now = params.now ?? new Date();

  if (!params.ageGateEnabled) {
    if (
      typeof params.profileAge === 'number' &&
      Number.isFinite(params.profileAge)
    ) {
      return {
        eligible: params.profileAge >= COMMERCIAL_DELIVERY_MIN_AGE,
        ageYears: params.profileAge,
        reason:
          params.profileAge >= COMMERCIAL_DELIVERY_MIN_AGE ? 'OK' : 'UNDERAGE',
      };
    }
    return { eligible: true, ageYears: null, reason: 'GATE_DISABLED' };
  }

  const fromDob = calculateAgeFromDob(params.dateOfBirth, now);
  if (!fromDob.ok) {
    return {
      eligible: false,
      ageYears: null,
      reason: fromDob.reason,
    };
  }

  if (fromDob.ageYears < COMMERCIAL_DELIVERY_MIN_AGE) {
    return {
      eligible: false,
      ageYears: fromDob.ageYears,
      reason: 'UNDERAGE',
    };
  }

  return {
    eligible: true,
    ageYears: fromDob.ageYears,
    reason: 'OK',
  };
}

export function logCommercialAgeBlock(params: {
  boundary:
    | 'signup'
    | 'activation'
    | 'online'
    | 'matching'
    | 'accept'
    | 'payout'
    | 'public';
  userId?: string;
  profileId?: string;
  reason: string;
}): void {
  console.info('[delivery-age-gate]', {
    boundary: params.boundary,
    userId: params.userId ?? null,
    profileId: params.profileId ?? null,
    reason: params.reason,
  });
}
