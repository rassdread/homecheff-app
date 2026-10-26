import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { classifyCourierStripeIdentity, courierIdentityMessage } from './courier-identity';
import { paidIdentityAllowsDelivery } from './courier-paid-identity';
import { enforcePaidDeliveryIdentity } from './courier-identity-sync';
import { syncCourierConnectAccount } from './delivery-webhook-events';

const verified = {
  id: 'acct_test',
  business_type: 'individual',
  charges_enabled: true,
  payouts_enabled: true,
  details_submitted: true,
  requirements: { currently_due: [] as string[], disabled_reason: null },
  individual: { verification: { status: 'verified', details_code: null } },
};

describe('stripe connect identity evidence', () => {
  it('does not treat payouts, charges, or an empty due list as identity verification', () => {
    const payoutsOnly = classifyCourierStripeIdentity({
      ...verified,
      individual: { verification: { status: 'unverified', details_code: null } },
    });
    assert.equal(payoutsOnly.state, 'NOT_STARTED');
    assert.equal(payoutsOnly.paidDeliveryAllowed, false);
    assert.equal(payoutsOnly.explicitDocumentVerified, false);
    assert.equal(payoutsOnly.governmentDocumentStoredByHomeCheff, false);

    const emptyDue = classifyCourierStripeIdentity({
      id: 'acct_test',
      payouts_enabled: true,
      charges_enabled: true,
      details_submitted: true,
      requirements: { currently_due: [], disabled_reason: null },
    });
    assert.equal(emptyDue.state, 'UNKNOWN');
    assert.equal(emptyDue.paidDeliveryAllowed, false);
  });

  it('allows paid delivery only when Stripe reports individual.verification verified', () => {
    const result = classifyCourierStripeIdentity(verified);
    assert.equal(result.state, 'VERIFIED');
    assert.equal(result.stripeReportsIdentityVerified, true);
    assert.equal(result.explicitDocumentVerified, false);
    assert.equal(result.paidDeliveryAllowed, true);
    assert.match(courierIdentityMessage('VERIFIED').nl, /geen identiteitsdocument/);
    assert.doesNotMatch(courierIdentityMessage('VERIFIED').en, /passport/i);
  });

  it('keeps pending, failed, restricted, and company accounts off paid delivery', () => {
    assert.equal(
      classifyCourierStripeIdentity({
        ...verified,
        individual: { verification: { status: 'pending', details_code: null } },
      }).state,
      'PENDING',
    );
    assert.equal(
      classifyCourierStripeIdentity({
        ...verified,
        individual: { verification: { status: 'unverified', details_code: 'document_unverified_other' } },
      }).state,
      'FAILED',
    );
    const restricted = classifyCourierStripeIdentity({
      ...verified,
      requirements: { disabled_reason: 'requirements.past_due', currently_due: ['individual.verification.document'] },
    });
    assert.equal(restricted.state, 'RESTRICTED');
    assert.equal(restricted.paidDeliveryAllowed, false);
    assert.equal(
      classifyCourierStripeIdentity({
        id: 'acct_company',
        business_type: 'company',
        payouts_enabled: true,
        details_submitted: true,
      }).state,
      'UNKNOWN',
    );
    assert.equal(classifyCourierStripeIdentity(null).state, 'NOT_STARTED');
  });

  it('does not keep a stale or missing verified flag', () => {
    const now = new Date('2026-10-26T12:00:00Z');
    assert.equal(
      paidIdentityAllowsDelivery({
        state: 'VERIFIED',
        checkedAt: new Date('2026-10-26T11:50:00Z'),
        now,
      }),
      true,
    );
    assert.equal(
      paidIdentityAllowsDelivery({
        state: 'VERIFIED',
        checkedAt: new Date('2026-10-26T11:00:00Z'),
        now,
      }),
      false,
    );
    assert.equal(paidIdentityAllowsDelivery({ state: null, checkedAt: now, now }), false);
    assert.equal(
      paidIdentityAllowsDelivery({ state: 'VERIFIED', checkedAt: now, now, suspended: true }),
      false,
    );
  });

  it('refreshes a restricted account and does not trust a stale verified flag or a missing Stripe response', async () => {
    const writes: Array<Record<string, unknown>> = [];
    const now = new Date('2026-10-26T12:00:00Z');
    const db = {
      deliveryProfile: {
        findUnique: async () => ({
          id: 'p1',
          isBlocked: false,
          stripeIdentityState: 'VERIFIED',
          stripeIdentityCheckedAt: new Date('2026-10-26T10:00:00Z'),
          user: { stripeConnectAccountId: 'acct_a' },
        }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          writes.push(data);
          return data;
        },
      },
    };
    const unavailable = await enforcePaidDeliveryIdentity(db as never, 'p1', {
      now,
      retrieve: async () => null,
    });
    assert.equal(unavailable.ok, false);
    assert.equal(writes.length, 0);

    const restricted = await enforcePaidDeliveryIdentity(db as never, 'p1', {
      now,
      retrieve: async () => ({
        id: 'acct_a',
        payouts_enabled: true,
        requirements: { disabled_reason: 'requirements.past_due' },
        individual: { verification: { status: 'verified' } },
      }),
    });
    assert.equal(restricted.ok, false);
    assert.equal(writes[0]?.stripeIdentityState, 'RESTRICTED');

    const mismatch = await enforcePaidDeliveryIdentity(db as never, 'p1', {
      now,
      retrieve: async () => ({ id: 'acct_other', payouts_enabled: true }),
    });
    assert.equal(mismatch.ok, false);
    assert.equal(writes.length, 1);
  });

  it('does not update a courier when the Stripe account matches more than one user', async () => {
    let updates = 0;
    const db = {
      user: { findMany: async () => [{ id: 'a' }, { id: 'b' }] },
      deliveryProfile: { update: async () => { updates += 1; } },
    };
    const synced = await syncCourierConnectAccount(db as never, {
      id: 'acct_shared',
      payouts_enabled: true,
      individual: { verification: { status: 'verified' } },
    });
    assert.equal(synced.updated, false);
    assert.equal(updates, 0);
  });

  it('keeps paid assignment, pickup, and completion on the same server gate', () => {
    const root = new URL('../../', import.meta.url);
    const files = [
      'app/api/delivery/orders/[orderId]/accept/route.ts',
      'app/api/delivery/orders/[orderId]/update-status/route.ts',
      'app/api/delivery/match-orders/route.ts',
      'app/api/delivery/assign-order/route.ts',
      'app/api/admin/delivery/orders/[orderId]/assign/route.ts',
      'lib/delivery/booking-request-service.ts',
      'lib/delivery/delivery-request-service.ts',
      'app/api/stripe/webhook/route.ts',
    ];
    for (const file of files) {
      const source = readFileSync(new URL(file, root), 'utf8');
      assert.match(source, /enforcePaidDeliveryIdentity/);
    }
    const sync = readFileSync(new URL('lib/delivery/courier-identity-sync.ts', root), 'utf8');
    assert.doesNotMatch(sync, /verification\.document/);
    assert.match(courierIdentityMessage('UNKNOWN').nl, /niet als gecontroleerd/);
  });
});
