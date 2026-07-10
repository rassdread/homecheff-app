#!/usr/bin/env npx tsx
/**
 * Phase 13I P0 — Mobile detail navigation crash guard.
 *
 * Run: npx tsx scripts/validate-mobile-detail-navigation-phase13i.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  listingDetailApiPath,
  listingDetailResolvedId,
  resolveListingDetailRouteParam,
} from '../lib/marketplace/detail/listing-detail-route';
import { buildListingDetailHref } from '../lib/seo/listing-routes';
import { resolveFeedItemHref } from '../lib/feed/feed-item-href';

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

console.log('=== Phase 13I P0 — Mobile Detail Navigation ===\n');

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
  fs.existsSync('components/product/ListingDetailUnavailable.tsx'),
  'unavailable UI',
);
assert(fs.existsSync('app/product/[id]/error.tsx'), 'product error boundary');
assert(fs.existsSync('app/request/[slug]/error.tsx'), 'request error boundary');

const detail = read('components/product/ListingDetailPage.tsx');
const feedMedia = read('components/feed/feedMedia.tsx');
const safeRoute = read('lib/native/safeRoute.ts');
const audit = read('docs/audits/MOBILE_DETAIL_NAVIGATION_PHASE13I_AUDIT.md');

console.log('\nP0.2 Root cause fixes');
assert(
  !detail.includes('if (!routeParam)') ||
    detail.indexOf('useState') < detail.indexOf('if (!routeParam)'),
  'hooks before conditional return (Rules of Hooks)',
);
assert(detail.includes('loadError'), 'load error state');
assert(!detail.includes("router.push('/')"), 'no redirect home on fetch fail');
assert(detail.includes('listingDetailApiPath'), 'encoded API path SSOT');
assert(detail.includes('ListingDetailUnavailable'), 'graceful unavailable UI');
assert(detail.includes("navDebug('listing-detail:fetch'"), 'dev fetch logging');

console.log('\nP0.3 Native tap / safe routes');
assert(
  feedMedia.includes('lightboxEligible = coarsePointer && !nativeMounted'),
  'native media navigates to detail',
);
assert(safeRoute.includes('normalized.startsWith("/product/")'), 'product safe route');
assert(safeRoute.includes('normalized.startsWith("/request/")'), 'request safe route');
assert(safeRoute.includes('normalized.startsWith("/recipe/")'), 'recipe safe route');

console.log('\nP0.4 Slug + legacy ID resolution');
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
  listingDetailApiPath(slugSegment).includes(encodeURIComponent('-hcid-')),
  'API path encodes slug',
);
assert(
  resolveListingDetailRouteParam({ id: slugSegment }) === slugSegment,
  'product route param parse',
);
assert(
  resolveListingDetailRouteParam({ slug: slugSegment }) === slugSegment,
  'request route param parse',
);

const legacyFeedItem = {
  id: sampleId,
  title: 'Tomatensoep',
  place: 'Vlaardingen',
  type: 'product',
  listingIntent: 'OFFER',
} as const;
const legacyHref = resolveFeedItemHref(legacyFeedItem);
assert(legacyHref.startsWith('/product/'), 'legacy feed product href');

console.log('\nP0.5 i18n unavailable copy');
assert(read('public/i18n/nl.json').includes('"detailError"'), 'nl detailError block');
assert(read('public/i18n/nl.json').includes('Opnieuw proberen'), 'nl retry label');
assert(read('public/i18n/en.json').includes('"detailError"'), 'en detailError block');
assert(read('public/i18n/en.json').includes('Could not load listing'), 'en network title');

console.log('\nP0.6 Audit completeness');
assert(audit.includes('Root cause'), 'root cause documented');
assert(audit.includes('Rules of Hooks'), 'hooks violation documented');
assert(audit.includes('Validation report'), 'validation report section');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
