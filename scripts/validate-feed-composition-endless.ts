#!/usr/bin/env npx tsx
/**
 * Unified feed composition + endless scroll / recirculation contract.
 * Includes deterministic 0 / 1 / 2 / 3+ inventory continuation tests.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  FEED_FILTER_COMPATIBILITY,
  FEED_RECIRC_MIN_SEED,
  FEED_SALE_INSPIRATION_STRIDE,
  buildRecirculationBatch,
  inspirationEligibleForFeedScope,
  interleaveSaleInspirationRows,
  resolveInventoryContinuationMode,
} from '../lib/feed/feed-composition-policy';
import {
  FEED_BROADENED_ZERO_UNIQUE_HANDOFF,
  composedFeedCanContinue,
  createFeedCompositionState,
  markBroadenedPageResult,
  markMarketplacePageResult,
  recordDisplayedSeeds,
  resetFeedCompositionState,
  shouldActivateRecirculation,
  shouldFetchBroadenedDiscovery,
} from '../lib/feed/feed-composition-state';
import { FEED_LAYOUT_MODE_DEFAULT, readFeedLayoutMode } from '../lib/feed/feedLayoutPreference';

/** Exact exhaust → broadened → (optional) recirculation when widened inventory ends. */
function exhaustToRecirculation(
  st: ReturnType<typeof createFeedCompositionState>,
) {
  let next = markMarketplacePageResult(st, {
    fetchedCount: 0,
    apiHasMore: false,
    skipUsed: st.marketplaceSkip,
  });
  if (next.stage === 'empty') return next;
  next = markBroadenedPageResult(next, {
    fetchedCount: 0,
    newUniqueCount: 0,
    apiHasMore: false,
    skipUsed: next.broadenedSkip,
  });
  return next;
}

console.log('=== Feed composition & endless scroll ===\n');

assert.equal(FEED_SALE_INSPIRATION_STRIDE, 4);
assert.equal(FEED_RECIRC_MIN_SEED, 1);
assert.ok(FEED_FILTER_COMPATIBILITY.some((f) => f.filter === 'price min/max'));
assert.equal(
  FEED_FILTER_COMPATIBILITY.find((f) => f.filter === 'price min/max')?.appliesTo,
  'marketplace',
);

const mixed = interleaveSaleInspirationRows({
  sales: ['s1', 's2', 's3', 's4', 's5'],
  inspiration: ['i1', 'i2'],
});
assert.equal(mixed.length, 7);
assert.equal(mixed[4].row, 'insp');
assert.equal(mixed.filter((r) => r.row === 'sale').length, 5);

// --- Geo ---
assert.equal(
  inspirationEligibleForFeedScope({
    scope: 'nearby',
    item: { place: 'Rotterdam' },
    viewer: { lat: 51.91, lng: 4.34 },
    radiusKm: 25,
  }),
  false,
);
assert.equal(
  inspirationEligibleForFeedScope({
    scope: 'nearby',
    item: { lat: 51.92, lng: 4.35, place: 'Vlaardingen' },
    viewer: { lat: 51.91, lng: 4.34 },
    radiusKm: 25,
  }),
  true,
);
assert.equal(
  inspirationEligibleForFeedScope({
    scope: 'national',
    item: { place: 'Sint Maarten' },
  }),
  false,
);
assert.equal(
  inspirationEligibleForFeedScope({
    scope: 'international',
    item: { place: 'Sint Maarten' },
  }),
  true,
);

// --- Inventory continuation modes ---
assert.equal(resolveInventoryContinuationMode(0), 'empty_state');
assert.equal(resolveInventoryContinuationMode(1), 'single_seed_spaced');
assert.equal(resolveInventoryContinuationMode(2), 'pair_alternate');
assert.equal(resolveInventoryContinuationMode(3), 'standard_recirc');
assert.equal(resolveInventoryContinuationMode(10), 'standard_recirc');

// 0 seeds → empty batch + empty terminal
{
  const batch0 = buildRecirculationBatch({
    seeds: [],
    recentIds: [],
    lastDisplayedId: null,
    take: 8,
  });
  assert.equal(batch0.length, 0);
  let st = createFeedCompositionState('k0');
  st = markMarketplacePageResult(st, {
    fetchedCount: 0,
    apiHasMore: false,
    skipUsed: 0,
  });
  assert.equal(st.emptyTerminal, true);
  assert.equal(st.stage, 'empty');
  assert.equal(composedFeedCanContinue(st), false);
}

// 1 seed → one card per batch; sentinel continues; never hard-stop
{
  const seed = [{ id: 'solo', kind: 'sale' as const }];
  const b1 = buildRecirculationBatch({
    seeds: seed,
    recentIds: ['solo'],
    lastDisplayedId: 'solo',
    take: 8,
  });
  assert.equal(b1.length, 1);
  assert.equal(b1[0].id, 'solo');
  const b2 = buildRecirculationBatch({
    seeds: seed,
    recentIds: ['solo', 'solo'],
    lastDisplayedId: 'solo',
    take: 8,
    batchIndex: 1,
  });
  assert.equal(b2.length, 1);
  let st = createFeedCompositionState('k1');
  st = recordDisplayedSeeds(st, seed);
  st = exhaustToRecirculation(st);
  assert.equal(st.recirculationActive, true);
  assert.equal(st.emptyTerminal, false);
  assert.equal(composedFeedCanContinue(st), true);
}

