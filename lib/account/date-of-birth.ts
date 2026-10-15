/**
 * Canonical HomeCheff account date of birth.
 *
 * CANONICAL_DOB_SOURCE = User.dateOfBirth
 * DOB_STORAGE = DateTime UTC noon for the civil Y-M-D (Europe/Amsterdam eligibility).
 * Delivery, seller and affiliate all read this same field. There is no
 * deliveryBirthDate / sellerBirthDate.
 *
 * DOB_CHANGE_POLICY = the account owner can correct a wrong civil date from
 * settings. A correction updates only User.dateOfBirth (and the derived
 * DeliveryProfile.age snapshot). It does not call Stripe, does not mark
 * Connect onboarding complete, and does not grant payout or business rights.
 * Age gates, the under-13 minimum, parental consent and the 18+ business
 * checks keep reading the stored date. First confirmation via POST still
 * refuses a second write; corrections go through PUT.
 *
 * STRIPE_KYC_RELATION = Stripe Connect identity/DOB is payout KYC only.
 * It never writes User.dateOfBirth and never satisfies the Delivery 18+ gate.
 */

import { randomUUID } from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { ageBandForYears, type AgeBand } from '@/lib/age/age-band';
import {
  calculateAgeFromDob,
  COMMERCIAL_DELIVERY_DOB_LOCKED_MESSAGE_NL,
  evaluateDeliveryAgeRequirement,
  formatDateOfBirthIso,
  formatDateOfBirthNl,
  isDateOfBirthLocked,
  parseSubmittedDateOfBirth,
} from '@/lib/delivery/delivery-age';

/** Whole years above this are rejected as an unrealistic birth date. */
export const MAX_REALISTIC_AGE_YEARS = 120;

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

export type DateOfBirthCorrectionCode =
  | 'MISSING_DOB'
  | 'INVALID_DOB'
  | 'UNREALISTIC_DOB'
  | 'UNDER_13'
  | 'USER_NOT_FOUND'
  | 'FORBIDDEN';

export type DateOfBirthCorrectionOk = {
  ok: true;
  wrote: boolean;
  dateOfBirthIso: string;
  dateOfBirthNl: string;
  ageYears: number;
  ageBand: AgeBand;
  previousAgeBand: AgeBand | null;
  ageBandChanged: boolean;
  stripeIdentityPreserved: boolean;
  eligible: boolean;
  status: ReturnType<typeof evaluateDeliveryAgeRequirement>['status'];
};

export type DateOfBirthCorrectionErr = {
  ok: false;
  status: number;
  code: DateOfBirthCorrectionCode;
  error: string;
  errorEn: string;
};

type CorrectionClient = Pick<PrismaClient, 'user' | 'deliveryProfile' | 'auditLog'>;

/**
 * True when a caller tries to name a different user than the session.
 * The correction itself always uses the session id.
 */
export function foreignDateOfBirthTarget(
  sessionUserId: string,
  requestedUserId: unknown,
): boolean {
  return (
    typeof requestedUserId === 'string' &&
    requestedUserId.trim().length > 0 &&
    requestedUserId !== sessionUserId
  );
}

export function dateOfBirthCorrectionCopy(
  code: DateOfBirthCorrectionCode,
  language: 'nl' | 'en',
): string {
  const nl: Record<DateOfBirthCorrectionCode, string> = {
    MISSING_DOB: 'Vul je geboortedatum in.',
    INVALID_DOB: 'Deze geboortedatum is ongeldig. Gebruik een echte kalenderdatum die niet in de toekomst ligt.',
    UNREALISTIC_DOB: 'Deze geboortedatum is niet realistisch. Controleer het jaartal.',
    UNDER_13: 'HomeCheff-accounts zijn beschikbaar vanaf 13 jaar. Een geboortedatum onder die leeftijd kan niet worden opgeslagen.',
    USER_NOT_FOUND: 'Gebruiker niet gevonden.',
    FORBIDDEN: 'Je kunt alleen je eigen geboortedatum wijzigen.',
  };
  const en: Record<DateOfBirthCorrectionCode, string> = {
    MISSING_DOB: 'Enter your date of birth.',
    INVALID_DOB: 'This date of birth is invalid. Use a real calendar date that is not in the future.',
    UNREALISTIC_DOB: 'This date of birth is not realistic. Check the year.',
    UNDER_13: 'HomeCheff accounts are available from age 13. A date of birth below that age cannot be saved.',
    USER_NOT_FOUND: 'User not found.',
    FORBIDDEN: 'You can only change your own date of birth.',
  };
  return language === 'en' ? en[code] : nl[code];
}

