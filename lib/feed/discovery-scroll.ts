/**
 * Automatic continuation of the marketplace discovery window.
 *
 * Nearby results hand off to a further-results window once the exact page
 * is exhausted. That window must keep appending as the visitor nears the
 * end. A click is only required after a failed fetch.
 */

export type DiscoveryScrollAction = 'reveal' | 'fetch' | 'idle';

export function resolveDiscoveryScrollAction(input: {
  shown: number;
  available: number;
  apiHasMore: boolean;
  loading: boolean;
  failed: boolean;
  /** Explicit press after a failed fetch. Automatic scroll must not retry. */
  userRetry?: boolean;
}): DiscoveryScrollAction {
  if (input.loading) return 'idle';
  if (input.failed) return input.userRetry ? 'fetch' : 'idle';
  if (input.shown < input.available) return 'reveal';
  if (input.apiHasMore) return 'fetch';
  return 'idle';
}

/** Append a page without repeating an id already on screen. */
export function appendUniqueById<T extends { id: string }>(
  previous: readonly T[],
  page: readonly T[],
): T[] {
  const seen = new Set(previous.map((row) => row.id));
  const next = [...previous];
  for (const row of page) {
    if (!row.id || seen.has(row.id)) continue;
    seen.add(row.id);
    next.push(row);
  }
  return next;
}

export function revealNextDiscoveryBatch(input: {
  shown: number;
  available: number;
  batchSize: number;
}): number {
  if (input.shown >= input.available) return input.shown;
  return Math.min(input.available, input.shown + input.batchSize);
}

/**
 * Filter, search, radius, and place changes must restart pagination.
 * Same inputs keep the same key so a re-render does not drop the page.
 */
export function discoveryPaginationResetKey(input: {
  category: string;
  chip: string;
  scope: string;
  radius: number;
  query: string;
  place: string;
}): string {
  return [
    input.category,
    input.chip,
    input.scope,
    String(input.radius),
    input.query,
    input.place,
  ].join('|');
}
