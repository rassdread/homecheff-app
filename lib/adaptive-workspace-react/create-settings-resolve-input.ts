import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  settingsHubManifest,
  type CompatibilityMode,
  type ResolveInput,
} from "@/lib/adaptive-workspace";
import type { NormalizedMeasurement } from "./workspace-runtime-types";

/**
 * Build Phase 2A ResolveInput for Settings shadow resolves.
 *
 * CHROME OCCUPANCY (Phase 2B):
 * chromeOccupied is filled with zeros — the measured container already
 * reflects space inside the existing root shell. Real chrome occupancy
 * adapters arrive in Phase 2C. Profile must never rewrite chrome in-cycle.
 */
export function createSettingsResolveInput(args: {
  measurement: NormalizedMeasurement;
  compatibilityMode: CompatibilityMode;
  reducedMotion?: boolean;
}): ResolveInput {
  const { measurement, compatibilityMode, reducedMotion = false } = args;

  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    availableSpace: {
      widthPx: measurement.widthPx,
      heightPx: measurement.heightPx,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      chromeOccupied: { top: 0, bottom: 0, start: 0, end: 0 },
      occlusions: [],
      stabilityToken: measurement.stabilityToken,
    },
    capabilities: {
      pointerFine: false,
      hover: false,
      touch: false,
      reducedMotion,
    },
    environment: {
      shell: "web",
      localeDir: "ltr",
    },
    surfaceId: "settings",
    primaryTask: "settings.edit",
    manifests: [settingsHubManifest()],
    panelRequests: [],
    preferences: {
      schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
      version: 1,
      pins: [],
    },
    accessibility: reducedMotion ? { forceReducedMotion: true } : {},
    compatibility: { mode: compatibilityMode },
  };
}
