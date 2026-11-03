import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSeparateChargesTransferParams,
  isInsufficientAvailableBalanceError,
  isTransferGroupSourceConflict,
} from './connect-transfer-params';

describe('buildSeparateChargesTransferParams', () => {
  it('sets transfer_group with source_transaction only when charge has none', () => {
    const first = buildSeparateChargesTransferParams({
      amount: 396,
      currency: 'eur',
      destination: 'acct_seller',
      orderId: 'ord_1',
      sourceTransactionChargeId: 'ch_1',
      chargeTransferGroup: null,
      metadata: { orderId: 'ord_1' },
    });
    assert.equal(first.source_transaction, 'ch_1');
    assert.equal(first.transfer_group, 'order_ord_1');

    const second = buildSeparateChargesTransferParams({
      amount: 227,
      currency: 'eur',
      destination: 'acct_courier',
      orderId: 'ord_1',
      sourceTransactionChargeId: 'ch_1',
      chargeTransferGroup: 'order_ord_1',
      metadata: { orderId: 'ord_1', deliveryOrderId: 'd1' },
    });
    assert.equal(second.source_transaction, 'ch_1');
    assert.equal(second.transfer_group, undefined);
  });

  it('always sets transfer_group when not using source_transaction', () => {
    const params = buildSeparateChargesTransferParams({
      amount: 100,
      currency: 'eur',
      destination: 'acct_x',
      orderId: 'ord_2',
      metadata: { orderId: 'ord_2' },
    });
    assert.equal(params.transfer_group, 'order_ord_2');
    assert.equal(params.source_transaction, undefined);
  });

  it('classifies retryable Stripe errors', () => {
    assert.equal(
      isTransferGroupSourceConflict(
        'You cannot use `transfer_group` if the `source_transaction` already has one set.',
      ),
      true,
    );
    assert.equal(
      isInsufficientAvailableBalanceError(
        'You have insufficient available funds in your Stripe account.',
      ),
      true,
    );
  });
});
