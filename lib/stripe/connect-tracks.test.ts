/**
 * Dual-track Connect unit tests.
 * Run: npx tsx --test lib/stripe/connect-tracks.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildBusinessConnectAccountParams,
  buildParticularConnectAccountParams,
  classifyStuckExpressCandidate,
  isHomecheffPaymentReady,
  parseConnectTrack,
  PARTICULAR_SERVICE_AGREEMENT,
} from './connect-tracks';

describe('parseConnectTrack', () => {
  it('accepts PARTICULAR and BUSINESS', () => {
    assert.equal(parseConnectTrack('PARTICULAR'), 'PARTICULAR');
    assert.equal(parseConnectTrack('BUSINESS'), 'BUSINESS');
    assert.equal(parseConnectTrack('particulier'), null);
    assert.equal(parseConnectTrack(null), null);
  });
});

describe('buildParticularConnectAccountParams', () => {
  it('creates dashboard=none individual with transfers + card_payments (no company)', () => {
    const p = buildParticularConnectAccountParams('a@example.com', 'NL');
    assert.equal(p.business_type, 'individual');
    assert.equal(p.country, 'NL');
    assert.equal(p.controller?.stripe_dashboard?.type, 'none');
    assert.equal(p.controller?.requirement_collection, 'application');
    assert.equal(p.controller?.losses?.payments, 'application');
    assert.equal(p.controller?.fees?.payer, 'application');
    assert.equal(p.capabilities?.transfers?.requested, true);
    assert.equal(p.capabilities?.card_payments?.requested, true);
    assert.equal((p as any).type, undefined);
    assert.equal(p.tos_acceptance, undefined);
    assert.equal(PARTICULAR_SERVICE_AGREEMENT, 'full');
  });
});

describe('buildBusinessConnectAccountParams', () => {
  it('creates Express with transfers + card_payments (unchanged)', () => {
    const p = buildBusinessConnectAccountParams('b@example.com', 'NL');
    assert.equal(p.type, 'express');
    assert.equal(p.capabilities?.transfers?.requested, true);
    assert.equal(p.capabilities?.card_payments?.requested, true);
  });
});

describe('isHomecheffPaymentReady', () => {
  it('BUSINESS Express requires charges+payouts', () => {
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: true,
        payoutsEnabled: true,
        connectTrack: 'BUSINESS',
        accountType: 'express',
        dashboardType: 'express',
      }),
      true,
    );
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: false,
        payoutsEnabled: true,
        transfersCapability: 'active',
        connectTrack: 'BUSINESS',
        accountType: 'express',
        dashboardType: 'express',
      }),
      false,
    );
  });

  it('PARTICULAR ready with payouts+transfers even if charges false', () => {
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: false,
        payoutsEnabled: true,
        transfersCapability: 'active',
        connectTrack: 'PARTICULAR',
        dashboardType: 'none',
        accountType: 'custom',
      }),
      true,
    );
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: false,
        payoutsEnabled: true,
        transfersCapability: 'inactive',
        connectTrack: 'PARTICULAR',
        dashboardType: 'none',
      }),
      false,
    );
  });

  it('PARTICULAR readiness ignores inactive card_payments (not a HC gate)', () => {
    // card_payments is not even an input — regression: incomplete KYC must not
    // force business/failed classification via charges_enabled alone.
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: false,
        payoutsEnabled: true,
        transfersCapability: 'active',
        connectTrack: 'PARTICULAR',
        dashboardType: 'none',
        accountType: 'custom',
      }),
      true,
    );
  });

  it('disabled_reason blocks readiness', () => {
    assert.equal(
      isHomecheffPaymentReady({
        chargesEnabled: false,
        payoutsEnabled: true,
        transfersCapability: 'active',
        connectTrack: 'PARTICULAR',
        dashboardType: 'none',
        disabledReason: 'requirements.past_due',
      }),
      false,
    );
  });
});

describe('classifyStuckExpressCandidate', () => {
  it('classifies active, stuck, wrong nonprofit', () => {
    assert.equal(
      classifyStuckExpressCandidate({
        type: 'express',
        business_type: 'individual',
        charges_enabled: true,
        payouts_enabled: true,
      }),
      'LEGACY_INDIVIDUAL_EXPRESS_ACTIVE',
    );
    assert.equal(
      classifyStuckExpressCandidate({
        type: 'express',
        business_type: 'non_profit',
        charges_enabled: false,
        payouts_enabled: false,
      }),
      'WRONG_NONPROFIT_OR_COMPANY_CHOICE',
    );
    assert.equal(
      classifyStuckExpressCandidate({
        type: 'express',
        business_type: null,
        charges_enabled: false,
        payouts_enabled: false,
      }),
      'STUCK_PRIVATE_EXPRESS',
    );
  });
});
