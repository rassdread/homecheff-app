#!/usr/bin/env npx tsx
/**
 * Geographic feed integrity contract — scopes, mainland NL, cache key, race guards.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  isEligibleForNationalFeedScope,
  isInsideNlMainlandBbox,
  isKingdomCaribbeanCountryCode,
  isKingdomCaribbeanPlaceLabel,
  isNationalNetherlandsListing,
  NL_MAINLAND_BBOX,
} from '../lib/geo/netherlands-mainland';
import {
  peekFreshHomeFeedReturnCache,
  readHomeFeedReturnCache,
  saveHomeFeedReturnCache,
  clearHomeFeedReturnCache,
} from '../lib/feed/home-feed-return-cache';
import { normalizeFeedScope, scopeUsesRadiusFilter } from '../lib/feed/feed-scope';

console.log('=== Geo feed integrity contract ===\n');

// --- Mainland NL vs Caribbean ---
assert.equal(isKingdomCaribbeanCountryCode('SX'), true);
assert.equal(isKingdomCaribbeanCountryCode('CW'), true);
assert.equal(isKingdomCaribbeanCountryCode('AW'), true);
assert.equal(isKingdomCaribbeanCountryCode('BQ'), true);
assert.equal(isKingdomCaribbeanCountryCode('NL'), false);

assert.equal(isKingdomCaribbeanPlaceLabel('Sint Maarten'), true);
assert.equal(isKingdomCaribbeanPlaceLabel('Curaçao'), true);
assert.equal(isKingdomCaribbeanPlaceLabel('Berkel & Rodenrijs'), false);
assert.equal(isKingdomCaribbeanPlaceLabel('Vlaardingen'), false);

const vlaardingen = { lat: 51.912, lng: 4.341 };
const sintMaarten = { lat: 18.0425, lng: -63.0548 };
assert.equal(isInsideNlMainlandBbox(vlaardingen), true);
assert.equal(isInsideNlMainlandBbox(sintMaarten), false);
assert.equal(
  isNationalNetherlandsListing({ coords: vlaardingen, countryCode: 'NL' }),
  true,
);
assert.equal(
  isNationalNetherlandsListing({ coords: sintMaarten, countryCode: 'NL' }),
  false,
  'SX coords must not pass national even if country defaults to NL',
);
assert.equal(
  isNationalNetherlandsListing({ coords: sintMaarten, countryCode: 'SX' }),
  false,
);
assert.equal(
  isNationalNetherlandsListing({ coords: null, countryCode: 'NL' }),
  false,
  'national requires mainland coords',
);
assert.equal(
  isNationalNetherlandsListing({
    coords: null,
    countryCode: 'NL',
    place: 'Sint Maarten',
  }),
  false,
  'place-labeled SX must not pass national',
);
assert.equal(
  isEligibleForNationalFeedScope({
    coords: null,
    place: 'Sint Maarten',
    isMarketplaceSale: false,
  }),
  false,
  'inspiration with SX place excluded from national',
);
assert.equal(
  isEligibleForNationalFeedScope({
    coords: null,
    place: 'Berkel & Rodenrijs',
    isMarketplaceSale: false,
  }),
  true,
  'NL inspiration without coords may remain in national',
);
assert.ok(NL_MAINLAND_BBOX.latMax > NL_MAINLAND_BBOX.latMin);

// --- Scope helpers ---
assert.equal(normalizeFeedScope('nearby'), 'nearby');
assert.equal(normalizeFeedScope('national'), 'national');
assert.equal(normalizeFeedScope('international'), 'international');
assert.equal(scopeUsesRadiusFilter('nearby'), true);
assert.equal(scopeUsesRadiusFilter('national'), false);

// --- Return cache must never cross request keys ---
clearHomeFeedReturnCache();
saveHomeFeedReturnCache({
  requestKey: 'scope=national&radius=0&take=10&skip=0',
  items: [{ id: 'a' }],
  inspiratiePool: [],
  apiViewerCoords: null,
  nativeFeedRenderMore: false,
  discoveryFeed: null,
});
assert.equal(
  readHomeFeedReturnCache('scope=nearby&radius=25&lat=51.9&lng=4.3&take=10&skip=0'),
  null,
  'nearby must not read national cache',
);
assert.equal(peekFreshHomeFeedReturnCache(), null, 'peek without key returns null');
assert.ok(
  peekFreshHomeFeedReturnCache('scope=national&radius=0&take=10&skip=0'),
  'peek with matching key still works',
);
clearHomeFeedReturnCache();

// --- Static wiring ---
const geo = readFileSync('components/feed/GeoFeed.tsx', 'utf8');
const route = readFileSync('app/api/feed/route.ts', 'utf8');
const cache = readFileSync('lib/feed/home-feed-return-cache.ts', 'utf8');

assert(!geo.includes('peekFreshHomeFeedReturnCache()'), 'no unkeyed peek');
assert(geo.includes('clearHomeFeedReturnCache()'), 'scope change clears cache');
assert(geo.includes('latestFeedRequestKeyRef'), 'stale response guard present');
assert(geo.includes('requestAndGetNativeCurrentPosition'), 'native GPS wired');
assert(route.includes('isEligibleForNationalFeedScope'), 'API national filter');
assert(route.includes('FEED_RADIUS_MODE_STRICT_LOCAL'), 'nearby strict local');
assert(route.includes('nearbyNeedsLocation'), 'nearby without coords guarded');
assert(cache.includes('if (!requestKey) return null'), 'peek requires key');

console.log('  ✅ mainland NL / Caribbean classification');
console.log('  ✅ return-cache requestKey isolation');
console.log('  ✅ GeoFeed + API wiring guards');
console.log('\n=== Result: geo feed integrity checks passed ===\n');
