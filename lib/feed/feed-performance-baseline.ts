/**
 * Client-side feed performance baseline (Phase 13K + Phase 2).
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
  | 'feed:blocked-start'
  | 'feed:blocked-end'
  | 'filter:restored'
  | 'location:init-start'
  | 'location:available'
  | 'cache:restore-start'
  | 'cache:restore-end'
  | 'feed:cache-hit'
  | 'feed:cache-stale-refresh'
  | 'feed:cache-miss'
  | 'feed:request-start'
  | 'feed:request-end'
  | 'feed:json-received'
  | 'feed:first-tile-rendered'
  | 'feed:first-image-visible'
  | 'feed:stable'
  | 'feed:second-request'
  | 'feed:stats-preview-request-start'
  | 'feed:stats-preview-seeded'
  | 'geofeed:mounted'
  | 'layout:hydration-complete'
  | 'vitals:fcp'
  | 'vitals:lcp'
  | 'vitals:dom-content-loaded'
  | 'vitals:load'
  | 'pusher:init'
  | 'sw:ready'
  | 'sw:none'
  | 'app:usable';

const PREFIX = 'hc-feed-perf:';
const MEASURE_PAIRS: Array<[string, FeedPerfMilestone, FeedPerfMilestone]> = [
  ['session', 'session:loading', 'session:resolved'],
  ['feed-blocked', 'feed:blocked-start', 'feed:blocked-end'],
  ['feed-fetch', 'feed:request-start', 'feed:json-received'],
  ['first-tile', 'feed:request-start', 'feed:first-tile-rendered'],
  ['cache-restore', 'cache:restore-start', 'cache:restore-end'],
  ['shell-to-usable', 'home:shell-mounted', 'app:usable'],
];

const marks = new Map<string, number>();
const webVitals: Record<string, number> = {};
let geoFeedMountCount = 0;
let feedFetchCount = 0;
let firstTileMarked = false;
let firstImageMarked = false;
let feedBlockedActive = false;
let vitalsObserverInstalled = false;

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

function tryMeasure(name: string, start: FeedPerfMilestone, end: FeedPerfMilestone): void {
  if (!marks.has(start) || !marks.has(end)) return;
  try {
    performance.measure(`${PREFIX}${name}`, `${PREFIX}${start}`, `${PREFIX}${end}`);
  } catch {
    /* ignore */
  }
}

function runMeasurePairs(): void {
  for (const [name, start, end] of MEASURE_PAIRS) {
    tryMeasure(name, start, end);
  }
}

/** Logcat-friendly line for Capacitor WebView debugging. */
export function feedPerfLogcat(milestone: string, extra?: Record<string, number | string>): void {
  if (!isFeedPerfBaselineEnabled()) return;
  const payload = extra ? ` ${JSON.stringify(extra)}` : '';
  console.info(`[HC-PERF] ${milestone} ${feedPerfNow()}ms${payload}`);
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
  runMeasurePairs();
  if (process.env.NODE_ENV === 'development') {
    console.info('[feed-perf]', milestone, `${rel}ms`);
  }
}

export function feedPerfMarkFeedBlocked(blocked: boolean): void {
  if (!isFeedPerfBaselineEnabled()) return;
  if (blocked && !feedBlockedActive) {
    feedBlockedActive = true;
    feedPerfMark('feed:blocked-start');
    feedPerfLogcat('feed:blocked-start');
  } else if (!blocked && feedBlockedActive) {
    feedBlockedActive = false;
    feedPerfMark('feed:blocked-end');
    feedPerfLogcat('feed:blocked-end');
  }
}

export function feedPerfIncrementGeoFeedMount(): number {
  if (!isFeedPerfBaselineEnabled()) return geoFeedMountCount;
  geoFeedMountCount += 1;
  feedPerfMark('geofeed:mounted');
  feedPerfLogcat('geofeed:mounted', { count: geoFeedMountCount });
  return geoFeedMountCount;
}

