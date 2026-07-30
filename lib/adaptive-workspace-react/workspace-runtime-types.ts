/**
 * Phase 2B/2C/2F runtime types for Settings workspace integration.
 * Does not hold Domain State; diagnostics + mode only.
 */

import type {
  CompatibilityMode,
  WorkspaceLayoutPlan,
  WorkspaceProfile,
} from "@/lib/adaptive-workspace";
import type { WorkspaceChromeOccupancy } from "./chrome-occupancy-types";
import type { NotificationsShadowDiagnostics } from "./notifications/notifications-shadow-types";
import type { MessagesShadowDiagnostics } from "./messages/messages-shadow-types";
import type {
  AdaptiveWorkspaceSettingsMode,
  SettingsWorkspaceModeSource,
} from "./settings-mode";

export type { AdaptiveWorkspaceSettingsMode, SettingsWorkspaceModeSource };

export type SettingsShadowDiagnostics = {
  compatibilityMode: CompatibilityMode;
  surfaceId: "settings";
  /** Raw / usable container width (MODEL A — same). */
  widthPx: number;
  heightPx: number;
  rawWidthPx: number;
  rawHeightPx: number;
  usableWidthPx: number;
  usableHeightPx: number;
  stabilityToken: string;
  resolveStabilityToken: string;
  profile: WorkspaceProfile | null;
  primaryWidgetId: string | null;
  renderActivation: boolean;
  panelCount: number;
  diagnosticCodes: readonly string[];
  resolveCount: number;
  lastStatus: "idle" | "ok" | "fallback" | "error" | "skipped";
  lastErrorCode?: string;
  /** Phase 2C chrome occupancy diagnostics */
  chromeSchemaVersion: number;
  chromeTopPx: number;
  chromeBottomPx: number;
  chromeStartPx: number;
  chromeEndPx: number;
  chromeSafeAreaSummary: string;
  chromeSources: string;
  chromeStabilityToken: string;
  chromeUpdateCount: number;
  chromeIgnoredIdenticalCount: number;
  chromeAppliedToUsableSpace: boolean;
  lastNormalizationStatus: "ok" | "fallback" | "error" | "idle" | "skipped";
  /** Phase 2D Notifications shadow diagnostics (presentation only). */
  notifications: NotificationsShadowDiagnostics;
  /** Phase 2E Messages shadow diagnostics (fixture-only; idle when unset). */
  messages: MessagesShadowDiagnostics;
};

/** Phase 2F ON-pilot diagnostics (extends shadow fields; no Domain State). */
export type SettingsOnPilotDiagnostics = SettingsShadowDiagnostics & {
  effectiveMode: AdaptiveWorkspaceSettingsMode;
  requestedMode: AdaptiveWorkspaceSettingsMode | string;
  modeSource: SettingsWorkspaceModeSource | string;
  renderOwner: "legacy" | "workspace" | "legacy-fallback" | "none";
  planValidationStatus: "idle" | "ok" | "invalid" | "error";
  fallbackActive: boolean;
  renderedSurface: "settings" | null;
  renderedRegionId: string | null;
  renderedSlotId: string | null;
  renderedPanelId: string | null;
  renderedWidgetId: string | null;
  preservationKey: string | null;
  planToken: string;
  singleWriterStatus: "ok" | "violation";
  rejectedWidgetIds: string;
  ignoredMeasurementCount: number;
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
  chromeOccupancy: WorkspaceChromeOccupancy | null;
};
