/**
 * Favorite API record → MarketplaceTileModel (client-side, no API change).
 */

import { INSPIRATION_LISTING_KIND } from '@/lib/marketplace/contracts/listing-kind-contract';
import { deriveListingKind } from '@/lib/marketplace/listing-kind';
import { resolveFulfillmentFlags } from '@/lib/marketplace/previews/resolve-fulfillment-flags';
import { resolveSettlementOptions } from '@/lib/marketplace/settlement/settlement-options';
import type { MarketplaceTileModel, MarketplaceTilePerson } from './types';
import { EMPTY_TILE_TRUST } from './map-trust';

type FavoriteProduct = {
  id: string;
  title: string | null;
  priceCents?: number | null;
  priceModel?: string | null;
  category?: string | null;
  orderMethod?: string | null;
  acceptHomeCheffPayment?: boolean | null;
  acceptDirectContact?: boolean | null;
  barterOpenness?: string | null;
  acceptedSpecializations?: string[];
  listingIntent?: string | null;
  Image?: Array<{ fileUrl?: string | null }>;
};

function favoriteSettlementFlags(input: {
  orderMethod?: string | null;
  acceptHomeCheffPayment?: boolean | null;
  acceptDirectContact?: boolean | null;
  barterOpenness?: string | null;
  acceptedSpecializations?: string[];
  priceCents?: number | null;
  priceModel?: string | null;
  listingIntent?: string | null;
}) {
  const settlement = resolveSettlementOptions({
    acceptHomeCheffPayment: input.acceptHomeCheffPayment,
    acceptDirectContact: input.acceptDirectContact,
    orderMethod: input.orderMethod,
    barterOpenness: input.barterOpenness,
    acceptedSpecializations: input.acceptedSpecializations,
    priceCents: input.priceCents,
    priceModel: input.priceModel,
    listingIntent: input.listingIntent,
  });
  return {
    acceptsHomeCheffCheckout: settlement.acceptsHomeCheffCheckout,
    acceptsDirectContact: settlement.acceptsDirectContact,
    homeCheffCheckoutConfigured: settlement.homeCheffCheckoutConfigured,
  };
}

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
    const settlement = favoriteSettlementFlags({
      orderMethod: p.orderMethod,
      acceptHomeCheffPayment: p.acceptHomeCheffPayment,
      acceptDirectContact: p.acceptDirectContact,
      barterOpenness: p.barterOpenness,
      acceptedSpecializations: p.acceptedSpecializations,
      priceCents: p.priceCents,
      priceModel: p.priceModel,
      listingIntent: p.listingIntent ?? 'OFFER',
    });
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
      acceptedSpecializations: p.acceptedSpecializations ?? [],
      barterOpenness: p.barterOpenness ?? null,
      availabilityDate: null,
      priceCents: p.priceCents ?? null,
      priceModel: p.priceModel ?? null,
      orderMethod: p.orderMethod ?? null,
      acceptsHomeCheffCheckout: settlement.acceptsHomeCheffCheckout,
      acceptsDirectContact: settlement.acceptsDirectContact,
      homeCheffCheckoutConfigured: settlement.homeCheffCheckoutConfigured,
      person: owner,
      place: null,
      distanceKm: null,
      trust: { ...EMPTY_TILE_TRUST },
      favoriteCount: 0,
      fulfillmentMode: null,
      fulfillmentFlags: resolveFulfillmentFlags({ listingKind: kind }),
      capacityRemaining: null,
      neededBy: null,
      mode: 'sale',
    };
  }

  if (record.Dish) {
    const d = record.Dish;
    const dishKind = INSPIRATION_LISTING_KIND;
    const dishSettlement = favoriteSettlementFlags({
      orderMethod: null,
      listingIntent: null,
    });
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
      acceptsHomeCheffCheckout: dishSettlement.acceptsHomeCheffCheckout,
      acceptsDirectContact: dishSettlement.acceptsDirectContact,
      homeCheffCheckoutConfigured: dishSettlement.homeCheffCheckoutConfigured,
      person: owner,
      place: null,
      distanceKm: null,
      trust: { ...EMPTY_TILE_TRUST },
      favoriteCount: 0,
      fulfillmentMode: null,
      fulfillmentFlags: resolveFulfillmentFlags({ listingKind: dishKind }),
      capacityRemaining: null,
      neededBy: null,
      mode: 'inspiration',
      inspirationCategoryLabel: d.category ?? undefined,
    };
  }

  if (record.Listing) {
    const l = record.Listing;
    const listingKind = 'PRODUCT' as const;
    const listingSettlement = favoriteSettlementFlags({
      orderMethod: null,
      priceCents: l.priceCents,
      listingIntent: 'OFFER',
    });
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
      acceptsHomeCheffCheckout: listingSettlement.acceptsHomeCheffCheckout,
      acceptsDirectContact: listingSettlement.acceptsDirectContact,
      homeCheffCheckoutConfigured: listingSettlement.homeCheffCheckoutConfigured,
      person: owner,
      place: l.place ?? null,
      distanceKm: null,
      trust: { ...EMPTY_TILE_TRUST },
      favoriteCount: 0,
      fulfillmentMode: null,
      fulfillmentFlags: resolveFulfillmentFlags({ listingKind }),
      capacityRemaining: null,
      neededBy: null,
      mode: 'sale',
    };
  }

  return null;
}
