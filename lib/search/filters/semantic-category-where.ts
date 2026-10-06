import type { Prisma } from '@prisma/client';
import {
  craftCreateTaxonomyIds,
  isCraftCreateTaxonomyId,
  isStructuredServiceTaxonomyId,
  SERVICE_MARKETPLACE_CATEGORIES,
} from '@/lib/marketplace/commercial-capability';
import { normalizeDiscoveryCategorySlug } from '@/lib/marketplace/canonical-model';
import { legacyDutchSubcategoryKeysFor } from '@/lib/marketplace/legacy-subcategory-map';
import { MARKETPLACE_TAXONOMY } from '@/lib/marketplace/taxonomy';

const SERVICE_STORAGE = [...SERVICE_MARKETPLACE_CATEGORIES, 'DESIGN'] as const;

function structuredServiceTaxonomyIds(): string[] {
  return MARKETPLACE_TAXONOMY.filter((entry) =>
    isStructuredServiceTaxonomyId(entry.id),
  ).map((entry) => entry.id);
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

/** Structured service evidence. A bare DESIGN marketplace category is not enough. */
function serviceSignals(): Prisma.ProductWhereInput[] {
  const serviceIds = structuredServiceTaxonomyIds();
  const legacyServiceKeys = legacyDutchSubcategoryKeysFor(isStructuredServiceTaxonomyId);
  return [
    { subcategory: { startsWith: 'design.', mode: 'insensitive' } },
    { subcategory: { in: legacyServiceKeys, mode: 'insensitive' } },
    { specializations: { hasSome: serviceIds } },
  ];
}

function notServiceSignals(): Prisma.ProductWhereInput {
  return { NOT: { OR: serviceSignals() } };
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
  const craftLegacyKeys = legacyDutchSubcategoryKeysFor(isCraftCreateTaxonomyId);

  if (slug === 'services') {
    return {
      OR: [
        { marketplaceCategory: { in: [...SERVICE_MARKETPLACE_CATEGORIES] } },
        ...serviceSignals(),
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
        notServiceSignals(),
        { NOT: { marketplaceCategory: { in: [...SERVICE_STORAGE] } } },
      ],
    };
  }

  if (slug === 'garden') {
    return {
      AND: [
        {
          OR: [
            { marketplaceCategory: 'GROW' },
            { AND: [{ marketplaceCategory: null }, { category: 'GROWN' }] },
          ],
        },
        notServiceSignals(),
      ],
    };
  }

  if (slug === 'designer') {
    return {
      OR: [
        { subcategory: { in: craft } },
        { subcategory: { in: craftLegacyKeys, mode: 'insensitive' } },
        { specializations: { hasSome: craft } },
        {
          AND: [{ marketplaceCategory: 'DESIGN' }, notServiceSignals()],
        },
        {
          AND: [
            { marketplaceCategory: null },
            { category: 'DESIGNER' },
            notServiceSignals(),
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