export function feedPerfIncrementFeedFetch(reason: 'initial' | 'refresh' | 'filter'): number {
  if (!isFeedPerfBaselineEnabled()) return feedFetchCount;
  feedFetchCount += 1;
  if (feedFetchCount === 1) {
    feedPerfMark('feed:request-start');
  } else {
    feedPerfMark('feed:second-request');
  }
  feedPerfLogcat('feed:fetch', { reason, count: feedFetchCount });
  return feedFetchCount;
}

export function feedPerfMarkFeedRequestEnd(): void {
  feedPerfMark('feed:request-end');
}

export function feedPerfMarkFirstTileOnce(): void {
  if (!isFeedPerfBaselineEnabled() || firstTileMarked) return;
  firstTileMarked = true;
  feedPerfMark('feed:first-tile-rendered');
  feedPerfLogcat('feed:first-tile');
}

export function feedPerfMarkFirstImageOnce(): void {
  if (!isFeedPerfBaselineEnabled() || firstImageMarked) return;
  firstImageMarked = true;
  feedPerfMark('feed:first-image-visible');
  feedPerfLogcat('feed:first-image');
}

export function feedPerfMarkAppUsable(): void {
  feedPerfMark('app:usable');
  feedPerfLogcat('app:usable');
}

export function feedPerfMarkPusherInit(): void {
  feedPerfMark('pusher:init');
  feedPerfLogcat('pusher:init');
}

export function installFeedPerfWebVitals(): void {
  if (typeof window === 'undefined' || !isFeedPerfBaselineEnabled() || vitalsObserverInstalled) return;
  vitalsObserverInstalled = true;

  const supported = PerformanceObserver.supportedEntryTypes || [];
  if (supported.includes('largest-contentful-paint')) {
    try {
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (!last) return;
        webVitals.lcp = Math.round(last.startTime);
        feedPerfMark('vitals:lcp');
      });
      lcpObs.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      /* ignore */
    }
  }

  const onReady = () => {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      const paints = performance.getEntriesByType('paint');
      const fcp = paints.find((p) => p.name === 'first-contentful-paint');
      if (fcp) {
        webVitals.fcp = Math.round(fcp.startTime);
        feedPerfMark('vitals:fcp');
      }
      if (nav) {
        webVitals.domContentLoaded = Math.round(nav.domContentLoadedEventEnd);
        webVitals.load = Math.round(nav.loadEventEnd);
        webVitals.ttfb = Math.round(nav.responseStart);
        feedPerfMark('vitals:dom-content-loaded');
        feedPerfMark('vitals:load');
      }
    } catch {
      /* ignore */
    }
  };

  if (document.readyState === 'complete') onReady();
  else window.addEventListener('load', onReady, { once: true });

  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready
      .then(() => {
        feedPerfMark('sw:ready');
        feedPerfLogcat('sw:ready');
      })
      .catch(() => feedPerfMark('sw:none'));
  } else {
    feedPerfMark('sw:none');
  }
}

export function feedPerfReport(): Record<string, number> {
  return Object.fromEntries(marks.entries());
}

export function feedPerfWebVitals(): Record<string, number> {
  return { ...webVitals };
}

export function feedPerfCounters(): {
  geoFeedMounts: number;
  feedFetches: number;
} {
  return { geoFeedMounts: geoFeedMountCount, feedFetches: feedFetchCount };
}

export function feedPerfMeasures(): PerformanceMeasure[] {
  if (typeof performance === 'undefined') return [];
  return performance.getEntriesByType('measure').filter((m) => m.name.startsWith(PREFIX));
}

/** Exposed on window when baseline flag is active. */
export function installFeedPerfBaselineReporter(): void {
  if (typeof window === 'undefined' || !isFeedPerfBaselineEnabled()) return;
  installFeedPerfWebVitals();
  (
    window as Window & { __hcFeedPerfReport?: () => Record<string, unknown> }
  ).__hcFeedPerfReport = () => ({
    milestones: feedPerfReport(),
    webVitals: feedPerfWebVitals(),
    counters: feedPerfCounters(),
    measures: feedPerfMeasures().map((m) => ({
      name: m.name.replace(PREFIX, ''),
      durationMs: Math.round(m.duration),
    })),
  });
}
