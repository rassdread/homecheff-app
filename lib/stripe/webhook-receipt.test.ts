import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  beginStripeWebhookReceipt,
  finishStripeWebhookReceipt,
  receiptStatusForHttp,
  type WebhookReceiptRow,
  type WebhookReceiptStore,
} from './webhook-receipt';

function memoryStore() {
  const rows = new Map<string, WebhookReceiptRow>();
  const store: WebhookReceiptStore = {
    async find(eventId) {
      return rows.get(eventId) ?? null;
    },
    async insert(row) {
      if (rows.has(row.eventId)) return 'conflict';
      rows.set(row.eventId, { ...row });
      return 'created';
    },
    async update(eventId, patch) {
      const current = rows.get(eventId);
      if (!current) throw new Error('missing');
      rows.set(eventId, { ...current, ...patch });
    },
  };
  return { rows, store };
}

describe('stripe webhook receipt', () => {
  it('processes a new event once and skips a processed duplicate', async () => {
    const { store } = memoryStore();
    const first = await beginStripeWebhookReceipt(store, {
      eventId: 'evt_1',
      eventType: 'checkout.session.completed',
      livemode: false,
      now: new Date('2026-10-24T12:00:00Z'),
    });
    assert.equal(first.action, 'PROCESS');
    await finishStripeWebhookReceipt(store, { eventId: 'evt_1', httpStatus: 200 });
    const second = await beginStripeWebhookReceipt(store, {
      eventId: 'evt_1',
      eventType: 'checkout.session.completed',
      livemode: false,
      now: new Date('2026-10-24T12:01:00Z'),
    });
    assert.equal(second.action, 'SKIP');
  });

  it('keeps a concurrent delivery in flight and allows a later retry after failure', async () => {
    const { store } = memoryStore();
    const start = new Date('2026-10-24T12:00:00Z');
    await beginStripeWebhookReceipt(store, {
      eventId: 'evt_2',
      eventType: 'checkout.session.completed',
      livemode: false,
      now: start,
    });
    const concurrent = await beginStripeWebhookReceipt(store, {
      eventId: 'evt_2',
      eventType: 'checkout.session.completed',
      livemode: false,
      now: new Date(start.getTime() + 5_000),
    });
    assert.equal(concurrent.action, 'IN_FLIGHT');
    await finishStripeWebhookReceipt(store, { eventId: 'evt_2', httpStatus: 500 });
    const retry = await beginStripeWebhookReceipt(store, {
      eventId: 'evt_2',
      eventType: 'checkout.session.completed',
      livemode: false,
      now: new Date(start.getTime() + 120_000),
    });
    assert.equal(retry.action, 'PROCESS');
    assert.equal(receiptStatusForHttp(400), 'REJECTED');
    assert.equal(receiptStatusForHttp(200), 'PROCESSED');
    assert.equal(receiptStatusForHttp(503), 'FAILED');
  });
});
