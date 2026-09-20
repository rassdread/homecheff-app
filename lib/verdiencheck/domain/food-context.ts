/**
 * Food context for later guidance — reuses LEGAL-2 taxonomy.
 * Does not replace allergen enforcement. No NVWA thresholds.
 */

import {
  resolveFoodAllergenApplicability,
  type FoodAllergenApplicability,
  type FoodAllergenApplicabilityInput,
} from '@/lib/legal/food-allergen-applicability';
import type { CommercialIntent, SaleFrequency } from './activity';

export const FOOD_KINDS = [
  'PREPARED_FOOD',
  'PACKAGED_FOOD',
  'OTHER_FOOD_OR_PRODUCT',
  'NOT_FOOD',
] as const;

export type FoodKind = (typeof FOOD_KINDS)[number];

export type FoodContext = {
  kind: FoodKind;
  frequency: SaleFrequency;
  commercialIntent: CommercialIntent;
  allergenApplicability: FoodAllergenApplicability;
};

export function foodKindFromAllergenInput(
  input: FoodAllergenApplicabilityInput,
): FoodKind {
  const applicability = resolveFoodAllergenApplicability(input);
  if (applicability === 'NOT_APPLICABLE') {
    const mcat = (input.marketplaceCategory || '').toUpperCase();
    if (mcat === 'GROW') return 'OTHER_FOOD_OR_PRODUCT';
    return 'NOT_FOOD';
  }
  return 'PREPARED_FOOD';
}

export function buildFoodContext(input: {
  listing: FoodAllergenApplicabilityInput;
  frequency: SaleFrequency;
  commercialIntent: CommercialIntent;
  packaged?: boolean;
}): FoodContext {
  const allergenApplicability = resolveFoodAllergenApplicability(input.listing);
  let kind = foodKindFromAllergenInput(input.listing);
  if (kind === 'PREPARED_FOOD' && input.packaged) {
    kind = 'PACKAGED_FOOD';
  }
  return {
    kind,
    frequency: input.frequency,
    commercialIntent: input.commercialIntent,
    allergenApplicability,
  };
}
