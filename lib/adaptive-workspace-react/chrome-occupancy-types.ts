/**
 * Phase 2C — Chrome Occupancy contract (read-only, versioned).
 *
 * MODEL A (container-first): measured Settings container IS usable space.
 * Occupancy snapshots are diagnostic / policy input for AvailableSpace.chromeOccupied.
 * They MUST NOT be re-subtracted from widthPx/heightPx (Preference B).
 *
 * FIXED-POINT: occupancy is derived from shell + route + stable facts —
 * never from same-cycle WorkspaceProfile or Layout Plan.
 */

export const CHROME_OCCUPANCY_SCHEMA_VERSION = 1 as const;

/** Documented chrome sources that exist in HomeCheff today. */
export type ChromeOccupancySourceId =
  | "top-navigation"
  | "bottom-navigation"
  | "app-shell-inset"
  | "native-safe-area"
  | "pwa-safe-area"
  | "route-specific-chrome"
  | "none";

export type ChromeOccupancySource = {
  id: ChromeOccupancySourceId;
  /** Edge this source contributes to (logical). */
  edge: "top" | "bottom" | "start" | "end" | "safe-area";
  /** Floored px contributed to chromeOccupied for that edge (0 if diagnostic-only). */
  occupiedPx: number;
  /**
   * Safe-area already accounted for inside this source's occupiedPx
   * (or inside container / AppPageChrome pad — see flags).
   */
  includedInChromeOccupancy: boolean;
  /** True when the measured Settings container already excludes this space. */
  includedInContainerMeasurement: boolean;
};

export type ChromeSafeAreaInsets = {
  topPx: number;
  bottomPx: number;
  startPx: number;
  endPx: number;
};

/**
 * Versioned chrome occupancy snapshot.
 * Logical start/end — never left/right as contract truth.
 */
export type WorkspaceChromeOccupancy = {
  schemaVersion: typeof CHROME_OCCUPANCY_SCHEMA_VERSION;
  topPx: number;
  bottomPx: number;
  startPx: number;
  endPx: number;
  safeArea: ChromeSafeAreaInsets;
  sources: readonly ChromeOccupancySource[];
  stabilityToken: string;
  /**
   * MODEL A: false — usable dims come from container measurement;
   * occupancy is not applied as a second subtract.
   */
  appliedToUsableSpace: boolean;
};

export type ChromeOccupancyShell = "web" | "pwa" | "native";

/**
 * Explicit shell/route facts for occupancy — no Profile / Layout Plan.
 */
export type ChromeOccupancyInput = {
  shell: ChromeOccupancyShell;
  /** Pathname for legacy bottom-nav visibility (e.g. /settings). */
  pathname: string;
  /**
   * Viewport width for lg breakpoint (null on SSR → bottom unknown → 0 until client).
   * Crossing lg changes bottom occupancy without measuring chrome DOM.
   */
  viewportWidthPx: number | null;
  /**
   * Optional env(safe-area-inset-*) px when known on client.
   * SSR: omit / zeros.
   */
  safeArea?: Partial<ChromeSafeAreaInsets>;
};

export type ChromeOccupancyCoalesceResult = {
  shouldUpdate: boolean;
  next: WorkspaceChromeOccupancy;
  ignoredIdentical: boolean;
};
