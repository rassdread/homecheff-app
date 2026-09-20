/**
 * Adapter to LEGAL-2 allergen SoT. Does not duplicate EU-14 IDs or checkout gates.
 * Gluten cereal / nut species are extra detail on top of LEGAL-2 ids.
 */

import {
  EU_FOOD_ALLERGEN_IDS,
  EU_FOOD_ALLERGEN_LABELS,
  sanitizeEuFoodAllergenIds,
  type EuFoodAllergenId,
} from '../../legal/eu-food-allergens';
import {
  productRequiresAllergenConfirmation,
  resolveFoodAllergenApplicability,
  type FoodAllergenApplicability,
  type FoodAllergenApplicabilityInput,
} from '../../legal/food-allergen-applicability';
import {
  buildFoodAllergenContext,
  toPublicFoodAllergenView,
} from '../../legal/food-allergen-context';

export {
  EU_FOOD_ALLERGEN_IDS,
  EU_FOOD_ALLERGEN_LABELS,
  sanitizeEuFoodAllergenIds,
  productRequiresAllergenConfirmation,
  resolveFoodAllergenApplicability,
  buildFoodAllergenContext,
  toPublicFoodAllergenView,
};
export type { EuFoodAllergenId, FoodAllergenApplicability, FoodAllergenApplicabilityInput };

export const GLUTEN_CEREAL_SPECIES = [
  'WHEAT',
  'RYE',
  'BARLEY',
  'OATS',
  'SPELT',
  'KAMUT',
] as const;
export type GlutenCerealSpecies = (typeof GLUTEN_CEREAL_SPECIES)[number];

export const NUT_SPECIES = [
  'ALMOND',
  'HAZELNUT',
  'WALNUT',
  'CASHEW',
  'PECAN',
  'BRAZIL_NUT',
  'PISTACHIO',
  'MACADAMIA',
] as const;
export type NutSpecies = (typeof NUT_SPECIES)[number];

export function glutenRequiresCerealSpecies(ids: readonly EuFoodAllergenId[]): boolean {
  return ids.includes('GLUTEN');
}

export function nutsRequireNutSpecies(ids: readonly EuFoodAllergenId[]): boolean {
  return ids.includes('NUTS');
}

/** HomeCheff product choice: allergen info in the listing, before purchase. */
export const HOMECHEFF_ALLERGEN_CHANNEL = 'WRITTEN_IN_LISTING_BEFORE_PURCHASE' as const;

export function allergenInfoMustBeAvailableBeforePurchase(): true {
  return true;
}

export function listingAllergenInfoIsNotPhysicalLabel(): true {
  return true;
}

export const EU14_COUNT = EU_FOOD_ALLERGEN_IDS.length;
