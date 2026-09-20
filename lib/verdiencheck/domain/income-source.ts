export const INCOME_SOURCES = [
  'MARKETPLACE_SELLER',
  'AFFILIATE',
  'DELIVERY',
  'OTHER_HOMECHEFF',
] as const;

export type IncomeSource = (typeof INCOME_SOURCES)[number];

/**
 * Same certified calculator formulas. Affiliate is extra-earning result, not a new tax class.
 * DELIVERY remains disabled until separately certified.
 */
export const V1_ENABLED_INCOME_SOURCES: readonly IncomeSource[] = [
  'MARKETPLACE_SELLER',
  'AFFILIATE',
];

export function isV1IncomeSourceEnabled(source: IncomeSource): boolean {
  return V1_ENABLED_INCOME_SOURCES.includes(source);
}
