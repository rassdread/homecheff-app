/**
 * Accepted values grouped by main category — Phase 4C-UI.
 * Uses taxonomy ids only; optional notes when present in source data.
 */

import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import { MAIN_CATEGORY_REGISTRY } from '@/lib/marketplace/value-exchange/main-categories';
import { marketplaceCategoryToMainCategory } from '@/lib/marketplace/value-exchange/category-taxonomy-map';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { resolveTileValueExchangeFields } from '@/lib/marketplace/tiles/resolve-tile-value-exchange';

export type AcceptedValueSubcategoryLine = {
  taxonomyId: string;
  labelKey: string;
  icon: string;
  /** Only set when non-empty in source data — never fabricated. */
  note?: string;
};

export type AcceptedValueCategoryGroup = {
  mainCategory: ValueExchangeMainCategory;
  emoji: string;
  labelKey: string;
  subcategories: AcceptedValueSubcategoryLine[];
};

export type DetailAcceptedValuesPresentation = {
  groups: AcceptedValueCategoryGroup[];
  hasContent: boolean;
};

export function buildDetailAcceptedValuesPresentation(input: {
  acceptedTaxonomyIds: string[];
  marketplaceCategory?: string | null;
  listingKind?: ListingKind | null;
  /** Optional per-taxonomy notes — only pass real data. */
  notesByTaxonomyId?: Record<string, string>;
}): DetailAcceptedValuesPresentation {
  const fields = resolveTileValueExchangeFields({
    marketplaceCategory: input.marketplaceCategory ?? null,
    specializations: [],
    acceptedSpecializations: input.acceptedTaxonomyIds,
    listingKind: input.listingKind ?? null,
  });

  if (fields.acceptedValueSubcategories.length === 0) {
    return { groups: [], hasContent: false };
  }

  const byCategory = new Map<ValueExchangeMainCategory, AcceptedValueSubcategoryLine[]>();

  for (const taxonomyId of fields.acceptedValueSubcategories) {
    const item = getMarketplaceTaxonomyItem(taxonomyId);
    if (!item || item.level !== 'item') continue;

    const mainCategory = marketplaceCategoryToMainCategory(
      item.category,
      taxonomyId,
      input.listingKind ?? null,
    );
    const note = input.notesByTaxonomyId?.[taxonomyId]?.trim();
    const line: AcceptedValueSubcategoryLine = {
      taxonomyId,
      labelKey: item.labelKey,
      icon: item.icon,
      ...(note ? { note } : {}),
    };

    const list = byCategory.get(mainCategory) ?? [];
    list.push(line);
    byCategory.set(mainCategory, list);
  }

  const groups: AcceptedValueCategoryGroup[] = [...byCategory.entries()].map(
    ([mainCategory, subcategories]) => {
      const reg = MAIN_CATEGORY_REGISTRY[mainCategory];
      return {
        mainCategory,
        emoji: reg.emoji,
        labelKey: reg.labelKey,
        subcategories,
      };
    },
  );

  return {
    groups,
    hasContent: groups.length > 0,
  };
}
