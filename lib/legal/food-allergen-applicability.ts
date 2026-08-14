/**
 * LEGAL-2 — when EU allergen confirmation applies to a Product offer.
 * Separate from LEGAL-1 commerce declaration.
 *
 * Prepared / assembled food → required.
 * Whole home-grown produce (GROW) → not forced through meal allergen UX.
 * Craft within CREATE (clothing/jewelry/…) → not food allergens.
 * Ambiguous CREATE/CHEFF without specs → conservative: required.
 */

import { toCanonicalTaxonomyId } from '@/lib/marketplace/taxonomy-normalize';

/** Prepared / processed food specializations that need EU-14 disclosure. */
export const PREPARED_FOOD_TAXONOMY_IDS = new Set([
  'create.meal',
  'create.baking',
  'create.bread',
  'create.cake',
  'create.cupcakes',
  'create.cookies',
  'create.soup',
  'create.pasta',
  'create.rice',
  'create.catering',
  'create.bbq',
  'create.cuisine_surinamese',
  'create.cuisine_indonesian',
  'create.cuisine_caribbean',
  'create.coffee',
  'create.tea',
  'create.cacao',
  'create.olive_oil',
  'create.spices',
  'create.sauces',
  'create.preserves',
]);

/** CREATE craft — not food allergen applicable. */
export const NON_FOOD_CREATE_TAXONOMY_IDS = new Set([
  'create.clothing',
  'create.jewelry',
  'create.decoration',
  'create.art',
]);

export type FoodAllergenApplicability =
  | 'REQUIRED'
  | 'NOT_APPLICABLE'
  | 'AMBIGUOUS_TREAT_AS_REQUIRED';

export type FoodAllergenApplicabilityInput = {
  category?: string | null;
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
  subcategory?: string | null;
};

function resolveSpecIds(input: FoodAllergenApplicabilityInput): string[] {
  const specs = (input.specializations ?? [])
    .map((s) => toCanonicalTaxonomyId(s) || s)
    .filter(Boolean);
  if (specs.length > 0) return specs;
  if (input.subcategory?.trim()) {
    const c = toCanonicalTaxonomyId(input.subcategory);
    return c ? [c] : [];
  }
  return [];
}

/**
 * Whether allergen confirmation is required before a HomeCheff transaction.
 */
export function resolveFoodAllergenApplicability(
  input: FoodAllergenApplicabilityInput,
): FoodAllergenApplicability {
  const mcat = (input.marketplaceCategory || '').toUpperCase();
  const cat = (input.category || '').toUpperCase();
  const specs = resolveSpecIds(input);

  // Services / design / knowledge — not food allergens
  if (
    mcat === 'ARTISTIC_SERVICE' ||
    mcat === 'PRACTICAL_SERVICE' ||
    mcat === 'KNOWLEDGE' ||
    mcat === 'DESIGN' ||
    cat === 'DESIGNER'
  ) {
    return 'NOT_APPLICABLE';
  }

  // Whole home-grown produce — different/light path (not meal allergen UX)
  if (mcat === 'GROW' || cat === 'GROWN' || cat === 'GARDEN') {
    return 'NOT_APPLICABLE';
  }

  if (specs.some((id) => NON_FOOD_CREATE_TAXONOMY_IDS.has(id))) {
    // Mixed food+craft: if any prepared food present, still required
    if (specs.some((id) => PREPARED_FOOD_TAXONOMY_IDS.has(id))) {
      return 'REQUIRED';
    }
    return 'NOT_APPLICABLE';
  }

  if (specs.some((id) => PREPARED_FOOD_TAXONOMY_IDS.has(id))) {
    return 'REQUIRED';
  }

  if (mcat === 'CREATE' || cat === 'CHEFF') {
    // CREATE/CHEFF without recognized prepared specs — conservative
    if (specs.length === 0) return 'AMBIGUOUS_TREAT_AS_REQUIRED';
    // Unknown create.* ids that are not craft → treat as required
    return 'AMBIGUOUS_TREAT_AS_REQUIRED';
  }

  return 'NOT_APPLICABLE';
}

export function productRequiresAllergenConfirmation(
  input: FoodAllergenApplicabilityInput,
): boolean {
  const a = resolveFoodAllergenApplicability(input);
  return a === 'REQUIRED' || a === 'AMBIGUOUS_TREAT_AS_REQUIRED';
}
