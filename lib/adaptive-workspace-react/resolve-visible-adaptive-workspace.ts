/**
 * WX Phase 1C — Visible Adaptive Workspace presentation consumer.
 *
 * Pure · deterministic · side-effect free · UI-independent.
 * Consumes existing layout + landscape-posture plans only.
 * Does NOT extend Mode / Capability / Presentation / Assist / Disclosure /
 * Tool / Honesty / Priority / Relevance / Intent planners.
 * Does NOT own GeoFeed, Host, nav IA, or scroll systems.
 *
 * AvailableSpace-first: layoutMode labels are diagnostic class names derived
 * from usable geometry — never from user-agent / device identity.
 */

import {
  resolveFeedWorkspaceVisibleLayout,
  type FeedWorkspaceLayoutMode,
  type FeedWorkspaceVisibleLayoutPlan,
} from "./resolve-feed-workspace-visible-layout";
import {
  resolveLandscapeWorkPosture,
  type LandscapeWorkPosturePlan,
} from "./resolve-landscape-work-posture";

export const VISIBLE_ADAPTIVE_WORKSPACE = {
  phase: "1c",
  contractId: "wx-visible-adaptive-workspace-v1",
  neverInspectUserAgent: true,
  neverInspectDevice: true,
  presentationOnly: true,
  consumesExistingPlanners: true,
  neverExtendsPlanners: true,
} as const;

/** Human workspace class used in Phase 1C specs (labels only). */
export type VisibleAdaptiveWorkspaceClass =
  | "phone-portrait"
  | "phone-landscape"
  | "tablet-portrait"
  | "tablet-landscape"
  | "laptop"
  | "desktop"
  | "ultrawide";

export type VisibleAdaptiveDensity = "browse" | "work" | "pro";

export type VisibleAdaptiveScrollOwner = "document" | "feed";

export type VisibleAdaptiveChromeInset = {
  /** CSS calc fragment reserved above the workspace frame (top nav). */
  topRem: number;
  /** CSS calc fragment reserved below (bottom nav). 0 in landscape work posture. */
  bottomRem: number;
  /** Combined shell height: calc(100dvh - topRem - bottomRem). */
  frameHeightCss: string;
};

export type VisibleAdaptiveWorkspacePlan = {
  contractId: typeof VISIBLE_ADAPTIVE_WORKSPACE.contractId;
  phase: typeof VISIBLE_ADAPTIVE_WORKSPACE.phase;
  workspaceClass: VisibleAdaptiveWorkspaceClass;
  layoutMode: FeedWorkspaceLayoutMode;
  density: VisibleAdaptiveDensity;
  chromeInset: VisibleAdaptiveChromeInset;
  orientationCompact: boolean;
  bottomNavCollapsed: boolean;
  showStartRail: boolean;
  showEndRail: boolean;
  /** When true, full filters occupy start rail; stage keeps compact discovery chrome. */
  railOwnsFilters: boolean;
  /** Stage keeps progressive/in-column filters (no start rail). */
  stageOwnsFilters: boolean;
  scrollOwner: VisibleAdaptiveScrollOwner;
  stageGutterFill: boolean;
  feedColumnMaxWidthPx: number;
  interactionPriority: readonly string[];
  usableWidthPx: number;
  usableHeightPx: number;
  stabilityToken: string;
};

const INTERACTION_PRIORITY_BY_CLASS: Record<
  VisibleAdaptiveWorkspaceClass,
  readonly string[]
> = {
  "phone-portrait": [
    "feed",
    "search",
    "create",
    "filters",
    "navigation",
  ],
  "phone-landscape": [
    "feed",
    "create",
    "search",
    "filters",
    "navigation",
  ],
  "tablet-portrait": [
    "feed",
    "search",
    "filters",
    "create",
    "rails",
  ],
  "tablet-landscape": [
    "feed",
    "filters",
    "create",
    "search",
    "rails",
  ],
  laptop: [
    "feed",
    "filters",
    "create",
    "search",
    "rails",
  ],
  desktop: [
    "feed",
    "filters",
    "create",
    "search",
    "rails",
    "context",
  ],
  ultrawide: [
    "feed",
    "filters",
    "create",
    "search",
    "rails",
    "context",
    "density",
  ],
};

export function workspaceClassFromLayoutMode(
  layoutMode: FeedWorkspaceLayoutMode,
): VisibleAdaptiveWorkspaceClass {
  switch (layoutMode) {
    case "mobile-portrait":
      return "phone-portrait";
    case "mobile-landscape":
      return "phone-landscape";
    case "tablet-portrait":
      return "tablet-portrait";
    case "tablet-landscape":
      return "tablet-landscape";
    case "desktop":
      return "laptop";
    case "desktop-wide":
      return "ultrawide";
    default:
      return "desktop";
  }
}

