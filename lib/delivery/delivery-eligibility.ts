import type { DeliveryProfile } from '@prisma/client';
import {
  COMMERCIAL_DELIVERY_MIN_AGE,
  COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
  logCommercialAgeBlock,
  resolveCommercialDeliveryAgeYears,
} from '@/lib/delivery/delivery-age';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';

/** @deprecated Use COMMERCIAL_DELIVERY_MIN_AGE — kept as alias for imports. */
export const DELIVERY_MIN_AGE = COMMERCIAL_DELIVERY_MIN_AGE;

export type DelivererAcceptProfile = Pick<
  DeliveryProfile,
  'id' | 'userId' | 'isVerified' | 'isActive' | 'age'
> & {
  isBlocked?: boolean | null;
  user?: {
    dateOfBirth?: Date | string | null;
    id?: string;
  } | null;
};

export type DelivererAcceptDenial = {
  ok: false;
  status: 403;
  error: string;
  code:
    | 'DELIVERY_NOT_ACTIVE'
    | 'DELIVERY_NOT_VERIFIED'
    | 'DELIVERY_UNDERAGE'
    | 'DELIVERY_DOB_REQUIRED'
    | 'DELIVERY_BLOCKED';
};

export type DelivererAcceptAllow = { ok: true };

export type DelivererAcceptResult = DelivererAcceptDenial | DelivererAcceptAllow;

export type CommercialEligibilityInput = {
  profile: DelivererAcceptProfile | null | undefined;
  dateOfBirth?: Date | string | null;
  now?: Date;
  /** Override flags (tests). */
  ageGateEnabled?: boolean;
  boundary?:
    | 'signup'
    | 'activation'
    | 'online'
    | 'matching'
    | 'accept'
    | 'payout'
    | 'public';
};

/**
 * Commercial courier eligibility — 18+ with DOB fail-closed when gate enabled.
 * Fee amount is irrelevant (zero-price does not bypass).
 */
export function assertCommercialCourierEligible(
  input: CommercialEligibilityInput
): DelivererAcceptResult {
  const { profile } = input;
  if (!profile) {
    return {
      ok: false,
      status: 403,
      error: 'Geen bezorger profiel gevonden',
      code: 'DELIVERY_NOT_ACTIVE',
    };
  }

  if (profile.isBlocked) {
    logCommercialAgeBlock({
      boundary: input.boundary ?? 'accept',
      userId: profile.userId,
      profileId: profile.id,
      reason: 'DELIVERY_BLOCKED',
    });
    return {
      ok: false,
      status: 403,
      error: 'Je bezorgerprofiel is geblokkeerd.',
      code: 'DELIVERY_BLOCKED',
    };
  }

  if (!profile.isActive) {
    return {
      ok: false,
      status: 403,
      error: 'Je bezorgerprofiel is niet actief. Neem contact op met HomeCheff.',
      code: 'DELIVERY_NOT_ACTIVE',
    };
  }

  if (!profile.isVerified) {
    return {
      ok: false,
      status: 403,
      error:
        'Je bezorgerprofiel is nog niet geverifieerd. Zodra HomeCheff je profiel heeft goedgekeurd, kun je opdrachten accepteren.',
      code: 'DELIVERY_NOT_VERIFIED',
    };
  }

  const ageGateEnabled =
    input.ageGateEnabled ??
    getDeliveryAlignmentFlags().commercialAgeGate18Enabled;

  const dob =
    input.dateOfBirth ?? profile.user?.dateOfBirth ?? null;

  const ageResolution = resolveCommercialDeliveryAgeYears({
    dateOfBirth: dob,
    profileAge: profile.age,
    now: input.now,
    ageGateEnabled,
  });

  if (!ageResolution.eligible) {
    const code =
      ageResolution.reason === 'MISSING_DOB' ||
      ageResolution.reason === 'INVALID_DOB'
        ? 'DELIVERY_DOB_REQUIRED'
        : 'DELIVERY_UNDERAGE';

    logCommercialAgeBlock({
      boundary: input.boundary ?? 'accept',
      userId: profile.userId,
      profileId: profile.id,
      reason: code,
    });

    return {
      ok: false,
      status: 403,
      error:
        code === 'DELIVERY_DOB_REQUIRED'
          ? 'Voor commerciële bezorging is een geldige geboortedatum vereist. Werk je profiel bij of neem contact op met support.'
          : COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
      code,
    };
  }

  return { ok: true };
}

/**
 * Backend gate: only verified, active, unblocked deliverers meeting commercial
 * age rules may accept platform delivery jobs.
 */
export function assertDelivererCanAccept(
  profile: DelivererAcceptProfile | null | undefined,
  options?: {
    dateOfBirth?: Date | string | null;
    now?: Date;
    ageGateEnabled?: boolean;
  }
): DelivererAcceptResult {
  return assertCommercialCourierEligible({
    profile,
    dateOfBirth: options?.dateOfBirth,
    now: options?.now,
    ageGateEnabled: options?.ageGateEnabled,
    boundary: 'accept',
  });
}

/**
 * Signup / activation gate (does not require isVerified yet).
 */
