/**
 * Explicit feed result phases for filter/scope transitions.
 * Empty-state UI must never derive solely from items.length === 0.
 */

export const FEED_RESULT_PHASE = {
  IDLE: 'IDLE',
  FILTER_TRANSITION_STARTED: 'FILTER_TRANSITION_STARTED',
  SEARCHING: 'SEARCHING',
  RESULTS_READY: 'RESULTS_READY',
  ZERO_RESULTS_CONFIRMED: 'ZERO_RESULTS_CONFIRMED',
  ERROR: 'ERROR',
  LOCATION_REQUIRED: 'LOCATION_REQUIRED',
  STALE_RESPONSE_REJECTED: 'STALE_RESPONSE_REJECTED',
} as const;

export type FeedResultPhase =
  (typeof FEED_RESULT_PHASE)[keyof typeof FEED_RESULT_PHASE];

export type FeedFilterTransitionDiag = {
  filterTransitionStarted: number;
  filterRequestStarted: number;
  filterRequestCompleted: number;
  filterCacheHit: number;
  filterCacheMiss: number;
  staleFeedRetained: number;
  staleFeedReplaced: number;
  zeroStateEligible: number;
  zeroStateRendered: number;
  zeroStateSuppressedBecauseLoading: number;
  responseAccepted: number;
  responseRejectedStale: number;
  timeToFirstFilteredResultMsTotal: number;
  timeToFirstFilteredResultCount: number;
  filterTransitionDurationMsTotal: number;
  filterTransitionDurationCount: number;
};

export function createFeedFilterTransitionDiag(): FeedFilterTransitionDiag {
  return {
    filterTransitionStarted: 0,
    filterRequestStarted: 0,
    filterRequestCompleted: 0,
    filterCacheHit: 0,
    filterCacheMiss: 0,
    staleFeedRetained: 0,
    staleFeedReplaced: 0,
    zeroStateEligible: 0,
    zeroStateRendered: 0,
    zeroStateSuppressedBecauseLoading: 0,
    responseAccepted: 0,
    responseRejectedStale: 0,
    timeToFirstFilteredResultMsTotal: 0,
    timeToFirstFilteredResultCount: 0,
    filterTransitionDurationMsTotal: 0,
    filterTransitionDurationCount: 0,
  };
}

/** True while a new filter generation is still in flight. */
export function isFilterSearchingPhase(phase: FeedResultPhase): boolean {
  return (
    phase === FEED_RESULT_PHASE.FILTER_TRANSITION_STARTED ||
    phase === FEED_RESULT_PHASE.SEARCHING
  );
}

/**
 * Genuine zero-results may render only when the active generation settled
 * with no eligible content — never while searching / refreshing / location required.
 */
export function isZeroResultsEligible(input: {
  phase: FeedResultPhase;
  loading: boolean;
  feedRefreshing: boolean;
  feedHydrated: boolean;
  nearbyNeedsLocation: boolean;
  requestInFlight: boolean;
  resultCount: number;
  emptyTerminal?: boolean;
}): boolean {
  if (input.nearbyNeedsLocation) return false;
  if (!input.feedHydrated) return false;
  if (input.loading || input.feedRefreshing || input.requestInFlight) {
    return false;
  }
  if (isFilterSearchingPhase(input.phase)) return false;
  if (input.phase === FEED_RESULT_PHASE.ERROR) return false;
  if (input.phase === FEED_RESULT_PHASE.LOCATION_REQUIRED) return false;
  if (input.phase === FEED_RESULT_PHASE.STALE_RESPONSE_REJECTED) return false;

  const settled =
    input.phase === FEED_RESULT_PHASE.ZERO_RESULTS_CONFIRMED ||
    input.phase === FEED_RESULT_PHASE.RESULTS_READY ||
    input.phase === FEED_RESULT_PHASE.IDLE;

  if (!settled) return false;

  return input.resultCount === 0 || Boolean(input.emptyTerminal);
}
