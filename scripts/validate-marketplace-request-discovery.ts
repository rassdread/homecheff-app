#!/usr/bin/env npx tsx
/**
 * ADR Phase 2 — REQUEST route + Gezocht discovery validation.
 * Run: npx tsx scripts/validate-marketplace-request-discovery.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildListingDetailHref,
  listingDetailRoutePrefix,
} from '../lib/seo/listing-routes';
import { isMarketplaceRequestItem, isMarketplaceSaleItem } from '../lib/feed/marketplace-sale';
import { DETAIL_KIND_BEHAVIORS } from '../lib/marketplace/detail/detail-kind-matrix';
import { resolveDetailPageActions } from '../lib/marketplace/detail/resolve-detail-actions';
import { inferSearchQueryIntent } from '../lib/search/infer-query-intent';
import { parseSearchFilterParams } from '../lib/search/filters/search-listing-filters';
import { prependGezochtDiscoverySection, GEZOCHT_DISCOVERY_TITLE_KEY } from '../lib/feed/discovery-feed-client';
import { COMMUNITY_HELPER_VARIANTS } from '../lib/discovery/opportunities/community-helper-variants';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed += 1;
  } else {
    console.log(`  ✗ FAIL: ${label}`);
    failed += 1;
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

function loadI18n(locale: 'en' | 'nl'): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(path.join(process.cwd(), `public/i18n/${locale}.json`), 'utf8'),
  ) as Record<string, unknown>;
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

const I18N_KEYS = [
  'marketplace.discovery.requests.chip',
  'marketplace.discovery.requests.sectionTitle',
  'marketplace.discovery.requests.emptyTitle',
  'marketplace.discovery.requests.emptyBody',
  'marketplace.discovery.requests.searchHints.gezocht',
  'marketplace.discovery.requests.searchHints.help',
  'marketplace.discovery.requests.searchHints.request',
  'marketplace.request.actions.view',
  'marketplace.request.actions.help',
  'marketplace.request.actions.proposal',
  'marketplace.request.actions.create',
  'marketplace.request.detail.badge',
  'marketplace.request.detail.helpBadge',
  'marketplace.detail.actions.requestProposal',
] as const;

console.log('=== Marketplace REQUEST Discovery Validation (ADR Phase 2) ===\n');

console.log('2.1 REQUEST route');
assert(
  listingDetailRoutePrefix({ listingKind: 'REQUEST' }) === 'request',
  'REQUEST listings use /request prefix',
);
assert(
  listingDetailRoutePrefix({ listingIntent: 'REQUEST' }) === 'request',
  'REQUEST intent uses /request prefix',
);
const requestHref = buildListingDetailHref({
  listingKind: 'REQUEST',
  listingIntent: 'REQUEST',
  title: 'Basilicum gezocht',
  place: 'Utrecht',
  id: '00000000-0000-4000-8000-000000000001',
});
assert(requestHref.startsWith('/request/'), 'buildListingDetailHref → /request/');
assert(
  fs.existsSync(path.join(process.cwd(), 'app/request/[slug]/page.tsx')),
  'app/request/[slug]/page.tsx exists',
);
const productLayout = read('app/product/[id]/layout.tsx');
assert(
  productLayout.includes('isRequestListing') &&
    productLayout.includes("buildListingDetailPath") &&
    productLayout.includes("'request'"),
  'product layout redirects REQUEST to /request/',
);
const requestLayout = read('app/request/[slug]/layout.tsx');
assert(
  requestLayout.includes('isRequestListing') &&
    requestLayout.includes("buildListingDetailPath") &&
    requestLayout.includes("'product'"),
  'request layout redirects non-REQUEST to /product/',
);

console.log('\n2.2 REQUEST detail (4C contracts)');
const requestBehavior = DETAIL_KIND_BEHAVIORS.REQUEST;
assert(
  requestBehavior.routePattern === '/request/[slug]',
  'detail-kind-matrix REQUEST routePattern',
);
assert(
  requestBehavior.currentImplementation.includes('app/request/[slug]'),
  'detail-kind-matrix REQUEST implementation',
);
const detailActions = resolveDetailPageActions({ listingKind: 'REQUEST' });
assert(detailActions.showProposal, 'REQUEST detail primary proposal CTA');
assert(!detailActions.showOrder, 'REQUEST detail hides order CTA');
const listingDetailPage = read('components/product/ListingDetailPage.tsx');
assert(
  listingDetailPage.includes('ProductDetailMainSections'),
  'shared ListingDetailPage uses 4C main sections',
);
assert(
  listingDetailPage.includes('marketplace.request.detail.badge'),
  'REQUEST detail badge i18n wired',
);

console.log('\n2.3 Gezocht discovery section');
const geoFeed = read('components/feed/GeoFeed.tsx');
assert(geoFeed.includes('feedChip === "gezocht"'), 'GeoFeed gezocht chip filter');
assert(geoFeed.includes('isMarketplaceRequestItem'), 'GeoFeed request classification');
assert(geoFeed.includes('prependGezochtDiscoverySection'), 'GeoFeed Gezocht section on all chip');
assert(geoFeed.includes('emptyGezocht'), 'GeoFeed empty gezocht state');
const feedHref = read('lib/feed/feed-item-href.ts');
assert(feedHref.includes('buildListingDetailHref'), 'feed href uses listing routes');
const gezochtRows = prependGezochtDiscoverySection(
  [{ row: 'sale', item: { id: 'b' } }],
  [{ id: 'a' }, { id: 'c' }],
  1,
);
assert(
  gezochtRows[0]?.row === 'section' &&
    gezochtRows[0].titleKey === GEZOCHT_DISCOVERY_TITLE_KEY,
  'prependGezochtDiscoverySection inserts section header',
);

console.log('\n2.4 REQUEST tiles & preview CTAs');
const previewActions = read('components/marketplace/previews/MarketplacePreviewActions.tsx');
assert(
  previewActions.includes('marketplace.request.actions.view'),
  'preview view CTA for REQUEST',
);
assert(
  previewActions.includes('openProposalAfterStart'),
  'preview proposal entry for REQUEST',
);
const tileBadges = read('lib/marketplace/tiles/build-tile-badges.ts');
assert(tileBadges.includes('REQUEST'), 'tile badge wiring for REQUEST');

console.log('\n2.5 Proposal loop surfaces');
const exchangeCard = read('components/marketplace/exchange-suggestions/ExchangeSuggestionCard.tsx');
assert(
  exchangeCard.includes('buildListingDetailHref'),
  'exchange suggestions use canonical listing href',
);
assert(
  exchangeCard.includes('openProposalAfterStart'),
  'exchange suggestion start_proposal CTA',
);

console.log('\n2.6 Buurthulp → REQUEST');
for (const variant of COMMUNITY_HELPER_VARIANTS) {
  assert(
    variant.actionHref.includes('chip=gezocht'),
    `${variant.id} CTA → gezocht feed`,
  );
}

console.log('\n2.7 Search & filters');
assert(inferSearchQueryIntent('tuinman gezocht').suggestsRequest, 'query intent: gezocht');
assert(inferSearchQueryIntent('hulp gevraagd').suggestsRequest, 'query intent: hulp gevraagd');
const searchParams = new URLSearchParams('listingIntent=REQUEST');
const filters = parseSearchFilterParams(searchParams);
assert(filters.listingIntent === 'REQUEST', 'listingIntent=REQUEST filter param');
assert(
  !isMarketplaceSaleItem({ listingIntent: 'REQUEST', discovery: { listingKind: 'REQUEST' } }),
  'REQUEST excluded from sale bucket',
);
assert(
  isMarketplaceRequestItem({ listingIntent: 'REQUEST', discovery: { listingKind: 'REQUEST' } }),
  'REQUEST included in gezocht bucket',
);

console.log('\n2.8 Exchange integration');
const suggestionContract = read(
  'lib/marketplace/exchange-suggestions/exchange-suggestion-contract.ts',
);
assert(
  suggestionContract.includes('counterpartyListingIntent'),
  'suggestion card carries counterparty listing intent',
);
const fromProduct = read('lib/discovery/mappers/from-product.ts');
assert(
  fromProduct.includes('buildListingDetailHref'),
  'discovery mapper canonical href',
);

console.log('\n2.9 Mobile feed toolbar');
const mobileToolbar = read('components/feed/FeedMobileToolbar.tsx');
assert(mobileToolbar.includes("'gezocht'"), 'mobile toolbar gezocht chip');

console.log('\n2.10 i18n parity (nl + en)');
for (const locale of ['nl', 'en'] as const) {
  const dict = loadI18n(locale);
  for (const key of I18N_KEYS) {
    const val = getNested(dict, key);
    assert(typeof val === 'string' && val.trim().length > 0, `${locale}: ${key}`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
