#!/usr/bin/env npx tsx
/**
 * Feed predictive prefetch contract — bounded cache + adaptive distance.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  FEED_PREFETCH_MAX_BATCHES,
  FEED_NEAR_END_LOAD_MORE_MIN_PX,
  FEED_NEAR_END_LOAD_MORE_MAX_PX,
  FeedPrefetchCache,
  buildPrefetchObserverRootMargin,
  computeNearEndLoadMoreThresholdPx,
  computePrefetchRootMarginPx,
} from '../lib/feed/feed-prefetch-cache';

console.log('=== Feed prefetch smooth scroll ===\n');

assert.equal(FEED_PREFETCH_MAX_BATCHES, 2);

const cache = new FeedPrefetchCache<{ id: string }>();
cache.setRequestKey('scope=national&take=10&skip=0');

assert.equal(cache.canPrefetchMore(), true);
cache.markInFlight('scope=national&take=10&skip=0', 10);
assert.equal(cache.hasInFlight('scope=national&take=10&skip=0', 10), true);

cache.put({
  requestKey: 'scope=national&take=10&skip=0',
  skip: 10,
  items: [{ id: 'a' }, { id: 'b' }],
  apiHasMore: true,
  preparedAt: Date.now(),
  source: 'network',
});
assert.equal(cache.preparedCount(), 1);
assert.equal(cache.diag.prefetchCompleted, 1);

const hit = cache.take('scope=national&take=10&skip=0', 10);
assert.ok(hit);
assert.equal(hit!.items.length, 2);
assert.equal(cache.diag.cacheHit, 1);
assert.equal(cache.diag.prefetchUsed, 1);

const miss = cache.take('scope=national&take=10&skip=0', 20);
assert.equal(miss, null);
assert.equal(cache.diag.cacheMiss, 1);

// Cap at 2 batches
cache.put({
  requestKey: 'scope=national&take=10&skip=0',
  skip: 20,
  items: [{ id: 'c' }],
  apiHasMore: true,
  preparedAt: Date.now(),
  source: 'network',
});
cache.put({
  requestKey: 'scope=national&take=10&skip=0',
  skip: 30,
  items: [{ id: 'd' }],
  apiHasMore: false,
  preparedAt: Date.now(),
  source: 'network',
});
cache.put({
  requestKey: 'scope=national&take=10&skip=0',
  skip: 40,
  items: [{ id: 'e' }],
  apiHasMore: false,
  preparedAt: Date.now(),
  source: 'network',
});
assert.ok(cache.preparedCount() <= FEED_PREFETCH_MAX_BATCHES);

// Request key change discards
cache.setRequestKey('scope=nearby&take=10&skip=0');
assert.equal(cache.preparedCount(), 0);
assert.ok(cache.diag.prefetchDiscarded >= 1);

const margin = computePrefetchRootMarginPx({
  viewportHeight: 800,
  scrollVelocityPxPerMs: 0.2,
  downlinkMbps: 5,
});
assert.ok(margin >= 640 && margin <= 3200);
assert.equal(buildPrefetchObserverRootMargin(1600), '1600px 0px');

const fast = computePrefetchRootMarginPx({
  viewportHeight: 800,
  scrollVelocityPxPerMs: 2.0,
});
const slow = computePrefetchRootMarginPx({
  viewportHeight: 800,
  scrollVelocityPxPerMs: 0.05,
});
assert.ok(fast >= slow, 'fast scroll prefetches earlier (larger margin)');

// Near-end loadMore threshold (natural-scroll continuation) — viewport-aware.
const nearMobile = computeNearEndLoadMoreThresholdPx({ viewportHeight: 844 });
const nearDesktop = computeNearEndLoadMoreThresholdPx({ viewportHeight: 594 });
assert.ok(nearMobile >= FEED_NEAR_END_LOAD_MORE_MIN_PX);
assert.ok(nearDesktop >= FEED_NEAR_END_LOAD_MORE_MIN_PX);
assert.ok(nearMobile <= FEED_NEAR_END_LOAD_MORE_MAX_PX);
assert.ok(nearMobile > nearDesktop, 'taller viewport → earlier near-end invite');
assert.ok(nearDesktop > 480, 'must exceed legacy fixed 480px margin');
assert.ok(nearDesktop > 640, 'must exceed legacy fixed 640px desktop fallback');
assert.equal(
  computeNearEndLoadMoreThresholdPx({ viewportHeight: 844 }),
  Math.min(9_000, Math.max(900, Math.round(844 * 3))),
);
const tall = computeNearEndLoadMoreThresholdPx({
  viewportHeight: 844,
  scrollHeight: 30_000,
});
assert.ok(
  tall >= Math.round(30_000 * 0.25),
  'tall feed boosts near-end threshold from content height',
);
assert.ok(tall <= 9_000);

const geo = readFileSync('components/feed/GeoFeed.tsx', 'utf8');
assert(geo.includes('FeedPrefetchCache') || geo.includes('feed-prefetch-cache'), 'GeoFeed wires prefetch');
assert(geo.includes('computePrefetchRootMarginPx') || geo.includes('prefetchRootMargin'), 'adaptive rootMargin');
assert(geo.includes('computeNearEndLoadMoreThresholdPx'), 'viewport-aware near-end loadMore');
assert(geo.includes('scheduleIdleWork'), 'idle prefetch after first paint');
assert(
  geo.includes('recirculationBatchIndex >= 2'),
  'idle auto-chain cap retained (no runaway background growth)',
);
assert(
  !geo.includes('const nearMarginPx = 480'),
  'legacy fixed 480px near-end margin removed',
);
assert(geo.includes('prefetchNextMarketplacePage'), 'background marketplace prefetch');
assert(geo.includes('prepareRecirculationIfNeeded'), 'recirculation prep before exhaustion');
assert(geo.includes('early-zone') || geo.includes('prefetchStarted'), 'early prefetch zone');
assert(geo.includes('fromPrefetch'), 'cache-hit append path');

console.log('  ✅ bounded prefetch cache (max 2)');
console.log('  ✅ requestKey invalidation');
console.log('  ✅ adaptive rootMargin');
console.log('\n=== Result: feed prefetch checks passed ===\n');
