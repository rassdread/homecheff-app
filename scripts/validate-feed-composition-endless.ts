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
  composedFeedCanContinue,
  createFeedCompositionState,
  markMarketplacePageResult,
  recordDisplayedSeeds,
  resetFeedCompositionState,
} from '../lib/feed/feed-composition-state';

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
  st = markMarketplacePageResult(st, {
    fetchedCount: 0,
    apiHasMore: false,
    skipUsed: 1,
  });
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
  st = markMarketplacePageResult(st, {
    fetchedCount: 0,
    apiHasMore: false,
    skipUsed: 10,
  });
  assert.equal(st.marketplaceExhausted, true);
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

const geo = readFileSync('components/feed/GeoFeed.tsx', 'utf8');
assert(geo.includes('inspirationEligibleForFeedScope'), 'GeoFeed geo insp');
assert(geo.includes('buildRecirculationBatch'), 'GeoFeed recirculation');
assert(geo.includes('composedFeedCanContinue'), 'GeoFeed continuation gate');
assert(geo.includes('emptyTerminal'), 'GeoFeed empty terminal');

const route = readFileSync('app/api/feed/route.ts', 'utf8');
assert(route.includes('nearbyNeedsLocation'), 'geo nearby guard intact');
assert(
  /if \(nearbyNeedsLocation\) \{\s*sortedPool = \[\];/m.test(route),
  'nearby empty pool intact',
);
assert(route.includes('isEligibleForNationalFeedScope'), 'national filter intact');

console.log('  ✅ mix stride + filter matrix');
console.log('  ✅ inspiration geo eligibility');
console.log('  ✅ inventory 0 / 1 / 2 / 3+ continuation');
console.log('  ✅ recirculation spacing + empty terminal');
console.log('\n=== Result: feed composition checks passed ===\n');
