import assert from 'node:assert/strict';
import test from 'node:test';
import {
  capabilityLabels,
  capabilityWhere,
  parseUserCapabilityFilters,
} from '@/lib/admin/user-capabilities';

test('unknown admin filters are rejected', () => {
  const parsed = parseUserCapabilityFilters(['buyers', 'not-a-role']);
  assert.equal(parsed.ok, false);
});

test('buyer and business-seller filters combine and do not use User.role alone', () => {
  const parsed = parseUserCapabilityFilters(['buyers', 'business_sellers']);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const where = capabilityWhere(parsed.filters, {
    now: new Date('2026-10-27T00:00:00Z'),
    subscribedUserIds: ['biz-1'],
  });
  const serialized = JSON.stringify(where);
  assert.equal(serialized.includes('orders'), true);
  assert.equal(serialized.includes('SELF_DECLARED_PROFESSIONAL'), true);
  assert.equal(serialized.includes('"role"'), false);
});

test('one account can carry more than one capability label', () => {
  const labels = capabilityLabels({
    orderCount: 2,
    hasSellerProfile: true,
    businessSeller: true,
    hasDeliveryProfile: true,
    commercialAffiliate: true,
    role: 'USER',
    connectReady: true,
  });
  assert.deepEqual(labels, [
    'Koper',
    'Zakelijke verkoper',
    'Bezorgpartner',
    'Affiliate',
    'Connect gereed',
  ]);
});

test('a seller profile without a business marker stays a private seller', () => {
  const labels = capabilityLabels({
    orderCount: 0,
    hasSellerProfile: true,
    businessSeller: false,
    hasDeliveryProfile: false,
    commercialAffiliate: false,
    role: 'USER',
    connectReady: false,
  });
  assert.deepEqual(labels, ['Particuliere verkoper', 'Connect onvolledig']);
});
