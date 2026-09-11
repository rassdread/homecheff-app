import assert from 'node:assert/strict';
import {
  assertOrderStatusTransition,
  buildOrderTimeline,
  isOrderStatusTransitionAllowed,
} from './order-status-transitions';

assert.equal(isOrderStatusTransitionAllowed('PENDING', 'CONFIRMED'), true);
assert.equal(isOrderStatusTransitionAllowed('DELIVERED', 'PROCESSING'), false);
assert.equal(isOrderStatusTransitionAllowed('CANCELLED', 'CONFIRMED'), false);
assert.equal(isOrderStatusTransitionAllowed('PROCESSING', 'PROCESSING'), true);

const blocked = assertOrderStatusTransition('REFUNDED', 'DELIVERED');
assert.equal(blocked.ok, false);

const timeline = buildOrderTimeline({
  status: 'PROCESSING',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  deliveryMode: 'PICKUP',
});
assert.ok(timeline.some((s) => s.id === 'placed' && s.done));
assert.ok(timeline.some((s) => s.id === 'ready_or_shipped' && s.labelKey.includes('Pickup')));
assert.ok(!timeline.some((s) => s.id === 'cancelled'));

console.log('order-status-transitions.test.ts: OK');
