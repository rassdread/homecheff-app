/**
 * Messages shadow ResolveInput builder — Phase 2E.
 * Surface: messages. Never Settings primary. No Domain State.
 */

import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  messagesChatManifest,
  messagesListManifest,
  type CompatibilityMode,
  type Occlusion,
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
import { createMessagesPanelRequests } from "./create-messages-panel-requests";
import {
  MESSAGES_PRESENTATION_SCHEMA_VERSION,
  type MessagesPresentationIntent,
} from "./messages-shadow-types";

export function createMessagesShadowResolveInput(args: {
  measurement: NormalizedMeasurement;
  compatibilityMode: CompatibilityMode;
  chromeOccupancy?: WorkspaceChromeOccupancy | null;
  shell?: ChromeOccupancyShell;
  messagesPresentation: MessagesPresentationIntent;
}): {
  input: ResolveInput;
  primaryTask: "messages.list" | "messages.chat";
  warnings: readonly string[];
} {
  const {
    measurement,
    compatibilityMode,
    shell = "web",
    messagesPresentation,
  } = args;

  const occupancy = args.chromeOccupancy ?? emptyChromeOccupancy();
  const usable = usableDimensionsFromContainerFirst(measurement, occupancy);
  const stabilityToken = buildSettingsResolveStabilityToken(
    { ...measurement, widthPx: usable.widthPx, heightPx: usable.heightPx },
    occupancy,
  );

  const { requests, primaryTask, warnings } =
    createMessagesPanelRequests(messagesPresentation);

  const occlusions: Occlusion[] = [];
  if (messagesPresentation.keyboardOcclusionFixture) {
    // Fixture only — does not detect live keyboard (AWV-011 boundary).
    occlusions.push({
      kind: "keyboard",
      widthPx: usable.widthPx,
      heightPx: Math.min(280, Math.floor(usable.heightPx * 0.35)),
    });
  }

  const localeDir = messagesPresentation.localeDir ?? "ltr";
  const reducedMotion = Boolean(messagesPresentation.reducedMotion);

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
      occlusions,
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
      localeDir,
    },
    surfaceId: "messages",
    primaryTask,
    manifests: [messagesListManifest(), messagesChatManifest()],
    panelRequests: [...requests],
    preferences: {
      schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
      version: 1,
      pins: [],
    },
    accessibility: reducedMotion ? { forceReducedMotion: true } : {},
    compatibility: { mode: compatibilityMode },
  };

  // schemaVersion on intent is validated lightly
  if (
    messagesPresentation.schemaVersion !== MESSAGES_PRESENTATION_SCHEMA_VERSION
  ) {
    return {
      input,
      primaryTask,
      warnings: [
        ...warnings,
        `unsupported messages presentation schemaVersion ${String(messagesPresentation.schemaVersion)}`,
      ],
    };
  }

  return { input, primaryTask, warnings };
}
