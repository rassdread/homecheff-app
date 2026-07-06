import type {
  DiscoveryCapabilityBlock,
  DiscoverySocialBlock,
  DiscoveryTrustBadge,
  DiscoveryTrustBlock,
} from '../contracts/discovery-read-model';
import {
  EMPTY_DISCOVERY_CAPABILITY,
  EMPTY_DISCOVERY_SOCIAL,
  EMPTY_DISCOVERY_TRUST,
} from '../contracts/discovery-read-model';

/** Optional stats merged into read model — listing-level or seller-level. */
export type DiscoveryEnrichment = {
  productReviewCount?: number;
  dealReviewCount?: number;
  courierReviewCount?: number;
  completedDeals?: number;
  completedDeliveries?: number;
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

export function mergeTrustBlock(
  base: Partial<DiscoveryTrustBlock> = {},
  enrichment?: DiscoveryEnrichment,
): DiscoveryTrustBlock {
  return {
    productReviewCount:
      enrichment?.productReviewCount ?? base.productReviewCount ?? 0,
    dealReviewCount: enrichment?.dealReviewCount ?? base.dealReviewCount ?? 0,
    courierReviewCount:
      enrichment?.courierReviewCount ?? base.courierReviewCount ?? 0,
    completedDeals: enrichment?.completedDeals ?? base.completedDeals ?? 0,
    completedDeliveries:
      enrichment?.completedDeliveries ?? base.completedDeliveries ?? 0,
    trustBadges:
      enrichment?.trustBadges ?? base.trustBadges ?? EMPTY_DISCOVERY_TRUST.trustBadges,
  };
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
