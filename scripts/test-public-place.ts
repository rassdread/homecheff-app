/**
 * Public location privacy. No database.
 * Run: npx tsx scripts/test-public-place.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  confirmedPublicLocality,
  looksLikePreciseAddress,
  stripPreciseLocationFromPublicItem,
  toPublicPlaceLabel,
} from '../lib/geo/public-place';
import {
  formatItemPlaceDistanceLine,
  formatPublicTileLocationLine,
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
assert.equal(looksLikePreciseAddress('Karel Doormanlaan'), true);
assert.equal(looksLikePreciseAddress('Molenstraat'), true);
assert.equal(looksLikePreciseAddress('Damrak'), true);
assert.equal(looksLikePreciseAddress('Atelierstraat 9'), true);
assert.equal(looksLikePreciseAddress('Vlaardingen'), false);
assert.equal(looksLikePreciseAddress('Amsterdam-Noord'), false);
assert.equal(looksLikePreciseAddress('Jordaan'), false);
assert.equal(toPublicPlaceLabel('Molenstraat'), null);
assert.equal(toPublicPlaceLabel('Damrak'), null);
assert.equal(looksLikePreciseAddress('Rokin'), false);
assert.equal(confirmedPublicLocality('Molenstraat', null), null);
assert.equal(confirmedPublicLocality('Rokin', null), null);
assert.equal(
  confirmedPublicLocality('Rokin', { status: 'resolved', kinds: ['route'] }),
  null,
);
assert.equal(confirmedPublicLocality('Sint Maarten', { status: 'ambiguous' }), null);
assert.equal(confirmedPublicLocality('Nergensdorp', { status: 'none' }), null);
assert.equal(
  confirmedPublicLocality('Jordaan', {
    status: 'resolved',
    kinds: ['neighborhood'],
    label: 'Jordaan',
  }),
  'Jordaan',
);
assert.equal(
  resolveProductPlaceLabel({
    placeName: null,
    seller: { User: { place: 'Rokin', city: null } },
  }),
  null,
);
assert.equal(
  resolveProductPlaceLabel({
    placeName: null,
    seller: { User: { place: 'Molenstraat', city: null } },
  }),
  null,
);
assert.equal(
  resolveProductPlaceLabel({
    placeName: 'Amsterdam-Noord',
    pickupAddress: 'Damrak 10, 1012 LG Amsterdam',
    seller: { User: { place: 'Rokin', city: null } },
  }),
  'Amsterdam-Noord',
);
assert.equal(toPublicPlaceLabel('Amsterdam-Noord'), 'Amsterdam-Noord');
assert.equal(
  formatPublicTileLocationLine({ place: 'Molenstraat', distanceKm: 0.1 }),
  '',
);
assert.equal(
  formatPublicTileLocationLine({ place: 'Amsterdam-Noord', distanceKm: 0 }),
  'Amsterdam-Noord · 0 km',
);
assert.equal(
  formatPublicTileLocationLine({ place: 'Haarlem', distanceKm: null }),
  'Haarlem',
);

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
  seller: { lat: 51.9, lng: 4.3, User: { place: 'Karel Doormanlaan 15', lat: 1, lng: 2, stripeConnectAccountId: 'acct_test' } },
  User: { place: 'Amsterdam', stripeConnectAccountId: 'acct_test' },
});
assert.equal(stripped.place, 'Vlaardingen');
assert.equal('stripeConnectAccountId' in (stripped.User as object), false);
assert.equal(stripped.distanceKm, 0.5);
assert.equal('lat' in stripped, false);
assert.equal('pickupAddress' in stripped, false);
assert.equal((stripped.seller as { lat?: number }).lat, undefined);
assert.equal((stripped.seller as { User: { place: string } }).User.place, null);

const streetProfile = stripPreciseLocationFromPublicItem({
  place: 'Molenstraat',
  placeName: 'Molenstraat',
  pickupAddress: 'Damrak 12, Amsterdam',
  lat: 52.37,
  lng: 4.89,
  seller: { User: { place: 'Damrak', city: 'Haarlem', lat: 1, lng: 2 } },
});
assert.equal(streetProfile.place, null);
assert.equal('placeName' in streetProfile, false);
assert.equal('pickupAddress' in streetProfile, false);
assert.equal('lat' in streetProfile, false);
assert.equal((streetProfile.seller as { User: { place: string | null; city: string } }).User.place, null);
assert.equal((streetProfile.seller as { User: { city: string } }).User.city, 'Haarlem');

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
