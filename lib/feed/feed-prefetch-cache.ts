/**
 * Bounded predictive prefetch for the HomeCheff feed.
 *
 * Prepares the next API page(s) before the sentinel is reached.
 * Does not change composition / geo / recirculation product logic —
 * only timing of when pages are fetched into memory.
 */

export const FEED_PREFETCH_MAX_BATCHES = 2;

/** Default early-trigger distance in viewport heights (≈ 2–3). */
export const FEED_PREFETCH_VIEWPORTS = 2.5;

export type FeedPrefetchBatch<TItem> = {
  requestKey: string;
  skip: number;
  items: TItem[];
  apiHasMore: boolean;
  preparedAt: number;
  source: 'network' | 'recirculation';
};

export type FeedPrefetchDiagCounters = {
  prefetchStarted: number;
  prefetchCompleted: number;
  prefetchUsed: number;
  prefetchDiscarded: number;
  preparedBatchCount: number;
  cacheHit: number;
  cacheMiss: number;
  idlePrefetch: number;
  recirculationPrepared: number;
  spinnerVisibleMsTotal: number;
  spinnerVisibleCount: number;
  batchAppendLatencyMsTotal: number;
  batchAppendCount: number;
};

export function createFeedPrefetchDiag(): FeedPrefetchDiagCounters {
  return {
    prefetchStarted: 0,
    prefetchCompleted: 0,
    prefetchUsed: 0,
    prefetchDiscarded: 0,
    preparedBatchCount: 0,
    cacheHit: 0,
    cacheMiss: 0,
    idlePrefetch: 0,
    recirculationPrepared: 0,
    spinnerVisibleMsTotal: 0,
    spinnerVisibleCount: 0,
    batchAppendLatencyMsTotal: 0,
    batchAppendCount: 0,
  };
}

/**
 * Adaptive early rootMargin (px) from viewport + connection + scroll velocity.
 * Returns a CSS rootMargin top/bottom value string for IntersectionObserver.
 */
export function computePrefetchRootMarginPx(input?: {
  viewportHeight?: number;
  scrollVelocityPxPerMs?: number;
  downlinkMbps?: number | null;
  saveData?: boolean;
}): number {
  const vh =
    typeof input?.viewportHeight === 'number' && input.viewportHeight > 0
      ? input.viewportHeight
      : typeof window !== 'undefined'
        ? window.innerHeight || 800
        : 800;

  let viewports = FEED_PREFETCH_VIEWPORTS;

  const vel = input?.scrollVelocityPxPerMs ?? 0;
  // Fast fling → prepare earlier
  if (vel > 1.5) viewports = 3.2;
  else if (vel > 0.6) viewports = 2.8;
  else if (vel < 0.15) viewports = 2.0;

  const downlink = input?.downlinkMbps;
  if (input?.saveData) {
    viewports = Math.min(viewports, 1.75);
  } else if (typeof downlink === 'number' && Number.isFinite(downlink)) {
    if (downlink < 1.5) viewports = Math.max(viewports, 3.0); // slow net → earlier
    else if (downlink > 10) viewports = Math.min(viewports, 2.25);
  }

  // Device memory hint (optional)
  if (typeof navigator !== 'undefined') {
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof mem === 'number' && mem > 0 && mem <= 2) {
      viewports = Math.min(viewports, 2.0);
    }
  }

  const px = Math.round(vh * viewports);
  return Math.min(3200, Math.max(640, px));
}

export function buildPrefetchObserverRootMargin(px: number): string {
  return `${px}px 0px`;
}

export class FeedPrefetchCache<TItem> {
  private readonly maxBatches: number;
  private batches: FeedPrefetchBatch<TItem>[] = [];
  private inFlight = new Set<string>();
  private activeRequestKey = '';
  readonly diag: FeedPrefetchDiagCounters;

  constructor(maxBatches = FEED_PREFETCH_MAX_BATCHES) {
    this.maxBatches = Math.max(1, maxBatches);
    this.diag = createFeedPrefetchDiag();
  }

  setRequestKey(requestKey: string): void {
    if (requestKey === this.activeRequestKey) return;
    this.activeRequestKey = requestKey;
    this.clear('requestKey-change');
  }

