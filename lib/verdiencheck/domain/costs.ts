export const COST_SOURCES = [
  'USER_ESTIMATED',
  'ESTIMATED',
  'CONFIRMED_RECEIPT',
  'MIXED',
] as const;

export type CostSource = (typeof COST_SOURCES)[number];

export type CostInput = {
  amountCents: number;
  source: CostSource;
};

/**
 * Fiscal deductibility is a certified-rule output, not a user input.
 * Do not treat CostInput as DeductibleTaxCost.
 */
export type DeductibleTaxCost = {
  amountCents: number;
  ruleKey: string;
  packId: string;
};

export const V1_COST_SOURCE: CostSource = 'USER_ESTIMATED';
