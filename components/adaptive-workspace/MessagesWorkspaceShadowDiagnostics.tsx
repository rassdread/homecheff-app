"use client";

/**
 * Messages shadow diagnostics seam — Phase 2E.
 * Diagnostics live on SettingsWorkspaceShadowRoot data-aw-messages-* attrs.
 * No panel renderer. No Domain State. No route/selection mutation.
 */
export type {
  MessagesPresentationIntent,
  MessagesShadowDiagnostics,
} from "@/lib/adaptive-workspace-react";
