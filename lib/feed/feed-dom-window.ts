/** Mounted marketplace cards. Older cards stay in memory and can return. */
export const FEED_MOUNTED_CARD_CAP = 36;
export const FEED_MOUNTED_CARD_STEP = 6;

export function sliceMountedFeedRows<T>(
  rows: readonly T[],
  start: number,
  cap = FEED_MOUNTED_CARD_CAP,
): { start: number; rows: T[] } {
  const maxStart = Math.max(0, rows.length - cap);
  const safeStart = Math.max(0, Math.min(start, maxStart));
  return {
    start: safeStart,
    rows: rows.slice(safeStart, safeStart + cap),
  };
}

/**
 * Slide the mounted window only for cards that have already left the viewport.
 * A fast scroll must not skip cards the visitor has not passed.
 */
export function nextFeedDomStart(input: {
  currentStart: number;
  rowCount: number;
  oldestCardsAboveViewport: boolean;
  releasedRegionVisible: boolean;
  cap?: number;
  step?: number;
}): number {
  const cap = input.cap ?? FEED_MOUNTED_CARD_CAP;
  const step = input.step ?? FEED_MOUNTED_CARD_STEP;
  const maxStart = Math.max(0, input.rowCount - cap);
  if (input.oldestCardsAboveViewport && input.currentStart < maxStart) {
    return Math.min(maxStart, input.currentStart + step);
  }
  if (input.releasedRegionVisible && input.currentStart > 0) {
    return Math.max(0, input.currentStart - step);
  }
  return Math.min(input.currentStart, maxStart);
}
