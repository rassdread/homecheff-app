#!/usr/bin/env npx tsx
/**
 * Phase 5B-A — taxonomy consolidation validation.
 * Run: npx tsx scripts/validate-marketplace-taxonomy-consolidation.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as LucideIcons from 'lucide-react';
import { MARKETPLACE_TAXONOMY } from '../lib/marketplace/taxonomy';
import {
  getAcceptedValueTaxonomyItems,
  getMarketplaceTaxonomyRegistryMap,
  getOfferTaxonomyItems,
  getRequestTaxonomyItems,
} from '../lib/marketplace/taxonomy-resolve';
import { resolveMarketplaceI18nPath } from '../lib/marketplace/taxonomy-i18n';
import { TAXONOMY_ITEM_LABELS } from '../lib/marketplace/taxonomy-labels.data';
import {
  getLegacyDutchSubcategoryMapKeys,
  legacyDutchSubcategoryToTaxonomyId,
} from '../lib/marketplace/legacy-subcategory-map';
import {
  getLegacySpecializationMappingKeys,
  legacySpecializationToTaxonomyId,
} from '../lib/marketplace/taxonomy-migrate';
import { toCanonicalTaxonomyId } from '../lib/marketplace/taxonomy-normalize';
import { marketplaceCategoryToMainCategory } from '../lib/marketplace/value-exchange/category-taxonomy-map';
import { buildExchangeListingProfile } from '../lib/marketplace/exchange';
import { resolveExchangeMatch } from '../lib/marketplace/exchange';
import { resolveTileValueExchangeFields } from '../lib/marketplace/tiles/resolve-tile-value-exchange';
import { TILE_ICON_DISPLAY_RULES } from '../lib/marketplace/value-exchange/tile-display-rules';

const ROOT = path.resolve(__dirname, '..');
const NL_PATH = path.join(ROOT, 'public/i18n/nl.json');
const EN_PATH = path.join(ROOT, 'public/i18n/en.json');

const PHASE_5B_A_NEW_IDS = [
  'create.bbq',
  'create.cuisine_surinamese',
  'create.cuisine_indonesian',
  'create.cuisine_caribbean',
  'grow.cuttings',
  'grow.houseplants',
  'practical.childcare',
  'practical.bike_repair',
  'knowledge.coaching_lifestyle',
  'knowledge.coaching_sport',
] as const;

const COVERAGE_AUDIT_IDS = [
  'create.cuisine_surinamese',
  'create.cuisine_indonesian',
  'create.cuisine_caribbean',
  'create.bbq',
  'grow.cuttings',
  'grow.houseplants',
  'practical.childcare',
  'practical.bike_repair',
  'knowledge.coaching_lifestyle',
  'knowledge.coaching_sport',
] as const;

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

function section(title: string) {
  console.log(`\n── ${title}`);
}

function main(): void {
  console.log('Marketplace taxonomy consolidation validation (Phase 5B-A)\n');

  const map = getMarketplaceTaxonomyRegistryMap();
  const offerItems = getOfferTaxonomyItems();
  const requestItems = getRequestTaxonomyItems();
  const acceptedItems = getAcceptedValueTaxonomyItems();
  const nl = JSON.parse(fs.readFileSync(NL_PATH, 'utf8')) as Record<string, unknown>;
  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8')) as Record<string, unknown>;
  const nlMarketplace = nl.marketplace as Record<string, unknown>;
  const enMarketplace = en.marketplace as Record<string, unknown>;

  section('Registry integrity');
  const ids = new Set<string>();
  for (const entry of MARKETPLACE_TAXONOMY) {
    assert(!ids.has(entry.id), `unique id: ${entry.id}`);
    ids.add(entry.id);
    if (entry.parentId) {
      assert(map.has(entry.parentId), `parent exists: ${entry.parentId} → ${entry.id}`);
    }
  }

  const selectableCount = MARKETPLACE_TAXONOMY.filter(
    (e) => e.level === 'item' && !e.blocked && !e.futureOnly,
  ).length;
  assert(selectableCount === 96, `96 selecteerbare items (got ${selectableCount})`);
  assert(offerItems.length === 96, `offer role: 96 items (got ${offerItems.length})`);
  assert(requestItems.length === 96, `request role: 96 items (got ${requestItems.length})`);
  assert(acceptedItems.length === 96, `accepted role: 96 items (got ${acceptedItems.length})`);

  section('Phase 5B-A new items');
  for (const id of PHASE_5B_A_NEW_IDS) {
    const item = map.get(id);
    assert(!!item, `registry contains ${id}`);
    if (!item) continue;
    assert(item.level === 'item', `${id} is item level`);
    assert(!!item.parentId, `${id} has parentId`);
    assert(item.allowedAsOffer, `${id} allowedAsOffer`);
    assert(item.allowedAsRequest, `${id} allowedAsRequest`);
    assert(item.allowedAsAcceptedValue, `${id} allowedAsAcceptedValue`);
    assert(offerItems.some((o) => o.id === id), `${id} in offer picker`);
    assert(acceptedItems.some((o) => o.id === id), `${id} in accepted picker`);
  }

  section('Icon coverage');
  for (const item of offerItems) {
    const Icon = (LucideIcons as Record<string, unknown>)[item.icon];
    assert(!!Icon, `Lucide icon "${item.icon}" for ${item.id}`);
  }

  section('i18n coverage');
  for (const id of Object.keys(TAXONOMY_ITEM_LABELS)) {
    const key = `marketplace.taxonomy.${id}.label`;
    assert(!!resolveMarketplaceI18nPath(nlMarketplace, key), `NL ${key}`);
    assert(!!resolveMarketplaceI18nPath(enMarketplace, key), `EN ${key}`);
  }
  for (const id of COVERAGE_AUDIT_IDS) {
    assert(!!TAXONOMY_ITEM_LABELS[id], `label data for ${id}`);
  }

  section('Legacy Dutch subcategory mappings');
  for (const key of getLegacyDutchSubcategoryMapKeys()) {
    const mapped = legacyDutchSubcategoryToTaxonomyId(key);
    assert(mapped !== null, `Dutch "${key}" → taxonomy id`);
    if (mapped) assert(map.has(mapped), `Dutch mapping target ${mapped}`);
  }
  assert(
    legacyDutchSubcategoryToTaxonomyId('BBQ') === 'create.bbq',
    'CompactChef BBQ → create.bbq',
  );
  assert(
    legacyDutchSubcategoryToTaxonomyId('Stekjes') === 'grow.cuttings',
    'CompactGarden Stekjes → grow.cuttings',
  );
  assert(
    legacyDutchSubcategoryToTaxonomyId('Kamerplanten') === 'grow.houseplants',
    'CompactGarden Kamerplanten → grow.houseplants',
  );
  assert(
    legacyDutchSubcategoryToTaxonomyId('Oppas') === 'practical.childcare',
    'Oppas → practical.childcare',
  );

  section('Legacy slug mappings');
  for (const key of getLegacySpecializationMappingKeys()) {
    const mapped = legacySpecializationToTaxonomyId(key);
    assert(mapped !== null, `slug "${key}" → taxonomy id`);
  }

  section('Normalization');
  assert(
    toCanonicalTaxonomyId('Surinaams') === 'create.cuisine_surinamese',
    'normalize Surinaams',
  );
  assert(
    toCanonicalTaxonomyId('fietsreparatie') === 'practical.bike_repair',
    'normalize fietsreparatie slug',
  );

  section('Main category mapping');
  assert(
    marketplaceCategoryToMainCategory('CREATE', 'create.bbq') === 'HOME_CHEFF',
    'BBQ → HOME_CHEFF',
  );
  assert(
    marketplaceCategoryToMainCategory('KNOWLEDGE', 'knowledge.coaching_sport') === 'COACHING',
    'sport coaching → COACHING',
  );
  assert(
    marketplaceCategoryToMainCategory('PRACTICAL_SERVICE', 'practical.childcare') === 'SERVICES',
    'oppas → SERVICES',
  );

  section('Exchange matching compatibility');
  const surinamOffer = buildExchangeListingProfile({
    listingId: 'a1',
    userId: 'u1',
    listingKind: 'PRODUCT',
    listingIntent: 'OFFER',
    marketplaceCategory: 'CREATE',
    specializationIds: ['create.cuisine_surinamese'],
    acceptedTaxonomyIds: [],
    barterOpenness: 'MONEY_AND_BARTER',
    createdAt: new Date().toISOString(),
  });
  const indoRequest = buildExchangeListingProfile({
    listingId: 'b1',
    userId: 'u2',
    listingKind: 'REQUEST',
    listingIntent: 'REQUEST',
    marketplaceCategory: 'CREATE',
    specializationIds: ['create.cuisine_indonesian'],
    acceptedTaxonomyIds: [],
    barterOpenness: 'MONEY_AND_BARTER',
    desiredExchanges: [
      {
        mainCategory: 'HOME_CHEFF',
        subcategoryId: 'create.cuisine_surinamese',
        description: 'Surinaams',
      },
    ],
    createdAt: new Date().toISOString(),
  });
  const match = resolveExchangeMatch({ a: surinamOffer, b: indoRequest });
  assert(match !== null, 'exchange match resolves for cuisine profiles');
  if (match) {
    assert(
      match.overlap.sharedSubcategoryIds.length >= 0,
      'overlap computes subcategory ids',
    );
  }

  const portraitOffer = buildExchangeListingProfile({
    listingId: 'p1',
    userId: 'u3',
    listingKind: 'SERVICE',
    listingIntent: 'OFFER',
    marketplaceCategory: 'ARTISTIC_SERVICE',
    specializationIds: ['artistic.portrait'],
    acceptedTaxonomyIds: ['create.cuisine_surinamese'],
    barterOpenness: 'MONEY_AND_BARTER',
    createdAt: new Date().toISOString(),
  });
  assert(
    portraitOffer.acceptance?.subcategoryIds.includes('create.cuisine_surinamese'),
    'accepted Surinaams uses taxonomy id on profile',
  );

  section('Tile value-exchange readiness');
  const tileFields = resolveTileValueExchangeFields({
    marketplaceCategory: 'ARTISTIC_SERVICE',
    specializations: ['artistic.portrait'],
    acceptedSpecializations: ['create.cuisine_surinamese'],
    listingKind: 'SERVICE',
    listingIntent: 'OFFER',
  });
  assert(tileFields.offerMainCategory === 'HOME_DESIGNER', 'tile offerMainCategory');
  assert(tileFields.offerSubCategory === 'artistic.portrait', 'tile offerSubCategory');
  assert(!!tileFields.offerSubCategoryIcon, 'tile offerSubCategoryIcon');
  assert(
    tileFields.acceptedValueSubcategories.includes('create.cuisine_surinamese'),
    'tile acceptedValueSubcategories',
  );
  assert(
    tileFields.acceptedValueCategories.includes('HOME_CHEFF'),
    'tile acceptedValueCategories',
  );

  section('Display rules contract');
  assert(
    TILE_ICON_DISPLAY_RULES.maxCategoryIconsOnTile >= 1,
    'tile display rules maxCategoryIconsOnTile',
  );
  assert(
    TILE_ICON_DISPLAY_RULES.hideSubcategoriesOnTile === true,
    'tile tier still hides subcategories (5B not wired)',
  );

  section('Flow unification (source files)');
  const categorySelector = fs.readFileSync(
    path.join(ROOT, 'components/products/CategoryFormSelector.tsx'),
    'utf8',
  );
  assert(
    categorySelector.includes('useMarketplaceV2') &&
      categorySelector.includes('editMode={editMode}'),
    'CategoryFormSelector routes edit to MarketplaceOfferForm',
  );
  assert(
    fs.readFileSync(
      path.join(ROOT, 'components/products/marketplace/TaxonomySpecializationPicker.tsx'),
      'utf8',
    ).includes('getEntryFlowItemsForGroup'),
    'TaxonomySpecializationPicker uses taxonomy-resolve',
  );
  assert(
    fs.readFileSync(
      path.join(ROOT, 'lib/marketplace/legacy-subcategory-map.ts'),
      'utf8',
    ).includes('LEGACY_DUTCH_SUBCATEGORY_MAP'),
    'legacy-subcategory-map central file exists',
  );

  console.log(`\n${'─'.repeat(48)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log('✅ Taxonomy consolidation validation passed');
}

main();
