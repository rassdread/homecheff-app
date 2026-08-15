/**
 * LEGAL-4A — DAC7 activity classification (derive layer).
 * Does NOT set LEGAL-1 commerceDeclaration.
 */

export const DAC7_ACTIVITY_CATEGORIES = [
  'GOODS',
  'PERSONAL_SERVICE',
  'OTHER_NON_REPORTABLE_OR_REVIEW',
] as const;

export type Dac7ActivityCategory =
  (typeof DAC7_ACTIVITY_CATEGORIES)[number];

/**
 * Map HomeCheff marketplaceCategory → DAC7 activity class.
 * Ambiguous DESIGN → REVIEW (OTHER_NON_REPORTABLE_OR_REVIEW).
 */
export function classifyDac7ActivityFromMarketplaceCategory(
  marketplaceCategory: string | null | undefined,
  legacyCategory?: string | null,
): Dac7ActivityCategory {
  const mcat = (marketplaceCategory || '').toUpperCase();
  const legacy = (legacyCategory || '').toUpperCase();

  if (
    mcat === 'ARTISTIC_SERVICE' ||
    mcat === 'PRACTICAL_SERVICE' ||
    mcat === 'KNOWLEDGE'
  ) {
    return 'PERSONAL_SERVICE';
  }

  if (mcat === 'CREATE' || mcat === 'GROW') {
    return 'GOODS';
  }

  // DESIGN can be goods or service — do not guess.
  if (mcat === 'DESIGN') {
    return 'OTHER_NON_REPORTABLE_OR_REVIEW';
  }

  // Legacy Product.category fallback
  if (legacy === 'CHEFF' || legacy === 'GARDEN') return 'GOODS';
  if (legacy === 'DESIGNER') return 'OTHER_NON_REPORTABLE_OR_REVIEW';

  return 'OTHER_NON_REPORTABLE_OR_REVIEW';
}

/** Goods 30 / €2,000 exclusion must NEVER apply to personal services. */
export function goodsThresholdAppliesToCategory(
  category: Dac7ActivityCategory,
): boolean {
  return category === 'GOODS';
}
