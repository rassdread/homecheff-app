/**
 * Discovery Phase 1C — read helpers for UI consumers.
 * Prefer `item.discovery` when present; legacy fallbacks only when discovery is absent.
 */

import {
  profileSlugToDbCategory,
  type OfferingProfileSlug,
} from '@/lib/create/offering-vertical';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import {
  listingSemanticFamily,
  offerIsService,
} from '@/lib/marketplace/commercial-capability';
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
  if (u === 'DESIGN' || u === 'STUDIO' || u === 'DESIGNER') {
    return 'DESIGNER';
  }
  if (offerIsService({ marketplaceCategory: u })) return null;
  return null;
}

/** Legacy CHEFF | GROWN | DESIGNER vertical for chips/filters. */
export function getDiscoveryLegacyVerticalCategory(item: object): string | null {
  const row = item as WithOptionalDiscovery & {
    category?: string | null;
    marketplaceCategory?: string | null;
    specializations?: string[] | null;
  };
  const structured =
    row.discovery?.marketplaceCategory ?? row.marketplaceCategory ?? null;
  const specs = row.specializations ?? row.discovery?.specializations ?? null;
  const subcategory =
    (row as { subcategory?: string | null }).subcategory ??
    (row.discovery as { subcategory?: string | null } | undefined)?.subcategory ??
    null;
  const family = listingSemanticFamily({
    marketplaceCategory: structured,
    productCategory: row.category,
    specializations: specs,
    subcategory,
    priceModel: (row as { priceModel?: string | null }).priceModel,
    fulfillmentOptions: (row as { fulfillmentOptions?: {
      digital?: boolean | null;
      pickup?: boolean | null;
      delivery?: boolean | null;
      shipping?: boolean | null;
    } | null }).fulfillmentOptions,
  });
  if (family === 'service') return null;
  if (family === 'food') return 'CHEFF';
  if (family === 'garden') return 'GROWN';
  if (family === 'creation') return 'DESIGNER';
  if (offerIsService({ marketplaceCategory: structured, specializations: specs, subcategory })) {
    return null;
  }
  if (row.discovery?.marketplaceCategory) {
    const mapped = marketplaceCategoryToLegacyVertical(
      String(row.discovery.marketplaceCategory),
    );
    if (mapped) return mapped;
  }
  if (row.discovery && row.discovery.entityType === 'dish') {
    return row.category ?? null;
  }
  if (row.discovery?.marketplaceCategory == null && row.marketplaceCategory) {
    const mapped = marketplaceCategoryToLegacyVertical(row.marketplaceCategory);
    if (mapped) return mapped;
  }
  return row.category ?? null;
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
