/**
 * Policy constants for chrome occupancy diagnostics.
 * Sourced from repository CSS / layout helpers — not device UA.
 *
 * --hc-navbar-height: 4rem → 64px
 * AppPageChrome / bottomNavInset: 5.75rem → 92px (+ safe-area already on pad)
 * lg breakpoint: 1024 (Tailwind)
 */

import { isBottomNavigationHidden } from "@/lib/bottomNavRoutes";
import type {
  ChromeOccupancyInput,
  ChromeOccupancySource,
  ChromeSafeAreaInsets,
  WorkspaceChromeOccupancy,
} from "./chrome-occupancy-types";
import { CHROME_OCCUPANCY_SCHEMA_VERSION } from "./chrome-occupancy-types";
import { floorDimension } from "./normalize-workspace-measurement";

/** Matches `--hc-navbar-height: 4rem` (globals.css). */
export const HC_AW_NAVBAR_HEIGHT_PX = 64;

/**
 * Matches AppPageChrome max-lg pad base `5.75rem` (without safe-area).
 * Safe-area is reported separately and is already in AppPageChrome pad /
 * BottomNavigation — do not add again into usable-space math.
 */
export const HC_AW_BOTTOM_NAV_HEIGHT_PX = 92;

/** Tailwind `lg` — bottom nav hidden on web at this width and above. */
export const HC_AW_LG_BREAKPOINT_PX = 1024;

export function emptyChromeSafeArea(): ChromeSafeAreaInsets {
  return { topPx: 0, bottomPx: 0, startPx: 0, endPx: 0 };
}

export function emptyChromeOccupancy(): WorkspaceChromeOccupancy {
  return {
    schemaVersion: CHROME_OCCUPANCY_SCHEMA_VERSION,
    topPx: 0,
    bottomPx: 0,
    startPx: 0,
    endPx: 0,
    safeArea: emptyChromeSafeArea(),
    sources: [{ id: "none", edge: "top", occupiedPx: 0, includedInChromeOccupancy: false, includedInContainerMeasurement: true }],
    stabilityToken: buildChromeOccupancyStabilityToken(0, 0, 0, 0),
    appliedToUsableSpace: false,
  };
}

/**
 * Deterministic occupancy token — no time / random.
 * Example: chrome-64-92-0-0:v1
 */
export function buildChromeOccupancyStabilityToken(
  topPx: number,
  bottomPx: number,
  startPx: number,
  endPx: number,
): string {
  return `chrome-${topPx}-${bottomPx}-${startPx}-${endPx}:v1`;
}

function assertNonNegFinite(label: string, n: number): number {
  if (!Number.isFinite(n) || n < 0) {
    throw Object.assign(new Error(`Invalid chrome occupancy ${label}`), {
      code: "AW.CHROME.INVALID",
    });
  }
  return floorDimension(n);
}

/**
 * Validate / canonicalize a snapshot. Rejects negatives / non-finite.
 * Unsupported schemaVersion → throw (hard in test/dev).
 */
export function validateChromeOccupancy(
  raw: WorkspaceChromeOccupancy,
): WorkspaceChromeOccupancy {
  if (raw.schemaVersion !== CHROME_OCCUPANCY_SCHEMA_VERSION) {
    throw Object.assign(
      new Error(`Unsupported chrome occupancy schemaVersion ${String(raw.schemaVersion)}`),
      { code: "AW.CHROME.SCHEMA" },
    );
  }
  const topPx = assertNonNegFinite("topPx", raw.topPx);
  const bottomPx = assertNonNegFinite("bottomPx", raw.bottomPx);
  const startPx = assertNonNegFinite("startPx", raw.startPx);
  const endPx = assertNonNegFinite("endPx", raw.endPx);
  const safeArea: ChromeSafeAreaInsets = {
    topPx: assertNonNegFinite("safeArea.topPx", raw.safeArea?.topPx ?? 0),
    bottomPx: assertNonNegFinite("safeArea.bottomPx", raw.safeArea?.bottomPx ?? 0),
    startPx: assertNonNegFinite("safeArea.startPx", raw.safeArea?.startPx ?? 0),
    endPx: assertNonNegFinite("safeArea.endPx", raw.safeArea?.endPx ?? 0),
  };
  const sources = Object.freeze([...(raw.sources ?? [])]);
  return {
    schemaVersion: CHROME_OCCUPANCY_SCHEMA_VERSION,
    topPx,
    bottomPx,
    startPx,
    endPx,
    safeArea,
    sources,
    stabilityToken: buildChromeOccupancyStabilityToken(
      topPx,
      bottomPx,
      startPx,
      endPx,
    ),
    appliedToUsableSpace: false,
  };
}

