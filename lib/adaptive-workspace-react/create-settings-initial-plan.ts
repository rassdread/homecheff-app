/**
 * Canonical Settings-only initial Layout Plan — Phase 2F.
 * Deterministic SSR-safe plan for settings.hub on primary-stage.
 * No Notifications/Messages. No Domain State. No timestamps/random.
 */

import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  PANEL_MODE_META,
  RESOLVE_PRECEDENCE,
  settingsHubManifest,
  type CompatibilityMode,
  type WorkspaceLayoutPlan,
  type WorkspaceProfile,
} from "@/lib/adaptive-workspace";

export const SETTINGS_HUB_WIDGET_ID = "settings.hub" as const;
export const SETTINGS_SURFACE_ID = "settings" as const;
export const SETTINGS_PRIMARY_REGION_ID = "primary-stage" as const;

export const SETTINGS_PRIMARY_SLOT_ID =
  `slot:${SETTINGS_SURFACE_ID}:${SETTINGS_PRIMARY_REGION_ID}:${SETTINGS_HUB_WIDGET_ID}` as const;
export const SETTINGS_PRIMARY_PANEL_ID =
  `panel:${SETTINGS_SURFACE_ID}:${SETTINGS_HUB_WIDGET_ID}` as const;
export const SETTINGS_PRIMARY_PLACEMENT_ID =
  `placement:${SETTINGS_HUB_WIDGET_ID}` as const;

/**
 * Build a canonical Settings-only plan.
 * Profile defaults to COMFORT for SSR; client measurement may update metadata only.
 */
export function createSettingsInitialPlan(args?: {
  compatibilityMode?: CompatibilityMode;
  profile?: WorkspaceProfile;
  widthPx?: number;
  heightPx?: number;
  stabilityToken?: string;
}): WorkspaceLayoutPlan {
  const compatibilityMode = args?.compatibilityMode ?? "shadow";
  const profile = args?.profile ?? "COMFORT";
  const widthPx = args?.widthPx ?? 0;
  const heightPx = args?.heightPx ?? 0;
  const stabilityToken =
    args?.stabilityToken ?? "settings:initial:chrome-0-0-0-0:v1";
  const hub = settingsHubManifest();
  const meta = PANEL_MODE_META.stage;
  const renderActivation = compatibilityMode === "on";

  const focusIntent = {
    targetSlotId: SETTINGS_PRIMARY_SLOT_ID,
    targetWidgetId: SETTINGS_HUB_WIDGET_ID,
    trap: false as const,
    recovery: "preserve" as const,
  };

  const transitionIntent = "none" as const;

  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    surfaceId: SETTINGS_SURFACE_ID,
    profile,
    renderActivation,
    regions: [{ id: SETTINGS_PRIMARY_REGION_ID, slotIds: [SETTINGS_PRIMARY_SLOT_ID] }],
    slots: [
      {
        id: SETTINGS_PRIMARY_SLOT_ID,
        regionId: SETTINGS_PRIMARY_REGION_ID,
        panelId: SETTINGS_PRIMARY_PANEL_ID,
      },
    ],
    panels: [
      {
        id: SETTINGS_PRIMARY_PANEL_ID,
        slotId: SETTINGS_PRIMARY_SLOT_ID,
        mode: "stage",
        widgetId: SETTINGS_HUB_WIDGET_ID,
        takesStructuralSpace: meta.takesStructuralSpace,
        isTransient: meta.isTransient,
        requiresFocusTrap: meta.requiresFocusTrap,
      },
    ],
    placements: [
      {
        id: SETTINGS_PRIMARY_PLACEMENT_ID,
        widgetId: SETTINGS_HUB_WIDGET_ID,
        panelId: SETTINGS_PRIMARY_PANEL_ID,
        slotId: SETTINGS_PRIMARY_SLOT_ID,
        regionId: SETTINGS_PRIMARY_REGION_ID,
        mode: "stage",
        statePreservationKey: hub.statePreservationKey,
        visible: true,
      },
    ],
    primaryWidgetId: SETTINGS_HUB_WIDGET_ID,
    overflowStrategy: "none",
    focusIntent,
    transitionIntent,
    lifecycleIntents: [
      {
        widgetId: SETTINGS_HUB_WIDGET_ID,
        statePreservationKey: hub.statePreservationKey,
        intent: "VISIBLE",
      },
    ],
    diagnostics: {
      schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
      profile,
      availableSpaceSummary: {
        widthPx,
        heightPx,
        stabilityToken,
      },
      primaryWidgetId: SETTINGS_HUB_WIDGET_ID,
      precedence: RESOLVE_PRECEDENCE,
      placed: [
        {
          widgetId: SETTINGS_HUB_WIDGET_ID,
          region: SETTINGS_PRIMARY_REGION_ID,
          mode: "stage",
          reason: "settings-initial-plan",
        },
      ],
      rejected: [],
      fallbacks: [],
      preferenceWarnings: [],
      incompatibilities: [],
      compatibilityMode,
      transitionIntent,
      focusIntent,
      diagnosticCodes:
        compatibilityMode === "on"
          ? []
          : compatibilityMode === "shadow"
            ? ["AW.COMPAT.SHADOW"]
            : ["AW.COMPAT.OFF"],
      warnings: [],
    },
    navigationIntent: { landmarks: ["navigation", "primary-stage"] },
  };
}
