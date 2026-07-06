/**
 * Canonical mapping: taxonomy ids → main categories + subcategories.
 * @see lib/marketplace/taxonomy.ts
 */

import type { MarketplaceCategory } from '@prisma/client';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { MARKETPLACE_TAXONOMY } from '@/lib/marketplace/taxonomy';
import type { ValueExchangeMainCategory } from './value-exchange-contract';
import { MAIN_CATEGORY_REGISTRY } from './main-categories';

export type TaxonomySubcategoryMapping = {
  taxonomyId: string;
  mainCategory: ValueExchangeMainCategory;
  marketplaceCategory: MarketplaceCategory;
  parentGroupId: string | null;
  labelKey: string;
  icon: string;
  level: 'group' | 'item';
};

const CATEGORY_TO_MAIN: Record<MarketplaceCategory, ValueExchangeMainCategory> = {
  CREATE: 'HOME_CHEFF',
  GROW: 'HOME_GARDEN',
  DESIGN: 'HOME_DESIGNER',
  ARTISTIC_SERVICE: 'HOME_DESIGNER',
  PRACTICAL_SERVICE: 'SERVICES',
  KNOWLEDGE: 'WORKSHOPS',
};

/** Knowledge items that map to coaching main category. */
const COACHING_TAXONOMY_IDS = new Set([
  'knowledge.coaching',
  'knowledge.coaching_lifestyle',
  'knowledge.coaching_sport',
]);

/** Knowledge items that map to workshops main category. */
const WORKSHOP_TAXONOMY_IDS = new Set([
  'knowledge.workshop',
  'knowledge.cookingclass',
  'knowledge.musicclass',
  'knowledge.tutoring',
  'knowledge.language',
]);

export function marketplaceCategoryToMainCategory(
  category: MarketplaceCategory,
  taxonomyId?: string | null,
  listingKind?: ListingKind | null,
): ValueExchangeMainCategory {
  if (listingKind === 'WORKSHOP') return 'WORKSHOPS';
  if (listingKind === 'COACHING') return 'COACHING';
  if (listingKind === 'REQUEST') return 'REQUESTS';
  if (listingKind === 'TASK' || listingKind === 'SERVICE') {
    if (category === 'PRACTICAL_SERVICE') return 'SERVICES';
    if (category === 'DESIGN' || category === 'ARTISTIC_SERVICE') return 'HOME_DESIGNER';
  }

  if (category === 'KNOWLEDGE' && taxonomyId) {
    if (COACHING_TAXONOMY_IDS.has(taxonomyId)) return 'COACHING';
    if (WORKSHOP_TAXONOMY_IDS.has(taxonomyId)) return 'WORKSHOPS';
  }

  return CATEGORY_TO_MAIN[category] ?? 'HOME_CHEFF';
}

export function buildTaxonomySubcategoryMap(): TaxonomySubcategoryMapping[] {
  return MARKETPLACE_TAXONOMY.filter((item) => !item.blocked).map((item) => ({
    taxonomyId: item.id,
    mainCategory: marketplaceCategoryToMainCategory(item.category, item.id),
    marketplaceCategory: item.category,
    parentGroupId: item.parentId ?? null,
    labelKey: item.labelKey,
    icon: item.icon,
    level: item.level === 'group' ? 'group' : 'item',
  }));
}

export function taxonomyIdsForMainCategory(
  mainCategory: ValueExchangeMainCategory,
): string[] {
  return buildTaxonomySubcategoryMap()
    .filter((m) => m.mainCategory === mainCategory && m.level === 'item')
    .map((m) => m.taxonomyId);
}

export function mainCategoriesFromTaxonomyIds(
  taxonomyIds: string[],
): ValueExchangeMainCategory[] {
  const map = buildTaxonomySubcategoryMap();
  const byId = new Map(map.map((m) => [m.taxonomyId, m]));
  const out = new Set<ValueExchangeMainCategory>();

  for (const id of taxonomyIds) {
    const entry = byId.get(id);
    if (entry) out.add(entry.mainCategory);
  }

  return [...out];
}

export function acceptedMainCategoriesFromTaxonomyIds(
  acceptedTaxonomyIds: string[],
): ValueExchangeMainCategory[] {
  const mains = mainCategoriesFromTaxonomyIds(acceptedTaxonomyIds);
  return mains.filter((id) => {
    const contract = MAIN_CATEGORY_REGISTRY[id];
    return !contract.isFulfillmentChannel && !contract.isRequestIntent;
  });
}

export function subcategoriesForMainCategory(
  mainCategory: ValueExchangeMainCategory,
): TaxonomySubcategoryMapping[] {
  return buildTaxonomySubcategoryMap().filter(
    (m) => m.mainCategory === mainCategory && m.level === 'item',
  );
}

export const TAXONOMY_SUBCATEGORY_MAP = buildTaxonomySubcategoryMap();
