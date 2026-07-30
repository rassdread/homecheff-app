import type {
  PanelMode,
  RegionId,
  WidgetManifest,
  WorkspaceProfile,
} from "../types/workspace";

export interface SurfacePolicyWidgetSpec {
  widgetId: string;
  required?: boolean;
  defaultOpen?: boolean;
  preferredRegion?: RegionId;
  preferredModes?: readonly PanelMode[];
}

export interface SurfacePolicy {
  surfaceId: string;
  primaryTaskPrefix?: string;
  requiredWidgets: readonly SurfacePolicyWidgetSpec[];
  defaultWidgets: readonly SurfacePolicyWidgetSpec[];
  /** Profiles that may place persistent rails */
  allowPersistentRails: readonly WorkspaceProfile[];
}

export const SETTINGS_SURFACE_ID = "settings";

/**
 * Pure Settings surface policy — Phase 2A pilot only.
 * Tab/URL state is NOT resolved here (domain/URL later).
 */
export const SettingsSurfacePolicy: SurfacePolicy = {
  surfaceId: SETTINGS_SURFACE_ID,
  primaryTaskPrefix: "settings",
  requiredWidgets: [
    {
      widgetId: "settings.hub",
      required: true,
      preferredRegion: "primary-stage",
      preferredModes: ["stage"],
    },
  ],
  defaultWidgets: [],
  allowPersistentRails: ["EXPANDED", "PROFESSIONAL"],
};

/**
 * Minimal generic primary policy for abstract sealed / multi-widget
 * contract tests. NOT a production homepage/messages policy.
 */
export function createGenericPrimaryPolicy(surfaceId: string): SurfacePolicy {
  return {
    surfaceId,
    requiredWidgets: [],
    defaultWidgets: [],
    allowPersistentRails: ["COMFORT", "EXPANDED", "PROFESSIONAL"],
  };
}

export function getSurfacePolicy(surfaceId: string): SurfacePolicy {
  if (surfaceId === SETTINGS_SURFACE_ID) return SettingsSurfacePolicy;
  return createGenericPrimaryPolicy(surfaceId);
}

export function manifestSupportsSurface(
  manifest: WidgetManifest,
  surfaceId: string,
): boolean {
  return (
    manifest.supportedSurfaces.includes("*") ||
    manifest.supportedSurfaces.includes(surfaceId)
  );
}
