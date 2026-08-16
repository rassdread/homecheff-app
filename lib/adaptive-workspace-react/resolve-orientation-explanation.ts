/**
 * WX Phase 1C.2 — Available Space messaging (presentation only).
 *
 * Pure · deterministic · AvailableSpace-driven (usable width × height).
 * Does NOT extend Mode / Capability / presentation planners.
 * Does NOT own Create, navigation, GeoFeed, or Host.
 *
 * Presentation levels change wording density — never meaning.
 * Every level keeps the sacred HomeCheff message complete:
 * what it is · what to discover · what to offer · local · first action.
 *
 * Landscape work posture (WX 1B.4) stays intentionally compact.
 */

import {
  FEED_WORKSPACE_LAYOUT_BANDS,
  type FeedWorkspaceLayoutBands,
} from "./resolve-feed-workspace-visible-layout";
import { LANDSCAPE_SHORT_CHROME_MAX_HEIGHT_EXCLUSIVE } from "./resolve-landscape-work-posture";

export const ORIENTATION_EXPLANATION = {
  phase: "1c.2",
  contractId: "wx-orientation-explanation-v2",
  neverInspectUserAgent: true,
  presentationOnly: true,
  meaningAlwaysComplete: true,
} as const;

/** Five presentation densities — not device categories. */
export type OrientationExplanationLevel =
  | "ultra_compact"
  | "compact_complete"
  | "standard_complete"
  | "expanded"
  | "rich";

/**
 * @deprecated Legacy 1C.1 names — mapped for probes/docs only.
 * Prefer OrientationExplanationLevel.
 */
export type LegacyOrientationExplanationLevel =
  | "short"
  | "compact"
  | "medium"
  | "full";

export type OrientationExplanationPlan = {
  level: OrientationExplanationLevel;
  /** Always true — meaning must stay complete. */
  showBody: boolean;
  /** Always true — first action must stay visible. */
  showActions: boolean;
  /** Second body sentence (compact_complete+). */
  showSecondaryBody: boolean;
  /** Supporting / community sentence (expanded+). */
  showSupport: boolean;
  /** Extra context / examples (rich). */
  showExamples: boolean;
  /** Landscape / ultra-tight chrome (WX 1B.4). */
  singleLine: boolean;
  /** Soft vertical budget hint for CSS — never hard-clips meaning. */
  chromeBudget: "tight" | "balanced" | "open";
  usableWidthPx: number;
  usableHeightPx: number;
  remainingHeightPx: number;
  contractId: typeof ORIENTATION_EXPLANATION.contractId;
  phase: typeof ORIENTATION_EXPLANATION.phase;
};

export type OrientationExplanationInput = {
  usableWidthPx: number;
  usableHeightPx: number;
  /**
   * Approximate reserved chrome (nav + safe-area) already outside the strip.
   * Deducted from usable height to estimate remaining vertical space.
   */
  chromeReservePx?: number;
  bands?: FeedWorkspaceLayoutBands;
};

function orientationOf(widthPx: number, heightPx: number): "portrait" | "landscape" {
  return widthPx > heightPx ? "landscape" : "portrait";
}

/** Short landscape height → workspace posture (not tablet canvas). */
const LANDSCAPE_COMPACT_MAX_HEIGHT_EXCLUSIVE =
  LANDSCAPE_SHORT_CHROME_MAX_HEIGHT_EXCLUSIVE;

/** Default top-nav / chrome reserve when caller does not measure it. */
const DEFAULT_CHROME_RESERVE_PX = 64;

/** Remaining-height bands for portrait / tall AvailableSpace (not device names).
 * Multi-persona UX: keep phone portrait at compact_complete so listings enter the fold.
 */
const REMAINING_HEIGHT = {
  ultraExclusive: 480,
  compactExclusive: 900,
  standardExclusive: 1100,
  expandedExclusive: 1300,
} as const;

/**
 * Resolve first-visitor explanation density from AvailableSpace only.
 * Fail-closed: invalid sizes → compact_complete (safe, complete meaning).
 */
