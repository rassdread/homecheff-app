/**
 * Commercial capability derived from a validated listing.
 * Taxonomy describes the kind of work. sellerRoles stores the capability.
 * Product.category stays the legacy storage bucket (CHEFF / GROWN / DESIGNER).
 */

import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import { toCanonicalTaxonomyId } from '@/lib/marketplace/taxonomy-normalize';

export const SERVICE_MARKETPLACE_CATEGORIES = [
  'PRACTICAL_SERVICE',
  'KNOWLEDGE',
  'ARTISTIC_SERVICE',
] as const;

export type ServiceMarketplaceCategory =
  (typeof SERVICE_MARKETPLACE_CATEGORIES)[number];

/** Handmade goods that live under the CREATE taxonomy, not food. */
const CRAFT_CREATE_TAXONOMY_IDS = new Set([
  'create.clothing',
  'create.jewelry',
  'create.decoration',
  'create.art',
  'create.craft_other',
]);

export function craftCreateTaxonomyIds(): string[] {
  return [...CRAFT_CREATE_TAXONOMY_IDS];
}

export type CommercialCapability = 'chef' | 'garden' | 'designer' | 'service';

export function isServiceMarketplaceCategory(
  value: string | null | undefined,
): boolean {
  const category = String(value ?? '').trim().toUpperCase();
  return (SERVICE_MARKETPLACE_CATEGORIES as readonly string[]).includes(category);
}

export function isCraftCreateTaxonomyId(id: string | null | undefined): boolean {
  return CRAFT_CREATE_TAXONOMY_IDS.has(String(id ?? '').trim().toLowerCase());
}

/** Design-category items that are delivered as work, not as a physical piece. */
export function isDesignServiceTaxonomyId(id: string | null | undefined): boolean {
  return String(id ?? '').trim().toLowerCase().startsWith('design.');
}

/**
 * Commissioned digital work. These stay services even when a parcel option is ticked.
 * Photo and video are not in this set: historical creations stored them as media tags.
 */
const INTRINSIC_COMMISSION_DESIGN_IDS = new Set([
  'design.website',
  'design.webshop',
  'design.app',
  'design.uiux',
  'design.logo',
  'design.branding',
  'design.seo',
  'design.marketing',
  'design.web_other',
  'design.brand_other',
]);

/** Design ids that describe either a physical object or commissioned media work. */
const OBJECT_CAPABLE_DESIGN_IDS = new Set([
  'design.photo',
  'design.video',
  'design.illustration',
  'design.animation',
  'design.content',
  'design.creative_session',
  'design.other',
]);

export type CommerceFulfillment = {
  digital?: boolean | null;
  pickup?: boolean | null;
  delivery?: boolean | null;
  shipping?: boolean | null;
  onSiteClient?: boolean | null;
  onSiteProvider?: boolean | null;
};

export function isIntrinsicCommissionDesignId(id: string | null | undefined): boolean {
  return INTRINSIC_COMMISSION_DESIGN_IDS.has(String(id ?? '').trim().toLowerCase());
}

export function isObjectCapableDesignId(id: string | null | undefined): boolean {
  return OBJECT_CAPABLE_DESIGN_IDS.has(String(id ?? '').trim().toLowerCase());
}

/** The buyer receives a physical object, not labor or a digital file. */
export function listingDeliversPhysicalObject(input: {
  priceModel?: string | null;
  fulfillmentOptions?: CommerceFulfillment | null;
}): boolean {
  const model = String(input.priceModel ?? 'FIXED').trim().toUpperCase();
  if (model === 'HOURLY' || model === 'DAILY' || model === 'ON_REQUEST' || model === 'VOLUNTARY') {
    return false;
  }
  const fulfillment = input.fulfillmentOptions;
  if (!fulfillment || typeof fulfillment !== 'object') return false;
  const handsOffGoods = Boolean(
    fulfillment.pickup || fulfillment.delivery || fulfillment.shipping,
  );
  if (!handsOffGoods) return false;
  if (fulfillment.digital === true && !fulfillment.pickup && !fulfillment.delivery && !fulfillment.shipping) {
    return false;
  }
  return true;
}

export type OfferSemantics = {
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
  subcategory?: string | null;
  priceModel?: string | null;
  fulfillmentOptions?: CommerceFulfillment | null;
};

function canonicalSpec(raw: string): string {
  const canonical = toCanonicalTaxonomyId(raw);
  return (canonical ?? raw).trim().toLowerCase();
}

function specsOf(input: OfferSemantics): string[] {
  const raw = [
    ...(input.specializations ?? []),
    ...(input.subcategory ? [input.subcategory] : []),
  ];
  return raw
    .filter((id) => typeof id === 'string' && id.trim())
    .map((id) => canonicalSpec(id));
}

/** Commissioned work: design.* plus practical, knowledge, and artistic services. */
export function isStructuredServiceTaxonomyId(id: string | null | undefined): boolean {
  const value = String(id ?? '').trim().toLowerCase();
  if (!value) return false;
  if (isDesignServiceTaxonomyId(value)) return true;
  const item = getMarketplaceTaxonomyItem(value);
  return Boolean(item && isServiceMarketplaceCategory(item.category));
}

