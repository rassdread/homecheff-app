/**
 * WX Phase 1B.1 — Workspace Mode Engine (WMS v1.0).
 *
 * Pure · deterministic · side-effect free · UI-independent.
 * Consumes AvailableSpace; does NOT modify AvailableSpace.
 * Does NOT activate capabilities, change layouts, or touch GeoFeed.
 *
 * Authority: docs/architecture/homecheff-workspace-modes-specification-v1.md
 */

export type WorkspaceModeId =
  | "browse"
  | "compact-workspace"
  | "hybrid-workspace"
  | "full-workspace"
  | "professional-workspace";

/** Work posture — orthogonal to Mode (WMS §6). */
export type WorkspacePosture = "portrait" | "landscape";

/** Injectable AvailableSpace bands — aligned with feed visible-layout bands. */
export type WorkspaceModeBands = {
  /** Width < this → compact capacity (Browse / Compact carve-out). */
  compactMaxExclusive: number;
  /** Width < this → Hybrid. */
  comfortMaxExclusive: number;
  /** Width < this → Full; else Professional. */
  expandedMaxExclusive: number;
  /** Landscape carve-out: min width for Compact assist eligibility. */
  landscapePanelMinWidthPx: number;
  /** Short usable height demotes Full/Professional one step (WMS short-height honesty). */
  shortHeightMaxExclusive: number;
};

export const WORKSPACE_MODE_BANDS: WorkspaceModeBands = {
  compactMaxExclusive: 720,
  comfortMaxExclusive: 1024,
  expandedMaxExclusive: 1440,
  landscapePanelMinWidthPx: 640,
  shortHeightMaxExclusive: 480,
};

export type WorkspaceModeResolveInput = {
  usableWidthPx: number;
  usableHeightPx: number;
  bands?: WorkspaceModeBands;
  /**
   * Optional interaction / density signals — recorded for forward compatibility.
   * MUST NOT change Mode resolution in 1B.1 (WMS: refine presentation only).
   */
  interactionSpace?: "touch" | "pointer" | "mixed" | "unknown";
  workspaceDensity?: "low" | "medium" | "high" | "unknown";
};

export type WorkspaceModePlan = {
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  /** usableWidthPx × usableHeightPx */
  workingAreaPx: number;
  /** True when short usable height demoted Full/Professional. */
  heightDemoted: boolean;
  /**
   * AWA profile affinity (informational). Mode Engine is authoritative for WMS Mode;
   * layout panel budgets remain owned by resolveFeedWorkspaceVisibleLayout until later phases.
   */
  profileAffinity: "COMPACT" | "COMFORT" | "EXPANDED" | "PROFESSIONAL";
  /**
   * Whether Compact landscape carve-out applied (assist eligibility under compact width).
   * Capabilities are NOT activated in 1B.1 — flag is diagnostic only.
   */
  landscapeCarveOut: boolean;
  interactionSpace: "touch" | "pointer" | "mixed" | "unknown";
  workspaceDensity: "low" | "medium" | "high" | "unknown";
  stabilityToken: string;
};

function postureOf(widthPx: number, heightPx: number): WorkspacePosture {
  return widthPx > heightPx ? "landscape" : "portrait";
}

function profileAffinityFor(mode: WorkspaceModeId): WorkspaceModePlan["profileAffinity"] {
  switch (mode) {
    case "browse":
      return "COMPACT";
    case "compact-workspace":
      return "COMFORT";
    case "hybrid-workspace":
      return "COMFORT";
    case "full-workspace":
      return "EXPANDED";
    case "professional-workspace":
      return "PROFESSIONAL";
  }
}

function demoteMode(mode: WorkspaceModeId): WorkspaceModeId {
  switch (mode) {
    case "professional-workspace":
      return "full-workspace";
    case "full-workspace":
      return "hybrid-workspace";
    case "hybrid-workspace":
      return "compact-workspace";
    case "compact-workspace":
      return "browse";
    case "browse":
      return "browse";
  }
}

/**
 * Resolve WMS Workspace Mode + Posture from AvailableSpace only.
 *
 * Deterministic: same numeric inputs + bands → same plan.
 * No UA, OS, device names, randomness, or async.
 */
export function resolveWorkspaceMode(
  input: WorkspaceModeResolveInput,
): WorkspaceModePlan {
  const bands = input.bands ?? WORKSPACE_MODE_BANDS;
  const widthPx = Math.max(0, Math.floor(input.usableWidthPx));
  const heightPx = Math.max(0, Math.floor(input.usableHeightPx));
  const posture = postureOf(widthPx, heightPx);
  const workingAreaPx = widthPx * heightPx;
  const interactionSpace = input.interactionSpace ?? "unknown";
  const workspaceDensity = input.workspaceDensity ?? "unknown";

  let mode: WorkspaceModeId;
  let landscapeCarveOut = false;

  if (widthPx >= bands.expandedMaxExclusive) {
    mode = "professional-workspace";
  } else if (widthPx >= bands.comfortMaxExclusive) {
    mode = "full-workspace";
  } else if (widthPx >= bands.compactMaxExclusive) {
    mode = "hybrid-workspace";
  } else if (
    posture === "landscape" &&
    widthPx >= bands.landscapePanelMinWidthPx
  ) {
    // WMS Compact: compact width + landscape + carve-out eligibility
    mode = "compact-workspace";
    landscapeCarveOut = true;
  } else {
    mode = "browse";
  }

  let heightDemoted = false;
  if (
    heightPx < bands.shortHeightMaxExclusive &&
    (mode === "professional-workspace" || mode === "full-workspace")
  ) {
    mode = demoteMode(mode);
    heightDemoted = true;
  }

  // interactionSpace / workspaceDensity intentionally unused for Mode selection (1B.1).

  const stabilityToken = `wx-mode:${widthPx}x${heightPx}:${mode}:${posture}:hd${heightDemoted ? 1 : 0}`;

  return {
    mode,
    posture,
    usableWidthPx: widthPx,
    usableHeightPx: heightPx,
    workingAreaPx,
    heightDemoted,
    profileAffinity: profileAffinityFor(mode),
    landscapeCarveOut,
    interactionSpace,
    workspaceDensity,
    stabilityToken,
  };
}

/** Strict equality of Mode plans (excludes optional forward-compat fields that must not affect Mode). */
export function isSameWorkspaceModePlan(
  a: WorkspaceModePlan,
  b: WorkspaceModePlan,
): boolean {
  return (
    a.mode === b.mode &&
    a.posture === b.posture &&
    a.usableWidthPx === b.usableWidthPx &&
    a.usableHeightPx === b.usableHeightPx &&
    a.heightDemoted === b.heightDemoted &&
    a.landscapeCarveOut === b.landscapeCarveOut &&
    a.stabilityToken === b.stabilityToken
  );
}
