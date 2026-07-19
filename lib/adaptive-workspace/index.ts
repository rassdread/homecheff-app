/**
 * Public Adaptive Workspace API — Phase 2A pure core.
 *
 * @packageDocumentation
 */

export { ADAPTIVE_WORKSPACE_SCHEMA_VERSION } from "./types/workspace";
export type {
  AvailableSpace,
  CompatibilityMode,
  DecisionTrace,
  FocusIntent,
  LifecycleIntent,
  Occlusion,
  PanelMode,
  PanelRequest,
  RegionId,
  ResolveInput,
  TransitionIntent,
  WidgetLifecycleState,
  WidgetManifest,
  WorkspaceLayoutPlan,
  WorkspacePreferences,
  WorkspaceProfile,
  WorkspaceStateAllowlist,
} from "./types/workspace";

export {
  PANEL_MODE_META,
  RESOLVE_PRECEDENCE,
  WORKSPACE_DOMAIN_DENYLIST,
  TELEMETRY_METRIC_NAMES,
} from "./types/workspace";

export type { WorkspaceCommand } from "./types/commands";
export type { WorkspaceEvent } from "./types/events";

export {
  WIDGET_LIFECYCLE_TRANSITIONS,
  isAllowedLifecycleTransition,
} from "./types/lifecycle";

export { validateResolveInput } from "./schema/validate-resolve-input";
export {
  validateWidgetManifest,
  validateWidgetManifestSet,
} from "./schema/validate-widget-manifest";
export { validateWorkspacePreferences } from "./schema/validate-resolve-input";
export {
  ValidationError,
  RecoverableResolutionError,
  HardContractViolation,
} from "./schema/validation-error";

export {
  resolveWorkspaceProfile,
  capacityBudgetForProfile,
  PROFILE_TEST_FIXTURE_BANDS,
} from "./profile/resolve-workspace-profile";

export {
  SettingsSurfacePolicy,
  getSurfacePolicy,
  SETTINGS_SURFACE_ID,
} from "./policies/settings-policy";

export {
  settingsHubManifest,
  sealedPrimaryManifest,
  feedGeoTestManifest,
  feedDiscoveryManifest,
  notificationsInboxManifest,
  messagesListManifest,
  messagesChatManifest,
} from "./registry/settings-manifests";

export { resolveWorkspaceLayout } from "./resolver/resolve-workspace-layout";
export {
  canonicalizeLayoutPlan,
  stableStringify,
} from "./resolver/canonicalize-layout-plan";

export { DIAGNOSTIC_CODES } from "./diagnostics/diagnostic-codes";

export {
  FEED_SEALED_INVARIANT_IDS,
  FEED_SEALED_INVARIANT_ID,
  type FeedSealedInvariantId,
} from "./sealed/feed-discovery-invariants";

export {
  SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION,
  SEALED_WORKSPACE_CAPABILITIES,
  SEALED_WORKSPACE_PROHIBITIONS,
  type SealedRuntimeContract,
  type SealedRuntimeClassification,
  type SealedRuntimeOwner,
  type SealedRuntimeActiveWriter,
  type SealedMountPolicy,
  type SealedStateBoundary,
  type SealedRequestBoundary,
  type SealedObserverBoundary,
  type SealedScrollBoundary,
  type SealedWorkspaceCapability,
  type SealedWorkspaceProhibition,
} from "./sealed/sealed-runtime-types";

export {
  validateSealedRuntimeContract,
  isSealedCapabilityProhibited,
} from "./sealed/validate-sealed-runtime-contract";

export {
  FEED_DISCOVERY_WIDGET_ID,
  createFeedDiscoverySealedContract,
} from "./sealed/feed-discovery-sealed-contract";

export {
  FEED_DISCOVERY_FREEZE_SCHEMA_VERSION,
  createFeedDiscoveryFreezeContract,
  validateFeedDiscoveryFreezeContract,
  type FeedDiscoveryFreezeContract,
} from "./sealed/feed-discovery-freeze-contract";

export {
  FEED_BROWSER_PROOF_SCHEMA_VERSION,
  validateFeedBrowserProofArtifact,
  type FeedBrowserProofArtifact,
  type FeedBrowserProofInvariantRow,
  type FeedBrowserProofStatus,
} from "./sealed/validate-feed-browser-proof";
