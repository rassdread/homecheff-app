import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  notificationsInboxManifest,
  settingsHubManifest,
  type CompatibilityMode,
  type ResolveInput,
} from "@/lib/adaptive-workspace";
import type { NormalizedMeasurement } from "../workspace-runtime-types";
import type {
  ChromeOccupancyShell,
  WorkspaceChromeOccupancy,
} from "../chrome-occupancy-types";
import { emptyChromeOccupancy } from "../build-chrome-occupancy";
import {
  buildSettingsResolveStabilityToken,
  usableDimensionsFromContainerFirst,
} from "../usable-space-from-occupancy";
import { createNotificationsPanelRequest } from "./create-notifications-panel-request";
import type { NotificationsPresentationIntent } from "./notifications-shadow-types";

/**
 * Settings + optional Notifications shadow ResolveInput (Phase 2D).
 *
 * - Settings primary remains settings.hub
 * - Notifications.inbox included as supporting/transient candidate only
 * - panelRequests only when presentation intent requests open/close
 * - No Notification Domain State
 * - chromeOccupied diagnostic only (MODEL A)
 */
export function createSettingsNotificationsResolveInput(args: {
  measurement: NormalizedMeasurement;
  compatibilityMode: CompatibilityMode;
  reducedMotion?: boolean;
  chromeOccupancy?: WorkspaceChromeOccupancy | null;
  shell?: ChromeOccupancyShell;
  /** Presentation intent only — never Domain State. */
  notificationsPresentation?: NotificationsPresentationIntent | null;
}): {
  input: ResolveInput;
  notificationsRequestWarnings: readonly string[];
  notificationsRequestKind: "none" | "open" | "close" | "pin-rejected";
} {
  const {
    measurement,
    compatibilityMode,
    reducedMotion = false,
    shell = "web",
    notificationsPresentation = null,
  } = args;

  const occupancy = args.chromeOccupancy ?? emptyChromeOccupancy();
  const usable = usableDimensionsFromContainerFirst(measurement, occupancy);
  const stabilityToken = buildSettingsResolveStabilityToken(
    { ...measurement, widthPx: usable.widthPx, heightPx: usable.heightPx },
    occupancy,
  );

  const { requests, warnings } = createNotificationsPanelRequest(
    notificationsPresentation,
  );

  let notificationsRequestKind: "none" | "open" | "close" | "pin-rejected" =
    "none";
  if (notificationsPresentation?.isPinned && !notificationsPresentation.isRequestedOpen) {
    notificationsRequestKind = "pin-rejected";
  } else if (requests.some((r) => r.intent === "open")) {
    notificationsRequestKind = "open";
  } else if (requests.some((r) => r.intent === "close")) {
    notificationsRequestKind = "close";
  }

  const input: ResolveInput = {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    availableSpace: {
      widthPx: usable.widthPx,
      heightPx: usable.heightPx,
      safeArea: { top: 0, right: 0, bottom: 0, left: 0 },
      chromeOccupied: {
        top: occupancy.topPx,
        bottom: occupancy.bottomPx,
        start: occupancy.startPx,
        end: occupancy.endPx,
      },
      occlusions: [],
      stabilityToken,
    },
    capabilities: {
      pointerFine: false,
      hover: false,
      touch: false,
      reducedMotion,
    },
    environment: {
      shell,
      localeDir: "ltr",
    },
    surfaceId: "settings",
    primaryTask: "settings.edit",
    manifests: [settingsHubManifest(), notificationsInboxManifest()],
    panelRequests: [...requests],
    preferences: {
      schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
      version: 1,
      pins: [],
    },
    accessibility: reducedMotion ? { forceReducedMotion: true } : {},
    compatibility: { mode: compatibilityMode },
  };

  return {
    input,
    notificationsRequestWarnings: warnings,
    notificationsRequestKind,
  };
}
