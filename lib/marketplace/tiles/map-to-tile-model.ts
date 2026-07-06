/**
 * GeoFeedCardItem → MarketplaceTileModel
 */

import type { GeoFeedCardItem } from '@/components/feed/GeoFeedCards';
import { EMPTY_DISCOVERY_TRUST_CONTRACT } from '@/lib/discovery/contracts/discovery-trust-contract';
import {
  getDiscoveryFavoriteCount,
  getDiscoveryLegacyVerticalCategory,
  getDiscoveryListingIntent,
  getDiscoveryListingKind,
  getDiscoveryMarketplaceCategory,
  getDiscoverySpecializations,
} from '@/lib/discovery/consumer-accessors';
import { deriveListingKind } from '@/lib/marketplace/listing-kind';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { INSPIRATION_LISTING_KIND } from '@/lib/marketplace/contracts/listing-kind-contract';
import type {
  MarketplaceTileFulfillmentMode,
  MarketplaceTileModel,
  MarketplaceTileMode,
} from './types';
import { mapDiscoveryTrustToTileTrust } from './map-trust';
import { resolveFulfillmentFlags } from '@/lib/marketplace/previews/resolve-fulfillment-flags';

let legacyWarned = false;

function warnMissingDiscovery(id: string) {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
    if (!legacyWarned) {
      legacyWarned = true;
      console.warn(
        `[marketplace-tiles] item ${id} missing discovery block — using legacy fallbacks`,
      );
    }
  }
}

function resolveFulfillmentMode(
  deliveryMode: string | null | undefined,
): MarketplaceTileFulfillmentMode {
  const mode = String(deliveryMode ?? '').toUpperCase();
  if (mode === 'PICKUP') return 'pickup';
  if (mode === 'DELIVERY') return 'delivery';
  if (mode === 'BOTH') return 'both';
  return null;
}

function resolveListingKind(
  item: GeoFeedCardItem,
  mode: MarketplaceTileMode,
): ListingKind {
  const fromDiscovery = getDiscoveryListingKind(item);
  if (fromDiscovery) return fromDiscovery;
  if (mode === 'inspiration') return INSPIRATION_LISTING_KIND;
  const derived = deriveListingKind({
    listingIntent: item.listingIntent,
    marketplaceCategory: item.marketplaceCategory,
    specializations: item.specializations,
    category: item.category,
    type: item.type,
    entityType: item.discovery?.entityType,
  });
  return derived.listingKind;
}

function resolveEntityType(
  item: GeoFeedCardItem,
  mode: MarketplaceTileMode,
): MarketplaceTileModel['entityType'] {
  if (item.discovery?.entityType) return item.discovery.entityType;
  if (mode === 'inspiration') return 'dish';
  return 'product';
}

export type MapToTileModelOptions = {
  href: string;
  mode: MarketplaceTileMode;
  inspirationCategoryLabel?: string;
};

export function mapGeoFeedCardToTileModel(
  item: GeoFeedCardItem,
  options: MapToTileModelOptions,
): MarketplaceTileModel {
  const { href, mode, inspirationCategoryLabel } = options;
  const d = item.discovery;

  if (!d) warnMissingDiscovery(item.id);

  const trustContract = d?.trust ?? EMPTY_DISCOVERY_TRUST_CONTRACT;
  const listingIntent =
    (getDiscoveryListingIntent(item) as 'OFFER' | 'REQUEST' | null) ?? null;

  const listingKind = resolveListingKind(item, mode);

  return {
    id: item.id,
    href,
    entityType: resolveEntityType(item, mode),
    title: item.title ?? '',
    description: d?.description ?? item.description ?? null,

    coverImage: d?.coverImage ?? item.photo ?? null,
    videoUrl: item.videoUrl ?? null,
    videoPoster: item.videoThumbnail ?? null,
    imageAlt: item.title ?? '',

    listingKind,
    listingIntent,
    marketplaceCategory: getDiscoveryMarketplaceCategory(item),
    specializations: getDiscoverySpecializations(item),
    acceptedSpecializations:
      d?.acceptedSpecializations ?? item.acceptedSpecializations ?? [],
    barterOpenness: d?.barterOpenness != null ? String(d.barterOpenness) : null,
    availabilityDate: d?.availabilityDate ?? null,

    priceCents: item.priceCents ?? null,
    priceModel: item.priceModel ?? null,
    orderMethod: item.orderMethod ?? null,

    person: item.sellerUserId
      ? {
          userId: item.sellerUserId,
          name: item.sellerName ?? null,
          username: item.sellerUsername ?? null,
          avatar: item.sellerAvatar ?? null,
          displayFullName: item.sellerDisplayFullName,
          displayNameOption: item.sellerDisplayNameOption,
        }
      : null,

    place: d?.city ?? item.place ?? null,
    distanceKm: d?.distanceKm ?? item.distanceKm ?? null,

    trust: mapDiscoveryTrustToTileTrust(trustContract),

    favoriteCount: getDiscoveryFavoriteCount(item),
    fulfillmentMode: resolveFulfillmentMode(item.deliveryMode),
    fulfillmentFlags: resolveFulfillmentFlags({
      deliveryMode: item.deliveryMode,
      listingKind,
      fulfillmentMode: resolveFulfillmentMode(item.deliveryMode),
    }),
    capacityRemaining: null,
    neededBy: listingIntent === 'REQUEST' ? d?.availabilityDate ?? null : null,

    mode,
    inspirationCategoryLabel:
      inspirationCategoryLabel ??
      (mode === 'inspiration'
        ? getDiscoveryLegacyVerticalCategory(item) ?? item.category ?? undefined
        : undefined),
  };
}
