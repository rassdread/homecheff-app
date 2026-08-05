/**
 * Phase 5.7 — delivery location integrity unit tests (no DB / no Google).
 * Run: npx tsx scripts/test-delivery-location-phase57.ts
 */
import assert from 'node:assert/strict';
import {
  resolveDeliveryPickupCoords,
  resolveDelivererPosition,
  resolveSellerCoords,
  DELIVERY_GPS_MAX_AGE_MS,
} from '../lib/delivery/delivery-position';
import { calculateProviderDeliveryPrice } from '../lib/delivery/provider-pricing';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

test('pickup prefers listing pickupLat/Lng over seller profile', () => {
  const coords = resolveDeliveryPickupCoords({
    pickupLat: 51.92,
    pickupLng: 4.48,
    seller: {
      lat: 52.37,
      lng: 4.9,
      User: { lat: 52.1, lng: 5.1 },
    },
  });
  assert.deepEqual(coords, { lat: 51.92, lng: 4.48 });
});

test('pickup falls back SellerProfile then User', () => {
  assert.deepEqual(
    resolveDeliveryPickupCoords({
      seller: { lat: 52.37, lng: 4.9, User: { lat: 1, lng: 2 } },
    }),
    { lat: 52.37, lng: 4.9 }
  );
  assert.deepEqual(
    resolveDeliveryPickupCoords({
      seller: { User: { lat: 51.9, lng: 4.5 } },
    }),
    { lat: 51.9, lng: 4.5 }
  );
  assert.equal(resolveDeliveryPickupCoords({}), null);
});

test('resolveSellerCoords does not invent coords', () => {
  assert.equal(resolveSellerCoords(null), null);
  assert.equal(resolveSellerCoords({ lat: 1 }), null);
});

test('fresh GPS wins for deliverer position', () => {
  const now = Date.now();
  const pos = resolveDelivererPosition(
    {
      gpsTrackingEnabled: true,
      isOnline: true,
      currentLat: 51.9,
      currentLng: 4.5,
      lastGpsUpdate: new Date(now - 60_000),
      homeLat: 52.0,
      homeLng: 5.0,
      user: { lat: 53.0, lng: 6.0 },
    },
    now
  );
  assert.equal(pos?.source, 'gps');
  assert.equal(pos?.lat, 51.9);
});

test('stale GPS falls back to home then profile', () => {
  const now = Date.now();
  const stale = resolveDelivererPosition(
    {
      gpsTrackingEnabled: true,
      isOnline: true,
      currentLat: 51.9,
      currentLng: 4.5,
      lastGpsUpdate: new Date(now - DELIVERY_GPS_MAX_AGE_MS - 1),
      homeLat: 52.0,
      homeLng: 5.0,
      user: { lat: 53.0, lng: 6.0 },
    },
    now
  );
  assert.equal(stale?.source, 'home');
  assert.equal(stale?.lat, 52.0);

  const profile = resolveDelivererPosition(
    {
      gpsTrackingEnabled: true,
      isOnline: true,
      currentLat: 51.9,
      currentLng: 4.5,
      lastGpsUpdate: new Date(now - DELIVERY_GPS_MAX_AGE_MS - 1),
      homeLat: null,
      homeLng: null,
      user: { lat: 53.0, lng: 6.0 },
    },
    now
  );
  assert.equal(profile?.source, 'profile');
});

test('nationalCoverage is same-country only, not global', () => {
  const pricing = {
    pricingEnabled: true,
    baseFeeCents: 250,
    pricePerKmCents: 75,
    minimumFeeCents: 300,
    freeDeliveryRadiusKm: 0,
    maxDistanceKm: 15,
    currency: 'EUR',
    nationalCoverage: true,
  };
  const ok = calculateProviderDeliveryPrice({
    pricing,
    routeDistanceKm: 80,
    pickupCountryCode: 'NL',
    dropoffCountryCode: 'NL',
    providerCountryCode: 'NL',
  });
  assert.equal(ok.ok, true);

  const cross = calculateProviderDeliveryPrice({
    pricing,
    routeDistanceKm: 80,
    pickupCountryCode: 'NL',
    dropoffCountryCode: 'BE',
    providerCountryCode: 'NL',
  });
  assert.equal(cross.ok, false);
  if (!cross.ok) assert.equal(cross.code, 'DELIVERY_OUT_OF_RADIUS');
});

test('local provider maxDistance still applies without nationalCoverage', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: {
      pricingEnabled: true,
      baseFeeCents: 250,
      pricePerKmCents: 75,
      minimumFeeCents: 300,
      freeDeliveryRadiusKm: 0,
      maxDistanceKm: 15,
      currency: 'EUR',
      nationalCoverage: false,
    },
    routeDistanceKm: 20,
    pickupCountryCode: 'NL',
    dropoffCountryCode: 'NL',
  });
  assert.equal(quote.ok, false);
  if (!quote.ok) assert.equal(quote.code, 'DELIVERY_OUT_OF_RADIUS');
});

test('pricing uses pickup→dropoff routeDistanceKm only (not provider leg)', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: {
      pricingEnabled: true,
      baseFeeCents: 200,
      pricePerKmCents: 100,
      minimumFeeCents: 200,
      freeDeliveryRadiusKm: 0,
      maxDistanceKm: 50,
      currency: 'EUR',
      nationalCoverage: false,
    },
    routeDistanceKm: 10,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) {
    assert.equal(quote.deliveryFeeCents, 200 + 10 * 100);
    assert.equal(quote.routeDistanceKm, 10);
  }
});

console.log('\nPhase 5.7 delivery-location tests done.');
