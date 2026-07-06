/**
 * Discovery Phase 1C — read helpers for UI consumers.
 * Prefer `item.discovery` when present; legacy fallbacks only when discovery is absent.
 */

import {
  profileSlugToDbCategory,
  type OfferingProfileSlug,
} from '@/lib/create/offering-vertical';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { SearchableListingRecord } from '@/lib/search/contracts/search-contract';
import type { DiscoveryReadModel } from './contracts/discovery-read-model';

export type WithOptionalDiscovery = {
  discovery?: DiscoveryReadModel | null;
};

export function marketplaceCategoryToLegacyVertical(
  mc: string | null | undefined,
): 'CHEFF' | 'GROWN' | 'DESIGNER' | null {
  const u = String(mc ?? '').trim().toUpperCase();
  if (u === 'CREATE' || u === 'KEUKEN' || u === 'CHEFF') return 'CHEFF';
  if (u === 'GROW' || u === 'TUIN' || u === 'GROWN' || u === 'GARDEN') return 'GROWN';
  if (u === 'DESIGN' || u === 'STUDIO' || u === 'DESIGNER' || u === 'ARTISTIC_SERVICE') {
    return 'DESIGNER';
  }
  return null;
}

/** Legacy CHEFF | GROWN | DESIGNER vertical for chips/filters. */
export function getDiscoveryLegacyVerticalCategory(
  item: WithOptionalDiscovery & {
    category?: string | null;
    marketplaceCategory?: string | null;
  },
): string | null {
  if (item.discovery?.marketplaceCategory) {
    const mapped = marketplaceCategoryToLegacyVertical(
      String(item.discovery.marketplaceCategory),
    );
    if (mapped) return mapped;
  }
  if (item.discovery && item.discovery.entityType === 'dish') {
    return item.category ?? null;
  }
  if (item.discovery?.marketplaceCategory == null && item.marketplaceCategory) {
    const mapped = marketplaceCategoryToLegacyVertical(item.marketplaceCategory);
    if (mapped) return mapped;
  }
  return item.category ?? null;
}

export function getDiscoveryListingKind(
  item: WithOptionalDiscovery & { listingKind?: ListingKind | null },
): ListingKind | undefined {
  return item.discovery?.listingKind ?? item.listingKind ?? undefined;
}

export function getDiscoveryListingIntent(
  item: WithOptionalDiscovery & { listingIntent?: string | null },
): string | null {
  return item.discovery?.listingIntent ?? item.listingIntent ?? null;
}

export function getDiscoveryFavoriteCount(
  item: WithOptionalDiscovery & {
    favoriteCount?: number | null;
    propsCount?: number | null;
  },
): number {
  if (item.discovery) return item.discovery.social.favoriteCount;
  return item.favoriteCount ?? item.propsCount ?? 0;
}

export function getDiscoveryProductReviewCount(
  item: WithOptionalDiscovery & { reviewCount?: number | null },
): number {
  if (item.discovery) return item.discovery.trust.product.reviewCount;
  return item.reviewCount ?? 0;
}

export function getDiscoverySellerTier(
  item: WithOptionalDiscovery,
): number | undefined {
  return item.discovery?.trust.sellerTier;
}

export function getDiscoveryTrustBadges(
  item: WithOptionalDiscovery & {
    sellerBadges?: { key: string; name: string; icon: string }[];
  },
): DiscoveryReadModel['trust']['trustBadges'] {
  if (item.discovery) return item.discovery.trust.trustBadges;
  return [];
}

export function getDiscoveryMarketplaceCategory(
  item: WithOptionalDiscovery & { marketplaceCategory?: string | null },
): string | null {
  const raw = item.discovery?.marketplaceCategory ?? item.marketplaceCategory ?? null;
  return raw != null ? String(raw) : null;
}

export function getDiscoverySpecializations(
  item: WithOptionalDiscovery & { specializations?: string[] | null },
): string[] {
  return item.discovery?.specializations ?? item.specializations ?? [];
}

export function getDiscoveryDealReviewCount(item: WithOptionalDiscovery): number {
  return item.discovery?.trust.deal.reviewCount ?? 0;
}

export function getDiscoveryCompletedDeals(item: WithOptionalDiscovery): number {
  return item.discovery?.trust.completedDeals ?? 0;
}

export function getDiscoveryCourierReviewCount(item: WithOptionalDiscovery): number {
  return item.discovery?.trust.courier.reviewCount ?? 0;
}

export function getDiscoveryCompletedDeliveries(item: WithOptionalDiscovery): number {
  return item.discovery?.trust.completedDeliveries ?? 0;
}

export function getDiscoveryAvailabilityDate(
  item: WithOptionalDiscovery,
): string | null {
  return item.discovery?.availabilityDate ?? null;
}

export function getDiscoveryBarterOpenness(
  item: WithOptionalDiscovery & { barterOpenness?: string | null },
): string | null {
  const raw = item.discovery?.barterOpenness ?? item.barterOpenness ?? null;
  return raw != null ? String(raw) : null;
}

export function matchesDiscoveryVerticalSlug(
  item: WithOptionalDiscovery & {
    category?: string | null;
    marketplaceCategory?: string | null;
  },
  slug: OfferingProfileSlug,
): boolean {
  const vertical = getDiscoveryLegacyVerticalCategory(item);
  if (!vertical) return false;
  return vertical.toUpperCase() === profileSlugToDbCategory(slug);
}

/** Map item to search contract fields from discovery (no re-derivation). */
export function toSearchableListingRecord(
  item: WithOptionalDiscovery & SearchableListingRecord,
): SearchableListingRecord {
  if (!item.discovery) return item;
  return {
    ...item,
    listingKind: item.discovery.listingKind,
    listingIntent: item.discovery.listingIntent,
    marketplaceCategory: getDiscoveryMarketplaceCategory(item),
    specializations: getDiscoverySpecializations(item),
    category: getDiscoveryLegacyVerticalCategory(item),
  };
}
