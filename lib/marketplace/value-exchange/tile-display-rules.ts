/**
 * Tile / preview / detail display rules for value exchange icons — Phase 4A.
 */

import type { ValueExchangeSurfaceTier } from './value-exchange-contract';
import type { ValueExchangeMainCategory } from './value-exchange-contract';
import type { BarterAcceptanceModel } from './value-exchange-contract';

export type TileIconDisplayRules = {
  /** Max main-category icons on tile (emoji/icon only). */
  maxCategoryIconsOnTile: number;
  /** Max accepted categories on preview. */
  maxAcceptedCategoriesOnPreview: number;
  /** Show payment method text on tile. */
  showPaymentOnTile: boolean;
  /** Show full desired exchange on detail only. */
  showDesiredExchangeOnDetailOnly: true;
  /** Never show subcategory labels on tile. */
  hideSubcategoriesOnTile: true;
};

export const TILE_ICON_DISPLAY_RULES: TileIconDisplayRules = {
  maxCategoryIconsOnTile: 3,
  maxAcceptedCategoriesOnPreview: 6,
  showPaymentOnTile: true,
  showDesiredExchangeOnDetailOnly: true,
  hideSubcategoriesOnTile: true,
};

export type SurfaceIconPlan = {
  tier: ValueExchangeSurfaceTier;
  /** Main category icons to render. */
  categoryIcons: ValueExchangeMainCategory[];
  /** Whether to show payment method chip/line. */
  showPayment: boolean;
  /** Whether to show accepted barter categories. */
  showAcceptedCategories: boolean;
  /** Whether to show subcategory labels. */
  showSubcategories: boolean;
  /** Whether to show desired exchange description block. */
  showDesiredExchange: boolean;
};

export function resolveSurfaceIconPlan(input: {
  tier: ValueExchangeSurfaceTier;
  offerMainCategory: ValueExchangeMainCategory;
  barterAcceptance: BarterAcceptanceModel | null;
}): SurfaceIconPlan {
  const { tier, offerMainCategory, barterAcceptance } = input;
  const rules = TILE_ICON_DISPLAY_RULES;

  switch (tier) {
    case 'tile':
      return {
        tier,
        categoryIcons: [offerMainCategory].slice(0, rules.maxCategoryIconsOnTile),
        showPayment: rules.showPaymentOnTile,
        showAcceptedCategories: false,
        showSubcategories: false,
        showDesiredExchange: false,
      };
    case 'preview':
      return {
        tier,
        categoryIcons: [offerMainCategory],
        showPayment: true,
        showAcceptedCategories: barterAcceptance !== null,
        showSubcategories: false,
        showDesiredExchange: false,
      };
    case 'detail':
      return {
        tier,
        categoryIcons: [offerMainCategory],
        showPayment: true,
        showAcceptedCategories: barterAcceptance !== null,
        showSubcategories: true,
        showDesiredExchange: true,
      };
    default:
      return {
        tier: 'tile',
        categoryIcons: [offerMainCategory],
        showPayment: false,
        showAcceptedCategories: false,
        showSubcategories: false,
        showDesiredExchange: false,
      };
  }
}

export function acceptedCategoriesForPreview(
  barterAcceptance: BarterAcceptanceModel | null,
): ValueExchangeMainCategory[] {
  if (!barterAcceptance) return [];
  return barterAcceptance.acceptedMainCategories.slice(
    0,
    TILE_ICON_DISPLAY_RULES.maxAcceptedCategoriesOnPreview,
  );
}
