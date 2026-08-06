/**
 * Mixed Alles feed + progressive local-first discovery validators.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FEED_SALE_INSPIRATION_STRIDE,
  FEED_SPARSE_LOCAL_SALE_THRESHOLD,
  composeProgressiveNearbySalePool,
  inspirationEligibleForFeedScope,
  interleaveSaleInspirationRows,
  resolveInspirationCompositionScope,
} from '../lib/feed/feed-composition-policy';
import { partitionSaleItemsByRadius } from '../lib/geo/feed-radius-filter';
import { FEED_SCOPE_NEARBY, FEED_SCOPE_NATIONAL } from '../lib/feed/feed-scope';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Mixed feed + progressive discovery ===\n');

const policy = read('lib/feed/feed-composition-policy.ts');
const geo = read('components/feed/GeoFeed.tsx');
const route = read('app/api/feed/route.ts');

check(
  'resolveInspirationCompositionScope exported',
  policy.includes('resolveInspirationCompositionScope') &&
    policy.includes('FEED_SPARSE_LOCAL_SALE_THRESHOLD'),
);

check(
  'composeProgressiveNearbySalePool exported',
  policy.includes('composeProgressiveNearbySalePool'),
);

check(
  'GeoFeed uses inspiration composition scope (not raw appliedScope for geo gate)',
  geo.includes('inspirationCompositionScope') &&
    geo.includes('resolveInspirationCompositionScope') &&
    /inspirationEligibleForFeedScope\(\{[\s\S]*?scope:\s*inspirationCompositionScope/.test(
      geo,
    ),
);

check(
  'GeoFeed progressive nearby sale pool wired',
  geo.includes('composeProgressiveNearbySalePool') &&
    geo.includes('saleWiderPool'),
);

check(
  'API Nearby uses LOCAL_FIRST not STRICT_LOCAL',
  route.includes('FEED_RADIUS_MODE_LOCAL_FIRST') &&
    !route.includes('FEED_RADIUS_MODE_STRICT_LOCAL') &&
    /radiusModeForSort\s*=\s*FEED_RADIUS_MODE_LOCAL_FIRST/.test(route),
);

check(
  'Alles mixed feed still uses interleave / mixedRows',
  geo.includes('mixedRows') &&
    (geo.includes('interleaveSalesAndInspiration') ||
      geo.includes('FEED_SALE_INSPIRATION_STRIDE')),
);

check(
  'Inspiration chip remains inspiration-only path',
  /feedChip === ["']inspiration["'][\s\S]{0,120}inspirationSlots/.test(geo),
);

check(
  'Search applies to inspiration pools',
  geo.includes('matchesSearchTextQuery') && geo.includes('filteredApiInspiration'),
);

// --- Behavioural: scope resolution ---
check(
  'no-location Nearby → national inspiration scope',
  resolveInspirationCompositionScope({
    appliedScope: 'nearby',
    nearbyNeedsLocation: true,
  }) === 'national',
);

check(
  'dense local Nearby keeps nearby inspiration scope',
  resolveInspirationCompositionScope({
    appliedScope: 'nearby',
    nearbyNeedsLocation: false,
    localSaleCount: FEED_SPARSE_LOCAL_SALE_THRESHOLD + 2,
  }) === 'nearby',
);

check(
  'sparse local Nearby widens inspiration to national',
  resolveInspirationCompositionScope({
    appliedScope: 'nearby',
    nearbyNeedsLocation: false,
    localSaleCount: 2,
  }) === 'national',
);

check(
  'national applied scope unchanged',
  resolveInspirationCompositionScope({
    appliedScope: 'national',
    nearbyNeedsLocation: false,
  }) === 'national',
);

// Inspiration without coords eligible under national, not nearby
const noCoordItem = { lat: null, lng: null, place: 'Utrecht' };
check(
  'Inspiration without coords excluded from strict Nearby',
  inspirationEligibleForFeedScope({
    scope: 'nearby',
    item: noCoordItem,
    viewer: { lat: 52.1, lng: 5.1 },
    radiusKm: 25,
  }) === false,
);

check(
  'Inspiration without coords eligible under national mainland place',
  inspirationEligibleForFeedScope({
    scope: 'national',
    item: noCoordItem,
  }) === true,
);

// Progressive pool order
const partitioned = partitionSaleItemsByRadius(
  [
    { id: 'near', distanceKm: 3 },
    { id: 'far', distanceKm: 80 },
    { id: 'mid', distanceKm: 12 },
  ],
  25,
  { scope: FEED_SCOPE_NEARBY },
);
const progressive = composeProgressiveNearbySalePool({
  local: partitioned.local,
  wider: partitioned.fallback,
});
check(
  'progressive pool is local-first then wider',
  progressive.map((i) => i.id).join(',') === 'near,mid,far' ||
    (progressive[0]?.id === 'near' &&
      progressive.some((i) => i.id === 'far') &&
      progressive.length === 3),
);

check(
  'national scope does not radius-split for progressive need',
  partitionSaleItemsByRadius(
    [{ id: 'a', distanceKm: 99 }],
    10,
    { scope: FEED_SCOPE_NATIONAL },
  ).local.length === 1,
);

// Interleave: Alles includes inspiration
const mixed = interleaveSaleInspirationRows({
  sales: [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' }],
  inspiration: [{ id: 'i1' }, { id: 'i2' }],
  stride: FEED_SALE_INSPIRATION_STRIDE,
});
check(
  'interleave inserts inspiration into Alles mix',
  mixed.some((r) => r.row === 'insp') &&
    mixed.filter((r) => r.row === 'sale').length === 5,
);

check(
  'stride constant remains 4',
  FEED_SALE_INSPIRATION_STRIDE === 4 && FEED_SPARSE_LOCAL_SALE_THRESHOLD === 8,
);

check(
  'empty-state location gate remains disabled',
  geo.includes('showNearbyLocationRequired = false'),
);

console.log(`\n${passed} checks passed`);