export function assertCommercialCourierAgeForActivation(params: {
  dateOfBirth?: Date | string | null;
  claimedAge?: number | null;
  userId?: string;
  now?: Date;
  ageGateEnabled?: boolean;
}): DelivererAcceptResult {
  const ageGateEnabled =
    params.ageGateEnabled ??
    getDeliveryAlignmentFlags().commercialAgeGate18Enabled;

  if (!ageGateEnabled) {
    if (
      typeof params.claimedAge === 'number' &&
      params.claimedAge < COMMERCIAL_DELIVERY_MIN_AGE
    ) {
      return {
        ok: false,
        status: 403,
        error: COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
        code: 'DELIVERY_UNDERAGE',
      };
    }
    return { ok: true };
  }

  // Prefer DOB when present
  if (params.dateOfBirth != null && params.dateOfBirth !== '') {
    const resolution = resolveCommercialDeliveryAgeYears({
      dateOfBirth: params.dateOfBirth,
      profileAge: params.claimedAge,
      now: params.now,
      ageGateEnabled: true,
    });
    if (!resolution.eligible) {
      const code =
        resolution.reason === 'MISSING_DOB' ||
        resolution.reason === 'INVALID_DOB'
          ? 'DELIVERY_DOB_REQUIRED'
          : 'DELIVERY_UNDERAGE';
      logCommercialAgeBlock({
        boundary: 'signup',
        userId: params.userId,
        reason: code,
      });
      return {
        ok: false,
        status: 403,
        error:
          code === 'DELIVERY_DOB_REQUIRED'
            ? 'Voor commerciële bezorging is een geldige geboortedatum vereist.'
            : COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
        code,
      };
    }
  }

  // Signup may use claimed age when DOB not yet on account; matching/accept still require DOB.
  if (
    typeof params.claimedAge !== 'number' ||
    !Number.isFinite(params.claimedAge) ||
    params.claimedAge < COMMERCIAL_DELIVERY_MIN_AGE
  ) {
    logCommercialAgeBlock({
      boundary: 'signup',
      userId: params.userId,
      reason: 'DELIVERY_UNDERAGE',
    });
    return {
      ok: false,
      status: 403,
      error: COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
      code: 'DELIVERY_UNDERAGE',
    };
  }

  return { ok: true };
}

/**
 * True when profile may appear in commercial matching.
 * Under-18 or missing DOB (gate on) → excluded even if isActive.
 */
export function isCommerciallyMatchableDeliverer(params: {
  isActive: boolean;
  isVerified: boolean;
  isBlocked?: boolean;
  dateOfBirth?: Date | string | null;
  profileAge?: number | null;
  now?: Date;
  ageGateEnabled?: boolean;
}): boolean {
  if (!params.isActive || !params.isVerified || params.isBlocked) {
    return false;
  }
  const ageGateEnabled =
    params.ageGateEnabled ??
    getDeliveryAlignmentFlags().commercialAgeGate18Enabled;
  const resolution = resolveCommercialDeliveryAgeYears({
    dateOfBirth: params.dateOfBirth,
    profileAge: params.profileAge,
    now: params.now,
    ageGateEnabled,
  });
  return resolution.eligible;
}

export function delivererAcceptDenialResponse(denial: DelivererAcceptDenial) {
  return {
    error: denial.error,
    code: denial.code,
  };
}

/** Matching / availability: only verified active profiles (age filtered in query layer). */
export function delivererMatchingWhere() {
  return {
    isActive: true,
    isVerified: true,
    isBlocked: false,
  } as const;
}

/**
 * Payout gate — under-18 must not receive new commercial courier payouts.
 * Zero fee does not bypass (caller still invokes gate).
 */
export function assertCommercialCourierCanReceivePayout(params: {
  profile: DelivererAcceptProfile | null | undefined;
  dateOfBirth?: Date | string | null;
  now?: Date;
  ageGateEnabled?: boolean;
}): DelivererAcceptResult {
  const { profile } = params;
  if (!profile) {
    return {
      ok: false,
      status: 403,
      error: 'Geen bezorger profiel gevonden',
      code: 'DELIVERY_NOT_ACTIVE',
    };
  }

  const ageGateEnabled =
    params.ageGateEnabled ??
    getDeliveryAlignmentFlags().commercialAgeGate18Enabled;

  const resolution = resolveCommercialDeliveryAgeYears({
    dateOfBirth: params.dateOfBirth ?? profile.user?.dateOfBirth,
    profileAge: profile.age,
    now: params.now,
    ageGateEnabled,
  });

  if (!resolution.eligible) {
    const code =
      resolution.reason === 'MISSING_DOB' ||
      resolution.reason === 'INVALID_DOB'
        ? 'DELIVERY_DOB_REQUIRED'
        : 'DELIVERY_UNDERAGE';
    logCommercialAgeBlock({
      boundary: 'payout',
      userId: profile.userId,
      profileId: profile.id,
      reason: code,
    });
    return {
      ok: false,
      status: 403,
      error: COMMERCIAL_DELIVERY_UNDERAGE_MESSAGE_NL,
      code,
    };
  }

  return { ok: true };
}
