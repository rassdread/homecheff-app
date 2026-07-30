/**
 * HomeCheff Adaptive Workspace — Phase 2A pure core.
 *
 * HOMEPAGE INTERIM STANCE (Gate F):
 * Until Gate F the homepage remains Feed-orchestrated. This package MUST NOT
 * import Feed code, use homeComposedLayout, extract FeedFilters, or relocate
 * homepage rails. Sealed-widget types here are abstract contracts only.
 *
 * CHROME OCCUPANCY FIXED-POINT RULE:
 * Chrome occupancy is an input field on AvailableSpace for a resolve cycle.
 * It MUST come from shell + route/surface chrome policy + explicit input —
 * NEVER from the WorkspaceProfile produced in the same resolve cycle.
 * The pure resolver does not measure or recompute chrome occupancy.
 *
 * IMPORT BOUNDARY: no React, DOM, Next.js, Feed, Capacitor, storage, or APIs.
 */

export const ADAPTIVE_WORKSPACE_SCHEMA_VERSION = 1 as const;

export type CompatibilityMode = "off" | "shadow" | "on";

export type WorkspaceProfile =
  | "COMPACT"
  | "COMFORT"
  | "EXPANDED"
  | "PROFESSIONAL";

export type RegionId =
  | "navigation"
  | "primary-stage"
  | "supporting-start"
  | "supporting-end"
  | "utility"
  | "transient-overlay"
  | "global-modal"
  | "floating-action";

export type PanelMode =
  | "stage"
  | "rail"
  | "split"
  | "drawer"
  | "sheet"
  | "overlay"
  | "floating"
  | "modal";

export type ShellContext = "web" | "pwa" | "native";
export type LocaleDir = "ltr" | "rtl";
export type OcclusionKind = "keyboard" | "hinge" | "system";
export type SemanticLayer =
  | "z.base"
  | "z.sticky"
  | "z.nav"
  | "z.overlay"
  | "z.sheet"
  | "z.modal"
  | "z.toast";

export type CollapseBehavior =
  | "to-sheet"
  | "to-drawer"
  | "hide"
  | "overflow-menu";

export type RestoreBehavior = "last-mode" | "policy-default";
export type FocusBehavior = "preserve" | "move-with-panel" | "stage-prefer";
export type SsrCapability = "none" | "shell" | "content";
export type HydrationStrategy = "client-only" | "enhance" | "match-ssr";
export type WidgetType = "sealed" | "standard";

export type TransitionIntent =
  | "none"
  | "immediate"
  | "relocate"
  | "reveal"
  | "conceal"
  | "replace-transient";

export type OverflowStrategy =
  | "none"
  | "overflow-menu"
  | "hide-lowest-priority"
  | "collapse-supporting";

export type KeepAlivePolicy = "prefer-keep" | "allow-unmount" | "sealed-keep";

export type WidgetLifecycleState =
  | "REGISTERED"
  | "ELIGIBLE"
  | "PLACED"
  | "ACTIVE"
  | "VISIBLE"
  | "HIDDEN"
  | "SUSPENDED"
  | "DESTROYED";

/**
 * Resolve precedence (binding clarification §3) — highest first.
 * Documented for DecisionTrace; implemented in the resolver pipeline.
 */
export const RESOLVE_PRECEDENCE = [
  "primary-task",
  "hard-accessibility",
  "explicit-panel-request",
  "valid-user-pin",
  "surface-policy-required",
  "surface-policy-default",
  "widget-priority",
  "stable-id-tie-break",
] as const;

export type ResolvePrecedenceStep = (typeof RESOLVE_PRECEDENCE)[number];

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChromeOccupied {
  top: number;
  bottom: number;
  start: number;
  end: number;
}

export interface Occlusion {
  kind: OcclusionKind;
  widthPx: number;
  heightPx: number;
}

/**
 * AvailableSpace.widthPx / heightPx are NORMALIZED USABLE dimensions
 * (preference B): already after chrome/safe-area/occlusion normalization
 * by an external layer. The resolver MUST NOT subtract again.
 * safeArea / chromeOccupied / occlusions remain for diagnostics & policy.
 */
export interface AvailableSpace {
  widthPx: number;
  heightPx: number;
  safeArea: Insets;
  chromeOccupied: ChromeOccupied;
  occlusions: readonly Occlusion[];
  stabilityToken: string;
}

export interface EnvironmentSignals {
  shell: ShellContext;
  localeDir: LocaleDir;
}

export interface CapabilitySignals {
  pointerFine: boolean;
  hover: boolean;
  touch: boolean;
  reducedMotion: boolean;
}

export interface PanelRequest {
  widgetId: string;
  intent: "open" | "pin" | "close";
  preferredMode?: PanelMode;
}

export interface WorkspacePreferences {
  schemaVersion: typeof ADAPTIVE_WORKSPACE_SCHEMA_VERSION;
  version: number;
  pins: readonly string[];
  density?: "default" | "compact" | "comfortable";
  filtersDefaultOpen?: boolean;
}

