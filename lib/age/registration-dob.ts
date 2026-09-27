import { parseSubmittedDateOfBirth } from '@/lib/delivery/delivery-age';
import { evaluateMarketplaceEligibility } from '@/lib/age/marketplace-eligibility';

export type RegistrationDobResult =
  | { ok: true; stored: Date }
  | {
      ok: false;
      status: number;
      code: string;
      error: string;
      messageEn: string;
    };

/**
 * New password registrations must send a real civil DOB.
 * Month/year alone is rejected so age is not computed from day 1.
 */
export function registrationDobFromBody(body: {
  dateOfBirth?: unknown;
  birthDate?: unknown;
  birthDay?: unknown;
  birthMonth?: unknown;
  birthYear?: unknown;
}): RegistrationDobResult {
  const direct = body.dateOfBirth ?? body.birthDate;
  const raw =
    direct != null && String(direct).trim() !== ''
      ? direct
      : body.birthDay && body.birthMonth && body.birthYear
        ? `${body.birthDay}/${body.birthMonth}/${body.birthYear}`
        : null;
  const parsed = parseSubmittedDateOfBirth(raw);
  if (!parsed.ok) {
    return {
      ok: false,
      status: 400,
      code: 'DOB_REQUIRED',
      error: 'Vul je echte geboortedatum in (dd/mm/jjjj).',
      messageEn: 'Enter your real date of birth (dd/mm/yyyy).',
    };
  }
  const gate = evaluateMarketplaceEligibility({
    subject: { dateOfBirth: parsed.stored },
    activity: 'REGISTER',
  });
  if (!gate.allowed) {
    return {
      ok: false,
      status: 403,
      code: gate.code,
      error: gate.messageNl,
      messageEn: gate.messageEn,
    };
  }
  return { ok: true, stored: parsed.stored };
}
