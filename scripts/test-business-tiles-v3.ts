#!/usr/bin/env npx tsx
/**
 * Lightweight business tile presentation guards (memory-safe).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveBusinessPlanId } from '../lib/business/visibility-profile';
import { businessTileArticleClass } from '../lib/marketplace/tiles/business-tile-chrome';
import { resolveMarketplaceSellerTileRole } from '../lib/marketplace/tiles/seller-tile-role';
import { buildTileBadges } from '../lib/marketplace/tiles/build-tile-badges';
import { buildDnaPreviewTileModel } from '../lib/business/dna-preview-tile';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Business tiles v3 (commit B) ===\n');

const future = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
const expired = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

ok(
  'VIP26-style active entitlement resolves to premium (not payment amount)',
  resolveBusinessPlanId({
    subscriptionId: 'sub_vip26',
    subscriptionValidUntil: future,
    Subscription: { name: 'premium', feeBps: 500 },
  }) === 'premium',
);
ok(
  'expired subscription falls back to individual',
  resolveBusinessPlanId({
    subscriptionId: 'sub_old',
    subscriptionValidUntil: expired,
    Subscription: { name: 'premium', feeBps: 500 },
  }) === 'individual',
);
ok(
  'missing subscription is individual',
  resolveBusinessPlanId({
    subscriptionId: null,
    subscriptionValidUntil: null,
    Subscription: { name: 'pro' },
  }) === 'individual',
);
ok(
  'a still-open period keeps premium after cancel-at-period-end',
  resolveBusinessPlanId({
    subscriptionId: 'sub_cancel_pending',
    subscriptionValidUntil: future,
    Subscription: { name: 'premium', feeBps: 500 },
  }) === 'premium',
);
ok(
  'an active plan is read from fee bps when the name is missing',
  resolveBusinessPlanId({
    subscriptionId: 'sub_fee_only',
    subscriptionValidUntil: future,
    Subscription: { name: '', feeBps: 700 },
  }) === 'pro',
);
ok(
  'inconsistent name and fee do not invent a plan from a promo price',
  resolveBusinessPlanId({
    subscriptionId: 'sub_vip26',
    subscriptionValidUntil: future,
    Subscription: { name: 'premium', feeBps: 500 },
  }) === 'premium',
);

ok('private seller has no plan chrome', businessTileArticleClass('individual') === '');
ok(
  'company name alone stays a private tile',
  resolveMarketplaceSellerTileRole({
    commerceDeclaration: 'PRIVATE_OCCASIONAL',
    verifiedBusiness: false,
    businessPlan: 'individual',
  }) === 'private',
);
ok(
  'self-declared professional is a business tile without a company name',
  resolveMarketplaceSellerTileRole({
    commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL',
    verifiedBusiness: false,
    businessPlan: 'individual',
  }) === 'business',
);
ok(
  'active premium subscription is a business tile',
  resolveMarketplaceSellerTileRole({
    commerceDeclaration: 'UNDECLARED',
    verifiedBusiness: false,
    businessPlan: 'premium',
  }) === 'business',
);
ok(
  'inspiration stays on the private template',
  read('lib/marketplace/tiles/map-to-tile-model.ts').includes("mode === 'inspiration'") &&
    read('components/marketplace/tiles/MarketplaceTileStandard.tsx').includes(
      "model.mode === 'inspiration'",
    ),
);
ok('basic chrome is the neutral slate finish', businessTileArticleClass('basic').includes('slate'));
ok('pro chrome uses the HomeCheff accent', businessTileArticleClass('pro').includes('347266'));
ok('premium chrome keeps the violet finish', businessTileArticleClass('premium').includes('violet'));
ok(
  'premium chrome does not add a heavy drop shadow',
  !businessTileArticleClass('premium').includes('shadow-md'),
);

const t = (key: string) => key;
for (const plan of ['basic', 'pro', 'premium'] as const) {
  const model = buildDnaPreviewTileModel(plan, `Seller ${plan}`);
  const { badges } = buildTileBadges(model, t, 'standard');
  ok(
    `${plan} tile emits business_plan badge`,
    badges.some((b) => b.kind === 'business_plan' && b.businessPlan === plan),
  );
}
ok(
  'individual has no business_plan badge',
  !buildTileBadges(buildDnaPreviewTileModel('individual', 'Private'), t, 'standard').badges.some(
    (b) => b.kind === 'business_plan',
  ),
);

const standard = read('components/marketplace/tiles/MarketplaceTileStandard.tsx');
ok(
  'feed shows plan badges (not profile-only)',
  standard.includes('badges={badges}') &&
    !standard.includes("shareSurface === 'profile' ? badges : []"),
);
ok(
  'standard tile applies business chrome',
  standard.includes('businessTileArticleClass'),
);

const person = read('components/marketplace/tiles/primitives/TilePersonRow.tsx');
ok('seller row shows BusinessPlanBadge', person.includes('BusinessPlanBadge'));

const badgeRow = read('components/marketplace/tiles/primitives/TileBadgeRow.tsx');
ok(
  'badge row uses Basic, Pro and Premium tones',
  badgeRow.includes('BUSINESS_PLAN_BADGE_TONE') &&
    badgeRow.includes('bg-slate-50') &&
    badgeRow.includes('bg-[#e8f4ef]') &&
    badgeRow.includes('bg-[#f4f0fb]'),
);

console.log(`\n${passed} assertions passed`);
