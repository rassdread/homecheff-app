import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { deliveryWebhookClass } from '@/lib/delivery/delivery-webhook-events';
import {
  isMissingDatabaseRelation,
  isStandaloneDeliveryFinancialEvent,
  receiptUnavailableDecision,
  statusAfterReceiptFinish,
} from './delivery-webhook-persistence';

const standalone = {
  type: 'checkout.session.completed',
  data: { object: { metadata: { checkoutKind: 'STANDALONE_DELIVERY' } } },
};

describe('delivery webhook persistence', () => {
  it('fails closed for an unpersisted standalone delivery event and continues marketplace checkout', () => {
    assert.equal(isStandaloneDeliveryFinancialEvent(standalone), true);
    assert.equal(receiptUnavailableDecision(standalone), 'FAIL_CLOSED');
    assert.equal(
      receiptUnavailableDecision({
        type: 'checkout.session.completed',
        data: { object: { metadata: { orderId: 'ord_1' } } },
      }),
      'CONTINUE_MARKETPLACE',
    );
    assert.equal(
      receiptUnavailableDecision({ type: 'invoice.paid', data: { object: {} } }),
      'CONTINUE_MARKETPLACE',
    );
    assert.equal(
      statusAfterReceiptFinish({ standaloneDelivery: true, handlerStatus: 200, receiptFinished: false }),
      500,
    );
    assert.equal(
      statusAfterReceiptFinish({ standaloneDelivery: false, handlerStatus: 200, receiptFinished: false }),
      200,
    );
    assert.equal(isMissingDatabaseRelation({ code: 'P2021' }), true);
    assert.equal(isMissingDatabaseRelation({ code: 'P2002' }), false);
  });

  it('does not fulfill a new standalone checkout while delivery is disabled', () => {
    assert.equal(
      deliveryWebhookClass({
        eventType: 'checkout.session.completed',
        paymentStatus: 'unpaid',
        deliveryEnabled: false,
      }),
      'BLOCKED',
    );
    assert.equal(
      deliveryWebhookClass({
        eventType: 'checkout.session.completed',
        paymentStatus: 'paid',
        deliveryEnabled: false,
      }),
      'EXISTING_DELIVERY_RECONCILIATION',
    );
  });

  it('requires a superadmin before recovery can read Stripe', () => {
    const source = readFileSync(new URL('../../app/api/admin/delivery/operations/recover/route.ts', import.meta.url), 'utf8');
    const handler = source.slice(source.indexOf('export async function POST'));
    assert.ok(handler.indexOf('requireSuperAdmin') < handler.indexOf('financialStripeSecret'));
    assert.ok(handler.indexOf('requireSuperAdmin') < handler.indexOf('events.retrieve'));
    assert.equal(handler.includes('HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE'), true);
  });
});
