export const INCOME_SOURCES = [
  'MARKETPLACE_SELLER',
  'AFFILIATE',
  'DELIVERY',
  'OTHER_HOMECHEFF',
] as const;

export type IncomeSource = (typeof INCOME_SOURCES)[number];

/** V1 calculator/wijzer: marketplace seller only. */
export const V1_ENABLED_INCOME_SOURCES: readonly IncomeSource[] = [
  'MARKETPLACE_SELLER',
];

export function isV1IncomeSourceEnabled(source: IncomeSource): boolean {
  return V1_ENABLED_INCOME_SOURCES.includes(source);
}
