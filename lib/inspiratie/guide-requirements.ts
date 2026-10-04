/**
 * Existing Dish fields that make an inspiration item a usable how-to.
 * An offer is not an inspiration unless one of these guides was actually supplied.
 */

export type InspirationGuideInput = {
  ingredients?: unknown;
  instructions?: unknown;
  materials?: unknown;
  notes?: unknown;
  plantType?: unknown;
  soilType?: unknown;
  plantDate?: unknown;
  harvestDate?: unknown;
  growthDuration?: unknown;
  plantDistance?: unknown;
  growthPhotos?: unknown;
};

function textList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function hasGrowthPhotos(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

/** Ingredients and preparation steps. Prep time alone is not a recipe. */
export function hasMeaningfulRecipeGuide(input: InspirationGuideInput): boolean {
  return textList(input.ingredients).length > 0 && textList(input.instructions).length > 0;
}

/** Materials, making steps, or notes that the design guide can show. */
export function hasMeaningfulDesignGuide(input: InspirationGuideInput): boolean {
  return (
    textList(input.materials).length > 0 ||
    textList(input.instructions).length > 0 ||
    text(input.notes).length > 0
  );
}

/**
 * Growing or care content. Default sun/water/location values do not count.
 * Notes and growth photos do. A plant name counts only together with a care field.
 */
export function hasMeaningfulGardenGuide(input: InspirationGuideInput): boolean {
  if (text(input.notes)) return true;
  if (hasGrowthPhotos(input.growthPhotos)) return true;
  const plant = text(input.plantType);
  const duration = input.growthDuration;
  const hasDuration =
    duration != null && duration !== '' && Number.isFinite(Number(duration)) && Number(duration) > 0;
  const care =
    text(input.soilType) ||
    text(input.plantDate) ||
    text(input.harvestDate) ||
    text(input.plantDistance) ||
    (hasDuration ? 'duration' : '');
  return Boolean(plant && care);
}

export function categoryHasMeaningfulGuide(
  category: string | null | undefined,
  input: InspirationGuideInput,
): boolean {
  const cat = (category || '').trim().toUpperCase();
  if (cat === 'CHEFF') return hasMeaningfulRecipeGuide(input);
  if (cat === 'DESIGNER') return hasMeaningfulDesignGuide(input);
  if (cat === 'GROWN' || cat === 'GARDEN') return hasMeaningfulGardenGuide(input);
  return false;
}

/** Product create / patch may mirror a dish only when a real guide was submitted. */
export function offerCarriesStructuredGuide(
  category: string | null | undefined,
  input: InspirationGuideInput,
): boolean {
  return categoryHasMeaningfulGuide(category, input);
}

export function resolveInspirationPublishStatus(
  requestedStatus: string | null | undefined,
  category: string | null | undefined,
  input: InspirationGuideInput,
): { status: 'PUBLISHED' | 'PRIVATE'; heldAsDraft: boolean } {
  const wantsPublic = (requestedStatus || '').trim().toUpperCase() === 'PUBLISHED';
  if (!wantsPublic) {
    return { status: 'PRIVATE', heldAsDraft: false };
  }
  if (categoryHasMeaningfulGuide(category, input)) {
    return { status: 'PUBLISHED', heldAsDraft: false };
  }
  return { status: 'PRIVATE', heldAsDraft: true };
}

export type PublicCreateIntent = 'offer' | 'inspiration';

/** Intent chooses the form. Category only chooses which inspiration manager. */
export function resolvePublicCreateSurface(
  intent: PublicCreateIntent,
  vertical: string | null | undefined,
): 'marketplace-offer' | 'recipe' | 'garden' | 'design' {
  if (intent !== 'inspiration') return 'marketplace-offer';
  const v = (vertical || '').trim().toLowerCase();
  if (v === 'tuin' || v === 'kweken' || v === 'grown' || v === 'garden') return 'garden';
  if (v === 'atelier' || v === 'designs' || v === 'designer' || v === 'design') return 'design';
  return 'recipe';
}