/**
 * Owner correction of User.dateOfBirth.
 * Crossing 17→18 or 18→16 updates the age band only. Stripe Connect, payout
 * readiness and parental-consent records are left untouched.
 */
export async function correctCanonicalDateOfBirth(
  prisma: CorrectionClient,
  params: { userId: string; raw: unknown },
): Promise<DateOfBirthCorrectionOk | DateOfBirthCorrectionErr> {
  const parsed = parseSubmittedDateOfBirth(params.raw);
  if (!parsed.ok) {
    const code = parsed.reason;
    return {
      ok: false,
      status: 400,
      code,
      error: dateOfBirthCorrectionCopy(code, 'nl'),
      errorEn: dateOfBirthCorrectionCopy(code, 'en'),
    };
  }

  const age = calculateAgeFromDob(parsed.stored);
  if (!age.ok || age.ageYears > MAX_REALISTIC_AGE_YEARS) {
    const code = age.ok ? 'UNREALISTIC_DOB' : 'INVALID_DOB';
    return {
      ok: false,
      status: 400,
      code,
      error: dateOfBirthCorrectionCopy(code, 'nl'),
      errorEn: dateOfBirthCorrectionCopy(code, 'en'),
    };
  }

  const nextBand = ageBandForYears(age.ageYears);
  if (nextBand === 'UNDER_13') {
    return {
      ok: false,
      status: 403,
      code: 'UNDER_13',
      error: dateOfBirthCorrectionCopy('UNDER_13', 'nl'),
      errorEn: dateOfBirthCorrectionCopy('UNDER_13', 'en'),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      dateOfBirth: true,
      stripeConnectAccountId: true,
    },
  });
  if (!user) {
    return {
      ok: false,
      status: 404,
      code: 'USER_NOT_FOUND',
      error: dateOfBirthCorrectionCopy('USER_NOT_FOUND', 'nl'),
      errorEn: dateOfBirthCorrectionCopy('USER_NOT_FOUND', 'en'),
    };
  }

  const previous = resolveStoredBand(user.dateOfBirth);
  const nextIso = formatDateOfBirthIso(parsed.stored) || '';
  const currentIso = formatDateOfBirthIso(user.dateOfBirth);
  const stripeIdentityPreserved = Boolean(user.stripeConnectAccountId);
  const deliveryAge = evaluateDeliveryAgeRequirement({ dateOfBirth: parsed.stored });

  if (currentIso && currentIso === nextIso) {
    return {
      ok: true,
      wrote: false,
      dateOfBirthIso: nextIso,
      dateOfBirthNl: formatDateOfBirthNl(parsed.stored) || '',
      ageYears: age.ageYears,
      ageBand: nextBand,
      previousAgeBand: previous,
      ageBandChanged: false,
      stripeIdentityPreserved,
      eligible: deliveryAge.eligible,
      status: deliveryAge.status,
    };
  }

  await prisma.user.update({
    where: { id: params.userId },
    data: { dateOfBirth: parsed.stored },
  });
  await prisma.deliveryProfile.updateMany({
    where: { userId: params.userId },
    data: { age: age.ageYears },
  });
  await prisma.auditLog.create({
    data: {
      id: randomUUID(),
      userId: params.userId,
      action: 'DATE_OF_BIRTH_CORRECTED',
      meta: {
        previousAgeBand: previous,
        ageBand: nextBand,
        ageBandChanged: previous !== nextBand,
        stripeIdentityPreserved,
      },
    },
  });

  return {
    ok: true,
    wrote: true,
    dateOfBirthIso: nextIso,
    dateOfBirthNl: formatDateOfBirthNl(parsed.stored) || '',
    ageYears: age.ageYears,
    ageBand: nextBand,
    previousAgeBand: previous,
    ageBandChanged: previous !== nextBand,
    stripeIdentityPreserved,
    eligible: deliveryAge.eligible,
    status: deliveryAge.status,
  };
}

function resolveStoredBand(dateOfBirth: Date | null): AgeBand | null {
  if (!dateOfBirth) return null;
  const age = calculateAgeFromDob(dateOfBirth);
  if (!age.ok) return null;
  return ageBandForYears(age.ageYears);
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
