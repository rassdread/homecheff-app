import type { Prisma } from '@prisma/client';
import { inferSearchQueryIntent } from '../infer-query-intent';

/**
 * Prisma where fragment for Product text search (title + description).
 * When query suggests REQUEST, also matches active REQUEST listings by intent.
 */
export function buildProductTextSearchWhere(q: string): Prisma.ProductWhereInput {
  const term = q.trim();
  if (!term) return {};

  const textOr: Prisma.ProductWhereInput[] = [
    { title: { contains: term, mode: 'insensitive' } },
    { description: { contains: term, mode: 'insensitive' } },
  ];

  const intent = inferSearchQueryIntent(term);
  if (intent.suggestsRequest) {
    return {
      OR: [
        ...textOr,
        {
          listingIntent: 'REQUEST',
          isActive: true,
        },
      ],
    };
  }

  return { OR: textOr };
}

/** Prisma where for Dish inspiration text search. */
export function buildDishTextSearchWhere(q: string): Prisma.DishWhereInput {
  const term = q.trim();
  if (!term) return {};
  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ],
  };
}

/** Prisma where for legacy Listing text search. */
export function buildListingTextSearchWhere(q: string): Prisma.ListingWhereInput {
  const term = q.trim();
  if (!term) return {};
  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ],
  };
}
