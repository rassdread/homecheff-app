/**
 * Phase 2E — Messages presentation intent (NOT Domain State).
 *
 * hasActiveConversation is an abstract prerequisite — never a conversation id.
 */

import type { PanelMode } from "@/lib/adaptive-workspace";

export const MESSAGES_LIST_WIDGET_ID = "messages.list" as const;
export const MESSAGES_CHAT_WIDGET_ID = "messages.chat" as const;
export const MESSAGES_LIST_PRESERVATION_KEY = "messages.list" as const;
export const MESSAGES_CHAT_PRESERVATION_KEY = "messages.chat" as const;

export const MESSAGES_PRESENTATION_SCHEMA_VERSION = 1 as const;

export const MESSAGES_LIST_PREFERRED_MODES = [
  "stage",
  "split",
  "rail",
] as const;

export type MessagesListPreferredMode =
  (typeof MESSAGES_LIST_PREFERRED_MODES)[number];

/**
 * Pure fixture intent — no conversationId, drafts, messages, unread, etc.
 */
export type MessagesPresentationIntent = {
  schemaVersion: typeof MESSAGES_PRESENTATION_SCHEMA_VERSION;
  /** Abstract: whether a conversation is active (no id). */
  hasActiveConversation: boolean;
  /** When active: request list as supporting (default true). */
  listRequestedVisible?: boolean;
  preferredListMode?: MessagesListPreferredMode | PanelMode;
  localeDir?: "ltr" | "rtl";
  reducedMotion?: boolean;
  /**
   * When true, adapter attaches a keyboard occlusion fixture to AvailableSpace.
   * Resolver does not detect keyboards — fixture only (AWV-011 boundary).
   */
  keyboardOcclusionFixture?: boolean;
};

export type MessagesShadowScenario =
  | "list-primary"
  | "chat-primary-compact"
  | "chat-primary-split"
  | "chat-primary-no-list"
  | "idle";

export type MessagesShadowDiagnostics = {
  scenario: MessagesShadowScenario;
  primaryTask: string;
  primaryWidget: string;
  hasActiveConversation: boolean;
  listMode: string;
  listRegion: string;
  listPlacement: "none" | "placed" | "hidden";
  conversationMode: string;
  conversationRegion: string;
  conversationPlacement: "none" | "placed";
  split: boolean;
  collapse: string;
  focusIntent: string;
  transitionIntent: string;
  lifecycleIntents: string;
  preservationKeys: string;
  diagnosticCodes: string;
  stageCount: number;
};
