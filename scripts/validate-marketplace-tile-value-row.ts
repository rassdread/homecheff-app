#!/usr/bin/env npx tsx
/**
 * Marketplace tile value row + accepted value icons — Phase 5B-C.
 * Run: npx tsx scripts/validate-marketplace-tile-value-row.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ACCEPTED_VALUE_ICON_MAX,
  buildTileAcceptedValueIcons,
  buildTileBadges,
  buildTileTrustCue,
  buildTileValueRow,
  mapGeoFeedCardToTileModel,
  type TranslateFn,
} from '../lib/marketplace/tiles';
import type { GeoFeedCardItem } from '../components/feed/GeoFeedCards';

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

const t: TranslateFn = (key, params) => {
  let s = key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(`{{${k}}}`, String(v));
    }
  }
  return s;
};

function productItem(overrides: Partial<GeoFeedCardItem> = {}): GeoFeedCardItem {
  const base = {
    id: 'tile-value-fixture',
    title: 'Test product',
    priceCents: 1500,
    priceModel: 'FIXED',
    listingKind: 'PRODUCT',
    listingIntent: 'OFFER',
    marketplaceCategory: 'CREATE',
    specializations: ['create.meal'],
    acceptedSpecializations: [],
    barterOpenness: 'MONEY',
    discovery: {
      id: 'tile-value-fixture',
      entityType: 'product',
      listingKind: 'PRODUCT',
      listingIntent: 'OFFER',
      title: 'Test product',
      slug: null,
      description: null,
      coverImage: '/x.webp',
      imageCount: 1,
      videoCount: 0,
      city: 'Utrecht',
      region: null,
      country: null,
      distanceKm: 2,
      marketplaceCategory: 'CREATE',
      specializations: ['create.meal'],
      acceptedSpecializations: [],
      barterOpenness: 'MONEY',
      trust: {
        product: { reviewCount: 3, tier: 3 },
        deal: { reviewCount: 0, tier: 0 },
        courier: { reviewCount: 0, tier: 0 },
        completedDeals: 0,
        completedDeliveries: 0,
        repeatCustomers: 0,
        trustBadges: [],
        sellerTier: 3,
        buyerTier: 0,
        courierTier: 0,
      },
      social: { favoriteCount: 0, fansCount: 0, workspacePropsCount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: null,
      availabilityDate: null,
      isActive: true,
      capability: {
        sellerRoles: ['seller'],
        hasSellerCapability: true,
        hasCourierCapability: false,
        hasCreatorCapability: false,
      },
    },
  } as GeoFeedCardItem;
  return { ...base, ...overrides };
}

console.log('=== Marketplace Tile Value Row Validation (Phase 5B-C) ===\n');

console.log('5B-C.1 Value row');
const moneyModel = mapGeoFeedCardToTileModel(productItem(), {
  href: '/product/x',
  mode: 'sale',
});
const moneyRow = buildTileValueRow(moneyModel, t);
assert(moneyRow != null, 'value row when price exists');
assert(moneyRow?.showMoneyIndicator === true, 'money indicator for priced offer');
assert(moneyRow?.priceLabel.includes('€'), 'price label shows euro amount');

const hybridModel = mapGeoFeedCardToTileModel(
  productItem({
    barterOpenness: 'MONEY_AND_BARTER',
    acceptedSpecializations: ['grow.basil'],
    discovery: {
      ...productItem().discovery!,
      barterOpenness: 'MONEY_AND_BARTER',
      acceptedSpecializations: ['grow.basil'],
    },
  }),
  { href: '/product/hybrid', mode: 'sale' },
);
const hybridRow = buildTileValueRow(hybridModel, t);
assert(hybridRow?.showMoneyIndicator && hybridRow?.showBarterIndicator, 'hybrid 💶 🤝');

const barterOnlyModel = mapGeoFeedCardToTileModel(
  productItem({
    priceCents: 0,
    barterOpenness: 'BARTER_ONLY',
    discovery: {
      ...productItem().discovery!,
      barterOpenness: 'BARTER_ONLY',
    },
  }),
  { href: '/product/barter', mode: 'sale' },
);
const barterRow = buildTileValueRow(barterOnlyModel, t);
assert(barterRow?.showBarterIndicator && !barterRow?.showMoneyIndicator, 'barter-only row');

const emptyAccepted = buildTileAcceptedValueIcons(moneyModel, t, 'standard');
assert(emptyAccepted === null, 'no accepted icons without data');

console.log('\n5B-C.2 Accepted value icons (subcategory-first)');
const multiAccepted = mapGeoFeedCardToTileModel(
  productItem({
    acceptedSpecializations: [
      'create.cuisine_surinamese',
      'grow.basil',
      'artistic.portrait',
    ],
    discovery: {
      ...productItem().discovery!,
      acceptedSpecializations: [
        'create.cuisine_surinamese',
        'grow.basil',
        'artistic.portrait',
      ],
    },
  }),
  { href: '/product/multi', mode: 'sale' },
);
const standardIcons = buildTileAcceptedValueIcons(multiAccepted, t, 'standard');
assert((standardIcons?.icons.length ?? 0) === 3, 'three subcategory icons resolved');
assert(
  standardIcons?.icons.every((i) => i.ariaLabel.length > 0 && i.tooltipLabel.length > 0),
  'aria labels and tooltips on accepted icons',
);

console.log('\n5B-C.4 Density');
assert(ACCEPTED_VALUE_ICON_MAX.compact === 2, 'compact max 2 icons');
assert(ACCEPTED_VALUE_ICON_MAX.standard === 4, 'standard max 4 icons');
const overflowIcons = buildTileAcceptedValueIcons(
  mapGeoFeedCardToTileModel(
    productItem({
      acceptedSpecializations: [
        'create.cuisine_surinamese',
        'grow.basil',
        'grow.herbs',
        'grow.tomato',
        'grow.pepper',
      ],
      discovery: {
        ...productItem().discovery!,
        acceptedSpecializations: [
          'create.cuisine_surinamese',
          'grow.basil',
          'grow.herbs',
          'grow.tomato',
          'grow.pepper',
        ],
      },
    }),
    { href: '/product/overflow', mode: 'sale' },
  ),
  t,
  'compact',
);
assert((overflowIcons?.icons.length ?? 0) === 2, 'compact caps at 2');
assert((overflowIcons?.overflowCount ?? 0) >= 1, 'compact overflow +N');

console.log('\n5B-C.5 REQUEST tiles');
const requestModel = mapGeoFeedCardToTileModel(
  productItem({
    listingKind: 'REQUEST',
    listingIntent: 'REQUEST',
    priceCents: 0,
    discovery: {
      ...productItem().discovery!,
      listingKind: 'REQUEST',
      listingIntent: 'REQUEST',
    },
  }),
  { href: '/request/x', mode: 'sale' },
);
const requestRow = buildTileValueRow(requestModel, t);
assert(requestRow != null, 'REQUEST value row when proposal welcome');
const requestBadges = buildTileBadges(requestModel, t, 'compact');
assert(
  requestBadges.badges.some((b) => b.kind === 'request'),
  'REQUEST 🙋 badge on media',
);
assert(
  !requestBadges.badges.some((b) => b.kind === 'offer_category'),
  'no duplicate offer category on REQUEST',
);

console.log('\n5B-C.7 Trust row');
const trustCompact = buildTileTrustCue(moneyModel, t, 2);
assert((trustCompact?.segments.length ?? 0) <= 2, 'compact trust max 2');
const trustStandard = buildTileTrustCue(moneyModel, t, 3);
assert((trustStandard?.segments.length ?? 0) <= 3, 'standard trust max 3');

console.log('\n5B-C.8 i18n parity');
const I18N_KEYS = [
  'marketplace.tile.valueRow.onRequest',
  'marketplace.tile.valueRow.barterOpen',
  'marketplace.tile.valueRow.voluntary',
  'marketplace.tile.valueRow.proposalWelcome',
  'marketplace.tile.valueRow.requestBudget',
  'marketplace.tile.acceptedValues.aria',
] as const;
for (const locale of ['nl', 'en'] as const) {
  const dict = loadI18n(locale);
  for (const key of I18N_KEYS) {
    const val = getNested(dict, key);
    assert(typeof val === 'string' && val.length > 0, `${locale}: ${key}`);
  }
}

console.log('\n5B-C.9 Analytics + wiring');
const analyticsSrc = fs.readFileSync(
  path.join(process.cwd(), 'lib/marketplace/tiles/tile-value-analytics.ts'),
  'utf8',
);
assert(
  analyticsSrc.includes('marketplace_tile_value_row_seen'),
  'tile value row analytics event',
);
const valueRowSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/marketplace/tiles/primitives/TileValueRow.tsx'),
  'utf8',
);
assert(valueRowSrc.includes('trackMarketplaceTileValueRowSeen'), 'TileValueRow tracks seen');

const tilesDir = path.join(process.cwd(), 'components/marketplace/tiles');
for (const file of [
  'MarketplaceTileCompact.tsx',
  'MarketplaceTileStandard.tsx',
  'MarketplaceTileMini.tsx',
]) {
  const src = fs.readFileSync(path.join(tilesDir, file), 'utf8');
  assert(!src.includes('UserStatsTile'), `${file} no UserStatsTile`);
  assert(!src.includes('averageRating'), `${file} no blended ratings`);
  assert(!src.includes('hcp'), `${file} no HCP in tile surface`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
