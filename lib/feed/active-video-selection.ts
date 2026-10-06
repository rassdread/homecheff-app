/**
 * Pick the one feed tile that may attach a playable video source.
 * Inactive tiles stay on their poster.
 */

export type VideoVisibilitySample = {
  id: string;
  /** Visible fraction of the tile itself, 0–1. */
  ratio: number;
  centerDistancePx: number;
  elementHeight: number;
  viewportHeight: number;
};

/** A tile must be meaningfully on screen. Tall cards that cannot reach 60% use a lower bar. */
export function visibleActivationThreshold(
  elementHeight: number,
  viewportHeight: number,
): number {
  if (viewportHeight <= 0 || elementHeight <= 0) return 0.6;
  const maxPossible = Math.min(1, viewportHeight / elementHeight);
  if (maxPossible < 0.6) {
    return Math.max(0.35, Math.round(maxPossible * 0.85 * 100) / 100);
  }
  return 0.6;
}

export function visibleReleaseThreshold(
  elementHeight: number,
  viewportHeight: number,
): number {
  return Math.max(0.28, visibleActivationThreshold(elementHeight, viewportHeight) - 0.18);
}

/**
 * One winner.
 * The current winner stays through small ratio flicker.
 * A challenger must be clearly more visible.
 * If ratios are close, the tile nearer the viewport center wins.
 * The previous winner breaks a remaining tie.
 */
export function chooseActiveVideo(
  items: VideoVisibilitySample[],
  previousId: string | null,
): string | null {
  if (items.length === 0) return null;

  const previous = items.find((item) => item.id === previousId) ?? null;
  if (previous) {
    const release = visibleReleaseThreshold(previous.elementHeight, previous.viewportHeight);
    if (previous.ratio + 0.001 >= release) {
      const challenger = items.some(
        (item) =>
          item.id !== previous.id &&
          item.ratio + 0.001 >= visibleActivationThreshold(item.elementHeight, item.viewportHeight) &&
          item.ratio >= previous.ratio + 0.12,
      );
      if (!challenger) return previous.id;
    }
  }

  const eligible = items.filter(
    (item) => item.ratio + 0.001 >= visibleActivationThreshold(item.elementHeight, item.viewportHeight),
  );
  if (eligible.length === 0) return null;

  eligible.sort((a, b) => {
    if (Math.abs(a.ratio - b.ratio) > 0.08) return b.ratio - a.ratio;
    if (Math.abs(a.centerDistancePx - b.centerDistancePx) > 8) {
      return a.centerDistancePx - b.centerDistancePx;
    }
    if (a.id === previousId) return -1;
    if (b.id === previousId) return 1;
    return a.id.localeCompare(b.id);
  });
  return eligible[0]?.id ?? null;
}
