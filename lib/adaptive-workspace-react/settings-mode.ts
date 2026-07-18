import type { AdaptiveWorkspaceSettingsMode } from "./workspace-runtime-types";

/**
 * Phase 2B mode resolution.
 * - production → off (no measurement / resolver cost by default)
 * - non-production → shadow
 * - ON is never returned (fail closed to shadow)
 * - No query params / localStorage as source of truth
 */
export function resolveAdaptiveWorkspaceSettingsMode(): AdaptiveWorkspaceSettingsMode {
  if (process.env.NODE_ENV === "production") return "off";
  return "shadow";
}

/**
 * Coerce external/test overrides. Unexpected "on" fails closed to shadow.
 */
export function coerceAdaptiveWorkspaceSettingsMode(
  raw: unknown,
): AdaptiveWorkspaceSettingsMode {
  if (raw === "off") return "off";
  if (raw === "shadow") return "shadow";
  if (raw === "on") return "shadow";
  return resolveAdaptiveWorkspaceSettingsMode();
}
