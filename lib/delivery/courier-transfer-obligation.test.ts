import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  classifyLookupFailure,
  classifyTransferList,
  courierTransferIdempotencyKey,
  createMemoryCourierTransferObligation,
  settleCourierTransferObligation,
} from './courier-transfer-obligation';

const key = courierTransferIdempotencyKey('d1', 'ch_1');

function stripeFor(options?: {
  failList?: unknown;
  hasMore?: boolean;
  listed?: Array<Record<string, unknown>>;
  failCreate?: unknown;
  dropResponse?: boolean;
  failRecord?: boolean;
}) {
  const calls: string[] = [];
  const created: Array<{ id: string; key: string }> = [];
  const store = createMemoryCourierTransferObligation();
  if (options?.failRecord) {
    const update = store.update.bind(store);
    let failed = false;
    store.update = async (args) => {
      if (!failed && args.data && 'stripeTransferId' in args.data && args.data.stripeTransferId) {
        failed = true;
        throw new Error('database update failed');
      }
      return update(args);
    };
  }
  const stripe = {
    transfers: {
      list: async () => {
        if (options?.failList) throw options.failList;
        return { data: options?.listed ?? created.map((row) => ({
          id: row.id,
          amount: 880,
          currency: 'eur',
          reversed: false,
          destination: 'acct_courier',
          metadata: { deliveryOrderId: 'd1', purpose: 'delivery_provider_principal' },
        })), has_more: options?.hasMore ?? false };
      },
      create: async (_params: Record<string, unknown>, opts: { idempotencyKey: string }) => {
        calls.push(opts.idempotencyKey);
        if (options?.failCreate) throw options.failCreate;
        const id = `tr_${created.length + 1}`;
        created.push({ id, key: opts.idempotencyKey });
        if (options?.dropResponse) throw new Error('socket hang up');
        return { id };
      },
    },
  };
  return { stripe, store, calls, created };
}

function settle(box: ReturnType<typeof stripeFor>, overrides?: Record<string, unknown>) {
  return settleCourierTransferObligation({
    db: { courierTransferObligation: box.store },
    stripe: box.stripe as never,
    deliveryOrderId: 'd1',
    orderId: 'order_1',
    chargeId: 'ch_1',
    amountCents: 880,
    currency: 'eur',
    destinationAccountId: 'acct_courier',
    recipientUserId: 'courier',
    ...overrides,
  });
}

