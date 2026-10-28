import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { capabilityWhere, parseUserCapabilityFilters } from '@/lib/admin/user-capabilities';

test('courier admin filters require a delivery profile and can combine with another role', () => {
  const parsed = parseUserCapabilityFilters(['delivery_partners', 'buyers']);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const where = capabilityWhere(parsed.filters, {
    now: new Date('2026-10-28T00:00:00Z'),
    subscribedUserIds: [],
  });
  const serialized = JSON.stringify(where);
  assert.match(serialized, /DeliveryProfile/);
  assert.match(serialized, /orders/);
  assert.equal(serialized.includes('"role":"DELIVERY"'), false);
});

test('the notification courier option is labeled as couriers and selects delivery profiles', () => {
  const nl = JSON.parse(readFileSync('public/i18n/nl.json', 'utf8'));
  const en = JSON.parse(readFileSync('public/i18n/en.json', 'utf8'));
  assert.equal(nl.admin.notificationCenter.activeOnly, 'Bezorgers');
  assert.equal(en.admin.notificationCenter.activeOnly, 'Couriers');
  const ui = readFileSync('components/admin/NotificationCenter.tsx', 'utf8');
  assert.match(ui, /value="delivery"/);
  const route = readFileSync('app/api/admin/notifications/send/route.ts', 'utf8');
  const audience = readFileSync('lib/admin/courier-notification-audience.ts', 'utf8');
  assert.match(audience, /deliveryProfile\.findMany/);
  assert.match(audience, /accountDeletedAt/);
  assert.equal(route.includes("role: 'DELIVERY'"), false);
  assert.match(route, /to:\s*\[user\.email!\]/);
  assert.match(route, /role: 'SELLER'/);
  assert.match(route, /role: 'BUYER'/);
});
