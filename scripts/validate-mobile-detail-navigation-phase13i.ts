#!/usr/bin/env npx tsx
/**
 * Phase 13I-P0 — Mobile detail navigation + fetch contract.
 *
 * Run: npx tsx scripts/validate-mobile-detail-navigation-phase13i.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  listingDetailApiPath,
  listingDetailFetchUrl,
  listingDetailResolvedId,
  normalizeListingDetailRouteParam,
  resolveListingDetailRouteParam,
} from '../lib/marketplace/detail/listing-detail-route';
import {
  isUniversalProductFallback,
  resolveListingDetailContract,
} from '../lib/marketplace/detail/listing-detail-contract';
import { buildListingDetailHref } from '../lib/seo/listing-routes';
import { resolveFeedItemHref } from '../lib/feed/feed-item-href';
import { resolveProductIdFromParam } from '../lib/seo/productSlug';
import { shouldUseAbsoluteApiBase } from '../lib/client/resolve-api-url';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

console.log('=== Phase 13I-P0 — Mobile Detail Navigation ===\n');

console.log('P0.1 Deliverables');
assert(
  fs.existsSync('docs/audits/MOBILE_DETAIL_NAVIGATION_PHASE13I_AUDIT.md'),
  'audit doc',
);
assert(
  fs.existsSync('lib/marketplace/detail/listing-detail-route.ts'),
  'route SSOT',
);
assert(
  fs.existsSync('lib/marketplace/detail/listing-detail-contract.ts'),
  'entity contract SSOT',
);
assert(
  fs.existsSync('lib/client/resolve-api-url.ts'),
  'client API URL resolver',
);
assert(
  fs.existsSync('components/product/ListingDetailUnavailable.tsx'),
  'unavailable UI',
);
assert(fs.existsSync('app/product/[id]/error.tsx'), 'product error boundary');
assert(fs.existsSync('app/request/[slug]/error.tsx'), 'request error boundary');

const detail = read('components/product/ListingDetailPage.tsx');
const feedMedia = read('components/feed/feedMedia.tsx');
const safeRoute = read('lib/native/safeRoute.ts');
const resolveApi = read('lib/client/resolve-api-url.ts');

console.log('\nP0.2 Fetch + hooks');
assert(
  !detail.includes('if (!routeParam)') ||
    detail.indexOf('useState') < detail.indexOf('if (!routeParam)'),
  'hooks before conditional return (Rules of Hooks)',
);
assert(detail.includes('loadError'), 'load error state');
assert(!detail.includes("router.push('/')"), 'no redirect home on fetch fail');
assert(detail.includes('listingDetailFetchUrl'), 'absolute-aware fetch URL');
assert(detail.includes('listingDetailDiag'), 'dev/native diagnostics');
assert(detail.includes('ListingDetailUnavailable'), 'graceful unavailable UI');

console.log('\nP0.3 Native API base URL');
assert(resolveApi.includes('getPublicAppUrl'), 'uses canonical app URL helper');
assert(!resolveApi.includes('https://homecheff.eu"'), 'no hardcoded production URL');
assert(
  typeof shouldUseAbsoluteApiBase === 'function',
  'shouldUseAbsoluteApiBase export',
);

console.log('\nP0.4 Slug normalization + UUID API path');
const sampleId = '550e8400-e29b-41d4-a716-446655440000';
const slug = buildListingDetailHref({
  listingKind: 'PRODUCT',
  listingIntent: 'OFFER',
  title: 'Lasagne',
  place: 'Rotterdam',
  id: sampleId,
});
const slugSegment = slug.replace('/product/', '');
assert(
  listingDetailResolvedId(slugSegment) === sampleId,
  'slug param resolves to UUID',
);
assert(
  listingDetailResolvedId(`${slugSegment}/`) === sampleId,
  'trailing slash param resolves to UUID',
);
assert(
  resolveProductIdFromParam(`${slugSegment}/`) === sampleId,
  'productSlug strips trailing slash',
);
assert(
  listingDetailApiPath(slugSegment) === `/api/products/${encodeURIComponent(sampleId)}`,
  'API path uses resolved UUID not full slug',
);
assert(
  listingDetailFetchUrl(slugSegment).includes('/api/products/'),
  'fetch URL includes products API',
);
assert(
  resolveListingDetailRouteParam({ id: slugSegment }) === slugSegment,
  'product route param parse',
);
assert(
  resolveListingDetailRouteParam({ slug: slugSegment }) === slugSegment,
  'request route param parse',
);
assert(
  normalizeListingDetailRouteParam(`${slugSegment}/?x=1`) === slugSegment,
  'normalize strips slash and query',
);

console.log('\nP0.5 Entity type route contracts');
const entityFixtures: Array<{
  label: string;
  item: Record<string, unknown>;
  expectPrefix: string;
  usesListingPage: boolean;
}> = [
  {
    label: 'Product OFFER',
    item: {
      id: sampleId,
      title: 'Tomatensoep',
      place: 'Vlaardingen',
      feedSource: 'PRODUCT',
      listingIntent: 'OFFER',
    },
    expectPrefix: '/product/',
    usesListingPage: true,
  },
  {
    label: 'Request',
    item: {
      id: sampleId,
      title: 'Hulp gezocht',
      place: 'Rotterdam',
      feedSource: 'PRODUCT',
      listingIntent: 'REQUEST',
      listingKind: 'REQUEST',
    },
    expectPrefix: '/request/',
    usesListingPage: true,
  },
  {
    label: 'Service',
    item: {
      id: sampleId,
      title: 'Kookworkshop',
      place: 'Utrecht',
      feedSource: 'PRODUCT',
      listingKind: 'SERVICE',
      marketplaceCategory: 'services',
    },
    expectPrefix: '/product/',
    usesListingPage: true,
  },
  {
    label: 'Dish CHEFF',
    item: {
      id: sampleId,
      title: 'Pasta',
      feedSource: 'DISH',
      type: 'dish',
      category: 'CHEFF',
    },
    expectPrefix: '/recipe/',
    usesListingPage: false,
  },
  {
    label: 'Garden',
    item: {
      id: sampleId,
      title: 'Tomaten',
      feedSource: 'DISH',
      type: 'dish',
      category: 'GROWN',
    },
    expectPrefix: '/garden/',
    usesListingPage: false,
  },
  {
    label: 'Design',
    item: {
      id: sampleId,
      title: 'Schilderij',
      feedSource: 'DISH',
      type: 'dish',
      category: 'DESIGNER',
    },
    expectPrefix: '/design/',
    usesListingPage: false,
  },
  {
    label: 'Legacy listing',
    item: {
      id: sampleId,
      title: 'Oud item',
      feedSource: 'LISTING',
      type: 'product',
      listingIntent: 'OFFER',
      priceCents: 500,
    },
    expectPrefix: '/product/',
    usesListingPage: true,
  },
  {
    label: 'Barter',
    item: {
      id: sampleId,
      title: 'Ruil',
      feedSource: 'PRODUCT',
      listingKind: 'BARTER',
      listingIntent: 'OFFER',
      priceCents: 0,
      orderMethod: 'CONTACT',
    },
    expectPrefix: '/product/',
    usesListingPage: true,
  },
];

for (const fx of entityFixtures) {
  const contract = resolveListingDetailContract(fx.item as never);
  assert(
    contract.href.startsWith(fx.expectPrefix),
    `${fx.label} href → ${fx.expectPrefix}`,
  );
  assert(
    contract.usesListingDetailPage === fx.usesListingPage,
    `${fx.label} listing page contract`,
  );
  assert(
    !isUniversalProductFallback(fx.item as never),
    `${fx.label} no universal /product fallback`,
  );
  if (contract.usesListingDetailPage) {
    assert(
      contract.apiPath === listingDetailApiPath(sampleId),
      `${fx.label} API path matches UUID route`,
    );
  }
}

const inspirationMisroute = {
  id: sampleId,
  title: 'Recept',
  feedSource: 'DISH',
  type: 'dish',
  category: 'CHEFF',
};
assert(
  !resolveFeedItemHref(inspirationMisroute as never).startsWith('/product/'),
  'dish never routes to /product/',
);

console.log('\nP0.6 Native tap / safe routes');
assert(
  feedMedia.includes('lightboxEligible = coarsePointer && !nativeMounted'),
  'native media navigates to detail',
);
assert(safeRoute.includes('normalized.startsWith("/product/")'), 'product safe route');
assert(safeRoute.includes('normalized.startsWith("/request/")'), 'request safe route');
assert(safeRoute.includes('normalized.startsWith("/recipe/")'), 'recipe safe route');
assert(safeRoute.includes('normalized.startsWith("/garden/")'), 'garden safe route');
assert(safeRoute.includes('normalized.startsWith("/design/")'), 'design safe route');

console.log('\nP0.7 Error distinction');
assert(detail.includes("status === 404"), '404 → not_found');
assert(detail.includes("status >= 500"), '5xx → server_error');
assert(detail.includes("'invalid'"), 'invalid JSON distinguished');

console.log('\nP0.8 i18n unavailable copy');
assert(read('public/i18n/nl.json').includes('"detailError"'), 'nl detailError block');
assert(read('public/i18n/nl.json').includes('Opnieuw proberen'), 'nl retry label');
assert(read('public/i18n/en.json').includes('"detailError"'), 'en detailError block');
assert(read('public/i18n/en.json').includes('Could not load listing'), 'en network title');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
