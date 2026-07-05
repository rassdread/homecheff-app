/**
 * Marketplace listing intent — Te koop / Gezocht visibility (V2/V3).
 * Legacy: missing listingIntent is treated as OFFER.
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
