/**
 * Pure Notifications Panel Request adapter — Phase 2D.
 *
 * Deterministic. No Domain State. No timestamps. No React.
 * Product has no notifications pin → pin requests are rejected safely.
 */

import type { PanelMode, PanelRequest } from "@/lib/adaptive-workspace";
import {
  NOTIFICATIONS_ALLOWED_PREFERRED_MODES,
  NOTIFICATIONS_INBOX_WIDGET_ID,
  type NotificationsPresentationIntent,
  type NotificationsPreferredMode,
} from "./notifications-shadow-types";

export type CreateNotificationsPanelRequestResult = {
  requests: readonly PanelRequest[];
  /** Why pin/mode was adjusted — empty when clean. */
  warnings: readonly string[];
};

function isAllowedPreferredMode(
  mode: unknown,
): mode is NotificationsPreferredMode {
  return (
    typeof mode === "string" &&
    (NOTIFICATIONS_ALLOWED_PREFERRED_MODES as readonly string[]).includes(mode)
  );
}

/**
 * Map presentation intent → Phase 2A panelRequests.
 * Mutates nothing on the input object.
 */
export function createNotificationsPanelRequest(
  intent: NotificationsPresentationIntent | null | undefined,
): CreateNotificationsPanelRequestResult {
  if (!intent) {
    return { requests: [], warnings: [] };
  }

  const warnings: string[] = [];

  // Product architecture: no notifications pin support.
  if (intent.isPinned) {
    warnings.push("notifications.pin unsupported; ignored");
    if (!intent.isRequestedOpen && !intent.isRequestedClose) {
      return { requests: [], warnings };
    }
  }

  if (intent.isRequestedClose && !intent.isRequestedOpen) {
    return {
      requests: [
        {
          widgetId: NOTIFICATIONS_INBOX_WIDGET_ID,
          intent: "close",
        },
      ],
      warnings,
    };
  }

  if (!intent.isRequestedOpen) {
    return { requests: [], warnings };
  }

  let preferredMode: PanelMode | undefined;
  if (intent.preferredMode != null) {
    if (isAllowedPreferredMode(intent.preferredMode)) {
      preferredMode = intent.preferredMode;
    } else {
      warnings.push(
        `unsupported preferredMode ignored: ${String(intent.preferredMode)}`,
      );
    }
  }

  const request: PanelRequest = {
    widgetId: NOTIFICATIONS_INBOX_WIDGET_ID,
    intent: "open",
    ...(preferredMode ? { preferredMode } : {}),
  };

  return { requests: [request], warnings };
}
