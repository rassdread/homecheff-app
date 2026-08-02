export type {
  AdaptiveWorkspaceSettingsMode,
  MeasuredBox,
  NormalizedMeasurement,
  SettingsOnPilotDiagnostics,
  SettingsShadowDiagnostics,
  SettingsShadowPlanSnapshot,
  SettingsWorkspaceModeSource,
} from "./workspace-runtime-types";

export type {
  ChromeOccupancyInput,
  ChromeOccupancyShell,
  ChromeOccupancySource,
  ChromeOccupancySourceId,
  ChromeSafeAreaInsets,
  WorkspaceChromeOccupancy,
} from "./chrome-occupancy-types";

export { CHROME_OCCUPANCY_SCHEMA_VERSION } from "./chrome-occupancy-types";

export {
  resolveAdaptiveWorkspaceSettingsMode,
  coerceAdaptiveWorkspaceSettingsMode,
  resolveSettingsWorkspaceMode,
  parseSettingsWorkspaceMode,
  SETTINGS_WORKSPACE_MODE_ENV,
} from "./settings-mode";

export {
  createSettingsInitialPlan,
  SETTINGS_HUB_WIDGET_ID,
  SETTINGS_SURFACE_ID,
  SETTINGS_PRIMARY_REGION_ID,
  SETTINGS_PRIMARY_SLOT_ID,
  SETTINGS_PRIMARY_PANEL_ID,
  SETTINGS_PRIMARY_PLACEMENT_ID,
} from "./create-settings-initial-plan";

export {
  validateSettingsRenderPlan,
  isSettingsRenderAllowlistedWidget,
} from "./validate-settings-render-plan";

export {
  normalizeWorkspaceMeasurement,
  coalesceMeasurement,
  isSameNormalizedMeasurement,
  buildSettingsStabilityToken,
  floorDimension,
} from "./normalize-workspace-measurement";

export {
  buildChromeOccupancySnapshot,
  validateChromeOccupancy,
  emptyChromeOccupancy,
  emptyChromeSafeArea,
  buildChromeOccupancyStabilityToken,
  isBottomNavOccupying,
  HC_AW_NAVBAR_HEIGHT_PX,
  HC_AW_BOTTOM_NAV_HEIGHT_PX,
  HC_AW_LG_BREAKPOINT_PX,
} from "./build-chrome-occupancy";

export {
  coalesceChromeOccupancy,
  isSameChromeOccupancy,
} from "./coalesce-chrome-occupancy";

export {
  buildSettingsResolveStabilityToken,
  usableDimensionsFromContainerFirst,
} from "./usable-space-from-occupancy";

export { createSettingsResolveInput } from "./create-settings-resolve-input";

export {
  detectChromeOccupancyShell,
  readSafeAreaInsetsPx,
} from "./detect-chrome-shell";

export {
  NOTIFICATIONS_INBOX_WIDGET_ID,
  NOTIFICATIONS_INBOX_PRESERVATION_KEY,
  NOTIFICATIONS_ALLOWED_PREFERRED_MODES,
  createNotificationsPanelRequest,
  createSettingsNotificationsResolveInput,
  extractNotificationsShadowDiagnostics,
  emptyNotificationsShadowDiagnostics,
} from "./notifications";

export type {
  NotificationsPresentationIntent,
  NotificationsPreferredMode,
  NotificationsShadowDiagnostics,
  CreateNotificationsPanelRequestResult,
} from "./notifications";

export {
  MESSAGES_LIST_WIDGET_ID,
  MESSAGES_CHAT_WIDGET_ID,
  MESSAGES_LIST_PRESERVATION_KEY,
  MESSAGES_CHAT_PRESERVATION_KEY,
  MESSAGES_PRESENTATION_SCHEMA_VERSION,
  MESSAGES_LIST_PREFERRED_MODES,
  createMessagesPanelRequests,
  createMessagesShadowResolveInput,
  extractMessagesShadowDiagnostics,
  emptyMessagesShadowDiagnostics,
} from "./messages";

export type {
  MessagesPresentationIntent,
  MessagesListPreferredMode,
  MessagesShadowDiagnostics,
  MessagesShadowScenario,
  CreateMessagesPanelRequestsResult,
} from "./messages";

