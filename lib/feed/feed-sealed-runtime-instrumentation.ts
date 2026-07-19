/**
 * Phase 3B.1/3B.2 — Feed sealed-runtime instrumentation.
 *
 * Production-safe O(1) counters at existing GeoFeed lifecycle points.
 * No observers, timers, DOM writes, or request initiation.
 *
 * Enable: NEXT_PUBLIC_FEED_SEALED_BASELINE=1 | development+window | test override.
 */

export type SealedCounters = {
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
  intersectionObserverCreateCount: number;
  resizeObserverCreateCount: number;
  contractEvaluationCount: number;
  sampleSequence: number;
  /** FNV-1a hash of last observed requestKey (never raw query). */
  lastRequestKeyHash: string | null;
  /** Absent paint identity — always null in Feed sealed runtime. */
  lastNativePaintKeyHash: string | null;
  /** Hash of last observed prepared-batch stand-in (item count + edge ids). */
  lastPreparedBatchHash: string | null;
  /** Hash of last pagination cursor stand-in (hasMore + itemCount). */
  lastPaginationCursorHash: string | null;
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
  intersectionObserverCreateCount: 0,
  resizeObserverCreateCount: 0,
  contractEvaluationCount: 0,
  sampleSequence: 0,
  lastRequestKeyHash: null,
  lastNativePaintKeyHash: null,
  lastPreparedBatchHash: null,
  lastPaginationCursorHash: null,
};

let lastRequestKey: string | null = null;
let lastPreparedBatchHashInternal: string | null = null;
let lastPaginationCursorHashInternal: string | null = null;
let lastResultCacheKey: string | null = null;
let enabledOverride: boolean | null = null;

/** Stable non-crypto hash for identity signatures (O(n) string, no secrets logged). */
export function feedSealedStableHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

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
  counters.intersectionObserverCreateCount = 0;
  counters.resizeObserverCreateCount = 0;
  counters.contractEvaluationCount = 0;
  counters.sampleSequence = 0;
  counters.lastRequestKeyHash = null;
  counters.lastNativePaintKeyHash = null;
  counters.lastPreparedBatchHash = null;
  counters.lastPaginationCursorHash = null;
  lastRequestKey = null;
  lastPreparedBatchHashInternal = null;
  lastPaginationCursorHashInternal = null;
  lastResultCacheKey = null;
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

export function feedSealedNoteGeoFeedMount(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.mountCount += 1;
  counters.activeInstanceCount += 1;
  bumpSample();
}

export function feedSealedNoteGeoFeedUnmount(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.unmountCount += 1;
  if (counters.activeInstanceCount > 0) {
    counters.activeInstanceCount -= 1;
  }
  bumpSample();
}

export function feedSealedNoteRequestStart(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.requestStartCount += 1;
  bumpSample();
}

export function feedSealedNoteRequestKey(requestKey: string): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  const hash = feedSealedStableHash(requestKey);
  counters.lastRequestKeyHash = hash;
  if (lastRequestKey !== null && lastRequestKey !== requestKey) {
    counters.requestKeyTransitionCount += 1;
    bumpSample();
  }
  lastRequestKey = requestKey;
}

/**
 * nativePaintKey is denylist-only / absent from Feed runtime.
 * Observing null→null keeps transition count at 0 (stable absence).
 */
export function feedSealedNoteNativePaintKeyAbsent(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.lastNativePaintKeyHash = null;
}

export function feedSealedNoteContractEvaluation(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.contractEvaluationCount += 1;
  bumpSample();
}

/** Call when first-page fetch resets pagination (existing GeoFeed path). */
export function feedSealedNotePaginationReset(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.paginationResetCount += 1;
  bumpSample();
}

export function feedSealedNotePaginationCursor(parts: {
  hasMore: boolean;
  itemCount: number;
}): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  const hash = feedSealedStableHash(
    `${parts.hasMore ? 1 : 0}:${parts.itemCount}`,
  );
  counters.lastPaginationCursorHash = hash;
  if (
    lastPaginationCursorHashInternal !== null &&
    lastPaginationCursorHashInternal !== hash
  ) {
    // Not a "reset by workspace" counter — identity observation only.
  }
  lastPaginationCursorHashInternal = hash;
}

/** Result-cache module first write (null → payload). */
export function feedSealedNoteResultCacheInit(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.resultCacheInitCount += 1;
  bumpSample();
}

/**
 * Filter-transition cache: save under a different requestKey than prior entry.
 * Same memory slot as home-feed-return-cache (Feed-owned).
 */
export function feedSealedNoteFilterCacheTransition(requestKey: string): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  if (lastResultCacheKey !== null && lastResultCacheKey !== requestKey) {
    counters.filterCacheInitCount += 1;
    bumpSample();
  }
  lastResultCacheKey = requestKey;
}

/**
 * Prepared-batch stand-in: ordered edge identity of visible sale tiles.
 * Does not copy item arrays — only ids + length.
 */
export function feedSealedNotePreparedBatchIdentity(parts: {
  itemCount: number;
  firstId: string | null;
  lastId: string | null;
}): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  const hash = feedSealedStableHash(
    `${parts.itemCount}|${parts.firstId ?? ""}|${parts.lastId ?? ""}`,
  );
  counters.lastPreparedBatchHash = hash;
  if (
    lastPreparedBatchHashInternal !== null &&
    lastPreparedBatchHashInternal !== hash
  ) {
    counters.preparedBatchIdentityTransitionCount += 1;
    bumpSample();
  }
  lastPreparedBatchHashInternal = hash;
}

export function feedSealedNoteIntersectionObserverCreate(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.intersectionObserverCreateCount += 1;
  bumpSample();
}

/** Feed does not own platform ResizeObservers — reserved for delta proofs. */
export function feedSealedNoteResizeObserverCreate(): void {
  if (!isFeedSealedInstrumentationEnabled()) return;
  counters.resizeObserverCreateCount += 1;
  bumpSample();
}

export function readFeedSealedInstrumentationCounters(): Readonly<SealedCounters> {
  return { ...counters };
}
