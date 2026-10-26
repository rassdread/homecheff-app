import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { courierPayoutReady, courierTransferReady } from '@/lib/delivery/courier-connect-eligibility';
import {
  DELIVERY_GEOGRAPHIC_PILOT,
  evaluateDeliveryAccess,
} from '@/lib/delivery/delivery-pilot-access';
import { describeDeliveryPayout, marketplaceDeliveryRefundPlan } from '@/lib/delivery/delivery-ops-queue';
import {
  expireUnpaidStandaloneCheckout,
  noteStandalonePaymentFailure,
  observeStandaloneChargeRefund,
  observeStandaloneDispute,
  recordDeliveryTransferCreated,
  standaloneCheckoutEventAction,
  syncCourierConnectAccount,
} from '@/lib/delivery/delivery-webhook-events';
import { executeDeliveryRefundDecision } from '@/lib/delivery/delivery-refund-review';
import { POST as bookPost } from '../../app/api/delivery/standalone/book/route';

const root = new URL('../../', import.meta.url);

function source(path: string) {
  return readFileSync(new URL(path, root), 'utf8');
}

const pilotEnv = {
  HOMECHEFF_DELIVERY_ENABLED: 'true',
  HOMECHEFF_DELIVERY_PILOT: 'restricted',
  HOMECHEFF_DELIVERY_PILOT_USER_IDS: 'buyer_ok',
  HOMECHEFF_DELIVERY_PILOT_COURIER_IDS: 'profile_ok,courier_user_ok',
};

test('public off stays closed until the restricted pilot allowlist matches', () => {
  const closed = evaluateDeliveryAccess({
    env: { HOMECHEFF_DELIVERY_ENABLED: 'false' },
    requesterUserId: 'buyer_ok',
    courierProfileId: 'profile_ok',
  });
  assert.equal(closed.allowed, false);
  if (!closed.allowed) assert.equal(closed.code, 'DELIVERY_DISABLED');

  const approved = evaluateDeliveryAccess({
    env: { ...pilotEnv, HOMECHEFF_DELIVERY_ENABLED: 'false' },
    requesterUserId: 'buyer_ok',
    courierProfileId: 'profile_ok',
  });
  assert.equal(approved.allowed, true);
  if (approved.allowed) assert.equal(approved.mode, 'PILOT');

  const stranger = evaluateDeliveryAccess({
    env: { ...pilotEnv, HOMECHEFF_DELIVERY_ENABLED: 'false' },
    requesterUserId: 'buyer_no',
    courierProfileId: 'profile_ok',
  });
  assert.equal(stranger.allowed, false);
  if (!stranger.allowed) assert.equal(stranger.code, 'DELIVERY_PILOT_REQUIRED');

  const buyerAsCourier = evaluateDeliveryAccess({
    env: { ...pilotEnv, HOMECHEFF_DELIVERY_ENABLED: 'false' },
    requesterUserId: 'buyer_ok',
    courierUserId: 'buyer_ok',
    courierProfileId: 'buyer_ok',
  });
  assert.equal(buyerAsCourier.allowed, false);

  const courierAsBuyer = evaluateDeliveryAccess({
    env: { ...pilotEnv, HOMECHEFF_DELIVERY_ENABLED: 'false' },
    requesterUserId: 'courier_user_ok',
    courierUserId: 'courier_user_ok',
  });
  assert.equal(courierAsBuyer.allowed, false);

  const admin = evaluateDeliveryAccess({
    env: { ...pilotEnv, HOMECHEFF_DELIVERY_ENABLED: 'false' },
    requesterUserId: 'superadmin',
    courierProfileId: 'profile_ok',
  });
  assert.equal(admin.allowed, false);
  assert.equal(DELIVERY_GEOGRAPHIC_PILOT, 'UNSUPPORTED');
});

test('restricted pilot fails closed for unknown users and couriers', () => {
  assert.equal(evaluateDeliveryAccess({
    env: { ...pilotEnv, HOMECHEFF_DELIVERY_PILOT_USER_IDS: '', HOMECHEFF_DELIVERY_PILOT_COURIER_IDS: '' },
    requesterUserId: 'buyer_ok',
    courierProfileId: 'profile_ok',
  }).allowed, false);
  const stranger = evaluateDeliveryAccess({
    env: pilotEnv,
    requesterUserId: 'buyer_no',
    courierProfileId: 'profile_ok',
  });
  assert.equal(stranger.allowed, false);
  const courier = evaluateDeliveryAccess({
    env: pilotEnv,
    requesterUserId: 'buyer_ok',
    courierProfileId: 'profile_no',
    courierUserId: 'courier_no',
  });
  assert.equal(courier.allowed, false);
  const approved = evaluateDeliveryAccess({
    env: pilotEnv,
    requesterUserId: 'buyer_ok',
    courierUserId: 'courier_user_ok',
  });
  assert.equal(approved.allowed, true);
  assert.equal(evaluateDeliveryAccess({
    env: { HOMECHEFF_DELIVERY_ENABLED: 'true' },
    requesterUserId: 'anyone',
  }).allowed, true);
});

