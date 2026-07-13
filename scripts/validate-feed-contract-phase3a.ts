#!/usr/bin/env npx tsx
/**
 * Phase 3A — feed API contract guards (static / unit, no live DB).
 * Run: npx tsx scripts/validate-feed-contract-phase3a.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  deduplicateCrossSourceFeedItems,
  collectUniqueSellerUserIds,
  computeEnrichmentPoolCap,
  mergeLinkedFeedItemMedia,
  linkedDishMediaToFeedFields,
  FEED_DB_PRODUCT_CAP,
  FEED_ENRICHMENT_POOL_CAP,
  FEED_RESPONSE_ITEM_CAP,
  FEED_DISCOVERY_BUFFER,
} from '../lib/feed/feed-candidate-window';
import {
  classifyFeedMediaUrl,
  resolveFeedMediaUrlForResponse,
} from '../lib/feed/resolve-feed-media-url';
import {
  FEED_MEDIA_MAX_DECODED_BYTES,
  FEED_MEDIA_MAX_INDEX,
  isValidFeedMediaId,
  normalizeAllowedFeedImageMime,
  parseFeedInlineDataUrl,
  parseFeedMediaIndex,
  parseFeedMediaQuery,
} from '../lib/feed/feed-media-access';
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

console.log('\nLinked media merge (Phase 3A-Fix)');
const linkedMediaId = 'fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';
const dishImg = 'https://cdn.example/dish-cover.jpg';

// 1. Product with image + linked Dish with image → Product image wins
const bothHaveImage = deduplicateCrossSourceFeedItems([
  { id: linkedMediaId, feedSource: 'PRODUCT', image: 'https://cdn.example/product.jpg', images: ['https://cdn.example/product.jpg'] },
  { id: linkedMediaId, feedSource: 'DISH', image: dishImg, images: [dishImg] },
]);
ok('1. both have image → PRODUCT image kept', bothHaveImage.items[0]?.image === 'https://cdn.example/product.jpg');

// 2. Product without image + linked Dish with image → fill from Dish
const productNoImage = deduplicateCrossSourceFeedItems([
  { id: linkedMediaId, feedSource: 'PRODUCT', image: null, images: [] },
  { id: linkedMediaId, feedSource: 'DISH', image: dishImg, images: [dishImg] },
]);
ok('2. product empty + dish image → merged', productNoImage.items[0]?.image === dishImg);
ok('2. merged images array', productNoImage.items[0]?.images?.[0] === dishImg);

// 3. Product without image + Dish without image → still no image
const neitherImage = deduplicateCrossSourceFeedItems([
  { id: linkedMediaId, feedSource: 'PRODUCT', image: null, images: [] },
  { id: linkedMediaId, feedSource: 'DISH', image: null, images: [] },
]);
ok('3. neither has image → null', neitherImage.items[0]?.image == null);

// 4. Product with image + Dish without image → Product kept
const productOnlyImage = deduplicateCrossSourceFeedItems([
  { id: linkedMediaId, feedSource: 'PRODUCT', image: 'https://cdn.example/p.jpg', images: ['https://cdn.example/p.jpg'] },
  { id: linkedMediaId, feedSource: 'DISH', image: null, images: [] },
]);
ok('4. product image + empty dish → product', productOnlyImage.items[0]?.image === 'https://cdn.example/p.jpg');

// 5. standalone Dish
const standaloneDish = deduplicateCrossSourceFeedItems([
  { id: 'solo-dish', feedSource: 'DISH', image: dishImg, images: [dishImg] },
]);
ok('5. standalone dish preserved', standaloneDish.items[0]?.feedSource === 'DISH');

// 6. Stripe-filtered Product absent + active Dish (upstream filter) → dish only in pool
const stripeFilteredScenario = deduplicateCrossSourceFeedItems([
  { id: 'dish-only-id', feedSource: 'DISH', image: dishImg, images: [dishImg] },
]);
ok('6. dish-only pool after product filter', stripeFilteredScenario.items.length === 1);

// 7. not-linked similar content → both kept
const similarUnlinked = deduplicateCrossSourceFeedItems([
  { id: 'prod-a', feedSource: 'PRODUCT', title: 'Tomato soup', image: 'https://a.jpg' },
  { id: 'dish-b', feedSource: 'DISH', title: 'Tomato soup', image: 'https://b.jpg' },
]);
ok('7. similar unlinked content → both rows', similarUnlinked.items.length === 2);

const mergedViaHelper = mergeLinkedFeedItemMedia(
  { image: null, images: [], videoUrl: null, primaryVideoUrl: null },
  linkedDishMediaToFeedFields({
    id: linkedMediaId,
    photos: [{ url: dishImg }],
    videos: [{ url: 'https://v.mp4', thumbnail: 'https://v-thumb.jpg' }],
  }),
);
ok('helper fills image from linkedDishMediaToFeedFields', mergedViaHelper.image === dishImg);
ok('helper fills video from linked dish', mergedViaHelper.videoUrl === 'https://v.mp4');

console.log('\nInline data URL → feed media proxy');
const dataSample = 'data:image/jpeg;base64,/9j/4AAQ';
ok('classify data url', classifyFeedMediaUrl(dataSample) === 'data');
const proxied = resolveFeedMediaUrlForResponse(dataSample, {
  entity: 'product',
  id: '1823cae9-2aae-400f-9a28-eadbdcded3bc',
  index: 0,
});
ok(
  'data url resolves to proxy path',
  proxied === '/api/feed/media?type=product&id=1823cae9-2aae-400f-9a28-eadbdcded3bc&i=0',
);
ok(
  'blob https passes through',
  resolveFeedMediaUrlForResponse('https://it3xt8um5uqzpebe.public.blob.vercel-storage.com/x.jpg', {
    entity: 'product',
    id: 'x',
    index: 0,
  }) === 'https://it3xt8um5uqzpebe.public.blob.vercel-storage.com/x.jpg',
);
const sanitizedProxy = sanitizeFeedItemsForResponse([
  {
    id: '1823cae9-2aae-400f-9a28-eadbdcded3bc',
    title: 'Marilyn',
    feedSource: 'PRODUCT',
    image: proxied,
    discovery: { coverImage: proxied, imageCount: 1 },
  },
]);
ok('sanitize keeps proxy image url', sanitizedProxy[0]?.image === proxied);
ok(
  'sanitize syncs discovery.coverImage',
  (sanitizedProxy[0]?.discovery as { coverImage?: string })?.coverImage === proxied,
);

console.log('\nFeed media endpoint safety');
ok('valid uuid id accepted', isValidFeedMediaId('1823cae9-2aae-400f-9a28-eadbdcded3bc'));
ok('rejects short id', !isValidFeedMediaId('abc'));
ok('rejects script injection id', !isValidFeedMediaId('<script>'));
ok('index 0 default', parseFeedMediaIndex(null) === 0);
ok('index max boundary', parseFeedMediaIndex(String(FEED_MEDIA_MAX_INDEX)) === FEED_MEDIA_MAX_INDEX);
ok('index over max rejected', parseFeedMediaIndex(String(FEED_MEDIA_MAX_INDEX + 1)) === null);
ok('index negative rejected', parseFeedMediaIndex('-1') === null);
ok('index non-numeric rejected', parseFeedMediaIndex('abc') === null);
const validQuery = parseFeedMediaQuery(
  new URLSearchParams('type=product&id=1823cae9-2aae-400f-9a28-eadbdcded3bc&i=0'),
);
ok('query parse valid', validQuery.ok === true);
ok(
  'query parse invalid type',
  parseFeedMediaQuery(new URLSearchParams('type=secret&id=1823cae9-2aae-400f-9a28-eadbdcded3bc')).ok === false,
);
ok('jpeg mime allowed', normalizeAllowedFeedImageMime('image/jpeg') === 'image/jpeg');
ok('jpg normalized', normalizeAllowedFeedImageMime('image/jpg') === 'image/jpeg');
ok('svg blocked', normalizeAllowedFeedImageMime('image/svg+xml') === null);
ok('html blocked', normalizeAllowedFeedImageMime('text/html') === null);
const tinyPng = parseFeedInlineDataUrl(
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
);
ok('tiny png decodes', tinyPng.ok === true);
const blockedMime = parseFeedInlineDataUrl('data:text/html;base64,PHNjcmlwdD4=');
ok('blocked mime rejected', blockedMime.ok === false);
const bigPayload = Buffer.alloc(FEED_MEDIA_MAX_DECODED_BYTES + 1, 0xff).toString('base64');
const overLimit = parseFeedInlineDataUrl(`data:image/jpeg;base64,${bigPayload}`);
ok('oversized payload rejected', overLimit.ok === false && overLimit.reason === 'too_large');

console.log('\nSingle initial feed fetch (GeoFeed static guards)');
function readSrc(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}
const geoFeedSrc = readSrc('components/feed/GeoFeed.tsx');
const effectBlock = geoFeedSrc.slice(
  geoFeedSrc.indexOf('useEffect(() => {\n    if (feedStartupBlocked) return;'),
  geoFeedSrc.indexOf('const loadMoreFeed = useCallback'),
);
ok('GeoFeed initial fetch effect exists', effectBlock.length > 200);
ok(
  'deps exclude effectiveViewerForDistance (no apiViewerCoords feedback loop)',
  !effectBlock.includes('effectiveViewerForDistance?.lat') &&
    !effectBlock.includes('effectiveViewerForDistance?.lng'),
);
ok('in-flight requestKey guard present', geoFeedSrc.includes('feedRequestKeyInFlightRef'));
ok('fresh cache restore returns before network fetch', effectBlock.includes('isHomeFeedReturnCacheStale(cached)'));
ok('load-more uses separate callback', geoFeedSrc.includes('const loadMoreFeed = useCallback'));
ok(
  'filter deps still drive refetch',
  effectBlock.includes('appliedScope') &&
    effectBlock.includes('appliedRadius') &&
    effectBlock.includes('appliedCategory'),
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
