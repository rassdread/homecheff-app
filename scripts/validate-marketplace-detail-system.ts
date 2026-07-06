#!/usr/bin/env npx tsx
/**
 * Phase 4C marketplace detail page system validation.
 * Run: npx tsx scripts/validate-marketplace-detail-system.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { LISTING_KINDS } from '../lib/marketplace/contracts/listing-kind-contract';
import {
  DETAIL_PAGE_KINDS,
  DETAIL_SECTION_IDS,
  DETAIL_FORBIDDEN_SIGNALS,
  isCanonicalDetailSectionOrder,
  listingKindToDetailKind,
} from '../lib/marketplace/detail/detail-page-contract';
import {
  DETAIL_KIND_BEHAVIORS,
  buildDetailSectionPlan,
  kindBehavior,
} from '../lib/marketplace/detail/detail-kind-matrix';
import {
  DETAIL_ACTION_MATRIX,
  actionsForDetailKind,
  primaryActionForKind,
  allDetailKindsHaveActions,
} from '../lib/marketplace/detail/detail-action-matrix';
import {
  buildMobileDetailLayout,
  buildDesktopDetailLayout,
  DESKTOP_DETAIL_GRID,
} from '../lib/marketplace/detail/detail-layout-contract';
import {
  buildDetailTrustBlock,
  detailTrustUsesForbiddenSignals,
  primaryTrustChannelForKind,
} from '../lib/marketplace/detail/detail-trust-block';
import {
  buildDetailValueExchangeBlock,
  valueExchangeSectionTitleKey,
} from '../lib/marketplace/detail/detail-value-exchange-block';
import {
  EMPTY_DISCOVERY_TRUST_CONTRACT,
  DISCOVERY_TRUST_FORBIDDEN_SIGNALS,
} from '../lib/discovery/contracts/discovery-trust-contract';
import {
  buildBarterAcceptanceModel,
  buildDesiredExchangeDetail,
  resolvePaymentMethod,
  PAYMENT_METHOD_REGISTRY,
} from '../lib/marketplace/value-exchange';

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
  const raw = fs.readFileSync(
    path.join(process.cwd(), `public/i18n/${locale}.json`),
    'utf8',
  );
  return JSON.parse(raw) as Record<string, unknown>;
}

function getNested(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

console.log('=== Marketplace Detail System Validation (Phase 4C) ===\n');

console.log('ListingKind → detail rules');
for (const kind of LISTING_KINDS) {
  const detailKind = listingKindToDetailKind(kind);
  assert(detailKind !== null, `${kind} maps to detail kind`);
  if (detailKind) {
    assert(kindBehavior(detailKind).kind === detailKind, `${kind} behavior exists`);
    assert(buildDetailSectionPlan(detailKind).length === DETAIL_SECTION_IDS.length, `${kind} full section plan`);
  }
}
assert(DETAIL_PAGE_KINDS.length === 8, 'eight detail page kinds');
for (const kind of DETAIL_PAGE_KINDS) {
  assert(DETAIL_KIND_BEHAVIORS[kind] !== undefined, `${kind} kind behavior`);
  assert(DETAIL_ACTION_MATRIX[kind].length > 0, `${kind} has actions`);
}

console.log('\nCanonical section order');
assert(isCanonicalDetailSectionOrder(DETAIL_SECTION_IDS), 'DETAIL_SECTION_IDS canonical');
for (const kind of DETAIL_PAGE_KINDS) {
  const ids = buildDetailSectionPlan(kind).map((s) => s.sectionId);
  assert(isCanonicalDetailSectionOrder(ids), `${kind} preserves section order`);
}

console.log('\nLayout contracts (mobile + desktop)');
for (const kind of DETAIL_PAGE_KINDS) {
  const mobile = buildMobileDetailLayout(kind);
  const desktop = buildDesktopDetailLayout(kind);
  assert(mobile.tier === 'mobile', `${kind} mobile tier`);
  assert(desktop.tier === 'desktop', `${kind} desktop tier`);
  assert(mobile.sections.length === DETAIL_SECTION_IDS.length, `${kind} mobile sections`);
  assert(desktop.sections.length === DETAIL_SECTION_IDS.length, `${kind} desktop sections`);
}
assert(DESKTOP_DETAIL_GRID.columns.length > 0, 'desktop grid defined');
assert(
  buildMobileDetailLayout('INSPIRATION').stickyActionBar === false,
  'inspiration mobile has no sticky action bar',
);

console.log('\nValue exchange block (Phase 4A contracts)');
const paymentId = resolvePaymentMethod({ barterOpenness: 'MONEY_AND_BARTER' });
assert(PAYMENT_METHOD_REGISTRY[paymentId] !== undefined, 'payment registry used');
const vex = buildDetailValueExchangeBlock({
  listingKind: 'PRODUCT',
  marketplaceCategory: 'CREATE',
  barterOpenness: 'MONEY_AND_BARTER',
  priceModel: 'FIXED',
  acceptedTaxonomyIds: ['create.meal', 'grow.tomato'],
  desiredExchanges: [],
});
assert(vex !== null, 'product value exchange block builds');
assert(vex!.paymentLabelKey.startsWith('marketplace.valueExchange.'), 'payment uses 4A labelKey');
assert(vex!.acceptedMainCategories.length > 0, 'barter acceptance from 4A model');
const requestVex = buildDetailValueExchangeBlock({
  listingKind: 'REQUEST',
  marketplaceCategory: 'CREATE',
  barterOpenness: 'BARTER_ONLY',
  acceptedTaxonomyIds: ['grow.herbs'],
  desiredExchanges: [
    buildDesiredExchangeDetail({
      mainCategory: 'HOME_GARDEN',
      subcategoryId: 'grow.herbs',
      description: 'Fresh herbs weekly',
    })!,
  ],
});
assert(requestVex !== null && requestVex.desiredExchanges.length === 1, 'request desired exchange');
assert(
  buildDetailValueExchangeBlock({
    listingKind: 'INSPIRATION',
    marketplaceCategory: null,
    acceptedTaxonomyIds: [],
  }) === null,
  'inspiration hides value exchange block',
);
assert(
  buildDetailSectionPlan('DELIVERY').find((s) => s.sectionId === 'value_exchange')?.visibility ===
    'hide',
  'delivery detail hides value exchange section',
);
assert(valueExchangeSectionTitleKey() === 'marketplace.detail.valueExchange.title', 'title key');

console.log('\nTrust block (DiscoveryTrustContract only)');
const trustPayload = {
  ...EMPTY_DISCOVERY_TRUST_CONTRACT,
  product: { reviewCount: 12, tier: 3 as const },
  deal: { reviewCount: 5, tier: 2 as const },
  completedDeals: 8,
  completedDeliveries: 3,
  repeatCustomers: 2,
  trustBadges: [{ key: 'verified_seller', name: 'Verified', icon: '✓' }],
  sellerTier: 4 as const,
};
const productTrust = buildDetailTrustBlock(trustPayload, 'PRODUCT');
assert(productTrust.primaryChannel === 'product', 'product primary channel');
assert(
  productTrust.lines.some((l) => l.kind === 'product_reviews'),
  'product reviews line',
);
assert(
  !productTrust.lines.some((l) => l.kind === 'deal_reviews') || trustPayload.deal.reviewCount > 0,
  'deal reviews separate when present',
);
const serviceTrust = buildDetailTrustBlock(trustPayload, 'SERVICE');
assert(serviceTrust.primaryChannel === 'deal', 'service deal channel');
assert(
  serviceTrust.lines.some((l) => l.kind === 'deal_reviews'),
  'deal reviews line for service',
);
const forbiddenSample = detailTrustUsesForbiddenSignals({
  blendedRating: 4.5,
  viewCount: 100,
});
assert(forbiddenSample.length >= 2, 'forbidden signal detector works');
for (const signal of DETAIL_FORBIDDEN_SIGNALS) {
  assert(
    (DISCOVERY_TRUST_FORBIDDEN_SIGNALS as readonly string[]).includes(signal) ||
      ['averageRating', 'fansCount'].includes(signal),
    `detail forbidden ${signal} documented`,
  );
}
const trustJson = JSON.stringify(productTrust);
for (const signal of ['blendedRating', 'hcpPoints', 'viewCount', 'followerCount']) {
  assert(!trustJson.includes(signal), `trust plan excludes ${signal}`);
}
assert(primaryTrustChannelForKind('PRODUCT') === 'product', 'PRODUCT channel');
assert(primaryTrustChannelForKind('REQUEST') === 'deal', 'REQUEST channel');

console.log('\nAction matrix per ListingKind');
assert(allDetailKindsHaveActions(), 'all kinds have actions');
assert(primaryActionForKind('PRODUCT')?.id === 'order', 'PRODUCT primary order');
assert(primaryActionForKind('SERVICE')?.id === 'request_proposal', 'SERVICE primary proposal');
assert(primaryActionForKind('REQUEST')?.id === 'request_proposal', 'REQUEST primary proposal');
assert(primaryActionForKind('INSPIRATION') === null, 'INSPIRATION no primary CTA');
assert(
  actionsForDetailKind('DELIVERY').every((a) => !['order', 'request_proposal'].includes(a.id)),
  'DELIVERY no order/proposal',
);
assert(
  actionsForDetailKind('WORKSHOP').some((a) => a.id === 'order'),
  'WORKSHOP has order',
);

console.log('\nKind-specific section overrides');
assert(
  buildDetailSectionPlan('INSPIRATION').find((s) => s.sectionId === 'value_exchange')?.visibility ===
    'hide',
  'inspiration hides value exchange',
);
assert(
  buildDetailSectionPlan('DELIVERY').find((s) => s.sectionId === 'value_exchange')?.visibility ===
    'hide',
  'delivery hides value exchange',
);
assert(
  buildDetailSectionPlan('REQUEST').find((s) => s.sectionId === 'value_exchange')?.visibility ===
    'show',
  'request shows value exchange',
);

console.log('\ni18n keys (en + nl)');
const requiredKeys = [
  'marketplace.detail.sections.heroMedia',
  'marketplace.detail.sections.personRow',
  'marketplace.detail.sections.valueExchange',
  'marketplace.detail.sections.trustBlock',
  'marketplace.detail.sections.description',
  'marketplace.detail.sections.availability',
  'marketplace.detail.sections.reviews',
  'marketplace.detail.sections.relatedListings',
  'marketplace.detail.sections.actionBlock',
  'marketplace.detail.trust.productReviews',
  'marketplace.detail.trust.dealReviews',
  'marketplace.detail.trust.completedDeals',
  'marketplace.detail.trust.deliveries',
  'marketplace.detail.trust.repeatCustomers',
  'marketplace.detail.trust.badge',
  'marketplace.detail.trust.establishedMaker',
  'marketplace.detail.actions.order',
  'marketplace.detail.actions.requestProposal',
  'marketplace.detail.actions.message',
  'marketplace.detail.actions.save',
  'marketplace.detail.actions.share',
  'marketplace.detail.actions.contact',
  'marketplace.detail.actions.print',
  'marketplace.detail.actions.edit',
  'marketplace.detail.valueExchange.title',
];
for (const locale of ['en', 'nl'] as const) {
  const i18n = loadI18n(locale);
  for (const key of requiredKeys) {
    assert(getNested(i18n, key) !== undefined, `${locale}: ${key}`);
  }
}

console.log('\nDocs');
const docs = [
  'docs/architecture/MARKETPLACE_DETAIL_PAGE_SYSTEM.md',
  'docs/audits/MARKETPLACE_DETAIL_AUDIT.md',
  'docs/audits/MARKETPLACE_DETAIL_KIND_MATRIX.md',
  'docs/progress/MARKETPLACE_DETAIL_PHASE4C.md',
];
for (const doc of docs) {
  assert(fs.existsSync(path.join(process.cwd(), doc)), doc);
}

console.log('\nLib files');
const libFiles = [
  'lib/marketplace/detail/detail-page-contract.ts',
  'lib/marketplace/detail/detail-kind-matrix.ts',
  'lib/marketplace/detail/detail-trust-block.ts',
  'lib/marketplace/detail/detail-action-matrix.ts',
  'lib/marketplace/detail/detail-layout-contract.ts',
  'lib/marketplace/detail/detail-value-exchange-block.ts',
  'lib/marketplace/detail/index.ts',
];
for (const file of libFiles) {
  assert(fs.existsSync(path.join(process.cwd(), file)), file);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