export interface WidgetConstraints {
  minWidth: number;
  preferredWidth?: number;
  maxWidth?: number;
  minHeight: number;
}

export interface WidgetManifest {
  schemaVersion: typeof ADAPTIVE_WORKSPACE_SCHEMA_VERSION;
  id: string;
  type: WidgetType;
  version: number;
  supportedSurfaces: readonly string[];
  constraints: WidgetConstraints;
  preferredRegion?: RegionId;
  allowedPanelModes: readonly PanelMode[];
  canBePrimary: boolean;
  canPersist: boolean;
  canFloat: boolean;
  canOverlay: boolean;
  priority: number;
  collapseBehavior: CollapseBehavior;
  restoreBehavior: RestoreBehavior;
  focusBehavior: FocusBehavior;
  ssrCapability: SsrCapability;
  hydrationStrategy: HydrationStrategy;
  statePreservationKey: string;
  accessibilityLabel: string;
  requiredCapabilities?: readonly ("hover" | "fine-pointer" | "keyboard")[];
  incompatibleWith?: readonly string[];
}

export interface ResolveInput {
  schemaVersion: typeof ADAPTIVE_WORKSPACE_SCHEMA_VERSION;
  availableSpace: AvailableSpace;
  capabilities: CapabilitySignals;
  environment: EnvironmentSignals;
  surfaceId: string;
  primaryTask: string;
  manifests: readonly WidgetManifest[];
  panelRequests: readonly PanelRequest[];
  preferences: WorkspacePreferences;
  accessibility: { forceReducedMotion?: boolean };
  compatibility: { mode: CompatibilityMode };
}

export interface PanelModeMeta {
  takesStructuralSpace: boolean;
  blocksUnderlyingContent: boolean;
  requiresFocusTrap: boolean;
  isTransient: boolean;
  supportsMultipleInstances: boolean;
  semanticLayer: SemanticLayer;
}

export const PANEL_MODE_META: Record<PanelMode, PanelModeMeta> = {
  stage: {
    takesStructuralSpace: true,
    blocksUnderlyingContent: false,
    requiresFocusTrap: false,
    isTransient: false,
    supportsMultipleInstances: false,
    semanticLayer: "z.base",
  },
  rail: {
    takesStructuralSpace: true,
    blocksUnderlyingContent: false,
    requiresFocusTrap: false,
    isTransient: false,
    supportsMultipleInstances: true,
    semanticLayer: "z.base",
  },
  split: {
    takesStructuralSpace: true,
    blocksUnderlyingContent: false,
    requiresFocusTrap: false,
    isTransient: false,
    supportsMultipleInstances: false,
    semanticLayer: "z.base",
  },
  drawer: {
    takesStructuralSpace: false,
    blocksUnderlyingContent: true,
    requiresFocusTrap: true,
    isTransient: true,
    supportsMultipleInstances: false,
    semanticLayer: "z.sheet",
  },
  sheet: {
    takesStructuralSpace: false,
    blocksUnderlyingContent: true,
    requiresFocusTrap: true,
    isTransient: true,
    supportsMultipleInstances: false,
    semanticLayer: "z.sheet",
  },
  overlay: {
    takesStructuralSpace: false,
    blocksUnderlyingContent: false,
    requiresFocusTrap: false,
    isTransient: true,
    supportsMultipleInstances: true,
    semanticLayer: "z.overlay",
  },
  floating: {
    takesStructuralSpace: false,
    blocksUnderlyingContent: false,
    requiresFocusTrap: false,
    isTransient: false,
    supportsMultipleInstances: true,
    semanticLayer: "z.overlay",
  },
  modal: {
    takesStructuralSpace: false,
    blocksUnderlyingContent: true,
    requiresFocusTrap: true,
    isTransient: true,
    supportsMultipleInstances: false,
    semanticLayer: "z.modal",
  },
};

/** TEST FIXTURE ONLY — provisional capacity bands, not production breakpoints. */
export interface ProfileFixtureBands {
  /** usable width < compactMax → COMPACT */
  compactMaxExclusive: number;
  /** usable width < comfortMax → COMFORT */
  comfortMaxExclusive: number;
  /** usable width < expandedMax → EXPANDED; else PROFESSIONAL */
  expandedMaxExclusive: number;
  /** usable height below this demotes supporting capacity one band */
  shortHeightMaxExclusive: number;
}

export interface ProfileCapacityBudget {
  profile: WorkspaceProfile;
  maxPersistentSupportingPanels: number;
  maxUtilityPanels: number;
  maxConcurrentTransientPanels: number;
  keepAlivePolicy: KeepAlivePolicy;
  primaryMinWidthShare: number;
}

export interface RegionPlan {
  id: RegionId;
  slotIds: readonly string[];
}

export interface SlotPlan {
  id: string;
  regionId: RegionId;
  panelId: string | null;
}