describe('courier transfer obligation', () => {
  it('A/B/O: one success is reused and the key stays stable', async () => {
    const box = stripeFor();
    const first = await settle(box);
    const second = await settle(box);
    assert.equal(first.state, 'CONFIRMED');
    assert.equal(first.transferId, 'tr_1');
    assert.equal(second.state, 'CONFIRMED');
    assert.equal(second.created, false);
    assert.equal(second.transferId, 'tr_1');
    assert.deepEqual(box.calls, [key]);
    assert.equal(key.includes('homecheff:delivery:courier-transfer:'), true);
    assert.equal(key.includes(':v1'), true);
  });

  it('C/J/K: concurrent and repeated settlement create one transfer', async () => {
    const box = stripeFor();
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = box.stripe.transfers.create;
    box.stripe.transfers.create = async (params, opts) => {
      await gate;
      return original(params, opts);
    };
    const both = Promise.all([settle(box), settle(box)]);
    release();
    const [left, right] = await both;
    assert.equal(left.transferId, right.transferId);
    assert.equal(box.calls.length, 1);
    const webhook = await settle(box);
    assert.equal(webhook.transferId, left.transferId);
    assert.equal(box.calls.length, 1);
  });

  it('D/E/F: lookup timeout, auth failure, and rate limit do not create a transfer', async () => {
    for (const failList of [
      Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' }),
      Object.assign(new Error('Invalid API Key'), { statusCode: 401 }),
      Object.assign(new Error('rate limit'), { statusCode: 429 }),
    ]) {
      const box = stripeFor({ failList });
      const result = await settle(box);
      assert.equal(result.state, 'UNKNOWN');
      assert.equal(box.calls.length, 0);
    }
    assert.equal(classifyLookupFailure(Object.assign(new Error('x'), { statusCode: 401 })), 'LOOKUP_AUTH');
    assert.equal(classifyLookupFailure(Object.assign(new Error('x'), { statusCode: 429 })), 'LOOKUP_RATE_LIMIT');
    assert.equal(classifyLookupFailure(Object.assign(new Error('timed out'), { code: 'ETIMEDOUT' })), 'LOOKUP_TIMEOUT');
  });

  it('G/H/I/P: a lost or unrecorded create is not repeated', async () => {
    const lost = stripeFor({ dropResponse: true });
    const first = await settle(lost);
    assert.equal(first.state, 'UNKNOWN');
    assert.equal(lost.calls.length, 1);
    const again = await settle(lost);
    assert.equal(again.created, false);
    assert.equal(again.transferId, 'tr_1');
    assert.equal(lost.calls.length, 1);

    const unrecorded = stripeFor({ failRecord: true });
    const created = await settle(unrecorded);
    assert.equal(created.transferId, 'tr_1');
    assert.equal(created.blockCode, 'TRANSFER_RECORD_FAILED');
    const retry = await settle(unrecorded);
    assert.equal(retry.created, false);
    assert.equal(unrecorded.calls.length, 1);

    const restarted = stripeFor();
    await restarted.store.create({
      data: {
        deliveryOrderId: 'd1',
        chargeId: 'ch_1',
        purpose: 'delivery_provider_principal',
        idempotencyKey: key,
        state: 'UNKNOWN',
        amountCents: 880,
        currency: 'eur',
        destinationConnectAccountId: 'acct_courier',
        recipientUserId: 'courier',
        transferGroup: 'order_order_1',
        stripeCreateAttemptedAt: new Date('2026-10-01T00:00:00Z'),
      },
    });
    const afterRestart = await settle(restarted);
    assert.equal(afterRestart.blockCode, 'TRANSFER_NOT_FOUND_AFTER_ATTEMPT');
    assert.equal(restarted.calls.length, 0);
  });

  it('L/M/N: a changed recipient, amount, or currency does not create another transfer', async () => {
    const box = stripeFor();
    await settle(box);
    const recipient = await settle(box, { recipientUserId: 'other-courier' });
    const amount = await settle(box, { amountCents: 100 });
    const currency = await settle(box, { currency: 'usd' });
    assert.equal(recipient.blockCode, 'TRANSFER_RECIPIENT_CHANGED');
    assert.equal(amount.blockCode, 'TRANSFER_AMOUNT_CHANGED');
    assert.equal(currency.blockCode, 'TRANSFER_CURRENCY_CHANGED');
    assert.equal(box.calls.length, 1);
  });

  it('Q/R: reservation failure and the unique constraint do not create two obligations', async () => {
    const broken = stripeFor();
    broken.store.create = async () => {
      throw new Error('database down');
    };
    const failed = await settle(broken);
    assert.equal(failed.blockCode, 'RESERVATION_FAILED');
    assert.equal(broken.calls.length, 0);

    const store = createMemoryCourierTransferObligation();
    const data = {
      deliveryOrderId: 'd1',
      chargeId: 'ch_1',
      purpose: 'delivery_provider_principal',
      idempotencyKey: key,
      state: 'PENDING',
      amountCents: 880,
      currency: 'eur',
      destinationConnectAccountId: 'acct_courier',
      recipientUserId: 'courier',
      transferGroup: 'order_order_1',
    };
    await store.create({ data });
    await assert.rejects(store.create({ data }), (error: unknown) => (error as { code?: string }).code === 'P2002');
    assert.equal(store.rows.length, 1);
  });

  it('reclaims an expired processing lease before Stripe and refuses an open lease', async () => {
    const expired = stripeFor();
    await expired.store.create({
      data: {
        deliveryOrderId: 'd1',
        chargeId: 'ch_1',
        purpose: 'delivery_provider_principal',
        idempotencyKey: key,
        state: 'PROCESSING',
        amountCents: 880,
        currency: 'eur',
        destinationConnectAccountId: 'acct_courier',
        recipientUserId: 'courier',
        transferGroup: 'order_order_1',
        stripeCreateAttemptedAt: null,
        processingLeaseUntil: new Date('2020-01-01T00:00:00Z'),
      },
    });
    const recovered = await settle(expired);
    assert.equal(recovered.state, 'CONFIRMED');
    assert.equal(expired.calls.length, 1);

    const open = stripeFor();
    await open.store.create({
      data: {
        deliveryOrderId: 'd1',
        chargeId: 'ch_1',
        purpose: 'delivery_provider_principal',
        idempotencyKey: key,
        state: 'PROCESSING',
        amountCents: 880,
        currency: 'eur',
        destinationConnectAccountId: 'acct_courier',
        recipientUserId: 'courier',
        transferGroup: 'order_order_1',
        stripeCreateAttemptedAt: null,
        processingLeaseUntil: new Date(Date.now() + 60_000),
      },
    });
    const held = await settle(open);
    assert.equal(held.blockCode, 'TRANSFER_IN_FLIGHT');
    assert.equal(open.calls.length, 0);
  });
  it('does not treat an incomplete transfer list as proof that nothing exists', () => {
    const incomplete = classifyTransferList({
      data: [],
      hasMore: true,
      deliveryOrderId: 'd1',
      amountCents: 880,
      currency: 'eur',
      destinationAccountId: 'acct_courier',
    });
    assert.equal(incomplete.ok, false);
    if (!incomplete.ok) assert.equal(incomplete.code, 'LOOKUP_INCOMPLETE');
  });

  it('S/T/U/V: refunds, suspension, callers, and live keys stay outside this creator', () => {
    const root = new URL('../../', import.meta.url);
    const payout = readFileSync(new URL('lib/delivery/delivery-payout.ts', root), 'utf8');
    const status = readFileSync(new URL('app/api/delivery/orders/[orderId]/update-status/route.ts', root), 'utf8');
    assert.match(payout, /HC_DELIVERY_REFUNDED/);
    assert.match(payout, /assertCommercialCourierCanReceivePayout/);
    assert.equal(status.includes('deliveryFeeCents'), false);
    assert.match(payout, /financialStripeSecret/);
    assert.equal(payout.includes('transferFailureAt.getTime()'), false);
    assert.equal(payout.includes('sk_live'), false);
  });
});
