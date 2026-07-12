/**
 * Client-side deferred stats preview fetch (Phase 3B).
 */
import {
  feedPerfLogcat,
  feedPerfMark,
  isFeedPerfBaselineEnabled,
} from '@/lib/feed/feed-performance-baseline';
import {
  coerceUserStatsPayload,
  seedCachedUserStats,
} from '@/lib/userStatsClientCache';
import { FEED_STATS_PREVIEW_MAX_IDS } from '@/lib/feed/feed-stats-preview';

let statsPreviewInFlight: Promise<void> | null = null;
let lastStatsPreviewKey = '';
const completedStatsPreviewKeys = new Set<string>();

export function collectSellerIdsForStatsPreview(
  items: Array<{ sellerUserId?: string | null }>,
  cap = FEED_STATS_PREVIEW_MAX_IDS,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const uid = item.sellerUserId?.trim();
    if (!uid || seen.has(uid)) continue;
    seen.add(uid);
    out.push(uid);
    if (out.length >= cap) break;
  }
  return out;
}

/**
 * After first feed render — does not block tile paint.
 */
export function scheduleDeferredFeedStatsPreview(
  items: Array<{ sellerUserId?: string | null }>,
  signal?: AbortSignal,
): void {
  const sellerIds = collectSellerIdsForStatsPreview(items);
  if (sellerIds.length === 0) return;
  if (signal?.aborted) return;

  const requestKey = sellerIds.join(',');
  if (completedStatsPreviewKeys.has(requestKey)) return;
  if (requestKey === lastStatsPreviewKey && statsPreviewInFlight) {
    return;
  }
  lastStatsPreviewKey = requestKey;

  const run = () => {
    if (signal?.aborted) return;
    feedPerfMark('feed:stats-preview-request-start');
    feedPerfLogcat('feed:stats-preview-request-start', { count: sellerIds.length });

    statsPreviewInFlight = fetch('/api/feed/stats-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerIds }),
      cache: 'no-store',
      signal,
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as {
          statsPreview?: Record<string, unknown>;
          timingMs?: number;
        };
        const preview = data.statsPreview;
        if (!preview || typeof preview !== 'object') return;
        let seeded = 0;
        for (const [uid, row] of Object.entries(preview)) {
          const payload = coerceUserStatsPayload(row);
          if (payload) {
            seedCachedUserStats(uid, payload);
            seeded += 1;
          }
        }
        completedStatsPreviewKeys.add(requestKey);
        feedPerfMark('feed:stats-preview-seeded');
        feedPerfLogcat('feed:stats-preview-seeded', {
          seeded,
          serverMs: data.timingMs ?? 0,
        });
        if (isFeedPerfBaselineEnabled()) {
          console.info('[HC-PERF] feed:stats-preview-seeded', {
            seeded,
            serverMs: data.timingMs,
          });
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        /* non-blocking */
      })
      .finally(() => {
        statsPreviewInFlight = null;
      });
  };

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => run(), { timeout: 2500 });
  } else {
    setTimeout(run, 0);
  }
}

/** Test helper */
export function resetDeferredStatsPreviewState(): void {
  statsPreviewInFlight = null;
  lastStatsPreviewKey = '';
  completedStatsPreviewKeys.clear();
}
