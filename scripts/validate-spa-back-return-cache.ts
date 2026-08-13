#!/usr/bin/env npx tsx
/**
 * SPA back / return-cache continuation restore contract.
 * Prevents false emptyTerminal after feed → listing → back.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  HOME_FEED_RETURN_CACHE_VERSION,
  clearHomeFeedReturnCache,
  rehydrateHomeFeedContinuation,
  rehydrateLegacyComposition,
  sanitizeRestoredComposition,
  saveHomeFeedReturnCache,
  readHomeFeedReturnCache,
} from '../lib/feed/home-feed-return-cache';
import {
  composedFeedCanContinue,
  createFeedCompositionState,
  markBroadenedPageResult,
  markMarketplacePageResult,
  recordDisplayedSeeds,
} from '../lib/feed/feed-composition-state';

console.log('=== SPA back return-cache continuation ===\n');

clearHomeFeedReturnCache();

const seeds = [
  { id: 'a', kind: 'sale' as const },
  { id: 'b', kind: 'sale' as const },
  { id: 'c', kind: 'insp' as const },
];

function deepRecircState(requestKey: string) {
  let st = createFeedCompositionState(requestKey);
  st = recordDisplayedSeeds(st, seeds);
  for (let i = 0; i < 20; i++) {
    st = recordDisplayedSeeds(st, seeds);
  }
  st = markMarketplacePageResult(st, {
    fetchedCount: 26,
    apiHasMore: false,
    skipUsed: 0,
  });
  st = markBroadenedPageResult(st, {
    fetchedCount: 0,
    newUniqueCount: 0,
    apiHasMore: false,
    skipUsed: 0,
  });
  return {
    ...st,
    recirculationActive: true,
    stage: 'recirculation' as const,
    recirculationBatchIndex: 12,
    recirculatedCount: 96,
  };
}

const requestKey =
  'radius=25&scope=nearby&locationMode=point&countryCode=NL&lat=51.9088&lng=4.3444&take=10';

// --- sanitize: never emptyTerminal with visible items ---
{
  const bad = {
    ...createFeedCompositionState(requestKey),
    emptyTerminal: true,
    uniqueEligibleCount: 0,
    stage: 'empty' as const,
  };
  const fixed = sanitizeRestoredComposition(bad, requestKey, 36);
  assert.equal(fixed.emptyTerminal, false);
}

// --- v2 rehydrate preserves continuation ---
{
  const composition = deepRecircState(requestKey);
  const items = seeds.map((s) => ({ id: s.id }));
  const restored = rehydrateHomeFeedContinuation({
    requestKey,
    itemSeeds: seeds,
    firstPageTake: 10,
    payload: {
      version: HOME_FEED_RETURN_CACHE_VERSION,
      requestKey,
      items,
      inspiratiePool: [],
      apiViewerCoords: null,
      nativeFeedRenderMore: false,
      discoveryFeed: null,
      feedHasMore: true,
      composition,
      recirculatedRows: [{ row: 'sale', item: { id: 'a' } }],
      scroll: { root: 'desktop', top: 1200 },
      savedAt: Date.now(),
    },
  });
  assert.equal(restored.composition.requestKey, requestKey);
  assert.equal(restored.composition.stage, 'recirculation');
  assert.equal(restored.composition.recirculationActive, true);
  assert.equal(restored.composition.marketplaceExhausted, true);
  assert.equal(restored.composition.broadenedExhausted, true);
  assert.equal(restored.composition.emptyTerminal, false);
  assert.ok(restored.composition.uniqueEligibleCount >= 3);
  assert.equal(restored.composition.recirculationBatchIndex, 12);
  assert.equal(restored.feedHasMore, true);
  assert.equal(restored.skipBackgroundRefresh, true);
  assert.equal(restored.recirculatedRows.length, 1);
  assert.equal(restored.scroll?.top, 1200);
  assert.equal(composedFeedCanContinue(restored.composition), true);
}

// --- Proven bug path must be impossible: items present + unique 0 ---
{
  const manySeeds = Array.from({ length: 36 }, (_, i) => ({
    id: `x${i}`,
    kind: 'sale' as const,
  }));
  const restored = rehydrateHomeFeedContinuation({
    requestKey,
    itemSeeds: manySeeds,
    firstPageTake: 10,
    payload: {
      version: HOME_FEED_RETURN_CACHE_VERSION,
      requestKey,
      items: manySeeds.map((s) => ({ id: s.id })),
      inspiratiePool: [],
      apiViewerCoords: null,
      nativeFeedRenderMore: false,
      discoveryFeed: null,
      feedHasMore: true,
      composition: {
        ...createFeedCompositionState(''),
        requestKey: '',
        uniqueEligibleCount: 0,
        displayedHistory: [],
        recentIds: [],
        emptyTerminal: false,
        stage: 'exact',
      },
      recirculatedRows: [],
      savedAt: Date.now(),
    },
  });
  assert.equal(restored.composition.requestKey, requestKey);
  assert.ok(restored.composition.uniqueEligibleCount >= 1);
  assert.equal(restored.composition.emptyTerminal, false);
  const afterEmpty = markMarketplacePageResult(restored.composition, {
    fetchedCount: 0,
    apiHasMore: false,
    skipUsed: 36,
  });
  assert.equal(afterEmpty.emptyTerminal, false);
  assert.ok(composedFeedCanContinue(afterEmpty));
}

// --- Legacy deep session → recirculation, not marketplace-open ---
{
  const many = Array.from({ length: 26 }, (_, i) => ({
    id: `m${i}`,
    kind: 'sale' as const,
  }));
  const legacy = rehydrateLegacyComposition({
    requestKey,
    itemSeeds: many,
    feedHasMore: true,
    firstPageTake: 10,
  });
  assert.equal(legacy.marketplaceExhausted, true);
  assert.equal(legacy.stage, 'recirculation');
  assert.equal(legacy.recirculationActive, true);
  assert.ok(legacy.uniqueEligibleCount >= 26);
  assert.equal(composedFeedCanContinue(legacy), true);
}

// --- Legacy short page stays non-terminal ---
{
  const legacy = rehydrateLegacyComposition({
    requestKey,
    itemSeeds: seeds,
    feedHasMore: true,
    firstPageTake: 10,
  });
  assert.ok(legacy.uniqueEligibleCount >= 3);
  assert.equal(legacy.emptyTerminal, false);
}

// --- Cache round-trip version + key isolation ---
{
  clearHomeFeedReturnCache();
  const composition = deepRecircState(requestKey);
  saveHomeFeedReturnCache({
    version: HOME_FEED_RETURN_CACHE_VERSION,
    requestKey,
    items: [{ id: 'a' }],
    inspiratiePool: [],
    apiViewerCoords: null,
    nativeFeedRenderMore: false,
    discoveryFeed: null,
    feedHasMore: true,
    composition,
    recirculatedRows: [{ row: 'sale', item: { id: 'a' } }],
    scroll: { root: 'viewport', top: 400 },
  });
  const hit = readHomeFeedReturnCache(requestKey);
  assert.ok(hit);
  assert.equal(hit.version, HOME_FEED_RETURN_CACHE_VERSION);
  assert.ok(hit.composition);
  assert.equal(readHomeFeedReturnCache('scope=national&take=10'), null);
  clearHomeFeedReturnCache();
}

// --- Static wiring in GeoFeed ---
{
  const geo = readFileSync('components/feed/GeoFeed.tsx', 'utf8');
  const cache = readFileSync('lib/feed/home-feed-return-cache.ts', 'utf8');
  assert.ok(cache.includes('HOME_FEED_RETURN_CACHE_VERSION'));
  assert.ok(cache.includes('rehydrateHomeFeedContinuation'));
  assert.ok(geo.includes('rehydrateHomeFeedContinuation'));
  assert.ok(geo.includes('HOME_FEED_RETURN_CACHE_VERSION'));
  assert.ok(geo.includes('recirculatedRowsRef'));
  assert.ok(geo.includes('pendingReturnScrollRef'));
  assert.ok(geo.includes('skipBackgroundRefresh'));
  assert.ok(
    geo.includes('feedRequestKeyInFlightRef.current === requestKey && !cached'),
  );
}

console.log('OK — SPA back return-cache continuation contract\n');
