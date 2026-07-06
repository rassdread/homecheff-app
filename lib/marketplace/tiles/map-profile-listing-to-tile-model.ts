/**
 * Profile listing → MarketplaceTileModel (no API changes).
 */

import { EMPTY_DISCOVERY_TRUST_CONTRACT } from '@/lib/discovery/contracts/discovery-trust-contract';
import type { DiscoveryReadModel } from '@/lib/discovery/contracts/discovery-read-model';
import {
  getDiscoveryFavoriteCount,
  getDiscoveryListingIntent,
  getDiscoveryListingKind,
  getDiscoveryMarketplaceCategory,
  getDiscoverySpecializations,
} from '@/lib/discovery/consumer-accessors';
import { deriveListingKind } from '@/lib/marketplace/listing-kind';
import { INSPIRATION_LISTING_KIND } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { resolveFulfillmentFlags } from '@/lib/marketplace/previews/resolve-fulfillment-flags';
import { resolveTileValueExchangeFields } from './resolve-tile-value-exchange';
import type {
  MarketplaceTileMode,
  MarketplaceTileModel,
  MarketplaceTilePerson,
} from './types';
import { mapDiscoveryTrustToTileTrust } from './map-trust';

export type ProfileListingInput = {
  id: string;
  title: string | null;
  description?: string | null;
  priceCents?: number | null;
  priceModel?: string | null;
  orderMethod?: string | null;
  listingIntent?: string | null;
  listingKind?: ListingKind | null;
  category?: string | null;
  marketplaceCategory?: string | null;
  specializations?: string[];
  acceptedSpecializations?: string[];
  place?: string | null;
  deliveryMode?: string | null;
  photos?: Array<{ url: string }>;
  discovery?: DiscoveryReadModel | null;
};

export type MapProfileListingOptions = {
  href: string;
  owner: MarketplaceTilePerson;
  mode?: MarketplaceTileMode;
  inspirationCategoryLabel?: string;
};

function resolveKind(item: ProfileListingInput, mode: MarketplaceTileMode): ListingKind {
  const fromDiscovery = getDiscoveryListingKind(item);
  if (fromDiscovery) return fromDiscovery;
  if (mode === 'inspiration') return INSPIRATION_LISTING_KIND;
  const derived = deriveListingKind({
    listingIntent: item.listingIntent,
    marketplaceCategory: item.marketplaceCategory,
    specializations: item.specializations,
    category: item.category,
    entityType: item.discovery?.entityType,
  });
  return derived.listingKind;
}

export function mapProfileListingToTileModel(
  item: ProfileListingInput,
  options: MapProfileListingOptions,
): MarketplaceTileModel {
  const mode = options.mode ?? 'sale';
  const d = item.discovery;
  const trustContract = d?.trust ?? EMPTY_DISCOVERY_TRUST_CONTRACT;
  const cover =
    d?.coverImage ?? item.photos?.[0]?.url ?? null;

  const listingKind = resolveKind(item, mode);
  const listingIntent =
    (getDiscoveryListingIntent(item) as 'OFFER' | 'REQUEST' | null) ?? null;

  const marketplaceCategory = getDiscoveryMarketplaceCategory(item);
  const specializations = getDiscoverySpecializations(item);
  const acceptedSpecializations =
    d?.acceptedSpecializations ?? item.acceptedSpecializations ?? [];

  const valueExchange = resolveTileValueExchangeFields({
    marketplaceCategory,
    specializations,
    acceptedSpecializations,
    listingKind,
    listingIntent,
  });

  return {
    id: item.id,
    href: options.href,
    entityType: d?.entityType ?? (mode === 'inspiration' ? 'dish' : 'product'),
    title: item.title ?? '',
    description: item.description ?? d?.description ?? null,

    coverImage: cover,
    videoUrl: null,
    videoPoster: null,
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

    person: options.owner,
    place: d?.city ?? item.place ?? null,
    distanceKm: d?.distanceKm ?? null,

    trust: mapDiscoveryTrustToTileTrust(trustContract),

    favoriteCount: getDiscoveryFavoriteCount(item),
    fulfillmentMode: null,
    fulfillmentFlags: resolveFulfillmentFlags({
      deliveryMode: item.deliveryMode,
      listingKind,
    }),
    capacityRemaining: null,
    neededBy: listingIntent === 'REQUEST' ? d?.availabilityDate ?? null : null,

    mode,
    inspirationCategoryLabel: options.inspirationCategoryLabel,

    offerMainCategory: valueExchange.offerMainCategory,
    offerSubCategory: valueExchange.offerSubCategory,
    offerSubCategoryIcon: valueExchange.offerSubCategoryIcon,
    acceptedValueCategories: valueExchange.acceptedValueCategories,
    acceptedValueSubcategories: valueExchange.acceptedValueSubcategories,
  };
}
