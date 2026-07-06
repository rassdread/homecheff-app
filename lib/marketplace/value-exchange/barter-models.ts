/**
 * Barter acceptance + desired exchange models — Phase 4A.
 */

import type { BarterOpenness } from '@prisma/client';
import type {
  BarterAcceptanceModel,
  DesiredExchangeDetail,
  ValueExchangeMainCategory,
} from './value-exchange-contract';
import {
  acceptedMainCategoriesFromTaxonomyIds,
  marketplaceCategoryToMainCategory,
} from './category-taxonomy-map';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';

export function buildBarterAcceptanceModel(input: {
  barterOpenness: BarterOpenness | string | null;
  acceptedTaxonomyIds: string[];
}): BarterAcceptanceModel | null {
  const openness = String(input.barterOpenness ?? 'MONEY').toUpperCase() as BarterOpenness;
  if (openness === 'MONEY') return null;

  return {
    acceptedMainCategories: acceptedMainCategoriesFromTaxonomyIds(
      input.acceptedTaxonomyIds,
    ),
    acceptedTaxonomyIds: input.acceptedTaxonomyIds,
    openness,
  };
}

export function buildDesiredExchangeDetail(input: {
  mainCategory: ValueExchangeMainCategory;
  subcategoryId: string;
  description: string;
}): DesiredExchangeDetail | null {
  const item = getMarketplaceTaxonomyItem(input.subcategoryId);
  if (!item || item.blocked) return null;

  const resolvedMain = marketplaceCategoryToMainCategory(
    item.category,
    item.id,
  );

  return {
    mainCategory: input.mainCategory ?? resolvedMain,
    subcategoryId: input.subcategoryId,
    subcategoryLabelKey: item.labelKey,
    description: input.description.trim(),
  };
}

export function barterAcceptsMainCategory(
  model: BarterAcceptanceModel,
  category: ValueExchangeMainCategory,
): boolean {
  return model.acceptedMainCategories.includes(category);
}
