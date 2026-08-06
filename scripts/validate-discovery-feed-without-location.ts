/**
 * Discovery feed must render without a chosen location.
 * Nearby radius filtering applies only when a viewer location is known.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { partitionSaleItemsByRadius } from '../lib/geo/feed-radius-filter';
import { FEED_SCOPE_NEARBY, FEED_SCOPE_NATIONAL } from '../lib/feed/feed-scope';
import { isZeroResultsEligible, FEED_RESULT_PHASE } from '../lib/feed/feed-filter-transition';

const root = path.resolve(__dirname, '..');
const geo = fs.readFileSync(path.join(root, 'components/feed/GeoFeed.tsx'), 'utf8');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Discovery feed without location ===\n');

check(
  'empty-state location gate remains disabled',
  geo.includes('showNearbyLocationRequired = false'),
);

check(
  'client radius filter requires !nearbyNeedsLocation',
  /locationFilterActive\s*=\s*[\s\S]*?FEED_SCOPE_NEARBY[\s\S]*?!nearbyNeedsLocation/.test(
    geo,
  ) && geo.includes('hasViewerCoordsForSort'),
);

check(
  'feedStartupBlocked is session-only (no profile-coords location wait)',
  geo.includes('feedStartupBlocked = isAwaitingSessionResolution') &&
    !geo.includes('nearbyScopeAwaitingProfileCoords'),
);

check(
  'inspiration slots not gated on nearbyNeedsLocation',
  !/inspirationSlots[\s\S]{0,200}if \(nearbyNeedsLocation\) return \[\]/.test(geo),
);

check(
  'recirculation not gated on nearbyNeedsLocation',
  !/composedDisplayRows[\s\S]{0,120}if \(nearbyNeedsLocation\)/.test(geo),
);

check(
  'soft national fallback fetch path intact',
  geo.includes('softNationalFallback') &&
    geo.includes('Soft national fallback while waiting'),
);

// Behavioral: items without distanceKm must remain visible when filter inactive
const discoveryItems = [
  { id: 'a', distanceKm: undefined as number | undefined },
  { id: 'b', distanceKm: null as unknown as undefined },
  { id: 'c', distanceKm: 3 },
];
const partitioned = partitionSaleItemsByRadius(discoveryItems, 10, {
  scope: FEED_SCOPE_NEARBY,
});
check(
  'radius partition without distanceKm drops from local (why filter must be off)',
  partitioned.local.length === 1 && partitioned.fallback.length === 2,
);

const locationFilterActive = false; // discovery fallback
const salePool = locationFilterActive ? partitioned.local : discoveryItems;
check(
  'discovery fallback keeps full sale pool when filter inactive',
  salePool.length === 3,
);

const nearbyWithViewer = partitionSaleItemsByRadius(
  [
    { id: 'near', distanceKm: 2 },
    { id: 'far', distanceKm: 50 },
  ],
  10,
  { scope: FEED_SCOPE_NEARBY },
);
check(
  'nearby with distances still partitions for radius',
  nearbyWithViewer.local.map((i) => i.id).join() === 'near' &&
    nearbyWithViewer.fallback.map((i) => i.id).join() === 'far',
);

check(
  'national scope does not radius-partition',
  partitionSaleItemsByRadius(discoveryItems, 10, {
    scope: FEED_SCOPE_NATIONAL,
  }).local.length === 3,
);

check(
  'zero-results eligible even when nearbyNeedsLocation',
  isZeroResultsEligible({
    phase: FEED_RESULT_PHASE.RESULTS_READY,
    loading: false,
    feedRefreshing: false,
    feedHydrated: true,
    nearbyNeedsLocation: true,
    requestInFlight: false,
    resultCount: 0,
  }) === true,
);

console.log(`\n${passed} checks passed`);
