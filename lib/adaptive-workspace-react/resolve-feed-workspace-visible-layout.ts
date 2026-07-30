/**
 * Pure Feed Workspace visible-layout resolver.
 *
 * AvailableSpace first (usable width × height). No user-agent detection.
 * Orientation derived from width vs height only.
 *
 * Panel budget is presentation-only — does not touch GeoFeed ownership.
 */

export type FeedWorkspaceOrientation = "portrait" | "landscape";

export type FeedWorkspaceLayoutMode =
  | "mobile-portrait"
  | "mobile-landscape"
  | "tablet-portrait"
  | "tablet-landscape"
  | "desktop"
  | "desktop-wide";

export type FeedWorkspaceVisibleLayoutPlan = {
  layoutMode: FeedWorkspaceLayoutMode;
  orientation: FeedWorkspaceOrientation;
  profile: "COMPACT" | "COMFORT" | "EXPANDED" | "PROFESSIONAL";
  /** Persistent supporting panels to show (0–2). */
  supportingPanelCount: number;
  showStartPanel: boolean;
  showEndPanel: boolean;
  /** CSS grid template columns for the workspace shell. */
  gridTemplateColumns: string;
  usableWidthPx: number;
  usableHeightPx: number;
  stabilityToken: string;
};

/** Injectable bands — not CSS media-query clones; AvailableSpace thresholds. */
export type FeedWorkspaceLayoutBands = {
  /** Below this width → compact / single column (unless landscape carve-out). */
  compactMaxExclusive: number;
  /** Below this → comfort (1 panel). */
  comfortMaxExclusive: number;
  /** Below this → expanded (2 panels). */
  expandedMaxExclusive: number;
  /** Min width to allow a landscape side panel despite short height. */
  landscapePanelMinWidthPx: number;
};

export const FEED_WORKSPACE_LAYOUT_BANDS: FeedWorkspaceLayoutBands = {
  compactMaxExclusive: 720,
  comfortMaxExclusive: 1024,
  expandedMaxExclusive: 1440,
  landscapePanelMinWidthPx: 640,
};

function orientationOf(
  widthPx: number,
  heightPx: number,
): FeedWorkspaceOrientation {
  return widthPx > heightPx ? "landscape" : "portrait";
}

function profileFor(
  widthPx: number,
  bands: FeedWorkspaceLayoutBands,
): FeedWorkspaceVisibleLayoutPlan["profile"] {
  if (widthPx < bands.compactMaxExclusive) return "COMPACT";
  if (widthPx < bands.comfortMaxExclusive) return "COMFORT";
  if (widthPx < bands.expandedMaxExclusive) return "EXPANDED";
  return "PROFESSIONAL";
}

function layoutModeFor(args: {
  widthPx: number;
  heightPx: number;
  orientation: FeedWorkspaceOrientation;
  bands: FeedWorkspaceLayoutBands;
}): FeedWorkspaceLayoutMode {
  const { widthPx, orientation, bands } = args;
  if (widthPx >= bands.expandedMaxExclusive) return "desktop-wide";
  if (widthPx >= bands.comfortMaxExclusive) return "desktop";
  if (widthPx >= bands.compactMaxExclusive) {
    return orientation === "landscape" ? "tablet-landscape" : "tablet-portrait";
  }
  return orientation === "landscape" ? "mobile-landscape" : "mobile-portrait";
}

/**
 * Resolve visible panel plan from AvailableSpace.
 *
 * Landscape carve-out: when orientation is landscape and width ≥
 * landscapePanelMinWidthPx, allow exactly one supporting panel even if the
 * width band would otherwise be COMPACT — so mobile landscape ≠ stretched portrait.
 */
export function resolveFeedWorkspaceVisibleLayout(args: {
  usableWidthPx: number;
  usableHeightPx: number;
  bands?: FeedWorkspaceLayoutBands;
}): FeedWorkspaceVisibleLayoutPlan {
  const bands = args.bands ?? FEED_WORKSPACE_LAYOUT_BANDS;
  const widthPx = Math.max(0, Math.floor(args.usableWidthPx));
  const heightPx = Math.max(0, Math.floor(args.usableHeightPx));
  const orientation = orientationOf(widthPx, heightPx);
  let profile = profileFor(widthPx, bands);
  const layoutMode = layoutModeFor({ widthPx, heightPx, orientation, bands });

  let supportingPanelCount = 0;
  if (profile === "PROFESSIONAL" || profile === "EXPANDED") {
    supportingPanelCount = 2;
  } else if (profile === "COMFORT") {
    supportingPanelCount = 1;
  } else if (
    orientation === "landscape" &&
    widthPx >= bands.landscapePanelMinWidthPx
  ) {
    // Compact-width landscape: one contextual end panel (work-oriented).
    supportingPanelCount = 1;
    profile = "COMFORT";
  }

  const showStartPanel = supportingPanelCount >= 2;
  const showEndPanel = supportingPanelCount >= 1;

  let gridTemplateColumns = "minmax(0,1fr)";
  if (supportingPanelCount === 1) {
    gridTemplateColumns = "minmax(0,1fr) minmax(200px,280px)";
  } else if (supportingPanelCount >= 2) {
    gridTemplateColumns =
      "minmax(220px,280px) minmax(0,1fr) minmax(240px,320px)";
  }

  const stabilityToken = `feed-ws:${widthPx}x${heightPx}:${layoutMode}:p${supportingPanelCount}`;

  return {
    layoutMode,
    orientation,
    profile,
    supportingPanelCount,
    showStartPanel,
    showEndPanel,
    gridTemplateColumns,
    usableWidthPx: widthPx,
    usableHeightPx: heightPx,
    stabilityToken,
  };
}
