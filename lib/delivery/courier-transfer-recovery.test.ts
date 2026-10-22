import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  courierRecoveryIdempotencyKey,
  courierShareToRecoverCents,
  recoverCourierTransfer,
  type StripeReversalRecord,
} from '@/lib/delivery/courier-transfer-recovery';
import { deliveryWebhookClass } from '@/lib/delivery/delivery-webhook-events';

function stripeWith(reversals: StripeReversalRecord[]) {
  const created: Array<{ amount: number; key: string }> = [];
  return {
    created,
    client: {
      listReversals: async () => reversals.map((row) => ({ ...row })),
      createReversal: async (transferId: string, amount: number, key: string) => {
        const existing = created.find((row) => row.key === key);
        if (existing) return { id: `trr_${transferId}_${existing.amount}`, amount: existing.amount };
        created.push({ amount, key });
        const record = { id: `trr_${created.length}`, amount };
        reversals.push(record);
        return record;
      },
    },
  };
}

test('courier share uses integer cents and does not change the 88 percent base', () => {
  assert.equal(courierShareToRecoverCents({ transferredCents: 880, refundedCents: 1040, chargeCents: 1040 }), 880);
  assert.equal(courierShareToRecoverCents({ transferredCents: 880, refundedCents: 520, chargeCents: 1040 }), 440);
  assert.equal(courierShareToRecoverCents({ transferredCents: 880, refundedCents: 0, chargeCents: 1040 }), 0);
});

test('full and partial refunds before a transfer do not create a reversal', async () => {
  const stripe = stripeWith([]);
  for (const refundedCents of [1040, 520]) {
    const result = await recoverCourierTransfer({
      transferId: null,
      transferredCents: 0,
      refundedCents,
      chargeCents: 1040,
      stripe: stripe.client,
    });
    assert.equal(result.state, 'COURIER_ALLOCATED');
    assert.equal(result.created, false);
  }
  assert.equal(stripe.created.length, 0);
});

test('full and partial refunds after a transfer reverse only the unpaid share', async () => {
  const full = stripeWith([]);
  const fullResult = await recoverCourierTransfer({
    transferId: 'tr_full',
    transferredCents: 880,
    refundedCents: 1040,
    chargeCents: 1040,
    stripe: full.client,
  });
  assert.equal(fullResult.state, 'COURIER_RECOVERED');
  assert.equal(fullResult.recoveredCents, 880);
  assert.equal(fullResult.outstandingCents, 0);
  assert.equal(full.created[0].amount, 880);

  const partial = stripeWith([]);
  const partialResult = await recoverCourierTransfer({
    transferId: 'tr_partial',
    transferredCents: 880,
    refundedCents: 520,
    chargeCents: 1040,
    stripe: partial.client,
  });
  assert.equal(partialResult.state, 'COURIER_RECOVERED');
  assert.equal(partialResult.recoveredCents, 440);
  assert.equal(partialResult.outstandingCents, 0);
  const rest = await recoverCourierTransfer({
    transferId: 'tr_partial',
    transferredCents: 880,
    refundedCents: 1040,
    chargeCents: 1040,
    stripe: partial.client,
  });
  assert.equal(rest.recoveredCents, 880);
  assert.equal(partial.created.map((row) => row.amount).join(','), '440,440');
});

test('a repeated refund event adopts the existing reversal', async () => {
  const stripe = stripeWith([{ id: 'trr_existing', amount: 880 }]);
  const first = await recoverCourierTransfer({
    transferId: 'tr_dup',
    transferredCents: 880,
    refundedCents: 1040,
    chargeCents: 1040,
    stripe: stripe.client,
  });
  const second = await recoverCourierTransfer({
    transferId: 'tr_dup',
    transferredCents: 880,
    refundedCents: 1040,
    chargeCents: 1040,
    stripe: stripe.client,
  });
  assert.equal(first.reversalId, 'trr_existing');
  assert.equal(second.reversalId, 'trr_existing');
  assert.equal(second.created, false);
  assert.equal(stripe.created.length, 0);
});

test('concurrent recovery calls share one idempotency key', async () => {
  const stripe = stripeWith([]);
  const input = {
    transferId: 'tr_race',
    transferredCents: 880,
    refundedCents: 1040,
    chargeCents: 1040,
    stripe: stripe.client,
  };
  const [left, right] = await Promise.all([
    recoverCourierTransfer(input),
    recoverCourierTransfer(input),
  ]);
  assert.equal(stripe.created.length, 1);
  assert.equal(left.recoveredCents, 880);
  assert.equal(right.recoveredCents, 880);
  assert.equal(
    courierRecoveryIdempotencyKey('tr_race', 0, 880),
    stripe.created[0].key,
  );
});

test('a failed reversal stays outstanding and a later list adopts a timed-out success', async () => {
  const failed = stripeWith([]);
  failed.client.createReversal = async () => {
    throw Object.assign(new Error('balance'), { code: 'insufficient_funds' });
  };
  const outstanding = await recoverCourierTransfer({
    transferId: 'tr_fail',
    transferredCents: 880,
    refundedCents: 1040,
    chargeCents: 1040,
    stripe: failed.client,
  });
  assert.equal(outstanding.state, 'COURIER_RECOVERY_OUTSTANDING');
  assert.equal(outstanding.recoveredCents, 0);
  assert.equal(outstanding.outstandingCents, 880);
  assert.equal(outstanding.reversalId, null);

  let listed: StripeReversalRecord[] = [];
  let creates = 0;
  const timeoutStripe = {
    listReversals: async () => listed.map((row) => ({ ...row })),
    createReversal: async () => {
      creates += 1;
      listed = [{ id: 'trr_late', amount: 880 }];
      throw new Error('timeout');
    },
  };
  const first = await recoverCourierTransfer({
    transferId: 'tr_timeout',
    transferredCents: 880,
    refundedCents: 1040,
    chargeCents: 1040,
    stripe: timeoutStripe,
  });
  assert.equal(first.state, 'COURIER_RECOVERED');
  assert.equal(first.reversalId, 'trr_late');
  const second = await recoverCourierTransfer({
    transferId: 'tr_timeout',
    transferredCents: 880,
    refundedCents: 1040,
    chargeCents: 1040,
    stripe: timeoutStripe,
  });
  assert.equal(creates, 1);
  assert.equal(second.created, false);
  assert.equal(second.reversalId, 'trr_late');
});

test('disabled delivery blocks new checkout creation and still reconciles refunds', () => {
  assert.equal(deliveryWebhookClass({
    eventType: 'checkout.session.completed',
    paymentStatus: 'unpaid',
    deliveryEnabled: false,
  }), 'BLOCKED');
  assert.equal(deliveryWebhookClass({
    eventType: 'checkout.session.completed',
    paymentStatus: 'paid',
    deliveryEnabled: false,
  }), 'EXISTING_DELIVERY_RECONCILIATION');
  assert.equal(deliveryWebhookClass({
    eventType: 'charge.refunded',
    deliveryEnabled: false,
  }), 'EXISTING_DELIVERY_RECONCILIATION');
  assert.equal(deliveryWebhookClass({
    eventType: 'checkout.session.completed',
    paymentStatus: 'unpaid',
    deliveryEnabled: true,
  }), 'NEW_DELIVERY_CREATION');
  const webhook = readFileSync(new URL('../../app/api/stripe/webhook/route.ts', import.meta.url), 'utf8');
  assert.equal(webhook.includes('JSON.stringify(session.metadata'), false);
  assert.equal(webhook.includes('deliveryWebhookClass'), true);
  assert.equal(webhook.includes('listReversals'), true);
});
