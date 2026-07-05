/**
 * Unit checks for client feed sort & price filter helpers.
 * Run: npx tsx scripts/test-feed-client-sort.ts
 */
import {
  feedItemCategoryEnum,
  feedVerticalSlugToCategoryEnum,
  matchesFeedClientPriceRange,
  sortFeedSaleItems,
  sortDorpspleinProducts,
} from '../lib/feed/feed-client-sort';
import { buildGeoFeedApiParams } from '../lib/feed/feed-query-params';
import { partitionSaleItemsByRadius } from '../lib/geo/feed-radius-filter';
import {
  countMarketplaceSaleItems,
  isMarketplaceSaleItem,
  resolveMarketplacePriceCents,
} from '../lib/feed/marketplace-sale';
import {
  FEED_SCOPE_INTERNATIONAL,
  FEED_SCOPE_NEARBY,
  FEED_SCOPE_NATIONAL,
  migrateHomeFeedPersist,
  normalizeFeedScope,
  scopeDefaultSort,
  scopeFromLegacyPersist,
  scopeUsesFarthestFirstSort,
} from '../lib/feed/feed-scope';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const priced = {
  id: 'a',
  createdAt: '2026-01-01T00:00:00.000Z',
  priceCents: 500,
  orderMethod: 'HOMECHEFF_PAYMENT',
  viewCount: 10,
  distanceKm: 2,
};

const contact = {
  id: 'b',
  createdAt: '2026-01-02T00:00:00.000Z',
  priceCents: 0,
  orderMethod: 'CONTACT',
  viewCount: 100,
  distanceKm: 1,
};

const far = {
  id: 'c',
  createdAt: '2026-01-03T00:00:00.000Z',
  priceCents: 200,
  orderMethod: 'HOMECHEFF_PAYMENT',
  viewCount: 5,
  distanceKm: 40,
};

// Price sort: contact-only last on asc
const priceAsc = sortFeedSaleItems([contact, priced, far], 'price', 'asc');
assert(priceAsc[0].id === 'c', 'cheapest priced first');
assert(priceAsc[priceAsc.length - 1].id === 'b', 'contact-only last on price asc');

// Distance sort: nearest first
const distAsc = sortFeedSaleItems([far, contact, priced], 'distance', 'asc');
assert(distAsc[0].id === 'b', 'nearest first (1 km)');

// Newest desc
const newest = sortFeedSaleItems([priced, contact, far], 'newest', 'desc');
assert(newest[0].id === 'c', 'newest item first');

// Price filter excludes contact-only when min set
assert(
  matchesFeedClientPriceRange(contact, '', ''),
  'contact passes when no price filter'
);
assert(
  !matchesFeedClientPriceRange(contact, '5', ''),
  'contact excluded when min price set'
);
assert(
  matchesFeedClientPriceRange(priced, '4', '6'),
  'priced item in range'
);

// Category mapping
assert(feedVerticalSlugToCategoryEnum('garden') === 'GROWN', 'garden slug');
assert(feedItemCategoryEnum('CHEFF') === 'CHEFF', 'prisma category');

// GeoFeed API params — nearby
const paramsNearby = buildGeoFeedApiParams({
  scope: FEED_SCOPE_NEARBY,
  radius: 25,
  q: 'tomato',
  category: 'cheff',
  lat: 52.3,
  lng: 4.9,
});
assert(paramsNearby.get('radius') === '25', 'nearby radius param');
assert(paramsNearby.get('scope') === 'nearby', 'nearby scope param');
assert(!paramsNearby.has('radiusMode'), 'radiusMode param removed');
assert(paramsNearby.get('vertical') === 'cheff', 'vertical param');
assert(paramsNearby.get('lat') === '52.3', 'nearby lat param');

// National: no place filter, radius 0
const paramsNational = buildGeoFeedApiParams({
  scope: 'national',
  radius: 25,
  place: 'Rotterdam',
  lat: 52.3,
  lng: 4.9,
});
assert(paramsNational.get('radius') === '0', 'national radius zero');
assert(paramsNational.get('scope') === 'national', 'national scope param');
assert(!paramsNational.has('place'), 'national ignores place param');
assert(paramsNational.get('lat') === '52.3', 'national lat for labels only');

