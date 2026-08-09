/**
 * Feed recovery regression: nearby exhaust → widened discovery → recirculation,
 * ON_REQUEST href guard, dish href guard, composition hasMore contract.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  composedFeedCanContinue,
  createFeedCompositionState,
  markBroadenedPageResult,
  markMarketplacePageResult,
  recordDisplayedSeeds,
  shouldFetchBroadenedDiscovery,
} from '../lib/feed/feed-composition-state';
import { resolveFeedItemHref } from '../lib/feed/feed-item-href';
import { deriveFeedTaxonomy } from '../lib/feed/feed-taxonomy';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Feed recovery continuity ===\n');

const geo = read('components/feed/GeoFeed.tsx');
const stateSrc = read('lib/feed/feed-composition-state.ts');
const deleteSrc = read('app/api/products/[id]/route.ts');

check(
  'feedHasMore contract documented in composition state',
  stateSrc.includes('feedHasMore contract') &&
    stateSrc.includes('Can the user discover another eligible page'),
);

check(
  'GeoFeed fetches broadened national after exact exhaust',
  geo.includes('shouldFetchBroadenedDiscovery') &&
    geo.includes('broadened: true') &&
    geo.includes('markBroadenedPageResult'),
);

check(
  'broadened national omits countryCode seal',
  geo.includes('useBroadenedNational ? null : browseCountryCode') ||
    /useBroadenedNational\s*\?\s*null\s*:\s*browseCountryCode/.test(geo),
);

check(
  'GeoFeed recirculation uses historical handoff helper (no broadened starvation)',
  geo.includes('shouldActivateRecirculation') &&
    geo.includes('resolveFeedIntersectionRoot') &&
    geo.includes('homecheff-feed-desktop'),
);

check(
  'Product DELETE removes linked same-id Dish',
  deleteSrc.includes('tx.dish.deleteMany') &&
    deleteSrc.includes('Linked Dish shares product id'),
);

// --- Behavioural composition ---
let state = createFeedCompositionState('nearby:25');
const page1 = [
  { id: 'n1', kind: 'sale' as const },
  { id: 'n2', kind: 'sale' as const },
  { id: 'n3', kind: 'sale' as const },
  { id: 'n4', kind: 'sale' as const },
  { id: 'n5', kind: 'sale' as const },
  { id: 'n6', kind: 'sale' as const },
  { id: 'n7', kind: 'sale' as const },
];
state = recordDisplayedSeeds(state, page1);
state = markMarketplacePageResult(state, {
  fetchedCount: 7,
  apiHasMore: false,
  skipUsed: 0,
});

check(
  '1) nearby page exhaust does not terminate full discovery',
  composedFeedCanContinue(state) === true && state.emptyTerminal === false,
);

check(
  '2) continuation activates after exact radius exhaust',
  state.stage === 'broadened' && shouldFetchBroadenedDiscovery(state) === true,
);

// Simulate page 2 broadened append
state = recordDisplayedSeeds(state, [
  { id: 'w1', kind: 'sale' },
  { id: 'w2', kind: 'insp' },
  { id: 'w3', kind: 'sale' },
]);
state = markBroadenedPageResult(state, {
  fetchedCount: 10,
  newUniqueCount: 3,
  apiHasMore: true,
  skipUsed: 0,
});
check(
  '3) page 2 appends (broadened keeps hasMore)',
  composedFeedCanContinue(state) === true &&
    state.uniqueEligibleCount === 10 &&
    state.broadenedSkip === 10,
);

state = recordDisplayedSeeds(state, [
  { id: 'w4', kind: 'sale' },
  { id: 'w5', kind: 'sale' },
  { id: 'w6', kind: 'insp' },
]);
state = markBroadenedPageResult(state, {
  fetchedCount: 10,
  newUniqueCount: 3,
  apiHasMore: true,
  skipUsed: 10,
});
check(
  '4) page 3 appends',
  state.broadenedSkip === 20 && state.uniqueEligibleCount === 13,
);

const ids = state.displayedHistory.map((h) => h.id);
check(
  '5) no duplicate IDs in displayed history',
  ids.length === new Set(ids).size,
);

// Exhaust broadened
state = markBroadenedPageResult(state, {
  fetchedCount: 2,
  newUniqueCount: 0,
  apiHasMore: false,
  skipUsed: 20,
});
check(
  '6) true end of widened discovery then recirculation (hasMore via recirc)',
  state.broadenedExhausted === true &&
    state.stage === 'recirculation' &&
    composedFeedCanContinue(state) === true,
);

// Empty terminal
let empty = createFeedCompositionState('empty');
empty = markMarketplacePageResult(empty, {
  fetchedCount: 0,
  apiHasMore: false,
  skipUsed: 0,
});
check(
  'true empty exact → terminal hasMore false',
  empty.stage === 'empty' && composedFeedCanContinue(empty) === false,
);

check(
  '7) filter/radius reset helper exists (requestKey reset)',
  stateSrc.includes('resetFeedCompositionState'),
);

check(
  '8) national skip pagination still used in GeoFeed load-more',
  geo.includes('buildLoadMoreParams') && geo.includes('FEED_SCOPE_NATIONAL'),
);

// ON_REQUEST guard
const onRequest = {
  id: 'fcc5ff2a-651a-4983-9d17-b3f1acf7ca17',
  title: 'HomeCheff Design Studio',
  place: 'Vlaardingen',
  category: 'DESIGNER',
  priceCents: 0,
  priceModel: 'ON_REQUEST',
  listingIntent: 'OFFER',
  type: 'PRODUCT',
  feedSource: 'PRODUCT',
  marketplaceCategory: 'DESIGN',
  listingKind: 'SERVICE' as const,
};
const tax = deriveFeedTaxonomy(onRequest);
const href = resolveFeedItemHref(onRequest);
check(
  '9) ON_REQUEST stays product/service',
  (tax.kind === 'PRODUCT' || tax.kind === 'SERVICE') &&
    tax.kind !== 'INSPIRATION',
);
check(
  '10) ON_REQUEST href stays /product/',
  href.startsWith('/product/') && !href.includes('/recipe/'),
);

const zeroPriceProduct = {
  id: 'zero-1',
  title: 'Zero price offer',
  place: 'Amsterdam',
  category: 'DESIGNER',
  priceCents: 0,
  priceModel: 'FIXED',
  listingIntent: 'OFFER',
  type: 'PRODUCT',
  feedSource: 'PRODUCT',
};
const zeroHref = resolveFeedItemHref(zeroPriceProduct);
check(
  'zero/null-ish price does not force /recipe/',
  zeroHref.startsWith('/product/') && !zeroHref.includes('/recipe/'),
);

const dish = {
  id: 'dish-1',
  title: 'Real recipe',
  category: 'CHEFF',
  priceCents: 0,
  type: 'dish',
  feedSource: 'DISH',
};
const dishTax = deriveFeedTaxonomy(dish);
const dishHref = resolveFeedItemHref(dish);
check(
  '11) genuine dish stays /recipe/',
  dishTax.kind === 'INSPIRATION' && dishHref.startsWith('/recipe/'),
);

check(
  '12) product delete linked Dish cleanup present',
  deleteSrc.includes('await tx.dish.deleteMany'),
);

const cleanupSrc = read('scripts/cleanup-mediacert-orphan-dishes.ts');
check(
  '13) MediaCert cleanup script targets title prefix only',
  cleanupSrc.includes("startsWith: 'MediaCert'") &&
    cleanupSrc.includes('deleteMany'),
);

console.log(`\n${passed} checks passed`);
