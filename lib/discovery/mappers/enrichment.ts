import type {
  DiscoveryCapabilityBlock,
  DiscoverySocialBlock,
  DiscoveryTrustBadge,
} from '../contracts/discovery-read-model';
import type { DiscoveryTrustContract } from '../contracts/discovery-trust-contract';
import {
  EMPTY_DISCOVERY_CAPABILITY,
  EMPTY_DISCOVERY_SOCIAL,
} from '../contracts/discovery-read-model';
import { buildDiscoveryTrust } from '../trust/build-discovery-trust';
import type { SellerTrustSnapshot } from '../trust/types';

/** Optional stats merged into read model — listing-level or seller-level. */
export type DiscoveryEnrichment = {
  /** Listing-level verified product review count. */
  productReviewCount?: number;
  listingIsActive?: boolean;
  /** Batch-fetched seller trust evidence (Phase 2B). */
  sellerTrustSnapshot?: SellerTrustSnapshot | null;
  /** Legacy flat overrides when snapshot absent. */
  dealReviewCount?: number;
  courierReviewCount?: number;
  completedDeals?: number;
  completedDeliveries?: number;
  repeatCustomers?: number;
  trustBadges?: DiscoveryTrustBadge[];
  favoriteCount?: number;
  fansCount?: number;
  workspacePropsCount?: number;
  distanceKm?: number | null;
  sellerRoles?: string[];
  buyerRoles?: string[];
  hasDeliveryProfile?: boolean;
  hasPublishedDishes?: boolean;
};

export function mergeDiscoveryTrust(
  enrichment?: DiscoveryEnrichment,
): DiscoveryTrustContract {
  return buildDiscoveryTrust({
    listingProductReviewCount: enrichment?.productReviewCount ?? 0,
    listingIsActive: enrichment?.listingIsActive ?? true,
    sellerSnapshot: enrichment?.sellerTrustSnapshot,
    trustBadges: enrichment?.trustBadges,
    dealReviewCount: enrichment?.dealReviewCount,
    courierReviewCount: enrichment?.courierReviewCount,
    completedDeals: enrichment?.completedDeals,
    completedDeliveries: enrichment?.completedDeliveries,
    repeatCustomers: enrichment?.repeatCustomers,
  });
}

/** @deprecated Use mergeDiscoveryTrust — Phase 2B. */
export function mergeTrustBlock(
  _base: Partial<DiscoveryTrustContract> = {},
  enrichment?: DiscoveryEnrichment,
): DiscoveryTrustContract {
  return mergeDiscoveryTrust(enrichment);
}

export function mergeSocialBlock(
  base: Partial<DiscoverySocialBlock> = {},
  enrichment?: DiscoveryEnrichment,
): DiscoverySocialBlock {
  return {
    favoriteCount: enrichment?.favoriteCount ?? base.favoriteCount ?? 0,
    fansCount: enrichment?.fansCount ?? base.fansCount ?? 0,
    workspacePropsCount:
      enrichment?.workspacePropsCount ?? base.workspacePropsCount ?? 0,
  };
}

export function buildCapabilityBlock(
  sellerRoles: string[] = [],
  buyerRoles: string[] = [],
  hasPublishedDishes = false,
): DiscoveryCapabilityBlock {
  const roles = sellerRoles.filter(Boolean);
  return {
    sellerRoles: roles,
    hasSellerCapability: roles.length > 0,
    hasCourierCapability: buyerRoles.includes('DELIVERY'),
    hasCreatorCapability: roles.length > 0 || hasPublishedDishes,
  };
}

export function parseTrustBadges(raw: unknown): DiscoveryTrustBadge[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (b): b is DiscoveryTrustBadge =>
      b != null &&
      typeof b === 'object' &&
      typeof (b as DiscoveryTrustBadge).key === 'string' &&
      typeof (b as DiscoveryTrustBadge).name === 'string' &&
      typeof (b as DiscoveryTrustBadge).icon === 'string',
  );
}

export function toIsoString(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value.trim()) return value;
  return null;
}

export function cityFromPlace(place: string | null | undefined): string | null {
  if (!place?.trim()) return null;
  return place.split(',')[0]?.trim() || null;
}
