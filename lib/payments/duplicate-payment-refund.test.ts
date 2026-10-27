import assert from 'node:assert/strict';
import test from 'node:test';
import {
  duplicateRefundIdempotencyKey,
  evaluateDuplicateRefund,
} from '@/lib/payments/duplicate-payment-refund';

const eligible = {
  incidentCode: 'ALREADY_CONFIRMED',
  orderIdForSession: null,
  settlementExists: false,
  paymentIntentId: 'pi_1',
  chargeId: 'ch_1',
  amountCents: 1500,
  currency: 'eur',
  expectedAmountCents: 1500,
  disputed: false,
  existingRefundId: null,
  existingRefundStatus: null,
  refundsAllowed: true,
};

test('a confirmed extra charge receives one idempotent refund', () => {
  const decision = evaluateDuplicateRefund(eligible);
  assert.equal(decision.action, 'refund');
  if (decision.action !== 'refund') return;
  assert.equal(decision.amountCents, 1500);
  assert.equal(decision.idempotencyKey, duplicateRefundIdempotencyKey('ch_1'));
  assert.equal(evaluateDuplicateRefund(eligible).action === 'refund' && decision.idempotencyKey, duplicateRefundIdempotencyKey('ch_1'));
});

test('a fulfilled session, a settlement, a dispute, and a bad amount are not refunded', () => {
  assert.equal(evaluateDuplicateRefund({ ...eligible, orderIdForSession: 'order-1' }).action, 'manual');
  assert.equal(evaluateDuplicateRefund({ ...eligible, settlementExists: true }).action, 'manual');
  assert.equal(evaluateDuplicateRefund({ ...eligible, disputed: true }).action, 'manual');
  assert.equal(evaluateDuplicateRefund({ ...eligible, amountCents: 999 }).action, 'manual');
  assert.equal(evaluateDuplicateRefund({ ...eligible, currency: 'usd' }).action, 'manual');
  assert.equal(evaluateDuplicateRefund({ ...eligible, paymentIntentId: null }).action, 'manual');
  assert.equal(evaluateDuplicateRefund({ ...eligible, chargeId: null }).action, 'manual');
  assert.equal(evaluateDuplicateRefund({ ...eligible, refundsAllowed: false }).action, 'manual');
});

test('an existing refund is recorded and a failed refund is not repeated automatically', () => {
  const pending = evaluateDuplicateRefund({
    ...eligible,
    existingRefundId: 're_1',
    existingRefundStatus: 'pending',
  });
  assert.equal(pending.action, 'already_recorded');
  const failed = evaluateDuplicateRefund({
    ...eligible,
    existingRefundId: 're_2',
    existingRefundStatus: 'failed',
  });
  assert.equal(failed.action, 'manual');
  if (failed.action === 'manual') assert.equal(failed.reason, 'REFUND_FAILED');
});
