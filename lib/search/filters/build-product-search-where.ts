import type { Prisma } from '@prisma/client';
import { getTaxonomyIdsMatchingSearchQuery } from '@/lib/marketplace/taxonomy-resolve';
import { inferSearchQueryIntent } from '../infer-query-intent';

function normalizeSearchTerm(q: string): string {
  return q.trim().replace(/\s+/g, ' ');
}

/**
 * Prisma where fragment for Product text search.
 * Title and description match free text. Taxonomy ids match structured
 * search terms, so a listing can be found by what it is.
 * When query suggests REQUEST, also matches active REQUEST listings by intent.
 */
export function buildProductTextSearchWhere(q: string): Prisma.ProductWhereInput {
  const term = normalizeSearchTerm(q);
  if (!term) return {};

  const taxonomyIds = [...getTaxonomyIdsMatchingSearchQuery(term)];
  const textOr: Prisma.ProductWhereInput[] = [
    { title: { contains: term, mode: 'insensitive' } },
    { description: { contains: term, mode: 'insensitive' } },
  ];
  if (taxonomyIds.length > 0) {
    textOr.push(
      { subcategory: { in: taxonomyIds, mode: 'insensitive' } },
      { specializations: { hasSome: taxonomyIds } },
    );
  }

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
  const term = normalizeSearchTerm(q);
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
  const term = normalizeSearchTerm(q);
  if (!term) return {};
  return {
    OR: [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ],
  };
}
