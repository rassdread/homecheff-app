/**
 * Feed Workspace Visibility Mode — layout presentation only.
 *
 * Controls whether the homepage Adaptive Workspace layout shell is visible.
 * Does NOT transfer GeoFeed request / cache / pagination / writer ownership.
 *
 * Env: HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE = off | shadow | preview | on
 * Fail closed: missing/invalid → off (all environments).
 *
 * PREVIEW: visible only when explicit preview request is true
 * (server searchParam awFeedWorkspace=1). Never from cookies/storage.
 */

export type FeedWorkspaceVisibilityMode = "off" | "shadow" | "preview" | "on";

export const FEED_WORKSPACE_VISIBILITY_MODE_ENV =
  "HOMECHEFF_FEED_WORKSPACE_VISIBILITY_MODE";

/** Query param authorizing PREVIEW visibility (SSR-passed). */
export const FEED_WORKSPACE_PREVIEW_QUERY_PARAM = "awFeedWorkspace";

export type FeedWorkspaceVisibilityModeSource =
  | "env"
  | "default-fail-closed"
  | "invalid-fail-closed"
  | "override";

export type ResolvedFeedWorkspaceVisibilityMode = {
  mode: FeedWorkspaceVisibilityMode;
  source: FeedWorkspaceVisibilityModeSource;
  requestedRaw: string | null;
};

export function parseFeedWorkspaceVisibilityMode(
  raw: unknown,
): FeedWorkspaceVisibilityMode | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v === "off" || v === "shadow" || v === "preview" || v === "on") return v;
  return null;
}

/**
 * Resolve env (or test override). Always fail closed to `off`.
 */
export function resolveFeedWorkspaceVisibilityMode(args?: {
  raw?: unknown;
  isOverride?: boolean;
}): ResolvedFeedWorkspaceVisibilityMode {
  const fromEnv =
    typeof process !== "undefined"
      ? process.env[FEED_WORKSPACE_VISIBILITY_MODE_ENV]
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
      mode: "off",
      source: "default-fail-closed",
      requestedRaw,
    };
  }

  const parsed = parseFeedWorkspaceVisibilityMode(candidate);
  if (!parsed) {
    return {
      mode: "off",
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

export function coerceFeedWorkspaceVisibilityMode(
  raw: unknown,
): FeedWorkspaceVisibilityMode {
  return resolveFeedWorkspaceVisibilityMode({ raw, isOverride: true }).mode;
}

/**
 * Whether the visible Workspace layout shell should render.
 * SHADOW never shows layout DOM (diagnostics-only later).
 */
export function isFeedWorkspaceLayoutVisible(args: {
  mode: FeedWorkspaceVisibilityMode;
  /** True when SSR/client preview query authorizes preview. */
  previewRequested?: boolean;
}): boolean {
  if (args.mode === "on") return true;
  if (args.mode === "preview") return Boolean(args.previewRequested);
  return false;
}

/** Parse `awFeedWorkspace` query: "1" / "true" / "preview" → true. */
export function parseFeedWorkspacePreviewRequested(raw: unknown): boolean {
  if (raw == null) return false;
  const v = String(raw).trim().toLowerCase();
  return v === "1" || v === "true" || v === "preview" || v === "yes";
}
