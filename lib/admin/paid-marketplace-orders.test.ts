import assert from 'node:assert/strict';
import test from 'node:test';
import { paidMarketplaceOrderWhere } from '@/lib/admin/paid-marketplace-orders';

test('paid marketplace gross excludes refunded, cancelled, and pending orders', () => {
  const where = paidMarketplaceOrderWhere();
  assert.deepEqual(where.status, {
    in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
  });
  assert.equal(JSON.stringify(where).includes('SUB-'), true);
});
