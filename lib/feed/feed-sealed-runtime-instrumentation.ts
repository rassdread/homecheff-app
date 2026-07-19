/**
 * Phase 3B.1 — Feed sealed-runtime instrumentation.
 *
 * Production-safe O(1) counters at existing GeoFeed lifecycle points.
 * No observers, timers, DOM writes, or request initiation.
 *
 * Enable: NODE_ENV=development | NEXT_PUBLIC_FEED_SEALED_BASELINE=1 |
 * explicit test enable. Otherwise increments are no-ops (counts stay 0).
 */

type SealedCounters = {
  mountCount: number;
  unmountCount: number;
  activeInstanceCount: number;
  requestStartCount: number;
  requestKeyTransitionCount: number;
  nativePaintKeyTransitionCount: number;
  paginationResetCount: number;
  resultCacheInitCount: number;
  filterCacheInitCount: number;
  preparedBatchIdentityTransitionCount: number;
  observerCreationCount: number;
  contractEvaluationCount: number;
  sampleSequence: number;
};

const counters: SealedCounters = {
  mountCount: 0,
  unmountCount: 0,
  activeInstanceCount: 0,
  requestStartCount: 0,
  requestKeyTransitionCount: 0,
  nativePaintKeyTransitionCount: 0,
  paginationResetCount: 0,
  resultCacheInitCount: 0,
  filterCacheInitCount: 0,
  preparedBatchIdentityTransitionCount: 0,
  observerCreationCount: 0,
  contractEvaluationCount: 0,
  sampleSequence: 0,
};

let lastRequestKey: string | null = null;
let enabledOverride: boolean | null = null;

export function enableFeedSealedInstrumentationForTests(
  enabled = true,
): void {
  enabledOverride = enabled;
}

export function resetFeedSealedInstrumentationForTests(): void {
  counters.mountCount = 0;
  counters.unmountCount = 0;
  counters.activeInstanceCount = 0;
  counters.requestStartCount = 0;
  counters.requestKeyTransitionCount = 0;
  counters.nativePaintKeyTransitionCount = 0;
  counters.paginationResetCount = 0;
  counters.resultCacheInitCount = 0;
  counters.filterCacheInitCount = 0;
  counters.preparedBatchIdentityTransitionCount = 0;
  counters.observerCreationCount = 0;
  counters.contractEvaluationCount = 0;
  counters.sampleSequence = 0;
  lastRequestKey = null;
}

export function isFeedSealedInstrumentationEnabled(): boolean {
  if (enabledOverride !== null) return enabledOverride;
  if (typeof process === "undefined") return false;
  if (process.env.NEXT_PUBLIC_FEED_SEALED_BASELINE === "1") return true;
  if (process.env.NODE_ENV === "development") {
    return typeof window !== "undefined";
  }
  return false;
}

function bumpSample(): void {
  counters.sampleSequence += 1;
}

/** GeoFeed mount — call once from existing mount effect. */
export function feedSealedNoteGeoFeedMount(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.mountCount += 1;
  counters.activeInstanceCount += 1;
  bumpSample();
}

/** GeoFeed unmount — call from mount-effect cleanup only. */
export function feedSealedNoteGeoFeedUnmount(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.unmountCount += 1;
  if (counters.activeInstanceCount > 0) {
    counters.activeInstanceCount -= 1;
  }
  bumpSample();
}

/** Feed fetch start — call next to existing feedPerfIncrementFeedFetch. */
export function feedSealedNoteRequestStart(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.requestStartCount += 1;
  bumpSample();
}

/**
 * Request-key observation — O(1), does not alter requestKey or fetch timing.
 * Call after requestKey is computed at the existing fetch path.
 */
export function feedSealedNoteRequestKey(requestKey: string): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  if (lastRequestKey !== null && lastRequestKey !== requestKey) {
    counters.requestKeyTransitionCount += 1;
    bumpSample();
  }
  lastRequestKey = requestKey;
}

/** Shadow contract evaluation — only counter shadow evaluation may bump. */
export function feedSealedNoteContractEvaluation(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.contractEvaluationCount += 1;
  bumpSample();
}

/** Read-only counter snapshot (shallow copy). Does not mutate counters. */
export function readFeedSealedInstrumentationCounters(): Readonly<SealedCounters> {
  return { ...counters };
}