  clear(reason = 'manual'): void {
    if (this.batches.length > 0) {
      this.diag.prefetchDiscarded += this.batches.length;
    }
    this.batches = [];
    this.inFlight.clear();
    this.diag.preparedBatchCount = 0;
    void reason;
  }

  batchKey(requestKey: string, skip: number): string {
    return `${requestKey}::skip=${skip}`;
  }

  hasInFlight(requestKey: string, skip: number): boolean {
    return this.inFlight.has(this.batchKey(requestKey, skip));
  }

  markInFlight(requestKey: string, skip: number): void {
    this.inFlight.add(this.batchKey(requestKey, skip));
    this.diag.prefetchStarted += 1;
  }

  clearInFlight(requestKey: string, skip: number): void {
    this.inFlight.delete(this.batchKey(requestKey, skip));
  }

  preparedCount(): number {
    return this.batches.length;
  }

  peek(requestKey: string, skip: number): FeedPrefetchBatch<TItem> | null {
    return (
      this.batches.find((b) => b.requestKey === requestKey && b.skip === skip) ??
      null
    );
  }

  /** Store a prepared batch; drop oldest if over cap. */
  put(batch: FeedPrefetchBatch<TItem>): void {
    if (batch.requestKey !== this.activeRequestKey && this.activeRequestKey) {
      this.diag.prefetchDiscarded += 1;
      return;
    }
    this.clearInFlight(batch.requestKey, batch.skip);
    // Replace same skip if present
    this.batches = this.batches.filter(
      (b) => !(b.requestKey === batch.requestKey && b.skip === batch.skip),
    );
    this.batches.push(batch);
    this.batches.sort((a, b) => a.skip - b.skip);
    while (this.batches.length > this.maxBatches) {
      this.batches.shift();
      this.diag.prefetchDiscarded += 1;
    }
    this.diag.prefetchCompleted += 1;
    this.diag.preparedBatchCount = this.batches.length;
  }

  /** Consume the next batch for this skip (FIFO for that cursor). */
  take(requestKey: string, skip: number): FeedPrefetchBatch<TItem> | null {
    const idx = this.batches.findIndex(
      (b) => b.requestKey === requestKey && b.skip === skip,
    );
    if (idx < 0) {
      this.diag.cacheMiss += 1;
      return null;
    }
    const [batch] = this.batches.splice(idx, 1);
    this.diag.cacheHit += 1;
    this.diag.prefetchUsed += 1;
    this.diag.preparedBatchCount = this.batches.length;
    return batch ?? null;
  }

  /** Whether we still have room to prefetch another page (incl. in-flight). */
  canPrefetchMore(): boolean {
    return this.batches.length + this.inFlight.size < this.maxBatches;
  }

  snapshotDiag(): FeedPrefetchDiagCounters & {
    preparedBatchCount: number;
    inFlightCount: number;
  } {
    return {
      ...this.diag,
      preparedBatchCount: this.batches.length,
      inFlightCount: this.inFlight.size,
    };
  }
}

export function readNetworkHints(): {
  downlinkMbps: number | null;
  saveData: boolean;
} {
  if (typeof navigator === 'undefined') {
    return { downlinkMbps: null, saveData: false };
  }
  const conn = (
    navigator as Navigator & {
      connection?: { downlink?: number; saveData?: boolean };
    }
  ).connection;
  return {
    downlinkMbps:
      typeof conn?.downlink === 'number' && Number.isFinite(conn.downlink)
        ? conn.downlink
        : null,
    saveData: Boolean(conn?.saveData),
  };
}

export function scheduleIdleWork(
  fn: () => void,
  timeoutMs = 1200,
): () => void {
  let idleId: number | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;
  const run = () => {
    if (!cancelled) fn();
  };
  if (typeof requestIdleCallback !== 'undefined') {
    idleId = requestIdleCallback(run, { timeout: timeoutMs }) as unknown as number;
  } else {
    timeoutId = setTimeout(run, Math.min(400, timeoutMs));
  }
  return () => {
    cancelled = true;
    if (idleId != null && typeof cancelIdleCallback !== 'undefined') {
      cancelIdleCallback(idleId);
    }
    if (timeoutId != null) clearTimeout(timeoutId);
  };
}