test('a request body cannot join the restricted pilot without a session', async () => {
  const previous = {
    enabled: process.env.HOMECHEFF_DELIVERY_ENABLED,
    pilot: process.env.HOMECHEFF_DELIVERY_PILOT,
    users: process.env.HOMECHEFF_DELIVERY_PILOT_USER_IDS,
    couriers: process.env.HOMECHEFF_DELIVERY_PILOT_COURIER_IDS,
  };
  delete process.env.HOMECHEFF_DELIVERY_ENABLED;
  process.env.HOMECHEFF_DELIVERY_PILOT = 'restricted';
  process.env.HOMECHEFF_DELIVERY_PILOT_USER_IDS = 'buyer_ok';
  process.env.HOMECHEFF_DELIVERY_PILOT_COURIER_IDS = 'profile_ok';
  await assert.rejects(
    () => bookPost(new NextRequest('http://localhost/api/delivery/standalone/book', {
      method: 'POST',
      body: JSON.stringify({ deliveryProfileId: 'profile_ok', requesterUserId: 'buyer_ok' }),
    })),
    /headers/,
  );
  for (const [key, value] of Object.entries({
    HOMECHEFF_DELIVERY_ENABLED: previous.enabled,
    HOMECHEFF_DELIVERY_PILOT: previous.pilot,
    HOMECHEFF_DELIVERY_PILOT_USER_IDS: previous.users,
    HOMECHEFF_DELIVERY_PILOT_COURIER_IDS: previous.couriers,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('payout readiness requires transfers and payouts_enabled', () => {
  const now = new Date();
  assert.equal(courierTransferReady({ accountId: 'acct', transfersStatus: 'active', checkedAt: now }).ready, true);
  const payoutsOff = courierPayoutReady({
    accountId: 'acct',
    transfersStatus: 'active',
    payoutsEnabled: false,
    checkedAt: now,
  });
  assert.equal(payoutsOff.transferEligible, true);
  assert.equal(payoutsOff.payoutReady, false);
  assert.equal(payoutsOff.code, 'COURIER_PAYOUT_NOT_READY');
  const transfersOff = courierPayoutReady({
    accountId: 'acct',
    transfersStatus: 'inactive',
    payoutsEnabled: true,
    checkedAt: now,
  });
  assert.equal(transfersOff.transferEligible, false);
  assert.equal(transfersOff.code, 'COURIER_CONNECT_INCOMPLETE');
  assert.equal(courierPayoutReady({ accountId: null, payoutsEnabled: true, transfersStatus: 'active', checkedAt: now }).code, 'COURIER_CONNECT_REQUIRED');
  assert.equal(courierPayoutReady({ accountId: 'acct', transfersStatus: 'active', payoutsEnabled: null, checkedAt: now }).stale, true);
  assert.equal(courierPayoutReady({ accountId: 'acct', transfersStatus: 'active', payoutsEnabled: true, checkedAt: now }).payoutReady, true);
});

test('standalone webhook events do not fulfill failures or double-record', async () => {
  assert.equal(standaloneCheckoutEventAction('checkout.session.completed', { checkoutKind: 'STANDALONE_DELIVERY' }), 'fulfill');
  assert.equal(standaloneCheckoutEventAction('checkout.session.async_payment_succeeded', { checkoutKind: 'STANDALONE_DELIVERY' }), 'fulfill');
  assert.equal(standaloneCheckoutEventAction('checkout.session.expired', { checkoutKind: 'STANDALONE_DELIVERY' }), 'expire_if_unpaid');
  assert.equal(standaloneCheckoutEventAction('payment_intent.payment_failed', { checkoutKind: 'STANDALONE_DELIVERY' }), 'payment_failed');
  assert.equal(standaloneCheckoutEventAction('checkout.session.completed', { checkoutKind: 'ORDER' }), 'ignore');

  const requests = new Map<string, Record<string, unknown>>();
  requests.set('req_1', { id: 'req_1', paymentStatus: 'UNPAID', status: 'CHECKOUT', stripeSessionId: 'cs_1', deliveryOrderId: null });
  const db = {
    standaloneDeliveryRequest: {
      findUnique: async ({ where }: { where: { id: string } }) => requests.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = requests.get(where.id);
        if (!row) throw new Error('missing');
        Object.assign(row, data);
        return row;
      },
    },
  };
  const expired = await expireUnpaidStandaloneCheckout(db as never, {
    id: 'cs_1',
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_1' },
  });
  assert.equal(expired.handled, true);
  const again = await expireUnpaidStandaloneCheckout(db as never, {
    id: 'cs_1',
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_1' },
  });
  assert.equal('duplicate' in again && again.duplicate, true);
  requests.set('req_paid', { id: 'req_paid', paymentStatus: 'PAID', status: 'PAID', stripeSessionId: 'cs_paid', deliveryOrderId: 'd1' });
  const late = await noteStandalonePaymentFailure(db as never, {
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_paid' },
  });
  assert.equal('ignored' in late && late.ignored, 'already_paid');
  await assert.rejects(() => expireUnpaidStandaloneCheckout({
    standaloneDeliveryRequest: {
      findUnique: async () => { throw new Error('connect timeout'); },
      update: async () => { throw new Error('connect timeout'); },
    },
  } as never, {
    id: 'cs_x',
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_x' },
  }));
});

test('refund, dispute, connect, and transfer events stay idempotent', async () => {
  const decisions = new Map<string, Record<string, unknown>>();
  const payouts = new Map<string, Record<string, unknown>>();
  payouts.set('payout_delivery_d1', { id: 'payout_delivery_d1', amountCents: 880, providerRef: null, transferFailureCode: 'CONNECT_TRANSFER_FAILED' });
  const profiles = new Map<string, Record<string, unknown>>();
  const db = {
    standaloneDeliveryRequest: {
      findUnique: async () => ({ id: 'req_1', deliveryOrderId: 'd1' }),
    },
    deliveryRefundDecision: {
      findUnique: async ({ where }: { where: { idempotencyKey: string } }) => decisions.get(where.idempotencyKey) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        decisions.set(String(data.idempotencyKey), { id: 'dec', ...data });
        return decisions.get(String(data.idempotencyKey));
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = [...decisions.values()].find((item) => item.id === where.id);
        Object.assign(row || {}, data);
        return row;
      },
    },
    payout: {
      findUnique: async ({ where }: { where: { id: string } }) => payouts.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = payouts.get(where.id);
        if (!row) throw new Error('missing payout');
        Object.assign(row, data);
        return row;
      },
    },
    user: {
      findFirst: async () => ({ id: 'courier' }),
      findMany: async () => [{ id: 'courier' }],
    },
    deliveryProfile: {
      findUnique: async () => ({ id: 'profile_ok' }),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        profiles.set('profile_ok', data);
        return data;
      },
    },
  };
  const charge = {
    id: 'ch_1',
    amount_refunded: 1000,
    currency: 'eur',
    payment_intent: 'pi_1',
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_1' },
  };
  const first = await observeStandaloneChargeRefund(db as never, charge);
  const second = await observeStandaloneChargeRefund(db as never, charge);
  assert.equal('duplicate' in second && second.duplicate, true);
  assert.equal(decisions.size, 1);
  const dispute = await observeStandaloneDispute(db as never, {
    disputeId: 'dp_1',
    metadata: charge.metadata,
    amountCents: 1000,
    status: 'needs_response',
  });
  assert.equal(dispute.handled, true);
  const replay = await observeStandaloneDispute(db as never, {
    disputeId: 'dp_1',
    metadata: charge.metadata,
    status: 'lost',
  });
  assert.equal('duplicate' in replay && replay.duplicate, true);
  const attached = await recordDeliveryTransferCreated(db as never, {
    id: 'tr_1',
    amount: 880,
    currency: 'eur',
    metadata: { purpose: 'delivery_provider_principal', deliveryOrderId: 'd1' },
  });
  assert.equal(attached.matched, true);
  const payout = payouts.get('payout_delivery_d1');
  assert.equal(payout?.providerRef, 'tr_1');
  const duplicate = await recordDeliveryTransferCreated(db as never, {
    id: 'tr_1',
    amount: 880,
    currency: 'eur',
    metadata: { purpose: 'delivery_provider_principal', deliveryOrderId: 'd1' },
  });
  assert.equal('duplicate' in duplicate && duplicate.duplicate, true);
  const synced = await syncCourierConnectAccount(db as never, {
    id: 'acct_1',
    payouts_enabled: false,
    capabilities: { transfers: 'active' },
  });
  assert.equal(synced.updated, true);
  assert.equal(profiles.get('profile_ok')?.stripePayoutsEnabled, false);
  assert.equal(first.handled, true);
});

test('failed transfers and marketplace refunds stay visible and do not move money', async () => {
  const view = describeDeliveryPayout({
    id: 'payout_delivery_d1',
    amountCents: 880,
    toUserId: 'courier',
    providerRef: null,
    transferFailureCode: 'CONNECT_TRANSFER_FAILED',
  });
  assert.equal(view.transferExists, false);
  assert.equal(view.retryEligible, true);
  assert.equal(view.automaticRetry, false);
  assert.equal(view.currency, 'EUR');
  assert.equal(view.ledgerState, 'EARNING_RECORDED_TRANSFER_MISSING');
  assert.equal(marketplaceDeliveryRefundPlan({
    hasStandalonePaidSession: false,
    orderStripeSessionId: 'cs_order',
    quotedFeeCents: 1000,
    orderTotalCents: 5000,
  }).action, 'MANUAL');
  assert.equal(marketplaceDeliveryRefundPlan({
    hasStandalonePaidSession: true,
    orderStripeSessionId: 'cs_order',
    quotedFeeCents: 1000,
    orderTotalCents: 5000,
  }).action, 'STANDALONE_DESK');

  const calls = { refunds: 0, reversals: 0 };
  const store: { row: Record<string, unknown> | null } = { row: null };
  const prisma = {
    deliveryOrder: {
      findUnique: async () => ({
        id: 'd_market',
        orderId: 'o_market',
        deliveryProfileId: 'p1',
        notes: '',
        quotedFeeCents: 1000,
        deliveryProfile: { userId: 'courier' },
      }),
    },
    standaloneDeliveryRequest: { findFirst: async () => null },
    order: { findUnique: async () => ({ stripeSessionId: 'cs_order', totalAmount: 5000 }) },
    deliveryRefundDecision: {
      findUnique: async () => store.row,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        store.row = { id: 'manual', ...data };
        return store.row;
      },
    },
  };
  const stripe = {
    checkout: { sessions: { retrieve: async () => { throw new Error('no retrieve'); } } },
    refunds: { create: async () => { calls.refunds += 1; return { id: 're', status: 'succeeded' }; } },
    transfers: { createReversal: async () => { calls.reversals += 1; return { id: 'trr' }; } },
  };
  const result = await executeDeliveryRefundDecision(prisma as never, stripe as never, {
    deliveryOrderId: 'd_market',
    adminUserId: 'admin',
    decision: 'APPROVE',
    reason: 'Klant annuleerde de marketplace-bezorging',
    confirm: true,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.decision.decision, 'MANUAL');
    assert.equal(result.decision.stripeRefundId ?? null, null);
  }
  assert.equal(calls.refunds, 0);
  assert.equal(calls.reversals, 0);
});

