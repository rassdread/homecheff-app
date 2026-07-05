import type { MarketplaceCategory } from '@prisma/client';
import type { ListingIntentValue } from './listing-taxonomy';
import {
  normalizeSpecializations,
  parseMarketplaceCategoryParam,
} from './listing-taxonomy';

export type MarketplaceEntryPrefill = {
  listingIntent?: ListingIntentValue;
  marketplaceCategory?: MarketplaceCategory;
  specializations?: string[];
};

/** Parse URL params for marketplace entry deep links */
export function parseMarketplaceEntryFromSearchParams(
  sp: URLSearchParams,
): MarketplaceEntryPrefill {
  const intentRaw = sp.get('intent')?.toUpperCase();
  const listingIntent: ListingIntentValue | undefined =
    intentRaw === 'REQUEST' ? 'REQUEST' : intentRaw === 'OFFER' ? 'OFFER' : undefined;

  const categoryParam =
    sp.get('marketplaceCategory') ?? sp.get('category');
  const marketplaceCategory = parseMarketplaceCategoryParam(categoryParam);

  const specsRaw = sp.get('specializations') ?? sp.get('specs');
  let specializations: string[] | undefined;
  if (specsRaw) {
    specializations = normalizeSpecializations(specsRaw, marketplaceCategory);
  }

  return {
    listingIntent,
    marketplaceCategory: marketplaceCategory ?? undefined,
    specializations,
  };
}

export function entryPrefillIsComplete(
  prefill: MarketplaceEntryPrefill,
): prefill is Required<MarketplaceEntryPrefill> {
  return (
    !!prefill.listingIntent &&
    !!prefill.marketplaceCategory &&
    Array.isArray(prefill.specializations) &&
    prefill.specializations.length > 0
  );
}