export function resolveOrientationExplanation(
  input: OrientationExplanationInput,
): OrientationExplanationPlan {
  const bands = input.bands ?? FEED_WORKSPACE_LAYOUT_BANDS;
  const usableWidthPx = Math.max(
    0,
    Math.floor(Number(input.usableWidthPx) || 0),
  );
  const usableHeightPx = Math.max(
    0,
    Math.floor(Number(input.usableHeightPx) || 0),
  );
  const chromeReservePx = Math.max(
    0,
    Math.floor(
      Number.isFinite(Number(input.chromeReservePx))
        ? Number(input.chromeReservePx)
        : DEFAULT_CHROME_RESERVE_PX,
    ),
  );
  const remainingHeightPx = Math.max(0, usableHeightPx - chromeReservePx);
  const orientation = orientationOf(usableWidthPx, usableHeightPx);

  let level: OrientationExplanationLevel;

  // Invalid / unknown → complete-but-compact (never empty meaning).
  if (usableWidthPx <= 0 || usableHeightPx <= 0) {
    level = "compact_complete";
  } else if (
    orientation === "landscape" &&
    usableHeightPx < LANDSCAPE_COMPACT_MAX_HEIGHT_EXCLUSIVE
  ) {
    // WX 1B.4 — short landscape work posture stays intentionally compact.
    level = "ultra_compact";
  } else if (remainingHeightPx < REMAINING_HEIGHT.ultraExclusive) {
    level = "ultra_compact";
  } else if (remainingHeightPx < REMAINING_HEIGHT.compactExclusive) {
    level = "compact_complete";
  } else if (
    usableWidthPx >= bands.comfortMaxExclusive &&
    remainingHeightPx >= REMAINING_HEIGHT.expandedExclusive
  ) {
    level = "rich";
  } else if (usableWidthPx >= bands.compactMaxExclusive) {
    level =
      remainingHeightPx >= REMAINING_HEIGHT.standardExclusive
        ? "expanded"
        : "standard_complete";
  } else if (remainingHeightPx < REMAINING_HEIGHT.standardExclusive) {
    level = "standard_complete";
  } else {
    level = "standard_complete";
  }

  const singleLine = level === "ultra_compact";
  const chromeBudget: OrientationExplanationPlan["chromeBudget"] =
    level === "ultra_compact"
      ? "tight"
      : level === "compact_complete" || level === "standard_complete"
        ? "balanced"
        : "open";

  return {
    level,
    showBody: true,
    showActions: true,
    // Model B: no secondary/keyword fold chrome — support/examples only on rich desktop.
    showSecondaryBody: false,
    showSupport: level === 'rich',
    showExamples: level === 'rich',
    singleLine,
    chromeBudget,
    usableWidthPx,
    usableHeightPx,
    remainingHeightPx,
    contractId: ORIENTATION_EXPLANATION.contractId,
    phase: ORIENTATION_EXPLANATION.phase,
  };
}

export function isSameOrientationExplanationPlan(
  a: OrientationExplanationPlan,
  b: OrientationExplanationPlan,
): boolean {
  return (
    a.level === b.level &&
    a.showBody === b.showBody &&
    a.showActions === b.showActions &&
    a.showSecondaryBody === b.showSecondaryBody &&
    a.showSupport === b.showSupport &&
    a.showExamples === b.showExamples &&
    a.singleLine === b.singleLine &&
    a.chromeBudget === b.chromeBudget &&
    a.usableWidthPx === b.usableWidthPx &&
    a.usableHeightPx === b.usableHeightPx &&
    a.remainingHeightPx === b.remainingHeightPx
  );
}

/** Map v2 levels → legacy probe names (documentation / older scripts). */
export function toLegacyOrientationExplanationLevel(
  level: OrientationExplanationLevel,
): LegacyOrientationExplanationLevel {
  switch (level) {
    case "ultra_compact":
      return "compact";
    case "compact_complete":
      return "short";
    case "standard_complete":
      return "short";
    case "expanded":
      return "medium";
    case "rich":
      return "full";
    default:
      return "short";
  }
}