export interface PanelInstancePlan {
  id: string;
  slotId: string;
  mode: PanelMode;
  widgetId: string;
  takesStructuralSpace: boolean;
  isTransient: boolean;
  requiresFocusTrap: boolean;
  closeContract?: { escape: boolean; backdrop: boolean };
}

export interface WidgetPlacement {
  id: string;
  widgetId: string;
  panelId: string;
  slotId: string;
  regionId: RegionId;
  mode: PanelMode;
  statePreservationKey: string;
  visible: boolean;
}

export interface FocusIntent {
  targetSlotId?: string;
  targetWidgetId?: string;
  trap: boolean;
  returnTo?: string;
  recovery?: "preserve" | "stage" | "none";
}

export interface LifecycleIntent {
  widgetId: string;
  statePreservationKey: string;
  intent: Exclude<WidgetLifecycleState, "DESTROYED"> | "KEEP";
}

export interface DecisionTracePlaced {
  widgetId: string;
  region: RegionId;
  mode: PanelMode;
  reason: string;
}

export interface DecisionTraceRejected {
  widgetId: string;
  reason: string;
  code: string;
}

export interface DecisionTraceFallback {
  widgetId: string;
  from: string;
  to: string;
  reason: string;
}

export interface DecisionTrace {
  schemaVersion: typeof ADAPTIVE_WORKSPACE_SCHEMA_VERSION;
  profile: WorkspaceProfile;
  availableSpaceSummary: {
    widthPx: number;
    heightPx: number;
    stabilityToken: string;
  };
  primaryWidgetId: string | null;
  precedence: readonly ResolvePrecedenceStep[];
  placed: readonly DecisionTracePlaced[];
  rejected: readonly DecisionTraceRejected[];
  fallbacks: readonly DecisionTraceFallback[];
  preferenceWarnings: readonly string[];
  incompatibilities: readonly string[];
  compatibilityMode: CompatibilityMode;
  transitionIntent: TransitionIntent;
  focusIntent: FocusIntent;
  diagnosticCodes: readonly string[];
  warnings: readonly string[];
}

export interface WorkspaceLayoutPlan {
  schemaVersion: typeof ADAPTIVE_WORKSPACE_SCHEMA_VERSION;
  surfaceId: string;
  profile: WorkspaceProfile;
  renderActivation: boolean;
  regions: readonly RegionPlan[];
  slots: readonly SlotPlan[];
  panels: readonly PanelInstancePlan[];
  placements: readonly WidgetPlacement[];
  primaryWidgetId: string | null;
  overflowStrategy: OverflowStrategy;
  focusIntent: FocusIntent;
  transitionIntent: TransitionIntent;
  lifecycleIntents: readonly LifecycleIntent[];
  diagnostics: DecisionTrace;
  navigationIntent: {
    landmarks: readonly ("navigation" | "primary-stage")[];
  };
}

/**
 * Allowlisted workspace presentation state (conceptual; not a store).
 * MUST NOT contain denylisted domain fields.
 */
export interface WorkspaceStateAllowlist {
  activeSurfaceId: string;
  primaryWidgetId: string | null;
  openPanelRequests: readonly PanelRequest[];
  pinnedWidgetIds: readonly string[];
  density: WorkspacePreferences["density"];
  compatibilityMode: CompatibilityMode;
  lastStable: {
    stabilityToken: string;
    profile: WorkspaceProfile;
  };
  transitionIntent?: TransitionIntent;
  focusRecovery?: FocusIntent;
}

/** Compile-time denylist markers — never add these keys to workspace types. */
export type WorkspaceDomainDenylistKeys =
  | "requestKey"
  | "nativePaintKey"
  | "preparedBatches"
  | "feedResults"
  | "feedCaches"
  | "filterRequestStatus"
  | "chatMessages"
  | "chatDraftBody"
  | "orderData"
  | "cartLines"
  | "profileDomainRecords"
  | "authSession"
  | "createFlowBusinessState"
  | "notificationRecords"
  | "apiResponseCaches";

export const WORKSPACE_DOMAIN_DENYLIST: readonly WorkspaceDomainDenylistKeys[] = [
  "requestKey",
  "nativePaintKey",
  "preparedBatches",
  "feedResults",
  "feedCaches",
  "filterRequestStatus",
  "chatMessages",
  "chatDraftBody",
  "orderData",
  "cartLines",
  "profileDomainRecords",
  "authSession",
  "createFlowBusinessState",
  "notificationRecords",
  "apiResponseCaches",
] as const;

export const TELEMETRY_METRIC_NAMES = [
  "workspace.resolve.completed",
  "workspace.resolve.fallback",
  "workspace.profile.selected",
  "workspace.widget.rejected",
  "workspace.compat.shadow",
  "workspace.contract.violation",
] as const;

export type TelemetryMetricName = (typeof TELEMETRY_METRIC_NAMES)[number];
