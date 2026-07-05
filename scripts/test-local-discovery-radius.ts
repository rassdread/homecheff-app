/**
 * Unit checks for feed radius modes (LOCAL_FIRST vs STRICT_LOCAL).
 * Run: npx tsx scripts/test-local-discovery-radius.ts
 */
import {
  FEED_RADIUS_MODE_LOCAL_FIRST,
  FEED_RADIUS_MODE_STRICT_LOCAL,
  filterProductWithinRadius,
  isWithinRadiusKm,
  nextWiderFeedRadiusKm,
  normalizeFeedRadiusMode,
  sortFeedItemsLocalFirst,
} from '../lib/geo/local-discovery';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const viewer = { lat: 52.37, lng: 4.89 };
const near = { lat: 52.38, lng: 4.9 };
const far = { lat: 53.2, lng: 6.5 };

function item(
  id: string,
  coords: { lat: number; lng: number } | null,
  createdAt = '2026-01-01T00:00:00.000Z'
) {
  return {
    id,
    createdAt,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  };
}

assert(
  normalizeFeedRadiusMode('strict_local') === FEED_RADIUS_MODE_STRICT_LOCAL,
  'strict_local mode'
);
assert(
  normalizeFeedRadiusMode('local_first') === FEED_RADIUS_MODE_LOCAL_FIRST,
  'local_first mode'
);
assert(
  normalizeFeedRadiusMode(null) === FEED_RADIUS_MODE_LOCAL_FIRST,
  'default mode'
);

assert(
  filterProductWithinRadius(
    { lat: near.lat, lng: near.lng },
    viewer,
    25,
    FEED_RADIUS_MODE_STRICT_LOCAL
  ),
  'near seller in strict'
);
assert(
  !filterProductWithinRadius(
    { lat: far.lat, lng: far.lng },
    viewer,
    25,
    FEED_RADIUS_MODE_STRICT_LOCAL
  ),
  'far seller excluded in strict'
);
assert(
  filterProductWithinRadius(
    { lat: null, lng: null },
    viewer,
    25,
    FEED_RADIUS_MODE_LOCAL_FIRST
  ),
  'no coords pass in local_first'
);
assert(
  !filterProductWithinRadius(
    { lat: null, lng: null },
    viewer,
    25,
    FEED_RADIUS_MODE_STRICT_LOCAL
  ),
  'no coords excluded in strict'
);

const mixed = [item('far', far), item('near', near), item('unknown', null)];
const extractCoords = (i: (typeof mixed)[number]) =>
  i.lat != null && i.lng != null ? { lat: i.lat, lng: i.lng } : null;

const localFirst = sortFeedItemsLocalFirst(mixed, {
  viewerGeo: viewer,
  radiusKm: 25,
  radiusMode: FEED_RADIUS_MODE_LOCAL_FIRST,
  followedSellerUserIds: new Set(),
  extractSellerUserId: () => null,
  extractCoords,
});
assert(localFirst.length === 3, 'local_first keeps all items');
assert(localFirst[0].id === 'near', 'local_first puts near item first');

const strict = sortFeedItemsLocalFirst(mixed, {
  viewerGeo: viewer,
  radiusKm: 25,
  radiusMode: FEED_RADIUS_MODE_STRICT_LOCAL,
  followedSellerUserIds: new Set(),
  extractSellerUserId: () => null,
  extractCoords,
});
assert(strict.length === 1, 'strict_local only within radius');
assert(strict[0].id === 'near', 'strict_local keeps near item');
assert(
  strict[0].distanceKm != null && isWithinRadiusKm(strict[0].distanceKm, 25),
  'strict item has valid distance'
);

const strictSmall = sortFeedItemsLocalFirst(mixed, {
  viewerGeo: viewer,
  radiusKm: 5,
  radiusMode: FEED_RADIUS_MODE_STRICT_LOCAL,
  followedSellerUserIds: new Set(),
  extractSellerUserId: () => null,
  extractCoords,
});
const strictLarge = sortFeedItemsLocalFirst(mixed, {
  viewerGeo: viewer,
  radiusKm: 500,
  radiusMode: FEED_RADIUS_MODE_STRICT_LOCAL,
  followedSellerUserIds: new Set(),
  extractSellerUserId: () => null,
  extractCoords,
});
assert(
  strictSmall.length <= strictLarge.length,
  'wider radius includes at least as many strict items'
);

assert(nextWiderFeedRadiusKm(5) === 10, 'next wider preset from 5');

console.log('✅ local-discovery radius mode tests passed');
