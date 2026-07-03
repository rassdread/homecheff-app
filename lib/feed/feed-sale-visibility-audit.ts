/**
 * GeoFeed sale visibility pipeline audit — dev / NEXT_PUBLIC_ENABLE_DEBUG_UI.
 */

import type { FeedScope } from '@/lib/feed/feed-scope';
import {
  countMarketplaceSaleItems,
  isMarketplaceSaleItem,
  resolveMarketplacePriceCents,
} from '@/lib/feed/marketplace-sale';

export const FEED_SALE_AUDIT_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_DEBUG_UI === 'true' ||
  process.env.NODE_ENV === 'development';

export type FeedSaleVisibilityAuditInput = {
  apiItems: ReadonlyArray<Record<string, unknown>>;
  normalizedItems: ReadonlyArray<Record<string, unknown>>;
  visibleItems: ReadonlyArray<Record<string, unknown>>;
  saleCandidates: ReadonlyArray<Record<string, unknown>>;
  saleAfterSearch: number;
  saleAfterSearchAndPrice: number;
  saleAfterScopeFilter: number;
  finalVisibleSaleCards: number;
  feedChip: string;
  appliedScope: FeedScope;
  appliedRadius: number;
  appliedPlace: string;
  appliedCategory: string;
  appliedSearchQuery: string;
  appliedPriceRange: { min: string; max: string };
  sortBy: string;
  sortOrder: string;
  locationFilterActive: boolean;
  apiDebug?: Record<string, unknown> | null;
};

export type FeedSaleVisibilityAudit = {
  label: '[GeoFeed sale visibility audit]';
  apiItems: number;
  normalizedItems: number;
  visibleItems: number;
  saleBeforeChip: number;
  saleAfterSearch: number;
  saleAfterPrice: number;
  saleAfterScopeFilter: number;
  finalVisibleSaleCards: number;
  feedChip: string;
  appliedScope: FeedScope;
  appliedRadius: number;
  appliedPlace: string | null;
  appliedCategory: string;
  appliedSearchQuery: string | null;
  appliedPriceRange: { min: string; max: string };
  sortBy: string;
  sortOrder: string;
  locationFilterActive: boolean;
  server: Record<string, unknown> | null;
  sample: Array<Record<string, unknown>>;
};

function auditSample(
  items: ReadonlyArray<Record<string, unknown>>,
  limit = 8
): Array<Record<string, unknown>> {
  return items.slice(0, limit).map((raw) => ({
    id: raw.id,
    title:
      typeof raw.title === 'string' ? raw.title.slice(0, 48) : raw.title ?? null,
    feedSource: raw.feedSource ?? null,
    taxonomyKind:
      (raw.taxonomy as { kind?: string } | undefined)?.kind ?? null,
    priceCents: resolveMarketplacePriceCents(raw),
    distanceKm: raw.distanceKm ?? null,
    isSale: isMarketplaceSaleItem(raw),
  }));
}

export function buildFeedSaleVisibilityAudit(
  input: FeedSaleVisibilityAuditInput
): FeedSaleVisibilityAudit {
  return {
    label: '[GeoFeed sale visibility audit]',
    apiItems: input.apiItems.length,
    normalizedItems: input.normalizedItems.length,
    visibleItems: input.visibleItems.length,
    saleBeforeChip: input.saleCandidates.length,
    saleAfterSearch: input.saleAfterSearch,
    saleAfterPrice: input.saleAfterSearchAndPrice,
    saleAfterScopeFilter: input.saleAfterScopeFilter,
    finalVisibleSaleCards: input.finalVisibleSaleCards,
    feedChip: input.feedChip,
    appliedScope: input.appliedScope,
    appliedRadius: input.appliedRadius,
    appliedPlace: input.appliedPlace.trim() || null,
    appliedCategory: input.appliedCategory,
    appliedSearchQuery: input.appliedSearchQuery.trim() || null,
    appliedPriceRange: input.appliedPriceRange,
    sortBy: input.sortBy,
    sortOrder: input.sortOrder,
    locationFilterActive: input.locationFilterActive,
    server: input.apiDebug ?? null,
    sample: auditSample(input.visibleItems),
  };
}

export function logFeedSaleVisibilityAudit(
  input: FeedSaleVisibilityAuditInput
): FeedSaleVisibilityAudit | null {
  if (!FEED_SALE_AUDIT_ENABLED) return null;
  const audit = buildFeedSaleVisibilityAudit(input);
  console.log(audit.label);
  console.table({
    apiItems: audit.apiItems,
    normalizedItems: audit.normalizedItems,
    visibleItems: audit.visibleItems,
    saleBeforeChip: audit.saleBeforeChip,
    saleAfterSearch: audit.saleAfterSearch,
    saleAfterPrice: audit.saleAfterPrice,
    saleAfterScopeFilter: audit.saleAfterScopeFilter,
    finalVisibleSaleCards: audit.finalVisibleSaleCards,
  });
  console.log('[GeoFeed sale visibility audit] state', {
    feedChip: audit.feedChip,
    appliedScope: audit.appliedScope,
    appliedRadius: audit.appliedRadius,
    appliedPlace: audit.appliedPlace,
    appliedCategory: audit.appliedCategory,
    appliedSearchQuery: audit.appliedSearchQuery,
    appliedPriceRange: audit.appliedPriceRange,
    sortBy: audit.sortBy,
    sortOrder: audit.sortOrder,
    locationFilterActive: audit.locationFilterActive,
    server: audit.server,
  });
  console.table(audit.sample);
  return audit;
}

export function countSaleAfterSearch(
  saleCandidates: ReadonlyArray<{
    title: string | null;
    description: string | null;
  }>,
  searchQuery: string,
  matchesSearch: (
    title: string | null,
    description: string | null,
    q: string
  ) => boolean
): number {
  const qn = searchQuery.trim();
  if (!qn) return saleCandidates.length;
  return saleCandidates.filter((item) =>
    matchesSearch(item.title, item.description, qn)
  ).length;
}

export { countMarketplaceSaleItems, isMarketplaceSaleItem };
