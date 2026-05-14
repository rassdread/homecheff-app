/**
 * Unit checks: effective unread count matches list visibility (no DB).
 * Run: npx tsx scripts/test-notification-unread-logic.ts
 */
import assert from 'node:assert/strict';
import { countVisibleUnreadFromRows } from '../lib/notifications/mapNotificationForApi';
import type { NotificationRowForApi } from '../lib/notifications/mapNotificationForApi';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

const baseRow = (over: Partial<NotificationRowForApi>): NotificationRowForApi => ({
  id: 'n1',
  type: 'MESSAGE_RECEIVED',
  payload: {
    title: 'Hi',
    body: 'Hello',
    data: { type: 'NEW_MESSAGE', conversationId: 'conv-1' },
  },
  readAt: null,
  createdAt: new Date('2026-01-01T12:00:00Z'),
  orderId: null,
  ...over,
});

test('buyer: visible chat unread counts', () => {
  const rows = [baseRow({})];
  assert.equal(countVisibleUnreadFromRows(rows, false), 1);
});

test('buyer does not count seller-only order notification', () => {
  const rows = [
    baseRow({
      id: 'so',
      type: 'ORDER_RECEIVED',
      payload: {
        title: 'Nieuwe order',
        body: 'x',
        data: { type: 'NEW_ORDER' },
        link: '/verkoper/orders?highlight=oid',
      },
    }),
  ];
  assert.equal(countVisibleUnreadFromRows(rows, false), 0);
  assert.equal(countVisibleUnreadFromRows(rows, true), 1);
});

test('readAt set: never counted', () => {
  const rows = [baseRow({ readAt: new Date() })];
  assert.equal(countVisibleUnreadFromRows(rows, false), 0);
});

if (process.exitCode) process.exit(1);
console.log('All notification-unread logic checks passed.');
