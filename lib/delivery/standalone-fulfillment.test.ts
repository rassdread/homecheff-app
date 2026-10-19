import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  fulfillStandaloneDeliveryPayment,
  standalonePaymentModeMatches,
} from '@/lib/delivery/standalone-delivery';

const LIVE = 'sk_live_synthetic';
const TEST = 'sk_test_synthetic';

function request(overrides: Record<string, unknown> = {}) {
  return {
    id: 'req_1',
    requesterUserId: 'buyer_1',
    deliveryProfileId: 'profile_1',
    providerDisplayName: 'Koerier',
    quotedFeeCents: 10000,
    buyerTotalCents: 10165,
    providerNetPayoutCents: 8800,
    platformCommissionCents: 1200,
    routeDistanceKm: 3,
    baseFeeCents: 200,
    pricePerKmCents: 100,
    minimumFeeCents: 500,
    deliveryAddress: 'Afleverstraat 1',
    pickupAddress: 'Ophaalstraat 2',
    itemDescription: 'Doos',
    stripeSessionId: 'cs_1',
    paymentStatus: 'UNPAID',
    status: 'CHECKOUT',
    deliveryOrderId: null as string | null,
    createdAt: new Date('2026-10-19T00:00:00Z'),
    ...overrides,
  };
}

function session(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cs_1',
    livemode: false,
    payment_status: 'paid',
    currency: 'eur',
    amount_total: 10165,
    payment_intent: 'pi_1',
    metadata: {
      checkoutKind: 'STANDALONE_DELIVERY',
      standaloneRequestId: 'req_1',
      requesterUserId: 'buyer_1',
      deliveryProfileId: 'profile_1',
    },
    ...overrides,
  };
}

function memory() {
  const rows = new Map<string, ReturnType<typeof request>>([
    ['req_1', request()],
  ]);
  const profiles = new Map([['profile_1', { id: 'profile_1', userId: 'courier_1', totalEarnings: 0 }]]);
  const orders: Array<Record<string, unknown>> = [];
  const transactions: Array<Record<string, unknown>> = [];
  const payouts: Array<Record<string, unknown>> = [];
  const incidents: Array<Record<string, unknown>> = [];
  let queue = Promise.resolve();
  const api = {
    standaloneDeliveryRequest: {
      findUnique: async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null,
      updateMany: async ({ where, data }: { where: { id: string; deliveryOrderId: null }; data: Record<string, unknown> }) => {
        const row = rows.get(where.id);
        if (!row || row.deliveryOrderId) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = rows.get(where.id);
        if (!row) throw new Error('missing');
        Object.assign(row, data);
        return row;
      },
    },
    deliveryProfile: {
      findUnique: async ({ where }: { where: { id: string } }) => profiles.get(where.id) ?? null,
      update: async ({ where, data }: { where: { id: string }; data: { totalEarnings?: { increment: number } } }) => {
        const profile = profiles.get(where.id);
        if (!profile) throw new Error('missing');
        if (data.totalEarnings?.increment) profile.totalEarnings += data.totalEarnings.increment;
        return profile;
      },
    },
    deliveryOrder: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const order = { id: `do_${orders.length + 1}`, ...data };
        orders.push(order);
        return order;
      },
    },
    transaction: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        transactions.push(data);
        return data;
      },
    },
    payout: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        payouts.push(data);
        return data;
      },
    },
    order: {
      findFirst: async () => null,
    },
    checkoutPaymentIncident: {
      findUnique: async ({ where }: { where: { stripeSessionId: string } }) =>
        incidents.find((item) => item.stripeSessionId === where.stripeSessionId) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (incidents.some((item) => item.stripeSessionId === data.stripeSessionId)) {
          const error = new Error('unique') as Error & { code?: string };
          error.code = 'P2002';
          throw error;
        }
        incidents.push({ ...data });
        return data;
      },
    },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => {
      const run = queue.then(() => fn(api));
      queue = run.then(() => undefined, () => undefined);
      return run;
    },
  };
  return { api, rows, profiles, orders, transactions, payouts, incidents };
}

function fulfill(db: ReturnType<typeof memory>, event: unknown, secret: string) {
  return fulfillStandaloneDeliveryPayment(event as never, {
    db: db.api as never,
    stripeSecret: secret,
    notify: async () => undefined,
  });
}

