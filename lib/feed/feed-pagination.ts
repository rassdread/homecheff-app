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
): FeedPaginationMeta {
  const end = skip + take;
  return {
    take,
    skip,
    total,
    hasMore: end < total,
  };
}
