import type { InspirationItem } from '@/components/inspiratie/InspiratieContent';
import type { DiscoveryFeedPayload } from '@/lib/feed/discovery-feed-contract';
import {
  FEED_RECIRC_MIN_SEED,
  type RecircSeedItem,
} from '@/lib/feed/feed-composition-policy';
import {
  composedFeedCanContinue,
  createFeedCompositionState,
  markMarketplacePageResult,
  recordDisplayedSeeds,
  type FeedCompositionState,
} from '@/lib/feed/feed-composition-state';
import {
  feedSealedNoteFilterCacheTransition,
  feedSealedNoteResultCacheInit,
} from '@/lib/feed/feed-sealed-runtime-instrumentation';

/** In-tab memory cache — survives GeoFeed remount on client navigations within the same tab. */
const MAX_AGE_MS = 8 * 60 * 1000;

/**
 * Freshness window for instant returns (UX-FIN-4.3/4.4). Within this window a
 * cache hit is served instantly with no network call. Between this and
 * MAX_AGE_MS the cache is still shown instantly but a background refresh
 * (stale-while-revalidate) is triggered so content quietly updates without a
 * loading flash.
 *
 * Exception: v2 continuation snapshots (marketplace exhausted / recirculation)
 * skip background refresh so SPA back does not replace a deep feed with page 1.
 */
export const HOME_FEED_STALE_MS = 60 * 1000;

/**
 * v1 — items + feedHasMore only (legacy).
 * v2 — atomic continuation snapshot (composition + recirculated rows + scroll).
 */
export const HOME_FEED_RETURN_CACHE_VERSION = 2 as const;

export type HomeFeedViewerCoords = { lat: number; lng: number };

export type HomeFeedReturnScrollSnapshot = {
  root: 'desktop' | 'viewport';
  top: number;
};

/**
 * Client-safe recirculation paint rows. Same-tab memory only (structured
 * object graph; not JSON-serialized across processes).
 */
export type HomeFeedReturnRecirculatedRow = unknown;

export type HomeFeedReturnCachePayload = {
  /** Missing/undefined ⇒ legacy v1 shape. */
  version?: typeof HOME_FEED_RETURN_CACHE_VERSION | 1;
  requestKey: string;
  items: unknown[];
  inspiratiePool: InspirationItem[];
  apiViewerCoords: HomeFeedViewerCoords | null;
  nativeFeedRenderMore: boolean;
  discoveryFeed: DiscoveryFeedPayload | null;
  feedHasMore?: boolean;
  /** v2: point-in-time FeedCompositionState (existing contract). */
  composition?: FeedCompositionState;
  /** v2: exact recirculated paint rows for same-sequence restore. */
  recirculatedRows?: HomeFeedReturnRecirculatedRow[];
  /** v2: nested desktop or viewport scroll offset. */
  scroll?: HomeFeedReturnScrollSnapshot | null;
  savedAt: number;
};

export type HomeFeedContinuationRestore = {
  composition: FeedCompositionState;
  feedHasMore: boolean;
  recirculatedRows: HomeFeedReturnRecirculatedRow[];
  scroll: HomeFeedReturnScrollSnapshot | null;
  /** When true, do not replace restored items with a first-page network refresh. */
  skipBackgroundRefresh: boolean;
};

let memoryCache: HomeFeedReturnCachePayload | null = null;

function isFeedCompositionSnapshot(
  value: unknown,
): value is FeedCompositionState {
  if (!value || typeof value !== 'object') return false;
  const c = value as Partial<FeedCompositionState>;
  return (
    typeof c.requestKey === 'string' &&
    typeof c.stage === 'string' &&
    typeof c.marketplaceExhausted === 'boolean' &&
    typeof c.broadenedExhausted === 'boolean' &&
    typeof c.recirculationActive === 'boolean' &&
    typeof c.emptyTerminal === 'boolean' &&
    typeof c.uniqueEligibleCount === 'number' &&
    typeof c.recirculationBatchIndex === 'number' &&
    typeof c.recirculatedCount === 'number' &&
    Array.isArray(c.displayedHistory) &&
    Array.isArray(c.recentIds)
  );
}

/**
 * Sanitize a restored composition so SPA back cannot false-terminalize while
 * marketplace items are still on screen.
 */