test('mode match follows the configured key and does not ban live mode', () => {
  assert.equal(standalonePaymentModeMatches(false, TEST), true);
  assert.equal(standalonePaymentModeMatches(true, LIVE), true);
  assert.equal(standalonePaymentModeMatches(true, TEST), false);
  assert.equal(standalonePaymentModeMatches(false, LIVE), false);
  assert.equal(standalonePaymentModeMatches(undefined, LIVE), false);
  const source = readFileSync(new URL('./standalone-delivery.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('Live mode refused'), false);
  assert.equal(source.includes('delivery_xfer_'), false);
});

test('test mode and synthetic live mode each create one delivery and one ledger', async () => {
  for (const [secret, livemode] of [[TEST, false], [LIVE, true]] as const) {
    const db = memory();
    const result = await fulfill(db, session({ livemode }), secret);
    assert.equal(result.ok, true);
    assert.equal('deliveryOrderId' in result, true);
    assert.equal(db.orders.length, 1);
    assert.equal(db.transactions.length, 1);
    assert.equal(db.transactions[0].amountCents, 10000);
    assert.equal(db.transactions[0].platformFeeBps, 1200);
    assert.equal(db.payouts.length, 1);
    assert.equal(db.payouts[0].amountCents, 8800);
    assert.equal(String(db.payouts[0].providerRef).startsWith('tr_'), false);
    assert.equal(db.profiles.get('profile_1')?.totalEarnings, 8800);
    assert.equal(db.rows.get('req_1')?.deliveryOrderId, db.orders[0].id);
    assert.equal(db.incidents.length, 0);
  }
});

test('duplicate and concurrent completed events keep one delivery', async () => {
  const db = memory();
  const [first, second] = await Promise.all([
    fulfill(db, session(), TEST),
    fulfill(db, session(), TEST),
  ]);
  const again = await fulfill(db, session(), TEST);
  assert.equal(db.orders.length, 1);
  assert.equal(db.transactions.length, 1);
  assert.equal(db.payouts.length, 1);
  assert.equal(db.profiles.get('profile_1')?.totalEarnings, 8800);
  assert.equal(first.ok && second.ok && again.ok, true);
});

test('a database failure leaves no partial delivery and can be retried', async () => {
  const db = memory();
  db.api.$transaction = async () => {
    throw new Error('connect timeout');
  };
  await assert.rejects(() => fulfill(db, session(), TEST), /connect timeout/);
  assert.equal(db.orders.length, 0);
  assert.equal(db.rows.get('req_1')?.deliveryOrderId, null);
  db.api.$transaction = (fn) => fn(db.api);
  const retried = await fulfill(db, session(), TEST);
  assert.equal(retried.ok, true);
  assert.equal(db.orders.length, 1);
});

test('mismatched payment details are visible and do not create a delivery', async () => {
  const cases = [
    { name: 'mode', event: session({ livemode: true }), secret: TEST, code: 'STRIPE_MODE_MISMATCH' },
    { name: 'amount', event: session({ amount_total: 1 }), secret: TEST, code: 'AMOUNT_MISMATCH' },
    { name: 'currency', event: session({ currency: 'usd' }), secret: TEST, code: 'CURRENCY_MISMATCH' },
    { name: 'customer', event: session({ metadata: { ...session().metadata, requesterUserId: 'other' } }), secret: TEST, code: 'CUSTOMER_MISMATCH' },
    { name: 'courier', event: session({ metadata: { ...session().metadata, deliveryProfileId: 'other' } }), secret: TEST, code: 'COURIER_MISMATCH' },
    { name: 'booking', event: session({ metadata: { ...session().metadata, standaloneRequestId: 'missing' } }), secret: TEST, code: 'REQUEST_MISSING' },
    { name: 'session', event: session({ id: 'cs_other' }), secret: TEST, code: 'SESSION_MISMATCH' },
  ];
  for (const item of cases) {
    const db = memory();
    const result = await fulfill(db, item.event, item.secret);
    assert.equal(result.ok, true, item.name);
    assert.equal('recovery' in result && result.recovery, true, item.name);
    assert.equal(db.orders.length, 0, item.name);
    assert.equal(db.incidents.length, 1, item.name);
    assert.equal(db.incidents[0].code, item.code, item.name);
    const repeat = await fulfill(db, item.event, item.secret);
    assert.equal(repeat.ok, true);
    assert.equal(db.incidents.length, 1, item.name);
  }
});

test('unpaid, expired, cancelled, and already fulfilled sessions do not add a second order', async () => {
  const unpaid = memory();
  const unpaidResult = await fulfill(unpaid, session({ payment_status: 'unpaid' }), TEST);
  assert.equal(unpaidResult.ok, true);
  assert.equal(unpaid.orders.length, 0);
  assert.equal(unpaid.incidents.length, 0);

  const expired = memory();
  const expiredResult = await fulfill(expired, session({ payment_status: 'unpaid' }), LIVE);
  assert.equal(expiredResult.ok, true);
  assert.equal(expired.orders.length, 0);

  const cancelled = memory();
  cancelled.rows.get('req_1')!.status = 'CANCELLED';
  const cancelledResult = await fulfill(cancelled, session({ livemode: true }), LIVE);
  assert.equal('recovery' in cancelledResult && cancelledResult.recovery, true);
  assert.equal(cancelled.orders.length, 0);
  assert.equal(cancelled.incidents[0].code, 'BOOKING_NOT_FULFILLABLE');

  const done = memory();
  done.rows.get('req_1')!.deliveryOrderId = 'do_existing';
  done.rows.get('req_1')!.paymentStatus = 'PAID';
  const doneResult = await fulfill(done, session({ livemode: true }), LIVE);
  assert.equal(doneResult.ok, true);
  assert.equal('duplicate' in doneResult && doneResult.duplicate, true);
  assert.equal(done.orders.length, 0);
});
