/**
 * Canonical Discovery Read Model — single marketplace truth for all surfaces.
 * @see docs/audits/DISCOVERY_READ_MODEL_AUDIT.md
 *
 * Not Product, not Listing, not Dish, not feed-specific shapes.
 * Every discovery consumer must use this contract before ranking/personalization.
 */

import type { BarterOpenness, MarketplaceCategory } from '@prisma/client';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { DiscoveryTrustContract } from './discovery-trust-contract';
import { EMPTY_DISCOVERY_TRUST_CONTRACT } from './discovery-trust-contract';

export type DiscoveryEntityType = 'product' | 'dish' | 'listing' | 'workspace';

export type DiscoveryListingIntent = 'OFFER' | 'REQUEST';

export type DiscoveryTrustBadge = {
  key: string;
  name: string;
  icon: string;
};

/** @deprecated Use DiscoveryTrustContract — flat block removed in Phase 2B. */
export type DiscoveryTrustBlock = DiscoveryTrustContract;

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

  /** Trust — canonical DiscoveryTrustContract (Phase 2B). */
  trust: DiscoveryTrustContract;

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

export const EMPTY_DISCOVERY_TRUST: DiscoveryTrustContract =
  EMPTY_DISCOVERY_TRUST_CONTRACT;

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
