import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifySellerTransferList,
  decideSellerTransferRecovery,
  sellerTransferRecoveryIdempotencyKey,
  stripeTransferWasAttempted,
} from '@/lib/payments/seller-transfer-recovery';

const base = {
  orderStatus: 'CONFIRMED',
  chargeRefunded: false,
  chargeDisputed: false,
  partialRefund: false,
  destination: 'acct_ready',
  destinationReady: true,
  platformAccountId: 'acct_platform',
  amountCents: 1320,
  expectedAmountCents: 1320,
  failedAttemptRecorded: true,
  recoveryCode: null,
  explicitAdminRecovery: false,
  confirmNewGeneration: false,
  orderId: 'order-1',
  productId: 'product-1',
  chargeId: 'ch_1',
};

test('a cached Stripe failure is not retried with a new key automatically', () => {
  const decision = decideSellerTransferRecovery({
    ...base,
    lookup: { ok: true, match: 'none' },
    localTransferId: null,
  });
  assert.equal(decision.action, 'wait');
  if (decision.action === 'wait') {
    assert.equal(decision.reason, 'CACHED_FAILURE_NEEDS_ADMIN_RECOVERY');
  }
});

test('an existing transfer is adopted and not created again', () => {
  const decision = decideSellerTransferRecovery({
    ...base,
    lookup: { ok: true, match: 'one', transferId: 'tr_existing' },
    localTransferId: null,
    explicitAdminRecovery: true,
  });
  assert.equal(decision.action, 'adopt');
});

test('admin recovery uses one new generation key only after the list is empty', () => {
  const decision = decideSellerTransferRecovery({
    ...base,
    lookup: { ok: true, match: 'none' },
    localTransferId: null,
    explicitAdminRecovery: true,
  });
  assert.equal(decision.action, 'create');
  if (decision.action === 'create') {
    assert.equal(decision.generation, 1);
    assert.equal(
      decision.idempotencyKey,
      sellerTransferRecoveryIdempotencyKey('order-1', 'product-1', 'ch_1', 1),
    );
  }
});

test('a failed recovery generation is not incremented unless the admin confirms it', () => {
  const reused = decideSellerTransferRecovery({
    ...base,
    lookup: { ok: true, match: 'none' },
    localTransferId: null,
    explicitAdminRecovery: true,
    recoveryCode: 'RECOVERY_G1_FAILED',
    confirmNewGeneration: false,
  });
  assert.equal(reused.action, 'create');
  if (reused.action === 'create') assert.equal(reused.generation, 1);

  const next = decideSellerTransferRecovery({
    ...base,
    lookup: { ok: true, match: 'none' },
    localTransferId: null,
    explicitAdminRecovery: true,
    recoveryCode: 'RECOVERY_G1_FAILED',
    confirmNewGeneration: true,
  });
  if (next.action === 'create') assert.equal(next.generation, 2);
});

test('a refunded charge and an unavailable lookup do not create a transfer', () => {
  const refunded = decideSellerTransferRecovery({
    ...base,
    lookup: { ok: true, match: 'none' },
    localTransferId: null,
    explicitAdminRecovery: true,
    chargeRefunded: true,
  });
  assert.equal(refunded.action, 'manual');

  const unknown = decideSellerTransferRecovery({
    ...base,
    lookup: { ok: false, reason: 'LOOKUP_FAILED' },
    localTransferId: null,
    explicitAdminRecovery: true,
  });
  assert.equal(unknown.action, 'manual');
});

test('transfer list matching refuses two product transfers', () => {
  const classified = classifySellerTransferList({
    transfers: [
      { id: 'tr_a', amount: 1320, destination: 'acct_ready', sourceTransaction: 'ch_1', orderId: 'order-1', productId: 'product-1' },
      { id: 'tr_b', amount: 1320, destination: 'acct_ready', sourceTransaction: 'ch_1', orderId: 'order-1', productId: 'product-1' },
    ],
    orderId: 'order-1',
    productId: 'product-1',
    amountCents: 1320,
    chargeId: 'ch_1',
    destination: 'acct_ready',
  });
  assert.equal(classified.ok && classified.match, 'ambiguous');
});

test('a local connect refusal is not treated as a cached Stripe transfer', () => {
  assert.equal(stripeTransferWasAttempted('failed_connect_not_ready_1'), false);
  assert.equal(stripeTransferWasAttempted('failed_1793112996194'), true);
});