test('admin recovery and payout failure stay out of the live transfer path', () => {
  const admin = source('app/api/admin/delivery-reviews/route.ts');
  const page = source('app/admin/delivery-reviews/page.tsx');
  const payout = source('lib/delivery/delivery-payout.ts');
  const webhook = source('app/api/stripe/webhook/route.ts');
  assert.equal(admin.includes('transfers.create'), false);
  assert.equal(admin.includes('failedTransfers'), true);
  assert.equal(admin.includes("role !== 'ADMIN'"), true);
  assert.equal(page.includes('Opnieuw proberen vanuit dit scherm: nee'), true);
  assert.equal(payout.includes('transferFailureCode'), true);
  assert.equal(payout.includes('settleCourierTransferObligation'), true);
  assert.equal(payout.includes('transferFailureAt.getTime()'), false);
  assert.equal(webhook.includes('isHomeCheffDeliveryEnabled'), true);
  assert.equal(webhook.includes('EXISTING_DELIVERY_RECONCILIATION'), true);
  assert.equal(webhook.includes('checkout.session.async_payment_succeeded'), true);
  assert.equal(webhook.includes('payment_intent.payment_failed'), true);
  assert.equal(webhook.includes('account.updated'), true);
  assert.equal(webhook.includes('fulfillStandaloneDeliveryPayment'), true);
});
