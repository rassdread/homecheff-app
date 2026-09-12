/**
 * Feed first-page pagination — Phase 13L.
 */

/** Initial homepage feed page size (target 8–12). */
export const FEED_FIRST_PAGE_TAKE = 10;

export const FEED_PAGE_TAKE_MIN = 1;
export const FEED_PAGE_TAKE_MAX = 40;
export const FEED_PAGE_SKIP_MAX = 500;

export type FeedPaginationMeta = {
  take: number;
  skip: number;
  total: number;
  hasMore: boolean;
  /** Stable client cursor: skip + items returned this page (not client list length). */
  nextSkip: number;
};

export function parseFeedPaginationParams(
  takeRaw: string | null,
  skipRaw: string | null,
): { take: number; skip: number; isFirstPage: boolean } {
  const takeParsed = takeRaw != null ? Number(takeRaw) : FEED_FIRST_PAGE_TAKE;
  const skipParsed = skipRaw != null ? Number(skipRaw) : 0;
  const take = Number.isFinite(takeParsed)
    ? Math.min(FEED_PAGE_TAKE_MAX, Math.max(FEED_PAGE_TAKE_MIN, Math.floor(takeParsed)))
    : FEED_FIRST_PAGE_TAKE;
  const skip = Number.isFinite(skipParsed)
    ? Math.min(FEED_PAGE_SKIP_MAX, Math.max(0, Math.floor(skipParsed)))
    : 0;
  return { take, skip, isFirstPage: skip === 0 };
}

export function buildFeedPaginationMeta(
  take: number,
  skip: number,
  total: number,
  options?: {
    /** Rows actually returned in this page (may be < take on the last page). */
    pageCount?: number;
    /**
     * True when at least one DB source returned a full take window — more
     * unique inventory may exist beyond the current in-memory pool.
     */
    sourceHitCap?: boolean;
  },
): FeedPaginationMeta {
  const pageCount =
    options?.pageCount != null
      ? Math.max(0, Math.floor(options.pageCount))
      : take;
  const end = skip + take;
  const pageHasMore = end < total;
  const hasMore = pageHasMore || Boolean(options?.sourceHitCap);
  return {
    take,
    skip,
    total,
    hasMore,
    nextSkip: skip + pageCount,
  };
}

/** Ensure cached / legacy pagination payloads always expose nextSkip. */
export function normalizeFeedPaginationMeta(
  pagination: Partial<FeedPaginationMeta> | null | undefined,
  pageCount = 0,
): FeedPaginationMeta {
  const take =
    typeof pagination?.take === 'number' && Number.isFinite(pagination.take)
      ? pagination.take
      : FEED_FIRST_PAGE_TAKE;
  const skip =
    typeof pagination?.skip === 'number' && Number.isFinite(pagination.skip)
      ? pagination.skip
      : 0;
  const total =
    typeof pagination?.total === 'number' && Number.isFinite(pagination.total)
      ? pagination.total
      : pageCount;
  const hasMore = Boolean(pagination?.hasMore);
  const nextSkip =
    typeof pagination?.nextSkip === 'number' &&
    Number.isFinite(pagination.nextSkip)
      ? pagination.nextSkip
      : skip + pageCount;
  return { take, skip, total, hasMore, nextSkip };
}
