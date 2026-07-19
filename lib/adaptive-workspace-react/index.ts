export type {
  AdaptiveWorkspaceSettingsMode,
  MeasuredBox,
  NormalizedMeasurement,
  SettingsShadowDiagnostics,
  SettingsShadowPlanSnapshot,
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
} from "./settings-mode";

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
