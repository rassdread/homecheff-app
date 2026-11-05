/**
 * Marketplace search timing.
 * Long enough to collapse a word into one request, short enough that the
 * wait is not the thing the user notices.
 */
export const MARKETPLACE_SEARCH_DEBOUNCE_MS = 120;

/**
 * A text search must not pull the unfiltered national feed as "suggestions".
 * That refresh competed with the search request and painted unrelated items.
 * Empty query keeps the existing continuation.
 */
export function shouldLoadUnfilteredDiscovery(query: string): boolean {
  return query.trim().length === 0;
}
