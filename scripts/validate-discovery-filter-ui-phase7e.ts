#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 7E — Discovery filter UI rewire & mobile tile layout.
 *
 * Run: npx tsx scripts/validate-discovery-filter-ui-phase7e.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { isMarketplaceSaleItem } from '@/lib/feed/marketplace-sale';
import {
  DISCOVERY_CATEGORY_CHIP_OPTIONS,
  DISCOVERY_VIEW_CHIP_OPTIONS,
  isLegacyServicesViewChip,
  isServicesCategorySlug,
  migrateLegacyServicesViewChip,
  itemMatchesDiscoveryCategorySlug,
} from '@/lib/marketplace/canonical-model';

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
function json(rel: string): any {
  try {
    return JSON.parse(read(rel));
  } catch {
    return {};
  }
}
function get(obj: any, dotted: string): unknown {
  return dotted.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

console.log('=== UX-FIN Phase 7E — Discovery filter UI rewire ===\n');

// --- 7E.1 View row: no services ------------------------------------------------
console.log('7E.1 View row — services not in intent axis');
assert(
  !DISCOVERY_VIEW_CHIP_OPTIONS.some((o) => o.legacyChip === 'services'),
  'DISCOVERY_VIEW_CHIP_OPTIONS has no services chip',
);
{
  const geo = read('components/feed/GeoFeed.tsx');
  const toolbar = read('components/feed/FeedMobileToolbar.tsx');
  assert(!geo.includes('setFeedChip("services")'), 'GeoFeed does not set services view chip');
  assert(!toolbar.includes("'services'"), 'FeedMobileToolbar has no services view chip');
  assert(
    geo.includes('DISCOVERY_VIEW_CHIP_OPTIONS'),
    'GeoFeed view row driven by canonical model',
  );
}

// --- 7E.2 Category row: services present ---------------------------------------
console.log('\n7E.2 Category row — services under category axis');
assert(
  DISCOVERY_CATEGORY_CHIP_OPTIONS.some((o) => o.slug === 'services'),
  'category row includes services slug',
);
assert(
  DISCOVERY_CATEGORY_CHIP_OPTIONS.some((o) => o.slug === 'cheff'),
  'category row includes food (cheff slug)',
);
{
  const geo = read('components/feed/GeoFeed.tsx');
  assert(geo.includes('CATEGORY_CHIP_OPTIONS'), 'GeoFeed category row uses canonical options');
  assert(
    read('components/feed/FeedMobileToolbar.tsx').includes('DISCOVERY_CATEGORY_CHIP_OPTIONS'),
    'mobile toolbar renders category row',
  );
}

// --- 7E.3 Legacy ?chip=services migration --------------------------------------
console.log('\n7E.3 Legacy services view chip migration');
assert(isLegacyServicesViewChip('services'), 'legacy alias services detected');
assert(isLegacyServicesViewChip('diensten'), 'legacy alias diensten detected');
{
  const migrated = migrateLegacyServicesViewChip('services', 'all');
  assert(migrated?.chip === 'sale' && migrated.category === 'services', '?chip=services → sale + category services');
}
{
  const page = read('app/page.tsx');
  assert(
    page.includes('migrateLegacyServicesViewChip'),
    'homepage deep-link migrates legacy services chip',
  );
  assert(
    read('components/home/HomeMobileEcosystemStrip.tsx').includes('vertical=services'),
    'ecosystem strip links to category=services (not view chip)',
  );
}
{
  const taxonomy = read('lib/feed/feed-taxonomy.ts');
  assert(!taxonomy.includes("filter === 'services'"), 'matchesFeedViewFilter no longer filters services view');
}

// --- 7E.4 Offered semantics ----------------------------------------------------
console.log('\n7E.4 Offered includes all value forms + services');
const serviceOffer = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  listingKind: 'SERVICE',
  priceModel: 'ON_REQUEST',
  priceCents: 0,
} as const;
const barterOnly = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  orderMethod: 'CONTACT',
  priceCents: 0,
  priceModel: 'ON_REQUEST',
} as const;
assert(isMarketplaceSaleItem(serviceOffer), 'service offers stay in Offered pool');
assert(isMarketplaceSaleItem(barterOnly), 'barter-only offers stay in Offered pool');
assert(
  itemMatchesDiscoveryCategorySlug(serviceOffer, 'services'),
  'services category filter matches service offers',
);

// --- 7E.5 Mobile tile whitespace -----------------------------------------------
console.log('\n7E.5 Mobile tile whitespace fix');
{
  const compact = read('components/marketplace/tiles/MarketplaceTileCompact.tsx');
  const standard = read('components/marketplace/tiles/MarketplaceTileStandard.tsx');
  const css = read('app/globals.css');
  assert(compact.includes('self-start') && compact.includes('h-auto'), 'compact tile does not stretch in grid');
  assert(!compact.includes('flex-1 flex-col gap-1.5 p-2.5'), 'compact content block has no flex-1 stretch');
  assert(standard.includes('shrink-0'), 'standard content block is shrink-0');
  assert(
    css.includes('.hc-feed-cards-column .feed-card-geo') && css.includes('align-self: start'),
    'feed column CSS prevents card stretch whitespace',
  );
}

// --- 7E.6/7 Universal tile order (trust before settlement) ---------------------
console.log('\n7E.6/7 Tile order — trust before settlement, settlement at bottom');
for (const file of ['MarketplaceTileStandard.tsx', 'MarketplaceTileCompact.tsx']) {
  const src = read(`components/marketplace/tiles/${file}`);
  const trustIdx = src.lastIndexOf('TileTrustCue');
  const settlementIdx = src.lastIndexOf('TileSettlementRow');
  const valueIdx = src.lastIndexOf('TileValueExchangeBlock');
  assert(valueIdx < trustIdx && trustIdx < settlementIdx, `${file}: value → trust → settlement`);
  assert(src.includes('showSettlement={false}'), `${file}: settlement split from value block`);
}

// --- 7E.8 i18n -----------------------------------------------------------------
console.log('\n7E.8 i18n — canonical view/category labels (NL/EN)');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
for (const key of [
  'marketplace.canonical.view.offered',
  'marketplace.canonical.category.food',
  'marketplace.canonical.category.garden',
  'marketplace.canonical.category.creations',
  'marketplace.canonical.category.services',
]) {
  assert(typeof get(nl, key) === 'string' && String(get(nl, key)).length > 0, `nl ${key}`);
  assert(typeof get(en, key) === 'string' && String(get(en, key)).length > 0, `en ${key}`);
}
assert(get(nl, 'marketplace.canonical.view.offered') === 'Aangeboden', 'nl offered = Aangeboden');
assert(get(nl, 'marketplace.canonical.category.services') === 'Diensten', 'nl services = Diensten');

// --- 7E.9 Performance ----------------------------------------------------------
console.log('\n7E.9 Performance — no extra fetch');
{
  const geo = read('components/feed/GeoFeed.tsx');
  assert(!geo.includes('sortedServices'), 'no separate services fetch/sort pool');
  assert(geo.includes('itemMatchesDiscoveryCategorySlug'), 'category filter reuses canonical matcher');
}

// --- Deliverables --------------------------------------------------------------
console.log('\nDeliverables');
assert(exists('docs/audits/DISCOVERY_FILTER_UI_PHASE7E_AUDIT.md'), 'audit doc present');
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE7E_DISCOVERY_FILTER_UI.md'),
  'progress doc present',
);

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