export {
  FEED_WORKSPACE_VISIBILITY_MODE_ENV,
  FEED_WORKSPACE_PREVIEW_QUERY_PARAM,
  parseFeedWorkspaceVisibilityMode,
  resolveFeedWorkspaceVisibilityMode,
  coerceFeedWorkspaceVisibilityMode,
  isFeedWorkspaceLayoutVisible,
  parseFeedWorkspacePreviewRequested,
} from "./feed-workspace-visibility-mode";

export type {
  FeedWorkspaceVisibilityMode,
  FeedWorkspaceVisibilityModeSource,
  ResolvedFeedWorkspaceVisibilityMode,
} from "./feed-workspace-visibility-mode";

export {
  FEED_WORKSPACE_LAYOUT_BANDS,
  resolveFeedWorkspaceVisibleLayout,
} from "./resolve-feed-workspace-visible-layout";

export type {
  FeedWorkspaceOrientation,
  FeedWorkspaceLayoutMode,
  FeedWorkspaceVisibleLayoutPlan,
  FeedWorkspaceLayoutBands,
} from "./resolve-feed-workspace-visible-layout";

export {
  WORKSPACE_MODE_BANDS,
  resolveWorkspaceMode,
  isSameWorkspaceModePlan,
} from "./resolve-workspace-mode";

export type {
  WorkspaceModeId,
  WorkspacePosture,
  WorkspaceModeBands,
  WorkspaceModeResolveInput,
  WorkspaceModePlan,
} from "./resolve-workspace-mode";

export {
  WORKSPACE_TRANSITION_CONTINUITY,
  CONTINUITY_FORBIDDEN_SOURCE_PATTERNS,
  describeWorkspaceModeTransition,
  resolveFailClosedUsableSpace,
  simulateModeTransitionAcrossSpace,
} from "./workspace-transition-continuity";

export type {
  WorkspaceTransitionEvent,
  FailClosedUsableSpace,
} from "./workspace-transition-continuity";

export {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  WORKSPACE_CAPABILITY_IDS,
  WORKSPACE_RESERVED_CAPABILITY_IDS,
  CAPABILITY_FORBIDDEN_SOURCE_PATTERNS,
  resolveWorkspaceCapabilities,
  resolveWorkspaceCapabilitiesFromModePlan,
  resolveWorkspaceCapabilitiesFromAvailableSpace,
  getWorkspaceCapabilityState,
  isWorkspaceCapabilityAvailable,
} from "./resolve-workspace-capabilities";

export type {
  WorkspaceCapabilityId,
  WorkspaceCapabilityState,
  WorkspaceCapabilityActivationMap,
  WorkspaceCapabilityPlan,
  WorkspaceCapabilityResolveInput,
} from "./resolve-workspace-capabilities";

export {
  LANDSCAPE_WORK_POSTURE,
  resolveLandscapeWorkPosture,
  isSameLandscapeWorkPosturePlan,
} from "./resolve-landscape-work-posture";

export type {
  WorkspaceChromeDensity,
  LandscapeWorkPosturePlan,
  LandscapeWorkPostureInput,
} from "./resolve-landscape-work-posture";

export {
  WORKSPACE_SURFACE_REGISTRY,
  WORKSPACE_SURFACE_IDS,
  WORKSPACE_RESERVED_SURFACE_IDS,
  listWorkspaceSurfaces,
  getWorkspaceSurface,
  isWorkspaceSurfaceId,
  isWorkspaceSurfaceReserved,
  getWorkspaceSurfaceRegistryDiagnostics,
  serializeWorkspaceSurfaceRegistry,
  SURFACE_REGISTRY_FORBIDDEN_SOURCE_PATTERNS,
} from "./workspace-surface-registry";

export type {
  WorkspaceSurfaceId,
  WorkspaceSurfaceCategory,
  WorkspaceSurfaceFamily,
  WorkspaceSurfacePresentationRole,
  WorkspaceSurfaceAvailabilityIntent,
  WorkspaceSurfaceCapabilityRelation,
  WorkspaceSurfacePresentationContract,
  WorkspaceSurfaceRegistryDiagnostics,
} from "./workspace-surface-registry";
