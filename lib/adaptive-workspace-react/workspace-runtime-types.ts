/**
 * Phase 2B runtime types for Settings shadow integration.
 * Does not execute commands/events; diagnostics only.
 */

import type {
  CompatibilityMode,
  WorkspaceLayoutPlan,
  WorkspaceProfile,
} from "@/lib/adaptive-workspace";

export type AdaptiveWorkspaceSettingsMode = "off" | "shadow";

export type SettingsShadowDiagnostics = {
  compatibilityMode: CompatibilityMode;
  surfaceId: "settings";
  widthPx: number;
  heightPx: number;
  stabilityToken: string;
  profile: WorkspaceProfile | null;
  primaryWidgetId: string | null;
  renderActivation: boolean;
  panelCount: number;
  diagnosticCodes: readonly string[];
  resolveCount: number;
  lastStatus: "idle" | "ok" | "fallback" | "error" | "skipped";
  lastErrorCode?: string;
};

export type MeasuredBox = {
  widthPx: number;
  heightPx: number;
};

export type NormalizedMeasurement = {
  widthPx: number;
  heightPx: number;
  stabilityToken: string;
};

/** Snapshot of last successful shadow plan (diagnostics only). */
export type SettingsShadowPlanSnapshot = {
  plan: WorkspaceLayoutPlan | null;
  diagnostics: SettingsShadowDiagnostics;
};
