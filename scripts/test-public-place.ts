/**
 * Public location privacy. No database.
 * Run: npx tsx scripts/test-public-place.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  looksLikePreciseAddress,
  stripPreciseLocationFromPublicItem,
  toPublicPlaceLabel,
} from '../lib/geo/public-place';
import {
  formatItemPlaceDistanceLine,
  placeFromPickupAddress,
  resolveDisplayPlace,
  resolveProductPlaceLabel,
} from '../lib/geo/item-location';
import { buildDetailConditionsBlock } from '../lib/marketplace/detail/detail-conditions-block';

const unknown = 'Locatie onbekend';

assert.equal(toPublicPlaceLabel('Karel Doormanlaan 15'), null);
assert.equal(toPublicPlaceLabel('Karel Doormanlaan 15, Vlaardingen'), 'Vlaardingen');
assert.equal(toPublicPlaceLabel('3134 AB Vlaardingen'), 'Vlaardingen');
assert.equal(toPublicPlaceLabel('Vlaardingen'), 'Vlaardingen');
assert.equal(looksLikePreciseAddress('Karel Doormanlaan 15'), true);
assert.equal(looksLikePreciseAddress('Vlaardingen'), false);

assert.equal(placeFromPickupAddress('Hoofdstraat 12, Rotterdam'), 'Rotterdam');
assert.equal(
  resolveProductPlaceLabel({
    pickupAddress: 'Karel Doormanlaan 15',
    seller: { User: { city: 'Vlaardingen' } },
  }),
  'Vlaardingen',
);
assert.equal(resolveDisplayPlace('Karel Doormanlaan 15', unknown), unknown);
assert.equal(
  formatItemPlaceDistanceLine({
    place: 'Karel Doormanlaan 15',
    distanceKm: 0.5,
    unknownPlaceLabel: unknown,
    unknownDistanceLabel: 'afstand onbekend',
  }),
  '500 m',
);
assert.equal(
  formatItemPlaceDistanceLine({
    place: 'Vlaardingen',
    distanceKm: 0.5,
    unknownPlaceLabel: unknown,
    unknownDistanceLabel: 'afstand onbekend',
  }),
  'Vlaardingen · 500 m',
);

const lines = buildDetailConditionsBlock({
  pickupAddress: 'Karel Doormanlaan 15, Vlaardingen',
  placeLabel: 'Karel Doormanlaan 15',
});
const region = lines.find((line) => line.kind === 'region');
assert.equal(region?.params?.label, 'Vlaardingen');
assert.equal(JSON.stringify(lines).includes('Karel Doormanlaan'), false);
assert.equal(JSON.stringify(lines).includes('15'), false);

const stripped = stripPreciseLocationFromPublicItem({
  place: 'Karel Doormanlaan 15, Vlaardingen',
  lat: 51.9,
  lng: 4.3,
  pickupLat: 51.9,
  pickupLng: 4.3,
  pickupAddress: 'Karel Doormanlaan 15',
  distanceKm: 0.5,
  seller: { lat: 51.9, lng: 4.3, User: { place: 'Karel Doormanlaan 15', lat: 1, lng: 2 } },
});
assert.equal(stripped.place, 'Vlaardingen');
assert.equal(stripped.distanceKm, 0.5);
assert.equal('lat' in stripped, false);
assert.equal('pickupAddress' in stripped, false);
assert.equal((stripped.seller as { lat?: number }).lat, undefined);
assert.equal((stripped.seller as { User: { place: string } }).User.place, null);

const ordersPage = readFileSync(new URL('../app/orders/page.tsx', import.meta.url), 'utf8');
assert.match(ordersPage, /order\.pickupAddress/);
assert.match(ordersPage, /order\.deliveryAddress/);
const deliveryRoute = readFileSync(
  new URL('../app/api/delivery/dashboard/route.ts', import.meta.url),
  'utf8',
);
assert.match(deliveryRoute, /pickupAddress: true/);
const ordersApi = readFileSync(new URL('../app/api/orders/route.ts', import.meta.url), 'utf8');
assert.match(ordersApi, /pickupAddress: order\.pickupAddress/);
const radius = readFileSync(new URL('../lib/geo/item-location.ts', import.meta.url), 'utf8');
assert.match(radius, /export function resolveProductCoords/);

console.log('public place privacy checks passed');
