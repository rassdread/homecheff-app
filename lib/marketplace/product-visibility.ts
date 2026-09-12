/**
 * Marketplace listing intent — Te koop / Gezocht visibility (V2/V3).
 * Legacy: missing listingIntent is treated as OFFER.
 *
 * Public discoverability SoT: `lib/marketplace/public-listing-eligibility.ts`.
 */

export type ListingIntentValue = 'OFFER' | 'REQUEST' | string | null | undefined;

export type ListingIntentInput = {
  listingIntent?: ListingIntentValue;
};

export function isOfferListing(product: ListingIntentInput): boolean {
  const intent = product.listingIntent;
  if (intent == null || intent === '') return true;
  return String(intent).trim().toUpperCase() === 'OFFER';
}

export function isRequestListing(product: ListingIntentInput): boolean {
  const intent = product.listingIntent;
  if (intent == null || intent === '') return false;
  return String(intent).trim().toUpperCase() === 'REQUEST';
}

export type ListingPublicVisibilityInput = {
  isActive?: boolean | null;
  integrityStatus?: string | null;
  sellerEmail?: string | null;
  sellerBio?: string | null;
  sellerSuspendedAt?: Date | string | null;
  sellerAccountDeletedAt?: Date | string | null;
};

export {
  isListingPubliclyDiscoverable,
  publicListingEligibilityWhere,
} from '@/lib/marketplace/public-listing-eligibility';
