/**
 * Unified composed-feed pagination / recirculation state.
 * One exhausted source must not terminate the entire feed.
 *
 * ## feedHasMore contract
 *
 * `composedFeedCanContinue` (and thus client `feedHasMore`) means:
 *   "Can the user discover another eligible page?"
 *
 * It is NOT merely "does the current exact-radius query have another row?".
 *
 * Stages:
 * 1. exact — in-radius / current-scope marketplace pages
 * 2. broadened — optional wider API discovery after exact exhaust when it
 *    still contributes new eligible uniques (client progressive widen already
 *    ran via composeProgressiveNearbySalePool)
 * 3. recirculation — intentional re-show of already-seen seeds (historical
 *    endless feed; must not be starved by a stuck broadened stage)
 * 4. empty — intentional terminal (no seeds)
 *
 * hasMore stays true while exact OR productive broadened inventory may still
 * yield new pages, or while recirculation can run. It becomes false only when
 * exact/broadened are done AND recirculation cannot continue (empty terminal).
 */

import {
  FEED_RECIRC_MIN_SEED,
  resolveInventoryContinuationMode,
  type FeedCompositionStage,
  type RecircSeedItem,
  trimDisplayHistory,
} from '@/lib/feed/feed-composition-policy';

/**
 * After this many consecutive broadened pages with zero newly appended uniques,
 * hand off to historical recirculation even if the API still reports hasMore.
 * Prevents duplicate-page starvation without inventing a second recycle engine.
 */
export const FEED_BROADENED_ZERO_UNIQUE_HANDOFF = 2;

/** Abort hung widened discovery so recirculation is not starved by a stuck fetch. */
export const FEED_BROADENED_FETCH_TIMEOUT_MS = 12_000;

export type FeedCompositionState = {
  requestKey: string;
  generation: number;
  marketplaceSkip: number;
  inspirationSkip: number;
  /** Skip cursor for widened/national discovery continuation pages. */
  broadenedSkip: number;
  /**
   * Consecutive broadened pages that advanced the cursor but added 0 new
   * unique ids. Reset when a page contributes newUniqueCount > 0.
   */
  broadenedZeroUniqueStreak: number;
  marketplaceExhausted: boolean;
  inspirationExhausted: boolean;
  exactExhausted: boolean;
  broadenedExhausted: boolean;
  recirculationActive: boolean;
  /** Intentional zero-content terminal (no loop). */
  emptyTerminal: boolean;
  stage: FeedCompositionStage;
  displayedHistory: RecircSeedItem[];
  recentIds: string[];
  uniqueEligibleCount: number;
  recirculatedCount: number;
  recirculationBatchIndex: number;
};

export function createFeedCompositionState(
  requestKey = '',
): FeedCompositionState {
  return {
    requestKey,
    generation: 1,
    marketplaceSkip: 0,
    inspirationSkip: 0,
    broadenedSkip: 0,
    broadenedZeroUniqueStreak: 0,
    marketplaceExhausted: false,
    inspirationExhausted: false,
    exactExhausted: false,
    broadenedExhausted: false,
    recirculationActive: false,
    emptyTerminal: false,
    stage: 'exact',
    displayedHistory: [],
    recentIds: [],
    uniqueEligibleCount: 0,
    recirculatedCount: 0,
    recirculationBatchIndex: 0,
  };
}

/** Full reset on scope/filter requestKey change. */
export function resetFeedCompositionState(
  prev: FeedCompositionState,
  requestKey: string,
): FeedCompositionState {
  return {
    ...createFeedCompositionState(requestKey),
    generation: prev.generation + 1,
  };
}

export function recordDisplayedSeeds(
  state: FeedCompositionState,
  seeds: RecircSeedItem[],
): FeedCompositionState {
  if (seeds.length === 0) return state;
  const history = trimDisplayHistory([...state.displayedHistory, ...seeds]);
  const recentIds = trimDisplayHistory(
    [...state.recentIds, ...seeds.map((s) => s.id)].map((id) => ({ id })),
  ).map((x) => x.id);
  const unique = new Set(history.map((h) => h.id));
  return {
    ...state,
    displayedHistory: history,
    recentIds,
    uniqueEligibleCount: unique.size,
    emptyTerminal: false,
  };
}

/**
 * Enter historical recirculation when ≥1 seed exists; otherwise empty terminal.
 * Shared by broadened exhaust and zero-unique handoff.
 */
function enterRecirculationOrEmpty(
  state: FeedCompositionState,
): FeedCompositionState {
  const mode = resolveInventoryContinuationMode(state.uniqueEligibleCount);
  if (mode === 'empty_state') {
    return {
      ...state,
      broadenedExhausted: true,
      recirculationActive: false,
      emptyTerminal: true,
      stage: 'empty',
    };
  }
  return {
    ...state,
    broadenedExhausted: true,
    recirculationActive: true,
    emptyTerminal: false,
    stage: 'recirculation',
  };
}

