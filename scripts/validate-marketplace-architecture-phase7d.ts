#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 7D — Canonical Marketplace Architecture guard.
 *
 * Locks in the three-axis Information Architecture and verifies every surface
 * consumes the SAME model, in the SAME order, with NO second truth:
 *
 *   7D.1  Canonical model: Intent / Category / Settlement axes exist & are frozen.
 *   7D.2  Discovery filters: VIEW (All/Offered/Wanted/Inspiration) + CATEGORY
 *         (Food/Garden/Creations/Services). Services only under Category.
 *   7D.3  Offered = every value form (barter-only, accepted-values-only,
 *         on-request, voluntary, direct-contact-only). Settlement never filters.
 *   7D.4/5/6  Universal tile: category badge + accepted values NEXT TO price,
 *         settlement row ALWAYS at the bottom (build-tile-* helpers).
 *   7D.7  One primary category badge per tile.
 *   7D.8  Tile Router / Standard / Compact / Mini / Preview + Profile / Favorites
 *         share the same primitives (mini/sidebar reduce, never reorder).
 *   7D.9  Data integrity: axes derive from the single canonical model.
 *   7D.10 Performance: canonical model adds no fetch / prisma runtime path.
 *
 * Run: npx tsx scripts/validate-marketplace-architecture-phase7d.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MARKETPLACE_VIEW_INTENTS,
  MARKETPLACE_CANONICAL_CATEGORIES,
  MARKETPLACE_SETTLEMENT_METHODS,
  MARKETPLACE_VIEW_INTENT_LABEL_KEYS,
  MARKETPLACE_CATEGORY_LABEL_KEYS,
  isValidViewIntent,
  isValidCanonicalCategory,
  viewIntentToLegacyFilter,
  prismaCategoryToCanonical,
  resolveItemViewIntent,
  isServicesCategoryItem,
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

console.log('=== UX-FIN Phase 7D — Canonical Marketplace Architecture ===\n');

// --- 7D.1 Canonical model ---------------------------------------------------
console.log('7D.1 Canonical marketplace model');
assert(exists('lib/marketplace/canonical-model.ts'), 'canonical-model module present');

// AXIS 1 — Intent
assert(
  JSON.stringify([...MARKETPLACE_VIEW_INTENTS]) ===
    JSON.stringify(['ALL', 'OFFERED', 'WANTED', 'INSPIRATION']),
  'Intent axis = All / Offered / Wanted / Inspiration',
);
assert(!isValidViewIntent('SERVICES'), 'Services is NOT a view intent');
assert(!isValidViewIntent('FOR_SALE'), 'no "For sale" intent (Offered covers all)');
assert(isValidViewIntent('OFFERED'), 'Offered is a valid intent');

// AXIS 2 — Category
assert(
  JSON.stringify([...MARKETPLACE_CANONICAL_CATEGORIES]) ===
    JSON.stringify(['FOOD', 'GARDEN', 'CREATIONS', 'SERVICES']),
  'Category axis = Food / Garden / Creations / Services',
);
assert(isValidCanonicalCategory('SERVICES'), 'Services IS a category');
assert(!isValidCanonicalCategory('HOME_CHEFF'), 'branding (HomeCheff) is not a category');
assert(!isValidCanonicalCategory('HOMEDESIGNER'), 'branding (HomeDesigner) is not a category');

// AXIS 3 — Settlement
assert(
  JSON.stringify([...MARKETPLACE_SETTLEMENT_METHODS]) ===
    JSON.stringify([
      'HOMECHEFF_CHECKOUT',
      'DIRECT_CONTACT',
      'BARTER',
      'ALTERNATIVE_VALUES',
    ]),
  'Settlement axis = Checkout / Direct / Barter / Alternative values',
);

// --- 7D.2 Discovery filters -------------------------------------------------
console.log('\n7D.2 Discovery filters (VIEW + CATEGORY)');
assert(viewIntentToLegacyFilter('ALL') === 'all', 'ALL → legacy "all" chip');
assert(viewIntentToLegacyFilter('OFFERED') === 'sale', 'OFFERED → legacy "sale" chip');
assert(viewIntentToLegacyFilter('WANTED') === 'gezocht', 'WANTED → legacy "gezocht" chip');
assert(
  viewIntentToLegacyFilter('INSPIRATION') === 'inspiration',
  'INSPIRATION → legacy "inspiration" chip',
);
assert(
  !(MARKETPLACE_VIEW_INTENTS as readonly string[]).includes('SERVICES'),
  'Services never mixed into the VIEW axis',
);

