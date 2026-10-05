import {
  isDisposableCertEmail,
  isInternalTestKeepEmail,
  isInternalTestKeepUsername,
} from '@/lib/certification/internal-test-identities';

const TEMP_GOOGLE_USERNAME = /^temp_\d+_/i;
const TOMBSTONE_EMAIL = /^deleted\+.+@accounts\.homecheff\.internal$/i;

export type CertHygieneFacts = {
  email: string | null;
  username: string | null;
  bio: string | null;
  accountDeletedAt: Date | string | null;
  stripeConnectAccountId: string | null;
  sellerStripeCustomerId: string | null;
  sellerStripeSubscriptionId: string | null;
  affiliateStripeAccountId: string | null;
  paymentEvidence: boolean;
  crossAccountFinancial: boolean;
  activePublicProducts: number;
  publishedDishes: number;
  follows: number;
  messages: number;
};

export type CertHygieneDecision =
  | 'DISPOSE_LIVE'
  | 'FINISH_TOMBSTONE'
  | 'RETAIN_FIXTURE'
  | 'RETAIN_FINANCIAL'
  | 'RETAIN_ORDINARY'
  | 'NOOP_TOMBSTONE'
  | 'RETAIN_MANUAL';

export function isCanonicalTombstoneEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return TOMBSTONE_EMAIL.test(email.trim());
}

export function isTempGoogleUsername(username: string | null | undefined): boolean {
  if (!username) return false;
  return TEMP_GOOGLE_USERNAME.test(username.trim());
}

function hasStripe(facts: CertHygieneFacts): boolean {
  return Boolean(
    facts.stripeConnectAccountId ||
      facts.sellerStripeCustomerId ||
      facts.sellerStripeSubscriptionId ||
      facts.affiliateStripeAccountId,
  );
}

function hasUnsafeResidue(facts: CertHygieneFacts): boolean {
  return (
    facts.activePublicProducts > 0 ||
    facts.publishedDishes > 0 ||
    facts.follows > 0 ||
    facts.messages > 0 ||
    facts.crossAccountFinancial
  );
}

/**
 * Strict technical predicate. Ordinary emails, Google temp_ usernames,
 * and already-correct tombstones are never cleanup candidates.
 */
export function decideCertHygiene(facts: CertHygieneFacts): CertHygieneDecision {
  if (isInternalTestKeepEmail(facts.email) || isInternalTestKeepUsername(facts.username)) {
    return 'RETAIN_FIXTURE';
  }
  if (isCanonicalTombstoneEmail(facts.email)) return 'NOOP_TOMBSTONE';
  if (isTempGoogleUsername(facts.username) && !isDisposableCertEmail(facts.email)) {
    return 'RETAIN_ORDINARY';
  }
  if (!isDisposableCertEmail(facts.email)) return 'RETAIN_ORDINARY';
  if (facts.paymentEvidence || hasStripe(facts) || facts.crossAccountFinancial) {
    return 'RETAIN_FINANCIAL';
  }
  if (hasUnsafeResidue(facts)) return 'RETAIN_MANUAL';
  if (facts.accountDeletedAt) return 'FINISH_TOMBSTONE';
  if (/certificationFixture\s*=\s*true/i.test(facts.bio || '')) return 'DISPOSE_LIVE';
  return 'RETAIN_MANUAL';
}
