/**
 * Feed Taxonomy Foundation (Fase 5D) — derived classification, no DB schema.
 * @see docs/HOMECHEFF_FEED_TAXONOMY.md
 */

import { parseProductOrderMethod } from '@/lib/product/order-method';
import { isMarketplaceSaleItem } from '@/lib/feed/marketplace-sale';
import {
  isOfferListing,
  isRequestListing,
} from '@/lib/marketplace/product-visibility';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  buildListingKindInputFromFeedItem,
  deriveListingKind,
} from '@/lib/marketplace/listing-kind/derive-listing-kind';

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
  listingIntent?: string | null;
  priceModel?: string | null;
  feedSource?: string | null;
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
  subcategory?: string | null;
  listingKind?: ListingKind | null;
  /** Explicit overrides when REQUEST items exist (future). */
  direction?: FeedDirection | null;
  kind?: FeedKind | null;
  exchange?: FeedExchange | null;
};

/** Numeric checkout price (excludes ON_REQUEST / VOLUNTARY display-only models). */
export function hasValidSalePrice(item: {
  priceCents?: number | null;
  priceModel?: string | null;
}): boolean {
  const model = String(item.priceModel ?? 'FIXED')
    .trim()
    .toUpperCase();
  if (model === 'ON_REQUEST' || model === 'VOLUNTARY') return false;
  const p = item.priceCents;
  return p != null && Number.isFinite(Number(p)) && Number(p) > 0;
}

function isMarketplaceOfferProduct(input: FeedTaxonomyInput): boolean {
  if (!isOfferListing(input)) return false;
  const source = String(input.feedSource ?? input.type ?? '')
    .trim()
    .toUpperCase();
  if (source === 'PRODUCT' || source === 'LISTING') return true;
  const model = String(input.priceModel ?? '')
    .trim()
    .toUpperCase();
  return model === 'ON_REQUEST' || model === 'VOLUNTARY';
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

function listingKindToFeedKind(kind: ListingKind): FeedKind {
  switch (kind) {
    case 'INSPIRATION':
      return 'INSPIRATION';
    case 'TASK':
      return 'TASK';
    case 'SERVICE':
    case 'WORKSHOP':
    case 'COACHING':
      return 'SERVICE';
    case 'REQUEST':
    case 'PRODUCT':
    default:
      return 'PRODUCT';
  }
}

function isDishFeedSource(input: FeedTaxonomyInput): boolean {
  const source = String(input.feedSource ?? input.type ?? '')
    .trim()
    .toUpperCase();
  return source === 'DISH' || String(input.type ?? '').trim().toLowerCase() === 'dish';
}

function resolveListingKind(input: FeedTaxonomyInput): ListingKind {
  if (input.listingKind) return input.listingKind;
  const { listingKind } = deriveListingKind(
    buildListingKindInputFromFeedItem(input as Record<string, unknown>),
  );
  return listingKind;
}

/**
 * Derives V3 taxonomy from existing feed payload fields.
 * ListingKind drives kind classification when marketplace fields are present.
 */
export function deriveFeedTaxonomy(input: FeedTaxonomyInput): FeedTaxonomy {
  const category = mapLegacyCategoryToFeedCategory(input.category);

  if (isDishFeedSource(input) || resolveListingKind(input) === 'INSPIRATION') {
    return {
      direction: 'OFFER',
      kind: 'INSPIRATION',
      category,
      exchange: 'CONTACT',
    };
  }

  if (input.direction && input.kind) {
    return {
      direction: input.direction,
      kind: input.kind,
      category,
      exchange:
        input.exchange ??
        resolveExchange(input.orderMethod, hasValidSalePrice(input)),
    };
  }

  if (isRequestListing(input) || resolveListingKind(input) === 'REQUEST') {
    return {
      direction: 'REQUEST',
      kind: listingKindToFeedKind('REQUEST'),
      category,
      exchange: 'CONTACT',
    };
  }

  const listingKind = resolveListingKind(input);
  const derivedKind = listingKindToFeedKind(listingKind);

  if (derivedKind !== 'PRODUCT' || listingKind === 'PRODUCT') {
    const salePrice = hasValidSalePrice(input);
    return {
      direction: 'OFFER',
      kind: derivedKind,
      category,
      exchange: resolveExchange(input.orderMethod, salePrice),
    };
  }

  const salePrice = hasValidSalePrice(input);
  const contactSale = parseProductOrderMethod(input.orderMethod) === 'CONTACT';
  const marketplaceOffer = isMarketplaceOfferProduct(input);

  if (marketplaceOffer || salePrice || contactSale) {
    return {
      direction: 'OFFER',
      kind: 'PRODUCT',
      category,
      exchange: resolveExchange(input.orderMethod, salePrice),
    };
  }

  return {
    direction: 'OFFER',
    kind: 'INSPIRATION',
    category,
    exchange: 'CONTACT',
  };
}

/** Attach taxonomy + listingKind to a feed item record. */
export function withFeedTaxonomy<T extends FeedTaxonomyInput>(
  item: T
): T & { taxonomy: FeedTaxonomy; listingKind: ListingKind } {
  const listingKind = resolveListingKind(item);
  const taxonomy = deriveFeedTaxonomy({ ...item, listingKind });
  return { ...item, listingKind, taxonomy };
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
  if (filter === 'sale') return isMarketplaceSaleItem(item);
  const tax = deriveFeedTaxonomy(item);
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
