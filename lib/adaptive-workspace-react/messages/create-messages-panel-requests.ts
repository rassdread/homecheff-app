/**
 * Pure Messages panel-request adapter — Phase 2E.
 * Deterministic. No Domain State. No React. No routes.
 */

import type { PanelMode, PanelRequest } from "@/lib/adaptive-workspace";
import {
  MESSAGES_LIST_PREFERRED_MODES,
  MESSAGES_LIST_WIDGET_ID,
  type MessagesPresentationIntent,
} from "./messages-shadow-types";

export type CreateMessagesPanelRequestsResult = {
  requests: readonly PanelRequest[];
  primaryTask: "messages.list" | "messages.chat";
  warnings: readonly string[];
};

function isAllowedListMode(mode: unknown): mode is PanelMode {
  return (
    typeof mode === "string" &&
    (MESSAGES_LIST_PREFERRED_MODES as readonly string[]).includes(mode)
  );
}

/**
 * Map presentation intent → primaryTask + panelRequests.
 *
 * No active conversation → messages.list primary; no supporting requests.
 * Active conversation → messages.chat primary; optional list supporting open.
 */
export function createMessagesPanelRequests(
  intent: MessagesPresentationIntent | null | undefined,
): CreateMessagesPanelRequestsResult {
  if (!intent) {
    return {
      requests: [],
      primaryTask: "messages.list",
      warnings: [],
    };
  }

  const warnings: string[] = [];

  if (!intent.hasActiveConversation) {
    return {
      requests: [],
      primaryTask: "messages.list",
      warnings,
    };
  }

  const listVisible = intent.listRequestedVisible !== false;
  if (!listVisible) {
    return {
      requests: [],
      primaryTask: "messages.chat",
      warnings,
    };
  }

  let preferredMode: PanelMode = "split";
  if (intent.preferredListMode != null) {
    if (intent.preferredListMode === "stage") {
      warnings.push(
        "list stage preferred ignored while chat primary; using split",
      );
      preferredMode = "split";
    } else if (isAllowedListMode(intent.preferredListMode)) {
      preferredMode = intent.preferredListMode;
    } else {
      warnings.push(
        `unsupported preferredListMode ignored: ${String(intent.preferredListMode)}`,
      );
    }
  }

  const request: PanelRequest = {
    widgetId: MESSAGES_LIST_WIDGET_ID,
    intent: "open",
    preferredMode,
  };

  return {
    requests: [request],
    primaryTask: "messages.chat",
    warnings,
  };
}
