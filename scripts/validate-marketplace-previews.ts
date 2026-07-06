#!/usr/bin/env npx tsx
/**
 * Marketplace preview layer validation (T3).
 * Run: npx tsx scripts/validate-marketplace-previews.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  TILE_FIXTURE_LISTING_KINDS,
  mapGeoFeedCardToTileModel,
  type MarketplaceTileModel,
  type TranslateFn,
} from '../lib/marketplace/tiles';
import {
  PREVIEW_ACCEPTED_MAX,
  PREVIEW_FORBIDDEN_SIGNALS,
  buildMarketplacePreviewContent,
  buildPreviewAcceptedValues,
  buildPreviewTrustExpansion,
} from '../lib/marketplace/previews';
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
    id: `preview-${kind}`,
    title: `Preview ${kind}`,
    description: 'Preview description body',
    priceCents: 2500,
    priceModel: 'FIXED',
    deliveryMode: 'BOTH',
    place: 'Utrecht',
    photo: '/placeholder.webp',
    distanceKm: 2,
    listingKind: kind,
    listingIntent: kind === 'REQUEST' ? 'REQUEST' : 'OFFER',
    marketplaceCategory: kind === 'PRODUCT' ? 'CREATE' : 'PRACTICAL_SERVICE',
    specializations:
      kind === 'WORKSHOP' ? ['knowledge.cookingclass'] : ['create.meal'],
    acceptedSpecializations: [
      'create.meal',
      'grow.vegetables',
      'design.logo',
      'practical.gardenwork',
      'knowledge.cookingclass',
      'artistic.tattoo',
      'grow.herbs',
      'grow.tomato',
    ],
    sellerUserId: 'user-preview',
    sellerName: 'Preview Seller',
    sellerUsername: 'previewseller',
    discovery: {
      id: `preview-${kind}`,
      entityType: kind === 'INSPIRATION' ? 'dish' : 'product',
      listingKind: kind,
      listingIntent: kind === 'REQUEST' ? 'REQUEST' : 'OFFER',
      title: `Preview ${kind}`,
      slug: null,
      description: 'Preview description body',
      coverImage: '/placeholder.webp',
      imageCount: 1,
      videoCount: 0,
      city: 'Utrecht',
      region: null,
      country: null,
      distanceKm: 2,
      marketplaceCategory: 'CREATE',
      specializations:
        kind === 'WORKSHOP' ? ['knowledge.cookingclass'] : ['create.meal'],
      acceptedSpecializations: [
        'create.meal',
        'grow.vegetables',
        'design.logo',
        'practical.gardenwork',
        'knowledge.cookingclass',
        'artistic.tattoo',
        'grow.herbs',
        'grow.tomato',
      ],
      barterOpenness: kind === 'PRODUCT' ? 'MONEY_AND_BARTER' : null,
      trust: {
        product: { reviewCount: kind === 'PRODUCT' ? 4 : 0, tier: 3 },
        deal: { reviewCount: kind !== 'PRODUCT' && kind !== 'INSPIRATION' ? 6 : 0, tier: 3 },
        courier: { reviewCount: 2, tier: 2 },
        completedDeals: 10,
        completedDeliveries: 3,
        repeatCustomers: 2,
        trustBadges: [{ key: 'verified', name: 'Verified' }],
        sellerTier: 4,
        buyerTier: 0,
        courierTier: 0,
      },
      social: { favoriteCount: 1, fansCount: 0, workspacePropsCount: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: null,
      availabilityDate:
        kind === 'WORKSHOP' || kind === 'REQUEST'
          ? '2026-08-01T10:00:00.000Z'
          : null,
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
    href: `/product/preview-${kind}`,
    mode,
    inspirationCategoryLabel: kind === 'INSPIRATION' ? 'Recept' : undefined,
  });
}

function assertPreviewFilesExist() {
  console.log('\nPreview component files');
  const root = path.join(process.cwd(), 'components/marketplace/previews');
  for (const file of [
    'MarketplacePreviewCard.tsx',
    'MarketplaceHoverPreview.tsx',
    'MarketplaceLongPressPreview.tsx',
    'MarketplacePreviewShell.tsx',
    'index.ts',
  ]) {
    assert(fs.existsSync(path.join(root, file)), `${file} exists`);
  }
}

function assertAllListingKinds() {
  console.log('\nPreview content per ListingKind');
  for (const kind of TILE_FIXTURE_LISTING_KINDS) {
    const model = modelForKind(kind);
    const content = buildMarketplacePreviewContent(model, t);
    assert(content.listingKind === kind, `${kind}: listingKind matches`);
    assert(Boolean(content.title), `${kind}: has title`);

    if (kind === 'INSPIRATION') {
      assert(content.showTrust === false, `${kind}: no trust section`);
      assert(content.trustLines.length === 0, `${kind}: no trust lines`);
    } else if (kind === 'REQUEST') {
      assert(content.requestSummary != null, `${kind}: request summary`);
      assert(content.neededBy != null, `${kind}: needed-by date`);
    } else {
      assert(content.description != null, `${kind}: description`);
      if (kind === 'WORKSHOP') {
        assert(content.workshopDate != null, `${kind}: workshop date`);
      }
      if (kind === 'COACHING') {
        assert(content.onlineOffline != null, `${kind}: online/offline`);
      }
    }

    const serialized = JSON.stringify(content);
    for (const forbidden of PREVIEW_FORBIDDEN_SIGNALS) {
      assert(
        !serialized.includes(forbidden),
        `${kind}: no forbidden signal ${forbidden}`,
      );
    }
  }
}

function assertAcceptedValues() {
  console.log('\nAccepted values rendering');
  const model = modelForKind('PRODUCT');
  const { values, overflow } = buildPreviewAcceptedValues(model, t);
  assert(values.length === PREVIEW_ACCEPTED_MAX, `caps at ${PREVIEW_ACCEPTED_MAX}`);
  assert(overflow > 0, 'overflow +N when more than max');
  const content = buildMarketplacePreviewContent(model, t);
  assert(
    content.acceptedValues.length === PREVIEW_ACCEPTED_MAX,
    'preview content accepted cap',
  );
  assert(content.acceptedOverflow === overflow, 'preview overflow matches');
}

function assertTrustRendering() {
  console.log('\nTrust rendering');
  const product = buildPreviewTrustExpansion(modelForKind('PRODUCT'), t);
  assert(
    product.lines.some((l) => l.id === 'product'),
    'PRODUCT: product reviews line',
  );

  const service = buildPreviewTrustExpansion(modelForKind('SERVICE'), t);
  assert(
    service.lines.some((l) => l.id === 'deal-reviews' || l.id === 'deals'),
    'SERVICE: deal trust channel',
  );

  const inspiration = buildPreviewTrustExpansion(
    modelForKind('INSPIRATION'),
    t,
  );
  assert(inspiration.lines.length === 0, 'INSPIRATION: no trust expansion');

  const badges = buildMarketplacePreviewContent(modelForKind('PRODUCT'), t);
  assert(badges.trustBadges.length > 0, 'PRODUCT: seller badges in preview');
}

function assertDesktopMobileTriggers() {
  console.log('\nDesktop hover + mobile long-press wiring');
  const shellSrc = fs.readFileSync(
    path.join(process.cwd(), 'components/marketplace/previews/MarketplacePreviewShell.tsx'),
    'utf8',
  );
  assert(shellSrc.includes('PREVIEW_HOVER_DELAY_MS'), 'uses centralized hover delay');
  assert(shellSrc.includes('PREVIEW_LONG_PRESS_MS'), 'uses centralized long press');
  assert(
    shellSrc.includes('MarketplaceHoverPreview'),
    'desktop uses MarketplaceHoverPreview',
  );
  assert(
    shellSrc.includes('MarketplaceLongPressPreview'),
    'mobile uses MarketplaceLongPressPreview',
  );

  const hoverSrc = fs.readFileSync(
    path.join(process.cwd(), 'components/marketplace/previews/MarketplaceHoverPreview.tsx'),
    'utf8',
  );
  assert(hoverSrc.includes('computePreviewPosition'), 'smart floating position');
  assert(hoverSrc.includes("e.key === 'Escape'"), 'Escape closes hover preview');

  const sheetSrc = fs.readFileSync(
    path.join(
      process.cwd(),
      'components/marketplace/previews/MarketplaceLongPressPreview.tsx',
    ),
    'utf8',
  );
  assert(sheetSrc.includes('slide-in-from-bottom'), 'bottom sheet animation');
  assert(sheetSrc.includes('SWIPE_CLOSE_THRESHOLD'), 'swipe down to close');
}

function assertNoExtraFetch() {
  console.log('\nNo fetch on preview trigger');
  const previewDir = path.join(process.cwd(), 'components/marketplace/previews');
  const files = fs.readdirSync(previewDir).filter((f) => f.endsWith('.tsx'));
  for (const file of files) {
    const src = fs.readFileSync(path.join(previewDir, file), 'utf8');
    assert(!src.includes('fetch('), `${file}: no fetch()`);
  }
  const libSrc = fs.readFileSync(
    path.join(process.cwd(), 'lib/marketplace/previews/build-preview-content.ts'),
    'utf8',
  );
  assert(!libSrc.includes('fetch('), 'build-preview-content: no fetch');
}

function main() {
  console.log('Marketplace preview validation (T3)');
  assertPreviewFilesExist();
  assertAllListingKinds();
  assertAcceptedValues();
  assertTrustRendering();
  assertDesktopMobileTriggers();
  assertNoExtraFetch();

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
