#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 3B — UI Consistency, Loading & Interaction Polish.
 *
 * Verifies the consistency pass from the Phase 3 audit is actually in place:
 *   3B.1  Shared order-status chip used across buyer/seller/dashboard (J9)
 *   3B.2  Skeletons replace bare spinners (profile deals, delivery) (J13)
 *   3B.3  REQUEST detail drops sale chrome (reviews/stock/VAT/quantity) (J12)
 *   3B.4  Favorites page has clear favorites/fans/following copy (J15)
 *   3B.5  Upload delete controls are visible on touch + 44px targets (J14)
 *   3B.6  alert() removed from in-scope screens in favour of inline feedback (J10)
 *   3B.7  No duplicate status chip on the hub deal card (J20)
 *
 * Run: npx tsx scripts/validate-ux-fin-3b-consistency.ts
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

function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

function loadI18n(locale: 'en' | 'nl'): Record<string, unknown> {
  return JSON.parse(read(`public/i18n/${locale}.json`));
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

console.log('=== UX-FIN Phase 3B — UI Consistency, Loading & Interaction Polish ===\n');

const en = loadI18n('en');
const nl = loadI18n('nl');

// --- 3B.1 shared status chip --------------------------------------------
console.log('3B.1 Uniform status chips');
assert(
  fs.existsSync(path.join(process.cwd(), 'lib/orders/order-status-display.ts')),
  'lib/orders/order-status-display.ts exists (single source of truth)',
);
assert(
  fs.existsSync(path.join(process.cwd(), 'components/orders/OrderStatusChip.tsx')),
  'components/orders/OrderStatusChip.tsx exists (shared chip)',
);
const buyerOrders = read('app/orders/page.tsx');
const sellerOrders = read('app/verkoper/orders/page-client.tsx');
const sellerDashboard = read('app/verkoper/dashboard/page-client.tsx');
assert(buyerOrders.includes('OrderStatusChip'), 'buyer orders use OrderStatusChip');
assert(sellerOrders.includes('OrderStatusChip'), 'seller orders use OrderStatusChip');
assert(sellerDashboard.includes('OrderStatusChip'), 'seller dashboard uses OrderStatusChip');
assert(
  !buyerOrders.includes('const getStatusColor'),
  'buyer orders no longer hand-roll getStatusColor',
);
assert(
  !sellerOrders.includes('const getStatusColor'),
  'seller orders no longer hand-roll getStatusColor',
);
assert(
  !sellerDashboard.includes('const getOrderStatusColor'),
  'seller dashboard no longer hand-roll getOrderStatusColor',
);
for (const key of [
  'orderStatus.pending',
  'orderStatus.confirmed',
  'orderStatus.processing',
  'orderStatus.shipped',
  'orderStatus.delivered',
  'orderStatus.cancelled',
  'orderStatus.refunded',
]) {
  assert(typeof getNested(nl, key) === 'string', `nl has ${key}`);
  assert(typeof getNested(en, key) === 'string', `en has ${key}`);
}

// --- 3B.2 skeleton parity ------------------------------------------------
console.log('\n3B.2 Skeleton parity');
const routeSkeletons = read('components/navigation/RouteLoadingSkeletons.tsx');
assert(
  routeSkeletons.includes('CardListLoadingSkeleton'),
  'shared CardListLoadingSkeleton exists',
);
const profileDeals = read('components/profile/ProfileDealsClient.tsx');
assert(
  profileDeals.includes('CardListLoadingSkeleton'),
  'profile deals use CardListLoadingSkeleton',
);
assert(
  !profileDeals.includes('Loader2 className="h-6 w-6 animate-spin'),
  'profile deals no longer show a bare spinner',
);
const deliveryDashboard = read('components/delivery/DeliveryDashboard.tsx');
assert(
  deliveryDashboard.includes('CardListLoadingSkeleton'),
  'delivery dashboard uses CardListLoadingSkeleton',
);

// --- 3B.3 REQUEST detail polish -----------------------------------------
console.log('\n3B.3 REQUEST detail polish');
const listingDetail = read('components/product/ListingDetailPage.tsx');
assert(
  /\{!isRequestListing\s*\?\s*\(/.test(listingDetail),
  'ListingDetailPage hides reviews for requests (!isRequestListing gate)',
);
const commerceZone = read('components/product/detail/ProductSaleCommerceZone.tsx');
assert(
  commerceZone.includes("const isRequest = listingKind === 'REQUEST'"),
  'commerce zone computes isRequest',
);
assert(
  commerceZone.includes('if (isRequest) return null;'),
  'commerce zone hides stock badge for requests',
);
assert(
  commerceZone.includes('!isRequest &&') &&
    commerceZone.includes('showQuantity'),
  'commerce zone hides quantity/VAT for requests',
);
const stickyCta = read('components/product/detail/ProductSaleStickyCta.tsx');
assert(
  stickyCta.includes('if (isRequest)'),
  'sticky CTA never falls back to add-to-cart for requests',
);

// --- 3B.4 favorites clarity ---------------------------------------------
console.log('\n3B.4 Favorites clarity');
for (const key of [
  'favoritesHub.pageTitle',
  'favoritesHub.tabFollowing',
  'favoritesHub.tabFans',
  'favoritesHub.tabFavorites',
  'favoritesHub.badgeFan',
  'favoritesHub.badgeFollowing',
]) {
  assert(typeof getNested(nl, key) === 'string', `nl has ${key}`);
  assert(typeof getNested(en, key) === 'string', `en has ${key}`);
}
const favoritesPage = read('app/favorites/page.tsx');
assert(
  favoritesPage.includes("t('favoritesHub.pageTitle')"),
  'favorites page uses favoritesHub.pageTitle (no "Fan & Fans" literal)',
);
assert(
  !favoritesPage.includes('Fan & Fans'),
  'favorites page dropped the ambiguous "Fan & Fans" header',
);
const fansList = read('components/FansAndFollowsList.tsx');
assert(
  fansList.includes("t('favoritesHub.tabFollowing')") &&
    fansList.includes("t('favoritesHub.tabFans')") &&
    fansList.includes("t('favoritesHub.tabFavorites')"),
  'FansAndFollowsList tab labels use favoritesHub copy',
);
assert(
  !/console\.log\('Follows API response/.test(fansList) &&
    !/console\.log\('Fans API response/.test(fansList),
  'FansAndFollowsList debug console.logs removed',
);

// --- 3B.5 touch targets --------------------------------------------------
console.log('\n3B.5 Touch targets');
const uploaders = [
  'components/products/MultiImageUploader.tsx',
  'components/products/SimpleImageUploader.tsx',
  'components/ProductPhotoUpload.tsx',
  'components/workspace/WorkspacePhotoUpload.tsx',
  'components/SpacePhotoUpload.tsx',
  'components/designs/DesignPhotoUpload.tsx',
  'components/profile/GardenPhotoUpload.tsx',
  'components/profile/RecipePhotoUpload.tsx',
  'components/profile/GardenGrowthPhotos.tsx',
  'components/profile/RecipeStepPhotos.tsx',
];
for (const file of uploaders) {
  const src = read(file);
  assert(
    !/opacity-0 group-hover:opacity-100/.test(src),
    `${path.basename(file)} has no hover-only (opacity-0) controls`,
  );
}
for (const file of [
  'components/products/MultiImageUploader.tsx',
  'components/products/SimpleImageUploader.tsx',
  'components/ProductPhotoUpload.tsx',
]) {
  assert(read(file).includes('min-h-[44px]'), `${path.basename(file)} delete control ≥44px on touch`);
}

// --- 3B.6 inline feedback (alert removed in scope) ----------------------
console.log('\n3B.6 Inline feedback (no alert() in scope)');
assert(!/\balert\(/.test(read('app/checkout/page.tsx')), 'checkout has no alert() calls');
assert(!/\balert\(/.test(sellerOrders), 'seller orders has no alert() calls');
assert(
  read('app/checkout/page.tsx').includes('setCheckoutError'),
  'checkout uses inline error state',
);
assert(sellerOrders.includes('setStatusError'), 'seller orders use inline error state');
assert(
  deliveryDashboard.includes('setFeedback'),
  'delivery dashboard uses inline feedback state',
);
// Delivery dashboard: status toggle + accept-order alerts replaced.
const deliveryAlerts = (deliveryDashboard.match(/\balert\(/g) || []).length;
assert(
  deliveryAlerts <= 3,
  `delivery dashboard alert() usage reduced (${deliveryAlerts} left, onboarding only)`,
);

// --- 3B.7 no duplicate chip ---------------------------------------------
console.log('\n3B.7 Small polish');
const hubDealCard = read('components/agreements/AgreementHubDealCard.tsx');
assert(
  !hubDealCard.includes('communityOrder.status.'),
  'hub deal card no longer renders a duplicate status chip',
);

// --- summary -------------------------------------------------------------
console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