// Dorpsplein legacy sort keys
const dorps = sortDorpspleinProducts(
  [
    { ...contact, favoriteCount: 0 },
    { ...priced, favoriteCount: 0 },
  ],
  'price-asc'
);
assert(dorps[0].id === 'a', 'dorpsplein price-asc');

const viewsDesc = sortFeedSaleItems([priced, contact], 'views', 'desc');
assert(viewsDesc[0].id === 'b', 'higher views first on desc');

const partitioned = partitionSaleItemsByRadius(
  [
    { id: 'near', distanceKm: 5 },
    { id: 'far', distanceKm: 80 },
    { id: 'unknown', distanceKm: undefined },
  ],
  25,
  { scope: FEED_SCOPE_NEARBY }
);
assert(partitioned.local.length === 1 && partitioned.local[0].id === 'near', 'local within radius');
assert(partitioned.fallback.length === 2, 'fallback outside radius or no coords');

const nationalPartition = partitionSaleItemsByRadius(
  [
    { id: 'near', distanceKm: 5 },
    { id: 'far', distanceKm: 80 },
  ],
  25,
  { scope: 'national' }
);
assert(nationalPartition.local.length === 2, 'national scope skips radius filter');

assert(normalizeFeedScope('international') === 'international', 'normalize international');
assert(normalizeFeedScope('bogus') === 'national', 'normalize default national');

assert(
  scopeFromLegacyPersist({ radius: 25, radiusMode: 'strict_local' }) ===
    FEED_SCOPE_NATIONAL,
  'legacy radiusMode migrates to national'
);
assert(
  migrateHomeFeedPersist({ radius: 25, nationalView: false, radiusMode: 'x' })
    .scope === FEED_SCOPE_NATIONAL,
  'migrate strips legacy keys and defaults national'
);
assert(
  migrateHomeFeedPersist({ scope: 'nearby', radiusMode: 'x' }).scope ===
    FEED_SCOPE_NEARBY,
  'explicit nearby scope preserved'
);

assert(isMarketplaceSaleItem({ priceCents: 500, orderMethod: 'HOMECHEFF_PAYMENT' }), 'priced product is sale');
assert(isMarketplaceSaleItem({ feedSource: 'LISTING', priceCents: 1000 }), 'listing with price is sale');
assert(isMarketplaceSaleItem({ orderMethod: 'CONTACT', priceCents: 0 }), 'contact-only is sale');
assert(
  isMarketplaceSaleItem({
    feedSource: 'PRODUCT',
    listingIntent: 'OFFER',
    priceModel: 'ON_REQUEST',
    priceCents: 0,
  }),
  'ON_REQUEST offer product is sale'
);
assert(
  !isMarketplaceSaleItem({
    feedSource: 'PRODUCT',
    listingIntent: 'REQUEST',
    priceCents: 500,
  }),
  'REQUEST product is not sale'
);
assert(!isMarketplaceSaleItem({ priceCents: 0 }), 'zero price dish is not sale');
assert(resolveMarketplacePriceCents({ price: 12.5 }) === 1250, 'legacy euro price');

const intlSort = scopeDefaultSort(FEED_SCOPE_INTERNATIONAL);
assert(intlSort.sortBy === 'distance' && intlSort.sortOrder === 'desc', 'international default farthest first');
const nearbySort = scopeDefaultSort(FEED_SCOPE_NEARBY);
assert(nearbySort.sortBy === 'distance' && nearbySort.sortOrder === 'asc', 'nearby default nearest first');
assert(scopeUsesFarthestFirstSort(FEED_SCOPE_INTERNATIONAL), 'international uses farthest first');

const farFirst = sortFeedSaleItems(
  [
    { id: 'a', createdAt: '2026-01-01T00:00:00.000Z', distanceKm: 10 },
    { id: 'b', createdAt: '2026-01-02T00:00:00.000Z', distanceKm: 100 },
    { id: 'c', createdAt: '2026-01-03T00:00:00.000Z', distanceKm: undefined },
  ],
  'distance',
  'desc'
);
assert(farFirst[0].id === 'b', 'farthest first on distance desc');
assert(farFirst[farFirst.length - 1].id === 'c', 'no coords last on distance desc');

console.log('✅ feed-client-sort tests passed');
