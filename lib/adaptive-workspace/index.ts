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
  PanelMode,
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
} from "./registry/settings-manifests";

export { resolveWorkspaceLayout } from "./resolver/resolve-workspace-layout";
export {
  canonicalizeLayoutPlan,
  stableStringify,
} from "./resolver/canonicalize-layout-plan";

export { DIAGNOSTIC_CODES } from "./diagnostics/diagnostic-codes";
