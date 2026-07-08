#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 7B — Marketplace tile category / value / settlement guard.
 *
 * Phase 7B makes every marketplace tile communicate, at a glance and without
 * conflating price / payment method / accepted values:
 *
 *   7B.3  ONE primary "what is it" badge — the pillar/category badge; the
 *         redundant generic listing_kind badge is dropped when a category badge
 *         is present.
 *   7B.4  Value row = price/budget/value label + accepted-value SUBCATEGORY
 *         icons (taxonomy-driven), on the same line (price left, icons right).
 *   7B.5  A SEPARATE settlement row with DISTINCT icons:
 *           HomeCheff Checkout (ShieldCheck — NOT a money-bill/Stripe icon),
 *           cash/direct contact (Banknote), barter (Handshake),
 *           alternative values (ArrowLeftRight).
 *   7B.6  Accepted values in the create/edit flow are taxonomy-based.
 *   7B.11 Tile model carries category, acceptedValues, barterOpenness, payment.
 *   7B.12 No extra network roundtrip — settlement derives from the tile model.
 *
 * Static, dependency-free. Also re-asserts the frozen prior architecture.
 * Run: npx tsx scripts/validate-marketplace-tile-payment-semantics-phase7b.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

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

console.log('=== UX-FIN Phase 7B — Tile category / value / settlement guard ===\n');

// --- 7B.11 Tile model carries the value-exchange data ------------------------
console.log('7B.11 Tile model contains value-exchange data');
const tileTypes = read('lib/marketplace/tiles/types.ts');
for (const field of [
  'marketplaceCategory',
  'listingIntent',
  'listingKind',
  'acceptedSpecializations',
  'barterOpenness',
  'orderMethod',
  'priceCents',
  'acceptedValueSubcategories',
  'offerMainCategory',
]) {
  assert(tileTypes.includes(`${field}`), `tile model has ${field}`);
}

// --- 7B.3 One primary category badge (dedupe) --------------------------------
console.log('\n7B.3 Single primary pillar/category badge');
const badges = read('lib/marketplace/tiles/build-tile-badges.ts');
assert(
  badges.includes("hasOfferCategory") && badges.includes("filter((c) => c.kind !== 'listing_kind')"),
  'listing_kind badge suppressed when offer_category badge present',
);
assert(read('lib/marketplace/tiles/resolve-tile-offer-category-badge.ts').includes('MAIN_CATEGORY_REGISTRY'),
  'offer_category badge is taxonomy/registry-backed (no hardcoded label)');

// --- 7B.4 Value row = price + accepted subcategory icons ---------------------
console.log('\n7B.4 Value row (price + accepted-value subcategory icons)');
const valueRow = read('components/marketplace/tiles/primitives/TileValueRow.tsx');
assert(!/push\('💶'\)|push\('🤝'\)/.test(valueRow), 'value row no longer renders ambiguous 💶/🤝 indicators');
const acceptedBuilder = read('lib/marketplace/tiles/build-tile-accepted-value-icons.ts');
assert(acceptedBuilder.includes('getMarketplaceTaxonomyItem') && acceptedBuilder.includes('resolveOfferBadgeByTaxonomyId'),
  'accepted-value icons resolved from taxonomy (subcategory-first)');
assert(acceptedBuilder.includes('ACCEPTED_VALUE_ICON_MAX') && acceptedBuilder.includes('overflowCount'),
  'accepted-value icons are capped with +N overflow');
const block = read('components/marketplace/tiles/primitives/TileValueExchangeBlock.tsx');
assert(block.includes('TileValueRow') && block.includes('TileAcceptedValueIcons'), 'value block composes price + accepted icons');

// --- 7B.5 Settlement row with distinct icons ---------------------------------
console.log('\n7B.5 Settlement row — distinct icons, no conflation');
const settlementBuilder = read('lib/marketplace/tiles/build-tile-settlement-row.ts');
assert(exists('lib/marketplace/tiles/build-tile-settlement-row.ts'), 'settlement-row builder present');
for (const flag of ['homecheffCheckout', 'directContact', 'barter', 'acceptedValues']) {
  assert(settlementBuilder.includes(flag), `settlement builder exposes ${flag}`);
}
assert(settlementBuilder.includes('canCheckoutNow') && settlementBuilder.includes('acceptsDirectContact'),
  'HomeCheff checkout vs direct contact resolved distinctly (canonical settlement options — Phase 7C)');
