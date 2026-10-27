import assert from 'node:assert/strict';
import test from 'node:test';
import { decideRefundStockRestoration } from '@/lib/payments/refund-stock-policy';

const openOrder = {
  kind: 'ORDER_REFUND' as const,
  fullRefund: true,
  orderStatus: 'CONFIRMED',
  shippedAt: null,
  deliveredAt: null,
  pickedUp: false,
  courierDelivered: false,
  alreadyRestored: false,
  lines: [{ productId: 'p1', quantity: 1 }],
};

test('a full refund of an unfulfilled order restores its lines once', () => {
  const decision = decideRefundStockRestoration(openOrder);
  assert.equal(decision.restore, true);
  if (decision.restore) assert.equal(decision.lines[0].quantity, 1);
});

test('a duplicate payment refund does not restore the valid order stock', () => {
  const decision = decideRefundStockRestoration({ ...openOrder, kind: 'DUPLICATE_PAYMENT' });
  assert.equal(decision.restore, false);
  if (!decision.restore) assert.equal(decision.reason, 'DUPLICATE_PAYMENT_KEEPS_VALID_ORDER_STOCK');
});

test('a partial refund does not restore stock', () => {
  const decision = decideRefundStockRestoration({ ...openOrder, fullRefund: false });
  assert.equal(decision.restore, false);
});

test('a delivered or picked-up order does not restore stock', () => {
  assert.equal(decideRefundStockRestoration({ ...openOrder, orderStatus: 'DELIVERED' }).restore, false);
  assert.equal(decideRefundStockRestoration({ ...openOrder, pickedUp: true }).restore, false);
  assert.equal(
    decideRefundStockRestoration({ ...openOrder, shippedAt: new Date('2026-01-01') }).restore,
    false,
  );
});

test('a second restoration is refused', () => {
  const decision = decideRefundStockRestoration({ ...openOrder, alreadyRestored: true });
  assert.equal(decision.restore, false);
  if (!decision.restore) assert.equal(decision.reason, 'ALREADY_RESTORED');
});

test('settlement failure uses the same unfulfilled full-refund rule', () => {
  const decision = decideRefundStockRestoration({ ...openOrder, orderStatus: 'CONFIRMED' });
  assert.equal(decision.restore, true);
});
