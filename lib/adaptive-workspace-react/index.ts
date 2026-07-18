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