// 2 seeds → alternate; no consecutive duplicate; flip across batches
{
  const seeds = [
    { id: 'a', kind: 'sale' as const },
    { id: 'b', kind: 'insp' as const },
  ];
  const even = buildRecirculationBatch({
    seeds,
    recentIds: [],
    lastDisplayedId: null,
    batchIndex: 0,
  });
  const odd = buildRecirculationBatch({
    seeds,
    recentIds: even.map((x) => x.id),
    lastDisplayedId: even[0]?.id ?? null,
    batchIndex: 1,
  });
  assert.equal(even.length, 1);
  assert.equal(odd.length, 1);
  assert.notEqual(even[0].id, odd[0].id, 'pair mode alternates across batches');
  // Simulate a longer chain — never consecutive
  let last: string | null = null;
  for (let i = 0; i < 6; i++) {
    const b = buildRecirculationBatch({
      seeds,
      recentIds: [],
      lastDisplayedId: last,
      batchIndex: i,
    });
    assert.equal(b.length, 1);
    assert.notEqual(b[0].id, last);
    last = b[0].id;
  }
  let st = createFeedCompositionState('k2');
  st = recordDisplayedSeeds(st, seeds);
  st = markMarketplacePageResult(st, {
    fetchedCount: 0,
    apiHasMore: false,
    skipUsed: 2,
  });
  assert.equal(composedFeedCanContinue(st), true);
}

// 3+ → spacing / no consecutive
{
  const seeds = [
    { id: 'a', kind: 'sale' as const },
    { id: 'b', kind: 'insp' as const },
    { id: 'c', kind: 'sale' as const },
  ];
  const batch = buildRecirculationBatch({
    seeds,
    recentIds: ['a', 'b', 'c'],
    lastDisplayedId: 'c',
    take: 6,
    minSpacing: 2,
  });
  assert.ok(batch.length >= 3);
  for (let i = 1; i < batch.length; i++) {
    assert.notEqual(batch[i].id, batch[i - 1].id, 'no consecutive duplicate');
  }
  let st = createFeedCompositionState('k3');
  st = recordDisplayedSeeds(st, seeds);
  st = exhaustToRecirculation(st);
  assert.equal(st.marketplaceExhausted, true);
  assert.equal(st.broadenedExhausted, true);
  assert.equal(st.recirculationActive, true);
  assert.equal(st.stage, 'recirculation');
  assert.equal(composedFeedCanContinue(st), true);
}

const reset = resetFeedCompositionState(
  createFeedCompositionState('k1'),
  'k2',
);
assert.equal(reset.requestKey, 'k2');
assert.equal(reset.recirculationActive, false);

// Zero-unique broadened pages advance skip, then hand off to recirculation.
{
  let st = createFeedCompositionState('k-zero');
  st = recordDisplayedSeeds(st, [
    { id: 'a', kind: 'sale' },
    { id: 'b', kind: 'sale' },
  ]);
  st = markMarketplacePageResult(st, {
    fetchedCount: 2,
    apiHasMore: false,
    skipUsed: 0,
  });
  assert.equal(st.stage, 'broadened');
  assert.equal(shouldFetchBroadenedDiscovery(st), true);
  st = markBroadenedPageResult(st, {
    fetchedCount: 10,
    newUniqueCount: 0,
    apiHasMore: true,
    skipUsed: 0,
  });
  assert.equal(st.broadenedSkip, 10);
  assert.equal(st.broadenedZeroUniqueStreak, 1);
  assert.equal(st.recirculationActive, false);
  assert.equal(FEED_BROADENED_ZERO_UNIQUE_HANDOFF, 2);
  st = markBroadenedPageResult(st, {
    fetchedCount: 10,
    newUniqueCount: 0,
    apiHasMore: true,
    skipUsed: 10,
  });
  assert.equal(st.broadenedSkip, 20);
  assert.equal(st.broadenedExhausted, true);
  assert.equal(st.recirculationActive, true);
  assert.equal(st.stage, 'recirculation');
  assert.equal(shouldActivateRecirculation(st), true);
  assert.equal(composedFeedCanContinue(st), true);
}

assert.equal(FEED_LAYOUT_MODE_DEFAULT, 'cards');
assert.equal(readFeedLayoutMode(), 'cards');

const geo = readFileSync('components/feed/GeoFeed.tsx', 'utf8');
assert(geo.includes('inspirationEligibleForFeedScope'), 'GeoFeed geo insp');
assert(geo.includes('buildRecirculationBatch'), 'GeoFeed recirculation');
assert(geo.includes('composedFeedCanContinue'), 'GeoFeed continuation gate');
assert(geo.includes('emptyTerminal'), 'GeoFeed empty terminal');
assert(geo.includes('shouldActivateRecirculation'), 'GeoFeed recirc handoff');
assert(geo.includes('resolveFeedIntersectionRoot'), 'GeoFeed nested scroll root');

const route = readFileSync('app/api/feed/route.ts', 'utf8');
assert(route.includes('nearbyNeedsLocation'), 'geo nearby guard intact');
assert(
  route.includes('softNationalFallback') &&
    route.includes('Never empty the marketplace'),
  'nearby without location soft-falls to national (never empty pool)',
);
assert(
  route.includes('FEED_RADIUS_MODE_LOCAL_FIRST') &&
    !route.includes('FEED_RADIUS_MODE_STRICT_LOCAL'),
  'nearby progressive local-first (not strict local-only)',
);
assert(route.includes('isEligibleForNationalFeedScope'), 'national filter intact');
assert(
  geo.includes('resolveInspirationCompositionScope') &&
    geo.includes('composeProgressiveNearbySalePool'),
  'GeoFeed mixed Alles progressive composition wired',
);
console.log('  ✅ mix stride + filter matrix');
console.log('  ✅ inspiration geo eligibility');
console.log('  ✅ inventory 0 / 1 / 2 / 3+ continuation');
console.log('  ✅ recirculation spacing + empty terminal');
console.log('\n=== Result: feed composition checks passed ===\n');
