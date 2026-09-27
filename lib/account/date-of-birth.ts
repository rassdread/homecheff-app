/**
 * Canonical HomeCheff account date of birth.
 *
 * CANONICAL_DOB_SOURCE = User.dateOfBirth
 * DOB_STORAGE = DateTime UTC noon for the civil Y-M-D (Europe/Amsterdam eligibility).
 * Delivery, seller and affiliate all read this same field. There is no
 * deliveryBirthDate / sellerBirthDate.
 *
 * DOB_CHANGE_POLICY = first write only. After confirmation the value is locked
 * so a user cannot activate Delivery and then change DOB to bypass 18+.
 * Recalculation on the stored date still unlocks Delivery on the actual 18th
 * birthday without any edit.
 *
 * STRIPE_KYC_RELATION = Stripe Connect identity/DOB is payout KYC only.
 * It never writes User.dateOfBirth and never satisfies the Delivery 18+ gate.
 */

import type { PrismaClient } from '@prisma/client';
import {
  calculateAgeFromDob,
  COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL,
  evaluateDeliveryAgeRequirement,
  formatDateOfBirthIso,
  formatDateOfBirthNl,
  isDateOfBirthLocked,
  parseSubmittedDateOfBirth,
} from '@/lib/delivery/delivery-age';

type DobClient = Pick<PrismaClient, 'user' | 'deliveryProfile'>;

export type CanonicalDobPersistOk = {
  ok: true;
  wrote: boolean;
  stored: Date;
  locked: true;
  eligible: boolean;
  status: ReturnType<typeof evaluateDeliveryAgeRequirement>['status'];
  dateOfBirthIso: string;
  dateOfBirthNl: string;
};

export type CanonicalDobPersistErr = {
  ok: false;
  status: number;
  code: 'MISSING_DOB' | 'INVALID_DOB' | 'DOB_LOCKED' | 'USER_NOT_FOUND';
  error: string;
  stored: Date | null;
};

export async function persistCanonicalDateOfBirth(
  prisma: DobClient,
  params: {
    userId: string;
    raw: unknown;
    /** signup: keep existing DOB. confirm-api: 409 when already set. */
    onLocked?: 'keep' | 'error';
  },
): Promise<CanonicalDobPersistOk | CanonicalDobPersistErr> {
  const parsed = parseSubmittedDateOfBirth(params.raw);
  if (!parsed.ok) {
    return {
      ok: false,
      status: 400,
      code: parsed.reason,
      error:
        parsed.reason === 'MISSING_DOB'
          ? 'Vul je geboortedatum in (dd/mm/jjjj).'
          : 'Vul een geldige geboortedatum in (dd/mm/jjjj).',
      stored: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, dateOfBirth: true },
  });
  if (!user) {
    return {
      ok: false,
      status: 404,
      code: 'USER_NOT_FOUND',
      error: 'Gebruiker niet gevonden.',
      stored: null,
    };
  }

  if (isDateOfBirthLocked(user.dateOfBirth)) {
    if (params.onLocked === 'error') {
      return {
        ok: false,
        status: 409,
        code: 'DOB_LOCKED',
        error: COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL,
        stored: user.dateOfBirth,
      };
    }
    const stored = user.dateOfBirth as Date;
    const age = evaluateDeliveryAgeRequirement({ dateOfBirth: stored });
    return {
      ok: true,
      wrote: false,
      stored,
      locked: true,
      eligible: age.eligible,
      status: age.status,
      dateOfBirthIso: formatDateOfBirthIso(stored) || '',
      dateOfBirthNl: formatDateOfBirthNl(stored) || '',
    };
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: { dateOfBirth: parsed.stored },
  });

  const ageYears = calculateAgeFromDob(parsed.stored);
  if (ageYears.ok) {
    await prisma.deliveryProfile.updateMany({
      where: { userId: params.userId },
      data: { age: ageYears.ageYears },
    });
  }

  const age = evaluateDeliveryAgeRequirement({ dateOfBirth: parsed.stored });
  return {
    ok: true,
    wrote: true,
    stored: parsed.stored,
    locked: true,
    eligible: age.eligible,
    status: age.status,
    dateOfBirthIso: formatDateOfBirthIso(parsed.stored) || '',
    dateOfBirthNl: formatDateOfBirthNl(parsed.stored) || '',
  };
}

export function serializeOwnerDateOfBirth(dateOfBirth: Date | string | null | undefined) {
  const locked = isDateOfBirthLocked(dateOfBirth);
  const age = evaluateDeliveryAgeRequirement({ dateOfBirth });
  return {
    hasDateOfBirth: locked,
    locked,
    dateOfBirthIso: locked ? formatDateOfBirthIso(dateOfBirth) : null,
    dateOfBirthNl: locked ? formatDateOfBirthNl(dateOfBirth) : null,
    deliveryAgeEligible: age.eligible,
    deliveryAgeStatus: age.status,
  };
}
