/**
 * Phase 3A — documented feed candidate window.
 *
 * DB caps > enrichment cap > response cap so ranking, discovery dedup,
 * and pagination semantics stay intact without naïve take=10 at SQL layer.
 */

export const FEED_DB_PRODUCT_CAP = 60;
export const FEED_DB_LISTING_CAP = 35;
export const FEED_DB_DISH_CAP = 30;

/** Max marketplace items enriched (stats, trust, discovery attach). */
export const FEED_ENRICHMENT_POOL_CAP = 50;

/** Max items in one API response before pagination slice. */
export const FEED_RESPONSE_ITEM_CAP = 40;

/** Extra marketplace candidates for discovery ranking beyond visible page. */
export const FEED_DISCOVERY_BUFFER = 30;

const FEED_ENRICHMENT_POOL_MIN = 40;

/**
 * Enrichment pool scales with pagination so later pages retain enough candidates.
 * Capped at FEED_ENRICHMENT_POOL_CAP; never below FEED_ENRICHMENT_POOL_MIN on page 1.
 */
export function computeEnrichmentPoolCap(skip: number, take: number): number {
  const needed = skip + take + FEED_DISCOVERY_BUFFER;
  return Math.min(
    FEED_ENRICHMENT_POOL_CAP,
    Math.max(FEED_ENRICHMENT_POOL_MIN, needed),
  );
}

const SOURCE_PRIORITY: Record<string, number> = {
  PRODUCT: 3,
  LISTING: 2,
  DISH: 1,
};

function sourcePriority(feedSource: string | null | undefined): number {
  const key = String(feedSource ?? '').trim().toUpperCase();
  return SOURCE_PRIORITY[key] ?? 0;
}

export type CrossSourceDedupDrop = { id: string; feedSource: string };

/**
 * Linked Product↔Dish dual-write uses the same UUID. Prefer PRODUCT/LISTING
 * over DISH so one offer is not shown twice in the feed.
 */
export function deduplicateCrossSourceFeedItems<
  T extends { id: string; feedSource?: string | null },
>(items: T[]): { items: T[]; dropped: CrossSourceDedupDrop[] } {
  const winnerById = new Map<string, T>();
  const dropped: CrossSourceDedupDrop[] = [];

  for (const item of items) {
    const prev = winnerById.get(item.id);
    if (!prev) {
      winnerById.set(item.id, item);
      continue;
    }
    const prevSrc = String(prev.feedSource ?? '');
    const itemSrc = String(item.feedSource ?? '');
    if (sourcePriority(itemSrc) > sourcePriority(prevSrc)) {
      dropped.push({ id: item.id, feedSource: prevSrc });
      winnerById.set(item.id, item);
    } else {
      dropped.push({ id: item.id, feedSource: itemSrc });
    }
  }

  const seen = new Set<string>();
  const ordered: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    ordered.push(winnerById.get(item.id)!);
    seen.add(item.id);
  }

  return { items: ordered, dropped };
}

/** Unique seller user IDs from feed items (stable order). */
export function collectUniqueSellerUserIds(
  items: Array<Record<string, unknown>>,
  extractSellerUserId: (item: Record<string, unknown>) => string | null,
  cap?: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const uid = extractSellerUserId(item);
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    out.push(uid);
    if (cap != null && out.length >= cap) break;
  }
  return out;
}
