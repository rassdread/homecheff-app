#!/usr/bin/env npx tsx
/**
 * Phase 5B-D barter openness wiring validation.
 * Run: npx tsx scripts/validate-marketplace-barter-openness-wiring.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  resolveBarterOpennessForFormPrefill,
  resolveBarterOpennessForSave,
  suggestBarterOpennessAfterAcceptedValuesChange,
  barterOpennessRequiresAcceptedValues,
} from '../lib/marketplace/resolve-barter-openness-for-save';
import { buildExchangeAcceptanceModel } from '../lib/marketplace/exchange/exchange-resolver';
import {
  buildDetailValueExchangeBlock,
  valueExchangeSectionTitleKey,
} from '../lib/marketplace/detail/detail-value-exchange-block';
import { PAYMENT_METHOD_REGISTRY } from '../lib/marketplace/value-exchange/payment-methods';

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

console.log('=== Marketplace Barter Openness Wiring (Phase 5B-D) ===\n');

console.log('Form prefill & save resolution');
assert(
  resolveBarterOpennessForFormPrefill(null, ['create.meal']) === 'MONEY_AND_BARTER',
  'null DB + accepted values → MONEY_AND_BARTER prefill',
);
assert(
  resolveBarterOpennessForFormPrefill('BARTER_ONLY', ['create.meal']) === 'BARTER_ONLY',
  'stored BARTER_ONLY preserved on edit',
);
assert(
  resolveBarterOpennessForFormPrefill(null, []) === 'MONEY',
  'null DB + no accepted → MONEY prefill',
);
assert(
  resolveBarterOpennessForSave({
    barterOpenness: 'MONEY_AND_BARTER',
    acceptedSpecializations: ['grow.tomato'],
  }) === 'MONEY_AND_BARTER',
  'save preserves explicit MONEY_AND_BARTER',
);
assert(
  suggestBarterOpennessAfterAcceptedValuesChange('MONEY', 2) === 'MONEY_AND_BARTER',
  'adding accepted values suggests MONEY_AND_BARTER',
);
assert(
  suggestBarterOpennessAfterAcceptedValuesChange('BARTER_ONLY', 2) === 'BARTER_ONLY',
  'BARTER_ONLY not downgraded when accepted added',
);
assert(
  barterOpennessRequiresAcceptedValues('BARTER_ONLY') === true,
  'BARTER_ONLY requires accepted values',
);

console.log('\nMatching receives barter openness from save payload');
const acceptance = buildExchangeAcceptanceModel({
  barterOpenness: 'MONEY_AND_BARTER',
  acceptedTaxonomyIds: ['create.meal'],
});
assert(acceptance !== null, 'MONEY_AND_BARTER + accepted → acceptance model');
assert(
  buildExchangeAcceptanceModel({
    barterOpenness: 'MONEY',
    acceptedTaxonomyIds: ['create.meal'],
  }) === null,
  'MONEY-only still has no acceptance model',
);

console.log('\nDetail value exchange block');
const detailBlock = buildDetailValueExchangeBlock({
  listingKind: 'PRODUCT',
  marketplaceCategory: 'CREATE',
  barterOpenness: 'MONEY_AND_BARTER',
  priceModel: 'FIXED',
  acceptedTaxonomyIds: ['create.meal'],
});
assert(detailBlock !== null, 'detail block builds for barter listing');
assert(
  detailBlock!.paymentLabelKey === PAYMENT_METHOD_REGISTRY.MONEY_AND_BARTER.labelKey,
  'detail uses payment registry label',
);
assert(
  valueExchangeSectionTitleKey() === 'marketplace.detail.valueExchange.title',
  'detail section title key',
);

console.log('\nUI wiring (static checks)');
const formSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/products/marketplace/MarketplaceOfferForm.tsx'),
  'utf8',
);
assert(formSrc.includes('BarterOpennessSelector'), 'form imports BarterOpennessSelector');
assert(formSrc.includes('barterOpenness: resolvedBarterOpenness'), 'create/edit payload includes barterOpenness');
assert(formSrc.includes('resolveBarterOpennessForFormPrefill'), 'edit prefill helper used');

const detailPageSrc = fs.readFileSync(
  path.join(process.cwd(), 'app/product/[id]/page.tsx'),
  'utf8',
);
assert(detailPageSrc.includes('ProductValueExchangeSection'), 'detail page uses value exchange section');
assert(
  !detailPageSrc.includes('ProductAcceptedBadgesSection'),
  'duplicate accepted badges section removed',
);

const detailSectionSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/product/detail/ProductValueExchangeSection.tsx'),
  'utf8',
);
assert(
  detailSectionSrc.includes('buildDetailValueExchangeBlock'),
  'detail section uses buildDetailValueExchangeBlock',
);

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
