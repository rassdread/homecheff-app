/**
 * Bounded first-batch cache for recent filter requestKeys.
 * Complements the single-slot home return cache with multi-key revisit.
 */

export const FEED_FILTER_RESULT_CACHE_MAX = 4;
export const FEED_FILTER_RESULT_CACHE_TTL_MS = 3 * 60 * 1000;

export type FeedFilterResultCacheEntry<TItem = unknown> = {
  requestKey: string;
  items: TItem[];
  inspiratiePool: unknown[];
  discoveryFeed: unknown | null;
  apiViewerCoords: { lat: number; lng: number } | null;
  feedHasMore: boolean;
  savedAt: number;
};

export class FeedFilterResultCache<TItem = unknown> {
  private readonly maxEntries: number;
  private readonly ttlMs: number;
  private entries: FeedFilterResultCacheEntry<TItem>[] = [];

  constructor(
    maxEntries = FEED_FILTER_RESULT_CACHE_MAX,
    ttlMs = FEED_FILTER_RESULT_CACHE_TTL_MS,
  ) {
    this.maxEntries = Math.max(1, maxEntries);
    this.ttlMs = Math.max(1_000, ttlMs);
  }

  clear(): void {
    this.entries = [];
  }

  /** Drop entries that must not survive geography / auth changes. */
  invalidateAll(): void {
    this.clear();
  }

  put(
    entry: Omit<FeedFilterResultCacheEntry<TItem>, 'savedAt'> & {
      savedAt?: number;
    },
  ): void {
    if (!entry.requestKey || entry.items.length === 0) return;
    // Never cache Nearby without location identity.
    if (
      /(?:^|&)scope=nearby(?:&|$)/.test(entry.requestKey) &&
      !/(?:^|&)lat=/.test(entry.requestKey) &&
      !/(?:^|&)place=/.test(entry.requestKey)
    ) {
      return;
    }

    this.entries = this.entries.filter((e) => e.requestKey !== entry.requestKey);
    this.entries.unshift({
      ...entry,
      savedAt: entry.savedAt ?? Date.now(),
    });
    while (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }
  }

  get(requestKey: string): FeedFilterResultCacheEntry<TItem> | null {
    this.pruneExpired();
    const hit = this.entries.find((e) => e.requestKey === requestKey);
    if (!hit) return null;
    // LRU bump
    this.entries = [
      hit,
      ...this.entries.filter((e) => e.requestKey !== requestKey),
    ];
    return hit;
  }

  size(): number {
    this.pruneExpired();
    return this.entries.length;
  }

  private pruneExpired(): void {
    const now = Date.now();
    this.entries = this.entries.filter((e) => now - e.savedAt <= this.ttlMs);
  }
}
