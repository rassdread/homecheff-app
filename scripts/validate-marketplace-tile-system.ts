#!/usr/bin/env npx tsx
/**
 * Marketplace tile system validation (T1 + T2).
 * Run: npx tsx scripts/validate-marketplace-tile-system.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  TILE_FIXTURE_LISTING_KINDS,
  TILE_VARIANTS,
  TILE_TRUST_CHANNEL_BY_KIND,
  TILE_BADGE_PRIORITY,
  TILE_BADGE_MAX,
  buildTileBadges,
  buildTilePriceLine,
  buildTileTrustCue,
  mapGeoFeedCardToTileModel,
  usesProductTrustChannel,
  usesDealTrustChannel,
  type MarketplaceTileModel,
  type TranslateFn,
} from '../lib/marketplace/tiles';
import type { ListingKind } from '../lib/marketplace/contracts/listing-kind-contract';
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

const t: TranslateFn = (key, params) => {
  let s = key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      s = s.replace(`{{${k}}}`, String(v));
    }
  }
  return s;
};

function baseItem(kind: ListingKind): GeoFeedCardItem {
  return {
    id: `fixture-${kind}`,
    title: `Fixture ${kind}`,
    description: 'Test',
    priceCents: 1200,
    priceModel: 'FIXED',
    deliveryMode: 'PICKUP',
    place: 'Rotterdam',
    photo: '/placeholder.webp',
    distanceKm: 3,
    listingKind: kind,
    listingIntent: kind === 'REQUEST' ? 'REQUEST' : 'OFFER',
    marketplaceCategory: kind === 'PRODUCT' ? 'CREATE' : 'PRACTICAL_SERVICE',
    specializations:
      kind === 'WORKSHOP' ? ['knowledge.cookingclass'] : ['create.meal'],
    acceptedSpecializations: ['grow.vegetables'],
    sellerUserId: 'user-1',
    sellerName: 'Test Maker',
    sellerUsername: 'testmaker',
    discovery: {
      id: `fixture-${kind}`,
      entityType: kind === 'INSPIRATION' ? 'dish' : 'product',
      listingKind: kind,
      listingIntent: kind === 'REQUEST' ? 'REQUEST' : 'OFFER',
      title: `Fixture ${kind}`,
      slug: null,
      description: 'Test',
      coverImage: '/placeholder.webp',
      imageCount: 1,
      videoCount: 0,
      city: 'Rotterdam',
      region: null,
      country: null,
      distanceKm: 3,
      marketplaceCategory: 'CREATE',
      specializations:
        kind === 'WORKSHOP' ? ['knowledge.cookingclass'] : ['create.meal'],
      acceptedSpecializations: ['grow.vegetables'],
      barterOpenness: null,
      trust: {
        product: { reviewCount: kind === 'PRODUCT' ? 5 : 0, tier: 3 },
        deal: {
          reviewCount: kind !== 'PRODUCT' && kind !== 'INSPIRATION' ? 8 : 0,
          tier: 3,
        },
        courier: { reviewCount: 0, tier: 0 },
        completedDeals: 8,
        completedDeliveries: 0,
        repeatCustomers: 1,
        trustBadges: [],
        sellerTier: 4,
        buyerTier: 0,
        courierTier: 0,
      },
      social: { favoriteCount: 2, fansCount: 0, workspacePropsCount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: null,
      availabilityDate:
        kind === 'WORKSHOP' ? '2026-07-12T14:00:00.000Z' : null,
      isActive: true,
      capability: {
        sellerRoles: ['seller'],
        hasSellerCapability: true,
        hasCourierCapability: false,
        hasCreatorCapability: false,
      },
    },
  };
}

function modelForKind(kind: ListingKind): MarketplaceTileModel {
  const mode = kind === 'INSPIRATION' ? 'inspiration' : 'sale';
  return mapGeoFeedCardToTileModel(baseItem(kind), {
    href: `/product/${kind}`,
    mode,
    inspirationCategoryLabel:
      kind === 'INSPIRATION' ? 'Recept' : undefined,
  });
}

console.log('=== Marketplace Tile System Validation (T1 + T2) ===\n');

assert(TILE_FIXTURE_LISTING_KINDS.length === 7, 'seven listing kinds');
assert(TILE_VARIANTS.length === 4, 'four tile variants (compact/standard/mini/sidebar)');

for (const kind of TILE_FIXTURE_LISTING_KINDS) {
  const model = modelForKind(kind);
  const channel = TILE_TRUST_CHANNEL_BY_KIND[kind];
  assert(model.listingKind === kind, `${kind} maps listingKind`);

  if (kind === 'PRODUCT') assert(usesProductTrustChannel(kind), 'PRODUCT uses product channel');
  if (['SERVICE', 'TASK', 'WORKSHOP', 'COACHING', 'REQUEST'].includes(kind)) {
    assert(usesDealTrustChannel(kind), `${kind} uses deal channel`);
  }

  const trust = buildTileTrustCue(model, t, 1);
  if (channel === 'none') {
    assert(trust === null, `${kind} no trust cue`);
  } else if (channel === 'product') {
    assert(
      trust?.segments.some((s) => s.includes('productReviews')) ?? false,
      `${kind} product trust cue`,
    );
  } else if (channel === 'deal') {
    assert(
      trust?.segments.some((s) => s.includes('trust.deals') || s.includes('🤝')) ?? false,
      `${kind} deal trust cue`,
    );
  }

  for (const variant of TILE_VARIANTS) {
    const { badges } = buildTileBadges(model, t, variant);
    assert(
      badges.length <= TILE_BADGE_MAX[variant],
      `${kind} ${variant} badge cap`,
    );
  }

  const compactBadges = buildTileBadges(model, t, 'compact');
  assert(
    !compactBadges.badges.some((b) => b.kind === 'accepted_value'),
    `${kind} compact hides accepted value`,
  );

  if (kind === 'REQUEST') {
    assert(
      compactBadges.badges.some((b) => b.kind === 'request'),
      'REQUEST Gezocht badge',
    );
    const price = buildTilePriceLine(model, t);
    assert(!price.includes('€12'), 'REQUEST no checkout price');
  }

  if (kind === 'WORKSHOP') {
    assert(
      compactBadges.badges.some((b) => b.kind === 'workshop_date'),
      'WORKSHOP date badge',
    );
  }
}

assert(TILE_BADGE_PRIORITY.includes('request'), 'request in badge priority');

const bbqModel = mapGeoFeedCardToTileModel(
  {
    ...baseItem('PRODUCT'),
    specializations: ['create.bbq'],
    discovery: {
      ...baseItem('PRODUCT').discovery!,
      specializations: ['create.bbq'],
      marketplaceCategory: 'CREATE',
    },
  },
  { href: '/product/bbq', mode: 'sale' },
);
const bbqBadges = buildTileBadges(bbqModel, t, 'compact');
const specBadge = bbqBadges.badges.find((b) => b.kind === 'specialization');
assert(!!specBadge?.icon, 'BBQ specialization badge has icon');
assert(specBadge?.icon === 'Flame', 'BBQ uses Flame taxonomy icon');
assert(specBadge?.taxonomyId === 'create.bbq', 'BBQ badge uses canonical taxonomy id');

const acceptedModel = mapGeoFeedCardToTileModel(
  {
    ...baseItem('PRODUCT'),
    acceptedSpecializations: ['grow.houseplants'],
    discovery: {
      ...baseItem('PRODUCT').discovery!,
      acceptedSpecializations: ['grow.houseplants'],
    },
  },
  { href: '/product/plants', mode: 'sale' },
);
const acceptedBadges = buildTileBadges(acceptedModel, t, 'standard');
const acceptedBadge = acceptedBadges.badges.find((b) => b.kind === 'accepted_value');
assert(!!acceptedBadge?.icon, 'accepted value badge has icon');
assert(
  acceptedBadge?.taxonomyId === 'grow.houseplants',
  'accepted badge uses taxonomy id',
);
assert(!!acceptedBadges.barterSlot?.reserved, 'barter slot reserved when accepted values');

const componentsDir = path.join(process.cwd(), 'components/marketplace/tiles');
const variantFiles = [
  'MarketplaceTileCompact.tsx',
  'MarketplaceTileStandard.tsx',
  'MarketplaceTileMini.tsx',
  'MarketplaceTileSidebar.tsx',
];
for (const file of variantFiles) {
  assert(fs.existsSync(path.join(componentsDir, file)), `${file} exists`);
}

const primitiveFiles = [
  'TileMedia.tsx',
  'TilePersonRow.tsx',
  'TileBadgeRow.tsx',
  'TileTrustCue.tsx',
  'TilePriceLine.tsx',
];
for (const file of primitiveFiles) {
  assert(
    fs.existsSync(path.join(componentsDir, 'primitives', file)),
    `primitive ${file} exists`,
  );
}

for (const file of variantFiles) {
  const src = fs.readFileSync(path.join(componentsDir, file), 'utf8');
  assert(
    src.includes('primitives'),
    `${file} uses shared primitives`,
  );
  assert(!src.includes('UserStatsTile'), `${file} no UserStatsTile`);
  assert(!src.includes('averageRating'), `${file} no averageRating`);
}

const badgeRowSrc = fs.readFileSync(
  path.join(componentsDir, 'primitives', 'TileBadgeRow.tsx'),
  'utf8',
);
assert(badgeRowSrc.includes('TaxonomyLucideIcon'), 'TileBadgeRow renders Lucide icons');
assert(badgeRowSrc.includes('taxonomyId'), 'TileBadgeRow keys by taxonomyId');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
