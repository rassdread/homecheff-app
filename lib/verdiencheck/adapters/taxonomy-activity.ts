/**
 * Maps marketplace listing taxonomy onto VerdienCheck activity/food context.
 * Does not duplicate LEGAL-2 allergen sets.
 */

import { buildFoodContext } from '../domain/food-context';
import type { CommercialIntent, SaleFrequency } from '../domain/activity';
import type { FoodAllergenApplicabilityInput } from '@/lib/legal/food-allergen-applicability';

export function foodContextFromListing(input: {
  listing: FoodAllergenApplicabilityInput;
  frequency: SaleFrequency;
  commercialIntent: CommercialIntent;
  packaged?: boolean;
}) {
  return buildFoodContext(input);
}
