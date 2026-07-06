/**
 * Exchange overlap computation — Phase 4D.
 */

import type { ExchangeListingProfile, ExchangeOverlapResult } from './exchange-contract';
import type { ValueExchangeMainCategory } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import {
  acceptedMainCategoriesFromTaxonomyIds,
  marketplaceCategoryToMainCategory,
} from '@/lib/marketplace/value-exchange/category-taxonomy-map';

function intersect<T>(a: T[], b: T[]): T[] {
  const setB = new Set(b);
  return a.filter((x) => setB.has(x));
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function offerSubcategories(profile: ExchangeListingProfile): string[] {
  return unique(profile.offer.subcategoryIds);
}

function acceptedSubcategories(profile: ExchangeListingProfile): string[] {
  return unique(profile.acceptance?.subcategoryIds ?? []);
}

function desiredSubcategories(profile: ExchangeListingProfile): string[] {
  return unique(profile.desiredExchanges.map((d) => d.subcategoryId));
}

function mainCategoriesFromProfile(
  profile: ExchangeListingProfile,
): ValueExchangeMainCategory[] {
  const fromOffer = profile.offer.mainCategory;
  const fromAccept = profile.acceptance?.mainCategories ?? [];
  const fromDesired = profile.desiredExchanges.map((d) => d.mainCategory);
  return unique([fromOffer, ...fromAccept, ...fromDesired]);
}

/** A offers what B wants: A's offer subcats ∩ B's desired subcats */
function directOfferWants(
  offerer: ExchangeListingProfile,
  wanter: ExchangeListingProfile,
): Array<{ subcategoryId: string }> {
  const offerIds = offerSubcategories(offerer);
  const wantIds = desiredSubcategories(wanter);
  return intersect(offerIds, wantIds).map((subcategoryId) => ({ subcategoryId }));
}

function barterOpenForMatching(profile: ExchangeListingProfile): boolean {
  const o = profile.acceptance?.barterOpenness ?? 'MONEY';
  return o === 'BARTER_ONLY' || o === 'MONEY_AND_BARTER';
}

export function computeExchangeOverlap(
  a: ExchangeListingProfile,
  b: ExchangeListingProfile,
): ExchangeOverlapResult {
  const aMain = mainCategoriesFromProfile(a);
  const bMain = mainCategoriesFromProfile(b);
  const sharedMainCategories = intersect(aMain, bMain) as ValueExchangeMainCategory[];

  const aSubs = unique([
    ...offerSubcategories(a),
    ...acceptedSubcategories(a),
    ...desiredSubcategories(a),
  ]);
  const bSubs = unique([
    ...offerSubcategories(b),
    ...acceptedSubcategories(b),
    ...desiredSubcategories(b),
  ]);
  const sharedSubcategoryIds = intersect(aSubs, bSubs);

  const aOffersB = directOfferWants(a, b);
  const bOffersA = directOfferWants(b, a);

  const offerMatchesDesired = [
    ...aOffersB.map((m) => ({
      offerListingId: a.listingId,
      desiredListingId: b.listingId,
      subcategoryId: m.subcategoryId,
    })),
    ...bOffersA.map((m) => ({
      offerListingId: b.listingId,
      desiredListingId: a.listingId,
      subcategoryId: m.subcategoryId,
    })),
  ];

  const aAcceptsB =
    barterOpenForMatching(a) &&
    intersect(
      a.acceptance?.mainCategories ?? [],
      [b.offer.mainCategory],
    ).length > 0;
  const bAcceptsA =
    barterOpenForMatching(b) &&
    intersect(
      b.acceptance?.mainCategories ?? [],
      [a.offer.mainCategory],
    ).length > 0;

  const mutualBarterReady = aAcceptsB && bAcceptsA;

  return {
    sharedMainCategories,
    sharedSubcategoryIds,
    offerMatchesDesired,
    mutualBarterReady,
  };
}

export function mainCategoryFromTaxonomyIds(
  taxonomyIds: string[],
  listingKind?: import('@/lib/marketplace/contracts/listing-kind-contract').ListingKind,
): ValueExchangeMainCategory[] {
  return acceptedMainCategoriesFromTaxonomyIds(taxonomyIds);
}

export function mainCategoryForSubcategory(
  subcategoryId: string,
  marketplaceCategory: import('@prisma/client').MarketplaceCategory,
  listingKind?: import('@/lib/marketplace/contracts/listing-kind-contract').ListingKind,
): ValueExchangeMainCategory {
  return marketplaceCategoryToMainCategory(
    marketplaceCategory,
    subcategoryId,
    listingKind ?? null,
  );
}
