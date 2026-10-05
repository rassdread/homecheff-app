/**
 * Commercial capability derived from a validated listing.
 * Taxonomy describes the kind of work. sellerRoles stores the capability.
 * Product.category stays the legacy storage bucket (CHEFF / GROWN / DESIGNER).
 */

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
]);

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

export type OfferSemantics = {
  marketplaceCategory?: string | null;
  specializations?: string[] | null;
};

function specsOf(input: OfferSemantics): string[] {
  return (input.specializations ?? []).filter((id) => typeof id === 'string' && id.trim());
}

export function offerIsService(input: OfferSemantics): boolean {
  if (isServiceMarketplaceCategory(input.marketplaceCategory)) return true;
  const specs = specsOf(input);
  if (specs.some((id) => isDesignServiceTaxonomyId(id))) return true;
  const marketplace = String(input.marketplaceCategory ?? '').trim().toUpperCase();
  if (marketplace !== 'DESIGN') return false;
  return !specs.some((id) => isCraftCreateTaxonomyId(id));
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
}): CommercialCapability | null {
  if ((input.listingIntent || 'OFFER').toUpperCase() !== 'OFFER') return null;

  const marketplace = String(input.marketplaceCategory ?? '').trim().toUpperCase();
  const specs = input.specializations ?? [];
  if (isServiceMarketplaceCategory(marketplace)) return 'service';
  if (specs.some((id) => isDesignServiceTaxonomyId(id))) return 'service';
  if (specs.some((id) => isCraftCreateTaxonomyId(id))) return 'designer';
  if (marketplace === 'DESIGN') return 'service';

  if (marketplace === 'GROW') return 'garden';
  if (marketplace === 'CREATE') return 'chef';

  if (marketplace) return null;

  const stored = String(input.productCategory ?? '').trim().toUpperCase();
  if (stored === 'CHEFF') return 'chef';
  if (stored === 'GROWN' || stored === 'GARDEN') return 'garden';
  if (stored === 'DESIGNER') return 'designer';
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