const settlementRow = read('components/marketplace/tiles/primitives/TileSettlementRow.tsx');
assert(exists('components/marketplace/tiles/primitives/TileSettlementRow.tsx'), 'settlement-row primitive present');
assert(settlementRow.includes('ShieldCheck'), 'HomeCheff checkout uses a shield/checkout icon (not a money bill)');
assert(settlementRow.includes('Banknote'), 'cash / direct contact uses a distinct banknote icon');
assert(settlementRow.includes('Handshake'), 'barter uses a distinct handshake icon');
assert(settlementRow.includes('ArrowLeftRight'), 'accepted alternative values uses a distinct exchange icon');
assert(!/StripeLogo|stripe[-_ ]?logo|\/stripe/i.test(settlementRow), 'no Stripe logo on the tile settlement row');
assert(settlementRow.includes('data-settlement={item.key}') && settlementRow.includes("key: 'homecheff'"),
  'settlement icons are individually addressable (data-settlement per item)');
assert(block.includes('TileSettlementRow') && block.includes('buildTileSettlementRow'), 'settlement row wired into the value block');

// --- 7B.12 No extra roundtrip: settlement derived from existing model --------
console.log('\n7B.12 Settlement derives from existing model (no extra fetch)');
assert(!/fetch\(|useSWR|useSessionSwr/.test(settlementBuilder + settlementRow), 'settlement row does no data fetching');

// --- i18n parity for settlement ---------------------------------------------
console.log('\ni18n parity — settlement labels');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
for (const k of ['aria', 'homecheff', 'direct', 'barter', 'acceptedValues']) {
  assert(!!get(nl, `marketplace.tile.settlement.${k}`) && !!get(en, `marketplace.tile.settlement.${k}`),
    `marketplace.tile.settlement.${k} present in nl + en`);
}
assert(/HomeCheff/.test(String(get(nl, 'marketplace.tile.settlement.homecheff'))) &&
  /HomeCheff/.test(String(get(en, 'marketplace.tile.settlement.homecheff'))),
  'HomeCheff checkout label references HomeCheff (user proposition, not Stripe)');

// --- 7B.6 Accepted values in create/edit are taxonomy-based ------------------
console.log('\n7B.6 Accepted values in create/edit are taxonomy-based');
const picker = read('components/products/marketplace/AcceptedValuesPicker.tsx');
assert(exists('components/products/marketplace/AcceptedValuesPicker.tsx'), 'AcceptedValuesPicker present');
assert(picker.includes('getAcceptedValueTaxonomyItems') && picker.includes('TaxonomyLucideIcon'),
  'picker sources options from taxonomy + renders taxonomy icons');
const offerForm = read('components/products/marketplace/MarketplaceOfferForm.tsx');
assert(offerForm.includes('acceptedSpecializations') && offerForm.includes('AcceptedValuesPicker'),
  'offer form saves acceptedSpecializations from the taxonomy picker');

// --- Performance / prior architecture frozen --------------------------------
console.log('\nPerformance architecture frozen (Phase 4/4B/4C/5/6/7A)');
const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
assert(density.includes('useSyncExternalStore') && density.includes('return 2'), 'density: external store + desktop default 2 columns');
assert(geoFeed.includes('flex flex-col gap-4 hc-feed-cards-column'), 'mobile feed default single column');
assert(read('lib/feed/home-feed-return-cache.ts').includes('isHomeFeedReturnCacheStale'), 'homepage SWR return cache preserved');
assert(read('lib/runtime/sessionSwrCache.ts').includes('SWR_FRESH_MS'), 'unified SWR cache (4C) preserved');
for (const guard of [
  'scripts/validate-first-run-clarity-phase7a.ts',
  'scripts/validate-shared-ui-phase6b.ts',
  'scripts/validate-design-system-phase6a.ts',
  'scripts/validate-discovery-pillars-phase5c.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
]) {
  assert(exists(guard), `prior guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
