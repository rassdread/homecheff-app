/**
 * Phase 2B/2C runtime types for Settings shadow integration.
 * Does not execute commands/events; diagnostics only.
 */

import type {
  CompatibilityMode,
  WorkspaceLayoutPlan,
  WorkspaceProfile,
} from "@/lib/adaptive-workspace";
import type { WorkspaceChromeOccupancy } from "./chrome-occupancy-types";

export type AdaptiveWorkspaceSettingsMode = "off" | "shadow";

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
