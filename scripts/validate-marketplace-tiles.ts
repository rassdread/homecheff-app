#!/usr/bin/env npx tsx
/**
 * Marketplace tile T1 validation — pure function checks.
 * Run: npx tsx scripts/validate-marketplace-tiles.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  TILE_FIXTURE_LISTING_KINDS,
  TILE_VARIANTS,
  TILE_TRUST_FORBIDDEN_FIELDS,
  buildTileBadges,
  buildTilePriceLine,
  buildTileTrustCue,
  mapGeoFeedCardToTileModel,
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
    acceptedSpecializations: [],
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
      acceptedSpecializations: [],
      barterOpenness: null,
      trust: {
        product: { reviewCount: kind === 'PRODUCT' ? 5 : 0, tier: 3 },
        deal: { reviewCount: kind !== 'PRODUCT' && kind !== 'INSPIRATION' ? 8 : 0, tier: 3 },
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

console.log('=== Marketplace Tile Validation (Phase T1) ===\n');

assert(TILE_FIXTURE_LISTING_KINDS.length === 7, 'seven listing kinds in fixtures');
assert(TILE_VARIANTS.length === 4, 'compact + standard + mini + sidebar variants');

for (const kind of TILE_FIXTURE_LISTING_KINDS) {
  const model = modelForKind(kind);
  assert(model.listingKind === kind, `${kind} maps listingKind`);

  const compactBadges = buildTileBadges(model, t, 'compact');
  assert(compactBadges.badges.length <= 2, `${kind} compact ≤2 badges`);

  const standardBadges = buildTileBadges(model, t, 'standard');
  assert(standardBadges.badges.length <= 3, `${kind} standard ≤3 badges`);

  const price = buildTilePriceLine(model, t);
  assert(typeof price === 'string', `${kind} price line string`);

  const trust = buildTileTrustCue(model, t, 1);
  if (kind === 'INSPIRATION') {
    assert(trust === null, `${kind} no trust cue`);
  } else {
    assert(trust !== null || model.trust.sellerTier < 4, `${kind} trust cue ok`);
  }

  if (kind === 'REQUEST') {
    const hasRequest = compactBadges.badges.some((b) => b.kind === 'request');
    assert(hasRequest, 'REQUEST has Gezocht badge');
  }

  if (kind === 'WORKSHOP') {
    const hasDate = compactBadges.badges.some((b) => b.kind === 'workshop_date');
    assert(hasDate, 'WORKSHOP has date badge');
  }
}

for (const variant of TILE_VARIANTS) {
  const model = modelForKind('PRODUCT');
  const badges = buildTileBadges(model, t, variant);
  const max = variant === 'compact' ? 2 : 3;
  assert(badges.badges.length <= max, `${variant} badge cap`);
}

assert(
  TILE_TRUST_FORBIDDEN_FIELDS.includes('averageRating'),
  'averageRating forbidden',
);
assert(
  TILE_TRUST_FORBIDDEN_FIELDS.includes('viewCount'),
  'viewCount forbidden',
);

const feedCardsPath = path.join(
  process.cwd(),
  'components/feed/GeoFeedCards.tsx',
);
const feedCardsSrc = fs.readFileSync(feedCardsPath, 'utf8');
assert(
  !feedCardsSrc.includes('UserStatsTile'),
  'GeoFeedCards has no UserStatsTile import',
);

const tilesDir = path.join(process.cwd(), 'components/marketplace/tiles');
const tileFiles = fs.readdirSync(tilesDir).filter((f) => f.endsWith('.tsx'));
for (const file of tileFiles) {
  const src = fs.readFileSync(path.join(tilesDir, file), 'utf8');
  assert(!src.includes('UserStatsTile'), `${file} no UserStatsTile`);
  assert(!src.includes('averageRating'), `${file} no averageRating`);
}

const libTilesDir = path.join(process.cwd(), 'lib/marketplace/tiles');
for (const file of fs.readdirSync(libTilesDir).filter((f) => f.endsWith('.ts'))) {
  const src = fs.readFileSync(path.join(libTilesDir, file), 'utf8');
  assert(!src.includes('UserStatsTile'), `lib/${file} no UserStatsTile`);
  const usesAverageRating =
    src.includes('averageRating') &&
    !src.includes("TILE_TRUST_FORBIDDEN_FIELDS");
  assert(!usesAverageRating, `lib/${file} no averageRating usage`);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