// --- 7D.3 Filtering rules (Offered = every value form) ----------------------
console.log('\n7D.3 Offered covers every value form (settlement never filters)');
const barterOnly = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  orderMethod: 'CONTACT',
  priceCents: 0,
  priceModel: 'ON_REQUEST',
} as const;
const acceptedValuesOnly = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  orderMethod: 'CONTACT',
  priceModel: 'ON_REQUEST',
  priceCents: 0,
} as const;
const onRequest = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  priceModel: 'ON_REQUEST',
  priceCents: 0,
} as const;
const voluntary = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  priceModel: 'VOLUNTARY',
  priceCents: 0,
} as const;
const directContactOnly = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  orderMethod: 'CONTACT',
  priceCents: 0,
} as const;
const fixedPrice = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  priceModel: 'FIXED',
  priceCents: 1850,
} as const;
const request = {
  feedSource: 'PRODUCT',
  listingIntent: 'REQUEST',
  priceModel: 'ON_REQUEST',
} as const;

assert(resolveItemViewIntent(barterOnly) === 'OFFERED', 'barter-only stays Offered');
assert(
  resolveItemViewIntent(acceptedValuesOnly) === 'OFFERED',
  'accepted-values-only stays Offered',
);
assert(resolveItemViewIntent(onRequest) === 'OFFERED', 'price-on-request stays Offered');
assert(resolveItemViewIntent(voluntary) === 'OFFERED', 'voluntary contribution stays Offered');
assert(
  resolveItemViewIntent(directContactOnly) === 'OFFERED',
  'direct-contact-only stays Offered',
);
assert(resolveItemViewIntent(fixedPrice) === 'OFFERED', 'fixed-price stays Offered');
assert(resolveItemViewIntent(request) === 'WANTED', 'REQUEST resolves to Wanted');

// --- Services is a category INSIDE Offered ----------------------------------
console.log('\n7D.1 Services = category inside Offered (not an intent)');
const service = {
  feedSource: 'PRODUCT',
  listingIntent: 'OFFER',
  listingKind: 'SERVICE',
  priceModel: 'ON_REQUEST',
  priceCents: 0,
} as const;
assert(isServicesCategoryItem(service), 'service item recognised by category predicate');
assert(
  resolveItemViewIntent(service) === 'OFFERED',
  'a service is always Offered (never a competing intent)',
);

// --- Prisma category → canonical (single-source bridge) ---------------------
console.log('\n7D.9 Category derives from the single main-category source');
assert(prismaCategoryToCanonical('CREATE') === 'FOOD', 'CREATE → Food');
assert(prismaCategoryToCanonical('GROW') === 'GARDEN', 'GROW → Garden');
assert(prismaCategoryToCanonical('DESIGN') === 'CREATIONS', 'DESIGN → Creations');
assert(
  prismaCategoryToCanonical('ARTISTIC_SERVICE') === 'CREATIONS',
  'ARTISTIC_SERVICE → Creations',
);
assert(
  prismaCategoryToCanonical('PRACTICAL_SERVICE') === 'SERVICES',
  'PRACTICAL_SERVICE → Services',
);
assert(prismaCategoryToCanonical('KNOWLEDGE') === 'SERVICES', 'KNOWLEDGE → Services');
{
  const src = read('lib/marketplace/canonical-model.ts');
  assert(
    src.includes('marketplaceCategoryToMainCategory'),
    'canonical category bridges the EXISTING main-category source (no parallel table)',
  );
}

// --- 7D.4/5/6 Universal tile: accepted next to price, settlement at bottom --
console.log('\n7D.4/5/6 Universal tile structure');
{
  const veb = read('components/marketplace/tiles/primitives/TileValueExchangeBlock.tsx');
  assert(veb.includes('buildTileValueRow'), 'value row uses buildTileValueRow (price)');
  assert(
    veb.includes('buildTileAcceptedValueIcons'),
    'accepted values use build-tile-accepted-value-icons (taxonomy)',
  );
  assert(
    veb.includes('buildTileSettlementRow'),
    'settlement row uses build-tile-settlement-row',
  );
  // accepted next to price: value row + accepted composed in one flex row,
  // settlement rendered on its own row afterwards.
  const valueIdx = veb.lastIndexOf('TileValueRow');
  const acceptedIdx = veb.lastIndexOf('TileAcceptedValueIcons');
  const settlementIdx = veb.lastIndexOf('TileSettlementRow');
  assert(
    valueIdx > -1 && acceptedIdx > valueIdx,
    'accepted-value icons render next to the price (same block)',
  );
  assert(
    settlementIdx > acceptedIdx,
    'settlement row renders AFTER price + accepted (bottom of block)',
  );
  assert(
    veb.includes("variant !== 'mini' && variant !== 'sidebar'"),
    'settlement suppressed only on reduced mini/sidebar variants',
  );
}
{
  const valueRow = read('components/marketplace/tiles/primitives/TileValueRow.tsx');
  assert(
    !valueRow.includes('💶') && !valueRow.includes('🤝'),
    'no settlement icons live next to the price (7B/7D.5)',
  );
}