/**
 * Whether this taxonomy id is evidence of labor.
 * Photo, video, and illustration are labor only when the listing does not hand over a physical object.
 */
export function taxonomyCountsAsService(
  id: string | null | undefined,
  deliversPhysicalObject: boolean,
): boolean {
  const value = String(id ?? '').trim().toLowerCase();
  if (!value || isCraftCreateTaxonomyId(value)) return false;
  if (isIntrinsicCommissionDesignId(value)) return true;
  if (isObjectCapableDesignId(value)) return !deliversPhysicalObject;
  if (isDesignServiceTaxonomyId(value)) return !deliversPhysicalObject;
  const item = getMarketplaceTaxonomyItem(value);
  return Boolean(item && isServiceMarketplaceCategory(item.category));
}

export function offerIsService(input: OfferSemantics): boolean {
  if (isServiceMarketplaceCategory(input.marketplaceCategory)) return true;
  const physical = listingDeliversPhysicalObject(input);
  return specsOf(input).some((id) => taxonomyCountsAsService(id, physical));
}

export function offerIsProduct(input: OfferSemantics): boolean {
  if (offerIsService(input) && !specsOf(input).some((id) => isCraftCreateTaxonomyId(id))) {
    return false;
  }
  const marketplace = String(input.marketplaceCategory ?? '').trim().toUpperCase();
  if (marketplace === 'CREATE' || marketplace === 'GROW' || marketplace === 'DESIGN') {
    return !offerIsService(input) || specsOf(input).some((id) => isCraftCreateTaxonomyId(id));
  }
  return false;
}

/**
 * Capability for one commercial offer.
 * Service taxonomy wins over the legacy Product.category bucket.
 * Requests and anything that is not an offer grant nothing.
 */
export function commercialCapabilityForOffer(input: {
  listingIntent?: string | null;
  marketplaceCategory?: string | null;
  productCategory?: string | null;
  specializations?: string[] | null;
  subcategory?: string | null;
  priceModel?: string | null;
  fulfillmentOptions?: CommerceFulfillment | null;
}): CommercialCapability | null {
  if ((input.listingIntent || 'OFFER').toUpperCase() !== 'OFFER') return null;

  const marketplace = String(input.marketplaceCategory ?? '').trim().toUpperCase();
  const specs = specsOf(input);
  const physical = listingDeliversPhysicalObject(input);
  if (isServiceMarketplaceCategory(marketplace)) return 'service';
  if (specs.some((id) => taxonomyCountsAsService(id, physical))) return 'service';
  if (specs.some((id) => isCraftCreateTaxonomyId(id))) return 'designer';
  if (marketplace === 'DESIGN') return 'designer';

  if (marketplace === 'GROW') return 'garden';
  if (marketplace === 'CREATE') return 'chef';

  if (marketplace) return null;

  const stored = String(input.productCategory ?? '').trim().toUpperCase();
  if (stored === 'CHEFF') return 'chef';
  if (stored === 'GROWN' || stored === 'GARDEN') return 'garden';
  if (stored === 'DESIGNER') return 'designer';
  return null;
}

export type ListingSemanticFamily = 'food' | 'garden' | 'creation' | 'service';

/**
 * What a listing is, from structured taxonomy.
 * Requests stay requests for intent; this does not grant a seller role.
 * Legacy Product.category is used only when no marketplace category is set.
 */
export function listingSemanticFamily(input: {
  marketplaceCategory?: string | null;
  productCategory?: string | null;
  specializations?: string[] | null;
  subcategory?: string | null;
  priceModel?: string | null;
  fulfillmentOptions?: CommerceFulfillment | null;
}): ListingSemanticFamily | null {
  const specs = [
    ...(input.specializations ?? []),
    ...(input.subcategory ? [input.subcategory] : []),
  ];
  const capability = commercialCapabilityForOffer({
    listingIntent: 'OFFER',
    marketplaceCategory: input.marketplaceCategory,
    productCategory: input.productCategory,
    specializations: specs,
    priceModel: input.priceModel,
    fulfillmentOptions: input.fulfillmentOptions,
  });
  if (capability === 'chef') return 'food';
  if (capability === 'garden') return 'garden';
  if (capability === 'designer') return 'creation';
  if (capability === 'service') return 'service';
  return null;
}

export function classifyOfferMarketplaceCategories(
  offers: Array<OfferSemantics | string | null | undefined>,
): { hasServiceOffer: boolean; hasProductOffer: boolean } {
  let hasServiceOffer = false;
  let hasProductOffer = false;
  for (const offer of offers) {
    const row: OfferSemantics =
      offer != null && typeof offer === 'object'
        ? offer
        : { marketplaceCategory: offer };
    if (offerIsService(row)) hasServiceOffer = true;
    if (offerIsProduct(row)) hasProductOffer = true;
  }
  return { hasServiceOffer, hasProductOffer };
}
