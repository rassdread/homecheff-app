/**
 * Unit tests for Connect account shape + entry state.
 * Run: npx tsx --test lib/stripe/connect-account-shape.test.ts lib/stripe/connect-entry-state.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type Stripe from 'stripe';
import {
  isParticularAccountShape,
  validateConnectAccountShape,
} from './connect-account-shape';
import { resolveConnectEntryState } from './connect-entry-state';

function fakeAccount(
  partial: Partial<Stripe.Account> & {
    controller?: { stripe_dashboard?: { type?: string | null } };
    requirements?: Partial<Stripe.Account.Requirements>;
    capabilities?: Partial<Stripe.Account.Capabilities>;
  },
): Stripe.Account {
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

describe('particular account shape', () => {
  it('accepts individual + dashboard none', () => {
    const a = fakeAccount({
      business_type: 'individual',
      controller: { stripe_dashboard: { type: 'none' } },
    });
    assert.equal(isParticularAccountShape(a), true);
    assert.equal(validateConnectAccountShape(a, 'PARTICULAR').ok, true);
  });

  it('rejects non_profit PARTICULAR', () => {
    const a = fakeAccount({
      business_type: 'non_profit',
      controller: { stripe_dashboard: { type: 'none' } },
    });
    assert.equal(isParticularAccountShape(a), false);
    const v = validateConnectAccountShape(a, 'PARTICULAR');
    assert.equal(v.ok, false);
    assert.equal(v.mismatchCode, 'PARTICULAR_ACCOUNT_CONFIGURATION_MISMATCH');
  });

  it('rejects company PARTICULAR', () => {
    const a = fakeAccount({
      business_type: 'company',
      controller: { stripe_dashboard: { type: 'none' } },
    });
    assert.equal(validateConnectAccountShape(a, 'PARTICULAR').ok, false);
  });
});

describe('resolveConnectEntryState', () => {
  it('CONFIGURATION_MISMATCH for PARTICULAR non_profit', () => {
    const entry = resolveConnectEntryState({
      stripeConnectAccountId: 'acct_bad',
      stripeConnectTrack: 'PARTICULAR',
      stripeAccount: fakeAccount({
        id: 'acct_bad',
        business_type: 'non_profit',
        details_submitted: true,
        controller: { stripe_dashboard: { type: 'none' } },
        requirements: {
          currently_due: [],
          past_due: [],
          pending_verification: ['company.verification.document'],
          eventually_due: [],
          disabled_reason: 'requirements.pending_verification',
        },
      }),
    });
    assert.equal(entry.entryState, 'RECOVER_MISMATCH');
    assert.equal(entry.classification, 'CONFIGURATION_MISMATCH');
    assert.equal(entry.canCreateOnboardingLink, false);
    assert.equal(entry.needsTrackSelection, true);
    assert.equal(entry.recoveryEligible, true);
  });

  it('PENDING_VERIFICATION for correct PARTICULAR pending', () => {
    const entry = resolveConnectEntryState({
      stripeConnectAccountId: 'acct_ok',
      stripeConnectTrack: 'PARTICULAR',
      stripeAccount: fakeAccount({
        id: 'acct_ok',
        business_type: 'individual',
        details_submitted: true,
        controller: { stripe_dashboard: { type: 'none' } },
        capabilities: { transfers: 'pending' },
        requirements: {
          currently_due: [],
          past_due: [],
          pending_verification: ['individual.verification.document'],
          eventually_due: [],
          disabled_reason: null,
        },
      }),
    });
    assert.equal(entry.entryState, 'PENDING_VERIFICATION');
    assert.equal(entry.canCreateOnboardingLink, false);
  });

  it('CHOOSE_TRACK when no account', () => {
    const entry = resolveConnectEntryState({});
    assert.equal(entry.entryState, 'CHOOSE_TRACK');
    assert.equal(entry.needsTrackSelection, true);
  });
});
