/**
 * Favorite API record → MarketplaceTileModel (client-side, no API change).
 */

import { INSPIRATION_LISTING_KIND } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { MarketplaceTileModel, MarketplaceTilePerson } from './types';

type FavoriteProduct = {
  id: string;
  title: string | null;
  priceCents?: number | null;
  priceModel?: string | null;
  category?: string | null;
  Image?: Array<{ fileUrl?: string | null }>;
};

type FavoriteDish = {
  id: string;
  title: string | null;
  priceCents?: number | null;
  category?: string | null;
  photos?: Array<{ url?: string | null }>;
};

type FavoriteListing = {
  id: string;
  title?: string | null;
  priceCents?: number | null;
  place?: string | null;
};

export type FavoriteApiRecord = {
  Product?: FavoriteProduct | null;
  Dish?: FavoriteDish | null;
  Listing?: FavoriteListing | null;
};

function dishHref(dish: FavoriteDish): string {
  const cat = (dish.category || 'CHEFF').toUpperCase();
  if (cat === 'GROWN') return `/garden/${dish.id}`;
  if (cat === 'DESIGNER') return `/design/${dish.id}`;
  return `/recipe/${dish.id}`;
}

export function mapFavoriteRecordToTileModel(
  record: FavoriteApiRecord,
  owner: MarketplaceTilePerson | null,
): MarketplaceTileModel | null {
  if (record.Product) {
    const p = record.Product;
    const href = `/product/${p.id}`;
    const kind = deriveListingKind({
      marketplaceCategory: null,
      category: p.category,
      specializations: [],
    }).listingKind;
    return {
      id: p.id,
      href,
      entityType: 'product',
      title: p.title ?? '',
      description: null,
      coverImage: p.Image?.[0]?.fileUrl ?? null,
      videoUrl: null,
      videoPoster: null,
      imageAlt: p.title ?? '',
      listingKind: kind,
      listingIntent: 'OFFER',
      marketplaceCategory: null,
      specializations: [],
      acceptedSpecializations: [],
      barterOpenness: null,
      availabilityDate: null,
      priceCents: p.priceCents ?? null,
      priceModel: p.priceModel ?? null,
      orderMethod: null,
      person: owner,
      place: null,
      distanceKm: null,
      trust: {
        productReviewCount: 0,
        dealReviewCount: 0,
        courierReviewCount: 0,
        completedDeals: 0,
        completedDeliveries: 0,
        trustBadges: [],
        sellerTier: 0,
      },
      favoriteCount: 0,
      fulfillmentMode: null,
      mode: 'sale',
    };
  }

  if (record.Dish) {
    const d = record.Dish;
    return {
      id: d.id,
      href: dishHref(d),
      entityType: 'dish',
      title: d.title ?? '',
      description: null,
      coverImage: d.photos?.[0]?.url ?? null,
      videoUrl: null,
      videoPoster: null,
      imageAlt: d.title ?? '',
      listingKind: INSPIRATION_LISTING_KIND,
      listingIntent: null,
      marketplaceCategory: null,
      specializations: [],
      acceptedSpecializations: [],
      barterOpenness: null,
      availabilityDate: null,
      priceCents: null,
      priceModel: null,
      orderMethod: null,
      person: owner,
      place: null,
      distanceKm: null,
      trust: {
        productReviewCount: 0,
        dealReviewCount: 0,
        courierReviewCount: 0,
        completedDeals: 0,
        completedDeliveries: 0,
        trustBadges: [],
        sellerTier: 0,
      },
      favoriteCount: 0,
      fulfillmentMode: null,
      mode: 'inspiration',
      inspirationCategoryLabel: d.category ?? undefined,
    };
  }

  if (record.Listing) {
    const l = record.Listing;
    return {
      id: l.id,
      href: `/product/${l.id}`,
      entityType: 'listing',
      title: l.title ?? '',
      description: null,
      coverImage: null,
      videoUrl: null,
      videoPoster: null,
      imageAlt: l.title ?? '',
      listingKind: 'PRODUCT',
      listingIntent: 'OFFER',
      marketplaceCategory: null,
      specializations: [],
      acceptedSpecializations: [],
      barterOpenness: null,
      availabilityDate: null,
      priceCents: l.priceCents ?? null,
      priceModel: null,
      orderMethod: null,
      person: owner,
      place: l.place ?? null,
      distanceKm: null,
      trust: {
        productReviewCount: 0,
        dealReviewCount: 0,
        courierReviewCount: 0,
        completedDeals: 0,
        completedDeliveries: 0,
        trustBadges: [],
        sellerTier: 0,
      },
      favoriteCount: 0,
      fulfillmentMode: null,
      mode: 'sale',
    };
  }

  return null;
}