export function sanitizeRestoredComposition(
  snapshot: FeedCompositionState,
  requestKey: string,
  itemCount: number,
): FeedCompositionState {
  const history = Array.isArray(snapshot.displayedHistory)
    ? snapshot.displayedHistory.filter(
        (s): s is RecircSeedItem =>
          Boolean(s) &&
          typeof (s as RecircSeedItem).id === 'string' &&
          ((s as RecircSeedItem).kind === 'sale' ||
            (s as RecircSeedItem).kind === 'insp'),
      )
    : [];
  const recentIds = Array.isArray(snapshot.recentIds)
    ? snapshot.recentIds.filter((id): id is string => typeof id === 'string')
    : [];
  const uniqueFromHistory = new Set(history.map((h) => h.id)).size;
  const uniqueEligibleCount = Math.max(
    0,
    snapshot.uniqueEligibleCount || 0,
    uniqueFromHistory,
    itemCount > 0 ? Math.min(itemCount, uniqueFromHistory || itemCount) : 0,
  );

  const emptyTerminal =
    itemCount === 0 &&
    uniqueEligibleCount < FEED_RECIRC_MIN_SEED &&
    Boolean(snapshot.emptyTerminal);

  return {
    ...snapshot,
    requestKey,
    displayedHistory: history,
    recentIds,
    uniqueEligibleCount,
    emptyTerminal,
    // Visible inventory must remain continuable when seeds exist.
    recirculationActive:
      snapshot.recirculationActive ||
      (snapshot.marketplaceExhausted &&
        snapshot.broadenedExhausted &&
        uniqueEligibleCount >= FEED_RECIRC_MIN_SEED &&
        !emptyTerminal),
    stage: emptyTerminal
      ? 'empty'
      : snapshot.stage === 'empty' && uniqueEligibleCount >= FEED_RECIRC_MIN_SEED
        ? snapshot.recirculationActive
          ? 'recirculation'
          : 'broadened'
        : snapshot.stage,
  };
}

/**
 * Legacy v1: items + feedHasMore only. Rebuild a safe continuation state that
 * cannot claim marketplace-still-open solely because feedHasMore was true
 * (that flag also covers recirculation).
 */
export function rehydrateLegacyComposition(input: {
  requestKey: string;
  itemSeeds: RecircSeedItem[];
  feedHasMore: boolean;
  firstPageTake: number;
}): FeedCompositionState {
  const { requestKey, itemSeeds, feedHasMore, firstPageTake } = input;
  let restored = recordDisplayedSeeds(
    createFeedCompositionState(requestKey),
    itemSeeds,
  );

  if (itemSeeds.length === 0) {
    return {
      ...restored,
      emptyTerminal: true,
      stage: 'empty',
      marketplaceExhausted: true,
      broadenedExhausted: true,
    };
  }

  // Deep session without composition snapshot: treat unique inventory as
  // collected and resume recirculation rather than re-paging nearby skip=N.
  if (feedHasMore && itemSeeds.length > firstPageTake) {
    return sanitizeRestoredComposition(
      {
        ...restored,
        marketplaceExhausted: true,
        exactExhausted: true,
        broadenedExhausted: true,
        recirculationActive: true,
        emptyTerminal: false,
        stage: 'recirculation',
        marketplaceSkip: itemSeeds.length,
      },
      requestKey,
      itemSeeds.length,
    );
  }

  // Short / first-page shaped cache: exhaust exact only when the page looks
  // incomplete; otherwise keep marketplace open for genuine has-more.
  const apiHasMore =
    feedHasMore && itemSeeds.length >= firstPageTake;
  restored = markMarketplacePageResult(restored, {
    fetchedCount: itemSeeds.length,
    apiHasMore,
    skipUsed: 0,
  });
  return sanitizeRestoredComposition(
    restored,
    requestKey,
    itemSeeds.length,
  );
}

