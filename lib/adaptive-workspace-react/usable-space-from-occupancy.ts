import type { NormalizedMeasurement } from "./workspace-runtime-types";
import type { WorkspaceChromeOccupancy } from "./chrome-occupancy-types";
import { emptyChromeOccupancy } from "./build-chrome-occupancy";

/**
 * Combined resolve stability token (usable container + chrome diagnostics).
 * Example: settings:1280x720:chrome-64-92-0-0:v1
 *
 * No timestamps / UUIDs.
 */
export function buildSettingsResolveStabilityToken(
  measurement: NormalizedMeasurement,
  occupancy: WorkspaceChromeOccupancy | null | undefined,
): string {
  const chrome = occupancy ?? emptyChromeOccupancy();
  return `settings:${measurement.widthPx}x${measurement.heightPx}:${chrome.stabilityToken}`;
}

/**
 * MODEL A usable space: container measurement is already usable.
 * Never subtract occupancy from width/height (Preference B / fixed-point).
 * Clamp is a no-op safeguard if invalid occupancy arrives.
 */
export function usableDimensionsFromContainerFirst(
  measurement: NormalizedMeasurement,
  _occupancy: WorkspaceChromeOccupancy | null | undefined,
): { widthPx: number; heightPx: number } {
  // Explicitly ignore occupancy for usable dims — double-subtract prevention.
  return {
    widthPx: measurement.widthPx,
    heightPx: measurement.heightPx,
  };
}
