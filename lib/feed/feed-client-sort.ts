/**
 * Client-side feed sort & price-filter helpers (GeoFeed, Dorpsplein).
 * Server geo sort lives in lib/geo/local-discovery.ts.
 */

import { hasValidSalePrice } from '@/lib/feed/feed-taxonomy';
import { isContactOnlyProduct } from '@/lib/product/order-method';

export type FeedClientSortField = 'newest' | 'price' | 'views' | 'distance';

export type FeedClientSortOrder = 'asc' | 'desc';

export type FeedSortableSale = {
  id: string;
  createdAt: string;
  priceCents?: number | null;
  orderMethod?: string | null;
  viewCount?: number;
  distanceKm?: number;
};

/** Maps GeoFeed vertical slug or Prisma category → inspiratie enum. */
export function feedItemCategoryEnum(
  raw?: string | null
): 'CHEFF' | 'GROWN' | 'DESIGNER' | null {
  if (!raw?.trim()) return null;
  const u = raw.trim().toUpperCase();
  if (u === 'CHEFF' || u === 'HOMECHEFF') return 'CHEFF';
  if (u === 'GROWN' || u === 'GARDEN') return 'GROWN';
  if (u === 'DESIGNER' || u === 'DESIGN') return 'DESIGNER';
  return feedVerticalSlugToCategoryEnum(raw);
}

/** Maps GeoFeed vertical slug → Prisma / inspiratie category enum. */
export function feedVerticalSlugToCategoryEnum(
  slug: string
): 'CHEFF' | 'GROWN' | 'DESIGNER' | null {
  const v = slug.trim().toLowerCase();
  if (v === 'cheff' || v === 'chef' || v === 'keuken') return 'CHEFF';
  if (v === 'grown' || v === 'garden' || v === 'tuin') return 'GROWN';
  if (v === 'designer' || v === 'design' || v === 'studio') return 'DESIGNER';
  return null;
}

/** Numeric sort key for price; null = prijs op aanvraag / geen verkoopprijs (sort last). */
export function feedSaleSortPriceCents(item: FeedSortableSale): number | null {
  if (!hasValidSalePrice(item)) return null;
  return item.priceCents ?? null;
}

export function matchesFeedClientPriceRange(
  item: FeedSortableSale,
  minEuroStr: string,
  maxEuroStr: string
): boolean {
  const minRaw = minEuroStr.trim();
  const maxRaw = maxEuroStr.trim();
  const hasMin = minRaw !== '' && Number.isFinite(Number(minRaw));
  const hasMax = maxRaw !== '' && Number.isFinite(Number(maxRaw));

  if (!hasMin && !hasMax) return true;

  const priced = feedSaleSortPriceCents(item);
  if (priced == null) {
    // Contact-only / inspiratie zonder prijs: niet matchen op numerieke min/max.
    return !hasMin;
  }

  if (hasMin && priced < Number(minRaw) * 100) return false;
  if (hasMax && priced > Number(maxRaw) * 100) return false;
  return true;
}

function compareNullableNumbers(
  a: number | null,
  b: number | null,
  sortOrder: FeedClientSortOrder,
  nullsLast: boolean
): number {
  if (a == null && b == null) return 0;
  if (a == null) return nullsLast ? 1 : -1;
  if (b == null) return nullsLast ? -1 : 1;
  if (a !== b) {
    return sortOrder === 'asc' ? (a > b ? 1 : -1) : a < b ? 1 : -1;
  }
  return 0;
}

export function compareFeedSaleItems(
  a: FeedSortableSale,
  b: FeedSortableSale,
  sortBy: FeedClientSortField,
  sortOrder: FeedClientSortOrder
): number {
  let cmp = 0;
  switch (sortBy) {
    case 'price': {
      cmp = compareNullableNumbers(
        feedSaleSortPriceCents(a),
        feedSaleSortPriceCents(b),
        sortOrder,
        true
      );
      break;
    }
    case 'views': {
      const av = a.viewCount ?? 0;
      const bv = b.viewCount ?? 0;
      cmp =
        sortOrder === 'asc'
          ? av > bv
            ? 1
            : av < bv
              ? -1
              : 0
          : av < bv
            ? 1
            : av > bv
              ? -1
              : 0;
      break;
    }
    case 'distance': {
      const ad =
        a.distanceKm != null && Number.isFinite(a.distanceKm) && a.distanceKm > 0
          ? a.distanceKm
          : null;
      const bd =
        b.distanceKm != null && Number.isFinite(b.distanceKm) && b.distanceKm > 0
          ? b.distanceKm
          : null;
      cmp = compareNullableNumbers(ad, bd, sortOrder, true);
      break;
    }
    case 'newest':
    default: {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      cmp = sortOrder === 'asc' ? ta - tb : tb - ta;
      break;
    }
  }

  if (cmp !== 0) return cmp;
  return sortOrder === 'asc'
    ? a.id.localeCompare(b.id)
    : b.id.localeCompare(a.id);
}

/**
 * Sort sale feed items client-side.
 * Items without distance sort last; price-on-request sorts last for price sorts.
 */
export function sortFeedSaleItems<T extends FeedSortableSale>(
  list: T[],
  sortBy: FeedClientSortField,
  sortOrder: FeedClientSortOrder
): T[] {
  return [...list].sort((a, b) =>
    compareFeedSaleItems(a, b, sortBy, sortOrder)
  );
}

/**
 * True when client should defer to server discovery section order (Phase 2E).
 */
export function isDiscoverySmartFeedSort(
  sortBy: FeedClientSortField,
  sortOrder: FeedClientSortOrder,
): boolean {
  return sortBy === 'newest' && sortOrder === 'desc';
}

/** Dorpsplein sort keys include legacy aliases. */
export function normalizeDorpspleinSortField(
  sortBy: string
): FeedClientSortField | 'popular' | 'oldest' | 'price-asc' | 'price-desc' | 'price-low' | 'price-high' {
  const s = sortBy.trim().toLowerCase();
  if (s === 'price-asc' || s === 'price-low') return 'price-asc';
  if (s === 'price-desc' || s === 'price-high') return 'price-desc';
  if (s === 'distance') return 'distance';
  if (s === 'popular') return 'popular';
  if (s === 'oldest') return 'oldest';
  return 'newest';
}

export function sortDorpspleinProducts<T extends FeedSortableSale & { favoriteCount?: number }>(
  list: T[],
  sortBy: string
): T[] {
  const normalized = normalizeDorpspleinSortField(sortBy);
  if (normalized === 'price-asc') {
    return sortFeedSaleItems(list, 'price', 'asc');
  }
  if (normalized === 'price-desc') {
    return sortFeedSaleItems(list, 'price', 'desc');
  }
  if (normalized === 'distance') {
    return sortFeedSaleItems(list, 'distance', 'asc');
  }
  if (normalized === 'oldest') {
    return sortFeedSaleItems(list, 'newest', 'asc');
  }
  if (normalized === 'popular') {
    return [...list].sort((a, b) => {
      const aPop = (a.viewCount || 0) + (a.favoriteCount || 0) * 2;
      const bPop = (b.viewCount || 0) + (b.favoriteCount || 0) * 2;
      if (aPop !== bPop) return bPop - aPop;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  return sortFeedSaleItems(list, 'newest', 'desc');
}

export function isContactOnlyFeedItem(item: FeedSortableSale): boolean {
  return isContactOnlyProduct(item) && !hasValidSalePrice(item);
}
