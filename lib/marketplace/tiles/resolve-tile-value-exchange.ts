/**
 * Resolve value-exchange fields for tile surfaces — Phase 5B-A data readiness.
 * No UI wiring; consumed by future tile redesign.
 */

import type { MarketplaceCategory } from '@prisma/client';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import {
  acceptedMainCategoriesFromTaxonomyIds,
  marketplaceCategoryToMainCategory,
} from '@/lib/marketplace/value-exchange/category-taxonomy-map';
import { primarySpecialization } from '@/lib/marketplace/taxonomy-normalize';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';

export type TileValueExchangeFields = {
  offerMainCategory: ValueExchangeMainCategory | null;
  offerSubCategory: string | null;
  offerSubCategoryIcon: string | null;
  acceptedValueCategories: ValueExchangeMainCategory[];
  acceptedValueSubcategories: string[];
};

export function resolveTileValueExchangeFields(input: {
  marketplaceCategory: MarketplaceCategory | string | null;
  specializations: string[];
  acceptedSpecializations: string[];
  listingKind?: ListingKind | null;
  listingIntent?: 'OFFER' | 'REQUEST' | null;
}): TileValueExchangeFields {
  const category = (input.marketplaceCategory ?? null) as MarketplaceCategory | null;
  const primary = primarySpecialization(input.specializations);
  const primaryItem = primary ? getMarketplaceTaxonomyItem(primary) : undefined;

  const offerMainCategory =
    category != null
      ? marketplaceCategoryToMainCategory(
          category,
          primary,
          input.listingKind ?? null,
        )
      : null;

  const acceptedValueSubcategories = input.acceptedSpecializations.filter((id) => {
    const item = getMarketplaceTaxonomyItem(id);
    return !!item && item.level === 'item';
  });

  const acceptedValueCategories = acceptedMainCategoriesFromTaxonomyIds(
    acceptedValueSubcategories,
  );

  return {
    offerMainCategory,
    offerSubCategory: primary,
    offerSubCategoryIcon: primaryItem?.icon ?? null,
    acceptedValueCategories,
    acceptedValueSubcategories,
  };
}
