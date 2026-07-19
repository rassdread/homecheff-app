/**
 * Extract compact Notifications shadow diagnostics from a Layout Plan.
 * No Domain State. Canonical strings only.
 */

import type { WorkspaceLayoutPlan } from "@/lib/adaptive-workspace";
import {
  NOTIFICATIONS_INBOX_PRESERVATION_KEY,
  NOTIFICATIONS_INBOX_WIDGET_ID,
  type NotificationsShadowDiagnostics,
} from "./notifications-shadow-types";

export function emptyNotificationsShadowDiagnostics(): NotificationsShadowDiagnostics {
  return {
    candidate: false,
    request: "none",
    mode: "",
    region: "",
    placement: "none",
    collapse: "",
    focusTrap: false,
    focusIntent: "none",
    transitionIntent: "none",
    lifecycleIntent: "",
    preservationKey: NOTIFICATIONS_INBOX_PRESERVATION_KEY,
    diagnosticCodes: "",
    rejectionReason: "",
  };
}

export function extractNotificationsShadowDiagnostics(
  plan: WorkspaceLayoutPlan | null | undefined,
  requestKind: NotificationsShadowDiagnostics["request"] = "none",
): NotificationsShadowDiagnostics {
  const base = emptyNotificationsShadowDiagnostics();
  if (!plan) {
    return { ...base, request: requestKind };
  }

  const placed = plan.placements.find(
    (p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID,
  );
  const panel = plan.panels.find(
    (p) => p.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID,
  );
  const rejected = plan.diagnostics.rejected.find(
    (r) => r.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID,
  );
  const collapse = plan.diagnostics.fallbacks.find(
    (f) => f.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID,
  );
  const life = plan.lifecycleIntents.find(
    (l) => l.widgetId === NOTIFICATIONS_INBOX_WIDGET_ID,
  );

  const focusTrap = Boolean(
    panel?.requiresFocusTrap || plan.focusIntent.trap,
  );

  return {
    candidate: requestKind === "open" || Boolean(placed) || Boolean(rejected),
    request: requestKind,
    mode: placed?.mode ?? "",
    region: placed?.regionId ?? "",
    placement: placed ? "placed" : rejected ? "rejected" : "none",
    collapse: collapse ? `${collapse.from}->${collapse.to}` : "",
    focusTrap,
    focusIntent: plan.focusIntent.trap
      ? `trap:${plan.focusIntent.targetWidgetId ?? ""}`
      : `preserve:${plan.focusIntent.recovery ?? "none"}`,
    transitionIntent: plan.transitionIntent,
    lifecycleIntent: life?.intent ?? (placed ? "VISIBLE" : ""),
    preservationKey:
      placed?.statePreservationKey ?? NOTIFICATIONS_INBOX_PRESERVATION_KEY,
    diagnosticCodes: plan.diagnostics.diagnosticCodes.join(","),
    rejectionReason: rejected?.reason ?? "",
  };
}
