import type { DeliveryProfile } from '@prisma/client';

export const DELIVERY_MIN_AGE = 15;

export type DelivererAcceptProfile = Pick<
  DeliveryProfile,
  'isVerified' | 'isActive' | 'age'
>;

export type DelivererAcceptDenial = {
  ok: false;
  status: 403;
  error: string;
  code:
    | 'DELIVERY_NOT_ACTIVE'
    | 'DELIVERY_NOT_VERIFIED'
    | 'DELIVERY_UNDERAGE';
};

export type DelivererAcceptAllow = { ok: true };

export type DelivererAcceptResult = DelivererAcceptDenial | DelivererAcceptAllow;

/**
 * Backend gate: only verified, active deliverers aged 15+ may accept platform delivery jobs.
 */
export function assertDelivererCanAccept(
  profile: DelivererAcceptProfile | null | undefined
): DelivererAcceptResult {
  if (!profile) {
    return {
      ok: false,
      status: 403,
      error: 'Geen bezorger profiel gevonden',
      code: 'DELIVERY_NOT_ACTIVE',
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

  if (profile.age < DELIVERY_MIN_AGE) {
    return {
      ok: false,
      status: 403,
      error: `Je moet minimaal ${DELIVERY_MIN_AGE} jaar oud zijn om te bezorgen.`,
      code: 'DELIVERY_UNDERAGE',
    };
  }

  return { ok: true };
}

export function delivererAcceptDenialResponse(denial: DelivererAcceptDenial) {
  return {
    error: denial.error,
    code: denial.code,
  };
}

/** Matching / availability: only verified active profiles. */
export function delivererMatchingWhere() {
  return {
    isActive: true,
    isVerified: true,
  } as const;
}
