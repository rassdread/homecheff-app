/**
 * Feed Taxonomy Foundation (Fase 5D) — derived classification, no DB schema.
 * @see docs/HOMECHEFF_FEED_TAXONOMY.md
 */

import { parseProductOrderMethod } from '@/lib/product/order-method';

export type FeedDirection = 'OFFER' | 'REQUEST';

export type FeedKind =
  | 'PRODUCT'
  | 'SERVICE'
  | 'INSPIRATION'
  | 'TASK'
  | 'BARTER';

export type FeedCategory = 'FOOD' | 'GARDEN' | 'CREATIVE' | 'HELP';

export type FeedExchange = 'MONEY' | 'CONTACT' | 'BARTER' | 'RECIPROCITY';

export type FeedTaxonomy = {
  direction: FeedDirection;
  kind: FeedKind;
  category: FeedCategory;
  exchange: FeedExchange;
};

/** UI view filters — decoupled from item identity (Fase 5D). */
export type FeedViewFilterId =
  | 'all'
  | 'sale'
  | 'inspiration';

/**
 * Future chips (documented, not active in UI):
 * 'offer' | 'request' | 'for_sale' | 'services' | 'barter'
 */
export type FeedViewFilterIdFuture =
  | FeedViewFilterId
  | 'offer'
  | 'request'
  | 'for_sale'
  | 'services'
  | 'barter';

/** Legacy GeoFeed chip values — alias for view filter ids in use today. */
export type FeedChip = FeedViewFilterId;

export type FeedTaxonomyInput = {
  priceCents?: number | null;
  orderMethod?: string | null;
  type?: string | null;
  isRecipe?: boolean | null;
  isInspiration?: boolean | null;
  category?: string | null;
  /** Explicit overrides when REQUEST items exist (future). */
  direction?: FeedDirection | null;
  kind?: FeedKind | null;
  exchange?: FeedExchange | null;
};

/** Verkoopbaar: strikt priceCents > 0 (null/0/NaN = geen verkoopprijs). */
export function hasValidSalePrice(item: {
  priceCents?: number | null;
}): boolean {
  const p = item.priceCents;
  return p != null && Number.isFinite(Number(p)) && Number(p) > 0;
}

const LEGACY_CATEGORY_TO_FEED: Record<string, FeedCategory> = {
  CHEFF: 'FOOD',
  HOMECHEFF: 'FOOD',
  FOOD: 'FOOD',
  GROWN: 'GARDEN',
  GARDEN: 'GARDEN',
  DESIGNER: 'CREATIVE',
  DESIGN: 'CREATIVE',
  CREATIVE: 'CREATIVE',
  HELP: 'HELP',
  HULP: 'HELP',
};

/**
 * Maps Prisma/UI category strings → Ecosystem V3 feed category.
 * HELP reserved for future enum/migration — no DB change in 5D.
 */
export function mapLegacyCategoryToFeedCategory(
  raw?: string | null
): FeedCategory {
  const key = (raw || '').trim().toUpperCase();
  if (key && LEGACY_CATEGORY_TO_FEED[key]) {
    return LEGACY_CATEGORY_TO_FEED[key];
  }
  return 'FOOD';
}

/** Inverse hint for future HELP rollout (no runtime consumers yet). */
export function mapFeedCategoryToLegacySlug(
  category: FeedCategory
): 'cheff' | 'garden' | 'designer' | 'help' {
  switch (category) {
    case 'GARDEN':
      return 'garden';
    case 'CREATIVE':
      return 'designer';
    case 'HELP':
      return 'help';
    default:
      return 'cheff';
  }
}

function resolveExchange(
  orderMethod: string | null | undefined,
  hasSalePrice: boolean
): FeedExchange {
  if (!hasSalePrice) {
    return 'CONTACT';
  }
  const method = parseProductOrderMethod(orderMethod);
  return method === 'CONTACT' ? 'CONTACT' : 'MONEY';
}

/**
 * Derives V3 taxonomy from existing feed payload fields.
 * All current live items resolve to direction OFFER.
 */
export function deriveFeedTaxonomy(input: FeedTaxonomyInput): FeedTaxonomy {
  if (input.direction && input.kind) {
    return {
      direction: input.direction,
      kind: input.kind,
      category: mapLegacyCategoryToFeedCategory(input.category),
      exchange:
        input.exchange ??
        resolveExchange(input.orderMethod, hasValidSalePrice(input)),
    };
  }

  const category = mapLegacyCategoryToFeedCategory(input.category);
  const salePrice = hasValidSalePrice(input);

  if (salePrice) {
    return {
      direction: 'OFFER',
      kind: 'PRODUCT',
      category,
      exchange: resolveExchange(input.orderMethod, true),
    };
  }

  return {
    direction: 'OFFER',
    kind: 'INSPIRATION',
    category,
    exchange: 'CONTACT',
  };
}

/** Attach taxonomy to a feed item record (mutates optional field). */
export function withFeedTaxonomy<T extends FeedTaxonomyInput>(
  item: T
): T & { taxonomy: FeedTaxonomy } {
  return { ...item, taxonomy: deriveFeedTaxonomy(item) };
}

/**
 * Legacy UI chip compatibility — sale ≠ taxonomy kind alone;
 * sale chip = OFFER · PRODUCT (priced marketplace listings).
 */
export function matchesFeedViewFilter(
  item: FeedTaxonomyInput,
  filter: FeedViewFilterId
): boolean {
  if (filter === 'all') return true;
  const tax = deriveFeedTaxonomy(item);
  if (filter === 'sale') {
    return tax.direction === 'OFFER' && tax.kind === 'PRODUCT';
  }
  if (filter === 'inspiration') {
    return tax.direction === 'OFFER' && tax.kind === 'INSPIRATION';
  }
  return true;
}

/** Maps legacy chip to human-facing mode (unchanged UX labels). */
export function feedViewFilterToCreateMode(
  filter: FeedViewFilterId
): 'dorpsplein' | 'inspiratie' | null {
  if (filter === 'sale') return 'dorpsplein';
  if (filter === 'inspiration') return 'inspiratie';
  return null;
}

/** Legacy alias — prefer matchesFeedViewFilter + deriveFeedTaxonomy in new code. */
export function taxonomyToLegacyFeedKind(
  tax: FeedTaxonomy
): 'sale' | 'inspiration' {
  if (tax.direction === 'OFFER' && tax.kind === 'PRODUCT') return 'sale';
  return 'inspiration';
}
