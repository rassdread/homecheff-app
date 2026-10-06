import type { Prisma } from '@prisma/client';
import {
  craftCreateTaxonomyIds,
  isCraftCreateTaxonomyId,
  isIntrinsicCommissionDesignId,
  isObjectCapableDesignId,
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

function idsWhere(match: (id: string) => boolean): string[] {
  return MARKETPLACE_TAXONOMY.filter((entry) => match(entry.id)).map((entry) => entry.id);
}

/** A stocked object the buyer can pick up, receive, or have shipped. Not a digital file. */
function physicalObjectWhere(): Prisma.ProductWhereInput {
  return {
    AND: [
      { priceModel: { notIn: ['HOURLY', 'DAILY', 'ON_REQUEST', 'VOLUNTARY'] } },
      { fulfillmentOptions: { path: ['digital'], equals: false } },
      {
        OR: [
          { fulfillmentOptions: { path: ['pickup'], equals: true } },
          { fulfillmentOptions: { path: ['delivery'], equals: true } },
          { fulfillmentOptions: { path: ['shipping'], equals: true } },
        ],
      },
    ],
  };
}

function taxonomySignals(ids: string[], legacyMatch: (id: string) => boolean): Prisma.ProductWhereInput[] {
  const legacyKeys = legacyDutchSubcategoryKeysFor(legacyMatch);
  const signals: Prisma.ProductWhereInput[] = [];
  if (ids.length > 0) {
    signals.push({ subcategory: { in: ids, mode: 'insensitive' } });
    signals.push({ specializations: { hasSome: ids } });
  }
  if (legacyKeys.length > 0) {
    signals.push({ subcategory: { in: legacyKeys, mode: 'insensitive' } });
  }
  return signals;
}

/**
 * Labor evidence.
 * Website, logo, and app stay services.
 * Photo and video count only when the listing does not hand over a physical object.
 */
function serviceSignals(): Prisma.ProductWhereInput[] {
  const intrinsicIds = idsWhere(isIntrinsicCommissionDesignId);
  const objectCapableIds = idsWhere(isObjectCapableDesignId);
  const practicalIds = structuredServiceTaxonomyIds().filter(
    (id) => !id.startsWith('design.'),
  );
  return [
    ...taxonomySignals(intrinsicIds, isIntrinsicCommissionDesignId),
    ...taxonomySignals(practicalIds, (id) => isStructuredServiceTaxonomyId(id) && !id.startsWith('design.')),
    {
      AND: [
        { OR: taxonomySignals(objectCapableIds, isObjectCapableDesignId) },
        { NOT: physicalObjectWhere() },
      ],
    },
  ];
}

function notInSubcategory(ids: string[]): Prisma.ProductWhereInput {
  if (ids.length === 0) return {};
  return {
    OR: [
      { subcategory: null },
      { NOT: { subcategory: { in: ids, mode: 'insensitive' } } },
    ],
  };
}

function notHasSpecs(ids: string[]): Prisma.ProductWhereInput {
  if (ids.length === 0) return {};
  return { NOT: { specializations: { hasSome: ids } } };
}

/**
 * Null subcategory must stay eligible. `NOT (subcategory IN …)` drops NULL in SQL.
 * Photo and video are labor only when the listing does not hand over a physical object.
 */
function notServiceSignals(): Prisma.ProductWhereInput {
  const intrinsicIds = idsWhere(isIntrinsicCommissionDesignId);
  const mediaIds = idsWhere(isObjectCapableDesignId);
  const practicalIds = structuredServiceTaxonomyIds().filter((id) => !id.startsWith('design.'));
  const legacyIntrinsic = legacyDutchSubcategoryKeysFor(isIntrinsicCommissionDesignId);
  const legacyMedia = legacyDutchSubcategoryKeysFor(isObjectCapableDesignId);
  const legacyPractical = legacyDutchSubcategoryKeysFor(
    (id) => isStructuredServiceTaxonomyId(id) && !id.startsWith('design.'),
  );
  return {
    AND: [
      notInSubcategory([...intrinsicIds, ...legacyIntrinsic, ...practicalIds, ...legacyPractical]),
      notHasSpecs([...intrinsicIds, ...practicalIds]),
      {
        OR: [
          physicalObjectWhere(),
          {
            AND: [
              notInSubcategory([...mediaIds, ...legacyMedia]),
              notHasSpecs(mediaIds),
            ],
          },
        ],
      },
    ],
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