function normalizeSafeArea(
  partial?: Partial<ChromeSafeAreaInsets>,
): ChromeSafeAreaInsets {
  return {
    topPx: floorDimension(partial?.topPx ?? 0),
    bottomPx: floorDimension(partial?.bottomPx ?? 0),
    startPx: floorDimension(partial?.startPx ?? 0),
    endPx: floorDimension(partial?.endPx ?? 0),
  };
}

/**
 * Whether legacy bottom navigation is considered occupying the visual bottom
 * for diagnostic purposes on this surface.
 *
 * Uses existing `isBottomNavigationHidden` — does not reimplement policy.
 * Web: visible only below lg. Native/PWA: visible when not path-hidden.
 * Messages routes keep the bar but AppPageChrome pad is suppressed — still
 * report bottom occupancy as overlay (diagnostic); container already usable.
 */
export function isBottomNavOccupying(input: {
  pathname: string;
  shell: ChromeOccupancyInput["shell"];
  viewportWidthPx: number | null;
}): boolean {
  if (isBottomNavigationHidden(input.pathname)) return false;
  if (input.shell === "native" || input.shell === "pwa") return true;
  // SSR / unknown viewport: do not invent bottom occupancy (hydration-safe zero).
  if (input.viewportWidthPx == null) return false;
  return input.viewportWidthPx < HC_AW_LG_BREAKPOINT_PX;
}

/**
 * Build a pure chrome occupancy snapshot from shell/route facts.
 * Does NOT import resolver, Layout Plan, or Workspace Profile.
 */
export function buildChromeOccupancySnapshot(
  input: ChromeOccupancyInput,
): WorkspaceChromeOccupancy {
  const safeArea = normalizeSafeArea(input.safeArea);
  const sources: ChromeOccupancySource[] = [];

  // NavBar is in-flow ABOVE AppPageChrome — outside Settings measure root.
  // Diagnostic only; includedInContainerMeasurement=true (already excluded).
  const topPx = HC_AW_NAVBAR_HEIGHT_PX;
  sources.push({
    id: "top-navigation",
    edge: "top",
    occupiedPx: topPx,
    includedInChromeOccupancy: true,
    includedInContainerMeasurement: true,
  });

  if (input.shell === "native" && safeArea.topPx > 0) {
    sources.push({
      id: "native-safe-area",
      edge: "safe-area",
      occupiedPx: safeArea.topPx,
      // NavBar applies pt-[env(safe-area-inset-top)] — not subtracted again.
      includedInChromeOccupancy: false,
      includedInContainerMeasurement: true,
    });
  }
  if (input.shell === "pwa" && safeArea.topPx > 0) {
    sources.push({
      id: "pwa-safe-area",
      edge: "safe-area",
      occupiedPx: safeArea.topPx,
      includedInChromeOccupancy: false,
      includedInContainerMeasurement: true,
    });
  }

  let bottomPx = 0;
  if (
    isBottomNavOccupying({
      pathname: input.pathname,
      shell: input.shell,
      viewportWidthPx: input.viewportWidthPx,
    })
  ) {
    bottomPx = HC_AW_BOTTOM_NAV_HEIGHT_PX;
    sources.push({
      id: "bottom-navigation",
      edge: "bottom",
      occupiedPx: bottomPx,
      // Safe-area is on the bar + AppPageChrome pad — not inside this 92px.
      includedInChromeOccupancy: true,
      // Fixed overlay; clearance via AppPageChrome pad, not by shrinking measure box.
      includedInContainerMeasurement: true,
    });
    if (safeArea.bottomPx > 0) {
      sources.push({
        id:
          input.shell === "native"
            ? "native-safe-area"
            : input.shell === "pwa"
              ? "pwa-safe-area"
              : "app-shell-inset",
        edge: "safe-area",
        occupiedPx: safeArea.bottomPx,
        includedInChromeOccupancy: false,
        includedInContainerMeasurement: true,
      });
    }
  }

  // No side chrome in current HomeCheff shell.
  const startPx = 0;
  const endPx = 0;

  if (sources.length === 0) {
    sources.push({
      id: "none",
      edge: "top",
      occupiedPx: 0,
      includedInChromeOccupancy: false,
      includedInContainerMeasurement: true,
    });
  }

  return validateChromeOccupancy({
    schemaVersion: CHROME_OCCUPANCY_SCHEMA_VERSION,
    topPx,
    bottomPx,
    startPx,
    endPx,
    safeArea,
    sources,
    stabilityToken: "",
    appliedToUsableSpace: false,
  });
}
