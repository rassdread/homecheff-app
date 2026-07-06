/**
 * Canonical Discovery Read Model — single marketplace truth for all surfaces.
 * @see docs/audits/DISCOVERY_READ_MODEL_AUDIT.md
 *
 * Not Product, not Listing, not Dish, not feed-specific shapes.
 * Every discovery consumer must use this contract before ranking/personalization.
 */

import type { BarterOpenness, MarketplaceCategory } from '@prisma/client';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';

export type DiscoveryEntityType = 'product' | 'dish' | 'listing' | 'workspace';

export type DiscoveryListingIntent = 'OFFER' | 'REQUEST';

export type DiscoveryTrustBadge = {
  key: string;
  name: string;
  icon: string;
};

/** Per-channel trust — no blended rating (Phase 0). */
export type DiscoveryTrustBlock = {
  productReviewCount: number;
  dealReviewCount: number;
  courierReviewCount: number;
  completedDeals: number;
  completedDeliveries: number;
  trustBadges: DiscoveryTrustBadge[];
};

/** Social signals — favorites + fans + workspace props only (Phase 0). */
export type DiscoverySocialBlock = {
  favoriteCount: number;
  fansCount: number;
  workspacePropsCount: number;
};

export type DiscoveryCapabilityBlock = {
  sellerRoles: string[];
  hasSellerCapability: boolean;
  hasCourierCapability: boolean;
  hasCreatorCapability: boolean;
};

export type DiscoveryReadModel = {
  /** Identity */
  id: string;
  entityType: DiscoveryEntityType;
  listingKind: ListingKind;
  listingIntent: DiscoveryListingIntent | null;
  title: string;
  slug: string | null;
  description: string | null;

  /** Media */
  coverImage: string | null;
  imageCount: number;
  videoCount: number;

  /** Location */
  city: string | null;
  region: string | null;
  country: string | null;
  distanceKm: number | null;

  /** Marketplace taxonomy */
  marketplaceCategory: MarketplaceCategory | string | null;
  specializations: string[];
  acceptedSpecializations: string[];
  barterOpenness: BarterOpenness | string | null;

  /** Trust — channel counts only, no composite average */
  trust: DiscoveryTrustBlock;

  /** Social — no item-level props */
  social: DiscoverySocialBlock;

  /** Status */
  createdAt: string;
  updatedAt: string | null;
  availabilityDate: string | null;
  isActive: boolean;

  /** Owner capability indicators */
  capability: DiscoveryCapabilityBlock;
};

export const EMPTY_DISCOVERY_TRUST: DiscoveryTrustBlock = {
  productReviewCount: 0,
  dealReviewCount: 0,
  courierReviewCount: 0,
  completedDeals: 0,
  completedDeliveries: 0,
  trustBadges: [],
};

export const EMPTY_DISCOVERY_SOCIAL: DiscoverySocialBlock = {
  favoriteCount: 0,
  fansCount: 0,
  workspacePropsCount: 0,
};

export const EMPTY_DISCOVERY_CAPABILITY: DiscoveryCapabilityBlock = {
  sellerRoles: [],
  hasSellerCapability: false,
  hasCourierCapability: false,
  hasCreatorCapability: false,
};

/** API payloads may include canonical read model alongside legacy fields. */
export type WithDiscoveryReadModel<T = Record<string, unknown>> = T & {
  discovery: DiscoveryReadModel;
};
