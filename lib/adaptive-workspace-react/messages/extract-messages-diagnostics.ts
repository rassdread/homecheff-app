/**
 * Extract Messages shadow diagnostics from a Layout Plan.
 * No Domain State. Canonical strings only.
 */

import type { WorkspaceLayoutPlan } from "@/lib/adaptive-workspace";
import {
  MESSAGES_CHAT_PRESERVATION_KEY,
  MESSAGES_CHAT_WIDGET_ID,
  MESSAGES_LIST_PRESERVATION_KEY,
  MESSAGES_LIST_WIDGET_ID,
  type MessagesPresentationIntent,
  type MessagesShadowDiagnostics,
  type MessagesShadowScenario,
} from "./messages-shadow-types";

export function emptyMessagesShadowDiagnostics(): MessagesShadowDiagnostics {
  return {
    scenario: "idle",
    primaryTask: "",
    primaryWidget: "",
    hasActiveConversation: false,
    listMode: "",
    listRegion: "",
    listPlacement: "none",
    conversationMode: "",
    conversationRegion: "",
    conversationPlacement: "none",
    split: false,
    collapse: "",
    focusIntent: "none",
    transitionIntent: "none",
    lifecycleIntents: "",
    preservationKeys: `${MESSAGES_LIST_PRESERVATION_KEY},${MESSAGES_CHAT_PRESERVATION_KEY}`,
    diagnosticCodes: "",
    stageCount: 0,
  };
}

function scenarioFor(
  intent: MessagesPresentationIntent | null | undefined,
  plan: WorkspaceLayoutPlan | null | undefined,
): MessagesShadowScenario {
  if (!intent || !plan) return "idle";
  if (!intent.hasActiveConversation) return "list-primary";
  const listPlaced = plan.placements.some(
    (p) => p.widgetId === MESSAGES_LIST_WIDGET_ID,
  );
  if (!listPlaced) return "chat-primary-no-list";
  if (plan.profile === "COMPACT") return "chat-primary-compact";
  return "chat-primary-split";
}

export function extractMessagesShadowDiagnostics(
  plan: WorkspaceLayoutPlan | null | undefined,
  intent: MessagesPresentationIntent | null | undefined,
  primaryTask: string,
): MessagesShadowDiagnostics {
  const base = emptyMessagesShadowDiagnostics();
  if (!plan) {
    return {
      ...base,
      primaryTask,
      hasActiveConversation: Boolean(intent?.hasActiveConversation),
      scenario: scenarioFor(intent, plan),
    };
  }

  const list = plan.placements.find((p) => p.widgetId === MESSAGES_LIST_WIDGET_ID);
  const chat = plan.placements.find((p) => p.widgetId === MESSAGES_CHAT_WIDGET_ID);
  const collapse = plan.diagnostics.fallbacks
    .filter(
      (f) =>
        f.widgetId === MESSAGES_LIST_WIDGET_ID ||
        f.widgetId === MESSAGES_CHAT_WIDGET_ID,
    )
    .map((f) => `${f.widgetId}:${f.from}->${f.to}`)
    .join(";");

  const life = plan.lifecycleIntents
    .filter(
      (l) =>
        l.widgetId === MESSAGES_LIST_WIDGET_ID ||
        l.widgetId === MESSAGES_CHAT_WIDGET_ID,
    )
    .map((l) => `${l.widgetId}:${l.intent}`)
    .join(";");

  const keys = [
    ...new Set(
      plan.placements
        .filter(
          (p) =>
            p.widgetId === MESSAGES_LIST_WIDGET_ID ||
            p.widgetId === MESSAGES_CHAT_WIDGET_ID,
        )
        .map((p) => p.statePreservationKey),
    ),
  ].sort();

  // COMPACT + active: list not placed → hidden (keep-alive via key stability)
  let listPlacement: MessagesShadowDiagnostics["listPlacement"] = "none";
  if (list) listPlacement = "placed";
  else if (intent?.hasActiveConversation) listPlacement = "hidden";

  const stageCount = plan.panels.filter((p) => p.mode === "stage").length;
  const split =
    Boolean(list) &&
    Boolean(chat) &&
    chat?.regionId === "primary-stage" &&
    (list?.mode === "split" || list?.mode === "rail");

  return {
    scenario: scenarioFor(intent, plan),
    primaryTask,
    primaryWidget: plan.primaryWidgetId ?? "",
    hasActiveConversation: Boolean(intent?.hasActiveConversation),
    listMode: list?.mode ?? "",
    listRegion: list?.regionId ?? "",
    listPlacement,
    conversationMode: chat?.mode ?? "",
    conversationRegion: chat?.regionId ?? "",
    conversationPlacement: chat ? "placed" : "none",
    split,
    collapse,
    focusIntent: plan.focusIntent.trap
      ? `trap:${plan.focusIntent.targetWidgetId ?? ""}`
      : `preserve:${plan.focusIntent.recovery ?? "none"}`,
    transitionIntent: plan.transitionIntent,
    lifecycleIntents: life,
    preservationKeys:
      keys.length > 0
        ? keys.join(",")
        : `${MESSAGES_LIST_PRESERVATION_KEY},${MESSAGES_CHAT_PRESERVATION_KEY}`,
    diagnosticCodes: plan.diagnostics.diagnosticCodes.join(","),
    stageCount,
  };
}
