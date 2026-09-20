/**
 * Non-legal HomeCheff growth intent. Context for timing/volume of guidance.
 * Never a KVK, VAT, NVWA, or income-tax classification. Grants no exemption.
 *
 * DECLARED_INTENT ≠ OBSERVED_ACTIVITY ≠ LEGAL_ASSESSMENT.
 */

import type { CommercialIntent, SaleFrequency } from './activity';

export const HOMECHEFF_GROWTH_INTENTS = [
  'TRYING_OUT',
  'OCCASIONAL_EARNING',
  'REGULAR_EARNING',
  'SERIOUS_SIDE_INCOME',
  'BUILDING_BUSINESS',
] as const;

export type HomecheffGrowthIntent = (typeof HOMECHEFF_GROWTH_INTENTS)[number];

export type AssessmentLayer = 'DECLARED_INTENT' | 'OBSERVED_ACTIVITY' | 'LEGAL_ASSESSMENT';

export type DeclaredIntent = {
  layer: 'DECLARED_INTENT';
  growth: HomecheffGrowthIntent;
  commercialIntent: CommercialIntent;
  frequency: SaleFrequency;
};

export type ObservedActivity = {
  layer: 'OBSERVED_ACTIVITY';
  transactionCount: number | null;
  frequencyObserved: SaleFrequency | null;
  publicCustomers: boolean | null;
  activeAcquisition: boolean | null;
  foodSoldMultipleTimesPerYear: boolean | null;
};

/**
 * Intent is context, not a legal exemption.
 * Never: HOBBY → KVK false → VAT false → NVWA false.
 */
export function declaredIntentIsNotLegalExemption(_intent: HomecheffGrowthIntent): true {
  void _intent;
  return true;
}

export function deriveDeclaredGrowthIntent(input: {
  commercialIntent: CommercialIntent;
  frequency: SaleFrequency;
}): HomecheffGrowthIntent {
  if (input.commercialIntent === 'BUILD_BUSINESS') return 'BUILDING_BUSINESS';
  if (input.commercialIntent === 'SERIOUS_SIDE_INCOME') return 'SERIOUS_SIDE_INCOME';
  if (input.frequency === 'REGULAR') return 'REGULAR_EARNING';
  if (input.frequency === 'OCCASIONAL' || input.commercialIntent === 'SIDE_INCOME') {
    return 'OCCASIONAL_EARNING';
  }
  if (
    input.frequency === 'ONE_OFF' ||
    input.commercialIntent === 'HOBBY_COST_RECOVERY'
  ) {
    return 'TRYING_OUT';
  }
  return 'OCCASIONAL_EARNING';
}

/**
 * Observed activity may upgrade guidance timing. It never overwrites a legal engine.
 */
export function observedActivityOutranksDeclaredIntent(): true {
  return true;
}

export function isLowFearDefaultIntent(intent: HomecheffGrowthIntent): boolean {
  return intent === 'TRYING_OUT' || intent === 'OCCASIONAL_EARNING';
}
