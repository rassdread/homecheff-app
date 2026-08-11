/**
 * Early first-feed bootstrap request-key contract tests.
 */
import assert from 'node:assert/strict';
import {
  buildHomeFeedEarlyRequestParams,
  buildHomeFeedEarlyBootstrapInlineScript,
} from '../lib/feed/home-feed-early-bootstrap';
import { readSeededFeedLocation } from '../lib/geo/seeded-feed-location';
import { buildGeoFeedApiParams } from '../lib/feed/feed-query-params';
import { FEED_SCOPE_NEARBY, FEED_SCOPE_NATIONAL } from '../lib/feed/feed-scope';
import { FEED_FIRST_PAGE_TAKE } from '../lib/feed/feed-pagination';
import { isNearbyMissingLocation } from '../lib/feed/nearby-location-state';

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const ipSeed = {
  lat: 51.9088,
  lng: 4.3444,
  label: 'Vlaardingen',
  city: 'Vlaardingen',
  countryCode: 'NL',
  mode: 'point' as const,
  source: 'vercel' as const,
};

const seed = readSeededFeedLocation(undefined, ipSeed);
ok('seed uses server IP when no localStorage', seed.locationSource === 'ip');
ok('seed has coords', seed.userLocation?.lat === 51.9088);

const early = buildHomeFeedEarlyRequestParams(seed, undefined);
const earlyKey = early.toString();

const feedCoords = seed.userLocation;
const nearbyNeeds = isNearbyMissingLocation({
  scope: FEED_SCOPE_NEARBY,
  appliedPlace: '',
  feedCoords,
  countryCode: seed.browseCountryCode,
  locationMode: seed.browseLocationMode,
});
ok('nearby does not need location when IP coords present', nearbyNeeds === false);

const geofeedMirror = buildGeoFeedApiParams(
  {
    scope: FEED_SCOPE_NEARBY,
    radius: seed.radiusKm,
    q: '',
    category: 'all',
    lat: feedCoords?.lat ?? null,
    lng: feedCoords?.lng ?? null,
    place: '',
    locationSource: 'ip',
    countryCode: seed.browseCountryCode || null,
    locationMode: seed.browseLocationMode === 'global' ? null : seed.browseLocationMode,
  },
  { take: FEED_FIRST_PAGE_TAKE, skip: 0 },
);
ok(
  'early bootstrap key matches GeoFeed nearby+IP key',
  earlyKey === geofeedMirror.toString(),
);

const emptySeed = readSeededFeedLocation(undefined, null);
const soft = buildHomeFeedEarlyRequestParams(emptySeed);
ok(
  'empty seed soft-national uses national scope',
  soft.get('scope') === FEED_SCOPE_NATIONAL,
);

const inline = buildHomeFeedEarlyBootstrapInlineScript({
  initialIpApprox: ipSeed,
});
ok('inline script embeds request key', inline.includes(earlyKey.slice(0, 20)));
ok('inline script starts fetch', inline.includes('fetch('));

console.log(`\n✅ home feed early bootstrap: ${passed} checks passed`);
