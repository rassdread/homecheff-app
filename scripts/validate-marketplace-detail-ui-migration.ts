#!/usr/bin/env npx tsx
/**
 * Phase 4C-UI detail contract migration validation.
 * Run: npx tsx scripts/validate-marketplace-detail-ui-migration.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildDetailAcceptedValuesPresentation,
  buildDetailConditionsBlock,
  buildDetailUiSectionPlan,
  DETAIL_UI_SECTION_IDS,
  resolveDetailPageActions,
} from '../lib/marketplace/detail';
import { buildDetailTrustBlock } from '../lib/marketplace/detail/detail-trust-block';
import { EMPTY_DISCOVERY_TRUST_CONTRACT } from '../lib/discovery/contracts/discovery-trust-contract';
import { DETAIL_FORBIDDEN_SIGNALS } from '../lib/marketplace/detail/detail-page-contract';

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

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function dig(obj: Record<string, unknown>, parts: string[]): unknown {
  return parts.reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

console.log('=== Marketplace Detail UI Migration (Phase 4C-UI) ===\n');

console.log('UI section order');
assert(DETAIL_UI_SECTION_IDS.includes('accepted_values'), 'accepted_values in UI plan');
assert(DETAIL_UI_SECTION_IDS.includes('conditions'), 'conditions in UI plan');
const productPlan = buildDetailUiSectionPlan('PRODUCT');
const ids = productPlan.filter((s) => s.visibility !== 'hide').map((s) => s.sectionId);
assert(ids.indexOf('description') < ids.indexOf('value_exchange'), 'description before value_exchange');
assert(ids.indexOf('value_exchange') < ids.indexOf('accepted_values'), 'value_exchange before accepted_values');
assert(ids.indexOf('accepted_values') < ids.indexOf('conditions'), 'accepted_values before conditions');
assert(ids.indexOf('conditions') < ids.indexOf('trust_block'), 'conditions before trust');

console.log('\nAccepted values presentation');
const accepted = buildDetailAcceptedValuesPresentation({
  acceptedTaxonomyIds: ['create.cuisine_surinamese', 'grow.herbs'],
  marketplaceCategory: 'CREATE',
  listingKind: 'PRODUCT',
});
assert(accepted.hasContent, 'accepted values groups build');
assert(accepted.groups.length >= 1, 'at least one main category group');
assert(
  accepted.groups.some((g) => g.subcategories.length > 0),
  'subcategories under main category',
);

console.log('\nConditions block');
const conditions = buildDetailConditionsBlock({
  delivery: 'BOTH',
  sellerCanDeliver: true,
  deliveryRadiusKm: 10,
  pickupAddress: 'Amsterdam',
  availableStock: 3,
});
assert(conditions.some((c) => c.kind === 'pickup'), 'pickup condition');
assert(conditions.some((c) => c.kind === 'delivery'), 'delivery condition');
assert(conditions.some((c) => c.kind === 'region'), 'region condition');

console.log('\nListingKind action parity');
const serviceActions = resolveDetailPageActions({
  listingKind: 'SERVICE',
  barterOpenness: 'MONEY',
});
assert(serviceActions.showProposal === true, 'SERVICE shows proposal on MONEY listing');
assert(serviceActions.proposalPrimary === true, 'SERVICE proposal primary');

const productActions = resolveDetailPageActions({
  listingKind: 'PRODUCT',
  barterOpenness: 'MONEY_AND_BARTER',
});
assert(productActions.showOrder === true, 'PRODUCT hybrid shows order');
assert(productActions.showProposal === true, 'PRODUCT hybrid shows proposal');

console.log('\nTrust block (no forbidden signals)');
const trustPlan = buildDetailTrustBlock(
  {
    ...EMPTY_DISCOVERY_TRUST_CONTRACT,
    product: { reviewCount: 5, tier: 3 },
    completedDeals: 2,
    sellerTier: 4,
  },
  'PRODUCT',
);
const trustJson = JSON.stringify(trustPlan);
for (const signal of DETAIL_FORBIDDEN_SIGNALS) {
  assert(!trustJson.includes(signal), `trust plan excludes ${signal}`);
}

const page = readRepoFile('app/product/[id]/page.tsx');
const commerce = readRepoFile('components/product/detail/ProductSaleCommerceZone.tsx');
const mainSections = readRepoFile('components/product/detail/ProductDetailMainSections.tsx');
const trustUi = readRepoFile('components/product/detail/ProductDetailTrustBlock.tsx');
const acceptedUi = readRepoFile('components/product/detail/ProductDetailAcceptedValuesSection.tsx');
const conditionsUi = readRepoFile('components/product/detail/ProductDetailConditionsSection.tsx');
const valueExchange = readRepoFile('components/product/detail/ProductValueExchangeSection.tsx');
const primaryActions = readRepoFile('components/product/detail/ProductSalePrimaryActions.tsx');
const apiRoute = readRepoFile('app/api/products/[id]/route.ts');

assert(page.includes('ProductDetailMainSections'), 'page uses ProductDetailMainSections');
assert(page.includes('DESKTOP_DETAIL_GRID'), 'page uses desktop grid contract');
assert(page.includes('discoveryTrust'), 'page consumes discoveryTrust');
assert(!page.includes('ProductDetailTrustNote'), 'legacy ProductDetailTrustNote removed');
assert(!page.includes('stats.viewCount'), 'forbidden viewCount strip removed from page');
assert(!page.includes('ProductMakerTrustStrip'), 'legacy maker trust strip removed from page');

assert(commerce.includes('ProductDetailTrustBlock'), 'commerce zone uses contract trust block');
assert(!commerce.includes('ProductSaleCommerceTrustLine'), 'legacy commerce trust line removed');
assert(!commerce.includes('fansCount'), 'no fansCount in commerce zone');

assert(mainSections.includes('buildDetailUiSectionPlan'), 'main sections use UI section plan');
assert(acceptedUi.includes('buildDetailAcceptedValuesPresentation'), 'accepted values section wired');
assert(conditionsUi.includes('buildDetailConditionsBlock'), 'conditions section wired');
assert(valueExchange.includes('data-detail-section="value_exchange"'), 'value exchange section tagged');
assert(!valueExchange.includes('barter.accepts'), 'accepted values moved out of value exchange section');

assert(primaryActions.includes('resolveDetailPageActions'), 'primary actions use kind matrix');
assert(apiRoute.includes('buildDiscoveryTrust'), 'product API returns discoveryTrust');

assert(
  fs.existsSync(path.join(process.cwd(), 'docs/progress/MARKETPLACE_PHASE4C_UI_MIGRATION.md')),
  'progress doc exists',
);
assert(
  fs.existsSync(path.join(process.cwd(), 'docs/audits/MARKETPLACE_DETAIL_UI_MIGRATION_AUDIT.md')),
  'audit doc exists',
);

const nl = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/nl.json'), 'utf8'),
) as Record<string, unknown>;
const en = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/i18n/en.json'), 'utf8'),
) as Record<string, unknown>;

const i18nPaths = [
  ['marketplace', 'detail', 'acceptedValues', 'title'],
  ['marketplace', 'detail', 'conditions', 'title'],
  ['marketplace', 'detail', 'conditions', 'pickupAvailable'],
  ['marketplace', 'detail', 'trust', 'productReviews'],
  ['marketplace', 'detail', 'actions', 'requestProposal'],
];

for (const locale of ['nl', 'en'] as const) {
  const data = locale === 'nl' ? nl : en;
  for (const parts of i18nPaths) {
    assert(typeof dig(data, parts) === 'string', `${locale}: ${parts.join('.')}`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
