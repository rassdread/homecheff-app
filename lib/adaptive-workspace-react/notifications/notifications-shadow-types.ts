/**
 * Phase 2D — Notifications presentation intent (NOT Domain State).
 *
 * Allowed: open/closed request, preferred panel mode, optional pin flag.
 * Forbidden: notification records, unread counts, API payloads, user ids.
 */

import type { PanelMode } from "@/lib/adaptive-workspace";

export const NOTIFICATIONS_INBOX_WIDGET_ID = "notifications.inbox" as const;
export const NOTIFICATIONS_INBOX_PRESERVATION_KEY =
  "notifications.inbox" as const;

/** Modes allowed for Settings-pilot Notifications supporting/transient. */
export const NOTIFICATIONS_ALLOWED_PREFERRED_MODES = [
  "rail",
  "sheet",
  "overlay",
] as const;

export type NotificationsPreferredMode =
  (typeof NOTIFICATIONS_ALLOWED_PREFERRED_MODES)[number];

/**
 * Pure presentation intent — fixture / test / future read-only observation.
 * Never populated from notification Domain State.
 */
export type NotificationsPresentationIntent = {
  /** Whether the inbox panel is requested open in shadow evaluation. */
  isRequestedOpen: boolean;
  /** Optional preferred mode; must be rail|sheet|overlay when set. */
  preferredMode?: NotificationsPreferredMode | PanelMode;
  /**
   * Product today has no notifications pin — when true, adapter rejects
   * pin and falls back to open (or empty) without Domain State.
   */
  isPinned?: boolean;
  /** Explicit close request (no open). */
  isRequestedClose?: boolean;
};

export type NotificationsShadowDiagnostics = {
  candidate: boolean;
  request: "none" | "open" | "close" | "pin-rejected";
  mode: string;
  region: string;
  placement: "none" | "placed" | "rejected";
  collapse: string;
  focusTrap: boolean;
  focusIntent: string;
  transitionIntent: string;
  lifecycleIntent: string;
  preservationKey: string;
  diagnosticCodes: string;
  rejectionReason: string;
};
