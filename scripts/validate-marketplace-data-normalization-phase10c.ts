#!/usr/bin/env npx tsx
/**
 * Phase 10C — Marketplace data normalization guard.
 *
 * Run: npx tsx scripts/validate-marketplace-data-normalization-phase10c.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import {
  migrateLegacyServicesViewChip,
  isValidViewIntent,
  MARKETPLACE_VIEW_INTENTS,
} from '@/lib/marketplace/canonical-model';
import {
  proposeProductNormalization,
  isProductCanonical,
} from '@/lib/marketplace/normalization/propose-product-normalization';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import { deriveListingKind } from '@/lib/marketplace/listing-kind/derive-listing-kind';

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

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

console.log('=== Phase 10C — Marketplace data normalization ===\n');

// --- 10C.1 Deliverables -----------------------------------------------------
console.log('10C.1 Deliverables');
assert(
  exists('docs/audits/MARKETPLACE_DATA_NORMALIZATION_PHASE10C_AUDIT.md'),
  'audit doc',
);
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE10C_DATA_NORMALIZATION.md'),
  'progress doc',
);
assert(
  exists('lib/marketplace/normalization/propose-product-normalization.ts'),
  'proposal SSOT',
);
assert(
  exists('scripts/audit-marketplace-data-normalization-phase10c.ts'),
  'audit script',
);
assert(
  exists('scripts/backfill-marketplace-data-normalization-phase10c.ts'),
  'backfill script',
);

// --- 10C.2 Architecture unchanged -------------------------------------------
console.log('\n10C.2 Architecture unchanged');
for (const f of [
  'lib/marketplace/canonical-model.ts',
  'lib/marketplace/settlement/settlement-options.ts',
  'lib/marketplace/settlement/settlement-router.ts',
  'lib/marketplace/listing-kind/derive-listing-kind.ts',
  'lib/marketplace/taxonomy-resolve.ts',
  'lib/marketplace/tiles/map-to-tile-model.ts',
]) {
  assert(exists(f), f);
}
assert(
  !read('lib/marketplace/canonical-model.ts').includes('Phase 10C'),
  'no 10C stamp in canonical-model',
);

// --- 10C.3 No services in view axis -----------------------------------------
console.log('\n10C.3 View axis — no services intent');
assert(
  !MARKETPLACE_VIEW_INTENTS.includes('SERVICES' as never),
  'SERVICES not a view intent',
);
assert(isValidViewIntent('OFFERED'), 'OFFERED valid intent');
assert(
  migrateLegacyServicesViewChip('services', null)?.chip === 'sale',
  'legacy chip=services → sale view',
);
assert(
  migrateLegacyServicesViewChip('services', null)?.category === 'services',
  'legacy chip=services → services category',
);

// --- 10C.4 Category mapping proposals ---------------------------------------
console.log('\n10C.4 Category backfill logic');
const legacyCheff = proposeProductNormalization({
  id: 'test-1',
  title: 'Legacy meal',
  category: 'CHEFF',
  listingIntent: 'OFFER',
  marketplaceCategory: null,
  subcategory: null,
  specializations: [],
  acceptedSpecializations: [],
  barterOpenness: null,
  priceModel: 'FIXED',
  priceCents: 500,
  orderMethod: 'HOMECHEFF_PAYMENT',
  acceptHomeCheffPayment: true,
  acceptDirectContact: false,
  isActive: true,
  createdAt: new Date(),
});
assert(
  legacyCheff.updates.marketplaceCategory === 'CREATE',
  'CHEFF → CREATE marketplaceCategory',
);

const serviceSpec = proposeProductNormalization({
  id: 'test-2',
  title: 'Garden help',
  category: 'CHEFF',
  listingIntent: 'OFFER',
  marketplaceCategory: 'CREATE',
  subcategory: 'practical.gardenwork',
  specializations: [],
  acceptedSpecializations: [],
  barterOpenness: null,
  priceModel: 'ON_REQUEST',
  priceCents: 0,
  orderMethod: 'CONTACT',
  acceptHomeCheffPayment: true,
  acceptDirectContact: false,
  isActive: true,
  createdAt: new Date(),
});
const serviceKind = deriveListingKind({
  entityType: 'product',
  listingIntent: 'OFFER',
  marketplaceCategory: serviceSpec.updates.marketplaceCategory ?? 'CREATE',
  subcategory: 'practical.gardenwork',
  category: 'CHEFF',
});
assert(
  serviceSpec.issues.includes('category_spec_mismatch') ||
    serviceSpec.issues.includes('service_misclassified_category') ||
    serviceSpec.updates.marketplaceCategory === 'PRACTICAL_SERVICE',
  'service taxonomy can reclassify category',
);

// --- 10C.5 Settlement legacy preserve -----------------------------------------
console.log('\n10C.5 Settlement booleans');
const contactLegacy = proposeProductNormalization({
  id: 'test-3',
  title: 'Contact only',
  category: 'CHEFF',
  listingIntent: 'OFFER',
  marketplaceCategory: 'CREATE',
  subcategory: null,
  specializations: [],
  acceptedSpecializations: [],
  barterOpenness: null,
  priceModel: 'ON_REQUEST',
  priceCents: 0,
  orderMethod: 'CONTACT',
  acceptHomeCheffPayment: true,
  acceptDirectContact: false,
  isActive: true,
  createdAt: new Date(),
});
assert(
  contactLegacy.updates.acceptDirectContact === true &&
    contactLegacy.updates.acceptHomeCheffPayment === false,
  'CONTACT orderMethod fixes default boolean mismatch',
);
const settled = resolveSettlementOptions({
  acceptHomeCheffPayment: false,
  acceptDirectContact: true,
  orderMethod: 'CONTACT',
  priceCents: 0,
  listingIntent: 'OFFER',
});
assert(settled.acceptsDirectContact, 'settlement-options preserves direct contact');

// --- 10C.6 Accepted values normalize ------------------------------------------
console.log('\n10C.6 Accepted values');
const canonicalRow = proposeProductNormalization({
  id: 'test-4',
  title: 'Canonical row',
  category: 'CHEFF',
  listingIntent: 'OFFER',
  marketplaceCategory: 'CREATE',
  subcategory: 'create.meal',
  specializations: ['create.meal'],
  acceptedSpecializations: [],
  barterOpenness: 'MONEY',
  priceModel: 'FIXED',
  priceCents: 1000,
  orderMethod: 'HOMECHEFF_PAYMENT',
  acceptHomeCheffPayment: true,
  acceptDirectContact: false,
  isActive: true,
  createdAt: new Date(),
  sellerStripeConnectReady: true,
});
assert(
  isProductCanonical(canonicalRow) ||
    Object.keys(canonicalRow.updates).length === 0,
  'well-formed row is canonical or noop',
);

// --- 10C.7 Filter / URL migration ---------------------------------------------
console.log('\n10C.7 Filter state & URL migration');
const page = read('app/page.tsx');
const geo = read('components/feed/GeoFeed.tsx');
assert(page.includes('migrateLegacyServicesViewChip'), 'homepage legacy chip migration');
assert(page.includes('normalizeDiscoveryCategorySlug'), 'homepage category normalize');
assert(geo.includes('migrateHomeFilterPersist'), 'GeoFeed legacy chip migration');
assert(
  !geo.includes('feedChip === "services"') &&
    !geo.includes("feedChip === 'services'"),
  'no services view chip bug',
);
assert(read('lib/feed/feedSurfaceState.ts').includes('hc_feed_surfaces_v2'), 'persist key');

// --- 10C.8 Scripts safety -----------------------------------------------------
console.log('\n10C.8 Backfill safety');
const backfill = read('scripts/backfill-marketplace-data-normalization-phase10c.ts');
assert(backfill.includes('--dry-run'), 'backfill: dry-run flag');
assert(backfill.includes('CONFIRM_BACKFILL'), 'backfill: confirm gate');
assert(backfill.includes('proposeProductNormalization'), 'backfill uses SSOT');
assert(!backfill.includes('.delete('), 'backfill: no deletes');

// --- 10C.9 No data loss -------------------------------------------------------
console.log('\n10C.9 No data loss');
assert(
  !backfill.includes('acceptedSpecializations: []') ||
    backfill.includes('normalizeAcceptedTaxonomyIds'),
  'backfill does not clear accepted values',
);

// --- 10C.13 USP visibility — reverse discovery --------------------------------
console.log('\n10C.13 USP visibility');
const sidebar = read('components/feed/FeedSidebarFilters.tsx');
const mobile = read('components/feed/FeedMobileFilterSheet.tsx');
const direction = read('components/feed/DiscoveryDirectionToggle.tsx');
const hero = read('components/home/HomeHeroSection.tsx');
const nl = read('public/i18n/nl.json');
const en = read('public/i18n/en.json');

assert(direction.includes('showTagline'), 'DiscoveryDirectionToggle supports USP tagline');
assert(sidebar.includes('showTagline'), 'sidebar shows USP tagline');
assert(mobile.includes('showTagline'), 'mobile filter shows USP tagline');
assert(
  sidebar.includes('AcceptedValuesDiscoveryFilter') &&
    !sidebar.includes("discoveryDirection === 'want'"),
  'accepted-values filter not hidden in advanced refine (want mode)',
);
assert(hero.includes('heroValueExchange'), 'hero shows value-exchange USP');
assert(nl.includes('Shop niet alleen met geld'), 'NL USP tagline i18n');
assert(en.includes("Don't only shop with money"), 'EN USP tagline i18n');
assert(nl.includes('settlementIntro'), 'NL settlement intro on create form');

// --- 10C.10 Prior validators --------------------------------------------------
console.log('\n10C.10 Chained validators');
for (const script of [
  'scripts/validate-pilot-polish-phase10b.ts',
  'scripts/validate-pilot-launch-readiness-phase10a.ts',
  'scripts/validate-settlement-options-phase7c.ts',
  'scripts/validate-reverse-discovery-phase8c.ts',
]) {
  assert(exists(script), script);
  try {
    execSync(`npx tsx ${script}`, { stdio: 'pipe', cwd: process.cwd() });
    assert(true, `${path.basename(script)} passed`);
  } catch {
    assert(false, `${path.basename(script)} passed`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
