import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  readSalesLocationId,
  selectSharedDeliveryOrigin,
  withSalesLocationNote,
  type DeliveryOriginStall,
} from './delivery-origin';
import { lockedBookingCheckoutPrice } from './locked-booking-price';

const vlaardingen: DeliveryOriginStall = {
  locationId: 'loc-vlaardingen',
  name: 'Vlaardingen',
  city: 'Vlaardingen',
  addressLabel: 'Hoogstraat 1, 3131 BC Vlaardingen',
  lat: 51.912,
  lng: 4.341,
  isPrimary: true,
};
const schiedam: DeliveryOriginStall = {
  locationId: 'loc-schiedam',
  name: 'Schiedam',
  city: 'Schiedam',
  addressLabel: 'Hoogstraat 20, 3111 Schiedam',
  lat: 51.919,
  lng: 4.399,
  isPrimary: false,
};
const rotterdam: DeliveryOriginStall = {
  locationId: 'loc-rotterdam',
  name: 'Rotterdam',
  city: 'Rotterdam',
  addressLabel: 'Coolsingel 1, 3011 Rotterdam',
  lat: 51.922,
  lng: 4.479,
  isPrimary: false,
};

const buyerRotterdam = { buyerLat: 51.9225, buyerLng: 4.4791 };

describe('delivery origin', () => {
  it('TEST 1 uses Rotterdam for a Rotterdam buyer when all three stalls are valid', () => {
    const decision = selectSharedDeliveryOrigin({
      perProduct: [[vlaardingen, schiedam, rotterdam]],
      ...buyerRotterdam,
    });
    assert.equal(decision.ok && decision.kind === 'location' && decision.location.locationId, 'loc-rotterdam');
    assert.equal(decision.ok && decision.kind === 'location' && decision.reason, 'nearest');
  });

  it('TEST 2 uses the only remaining stall when Rotterdam is not available', () => {
    const decision = selectSharedDeliveryOrigin({
      perProduct: [[vlaardingen, schiedam]],
      ...buyerRotterdam,
    });
    assert.equal(decision.ok && decision.kind === 'location' && decision.location.locationId, 'loc-schiedam');
    assert.equal(decision.ok && decision.kind === 'location' && decision.reason, 'nearest');
  });

  it('TEST 4 keeps an explicit Vlaardingen choice even when Rotterdam is nearer', () => {
    const decision = selectSharedDeliveryOrigin({
      perProduct: [[vlaardingen, schiedam, rotterdam]],
      requestedLocationId: 'loc-vlaardingen',
      ...buyerRotterdam,
    });
    assert.equal(decision.ok && decision.kind === 'location' && decision.location.city, 'Vlaardingen');
    assert.equal(decision.ok && decision.kind === 'location' && decision.reason, 'requested');
  });

  it('TEST 8 requires a stall that sells every product', () => {
    const decision = selectSharedDeliveryOrigin({
      perProduct: [
        [vlaardingen, rotterdam],
        [rotterdam],
      ],
      ...buyerRotterdam,
    });
    assert.equal(decision.ok && decision.kind === 'location' && decision.location.locationId, 'loc-rotterdam');
    const blocked = selectSharedDeliveryOrigin({
      perProduct: [[vlaardingen, rotterdam], [schiedam]],
      requestedLocationId: 'loc-vlaardingen',
    });
    assert.equal(blocked.ok, false);
    if (!blocked.ok) assert.equal(blocked.code, 'NO_SHARED_LOCATION');
  });

  it('TEST 9 leaves a product without sales locations on the legacy pickup', () => {
    const decision = selectSharedDeliveryOrigin({ perProduct: [[]], ...buyerRotterdam });
    assert.deepEqual(decision, { ok: true, kind: 'legacy' });
  });

  it('does not mix a legacy listing with a stalled listing', () => {
    const decision = selectSharedDeliveryOrigin({
      perProduct: [[rotterdam], []],
    });
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.equal(decision.code, 'NO_SHARED_LOCATION');
  });

  it('rejects an unknown stall instead of switching city', () => {
    const decision = selectSharedDeliveryOrigin({
      perProduct: [[rotterdam]],
      requestedLocationId: 'loc-other',
    });
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.equal(decision.code, 'LOCATION_NOT_ON_PRODUCT');
  });

  it('uses one stall automatically and otherwise the primary stall without buyer coordinates', () => {
    const only = selectSharedDeliveryOrigin({ perProduct: [[schiedam]] });
    assert.equal(only.ok && only.kind === 'location' && only.reason, 'only');
    const primary = selectSharedDeliveryOrigin({
      perProduct: [[vlaardingen, schiedam, rotterdam]],
    });
    assert.equal(primary.ok && primary.kind === 'location' && primary.location.locationId, 'loc-vlaardingen');
    assert.equal(primary.ok && primary.kind === 'location' && primary.reason, 'primary');
  });

  it('stores the chosen stall on the booking note and reads it back', () => {
    const locationId = 'f2b0da5e-e6a4-4f05-bb33-3005f9446bbd';
    const notes = withSalesLocationNote('Bezorgadres: Coolsingel 10', locationId);
    assert.equal(readSalesLocationId(notes), locationId);
    assert.match(notes || '', /Bezorgadres: Coolsingel 10/);
    assert.equal(readSalesLocationId(withSalesLocationNote(notes, null)), null);
  });

  it('uses one origin helper for match, quote, fee, checkout and the courier dashboard', () => {
    const root = path.resolve(__dirname, '../..');
    const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');
    for (const file of [
      'app/api/delivery/match-deliverers/route.ts',
      'app/api/checkout/calculate-delivery-fee/route.ts',
      'app/api/checkout/route.ts',
      'lib/delivery/booking-request-service.ts',
    ]) {
      assert.match(read(file), /resolveMarketplaceDeliveryOrigin/);
    }
    assert.match(read('app/api/delivery/dashboard/route.ts'), /dashboardPickupCoords/);
    assert.match(read('app/api/checkout/route.ts'), /deliveryOriginLocationId/);
    assert.match(read('lib/seller/sales-locations-server.ts'), /resolveCheckoutPickupAddress/);
  });

  it('TEST 5 and location switch refuse a booking locked to another route', () => {
    const addressChanged = lockedBookingCheckoutPrice({
      quotedFeeCents: 450,
      routeDistanceKm: 3.2,
      buyerLat: 51.9225,
      buyerLng: 4.4791,
      bodyLat: 51.91,
      bodyLng: 4.34,
      bookingSalesLocationId: rotterdam.locationId,
      bodySalesLocationId: rotterdam.locationId,
    });
    assert.equal(addressChanged.ok, false);
    if (!addressChanged.ok) assert.equal(addressChanged.code, 'DELIVERY_ROUTE_CHANGED');

    const stallChanged = lockedBookingCheckoutPrice({
      quotedFeeCents: 450,
      routeDistanceKm: 3.2,
      buyerLat: 51.9225,
      buyerLng: 4.4791,
      bodyLat: 51.9225,
      bodyLng: 4.4791,
      bookingSalesLocationId: rotterdam.locationId,
      bodySalesLocationId: vlaardingen.locationId,
    });
    assert.equal(stallChanged.ok, false);
    if (!stallChanged.ok) assert.equal(stallChanged.code, 'DELIVERY_ROUTE_CHANGED');
  });
});
