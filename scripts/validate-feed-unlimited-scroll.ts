#!/usr/bin/env npx tsx
/**
 * Unlimited scroll / deep pagination contract for the marketplace feed.
 * Covers: candidate window scaling, stable nextSkip, hasMore with sourceHitCap,
 * composition cursor advance without false exhaust on empty/deduped pages,
 * filter reset, and no duplicate next-page skip when using marketplaceSkip.
 */
import assert from 'node:assert/strict';

import {
  FEED_DISCOVERY_BUFFER,
  FEED_RESPONSE_HARD_MAX,
  FEED_RESPONSE_ITEM_CAP,
  computeFeedCandidateWindow,
  feedWindowRelativeSkip,
} from '../lib/feed/feed-candidate-window';
import {
  FEED_FIRST_PAGE_TAKE,
  buildFeedPaginationMeta,
  normalizeFeedPaginationMeta,
} from '../lib/feed/feed-pagination';
import {
  composedFeedCanContinue,
  createFeedCompositionState,
  markMarketplacePageResult,
  recordDisplayedSeeds,
  resetFeedCompositionState,
} from '../lib/feed/feed-composition-state';

console.log('=== Feed unlimited scroll ===\n');

// --- Window scales past soft response cap ---
const page1 = computeFeedCandidateWindow(0, FEED_FIRST_PAGE_TAKE);
assert.equal(page1.dbSkip, 0);
assert.ok(page1.responseItemCap >= FEED_RESPONSE_ITEM_CAP);
assert.equal(page1.responseItemCap, FEED_FIRST_PAGE_TAKE + FEED_DISCOVERY_BUFFER);

const deep = computeFeedCandidateWindow(40, 10);
assert.equal(deep.dbSkip, 0);
assert.ok(deep.responseItemCap > FEED_RESPONSE_ITEM_CAP);
assert.ok(deep.responseItemCap >= 40 + 10 + FEED_DISCOVERY_BUFFER);
assert.ok(deep.responseItemCap <= FEED_RESPONSE_HARD_MAX);

const slide = computeFeedCandidateWindow(FEED_RESPONSE_HARD_MAX, 10);
assert.ok(slide.dbSkip > 0, 'deep pages slide DB window');
assert.equal(feedWindowRelativeSkip(slide), FEED_RESPONSE_HARD_MAX - slide.dbSkip);

// --- Pagination meta ---
const mid = buildFeedPaginationMeta(10, 10, 34, { pageCount: 10 });
assert.equal(mid.hasMore, true);
assert.equal(mid.nextSkip, 20);

const end = buildFeedPaginationMeta(10, 30, 34, { pageCount: 4 });
assert.equal(end.hasMore, false);
assert.equal(end.nextSkip, 34);

const capped = buildFeedPaginationMeta(10, 30, 34, {
  pageCount: 4,
  sourceHitCap: true,
});
assert.equal(capped.hasMore, true, 'sourceHitCap must not false-end inventory');
assert.equal(capped.nextSkip, 34);

const legacyCached = normalizeFeedPaginationMeta(
  { take: 10, skip: 0, total: 34, hasMore: true },
  10,
);
assert.equal(legacyCached.nextSkip, 10, 'legacy cache payloads get nextSkip');


// --- Unique items across simulated pages using nextSkip ---
const pool = Array.from({ length: 55 }, (_, i) => `id-${i}`);
const seen = new Set<string>();
let skip = 0;
let batches = 0;
while (batches < 10) {
  const total = Math.min(pool.length, Math.max(FEED_RESPONSE_ITEM_CAP, skip + 10 + FEED_DISCOVERY_BUFFER));
  const window = pool.slice(0, total);
  const page = window.slice(skip, skip + 10);
  const meta = buildFeedPaginationMeta(10, skip, window.length, {
    pageCount: page.length,
    sourceHitCap: window.length >= skip + 10 + FEED_DISCOVERY_BUFFER && pool.length > window.length,
  });
  for (const id of page) {
    assert.equal(seen.has(id), false, `duplicate ${id} at skip=${skip}`);
    seen.add(id);
  }
  batches += 1;
  if (!meta.hasMore) break;
  skip = meta.nextSkip;
}
assert.equal(seen.size, pool.length, 'must reach full unique inventory');
assert.equal(batches >= 6, true, 'multiple batches required');

// --- Composition: empty page with apiHasMore does not false-exhaust ---
let comp = createFeedCompositionState('k1');
comp = recordDisplayedSeeds(comp, [{ id: 'a', kind: 'sale' }]);
comp = markMarketplacePageResult(comp, {
  fetchedCount: 0,
  apiHasMore: true,
  skipUsed: 10,
  advanceBy: 10,
});
assert.equal(comp.marketplaceExhausted, false);
assert.equal(comp.marketplaceSkip, 20);
assert.equal(composedFeedCanContinue(comp), true);

comp = markMarketplacePageResult(comp, {
  fetchedCount: 0,
  apiHasMore: false,
  skipUsed: 20,
});
assert.equal(comp.marketplaceExhausted, true);
assert.equal(comp.exactExhausted, true);

// --- Filter reset clears skip cursor ---
const reset = resetFeedCompositionState(comp, 'k2');
assert.equal(reset.marketplaceSkip, 0);
assert.equal(reset.marketplaceExhausted, false);
assert.equal(reset.requestKey, 'k2');
assert.ok(reset.generation > comp.generation);

// --- No duplicate next-page requests when using marketplaceSkip (not items.length) ---
const skipsRequested: number[] = [];
let marketplaceSkip = 0;
const itemsLength = 10; // client list lagged due to dedupe
for (let i = 0; i < 3; i++) {
  const requestSkip = Math.max(marketplaceSkip, itemsLength);
  skipsRequested.push(requestSkip);
  const pageCount = 10;
  marketplaceSkip = requestSkip + pageCount;
}
assert.deepEqual(skipsRequested, [10, 20, 30]);
assert.notDeepEqual(
  skipsRequested,
  [10, 10, 10],
  'items.length alone would re-request the same skip',
);

console.log('OK — unlimited scroll pagination + cursor contracts hold\n');
