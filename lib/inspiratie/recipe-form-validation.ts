/**
 * CHEFF recipe editor save rules.
 * PRIVATE drafts may be partial.
 * PUBLISHED cooking inspiration needs ingredients (steps optional).
 * PUBLISHED complete recipes keep ingredients + instructions when steps are present.
 */

export type RecipeFormValidationInput = {
  title?: string | null;
  description?: string | null;
  ingredients: string[];
  instructions: string[];
  /** true = PRIVATE draft / concept */
  isPrivate: boolean;
};

export type RecipeFormValidationResult =
  | { ok: true }
  | { ok: false; errorKey: string };

export function filterNonEmptyLines(values: string[]): string[] {
  return values.filter((value) => value.trim() !== '');
}

export function validateRecipeFormSave(
  input: RecipeFormValidationInput,
): RecipeFormValidationResult {
  if (!input.title || !input.title.trim()) {
    return { ok: false, errorKey: 'recipe.titleRequired' };
  }

  const ingredients = filterNonEmptyLines(input.ingredients);
  const instructions = filterNonEmptyLines(input.instructions);
  const description = (input.description || '').trim();

  if (input.isPrivate) {
    // Draft: keep partial content; require at least one of structured fields or description.
    if (ingredients.length === 0 && instructions.length === 0 && !description) {
      return { ok: false, errorKey: 'recipe.draftContentRequired' };
    }
    return { ok: true };
  }

  // Publish: cooking inspiration = ingredients without forced steps.
  // If the author added steps, keep complete-recipe integrity (ingredients required).
  if (ingredients.length === 0) {
    return { ok: false, errorKey: 'recipe.ingredientRequired' };
  }
  return { ok: true };
}

/** Description looks like a bullet ingredient list while structured ingredients are empty. */
export function descriptionLooksLikeUnmappedIngredients(
  description: string | null | undefined,
  ingredients: string[],
): boolean {
  if (filterNonEmptyLines(ingredients).length > 0) return false;
  const text = (description || '').trim();
  if (!text) return false;
  return /(?:^|\n)\s*[-–•]/.test(text) || /\d+\s*gr\.?/i.test(text);
}
