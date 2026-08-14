/**
 * LEGAL-2 — EU Annex II / mandatory 14 allergens.
 * Canonical registry — do not duplicate elsewhere.
 */

export const EU_FOOD_ALLERGEN_IDS = [
  'GLUTEN',
  'CRUSTACEANS',
  'EGGS',
  'FISH',
  'PEANUTS',
  'SOY',
  'MILK',
  'NUTS',
  'CELERY',
  'MUSTARD',
  'SESAME',
  'SULPHITES',
  'LUPIN',
  'MOLLUSCS',
] as const;

export type EuFoodAllergenId = (typeof EU_FOOD_ALLERGEN_IDS)[number];

export type FoodAllergenLabels = { nl: string; en: string };

export const EU_FOOD_ALLERGEN_LABELS: Record<
  EuFoodAllergenId,
  FoodAllergenLabels
> = {
  GLUTEN: {
    nl: 'Granen die gluten bevatten',
    en: 'Cereals containing gluten',
  },
  CRUSTACEANS: { nl: 'Schaaldieren', en: 'Crustaceans' },
  EGGS: { nl: 'Eieren', en: 'Eggs' },
  FISH: { nl: 'Vis', en: 'Fish' },
  PEANUTS: { nl: 'Pinda’s', en: 'Peanuts' },
  SOY: { nl: 'Soja', en: 'Soybeans' },
  MILK: { nl: 'Melk', en: 'Milk' },
  NUTS: { nl: 'Noten', en: 'Nuts' },
  CELERY: { nl: 'Selderij', en: 'Celery' },
  MUSTARD: { nl: 'Mosterd', en: 'Mustard' },
  SESAME: { nl: 'Sesamzaad', en: 'Sesame' },
  SULPHITES: {
    nl: 'Zwaveldioxide en sulfieten',
    en: 'Sulphur dioxide and sulphites',
  },
  LUPIN: { nl: 'Lupine', en: 'Lupin' },
  MOLLUSCS: { nl: 'Weekdieren', en: 'Molluscs' },
};

export function isEuFoodAllergenId(v: unknown): v is EuFoodAllergenId {
  return (
    typeof v === 'string' &&
    (EU_FOOD_ALLERGEN_IDS as readonly string[]).includes(v)
  );
}

/** Normalize + dedupe; drops unknown strings. */
export function sanitizeEuFoodAllergenIds(
  input: unknown,
): EuFoodAllergenId[] {
  if (!Array.isArray(input)) return [];
  const out: EuFoodAllergenId[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    if (!isEuFoodAllergenId(raw) || seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  return out;
}

export function allergenLabel(
  id: EuFoodAllergenId,
  locale: 'nl' | 'en' = 'nl',
): string {
  return EU_FOOD_ALLERGEN_LABELS[id][locale];
}

export function formatAllergenList(
  ids: EuFoodAllergenId[],
  locale: 'nl' | 'en' = 'nl',
): string {
  return ids.map((id) => allergenLabel(id, locale)).join(', ');
}
