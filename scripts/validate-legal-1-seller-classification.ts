/**
 * LEGAL-1 seller classification integrity (pure + static checks).
 *
 *   npx tsx scripts/validate-legal-1-seller-classification.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { offerRequiresCommerceDeclaration } from '../lib/legal/commerce-declaration-gate';
import {
  buildSellerCommerceContext,
  applyCommerceDeclarationUpdate,
  registeredBusinessInfoPresent,
  toPublicSellerCommerceView,
  deriveSellerCommerceActivities,
} from '../lib/legal/seller-commerce-context';
import {
  collectCommerceReviewReasons,
  nextCommerceReviewState,
  REVIEW_PAID_LISTING_SIGNAL_COUNT,
} from '../lib/legal/seller-commerce-review-signals';
import { resolveSellerCommercePublicLabel } from '../lib/legal/seller-commerce-public-label';

const ROOT = process.cwd();

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// 1. New / legacy user remains UNDECLARED
{
  const ctx = buildSellerCommerceContext({ seller: null });
  assert.equal(ctx.declaration, 'UNDECLARED');
  assert.equal(ctx.publicLabel, null);
}

// 2–4. Private / professional persist via apply update; user can update
{
  const priv = applyCommerceDeclarationUpdate({
    previous: { commerceDeclaration: 'UNDECLARED' },
    nextDeclaration: 'PRIVATE_OCCASIONAL',
    now: new Date('2026-08-14T12:00:00.000Z'),
  });
  assert.equal(priv.commerceDeclaration, 'PRIVATE_OCCASIONAL');
  assert.equal(priv.commerceDeclaredAt.toISOString(), '2026-08-14T12:00:00.000Z');

  const prof = applyCommerceDeclarationUpdate({
    previous: priv,
    nextDeclaration: 'SELF_DECLARED_PROFESSIONAL',
  });
  assert.equal(prof.commerceDeclaration, 'SELF_DECLARED_PROFESSIONAL');

  const back = applyCommerceDeclarationUpdate({
    previous: prof,
    nextDeclaration: 'PRIVATE_OCCASIONAL',
  });
  assert.equal(back.commerceDeclaration, 'PRIVATE_OCCASIONAL');
}

// 5–12. Auto-professional MUST BE NO
{
  const withBizInfo = buildSellerCommerceContext({
    seller: {
      commerceDeclaration: 'UNDECLARED',
      kvk: '12345678',
      companyName: 'Acme BV',
      btw: 'NL123',
    },
    hasBusinessRecord: true,
    stripeConnectAccountId: 'acct_x',
    stripeBusinessType: 'company',
    hasBusinessSubscription: true,
    products: Array.from({ length: 40 }, () => ({
      category: 'CHEFF',
      marketplaceCategory: 'CREATE',
      priceCents: 2500,
      isActive: true,
    })),
  });
  assert.equal(withBizInfo.declaration, 'UNDECLARED');
  assert.notEqual(withBizInfo.declaration, 'SELF_DECLARED_PROFESSIONAL');
  assert.equal(withBizInfo.registeredBusinessInfoPresent, true);
  assert.equal(withBizInfo.activities.food, true);

  const servicesOnly = buildSellerCommerceContext({
    seller: { commerceDeclaration: 'UNDECLARED' },
    products: [
      {
        category: 'DESIGNER',
        marketplaceCategory: 'PRACTICAL_SERVICE',
        priceCents: 5000,
      },
    ],
  });
  assert.equal(servicesOnly.declaration, 'UNDECLARED');
  assert.equal(servicesOnly.activities.services, true);
  assert.equal(servicesOnly.activities.food, false);
}

// DAC7 threshold numbers must not appear as trader engine in helper module
{
  const ctxSrc = read('lib/legal/seller-commerce-context.ts');
  const reviewSrc = read('lib/legal/seller-commerce-review-signals.ts');
  assert.equal(/\b2000\b/.test(ctxSrc.replace(/isLegalTrader|consumerLawApplies/g, '')), false);
  assert.equal(ctxSrc.includes('DAC7'), false);
  assert.equal(reviewSrc.includes('export function isLegalTrader'), false);
  assert.equal(ctxSrc.includes('export function isLegalTrader'), false);
  assert.equal(ctxSrc.includes('export function consumerLawApplies'), false);
  assert.ok(REVIEW_PAID_LISTING_SIGNAL_COUNT !== 30);
}

// 13. Free / non-commercial not gated
{
  assert.equal(
    offerRequiresCommerceDeclaration({
      priceCents: 0,
      priceModel: 'FIXED',
    }),
    false,
  );
  assert.equal(
    offerRequiresCommerceDeclaration({
      priceCents: 0,
      priceModel: 'ON_REQUEST',
    }),
    false,
  );
  assert.equal(
    offerRequiresCommerceDeclaration({
      priceCents: 0,
      priceModel: 'VOLUNTARY',
    }),
    false,
  );
  assert.equal(
    offerRequiresCommerceDeclaration({
      priceCents: 1500,
      priceModel: 'FIXED',
      barterOpenness: 'BARTER_ONLY',
    }),
    false,
  );
  assert.equal(
    offerRequiresCommerceDeclaration({
      priceCents: 1500,
      priceModel: 'FIXED',
    }),
    true,
  );
}

// 14. Review trigger does not overwrite declaration
{
  const reasons = collectCommerceReviewReasons({
    declaration: 'PRIVATE_OCCASIONAL',
    reviewState: 'NONE',
    kvk: '12345678',
    companyName: 'Acme',
  });
  assert.ok(reasons.includes('KVK_PRESENT'));
  const next = nextCommerceReviewState({
    declaration: 'PRIVATE_OCCASIONAL',
    reviewState: 'NONE',
    kvk: '12345678',
    companyName: 'Acme',
  });
  assert.equal(next, 'REVIEW_REQUIRED');
  const ctx = buildSellerCommerceContext({
    seller: {
      commerceDeclaration: 'PRIVATE_OCCASIONAL',
      kvk: '12345678',
      companyName: 'Acme',
    },
  });
  assert.equal(ctx.declaration, 'PRIVATE_OCCASIONAL');
  assert.equal(ctx.reviewState, 'REVIEW_REQUIRED');
}

// 15. Verified business separate
{
  const ctx = buildSellerCommerceContext({
    seller: { commerceDeclaration: 'PRIVATE_OCCASIONAL' },
    businessVerified: true,
  });
  assert.equal(ctx.verifiedBusiness, true);
  assert.equal(ctx.declaration, 'PRIVATE_OCCASIONAL');
  assert.equal(ctx.publicLabel, 'geverifieerd_bedrijf');
}

// 16–17. Public view hides review internals; no sensitive fields
{
  const ctx = buildSellerCommerceContext({
    seller: {
      commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL',
      kvk: '12345678',
      companyName: 'Acme',
      commerceReviewState: 'REVIEW_REQUIRED',
      commerceReviewReasons: ['KVK_PRESENT'],
    },
  });
  const pub = toPublicSellerCommerceView(ctx);
  assert.equal('reviewReasons' in pub, false);
  assert.equal('reviewState' in pub, false);
  const pubJson = JSON.stringify(pub);
  assert.equal(pubJson.includes('KVK_PRESENT'), false);
  assert.equal(pubJson.includes('REVIEW_REQUIRED'), false);
  assert.equal(pubJson.includes('BSN'), false);
  assert.equal(pubJson.includes('IBAN'), false);
}

// 18. Legacy registeredBusinessInfoPresent unchanged semantics
{
  assert.equal(
    registeredBusinessInfoPresent({ kvk: '1', companyName: 'A' }),
    true,
  );
  assert.equal(registeredBusinessInfoPresent({ kvk: '1', companyName: '' }), false);
  assert.equal(
    registeredBusinessInfoPresent({ kvk: null, companyName: 'A' }),
    false,
  );
}

// Labels
{
  assert.equal(
    resolveSellerCommercePublicLabel({
      declaration: 'UNDECLARED',
      verifiedBusiness: false,
    }),
    null,
  );
  assert.equal(
    resolveSellerCommercePublicLabel({
      declaration: 'PRIVATE_OCCASIONAL',
      verifiedBusiness: false,
    }),
    'particulier',
  );
}

// Activity derivation
{
  const a = deriveSellerCommerceActivities([
    { category: 'CHEFF', marketplaceCategory: 'CREATE' },
    { category: 'DESIGNER', marketplaceCategory: 'KNOWLEDGE' },
  ]);
  assert.equal(a.food, true);
  assert.equal(a.services, true);
}

// Static: feed freeze + no isLegalTrader + Stripe architecture untouched in LEGAL-1 libs
{
  const feedRoute = read('app/api/feed/route.ts');
  assert.match(feedRoute, /kvk && product\.seller\.companyName/);

  for (const rel of [
    'lib/legal/seller-commerce-context.ts',
    'lib/legal/seller-commerce-review-signals.ts',
    'lib/legal/commerce-declaration-gate.ts',
    'lib/legal/get-seller-commerce-context.ts',
  ]) {
    const src = read(rel);
    assert.equal(src.includes('export function isLegalTrader'), false);
    assert.equal(src.includes('export function consumerLawApplies'), false);
  }

  // Feed files must not import commerce declaration (no N+1 / feed semantics)
  assert.equal(feedRoute.includes('commerceDeclaration'), false);
  assert.equal(feedRoute.includes('getSellerCommerceContext'), false);

  const geoFeedHits = [
    'components/feed/GeoFeed.tsx',
    'lib/feed/geofeed',
  ].filter((p) => fs.existsSync(path.join(ROOT, p)));
  for (const p of geoFeedHits) {
    if (fs.statSync(path.join(ROOT, p)).isFile()) {
      const src = read(p);
      assert.equal(src.includes('commerceDeclaration'), false);
    }
  }
}

// Schema defaults
{
  const schema = read('prisma/schema.prisma');
  assert.match(schema, /commerceDeclaration\s+String\s+@default\("UNDECLARED"\)/);
  assert.match(schema, /commerceReviewState\s+String\s+@default\("NONE"\)/);
  const mig = read(
    'prisma/migrations/20260814120000_legal1_seller_commerce_declaration/migration.sql',
  );
  assert.match(mig, /ADD COLUMN IF NOT EXISTS "commerceDeclaration"/);
  assert.match(mig, /DEFAULT 'UNDECLARED'/);
  assert.equal(mig.toLowerCase().includes('update "sellerprofile" set'), false);
}

// UX copy must not claim legal ruling / DAC7 thresholds
{
  const modal = read('components/legal/CommerceDeclarationModal.tsx');
  assert.match(modal, /Hoe bied je aan op HomeCheff/);
  assert.equal(modal.includes('ondernemer'), false);
  assert.equal(modal.includes('€2.000'), false);
  assert.equal(modal.includes('30 verkopen'), false);
  assert.equal(modal.includes('DAC7'), false);
  assert.match(modal, /geen juridische/);
}

console.log('LEGAL-1 seller classification validation: OK');
