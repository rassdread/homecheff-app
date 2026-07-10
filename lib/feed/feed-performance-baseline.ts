/**
 * Client-side feed performance baseline (Phase 13K).
 * performance.mark / measure — no behavior change.
 *
 * Enable: NODE_ENV=development OR NEXT_PUBLIC_FEED_PERF_BASELINE=1
 */

export type FeedPerfMilestone =
  | 'nav:start'
  | 'home:shell-mounted'
  | 'home:viewport-resolved'
  | 'session:loading'
  | 'session:resolved'
  | 'bootstrap:loading'
  | 'bootstrap:resolved'
  | 'filter:restored'
  | 'location:available'
  | 'feed:cache-hit'
  | 'feed:cache-stale-refresh'
  | 'feed:cache-miss'
  | 'feed:request-start'
  | 'feed:json-received'
  | 'feed:first-tile-rendered'
  | 'feed:first-image-visible'
  | 'feed:stable'
  | 'feed:second-request'
  | 'geofeed:mounted'
  | 'layout:hydration-complete';

const PREFIX = 'hc-feed-perf:';
const marks = new Map<string, number>();
let geoFeedMountCount = 0;
let feedFetchCount = 0;
let firstTileMarked = false;
let firstImageMarked = false;

export function isFeedPerfBaselineEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_FEED_PERF_BASELINE === '1'
  );
}

function relMsFromNavigationStart(): number {
  if (typeof performance === 'undefined') return 0;
  const nav = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (nav) return Math.round(performance.now() - nav.startTime);
  return Math.round(performance.now());
}

/** Milliseconds since navigation start (or performance.now if nav unavailable). */
export function feedPerfNow(): number {
  return relMsFromNavigationStart();
}

export function feedPerfMark(milestone: FeedPerfMilestone | string): void {
  if (!isFeedPerfBaselineEnabled()) return;
  const rel = relMsFromNavigationStart();
  marks.set(milestone, rel);
  try {
    performance.mark(`${PREFIX}${milestone}`);
  } catch {
    /* ignore duplicate marks */
  }
  if (process.env.NODE_ENV === 'development') {
    console.info('[feed-perf]', milestone, `${rel}ms`);
  }
}

export function feedPerfIncrementGeoFeedMount(): number {
  if (!isFeedPerfBaselineEnabled()) return geoFeedMountCount;
  geoFeedMountCount += 1;
  feedPerfMark('geofeed:mounted');
  return geoFeedMountCount;
}

export function feedPerfIncrementFeedFetch(reason: 'initial' | 'refresh' | 'filter'): number {
  if (!isFeedPerfBaselineEnabled()) return feedFetchCount;
  feedFetchCount += 1;
  if (feedFetchCount === 1) {
    feedPerfMark('feed:request-start');
  } else {
    feedPerfMark('feed:second-request');
    if (process.env.NODE_ENV === 'development') {
      console.info('[feed-perf] duplicate fetch', { reason, count: feedFetchCount });
    }
  }
  return feedFetchCount;
}

export function feedPerfMarkFirstTileOnce(): void {
  if (!isFeedPerfBaselineEnabled() || firstTileMarked) return;
  firstTileMarked = true;
  feedPerfMark('feed:first-tile-rendered');
}

export function feedPerfMarkFirstImageOnce(): void {
  if (!isFeedPerfBaselineEnabled() || firstImageMarked) return;
  firstImageMarked = true;
  feedPerfMark('feed:first-image-visible');
}

export function feedPerfReport(): Record<string, number> {
  return Object.fromEntries(marks.entries());
}

export function feedPerfCounters(): {
  geoFeedMounts: number;
  feedFetches: number;
} {
  return { geoFeedMounts: geoFeedMountCount, feedFetches: feedFetchCount };
}

/** Exposed on window in dev for manual baseline capture from DevTools. */
export function installFeedPerfBaselineReporter(): void {
  if (typeof window === 'undefined' || !isFeedPerfBaselineEnabled()) return;
  (
    window as Window & { __hcFeedPerfReport?: () => Record<string, unknown> }
  ).__hcFeedPerfReport = () => ({
    milestones: feedPerfReport(),
    counters: feedPerfCounters(),
  });
}
