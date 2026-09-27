/**
 * Propagate HomeCheff's canonical DOB onto a PARTICULAR Connect account.
 *
 * Does not create a Person, does not attach a guardian to the account, and
 * does not overwrite a DOB Stripe already stored.
 */

import type Stripe from 'stripe';
import {
  calendarYmdInTimeZone,
  parseSubmittedDateOfBirth,
} from '@/lib/delivery/delivery-age';

export type StripeDobParts = { day: number; month: number; year: number };

export function canonicalDobToStripeParts(
  dateOfBirth: Date | string | null | undefined,
): StripeDobParts | null {
  const parsed = parseSubmittedDateOfBirth(dateOfBirth);
  if (!parsed.ok) return null;
  const ymd = calendarYmdInTimeZone(parsed.stored, 'UTC');
  return { day: ymd.day, month: ymd.month, year: ymd.year };
}

export function stripeIndividualDobIsSet(
  account: Pick<Stripe.Account, 'individual'> | null | undefined,
): boolean {
  const dob = account?.individual?.dob;
  return Boolean(dob?.day && dob?.month && dob?.year);
}

/**
 * Fill individual.dob only when Stripe has none yet.
 * The account individual remains the representative; no guardian Person is created.
 */
export async function propagateCanonicalDobIfStripeEmpty(params: {
  stripe: Pick<Stripe, 'accounts'>;
  account: Stripe.Account;
  dateOfBirth: Date | string | null | undefined;
}): Promise<{ applied: boolean; reason: 'ALREADY_SET' | 'NO_CANONICAL_DOB' | 'APPLIED' }> {
  if (stripeIndividualDobIsSet(params.account)) {
    return { applied: false, reason: 'ALREADY_SET' };
  }
  const dob = canonicalDobToStripeParts(params.dateOfBirth);
  if (!dob) return { applied: false, reason: 'NO_CANONICAL_DOB' };
  await params.stripe.accounts.update(params.account.id, {
    individual: { dob },
  });
  return { applied: true, reason: 'APPLIED' };
}