/**
 * Map AvailableSpace width band → laptop vs desktop class.
 * desktop layoutMode (1024–1439) splits: <1200 laptop, ≥1200 desktop.
 * Threshold uses usable container width (padding may shrink vs viewport).
 */
export function refineWorkspaceClass(
  layoutMode: FeedWorkspaceLayoutMode,
  usableWidthPx: number,
): VisibleAdaptiveWorkspaceClass {
  if (layoutMode === "desktop") {
    return usableWidthPx < 1200 ? "laptop" : "desktop";
  }
  return workspaceClassFromLayoutMode(layoutMode);
}

function densityFor(
  workspaceClass: VisibleAdaptiveWorkspaceClass,
  posture: LandscapeWorkPosturePlan,
): VisibleAdaptiveDensity {
  if (
    workspaceClass === "ultrawide" ||
    workspaceClass === "desktop"
  ) {
    return "pro";
  }
  if (posture.workPostureActive || workspaceClass === "laptop") {
    return "work";
  }
  return "browse";
}

function chromeInsetFor(
  posture: LandscapeWorkPosturePlan,
): VisibleAdaptiveChromeInset {
  /**
   * WX 1B.4.1 — short landscape homepage suppresses the global navbar;
   * the single work bar lives inside the workspace frame (orientation slot).
   */
  const topRem = posture.shortChromeCompact ? 0 : 3.5;
  const bottomRem = posture.bottomNavCollapsed ? 0 : 5;
  const total = topRem + bottomRem;
  return {
    topRem,
    bottomRem,
    frameHeightCss:
      total === 0 ? "100dvh" : `calc(100dvh - ${total}rem)`,
  };
}

/**
 * Resolve visible adaptive presentation from AvailableSpace.
 * Composes existing layout + landscape posture — no new decision planners.
 */
export function resolveVisibleAdaptiveWorkspace(args: {
  usableWidthPx: number;
  usableHeightPx: number;
  layoutPlan?: FeedWorkspaceVisibleLayoutPlan;
  posturePlan?: LandscapeWorkPosturePlan;
}): VisibleAdaptiveWorkspacePlan {
  const layoutPlan =
    args.layoutPlan ??
    resolveFeedWorkspaceVisibleLayout({
      usableWidthPx: args.usableWidthPx,
      usableHeightPx: args.usableHeightPx,
    });
  const posturePlan =
    args.posturePlan ??
    resolveLandscapeWorkPosture({
      usableWidthPx: layoutPlan.usableWidthPx,
      usableHeightPx: layoutPlan.usableHeightPx,
    });

  const workspaceClass = refineWorkspaceClass(
    layoutPlan.layoutMode,
    layoutPlan.usableWidthPx,
  );
  const density = densityFor(workspaceClass, posturePlan);
  const chromeInset = chromeInsetFor(posturePlan);
  const showStartRail = layoutPlan.showStartPanel;
  const showEndRail = layoutPlan.showEndPanel;
  const multiCol = layoutPlan.supportingPanelCount > 0;
  const railOwnsFilters = showStartRail;
  const stageOwnsFilters = !railOwnsFilters;

  return {
    contractId: VISIBLE_ADAPTIVE_WORKSPACE.contractId,
    phase: VISIBLE_ADAPTIVE_WORKSPACE.phase,
    workspaceClass,
    layoutMode: layoutPlan.layoutMode,
    density,
    chromeInset,
    orientationCompact: posturePlan.orientationCompact,
    bottomNavCollapsed: posturePlan.bottomNavCollapsed,
    showStartRail,
    showEndRail,
    railOwnsFilters,
    stageOwnsFilters,
    scrollOwner: multiCol ? "feed" : "document",
    stageGutterFill: multiCol && layoutPlan.feedColumnMaxWidthPx > 0,
    feedColumnMaxWidthPx: layoutPlan.feedColumnMaxWidthPx,
    interactionPriority: INTERACTION_PRIORITY_BY_CLASS[workspaceClass],
    usableWidthPx: layoutPlan.usableWidthPx,
    usableHeightPx: layoutPlan.usableHeightPx,
    stabilityToken: `wx-1c:${layoutPlan.usableWidthPx}x${layoutPlan.usableHeightPx}:${workspaceClass}:${density}:r${showStartRail ? 1 : 0}${showEndRail ? 1 : 0}`,
  };
}

export function isSameVisibleAdaptiveWorkspacePlan(
  a: VisibleAdaptiveWorkspacePlan,
  b: VisibleAdaptiveWorkspacePlan,
): boolean {
  return a.stabilityToken === b.stabilityToken;
}
