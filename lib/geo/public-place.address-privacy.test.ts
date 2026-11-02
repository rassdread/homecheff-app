/**
 * Private address exposure regression — allowlisted public payloads only.
 */
import assert from 'node:assert/strict';
import {
  looksLikePreciseAddress,
  stripPreciseLocationFromPublicItem,
  toApproximatePublicCoords,
  toMarketplacePublicPickupLocation,
  toPublicListLocation,
  toPublicPlaceLabel,
} from '@/lib/geo/public-place';

assert.equal(toPublicPlaceLabel('Hoogstraat 12, Vlaardingen'), 'Vlaardingen');
assert.equal(toPublicPlaceLabel('Hoogstraat'), null);
assert.equal(looksLikePreciseAddress('3134 AB'), true);

const approx = toApproximatePublicCoords(51.91254, 4.34178);
assert.ok(approx);
assert.equal(approx.lat, 51.91);
assert.equal(approx.lng, 4.34);
assert.notEqual(approx.lat, 51.91254);

const list = toPublicListLocation({
  place: 'Hoogstraat 12, Rotterdam',
  city: 'Rotterdam',
  lat: 51.9225,
  lng: 4.47917,
  salesPoints: [{ lat: 51.9225, lng: 4.47917, city: 'Rotterdam' }],
});
assert.equal(list.place, 'Rotterdam');
assert.equal(list.city, 'Rotterdam');
assert.equal(list.lat, 51.92);
assert.equal(list.lng, 4.48);
assert.equal(list.salesPoints?.[0]?.lat, 51.92);
assert.equal(list.salesPoints?.[0]?.city, 'Rotterdam');

const stall = toMarketplacePublicPickupLocation({
  id: 'loc_1',
  name: 'Keuken',
  street: 'Hoogstraat',
  houseNumber: '12',
  postalCode: '3011PM',
  city: 'Rotterdam',
  country: 'NL',
  lat: 51.9225,
  lng: 4.47917,
  isPrimary: true,
  isActive: true,
});
assert.equal(stall.street, '');
assert.equal(stall.houseNumber, '');
assert.equal(stall.postalCode, '');
assert.equal(stall.city, 'Rotterdam');
assert.equal(stall.addressLabel, 'Rotterdam');
assert.equal(stall.lat, 51.92);
assert.ok(!JSON.stringify(stall).includes('Hoogstraat'));
assert.ok(!JSON.stringify(stall).includes('3011'));

const stripped = stripPreciseLocationFromPublicItem({
  place: 'Hoogstraat 12, Rotterdam',
  lat: 51.9,
  lng: 4.3,
  pickupAddress: 'Hoogstraat 12',
  street: 'Hoogstraat',
  houseNumber: '12',
  postalCode: '3011PM',
  deliveryAddress: 'Buyerstraat 9',
  pickupLocations: [
    {
      id: 'loc_1',
      name: 'Keuken',
      street: 'Hoogstraat',
      houseNumber: '12',
      postalCode: '3011PM',
      city: 'Rotterdam',
      country: 'NL',
      lat: 51.9225,
      lng: 4.47917,
      isPrimary: true,
      isActive: true,
      addressLabel: 'Hoogstraat 12, 3011 PM Rotterdam',
    },
  ],
  location: {
    place: 'Hoogstraat 12',
    lat: 51.9,
    lng: 4.3,
    salesPoints: [{ lat: 51.9225, lng: 4.47917, city: 'Rotterdam' }],
  },
});

assert.equal(stripped.place, 'Rotterdam');
assert.equal('lat' in stripped, false);
assert.equal('pickupAddress' in stripped, false);
assert.equal('deliveryAddress' in stripped, false);
assert.equal('street' in stripped, false);
const loc = stripped.location as { lat?: number; place?: string | null; salesPoints?: unknown[] };
assert.equal('lat' in loc, false);
assert.equal(loc.place, null);
const pubs = stripped.pickupLocations as Array<Record<string, unknown>>;
assert.equal(pubs[0]?.street, '');
assert.equal(pubs[0]?.addressLabel, 'Rotterdam');
assert.ok(!JSON.stringify(stripped).includes('Hoogstraat'));
assert.ok(!JSON.stringify(stripped).includes('Buyerstraat'));
assert.ok(!JSON.stringify(stripped).includes('3011'));

console.log('address privacy regression checks passed');
