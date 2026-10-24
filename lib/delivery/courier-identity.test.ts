import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classifyStripeConnectIdentity } from './courier-identity';

describe('stripe connect identity', () => {
  it('does not treat payouts_enabled as a government document check', () => {
    const result = classifyStripeConnectIdentity({
      id: 'acct_test',
      payouts_enabled: true,
      individual: { verification: { status: 'unverified' } },
    });
    assert.equal(result.state, 'DETAILS_DUE');
    assert.equal(result.stripeReportsIdentityVerified, false);
    assert.equal(result.governmentDocumentStoredByHomeCheff, false);
    assert.equal(result.assignmentBlockedForMissingDocument, false);
    assert.equal(result.payoutsEnabled, true);
  });

  it('records the status Stripe actually returns', () => {
    assert.equal(classifyStripeConnectIdentity(null).state, 'NOT_CONNECTED');
    assert.equal(
      classifyStripeConnectIdentity({
        id: 'acct_test',
        individual: { verification: { status: 'pending' } },
      }).state,
      'PENDING',
    );
    const verified = classifyStripeConnectIdentity({
      id: 'acct_test',
      payouts_enabled: true,
      individual: { verification: { status: 'verified' } },
    });
    assert.equal(verified.state, 'STRIPE_REPORTS_VERIFIED');
    assert.equal(verified.stripeReportsIdentityVerified, true);
    assert.equal(verified.governmentDocumentStoredByHomeCheff, false);
  });

  it('keeps a disabled account restricted even when verification says verified', () => {
    const result = classifyStripeConnectIdentity({
      id: 'acct_test',
      payouts_enabled: false,
      requirements: { disabled_reason: 'requirements.past_due' },
      individual: { verification: { status: 'verified' } },
    });
    assert.equal(result.state, 'RESTRICTED');
    assert.equal(result.stripeReportsIdentityVerified, false);
  });
});
