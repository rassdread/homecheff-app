import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  settingsHubManifest,
  type CompatibilityMode,
  type ResolveInput,
} from "@/lib/adaptive-workspace";
import type { NormalizedMeasurement } from "./workspace-runtime-types";
import type {
  ChromeOccupancyShell,
  WorkspaceChromeOccupancy,
} from "./chrome-occupancy-types";
import { emptyChromeOccupancy } from "./build-chrome-occupancy";
import {
  buildSettingsResolveStabilityToken,
  usableDimensionsFromContainerFirst,
} from "./usable-space-from-occupancy";

/**
 * Build Phase 2A ResolveInput for Settings shadow resolves.
 *
 * CHROME OCCUPANCY (Phase 2C) — MODEL A container-first:
 * - widthPx/heightPx = measured Settings container (already usable)
 * - chromeOccupied filled from diagnostic occupancy snapshot
 * - safeArea on AvailableSpace stays zeros for subtract semantics;
 *   occupancy.safeArea is carried via diagnostics / sources flags
 * - Pure resolver MUST NOT subtract chrome again (Preference B)
 * - Profile must never rewrite chrome in-cycle (fixed-point)
 */
export function createSettingsResolveInput(args: {
  measurement: NormalizedMeasurement;
  compatibilityMode: CompatibilityMode;
  reducedMotion?: boolean;
  chromeOccupancy?: WorkspaceChromeOccupancy | null;
  shell?: ChromeOccupancyShell;
}): ResolveInput {
  const {
    measurement,
    compatibilityMode,
    reducedMotion = false,
    shell = "web",
  } = args;

  const occupancy = args.chromeOccupancy ?? emptyChromeOccupancy();
  const usable = usableDimensionsFromContainerFirst(measurement, occupancy);
  const stabilityToken = buildSettingsResolveStabilityToken(
    { ...measurement, widthPx: usable.widthPx, heightPx: usable.heightPx },
    occupancy,
  );

  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    availableSpace: {
      widthPx: usable.widthPx,
      heightPx: usable.heightPx,
      // Subtract semantics: zeros — SA already in shell / container exclusion.
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      chromeOccupied: {
        top: occupancy.topPx,
        bottom: occupancy.bottomPx,
        start: occupancy.startPx,
        end: occupancy.endPx,
      },
      occlusions: [],
      stabilityToken,
    },
    capabilities: {
      pointerFine: false,
      hover: false,
      touch: false,
      reducedMotion,
    },
    environment: {
      shell,
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