// --- 7D.7 One primary category badge ----------------------------------------
console.log('\n7D.7 One primary category badge');
{
  const badges = read('lib/marketplace/tiles/build-tile-badges.ts');
  assert(
    badges.includes('offer_category') && badges.includes("kind !== 'listing_kind'"),
    'category badge dedupes redundant listing_kind badge (single primary)',
  );
}

// --- 7D.8 Tile consistency across surfaces ----------------------------------
console.log('\n7D.8 Tile consistency (same primitives, same order)');
const PRIMS = ['TileMedia', 'TilePersonRow', 'TileValueExchangeBlock', 'TileTrustCue'];
for (const comp of ['MarketplaceTileStandard', 'MarketplaceTileCompact', 'MarketplaceTileMini']) {
  const src = read(`components/marketplace/tiles/${comp}.tsx`);
  // lastIndexOf targets the JSX usage (after the import block).
  const idx = PRIMS.map((p) => src.lastIndexOf(p));
  const ordered = idx.every((v, i) => v > -1 && (i === 0 || v > idx[i - 1]));
  assert(ordered, `${comp}: media → maker → value/settlement → trust order`);
}
{
  const router = read('components/marketplace/tiles/MarketplaceTileRouter.tsx');
  assert(
    ['MarketplaceTileMini', 'MarketplaceTileSidebar', 'MarketplaceTileStandard', 'MarketplaceTileCompact'].every(
      (v) => router.includes(v),
    ),
    'router covers standard / compact / mini / sidebar variants',
  );
}
assert(
  read('components/feed/FeedMarketplaceCard.tsx').includes('MarketplaceTileRouter'),
  'Feed/Discover/Search/Wanted/Services card → MarketplaceTileRouter',
);
assert(
  read('components/marketplace/tiles/ProfilePublicAanbodTileGrid.tsx').includes('MarketplaceTileMini') &&
    read('components/marketplace/tiles/ProfilePublicAanbodTileGrid.tsx').includes('mapProfileListingToTileModel'),
  'Profile grid → shared model + MarketplaceTileMini',
);
assert(
  read('components/FavoritesGrid.tsx').includes('MarketplaceTileMini'),
  'Favorites grid → MarketplaceTileMini',
);
assert(
  read('components/marketplace/previews/MarketplacePreviewCard.tsx').length > 0,
  'Preview → MarketplacePreviewCard present',
);

// --- 7D.9 Data integrity: model is single source ----------------------------
console.log('\n7D.9 Data integrity (single canonical model)');
{
  const types = read('lib/marketplace/tiles/types.ts');
  assert(
    types.includes('acceptsHomeCheffCheckout') && types.includes('acceptsDirectContact'),
    'tile model carries canonical settlement booleans (not derived per-UI)',
  );
  assert(
    Object.keys(MARKETPLACE_VIEW_INTENT_LABEL_KEYS).length === MARKETPLACE_VIEW_INTENTS.length &&
      Object.keys(MARKETPLACE_CATEGORY_LABEL_KEYS).length ===
        MARKETPLACE_CANONICAL_CATEGORIES.length,
    'every axis value has exactly one label key (no orphan labels)',
  );
}

// --- 7D.10 Performance ------------------------------------------------------
console.log('\n7D.10 Performance (no new fetch / runtime prisma path)');
{
  const src = read('lib/marketplace/canonical-model.ts');
  assert(!/\bfetch\s*\(/.test(src), 'canonical model does not fetch');
  assert(!src.includes('useEffect'), 'canonical model has no client effects');
  assert(!src.includes('prisma.'), 'canonical model runs no prisma queries');
}

// --- i18n parity ------------------------------------------------------------
console.log('\ni18n — canonical view/category labels (NL/EN parity)');
const nl = json('public/i18n/nl.json');
const en = json('public/i18n/en.json');
for (const key of [
  ...Object.values(MARKETPLACE_VIEW_INTENT_LABEL_KEYS),
  ...Object.values(MARKETPLACE_CATEGORY_LABEL_KEYS),
]) {
  assert(typeof get(nl, key) === 'string', `nl ${key}`);
  assert(typeof get(en, key) === 'string', `en ${key}`);
}

// --- Deliverables -----------------------------------------------------------
console.log('\nDeliverables');
assert(
  exists('docs/audits/MARKETPLACE_ARCHITECTURE_PHASE7D_AUDIT.md'),
  'audit doc present',
);
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE7D_MARKETPLACE_ARCHITECTURE.md'),
  'progress doc present',
);

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
