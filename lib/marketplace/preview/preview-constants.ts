/**
 * Marketplace preview timing constants — Phase 5A.
 */

/** Desktop tile hover no longer opens preview — info button only. */
export const PREVIEW_DESKTOP_HOVER_ENABLED = false;

/** Desktop hover delay before preview opens (when {@link PREVIEW_DESKTOP_HOVER_ENABLED}). */
export const PREVIEW_HOVER_DELAY_MS = 600;

/** Cooldown after scroll stops before hover preview is allowed. */
export const PREVIEW_SCROLL_COOLDOWN_MS = 500;

/** Mobile long-press duration. */
export const PREVIEW_LONG_PRESS_MS = 700;

/** Touch movement beyond this cancels long-press. */
export const PREVIEW_LONG_PRESS_MOVE_THRESHOLD_PX = 12;
