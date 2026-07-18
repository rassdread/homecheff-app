import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  type WidgetManifest,
} from "../types/workspace";

export function settingsHubManifest(
  overrides?: Partial<WidgetManifest>,
): WidgetManifest {
  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    id: "settings.hub",
    type: "standard",
    version: 1,
    supportedSurfaces: ["settings", "*"],
    constraints: { minWidth: 280, preferredWidth: 720, minHeight: 320 },
    preferredRegion: "primary-stage",
    allowedPanelModes: ["stage"],
    canBePrimary: true,
    canPersist: true,
    canFloat: false,
    canOverlay: false,
    priority: 100,
    collapseBehavior: "hide",
    restoreBehavior: "policy-default",
    focusBehavior: "stage-prefer",
    ssrCapability: "content",
    hydrationStrategy: "enhance",
    statePreservationKey: "settings.hub",
    accessibilityLabel: "Settings",
    ...overrides,
  };
}

/** Abstract sealed primary for contract tests — no Feed imports. */
export function sealedPrimaryManifest(
  overrides?: Partial<WidgetManifest>,
): WidgetManifest {
  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    id: "sealed.primary",
    type: "sealed",
    version: 1,
    supportedSurfaces: ["*"],
    constraints: { minWidth: 320, preferredWidth: 640, minHeight: 400 },
    preferredRegion: "primary-stage",
    allowedPanelModes: ["stage"],
    canBePrimary: true,
    canPersist: true,
    canFloat: false,
    canOverlay: false,
    priority: 100,
    collapseBehavior: "hide",
    restoreBehavior: "policy-default",
    focusBehavior: "preserve",
    ssrCapability: "shell",
    hydrationStrategy: "enhance",
    statePreservationKey: "sealed.primary",
    accessibilityLabel: "Sealed primary",
    ...overrides,
  };
}

/**
 * Declarative feed.geo architecture metadata for sealed contract tests only.
 * MUST NOT import lib/feed or components/feed.
 */
export function feedGeoTestManifest(
  overrides?: Partial<WidgetManifest>,
): WidgetManifest {
  return sealedPrimaryManifest({
    id: "feed.geo",
    statePreservationKey: "feed.geo",
    accessibilityLabel: "Feed",
    ...overrides,
  });
}
