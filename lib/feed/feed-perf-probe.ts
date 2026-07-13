/**
 * Phase 3E — Production-safe feed performance probe gating.
 *
 * Exposes timing/debug only when BOTH:
 *   - server: FEED_PERF_TIMING=1
 *   - request: ?perfProbe=1
 *
 * In development, FEED_PERF_TIMING=1 or NODE_ENV=development retains local ergonomics.
 */

export const FEED_PERF_PROBE_PARAM = 'perfProbe';

export function isFeedPerfProbeQuery(
  searchParams: URLSearchParams,
): boolean {
  return searchParams.get(FEED_PERF_PROBE_PARAM) === '1';
}

/** Whether to collect server timing / Prisma perf context for this request. */
export function shouldRunFeedApiTiming(
  searchParams: URLSearchParams,
): boolean {
  if (process.env.NODE_ENV === 'development') {
    return (
      process.env.FEED_PERF_TIMING === '1' || process.env.NODE_ENV === 'development'
    );
  }
  return (
    process.env.FEED_PERF_TIMING === '1' && isFeedPerfProbeQuery(searchParams)
  );
}

/** Whether debug block (incl. imageTrace) may appear in JSON. */
export function shouldExposeFeedDebug(
  searchParams: URLSearchParams,
): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  return (
    process.env.FEED_PERF_TIMING === '1' && isFeedPerfProbeQuery(searchParams)
  );
}

/** Whether debug.perf + Server-Timing headers are attached. */
export function shouldExposeFeedPerfPayload(
  searchParams: URLSearchParams,
): boolean {
  if (process.env.NODE_ENV === 'development') {
    return process.env.FEED_PERF_TIMING === '1';
  }
  return (
    process.env.FEED_PERF_TIMING === '1' && isFeedPerfProbeQuery(searchParams)
  );
}

export type FeedPerfProbeSummary = {
  totalMs: number;
  dbProductMs: number;
  dbListingMs: number;
  dbDishMs: number;
  dbLinkedMediaMs: number;
  productMetadataMs: number;
  dishMetadataMs: number;
  transformMs: number;
  statsMs: number;
  trustMs: number;
  discoveryMs: number;
  mappingMs: number;
  serializeMs: number;
  prismaQueryCount: number;
  prismaTotalMs: number;
  slowestQueryLabel: string | null;
  slowestQueryMs: number | null;
  responseBytes: number;
  cacheTier: string;
  trustCacheHits: number | null;
  trustCacheMisses: number | null;
};
