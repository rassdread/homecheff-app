#!/usr/bin/env npx tsx
/**
 * Filter transition UX — no false zero-results while searching.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  FEED_RESULT_PHASE,
  isFilterSearchingPhase,
  isZeroResultsEligible,
} from '../lib/feed/feed-filter-transition';
import {
  FEED_FILTER_RESULT_CACHE_MAX,
  FeedFilterResultCache,
} from '../lib/feed/feed-filter-result-cache';

console.log('=== Feed filter transition UX ===\n');

assert.equal(isFilterSearchingPhase(FEED_RESULT_PHASE.SEARCHING), true);
assert.equal(isFilterSearchingPhase(FEED_RESULT_PHASE.RESULTS_READY), false);

assert.equal(
  isZeroResultsEligible({
    phase: FEED_RESULT_PHASE.SEARCHING,
    loading: false,
    feedRefreshing: true,
    feedHydrated: true,
    nearbyNeedsLocation: false,
    requestInFlight: true,
    resultCount: 0,
  }),
  false,
  'must not show zero while searching',
);

assert.equal(
  isZeroResultsEligible({
    phase: FEED_RESULT_PHASE.ZERO_RESULTS_CONFIRMED,
    loading: false,
    feedRefreshing: false,
    feedHydrated: true,
    nearbyNeedsLocation: false,
    requestInFlight: false,
    resultCount: 0,
  }),
  true,
  'confirmed zero after settle',
);

assert.equal(
  isZeroResultsEligible({
    phase: FEED_RESULT_PHASE.RESULTS_READY,
    loading: false,
    feedRefreshing: false,
    feedHydrated: true,
    nearbyNeedsLocation: true,
    requestInFlight: false,
    resultCount: 0,
  }),
  false,
  'nearby without location uses Locatie nodig',
);

const cache = new FeedFilterResultCache<{ id: string }>();
cache.put({
  requestKey: 'scope=national&take=10',
  items: [{ id: 'a' }],
  inspiratiePool: [],
  discoveryFeed: null,
  apiViewerCoords: null,
  feedHasMore: true,
});
cache.put({
  requestKey: 'scope=national&vertical=cheff&take=10',
  items: [{ id: 'b' }],
  inspiratiePool: [],
  discoveryFeed: null,
  apiViewerCoords: null,
  feedHasMore: true,
});
assert.ok(cache.get('scope=national&take=10'));
assert.ok(cache.get('scope=national&vertical=cheff&take=10'));
cache.put({
  requestKey: 'scope=nearby&take=10',
  items: [{ id: 'c' }],
  inspiratiePool: [],
  discoveryFeed: null,
  apiViewerCoords: null,
  feedHasMore: false,
});
assert.equal(
  cache.get('scope=nearby&take=10'),
  null,
  'nearby without lat/place must not cache',
);
assert.ok(cache.size() <= FEED_FILTER_RESULT_CACHE_MAX);

const geo = readFileSync('components/feed/GeoFeed.tsx', 'utf8');
assert(geo.includes('isZeroResultsEligible'), 'GeoFeed gates empty on phase');
assert(geo.includes('pauseClientRefineDuringApiTransition'), 'SWR retains cards');
assert(geo.includes('feed-filter-searching'), 'searching UX marker');
assert(geo.includes('FeedFilterResultCache'), 'recent filter cache wired');
assert(
  !/handleScopeChange[\s\S]{0,400}setItems\(\[\]\);\s*setDiscoveryFeed/.test(geo),
  'scope change must not clear all scopes immediately',
);

const nl = readFileSync('public/i18n/nl.json', 'utf8');
assert(nl.includes('searchingResults'), 'nl searching copy');
assert(nl.includes('emptyConfirmedTitle'), 'nl confirmed empty copy');

console.log('  ✅ zero-state suppressed while searching');
console.log('  ✅ confirmed zero after settle');
console.log('  ✅ bounded filter result cache');
console.log('  ✅ GeoFeed wiring guards');
console.log('\n=== Result: filter transition checks passed ===\n');
