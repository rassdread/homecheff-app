/**
 * Unit tests for shared Stripe Connect UI status derivation.
 * Run: npx tsx --test lib/stripe/connect-account-status.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type Stripe from 'stripe';
import {
  canCreateConnectOnboardingLink,
  connectCtaModelForSnapshot,
  connectCtaModelForStatus,
  deriveConnectAccountStatusFromStripe,
  normalizeStripeConnectStatus,
  shouldEmitStripeOnboardAction,
} from './connect-account-status';

function fakeAccount(partial: Partial<Stripe.Account> & {
  requirements?: Partial<Stripe.Account.Requirements>;
  capabilities?: Partial<Stripe.Account.Capabilities>;
  controller?: { stripe_dashboard?: { type?: string | null } };
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
    assert.equal(s.canCreateOnboardingLink, true);
  });

  it('PAYMENT_READY when charges+payouts enabled (business)', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
      }),
      { connectTrack: 'BUSINESS' },
    );
    assert.equal(s.uiStatus, 'PAYMENT_READY');
    assert.equal(s.paymentReady, true);
    assert.equal(s.canCreateOnboardingLink, false);
    assert.equal(shouldEmitStripeOnboardAction(s.uiStatus), false);
    assert.equal(connectCtaModelForStatus(s.uiStatus).showOnboardingCta, false);
  });

  it('PARTICULAR ready ignores charges_enabled / card_payments', () => {
    const s = normalizeStripeConnectStatus(
      fakeAccount({
        details_submitted: true,
        charges_enabled: false,
        payouts_enabled: true,
        capabilities: { transfers: 'active', card_payments: 'inactive' },
        controller: { stripe_dashboard: { type: 'none' } },
      }),
      'PARTICULAR',
    );
    assert.equal(s.paymentReady, true);
    assert.equal(s.uiStatus, 'PAYMENT_READY');
    assert.equal(s.canCreateOnboardingLink, false);
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
      }),
    );
    assert.equal(s.uiStatus, 'PENDING_VERIFICATION');
    assert.equal(s.canCreateOnboardingLink, false);
    assert.equal(shouldEmitStripeOnboardAction(s.uiStatus), false);
    assert.equal(connectCtaModelForSnapshot(s).showOnboardingCta, false);
  });

  it('PENDING_VERIFICATION when disabled_reason is pending_verification (loop root cause)', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({
        details_submitted: true,
        charges_enabled: false,
        payouts_enabled: false,
        capabilities: { transfers: 'pending', card_payments: 'pending' },
        controller: { stripe_dashboard: { type: 'none' } },
        requirements: {
          currently_due: [],
          past_due: [],
          pending_verification: ['company.verification.document'],
          eventually_due: [],
          disabled_reason: 'requirements.pending_verification',
        },
      }),
      { connectTrack: 'PARTICULAR' },
    );
    assert.equal(s.uiStatus, 'PENDING_VERIFICATION');
    assert.equal(s.canCreateOnboardingLink, false);
    assert.equal(connectCtaModelForSnapshot(s).showOnboardingCta, false);
    assert.match(connectCtaModelForSnapshot(s).titleNl, /gecontroleerd/i);
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
      }),
    );
    assert.equal(s.uiStatus, 'ACTION_REQUIRED');
    assert.equal(s.canCreateOnboardingLink, true);
    assert.equal(shouldEmitStripeOnboardAction(s.uiStatus), true);
    assert.ok(s.missingCategories.includes('identity'));
  });

  it('INCOMPLETE when account exists but form not submitted', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({ details_submitted: false }),
    );
    assert.equal(s.uiStatus, 'INCOMPLETE');
    assert.equal(s.canCreateOnboardingLink, true);
    assert.equal(
      connectCtaModelForStatus(s.uiStatus).ctaLabelNl,
      'Gegevens afronden',
    );
  });

  it('RESTRICTED without due items cannot create Account Link', () => {
    const s = deriveConnectAccountStatusFromStripe(
      fakeAccount({
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: true,
        requirements: {
          currently_due: [],
          past_due: [],
          pending_verification: [],
          eventually_due: [],
          disabled_reason: 'rejected.fraud',
        },
      }),
      { connectTrack: 'BUSINESS' },
    );
    // paymentReady false because disabledReason
    assert.equal(s.paymentReady, false);
    assert.equal(s.uiStatus, 'RESTRICTED');
    assert.equal(canCreateConnectOnboardingLink(s), false);
    assert.equal(connectCtaModelForSnapshot(s).showOnboardingCta, false);
  });

  it('CTA matrix labels for all statuses', () => {
    assert.equal(
      connectCtaModelForStatus('NOT_STARTED').ctaLabelNl,
      'Betaalaccount instellen',
    );
    assert.equal(
      connectCtaModelForStatus('INCOMPLETE').ctaLabelNl,
      'Gegevens afronden',
    );
    assert.equal(
      connectCtaModelForStatus('PENDING_VERIFICATION').showOnboardingCta,
      false,
    );
    assert.equal(
      connectCtaModelForStatus('ACTION_REQUIRED').ctaLabelNl,
      'Gegevens afronden',
    );
    assert.equal(
      connectCtaModelForStatus('PAYMENT_READY').showOnboardingCta,
      false,
    );
    assert.equal(
      connectCtaModelForStatus('PAYMENT_READY').titleNl,
      'Betaalaccount gereed',
    );
  });
});

describe('success copy contract', () => {
  it('PAYMENT_READY success model is explicit about payment account', () => {
    const m = connectCtaModelForStatus('PAYMENT_READY');
    assert.match(m.titleNl, /gereed|actief|klaar/i);
    assert.match(m.bodyNl, /betalingen/i);
    assert.equal(m.showOnboardingCta, false);
  });
});