/**
 * Record an exact-scope marketplace page result.
 * When the exact pool ends, enter optional `broadened` API discovery — not
 * recirculation yet — so national/out-of-radius uniques stay reachable.
 * Recirculation remains the historical endless-feed stage after broadened
 * finishes or stops contributing new uniques.
 */
export function markMarketplacePageResult(
  state: FeedCompositionState,
  input: { fetchedCount: number; apiHasMore: boolean; skipUsed: number },
): FeedCompositionState {
  const exhausted = input.fetchedCount === 0 || !input.apiHasMore;
  let next: FeedCompositionState = {
    ...state,
    marketplaceSkip: input.skipUsed + input.fetchedCount,
    marketplaceExhausted: exhausted ? true : state.marketplaceExhausted,
  };
  if (!exhausted) return next;

  next = {
    ...next,
    exactExhausted: true,
    stage: 'broadened',
    recirculationActive: false,
    emptyTerminal: false,
    broadenedZeroUniqueStreak: 0,
  };

  // Zero seeds and exact empty → terminal empty (no broaden / recirc loop).
  if (next.uniqueEligibleCount <= 0 && input.fetchedCount === 0) {
    return {
      ...next,
      broadenedExhausted: true,
      emptyTerminal: true,
      stage: 'empty',
    };
  }

  return next;
}

/**
 * Record a widened discovery page (national / out-of-radius continuation).
 *
 * - Advance skip even when the page contributes zero new uniques.
 * - Keep fetching while API hasMore AND pages still look productive.
 * - When API ends OR consecutive zero-unique pages hit the handoff streak,
 *   activate historical recirculation (never starve the endless feed).
 */
export function markBroadenedPageResult(
  state: FeedCompositionState,
  input: {
    /** Rows returned by the API page (pre-dedupe page size). */
    fetchedCount: number;
    /** Newly appended unique ids after dedupe against already-shown items. */
    newUniqueCount: number;
    apiHasMore: boolean;
    skipUsed: number;
  },
): FeedCompositionState {
  const nextSkip = input.skipUsed + Math.max(0, input.fetchedCount);
  const streak =
    input.newUniqueCount > 0 ? 0 : state.broadenedZeroUniqueStreak + 1;

  const next: FeedCompositionState = {
    ...state,
    stage: 'broadened',
    broadenedSkip: nextSkip,
    broadenedZeroUniqueStreak: streak,
    recirculationActive: false,
    emptyTerminal: false,
  };

  const productiveContinue =
    input.apiHasMore && streak < FEED_BROADENED_ZERO_UNIQUE_HANDOFF;

  if (productiveContinue) {
    return next;
  }

  // API exhausted, or broadened stopped contributing new uniques → recirculation.
  return enterRecirculationOrEmpty({
    ...next,
    broadenedExhausted: true,
  });
}

export function markInspirationExhausted(
  state: FeedCompositionState,
): FeedCompositionState {
  return {
    ...state,
    inspirationExhausted: true,
  };
}

export function bumpRecirculatedCount(
  state: FeedCompositionState,
  n: number,
): FeedCompositionState {
  return {
    ...state,
    recirculationActive: true,
    emptyTerminal: false,
    stage: 'recirculation',
    recirculatedCount: state.recirculatedCount + Math.max(0, n),
    recirculationBatchIndex: state.recirculationBatchIndex + 1,
  };
}

/**
 * Sentinel / load-more gate for the composed feed.
 *
 * Continues when:
 * - exact marketplace still has pages, OR
 * - productive widened discovery has not been exhausted, OR
 * - recirculation can run (1+ seeds).
 *
 * Stops only for intentional empty terminal (0 seeds after all phases).
 */
export function composedFeedCanContinue(state: FeedCompositionState): boolean {
  if (state.emptyTerminal) return false;
  if (!state.marketplaceExhausted) return true;
  if (!state.broadenedExhausted) return true;
  const mode = resolveInventoryContinuationMode(state.uniqueEligibleCount);
  if (mode === 'empty_state') return false;
  return state.uniqueEligibleCount >= FEED_RECIRC_MIN_SEED;
}

/** True when load-more should fetch widened/national discovery pages. */
export function shouldFetchBroadenedDiscovery(
  state: FeedCompositionState,
): boolean {
  if (state.emptyTerminal) return false;
  if (!state.marketplaceExhausted) return false;
  if (state.broadenedExhausted) return false;
  if (state.broadenedZeroUniqueStreak >= FEED_BROADENED_ZERO_UNIQUE_HANDOFF) {
    return false;
  }
  return true;
}

/**
 * Historical recirculation gate: marketplace exhausted, ≥1 seed, and
 * broadened is done (or no longer eligible to fetch).
 */
export function shouldActivateRecirculation(
  state: FeedCompositionState,
): boolean {
  if (state.emptyTerminal) return false;
  if (state.recirculationActive) return true;
  if (!state.marketplaceExhausted) return false;
  if (state.uniqueEligibleCount < FEED_RECIRC_MIN_SEED) return false;
  if (shouldFetchBroadenedDiscovery(state)) return false;
  return true;
}
