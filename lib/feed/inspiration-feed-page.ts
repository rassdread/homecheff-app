/** Existing inspiratie API page size used by the home feed. */
export const INSPIRATION_FEED_PAGE_TAKE = 48;

/**
 * A full page is not the end of published inspiration. Keep the existing
 * page size and stop after this many pages so one empty eligible page cannot
 * hide later published dishes, without scanning the whole table.
 */
export const INSPIRATION_FEED_MAX_PAGES = 4;

export function inspirationFeedShouldContinue(input: {
  pageLength: number;
  pagesFetched: number;
}): boolean {
  return (
    input.pageLength >= INSPIRATION_FEED_PAGE_TAKE &&
    input.pagesFetched < INSPIRATION_FEED_MAX_PAGES
  );
}
