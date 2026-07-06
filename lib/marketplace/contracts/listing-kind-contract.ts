/**
 * Canonical ListingKind contract — single shared type for Feed, Profile, Discovery, SEO, Matching.
 * @see docs/architecture/LISTING_KIND_SPEC.md
 */

/** Marketplace listing kinds derived from Product (and related entities). */
export const MARKETPLACE_LISTING_KINDS = [
  'PRODUCT',
  'SERVICE',
  'TASK',
  'WORKSHOP',
  'COACHING',
  'REQUEST',
] as const;

export type MarketplaceListingKind = (typeof MARKETPLACE_LISTING_KINDS)[number];

/** Non-Product content kind (Dish, WorkspaceContent). */
export const INSPIRATION_LISTING_KIND = 'INSPIRATION' as const;

/** All classifiable listing kinds in the platform. */
export const LISTING_KINDS = [
  ...MARKETPLACE_LISTING_KINDS,
  INSPIRATION_LISTING_KIND,
] as const;

export type ListingKind = (typeof LISTING_KINDS)[number];

export function isListingKind(value: string): value is ListingKind {
  return (LISTING_KINDS as readonly string[]).includes(value);
}

export function isMarketplaceListingKind(
  value: string,
): value is MarketplaceListingKind {
  return (MARKETPLACE_LISTING_KINDS as readonly string[]).includes(value);
}

/** Kinds that participate in Aanbod (OFFER) profile filters by type. */
export const AANBOD_KIND_FILTERS = [
  'products',
  'services',
  'tasks',
  'workshops',
  'coaching',
  'help',
] as const;

export type AanbodKindFilterSlug = (typeof AANBOD_KIND_FILTERS)[number];

export function listingKindToAanbodFilterSlug(
  kind: ListingKind,
): AanbodKindFilterSlug | null {
  switch (kind) {
    case 'PRODUCT':
      return 'products';
    case 'SERVICE':
      return 'services';
    case 'TASK':
      return 'tasks';
    case 'WORKSHOP':
      return 'workshops';
    case 'COACHING':
      return 'coaching';
    case 'REQUEST':
      return 'help';
    default:
      return null;
  }
}
