/**
 * Unified composed-feed pagination / recirculation state.
 * One exhausted source must not terminate the entire feed.
 */

import {
  FEED_RECIRC_MIN_SEED,
  resolveInventoryContinuationMode,
  type FeedCompositionStage,
  type RecircSeedItem,
  trimDisplayHistory,
} from '@/lib/feed/feed-composition-policy';

export type FeedCompositionState = {
  requestKey: string;
  generation: number;
  marketplaceSkip: number;
  inspirationSkip: number;
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

  next = { ...next, exactExhausted: true };
  const mode = resolveInventoryContinuationMode(next.uniqueEligibleCount);

  if (mode === 'empty_state') {
    return {
      ...next,
      recirculationActive: false,
      emptyTerminal: true,
      stage: 'empty',
    };
  }

  return {
    ...next,
    recirculationActive: true,
    emptyTerminal: false,
    stage: 'recirculation',
  };
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
 * Continues when marketplace has more OR recirculation can run (1+ seeds).
 * Stops only for intentional empty terminal (0 seeds).
 */
export function composedFeedCanContinue(state: FeedCompositionState): boolean {
  if (state.emptyTerminal) return false;
  if (!state.marketplaceExhausted) return true;
  const mode = resolveInventoryContinuationMode(state.uniqueEligibleCount);
  if (mode === 'empty_state') return false;
  return state.uniqueEligibleCount >= FEED_RECIRC_MIN_SEED;
}
