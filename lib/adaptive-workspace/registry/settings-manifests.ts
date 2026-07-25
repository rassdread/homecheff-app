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

/**
 * Phase 3B.1 — feed.discovery sealed widget manifest (declaration only).
 * MUST NOT import lib/feed or components/feed. No renderer registration.
 */
export function feedDiscoveryManifest(
  overrides?: Partial<WidgetManifest>,
): WidgetManifest {
  return sealedPrimaryManifest({
    id: "feed.discovery",
    statePreservationKey: "feed.discovery",
    accessibilityLabel: "Feed discovery",
    ssrCapability: "shell",
    hydrationStrategy: "client-only",
    focusBehavior: "preserve",
    ...overrides,
  });
}

/**
 * Phase 3B.3.1 — controlled-host-candidate metadata (no renderer / child factory).
 * Serializable registry annotation only. MUST NOT import Feed React modules.
 */
export const FEED_DISCOVERY_HOST_CANDIDATE_METADATA = {
  widgetId: "feed.discovery" as const,
  runtimeClassification: "sealed-runtime" as const,
  hostClassification: "controlled-host-candidate" as const,
  hostVersion: 1 as const,
  hostActivation: false as const,
  renderActivation: false as const,
  shadowActivation: true as const,
  activeRenderOwner: "legacy" as const,
  activeWriter: "legacy" as const,
  rendererRegistered: false as const,
  childFactoryRegistered: false as const,
  nextEligibleStep: "3B.3.16" as const,
  shadowPlacementState: "shadow-registered" as const,
  placementMode: "sibling-after-legacy-mount" as const,
  registrationState: "registered" as const,
  eligibilityState: "eligible" as const,
  readinessState: "ready" as const,
  simulationState: "completed" as const,
  wouldActivate: true as const,
  decisionState: "completed" as const,
  decisionResult: "ALLOW" as const,
  confidence: "high" as const,
  planState: "completed" as const,
  planResult: "plan-complete-not-executable" as const,
  pipelineState: "completed" as const,
  pipelineResult: "pipeline-complete-not-executable" as const,
  transactionState: "completed" as const,
  transactionResult: "transaction-complete-not-committed" as const,
  wouldCommit: true as const,
  transactionCommitted: false as const,
  commitReadinessState: "completed" as const,
  commitReadinessResult: "commit-ready-not-executable" as const,
  commitReady: true as const,
  commitBlocked: true as const,
  commitProtocolState: "completed" as const,
  commitProtocolResult: "protocol-complete-not-executable" as const,
  protocolExecuted: false as const,
  stateMachineState: "completed" as const,
  stateMachineResult: "state-machine-complete-not-executable" as const,
  currentActivationLifecycleState: "COMMIT_READY" as const,
  transitionExecuted: false as const,
  transitionGraphState: "completed" as const,
  transitionGraphResult: "transition-graph-complete-not-executable" as const,
  currentGraphNode: "COMMIT_READY" as const,
  graphTraversalExecuted: false as const,
  transitionSelectionState: "completed" as const,
  transitionSelectionResult: "transition-selected-not-executable" as const,
  selectionCompleted: true as const,
  selectionExecuted: false as const,
  selectedTransition: "COMMIT_READY->ACTIVE" as const,
  selectedFromState: "COMMIT_READY" as const,
  selectedToState: "ACTIVE" as const,
  commitExecuted: false as const,
  ownershipTransferred: false as const,
  writerTransferred: false as const,
  rendererTransferred: false as const,
  canStartActivation: false as const,
  runtimeId: "feed.discovery.legacy-single-mount.v1" as const,
};

/**
 * Notifications inbox widget — Phase 2D shadow contract.
 *
 * Production UI remains a full-page route (`/notifications`).
 * Within the Settings pilot this widget is supporting/transient only
 * (`canBePrimary: false`). Override for notifications-surface primary tests.
 *
 * MUST NOT import Notifications React components, APIs, or Domain State.
 */
export function notificationsInboxManifest(
  overrides?: Partial<WidgetManifest>,
): WidgetManifest {
  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    id: "notifications.inbox",
    type: "standard",
    version: 1,
    supportedSurfaces: ["settings", "notifications", "*"],
    constraints: { minWidth: 280, preferredWidth: 360, minHeight: 240 },
    preferredRegion: "supporting-end",
    allowedPanelModes: ["rail", "sheet", "overlay"],
    canBePrimary: false,
    canPersist: false,
    canFloat: false,
    canOverlay: true,
    priority: 40,
    collapseBehavior: "to-sheet",
    restoreBehavior: "last-mode",
    focusBehavior: "move-with-panel",
    ssrCapability: "shell",
    hydrationStrategy: "client-only",
    statePreservationKey: "notifications.inbox",
    accessibilityLabel: "Notifications",
    ...overrides,
  };
}

/**
 * Messages conversation list — Phase 2E shadow contract.
 * Aligns with AWV-007…010 (`messages.list`).
 * MUST NOT import Messages React / API / Domain State.
 */
export function messagesListManifest(
  overrides?: Partial<WidgetManifest>,
): WidgetManifest {
  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    id: "messages.list",
    type: "standard",
    version: 1,
    supportedSurfaces: ["messages", "*"],
    constraints: { minWidth: 240, preferredWidth: 320, minHeight: 320 },
    preferredRegion: "supporting-start",
    allowedPanelModes: ["stage", "split", "rail"],
    canBePrimary: true,
    canPersist: true,
    canFloat: false,
    canOverlay: false,
    priority: 100,
    collapseBehavior: "hide",
    restoreBehavior: "last-mode",
    focusBehavior: "preserve",
    ssrCapability: "shell",
    hydrationStrategy: "client-only",
    statePreservationKey: "messages.list",
    accessibilityLabel: "Conversation list",
    ...overrides,
  };
}

/**
 * Messages conversation stage (thread + composer) — Phase 2E.
 * Aligns with AWV-007…011 (`messages.chat`).
 * Composer belongs to this widget — not a separate primary.
 * MUST NOT import Messages React / API / Domain State.
 */
export function messagesChatManifest(
  overrides?: Partial<WidgetManifest>,
): WidgetManifest {
  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    id: "messages.chat",
    type: "standard",
    version: 1,
    supportedSurfaces: ["messages", "*"],
    constraints: { minWidth: 280, preferredWidth: 640, minHeight: 360 },
    preferredRegion: "primary-stage",
    allowedPanelModes: ["stage", "split"],
    canBePrimary: true,
    canPersist: true,
    canFloat: false,
    canOverlay: false,
    priority: 90,
    collapseBehavior: "hide",
    restoreBehavior: "last-mode",
    focusBehavior: "stage-prefer",
    ssrCapability: "shell",
    hydrationStrategy: "client-only",
    statePreservationKey: "messages.chat",
    accessibilityLabel: "Conversation",
    ...overrides,
  };
}
