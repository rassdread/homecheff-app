import type { Prisma } from '@prisma/client';
import {
  craftCreateTaxonomyIds,
  SERVICE_MARKETPLACE_CATEGORIES,
} from '@/lib/marketplace/commercial-capability';
import { normalizeDiscoveryCategorySlug } from '@/lib/marketplace/canonical-model';
import { MARKETPLACE_TAXONOMY } from '@/lib/marketplace/taxonomy';

const SERVICE_STORAGE = [...SERVICE_MARKETPLACE_CATEGORIES, 'DESIGN'] as const;

function designServiceTaxonomyIds(): string[] {
  return MARKETPLACE_TAXONOMY.filter((entry) => entry.id.startsWith('design.')).map(
    (entry) => entry.id,
  );
}

function notCraft(): Prisma.ProductWhereInput {
  const craft = craftCreateTaxonomyIds();
  return {
    NOT: {
      OR: [
        { subcategory: { in: craft } },
        { specializations: { hasSome: craft } },
      ],
    },
  };
}

/**
 * Product filter for a discovery category slug.
 * Structured marketplace category and taxonomy win over Product.category.
 * Product.category is only a fallback when marketplaceCategory is unset.
 */
export function semanticProductWhereForDiscoverySlug(
  verticalRaw: string,
): Prisma.ProductWhereInput | null {
  const slug = normalizeDiscoveryCategorySlug(verticalRaw);
  if (slug === 'all') return null;

  const craft = craftCreateTaxonomyIds();
  const designIds = designServiceTaxonomyIds();

  if (slug === 'services') {
    return {
      OR: [
        { marketplaceCategory: { in: [...SERVICE_MARKETPLACE_CATEGORIES] } },
        { subcategory: { startsWith: 'design.', mode: 'insensitive' } },
        { specializations: { hasSome: designIds } },
        {
          AND: [{ marketplaceCategory: 'DESIGN' }, notCraft()],
        },
      ],
    };
  }

  if (slug === 'cheff') {
    return {
      AND: [
        {
          OR: [
            { marketplaceCategory: 'CREATE' },
            { AND: [{ marketplaceCategory: null }, { category: 'CHEFF' }] },
          ],
        },
        notCraft(),
        { NOT: { marketplaceCategory: { in: [...SERVICE_STORAGE] } } },
        { NOT: { subcategory: { startsWith: 'design.', mode: 'insensitive' } } },
        { NOT: { specializations: { hasSome: designIds } } },
      ],
    };
  }

  if (slug === 'garden') {
    return {
      OR: [
        { marketplaceCategory: 'GROW' },
        { AND: [{ marketplaceCategory: null }, { category: 'GROWN' }] },
      ],
    };
  }

  if (slug === 'designer') {
    return {
      OR: [
        { subcategory: { in: craft } },
        { specializations: { hasSome: craft } },
        {
          AND: [
            { marketplaceCategory: null },
            { category: 'DESIGNER' },
            { NOT: { subcategory: { startsWith: 'design.', mode: 'insensitive' } } },
            { NOT: { specializations: { hasSome: designIds } } },
          ],
        },
      ],
    };
  }

  return null;
}

export function combineProductSearchFilters(
  parts: Array<Prisma.ProductWhereInput | null | undefined>,
): Prisma.ProductWhereInput {
  const present = parts.filter(
    (part): part is Prisma.ProductWhereInput =>
      Boolean(part) && Object.keys(part as Prisma.ProductWhereInput).length > 0,
  );
  if (present.length === 0) return {};
  if (present.length === 1) return present[0];
  return { AND: present };
}

export function discoverySlugIsServices(verticalRaw: string): boolean {
  return normalizeDiscoveryCategorySlug(verticalRaw) === 'services';
}
