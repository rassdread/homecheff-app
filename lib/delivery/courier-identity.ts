/**
 * Stripe Connect identity as HomeCheff can actually read it.
 * A completed account is not treated as proof that HomeCheff inspected a passport
 * or identity card. HomeCheff does not store those documents.
 * Assignment stays on age, profile completion, and suspension.
 * Money movement stays on the existing transfers and payouts_enabled checks.
 */

export type StripeIdentityState =
  | 'NOT_CONNECTED'
  | 'DETAILS_DUE'
  | 'PENDING'
  | 'STRIPE_REPORTS_VERIFIED'
  | 'RESTRICTED';

export type StripeIdentityAccount = {
  id?: string | null;
  payouts_enabled?: boolean | null;
  requirements?: {
    disabled_reason?: string | null;
    currently_due?: string[] | null;
  } | null;
  individual?: {
    verification?: { status?: string | null } | null;
  } | null;
};

export type StripeIdentityClassification = {
  state: StripeIdentityState;
  stripeReportsIdentityVerified: boolean;
  governmentDocumentStoredByHomeCheff: false;
  assignmentBlockedForMissingDocument: false;
  payoutsEnabled: boolean;
};

export function classifyStripeConnectIdentity(
  account: StripeIdentityAccount | null | undefined,
): StripeIdentityClassification {
  const base = {
    governmentDocumentStoredByHomeCheff: false as const,
    assignmentBlockedForMissingDocument: false as const,
    payoutsEnabled: account?.payouts_enabled === true,
  };
  if (!account?.id) {
    return { ...base, state: 'NOT_CONNECTED', stripeReportsIdentityVerified: false, payoutsEnabled: false };
  }
  if (account.requirements?.disabled_reason) {
    return { ...base, state: 'RESTRICTED', stripeReportsIdentityVerified: false };
  }
  const status = account.individual?.verification?.status ?? null;
  if (status === 'verified') {
    return { ...base, state: 'STRIPE_REPORTS_VERIFIED', stripeReportsIdentityVerified: true };
  }
  if (status === 'pending') {
    return { ...base, state: 'PENDING', stripeReportsIdentityVerified: false };
  }
  return { ...base, state: 'DETAILS_DUE', stripeReportsIdentityVerified: false };
}
