import { prisma } from '@/lib/prisma';
import {
  calculateAgeFromDob,
  COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL,
  COMMERCIAL_DELIVERY_MIN_AGE,
  formatDateOfBirthIso,
  isDateOfBirthLocked,
  parseSubmittedDateOfBirth,
} from '@/lib/delivery/delivery-age';

export type ConfirmUserDateOfBirthResult =
  | {
      ok: true;
      dateOfBirthIso: string;
      ageYears: number;
      eligible: boolean;
      locked: true;
    }
  | {
      ok: false;
      status: number;
      code: 'USER_NOT_FOUND' | 'DOB_LOCKED' | 'MISSING_DOB' | 'INVALID_DOB';
      error: string;
    };

/**
 * First-confirmation write to canonical User.dateOfBirth.
 * Does not create a second DOB source. DeliveryProfile.age is only a
 * derived legacy snapshot when a delivery row exists.
 */
export async function confirmUserDateOfBirth(
  userId: string,
  raw: unknown,
): Promise<ConfirmUserDateOfBirthResult> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { dateOfBirth: true },
  });
  if (!existing) {
    return {
      ok: false,
      status: 404,
      code: 'USER_NOT_FOUND',
      error: 'Gebruiker niet gevonden.',
    };
  }
  if (isDateOfBirthLocked(existing.dateOfBirth)) {
    return {
      ok: false,
      status: 409,
      code: 'DOB_LOCKED',
      error: COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL,
    };
  }

  const parsed = parseSubmittedDateOfBirth(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      status: 400,
      code: parsed.reason,
      error:
        parsed.reason === 'MISSING_DOB'
          ? 'Vul je geboortedatum in.'
          : 'Deze geboortedatum is ongeldig.',
    };
  }

  const age = calculateAgeFromDob(parsed.stored);
  if (!age.ok) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_DOB',
      error: 'Deze geboortedatum is ongeldig.',
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { dateOfBirth: parsed.stored },
    }),
    prisma.deliveryProfile.updateMany({
      where: { userId },
      data: { age: age.ageYears },
    }),
  ]);

  return {
    ok: true,
    dateOfBirthIso: formatDateOfBirthIso(parsed.stored) ?? '',
    ageYears: age.ageYears,
    eligible: age.ageYears >= COMMERCIAL_DELIVERY_MIN_AGE,
    locked: true,
  };
}
