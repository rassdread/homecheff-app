/**
 * LEGAL-2 — assert allergen confirmation before Product transaction.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  buildFoodAllergenContext,
  foodAllergensBlockResponseBody,
  FOOD_ALLERGENS_REQUIRED_CODE,
} from '@/lib/legal/food-allergen-context';

export class FoodAllergensRequiredError extends Error {
  readonly status = 400;
  readonly code = FOOD_ALLERGENS_REQUIRED_CODE;
  readonly errorKey = 'food.allergens.required';

  constructor() {
    super(foodAllergensBlockResponseBody().error);
    this.name = 'FoodAllergensRequiredError';
  }
}

export async function assertProductsAllergenConfirmationOr400(
  productIds: string[],
): Promise<NextResponse | null> {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (unique.length === 0) return null;

  const products = await prisma.product.findMany({
    where: { id: { in: unique } },
    select: {
      id: true,
      category: true,
      marketplaceCategory: true,
      specializations: true,
      subcategory: true,
      allergens: true,
      allergensConfirmedAt: true,
    },
  });

  const blocked = products.filter(
    (p) => buildFoodAllergenContext(p).blocksTransaction,
  );
  if (blocked.length === 0) return null;

  return NextResponse.json(
    {
      ...foodAllergensBlockResponseBody(),
      productIds: blocked.map((p) => p.id),
    },
    { status: 400 },
  );
}

export async function assertProductAllergenConfirmationOrThrow(
  productId: string | null | undefined,
): Promise<void> {
  if (!productId) return;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      category: true,
      marketplaceCategory: true,
      specializations: true,
      subcategory: true,
      allergens: true,
      allergensConfirmedAt: true,
    },
  });
  if (!product) return;
  if (buildFoodAllergenContext(product).blocksTransaction) {
    throw new FoodAllergensRequiredError();
  }
}
