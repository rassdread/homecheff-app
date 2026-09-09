/**
 * Unit tests: affiliate Connect mirror + destination resolution.
 * Run: npx tsx --test lib/stripe/affiliate-connect-mirror.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveAffiliateConnectDestination } from './affiliate-connect-mirror';

describe('resolveAffiliateConnectDestination', () => {
  it('prefers User Connect over Affiliate mirror', () => {
    const d = resolveAffiliateConnectDestination({
      userStripeConnectAccountId: 'acct_user',
      userStripeConnectOnboardingCompleted: true,
      affiliateStripeConnectAccountId: 'acct_aff',
      affiliateStripeConnectOnboardingCompleted: false,
    });
    assert.equal(d.accountId, 'acct_user');
    assert.equal(d.onboardingCompleted, true);
    assert.equal(d.source, 'user');
  });

  it('falls back to Affiliate when User has no account', () => {
    const d = resolveAffiliateConnectDestination({
      userStripeConnectAccountId: null,
      userStripeConnectOnboardingCompleted: false,
      affiliateStripeConnectAccountId: 'acct_aff',
      affiliateStripeConnectOnboardingCompleted: true,
    });
    assert.equal(d.accountId, 'acct_aff');
    assert.equal(d.onboardingCompleted, true);
    assert.equal(d.source, 'affiliate');
  });

  it('returns none when neither has an account', () => {
    const d = resolveAffiliateConnectDestination({});
    assert.equal(d.accountId, null);
    assert.equal(d.source, 'none');
  });
});
