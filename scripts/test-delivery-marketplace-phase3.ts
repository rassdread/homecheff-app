/**
 * Phase 3 — named provider selection, auto/manual confirm, capacity.
 * Run: npx tsx scripts/test-delivery-marketplace-phase3.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ACCEPTANCE_MODE_AUTO,
  ACCEPTANCE_MODE_MANUAL,
  BOOKING_REQUEST_TTL_MS,
  resolvePublicAvailabilityBadge,
  validateProviderAutoConfirm,
} from '../lib/delivery/provider-acceptance';
import { readDeliveryAlignmentFlags } from '../lib/delivery/delivery-alignment-flags';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

const root = join(__dirname, '..');
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

const baseProfile = {
  id: 'p1',
  isActive: true,
  isVerified: true,
  isBlocked: false,
  isOnline: true,
  pricingEnabled: true,
  baseFeeCents: 250,
  pricePerKmCents: 75,
  minimumFeeCents: 300,
  age: 25,
  maxDistance: 10,
  nationalCoverage: false,
  temporaryOffline: false,
  workStartTime: '00:00',
  workEndTime: '23:59',
  availableDays: [] as string[],
  maxSimultaneousDeliveries: 3,
  maxDeliveriesPerSlot: 2,
  preparationTimeMinutes: 15,
  estimatedPickupDelayMinutes: 10,
  transportation: ['BIKE'],
  acceptanceMode: ACCEPTANCE_MODE_AUTO,
  dateOfBirth: new Date('2000-01-01'),
};

test('AUTO_CONFIRM fails when pricingEnabled without fee fields', () => {
  const r = validateProviderAutoConfirm(
    {
      ...baseProfile,
      baseFeeCents: null,
      pricePerKmCents: null,
      minimumFeeCents: null,
    },
    { routeDistanceKm: 5, requirePricingEnabled: true }
  );
  assert.equal(r.ok, false);
});

test('named selection flag defaults false', () => {
  assert.equal(readDeliveryAlignmentFlags({}).namedProviderSelectionEnabled, false);
});

test('booking TTL is 5 minutes', () => {
  assert.equal(BOOKING_REQUEST_TTL_MS, 5 * 60 * 1000);
});

test('AUTO_CONFIRM passes when all provider rules satisfied', () => {
  const r = validateProviderAutoConfirm(baseProfile, {
    routeDistanceKm: 5,
    activeDeliveryCount: 0,
    requirePricingEnabled: true,
  });
  assert.equal(r.ok, true);
});

test('AUTO_CONFIRM fails closed when offline / capacity / radius', () => {
  assert.equal(
    validateProviderAutoConfirm(
      { ...baseProfile, isOnline: false },
      { routeDistanceKm: 5 }
    ).ok,
    false
  );
  assert.equal(
    validateProviderAutoConfirm(baseProfile, {
      routeDistanceKm: 5,
      activeDeliveryCount: 3,
    }).ok,
    false
  );
  assert.equal(
    validateProviderAutoConfirm(baseProfile, { routeDistanceKm: 50 }).ok,
    false
  );
});

test('public badges map acceptance modes', () => {
  assert.equal(
    resolvePublicAvailabilityBadge({
      acceptanceMode: ACCEPTANCE_MODE_AUTO,
      isActive: true,
      isOnline: true,
      autoConfirmOk: true,
    }).code,
    'DIRECT_BOOKABLE'
  );
  assert.equal(
    resolvePublicAvailabilityBadge({
      acceptanceMode: ACCEPTANCE_MODE_MANUAL,
      isActive: true,
      isOnline: true,
    }).labelNl,
    'Handmatige bevestiging'
  );
  assert.equal(
    resolvePublicAvailabilityBadge({
      temporaryOffline: true,
    }).code,
    'UNAVAILABLE'
  );
});

test('DelivererSelector is wired into checkout page', () => {
  const page = read('app/checkout/page.tsx');
  assert.ok(page.includes('DelivererSelector'));
  assert.ok(page.includes('booking-requests'));
  assert.ok(page.includes('namedProviderSelectionEnabled'));
});

test('checkout API requires booking when named selection enabled', () => {
  const src = read('app/api/checkout/route.ts');
  assert.ok(src.includes('namedProviderSelectionEnabled'));
  assert.ok(src.includes('DELIVERY_BOOKING_REQUIRED') || src.includes('bookingRequestId'));
  assert.ok(src.includes('DELIVERY_BOOKING_NOT_CONFIRMED') || src.includes('AUTO_CONFIRMED'));
});

test('webhook targets named provider without broadcast pool', () => {
  const src = read('app/api/stripe/webhook/route.ts');
  assert.ok(src.includes('namedProviderSelection'));
  assert.ok(src.includes('deliveryAcceptanceMode'));
  assert.ok(src.includes('DeliveryCalendarEntry') || src.includes('deliveryCalendarEntry'));
});

test('schema has acceptanceMode and booking request model', () => {
  const schema = read('prisma/schema.prisma');
  assert.ok(schema.includes('acceptanceMode'));
  assert.ok(schema.includes('DeliveryBookingRequest'));
  assert.ok(schema.includes('DeliveryCalendarEntry'));
  assert.ok(schema.includes('maxSimultaneousDeliveries'));
  assert.ok(schema.includes('providerType'));
});

test('no company-driver hierarchy / dispatch engine', () => {
  const accept = read('lib/delivery/provider-acceptance.ts');
  assert.ok(!accept.includes('assignDriver'));
  assert.ok(!accept.includes('dispatchEngine'));
  const booking = read('lib/delivery/booking-request-service.ts');
  assert.ok(!booking.includes('reassign'));
});

test('match-deliverers exposes confirmation mode contract', () => {
  const src = read('app/api/delivery/match-deliverers/route.ts');
  assert.ok(src.includes('acceptanceMode'));
  assert.ok(src.includes('availabilityBadge'));
  assert.ok(src.includes('estimatedArrivalMinutes'));
});

if (!process.exitCode) {
  console.log('\nAll Phase 3 named-provider selection tests passed.');
}
