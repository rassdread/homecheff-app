/**
 * WX Phase 1B.4 — Landscape Work Posture presentation policy.
 *
 * Pure · deterministic · side-effect free · UI-independent.
 * Driven ONLY by AvailableSpace geometry (usable width × height).
 * Does NOT inspect user agent, device names, or orientation APIs.
 *
 * Owns presentation policy only:
 * - bottom nav collapse
 * - orientation strip compaction
 * - chrome density
 *
 * Does NOT own Mode, capabilities, layout rails, GeoFeed, or Host.
 */

export const LANDSCAPE_WORK_POSTURE = {
  phase: "1b.4",
  contractId: "wx-landscape-work-posture-v1",
  neverInspectUserAgent: true,
  neverInspectDevice: true,
  presentationOnly: true,
} as const;

export type WorkspaceChromeDensity = "standard" | "compact";

export type LandscapeWorkPosturePlan = {
  posture: "portrait" | "landscape";
  /** Landscape Work Posture is active when AvailableSpace is landscape. */
  workPostureActive: boolean;
  /** Bottom button menu is a portrait affordance — collapsed in landscape. */
  bottomNavCollapsed: boolean;
  /** Orientation strip uses compact Workspace chrome. */
  orientationCompact: boolean;
  chromeDensity: WorkspaceChromeDensity;
  usableWidthPx: number;
  usableHeightPx: number;
  contractId: typeof LANDSCAPE_WORK_POSTURE.contractId;
  phase: typeof LANDSCAPE_WORK_POSTURE.phase;
};

export type LandscapeWorkPostureInput = {
  usableWidthPx: number;
  usableHeightPx: number;
};

/**
 * Resolve landscape work-posture presentation from AvailableSpace only.
 * Fail-closed: non-finite / negative sizes → 0 → portrait (safe discovery chrome).
 */
export function resolveLandscapeWorkPosture(
  input: LandscapeWorkPostureInput,
): LandscapeWorkPosturePlan {
  const usableWidthPx = Math.max(
    0,
    Math.floor(Number(input.usableWidthPx) || 0),
  );
  const usableHeightPx = Math.max(
    0,
    Math.floor(Number(input.usableHeightPx) || 0),
  );
  const posture: "portrait" | "landscape" =
    usableWidthPx > usableHeightPx ? "landscape" : "portrait";
  const workPostureActive = posture === "landscape";

  return {
    posture,
    workPostureActive,
    bottomNavCollapsed: workPostureActive,
    orientationCompact: workPostureActive,
    chromeDensity: workPostureActive ? "compact" : "standard",
    usableWidthPx,
    usableHeightPx,
    contractId: LANDSCAPE_WORK_POSTURE.contractId,
    phase: LANDSCAPE_WORK_POSTURE.phase,
  };
}

export function isSameLandscapeWorkPosturePlan(
  a: LandscapeWorkPosturePlan,
  b: LandscapeWorkPosturePlan,
): boolean {
  return (
    a.posture === b.posture &&
    a.workPostureActive === b.workPostureActive &&
    a.bottomNavCollapsed === b.bottomNavCollapsed &&
    a.orientationCompact === b.orientationCompact &&
    a.chromeDensity === b.chromeDensity &&
    a.usableWidthPx === b.usableWidthPx &&
    a.usableHeightPx === b.usableHeightPx
  );
}
