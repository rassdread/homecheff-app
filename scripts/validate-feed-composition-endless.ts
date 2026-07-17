#!/usr/bin/env npx tsx
/**
 * Unified feed composition + endless scroll / recirculation contract.
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

// Nearby: no coords → excluded
assert.equal(
  inspirationEligibleForFeedScope({
    scope: 'nearby',
    item: { place: 'Rotterdam' },
    viewer: { lat: 51.91, lng: 4.34 },
    radiusKm: 25,
  }),
  false,
  'Nearby inspiration without coords excluded',
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
    scope: 'nearby',
    item: { lat: 18.04, lng: -63.05, place: 'Sint Maarten' },
    viewer: { lat: 51.91, lng: 4.34 },
    radiusKm: 25,
  }),
  false,
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
    scope: 'national',
    item: { place: 'Berkel en Rodenrijs' },
  }),
  true,
);

assert.equal(
  inspirationEligibleForFeedScope({
    scope: 'international',
    item: { place: 'Sint Maarten' },
  }),
  true,
);

// Recirculation: no consecutive duplicate
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

let state = createFeedCompositionState('k1');
state = recordDisplayedSeeds(state, seeds);
assert.equal(state.uniqueEligibleCount, 3);
state = markMarketplacePageResult(state, {
  fetchedCount: 0,
  apiHasMore: false,
  skipUsed: 10,
});
assert.equal(state.marketplaceExhausted, true);
assert.equal(state.recirculationActive, true);
assert.equal(state.stage, 'recirculation');
assert.equal(composedFeedCanContinue(state), true);
assert.ok(state.uniqueEligibleCount >= FEED_RECIRC_MIN_SEED);

const reset = resetFeedCompositionState(state, 'k2');
assert.equal(reset.requestKey, 'k2');
assert.equal(reset.recirculationActive, false);
assert.equal(reset.generation, state.generation + 1);

const geo = readFileSync('components/feed/GeoFeed.tsx', 'utf8');
assert(
  geo.includes('composedFeedCanContinue') ||
    geo.includes('recirculationActive') ||
    geo.includes('FEED_SALE_INSPIRATION_STRIDE') ||
    geo.includes('inspirationEligibleForFeedScope'),
  'GeoFeed must wire composition policy',
);

console.log('  ✅ mix stride + filter matrix');
console.log('  ✅ inspiration geo eligibility (nearby/national/intl)');
console.log('  ✅ recirculation spacing + continuation gate');
console.log('\n=== Result: feed composition checks passed ===\n');
