/**
 * LEGAL-2 — Product allergen confirmation state.
 * UNKNOWN ≠ confirmed-none. Never infer from ingredients text.
 */

import {
  sanitizeEuFoodAllergenIds,
  type EuFoodAllergenId,
} from './eu-food-allergens';
import {
  productRequiresAllergenConfirmation,
  type FoodAllergenApplicabilityInput,
} from './food-allergen-applicability';

export type FoodAllergenStatus = 'UNKNOWN' | 'CONFIRMED';

export type ProductAllergenFields = {
  allergens?: string[] | null;
  allergensConfirmedAt?: Date | string | null;
};

export type FoodAllergenContext = {
  applicable: boolean;
  status: FoodAllergenStatus;
  allergens: EuFoodAllergenId[];
  confirmedAt: string | null;
  /** True when applicable && UNKNOWN — block transaction paths. */
  blocksTransaction: boolean;
};

function toIso(v: Date | string | null | undefined): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function resolveFoodAllergenStatus(
  product: ProductAllergenFields,
): FoodAllergenStatus {
  return product.allergensConfirmedAt ? 'CONFIRMED' : 'UNKNOWN';
}

export function buildFoodAllergenContext(
  product: ProductAllergenFields & FoodAllergenApplicabilityInput,
): FoodAllergenContext {
  const applicable = productRequiresAllergenConfirmation(product);
  const status = resolveFoodAllergenStatus(product);
  const allergens =
    status === 'CONFIRMED'
      ? sanitizeEuFoodAllergenIds(product.allergens)
      : [];
  const confirmedAt = toIso(product.allergensConfirmedAt);

  return {
    applicable,
    status,
    allergens,
    confirmedAt,
    blocksTransaction: applicable && status === 'UNKNOWN',
  };
}

export const FOOD_ALLERGENS_REQUIRED_CODE =
  'FOOD_ALLERGENS_REQUIRED' as const;

export function foodAllergensBlockResponseBody() {
  return {
    error:
      'Dit voedselaanbod heeft nog geen bevestigde allergeneninformatie. De aanbieder moet dit eerst invullen.',
    errorKey: 'food.allergens.required',
    code: FOOD_ALLERGENS_REQUIRED_CODE,
  };
}

/**
 * Persist shape when seller confirms.
 * confirmed + empty allergens[] = none of the 14 apply.
 * Without confirmation flag, do not treat empty as none.
 */
export function buildAllergenConfirmationUpdate(input: {
  allergens: unknown;
  confirmed: boolean;
  now?: Date;
}): {
  allergens: EuFoodAllergenId[];
  allergensConfirmedAt: Date | null;
} | null {
  if (!input.confirmed) {
    return {
      allergens: [],
      allergensConfirmedAt: null,
    };
  }
  return {
    allergens: sanitizeEuFoodAllergenIds(input.allergens),
    allergensConfirmedAt: input.now ?? new Date(),
  };
}

/** Public listing view — no internal counsel flags. */
export function toPublicFoodAllergenView(ctx: FoodAllergenContext): {
  applicable: boolean;
  status: FoodAllergenStatus;
  allergens: EuFoodAllergenId[];
} {
  return {
    applicable: ctx.applicable,
    status: ctx.status,
    allergens: ctx.allergens,
  };
}
