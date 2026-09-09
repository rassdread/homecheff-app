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

  it('RESTRICTED when disabled_reason and not payment ready', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({
        details_submitted: false,
        requirements: {
          currently_due: [],
          past_due: [],
          pending_verification: [],
          eventually_due: [],
          disabled_reason: 'requirements.past_due',
        },
      })
    );
    assert.equal(s.uiStatus, 'RESTRICTED');
    assert.equal(shouldEmitStripeOnboardAction(s.uiStatus), true);
  });

  it('CTA matrix labels for all statuses', () => {
    assert.equal(connectCtaModelForStatus('NOT_STARTED').ctaLabelNl, 'Betaalaccount instellen');
    assert.equal(connectCtaModelForStatus('INCOMPLETE').ctaLabelNl, 'Betaalaccount afronden');
    assert.equal(connectCtaModelForStatus('PENDING_VERIFICATION').showOnboardingCta, false);
    assert.equal(
      connectCtaModelForStatus('ACTION_REQUIRED').ctaLabelNl,
      'Actie nodig voor je betaalaccount',
    );
    assert.equal(connectCtaModelForStatus('PAYMENT_READY').showOnboardingCta, false);
    assert.equal(connectCtaModelForStatus('PAYMENT_READY').titleNl, 'Betaalaccount actief');
  });
});

describe('success copy contract', () => {
  it('PAYMENT_READY success model is explicit about payment account', () => {
    const m = connectCtaModelForStatus('PAYMENT_READY');
    assert.match(m.titleNl, /actief|klaar/i);
    assert.match(m.bodyNl, /betalingen/i);
    assert.equal(m.showOnboardingCta, false);
  });
});
