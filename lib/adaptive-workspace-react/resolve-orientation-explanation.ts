/**
 * WX Phase 1C.1+ — Orientation explanation density (presentation only).
 *
 * Pure · deterministic · AvailableSpace-driven (usable width × height).
 * Does NOT extend Mode / Capability / presentation planners.
 * Does NOT own Create, navigation, GeoFeed, or Host.
 *
 * Levels map to first-visitor understanding budgets:
 * - short   → phone portrait
 * - compact → phone landscape (work posture)
 * - medium  → tablet
 * - full    → laptop / desktop / ultrawide
 */

import {
  FEED_WORKSPACE_LAYOUT_BANDS,
  type FeedWorkspaceLayoutBands,
} from "./resolve-feed-workspace-visible-layout";

export const ORIENTATION_EXPLANATION = {
  phase: "1c.1",
  contractId: "wx-orientation-explanation-v1",
  neverInspectUserAgent: true,
  presentationOnly: true,
} as const;

export type OrientationExplanationLevel =
  | "short"
  | "compact"
  | "medium"
  | "full";

export type OrientationExplanationPlan = {
  level: OrientationExplanationLevel;
  /** Show identity one-liner / body copy. */
  showBody: boolean;
  /** Show equal-weight action verbs row. */
  showActions: boolean;
  /** Prefer truncated single-line chrome (landscape). */
  singleLine: boolean;
  usableWidthPx: number;
  usableHeightPx: number;
  contractId: typeof ORIENTATION_EXPLANATION.contractId;
  phase: typeof ORIENTATION_EXPLANATION.phase;
};

export type OrientationExplanationInput = {
  usableWidthPx: number;
  usableHeightPx: number;
  bands?: FeedWorkspaceLayoutBands;
};

function orientationOf(widthPx: number, heightPx: number): "portrait" | "landscape" {
  return widthPx > heightPx ? "landscape" : "portrait";
}

/** Short landscape height → phone-landscape chrome (not tablet work surface). */
const PHONE_LANDSCAPE_MAX_HEIGHT_EXCLUSIVE = 520;

/**
 * Resolve first-visitor explanation density from AvailableSpace only.
 * Fail-closed: invalid sizes → short (safe, mobile-first).
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
  const orientation = orientationOf(usableWidthPx, usableHeightPx);

  let level: OrientationExplanationLevel;
  if (usableWidthPx >= bands.comfortMaxExclusive) {
    // Laptop / desktop / ultrawide — full first-visitor explanation.
    level = "full";
  } else if (
    orientation === "landscape" &&
    usableHeightPx < PHONE_LANDSCAPE_MAX_HEIGHT_EXCLUSIVE
  ) {
    level = "compact";
  } else if (usableWidthPx >= bands.compactMaxExclusive) {
    level = "medium";
  } else if (orientation === "landscape") {
    level = "compact";
  } else {
    level = "short";
  }

  const singleLine = level === "compact";
  const showBody = level !== "compact";
  const showActions = level === "medium" || level === "full" || level === "compact";

  return {
    level,
    showBody,
    showActions,
    singleLine,
    usableWidthPx,
    usableHeightPx,
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
    a.singleLine === b.singleLine &&
    a.usableWidthPx === b.usableWidthPx &&
    a.usableHeightPx === b.usableHeightPx
  );
}
