/**
 * Connect migration classifier + readiness matrix tests.
 * Run: npx tsx --test lib/stripe/connect-migration.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  classifyConnectMigration,
  migrationNeedsUserConfirmation,
  migrationIsRecoveryMode,
} from './connect-migration';
import { isHomecheffPaymentReady } from './connect-tracks';

describe('classifyConnectMigration', () => {
  it('CASE1 legacy working Express individual → KEEP_LEGACY, no confirmation', () => {
    const c = classifyConnectMigration({
      stripeConnectAccountId: 'acct_legacy',
      stripeConnectTrack: null,
      paymentReady: true,
      stripeAccount: {
        type: 'express',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
        controller: { stripe_dashboard: { type: 'express' } },
      },
    });
    assert.equal(c, 'KEEP_LEGACY');
    assert.equal(migrationNeedsUserConfirmation(c), false);
  });

  it('CASE2 valid BUSINESS Express ready → KEEP_BUSINESS', () => {
    const c = classifyConnectMigration({
      stripeConnectAccountId: 'acct_biz',
      stripeConnectTrack: 'BUSINESS',
      paymentReady: true,
      stripeAccount: {
        type: 'express',
        business_type: 'company',
        charges_enabled: true,
        payouts_enabled: true,
        controller: { stripe_dashboard: { type: 'express' } },
      },
    });
    assert.equal(c, 'KEEP_BUSINESS');
    assert.equal(migrationNeedsUserConfirmation(c), false);
  });

  it('CASE3 stuck Express + unknown track → USER_CONFIRMATION_REQUIRED', () => {
    const c = classifyConnectMigration({
      stripeConnectAccountId: 'acct_stuck',
      stripeConnectTrack: null,
      paymentReady: false,
      stripeAccount: {
        type: 'express',
        business_type: null,
        charges_enabled: false,
        payouts_enabled: false,
        controller: { stripe_dashboard: { type: 'express' } },
      },
    });
    assert.equal(c, 'USER_CONFIRMATION_REQUIRED');
    assert.equal(migrationIsRecoveryMode(c), true);
  });

  it('CASE4 wrong non_profit → USER_CONFIRMATION_REQUIRED', () => {
    const c = classifyConnectMigration({
      stripeConnectAccountId: 'acct_np',
      stripeConnectTrack: null,
      paymentReady: false,
      stripeAccount: {
        type: 'express',
        business_type: 'non_profit',
        charges_enabled: false,
        payouts_enabled: false,
        controller: { stripe_dashboard: { type: 'express' } },
      },
    });
    assert.equal(c, 'USER_CONFIRMATION_REQUIRED');
  });

  it('CASE5 BUSINESS track + stuck still confirmation (explicit flip allowed)', () => {
    const c = classifyConnectMigration({
      stripeConnectAccountId: 'acct_biz_stuck',
      stripeConnectTrack: 'BUSINESS',
      paymentReady: false,
      stripeAccount: {
        type: 'express',
        business_type: 'non_profit',
        charges_enabled: false,
        payouts_enabled: false,
        controller: { stripe_dashboard: { type: 'express' } },
      },
    });
    assert.equal(c, 'USER_CONFIRMATION_REQUIRED');
  });

  it('KEEP_PARTICULAR for dashboard=none + PARTICULAR track', () => {
    const c = classifyConnectMigration({
      stripeConnectAccountId: 'acct_part',
      stripeConnectTrack: 'PARTICULAR',
      paymentReady: false,
      stripeAccount: {
        type: 'custom',
        business_type: 'individual',
        charges_enabled: false,
        payouts_enabled: false,
        controller: { stripe_dashboard: { type: 'none' } },
        capabilities: { transfers: 'inactive' },
      },
    });
    assert.equal(c, 'KEEP_PARTICULAR');
    assert.equal(migrationNeedsUserConfirmation(c), false);
  });

  it('NEW_ACCOUNT_CHOICE when no account', () => {
    assert.equal(
      classifyConnectMigration({
        stripeConnectAccountId: null,
        stripeConnectTrack: null,
        paymentReady: false,
      }),
      'NEW_ACCOUNT_CHOICE',
    );
  });
});

describe('readiness during migration (CASE12/13)', () => {
  it('CASE12 incomplete particular → checkout blocked', () => {
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: false,
        payoutsEnabled: false,
        transfersCapability: 'inactive',
        connectTrack: 'PARTICULAR',
        dashboardType: 'none',
        disabledReason: 'requirements.past_due',
      }),
      false,
    );
  });

  it('CASE13 particular ready → checkout enabled', () => {
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: false,
        payoutsEnabled: true,
        transfersCapability: 'active',
        connectTrack: 'PARTICULAR',
        dashboardType: 'none',
        disabledReason: null,
      }),
      true,
    );
  });

  it('BUSINESS still requires charges+payouts', () => {
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: false,
        payoutsEnabled: true,
        transfersCapability: 'active',
        connectTrack: 'BUSINESS',
        dashboardType: 'express',
        accountType: 'express',
      }),
      false,
    );
  });
});
