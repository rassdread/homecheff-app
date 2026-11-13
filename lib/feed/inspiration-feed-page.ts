/** One source page examined per feed load. Not a total and not the end of the catalogue. */
export const INSPIRATION_FEED_PAGE_TAKE = 48;

export type InspirationCursor = {
  createdAt: string;
  id: string;
};

export type InspirationSourceRow = {
  id: string;
  createdAt: string;
};

/**
 * Keyset cursor for newest-first inspiration.
 * The cursor is the last scanned source row, not the last eligible row and not a page count.
 */
export function encodeInspirationCursor(cursor: InspirationCursor): string {
  return `${cursor.createdAt}|${cursor.id}`;
}

export function decodeInspirationCursor(
  raw: string | null | undefined,
): InspirationCursor | null {
  if (!raw) return null;
  const sep = raw.lastIndexOf("|");
  if (sep <= 0) return null;
  const createdAt = raw.slice(0, sep);
  const id = raw.slice(sep + 1).trim();
  if (!id || Number.isNaN(Date.parse(createdAt))) return null;
  return { createdAt, id };
}

/**
 * Turn one bounded source read into a feed page.
 *
 * `rows` is the source window in newest-first order, with one extra probe row
 * when the caller asked for `take + 1`. An empty eligible result is not the end
 * while that probe row exists. A short source window is the end.
 */
export function scanInspirationSourcePage<T extends InspirationSourceRow>(input: {
  rows: readonly T[];
  take: number;
  eligible: (row: T) => boolean;
}): {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
  scanned: number;
} {
  const take = Math.max(1, input.take);
  const hasMore = input.rows.length > take;
  const window = hasMore ? input.rows.slice(0, take) : input.rows.slice();
  const items = window.filter((row) => input.eligible(row));
  const last = window[window.length - 1];
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeInspirationCursor({ createdAt: last.createdAt, id: last.id })
        : null,
    scanned: window.length,
  };
}

/** A continuation is real only when the cursor moves. The same cursor is not another page. */
export function inspirationCursorAdvanced(
  previous: string | null,
  next: string | null,
  hasMore: boolean,
): boolean {
  if (!hasMore || !next) return false;
  return next !== previous;
}
