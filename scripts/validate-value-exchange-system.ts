#!/usr/bin/env npx tsx
/**
 * Phase 4A value exchange system validation.
 * Run: npx tsx scripts/validate-value-exchange-system.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { MARKETPLACE_TAXONOMY } from '../lib/marketplace/taxonomy';
import {
  VALUE_EXCHANGE_MAIN_CATEGORIES,
  VALUE_PAYMENT_METHODS,
  FORBIDDEN_VALUE_EXCHANGE_EFFECTS,
  FUTURE_EXCHANGE_CAPABILITIES,
  MAIN_CATEGORY_REGISTRY,
  PAYMENT_METHOD_REGISTRY,
  TAXONOMY_SUBCATEGORY_MAP,
  taxonomyIdsForMainCategory,
  buildBarterAcceptanceModel,
  buildDesiredExchangeDetail,
  resolvePaymentMethod,
  resolveSurfaceIconPlan,
  TILE_ICON_DISPLAY_RULES,
  marketplaceCategoryToMainCategory,
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

console.log('=== Value Exchange System Validation (Phase 4A) ===\n');

console.log('Main categories');
assert(VALUE_EXCHANGE_MAIN_CATEGORIES.length === 8, 'eight main categories');
for (const id of VALUE_EXCHANGE_MAIN_CATEGORIES) {
  const cat = MAIN_CATEGORY_REGISTRY[id];
  assert(cat.emoji.length > 0, `${id} has emoji`);
  assert(cat.labelKey.startsWith('marketplace.valueExchange.'), `${id} i18n prefix`);
}

console.log('\nPayment methods');
assert(VALUE_PAYMENT_METHODS.length === 5, 'five payment methods');
assert(resolvePaymentMethod({ barterOpenness: 'BARTER_ONLY' }) === 'BARTER', 'barter resolver');
assert(
  resolvePaymentMethod({ priceModel: 'VOLUNTARY', barterOpenness: 'MONEY' }) ===
    'VOLUNTARY_CONTRIBUTION',
  'voluntary resolver',
);

console.log('\nTaxonomy mapping');
const taxonomyItems = MARKETPLACE_TAXONOMY.filter((t) => !t.blocked && t.level === 'item');
assert(TAXONOMY_SUBCATEGORY_MAP.length > 0, 'subcategory map built');
assert(
  TAXONOMY_SUBCATEGORY_MAP.filter((m) => m.level === 'item').length === taxonomyItems.length,
  'all taxonomy items mapped',
);
assert(
  taxonomyIdsForMainCategory('HOME_CHEFF').includes('create.meal'),
  'create.meal → HomeCheff',
);
assert(
  marketplaceCategoryToMainCategory('ARTISTIC_SERVICE', 'artistic.portrait') ===
    'HOME_DESIGNER',
  'portrait → HomeDesigner',
);
assert(
  marketplaceCategoryToMainCategory('KNOWLEDGE', 'knowledge.coaching', 'COACHING') ===
    'COACHING',
  'coaching taxonomy → Coaching',
);

console.log('\nBarter acceptance');
const barter = buildBarterAcceptanceModel({
  barterOpenness: 'MONEY_AND_BARTER',
  acceptedTaxonomyIds: ['create.meal', 'grow.tomato', 'design.photo'],
});
assert(barter !== null, 'barter model builds');
assert(
  barter!.acceptedMainCategories.includes('HOME_CHEFF'),
  'accepts HomeCheff from taxonomy',
);
assert(
  barter!.acceptedMainCategories.includes('HOME_GARDEN'),
  'accepts HomeGarden from taxonomy',
);

console.log('\nDesired exchange');
const desired = buildDesiredExchangeDetail({
  mainCategory: 'HOME_DESIGNER',
  subcategoryId: 'artistic.portrait',
  description: 'I would like a portrait of me and my daughter.',
});
assert(desired !== null, 'desired exchange builds');
assert(desired!.subcategoryId === 'artistic.portrait', 'portrait subcategory');
assert(desired!.description.length > 0, 'description preserved');

console.log('\nTile display rules');
const tilePlan = resolveSurfaceIconPlan({
  tier: 'tile',
  offerMainCategory: 'HOME_CHEFF',
  barterAcceptance: barter,
});
assert(tilePlan.showSubcategories === false, 'tile hides subcategories');
assert(tilePlan.showAcceptedCategories === false, 'tile hides accepted categories');

const previewPlan = resolveSurfaceIconPlan({
  tier: 'preview',
  offerMainCategory: 'HOME_CHEFF',
  barterAcceptance: barter,
});
assert(previewPlan.showAcceptedCategories === true, 'preview shows accepted');

const detailPlan = resolveSurfaceIconPlan({
  tier: 'detail',
  offerMainCategory: 'HOME_CHEFF',
  barterAcceptance: barter,
});
assert(detailPlan.showDesiredExchange === true, 'detail shows desired exchange');
assert(
  TILE_ICON_DISPLAY_RULES.maxCategoryIconsOnTile <= 3,
  'tile icon cap',
);

console.log('\nFuture readiness');
assert(FUTURE_EXCHANGE_CAPABILITIES.length === 4, 'four future capabilities');

console.log('\nForbidden effects');
const registryJson = JSON.stringify({ MAIN_CATEGORY_REGISTRY, PAYMENT_METHOD_REGISTRY });
for (const effect of FORBIDDEN_VALUE_EXCHANGE_EFFECTS) {
  assert(!registryJson.includes(effect), `no ${effect} in registry`);
}

console.log('\nDocs');
const docs = [
  'docs/architecture/MARKETPLACE_VALUE_EXCHANGE_SYSTEM.md',
  'docs/architecture/MARKETPLACE_ICON_LEGEND.md',
  'docs/audits/MARKETPLACE_BARTER_READINESS.md',
  'docs/progress/MARKETPLACE_VALUE_EXCHANGE_PHASE4A.md',
];
for (const doc of docs) {
  assert(fs.existsSync(path.join(process.cwd(), doc)), doc);
}

console.log('\nLib files');
const libFiles = [
  'lib/marketplace/value-exchange/value-exchange-contract.ts',
  'lib/marketplace/value-exchange/main-categories.ts',
  'lib/marketplace/value-exchange/payment-methods.ts',
  'lib/marketplace/value-exchange/category-taxonomy-map.ts',
  'lib/marketplace/value-exchange/barter-models.ts',
  'lib/marketplace/value-exchange/tile-display-rules.ts',
  'lib/marketplace/value-exchange/index.ts',
];
for (const file of libFiles) {
  assert(fs.existsSync(path.join(process.cwd(), file)), file);
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
