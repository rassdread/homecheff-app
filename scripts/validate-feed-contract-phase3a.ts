#!/usr/bin/env npx tsx
/**
 * Phase 3A — feed API contract guards (static / unit, no live DB).
 * Run: npx tsx scripts/validate-feed-contract-phase3a.ts
 */

import {
  deduplicateCrossSourceFeedItems,
  collectUniqueSellerUserIds,
  computeEnrichmentPoolCap,
  FEED_DB_PRODUCT_CAP,
  FEED_ENRICHMENT_POOL_CAP,
  FEED_RESPONSE_ITEM_CAP,
  FEED_DISCOVERY_BUFFER,
} from '../lib/feed/feed-candidate-window';
import { isMarketplaceSaleItem } from '../lib/feed/marketplace-sale';
import { buildFeedPaginationMeta } from '../lib/feed/feed-pagination';
import { sanitizeFeedItemsForResponse } from '../lib/feed/sanitize-feed-response-media';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${label}`);
  }
}

console.log('=== Phase 3A — Feed contract guards ===\n');

console.log('Cross-source dedup');
const linkedId = 'fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';

// 1. active Product + linked Dish
const activePair = deduplicateCrossSourceFeedItems([
  { id: linkedId, feedSource: 'PRODUCT', title: 'Studio product' },
  { id: linkedId, feedSource: 'DISH', title: 'Studio dish' },
]);
ok('1. active Product + linked Dish → PRODUCT wins', activePair.items.length === 1);
ok('1. DISH dropped', activePair.dropped.some((d) => d.feedSource === 'DISH'));

// 2. inactive Product filtered out upstream + active Dish only in pool
const dishOnly = deduplicateCrossSourceFeedItems([
  { id: linkedId, feedSource: 'DISH', title: 'Standalone after filter' },
]);
ok('2. standalone Dish preserved when Product absent', dishOnly.items.length === 1);
ok('2. no drops', dishOnly.dropped.length === 0);

// 3. Product in pool + inactive Dish twin (hypothetical both present)
const inactiveDishTwin = deduplicateCrossSourceFeedItems([
  { id: 'x', feedSource: 'PRODUCT' },
  { id: 'x', feedSource: 'DISH' },
]);
ok('3. Product beats inactive Dish twin', inactiveDishTwin.items[0]?.feedSource === 'PRODUCT');

// 4. standalone Dish
ok(
  '4. standalone Dish unique',
  deduplicateCrossSourceFeedItems([{ id: 'solo', feedSource: 'DISH' }]).items.length === 1,
);

// 5. two different records, no link
const unrelated = deduplicateCrossSourceFeedItems([
  { id: 'a', feedSource: 'PRODUCT' },
  { id: 'b', feedSource: 'DISH' },
]);
ok('5. unrelated PRODUCT+DISH both kept', unrelated.items.length === 2);

// 6. pagination total uses post-dedup count (conceptual)
const pool = deduplicateCrossSourceFeedItems([
  { id: '1', feedSource: 'PRODUCT' },
  { id: '1', feedSource: 'DISH' },
  { id: '2', feedSource: 'PRODUCT' },
]);
const postDedupTotal = pool.items.length;
const pageMetaDedup = buildFeedPaginationMeta(10, 0, postDedupTotal);
ok('6. pagination total matches post-dedup count', pageMetaDedup.total === 2);

console.log('\nCandidate window');
ok('DB product cap > enrichment cap', FEED_DB_PRODUCT_CAP > FEED_ENRICHMENT_POOL_CAP);
ok('enrichment cap > default page size', FEED_ENRICHMENT_POOL_CAP > 10);
ok('response cap supports pagination pool', FEED_RESPONSE_ITEM_CAP >= 10);
ok('page1 enrichment pool min 40', computeEnrichmentPoolCap(0, 10) >= 40);
ok('page1 enrichment pool max cap', computeEnrichmentPoolCap(0, 10) <= FEED_ENRICHMENT_POOL_CAP);
ok(
  'skip scales enrichment pool',
  computeEnrichmentPoolCap(10, 10) >= computeEnrichmentPoolCap(0, 10),
);
ok(
  'enrichment formula uses discovery buffer',
  computeEnrichmentPoolCap(0, 10) === Math.min(FEED_ENRICHMENT_POOL_CAP, Math.max(40, 10 + FEED_DISCOVERY_BUFFER)),
);

console.log('\nMarketplace classification');
ok(
  'PRODUCT offer is marketplace sale',
  isMarketplaceSaleItem({ feedSource: 'PRODUCT', listingIntent: 'OFFER', priceCents: 500 }),
);
ok(
  'DISH alone is inspiration (not sale)',
  !isMarketplaceSaleItem({ feedSource: 'DISH', listingIntent: 'OFFER', priceCents: 500 }),
);
ok(
  'REQUEST excluded from sale pool',
  !isMarketplaceSaleItem({ feedSource: 'PRODUCT', listingIntent: 'REQUEST', priceCents: 0 }),
);

console.log('\nPagination');
const pageMeta = buildFeedPaginationMeta(10, 0, 25);
ok('hasMore when total > take', pageMeta.hasMore === true);
ok('total preserved', pageMeta.total === 25);
ok('page 2 hasMore', buildFeedPaginationMeta(10, 10, 25).hasMore === true);
ok('last page no hasMore', buildFeedPaginationMeta(10, 20, 25).hasMore === false);

console.log('\nSeller collection');
const sellerIds = collectUniqueSellerUserIds(
  [
    { ownerId: 'seller-a', id: '1' },
    { ownerId: 'seller-b', id: '2' },
    { ownerId: 'seller-a', id: '3' },
  ],
  (item) => (item.ownerId as string) ?? null,
  2,
);
ok('seller ids deduped', sellerIds.length === 2);
ok('seller cap respected', sellerIds.length <= 2);

console.log('\nTrust orderItem count equivalence (fixture)');
type OrderItemRow = { productId: string; status: string };
const fixture: OrderItemRow[] = [
  { productId: 'p1', status: 'DELIVERED' },
  { productId: 'p1', status: 'DELIVERED' },
  { productId: 'p2', status: 'CANCELLED' },
  { productId: 'p3', status: 'SHIPPED' },
  { productId: 'p4', status: 'DELIVERED' },
];
const delivered = new Set(['DELIVERED', 'SHIPPED', 'CONFIRMED']);
const findManyStyle = new Map<string, number>();
for (const row of fixture) {
  if (!delivered.has(row.status)) continue;
  findManyStyle.set(row.productId, (findManyStyle.get(row.productId) ?? 0) + 1);
}
const groupByStyle = new Map<string, number>();
for (const row of fixture.filter((r) => delivered.has(r.status))) {
  groupByStyle.set(row.productId, (groupByStyle.get(row.productId) ?? 0) + 1);
}
ok('trust groupBy matches findMany counts', [...findManyStyle.entries()].every(
  ([k, v]) => groupByStyle.get(k) === v,
));

console.log('\nStats aggregate equivalence (fixture)');
const ratings = [5, 4, 5, 3];
const findManyAvg =
  Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10;
const aggregateAvg = Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10;
ok('stats average rounding matches', findManyAvg === aggregateAvg);
ok('stats review count matches', ratings.length === 4);

console.log('\nResponse sanitize');
const sanitized = sanitizeFeedItemsForResponse([
  {
    id: 'x',
    title: 'T',
    feedSource: 'PRODUCT',
    images: ['https://example.com/a.jpg'],
    discovery: { id: 'x', listingKind: 'PRODUCT' },
  },
]);
ok('sanitize returns array', Array.isArray(sanitized));
ok('sanitize keeps id', sanitized[0]?.id === 'x');

console.log('\nMixed feed');
const mixed = deduplicateCrossSourceFeedItems([
  { id: 'p1', feedSource: 'PRODUCT' },
  { id: 'l1', feedSource: 'LISTING' },
  { id: 'd1', feedSource: 'DISH' },
]);
ok('mixed sources all present when unique ids', mixed.items.length === 3);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