export function rehydrateHomeFeedContinuation(input: {
  requestKey: string;
  itemSeeds: RecircSeedItem[];
  payload: HomeFeedReturnCachePayload;
  firstPageTake: number;
}): HomeFeedContinuationRestore {
  const { requestKey, itemSeeds, payload, firstPageTake } = input;
  const itemCount = Math.max(itemSeeds.length, payload.items.length);

  if (
    payload.version === HOME_FEED_RETURN_CACHE_VERSION &&
    isFeedCompositionSnapshot(payload.composition)
  ) {
    // Reject cross-key composition bleed.
    if (
      payload.composition.requestKey &&
      payload.composition.requestKey !== requestKey
    ) {
      const legacy = rehydrateLegacyComposition({
        requestKey,
        itemSeeds,
        feedHasMore: Boolean(payload.feedHasMore),
        firstPageTake,
      });
      return {
        composition: legacy,
        feedHasMore: composedFeedCanContinue(legacy),
        recirculatedRows: [],
        scroll: null,
        skipBackgroundRefresh: false,
      };
    }

    let composition = sanitizeRestoredComposition(
      payload.composition,
      requestKey,
      itemCount,
    );
    // Ensure seeds from restored items are present even if history was trimmed.
    if (itemSeeds.length > 0 && composition.uniqueEligibleCount < FEED_RECIRC_MIN_SEED) {
      composition = sanitizeRestoredComposition(
        recordDisplayedSeeds(composition, itemSeeds),
        requestKey,
        itemCount,
      );
    } else if (
      itemSeeds.length > 0 &&
      composition.displayedHistory.length === 0
    ) {
      composition = sanitizeRestoredComposition(
        recordDisplayedSeeds(composition, itemSeeds),
        requestKey,
        itemCount,
      );
    }

    const feedHasMore =
      Boolean(payload.feedHasMore) || composedFeedCanContinue(composition);
    const skipBackgroundRefresh =
      composition.marketplaceExhausted ||
      composition.recirculationActive ||
      composition.stage === 'recirculation' ||
      (Array.isArray(payload.recirculatedRows) &&
        payload.recirculatedRows.length > 0);

    return {
      composition,
      feedHasMore: feedHasMore && !composition.emptyTerminal,
      recirculatedRows: Array.isArray(payload.recirculatedRows)
        ? payload.recirculatedRows
        : [],
      scroll: payload.scroll ?? null,
      skipBackgroundRefresh,
    };
  }

  const legacy = rehydrateLegacyComposition({
    requestKey,
    itemSeeds,
    feedHasMore: Boolean(
      payload.feedHasMore ?? itemSeeds.length >= firstPageTake,
    ),
    firstPageTake,
  });
  return {
    composition: legacy,
    feedHasMore: composedFeedCanContinue(legacy),
    recirculatedRows: [],
    scroll: null,
    skipBackgroundRefresh: false,
  };
}

export function saveHomeFeedReturnCache(
  payload: Omit<HomeFeedReturnCachePayload, 'savedAt'>,
): void {
  if (!payload.requestKey || payload.items.length === 0) return;
  if (memoryCache === null) {
    feedSealedNoteResultCacheInit();
  }
  feedSealedNoteFilterCacheTransition(payload.requestKey);
  memoryCache = {
    ...payload,
    version: payload.version ?? HOME_FEED_RETURN_CACHE_VERSION,
    savedAt: Date.now(),
  };
}

export function readHomeFeedReturnCache(
  requestKey: string,
): HomeFeedReturnCachePayload | null {
  if (!memoryCache) return null;
  if (memoryCache.requestKey !== requestKey) return null;
  if (Date.now() - memoryCache.savedAt > MAX_AGE_MS) return null;
  return memoryCache;
}

/**
 * @deprecated Cross-key peek caused wrong-scope reuse. Prefer
 * {@link readHomeFeedReturnCache} with the current requestKey.
 * Kept for callers that still pass a key via readHomeFeedReturnCache.
 */
export function peekFreshHomeFeedReturnCache(
  requestKey?: string,
): HomeFeedReturnCachePayload | null {
  if (!memoryCache) return null;
  if (Date.now() - memoryCache.savedAt > MAX_AGE_MS) return null;
  if (requestKey && memoryCache.requestKey !== requestKey) return null;
  // Without a key, never return a payload — prevents scope bleed.
  if (!requestKey) return null;
  return memoryCache;
}

/**
 * True when a cache payload is old enough to warrant a background refresh but
 * still young enough to display instantly (stale-while-revalidate window).
 */
export function isHomeFeedReturnCacheStale(
  payload: Pick<HomeFeedReturnCachePayload, 'savedAt'>,
): boolean {
  return Date.now() - payload.savedAt > HOME_FEED_STALE_MS;
}

export function clearHomeFeedReturnCache(): void {
  memoryCache = null;
}

/** Test/helper: read raw slot without key checks. */
export function __debugPeekHomeFeedReturnCache(): HomeFeedReturnCachePayload | null {
  return memoryCache;
}
