/**
 * Unit tests for shared Stripe Connect UI status derivation.
 * Run: npx tsx --test lib/stripe/connect-account-status.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type Stripe from 'stripe';
import {
  connectCtaModelForStatus,
  deriveConnectAccountStatusFromStripe,
  shouldEmitStripeOnboardAction,
} from './connect-account-status';

function fakeAccount(partial: Partial<Stripe.Account> & {
  requirements?: Partial<Stripe.Account.Requirements>;
}): Stripe.Account {
  return {
    id: 'acct_test',
    object: 'account',
    details_submitted: false,
    charges_enabled: false,
    payouts_enabled: false,
    requirements: {
      currently_due: [],
      past_due: [],
      pending_verification: [],
      eventually_due: [],
      disabled_reason: null,
      ...partial.requirements,
    },
    ...partial,
  } as Stripe.Account;
}

describe('deriveConnectAccountStatusFromStripe', () => {
  it('NOT_STARTED when no account', () => {
    const s = deriveConnectAccountStatusFromStripe(null);
    assert.equal(s.uiStatus, 'NOT_STARTED');
    assert.equal(s.paymentReady, false);
  });

  it('PAYMENT_READY when charges+payouts enabled', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
      })
    );
    assert.equal(s.uiStatus, 'PAYMENT_READY');
    assert.equal(s.paymentReady, true);
    assert.equal(shouldEmitStripeOnboardAction(s.uiStatus), false);
    assert.equal(connectCtaModelForStatus(s.uiStatus).showOnboardingCta, false);
  });

  it('PENDING_VERIFICATION when details submitted, no due, not yet enabled', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({
        details_submitted: true,
        charges_enabled: false,
        payouts_enabled: false,
        requirements: {
          currently_due: [],
          past_due: [],
          pending_verification: ['individual.verification.document'],
          eventually_due: [],
          disabled_reason: null,
        },
      })
    );
    assert.equal(s.uiStatus, 'PENDING_VERIFICATION');
    assert.equal(shouldEmitStripeOnboardAction(s.uiStatus), false);
  });

  it('ACTION_REQUIRED when currently_due has items', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({
        details_submitted: true,
        requirements: {
          currently_due: ['individual.id_number'],
          past_due: [],
          pending_verification: [],
          eventually_due: [],
          disabled_reason: null,
        },
      })
    );
    assert.equal(s.uiStatus, 'ACTION_REQUIRED');
    assert.equal(shouldEmitStripeOnboardAction(s.uiStatus), true);
  });

  it('INCOMPLETE when account exists but form not submitted', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({ details_submitted: false })
    );
    assert.equal(s.uiStatus, 'INCOMPLETE');
    assert.equal(connectCtaModelForStatus(s.uiStatus).ctaLabelNl, 'Betaalaccount afronden');
  });
});
