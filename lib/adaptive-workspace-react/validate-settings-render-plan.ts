/**
 * Settings ON render allowlist — Phase 2F.
 * Only settings.hub on primary-stage may render. Fail closed otherwise.
 */

import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  type WorkspaceLayoutPlan,
} from "@/lib/adaptive-workspace";
import {
  SETTINGS_HUB_WIDGET_ID,
  SETTINGS_PRIMARY_PANEL_ID,
  SETTINGS_PRIMARY_PLACEMENT_ID,
  SETTINGS_PRIMARY_REGION_ID,
  SETTINGS_PRIMARY_SLOT_ID,
  SETTINGS_SURFACE_ID,
} from "./create-settings-initial-plan";

export type SettingsRenderValidation =
  | { ok: true; plan: WorkspaceLayoutPlan }
  | { ok: false; code: string; reason: string };

const FORBIDDEN_WIDGET_PREFIXES = ["notifications.", "messages.", "feed."] as const;

/**
 * Validate a plan is safe for Settings ON rendering.
 */
export function validateSettingsRenderPlan(
  plan: WorkspaceLayoutPlan | null | undefined,
  expectedMode: "on" | "shadow" | "off",
): SettingsRenderValidation {
  if (!plan) {
    return { ok: false, code: "AW.RENDER.MISSING_PLAN", reason: "missing plan" };
  }
  if (plan.schemaVersion !== ADAPTIVE_WORKSPACE_SCHEMA_VERSION) {
    return {
      ok: false,
      code: "AW.RENDER.SCHEMA",
      reason: `unsupported schemaVersion ${String(plan.schemaVersion)}`,
    };
  }
  if (plan.surfaceId !== SETTINGS_SURFACE_ID) {
    return {
      ok: false,
      code: "AW.RENDER.SURFACE",
      reason: `unexpected surface ${plan.surfaceId}`,
    };
  }
  if (expectedMode === "on" && plan.renderActivation !== true) {
    return {
      ok: false,
      code: "AW.RENDER.ACTIVATION_MISMATCH",
      reason: "ON mode requires renderActivation true",
    };
  }
  if (expectedMode !== "on" && plan.renderActivation === true) {
    return {
      ok: false,
      code: "AW.RENDER.ACTIVATION_MISMATCH",
      reason: "non-ON mode must not activate render",
    };
  }

  const stagePanels = plan.panels.filter((p) => p.mode === "stage");
  if (stagePanels.length !== 1) {
    return {
      ok: false,
      code: "AW.RENDER.STAGE_COUNT",
      reason: `expected exactly one stage panel, found ${stagePanels.length}`,
    };
  }

  if (plan.primaryWidgetId !== SETTINGS_HUB_WIDGET_ID) {
    return {
      ok: false,
      code: "AW.RENDER.PRIMARY",
      reason: `primary must be ${SETTINGS_HUB_WIDGET_ID}`,
    };
  }

  const placement = plan.placements.find(
    (p) => p.widgetId === SETTINGS_HUB_WIDGET_ID,
  );
  if (!placement) {
    return {
      ok: false,
      code: "AW.RENDER.MISSING_HUB",
      reason: "settings.hub placement missing",
    };
  }
  if (placement.regionId !== SETTINGS_PRIMARY_REGION_ID) {
    return {
      ok: false,
      code: "AW.RENDER.REGION",
      reason: "settings.hub must occupy primary-stage",
    };
  }
  if (placement.statePreservationKey !== SETTINGS_HUB_WIDGET_ID) {
    return {
      ok: false,
      code: "AW.RENDER.PRESERVATION",
      reason: "invalid settings.hub preservation key",
    };
  }

  for (const p of plan.placements) {
    if (p.widgetId !== SETTINGS_HUB_WIDGET_ID) {
      return {
        ok: false,
        code: "AW.RENDER.FORBIDDEN_WIDGET",
        reason: `widget not allowlisted: ${p.widgetId}`,
      };
    }
    for (const prefix of FORBIDDEN_WIDGET_PREFIXES) {
      if (p.widgetId.startsWith(prefix)) {
        return {
          ok: false,
          code: "AW.RENDER.FORBIDDEN_WIDGET",
          reason: `forbidden widget: ${p.widgetId}`,
        };
      }
    }
  }

  // Identity continuity: prefer canonical ids; accept resolver-equivalent hub-only ids.
  if (
    placement.slotId !== SETTINGS_PRIMARY_SLOT_ID &&
    !placement.slotId.includes(SETTINGS_HUB_WIDGET_ID)
  ) {
    return {
      ok: false,
      code: "AW.RENDER.SLOT",
      reason: `unexpected slot id ${placement.slotId}`,
    };
  }
  if (
    placement.panelId !== SETTINGS_PRIMARY_PANEL_ID &&
    !placement.panelId.includes(SETTINGS_HUB_WIDGET_ID)
  ) {
    return {
      ok: false,
      code: "AW.RENDER.PANEL",
      reason: `unexpected panel id ${placement.panelId}`,
    };
  }

  void SETTINGS_PRIMARY_PLACEMENT_ID;
  return { ok: true, plan };
}

/** Explicit Settings widget allowlist. */
export function isSettingsRenderAllowlistedWidget(widgetId: string): boolean {
  return widgetId === SETTINGS_HUB_WIDGET_ID;
}
