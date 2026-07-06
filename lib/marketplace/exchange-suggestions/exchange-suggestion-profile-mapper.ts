/**
 * Map Product rows → ExchangeListingProfile for suggestions.
 */

import type { ListingIntent, MarketplaceCategory } from '@prisma/client';
import type { ExchangeListingProfile } from '@/lib/marketplace/exchange/exchange-contract';
import { buildExchangeListingProfile } from '@/lib/marketplace/exchange';
import { deriveListingKind } from '@/lib/marketplace/listing-kind';
import {
  buildDesiredExchangeDetail,
  marketplaceCategoryToMainCategory,
} from '@/lib/marketplace/value-exchange';

export type ExchangeSuggestionProductRow = {
  id: string;
  sellerId: string;
  sellerUserId: string;
  title: string;
  listingIntent: ListingIntent | string;
  marketplaceCategory: MarketplaceCategory | string | null;
  category: string;
  subcategory?: string | null;
  specializations: string[];
  acceptedSpecializations: string[];
  barterOpenness: string | null;
  priceModel: string | null;
  createdAt: Date | string;
  availabilityDate?: Date | string | null;
  isActive: boolean;
  distanceKm?: number | null;
  sellerUsername?: string | null;
};

export function productRowToExchangeProfile(
  row: ExchangeSuggestionProductRow,
): ExchangeListingProfile {
  const listingIntent =
    String(row.listingIntent).toUpperCase() === 'REQUEST' ? 'REQUEST' : 'OFFER';

  const { listingKind } = deriveListingKind({
    listingIntent: row.listingIntent,
    marketplaceCategory: row.marketplaceCategory,
    specializations: row.specializations,
    category: row.category,
    subcategory: row.subcategory,
  });

  const desiredExchanges =
    listingIntent === 'REQUEST'
      ? row.specializations
          .map((subcategoryId) => {
            const mainCategory = marketplaceCategoryToMainCategory(
              (row.marketplaceCategory ?? 'CREATE') as MarketplaceCategory,
              subcategoryId,
              listingKind,
            );
            return buildDesiredExchangeDetail({
              mainCategory,
              subcategoryId,
              description: row.title,
            });
          })
          .filter((d): d is NonNullable<typeof d> => d !== null)
      : [];

  return buildExchangeListingProfile({
    listingId: row.id,
    userId: row.sellerUserId,
    listingKind,
    listingIntent,
    marketplaceCategory: (row.marketplaceCategory as MarketplaceCategory) ?? null,
    specializationIds: row.specializations,
    acceptedTaxonomyIds: row.acceptedSpecializations,
    barterOpenness: row.barterOpenness,
    priceModel: row.priceModel,
    desiredExchanges,
    distanceKm: row.distanceKm ?? null,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : String(row.createdAt),
    availabilityDate: row.availabilityDate
      ? row.availabilityDate instanceof Date
        ? row.availabilityDate.toISOString()
        : String(row.availabilityDate)
      : null,
    isActive: row.isActive,
    isDiscoverable: row.isActive,
    isBlocked: false,
  });
}

export function productRowIsSuggestionEligible(
  row: ExchangeSuggestionProductRow,
): boolean {
  if (!row.isActive) return false;
  const openness = String(row.barterOpenness ?? 'MONEY').toUpperCase();
  if (openness !== 'MONEY') return true;
  if (String(row.listingIntent).toUpperCase() === 'REQUEST') return true;
  return false;
}

export function exchangeSuggestionProductSelect() {
  return {
    id: true,
    title: true,
    sellerId: true,
    listingIntent: true,
    marketplaceCategory: true,
    category: true,
    subcategory: true,
    specializations: true,
    acceptedSpecializations: true,
    barterOpenness: true,
    priceModel: true,
    createdAt: true,
    availabilityDate: true,
    isActive: true,
    seller: {
      select: {
        userId: true,
        User: { select: { username: true } },
      },
    },
  } as const;
}
