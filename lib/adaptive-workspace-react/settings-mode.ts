/**
 * Phase 2F — Settings Workspace mode configuration.
 *
 * Source of truth: HOMECHEFF_SETTINGS_WORKSPACE_MODE (server env).
 * Allowed: off | shadow | on
 * Missing/invalid → fail closed (production: off, otherwise: shadow).
 * Never query params, browser storage, cookies, or DB flags.
 */

export type AdaptiveWorkspaceSettingsMode = "off" | "shadow" | "on";

export const SETTINGS_WORKSPACE_MODE_ENV = "HOMECHEFF_SETTINGS_WORKSPACE_MODE";

export type SettingsWorkspaceModeSource =
  | "env"
  | "default-production"
  | "default-nonproduction"
  | "invalid-fail-closed"
  | "override";

export type ResolvedSettingsWorkspaceMode = {
  mode: AdaptiveWorkspaceSettingsMode;
  source: SettingsWorkspaceModeSource;
  requestedRaw: string | null;
};

function defaultMode(): AdaptiveWorkspaceSettingsMode {
  if (process.env.NODE_ENV === "production") return "off";
  return "shadow";
}

function defaultSource(): SettingsWorkspaceModeSource {
  return process.env.NODE_ENV === "production"
    ? "default-production"
    : "default-nonproduction";
}

/**
 * Parse a raw mode string. Returns null when invalid.
 */
export function parseSettingsWorkspaceMode(
  raw: unknown,
): AdaptiveWorkspaceSettingsMode | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v === "off" || v === "shadow" || v === "on") return v;
  return null;
}

/**
 * Resolve effective Settings workspace mode from env (or explicit raw for tests).
 */
export function resolveSettingsWorkspaceMode(args?: {
  raw?: unknown;
  /** When true, treat `raw` as an override (tests). */
  isOverride?: boolean;
}): ResolvedSettingsWorkspaceMode {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env[SETTINGS_WORKSPACE_MODE_ENV]
      : undefined;
  const requestedRaw =
    args?.raw !== undefined
      ? args.raw == null
        ? null
        : String(args.raw)
      : fromEnv === undefined
        ? null
        : String(fromEnv);

  const candidate =
    args?.raw !== undefined ? args.raw : fromEnv === undefined ? null : fromEnv;

  if (candidate == null || candidate === "") {
    return {
      mode: defaultMode(),
      source: defaultSource(),
      requestedRaw,
    };
  }

  const parsed = parseSettingsWorkspaceMode(candidate);
  if (!parsed) {
    return {
      mode: defaultMode(),
      source: "invalid-fail-closed",
      requestedRaw,
    };
  }

  return {
    mode: parsed,
    source: args?.isOverride ? "override" : "env",
    requestedRaw,
  };
}

/** Convenience: mode enum only. */
export function resolveAdaptiveWorkspaceSettingsMode(): AdaptiveWorkspaceSettingsMode {
  return resolveSettingsWorkspaceMode().mode;
}

/**
 * Coerce external/test values. Invalid → environment default (fail closed).
 * Explicit "on" is allowed (controlled config / test override).
 */
export function coerceAdaptiveWorkspaceSettingsMode(
  raw: unknown,
): AdaptiveWorkspaceSettingsMode {
  return resolveSettingsWorkspaceMode({ raw, isOverride: true }).mode;
}
