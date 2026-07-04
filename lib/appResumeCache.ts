/**
 * App resume hints (localStorage): snelle UI-context na WebView/app heropen.
 * Server/API blijft bron van waarheid; geen gevoelige data.
 */

export const APP_RESUME_STORAGE_KEY = "hc_app_resume_v1";
/** sessionStorage: route-restore max 1× per tab-sessie */
export const APP_RESUME_SESSION_ROUTE_DONE = "hc_app_resume_route_done";
/** sessionStorage: native conversation-URL hint max 1× */
export const APP_RESUME_MSG_CONV_HINT = "hc_msg_conv_hint_applied";

const ROUTE_TTL_MS = 24 * 60 * 60 * 1000;
const CONV_TTL_MS = 24 * 60 * 60 * 1000;
const SCROLL_TTL_MS = 2 * 60 * 60 * 1000;

export const APP_RESUME_CACHE_VERSION = 1;

export type AppResumeStateV1 = {
  version: 1;
  lastRoute?: string;
  lastRouteAt?: number;
  lastConversationId?: string;
  lastConversationAt?: number;
  scrollPositions?: Record<string, { y: number; at: number }>;
};

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readRaw(): AppResumeStateV1 | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(APP_RESUME_STORAGE_KEY);
    if (!raw) return null;
    const data = safeParse(raw);
    if (!data || typeof data !== "object") {
      try {
        localStorage.removeItem(APP_RESUME_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return null;
    }
    const o = data as Record<string, unknown>;
    if (o.version !== APP_RESUME_CACHE_VERSION) {
      try {
        localStorage.removeItem(APP_RESUME_STORAGE_KEY);
      } catch {
        /* ignore */
      }
      return null;
    }
    return {
      version: 1,
      lastRoute: typeof o.lastRoute === "string" ? o.lastRoute : undefined,
      lastRouteAt: typeof o.lastRouteAt === "number" ? o.lastRouteAt : undefined,
      lastConversationId:
        typeof o.lastConversationId === "string"
          ? o.lastConversationId
          : undefined,
      lastConversationAt:
        typeof o.lastConversationAt === "number"
          ? o.lastConversationAt
          : undefined,
      scrollPositions:
        o.scrollPositions && typeof o.scrollPositions === "object"
          ? (o.scrollPositions as AppResumeStateV1["scrollPositions"])
          : undefined,
    };
  } catch {
    return null;
  }
}

function writeFull(state: AppResumeStateV1): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APP_RESUME_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function clearAppResumeState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(APP_RESUME_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function pruneScroll(
  scrollPositions: AppResumeStateV1["scrollPositions"],
  now: number
): AppResumeStateV1["scrollPositions"] | undefined {
  if (!scrollPositions) return undefined;
  const out: Record<string, { y: number; at: number }> = {};
  for (const [k, v] of Object.entries(scrollPositions)) {
    if (typeof k !== "string" || k.length > 200) continue;
    if (!v || typeof v !== "object") continue;
    const y = (v as { y?: unknown }).y;
    const at = (v as { at?: unknown }).at;
    if (typeof y !== "number" || typeof at !== "number") continue;
    if (now - at > SCROLL_TTL_MS) continue;
    out[k] = { y: Math.max(0, Math.min(y, 1_000_000)), at };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Geparset + TTL gefilterd; geen side-effect write. */
export function readAppResumeState(): AppResumeStateV1 {
  const now = Date.now();
  const raw = readRaw();
  if (!raw) return { version: 1 };

  const out: AppResumeStateV1 = { version: 1 };

  if (
    typeof raw.lastRoute === "string" &&
    raw.lastRoute.length < 4000 &&
    typeof raw.lastRouteAt === "number" &&
    now - raw.lastRouteAt <= ROUTE_TTL_MS
  ) {
    out.lastRoute = raw.lastRoute;
    out.lastRouteAt = raw.lastRouteAt;
  }

  if (
    typeof raw.lastConversationId === "string" &&
    raw.lastConversationId.length < 200 &&
    typeof raw.lastConversationAt === "number" &&
    now - raw.lastConversationAt <= CONV_TTL_MS
  ) {
    out.lastConversationId = raw.lastConversationId;
    out.lastConversationAt = raw.lastConversationAt;
  }

  const sp = pruneScroll(raw.scrollPositions, now);
  if (sp) out.scrollPositions = sp;

  return out;
}

export function writeAppResumeState(
  partial: Partial<Omit<AppResumeStateV1, "version">>
): void {
  if (typeof window === "undefined") return;
  try {
    const cur = readAppResumeState();
    const next: AppResumeStateV1 = { version: 1, ...cur };
    if (partial.lastRoute !== undefined) {
      next.lastRoute = partial.lastRoute;
      next.lastRouteAt = Date.now();
    }
    if (partial.lastConversationId !== undefined) {
      next.lastConversationId = partial.lastConversationId;
      next.lastConversationAt = Date.now();
    }
    if (partial.scrollPositions !== undefined) {
      next.scrollPositions = partial.scrollPositions;
    }
    writeFull(pruneForPersist(next));
  } catch {
    /* ignore */
  }
}

function pruneForPersist(merged: AppResumeStateV1): AppResumeStateV1 {
  const now = Date.now();
  const out: AppResumeStateV1 = { version: 1 };
  if (
    merged.lastRoute &&
    merged.lastRouteAt &&
    now - merged.lastRouteAt <= ROUTE_TTL_MS
  ) {
    out.lastRoute = merged.lastRoute;
    out.lastRouteAt = merged.lastRouteAt;
  }
  if (
    merged.lastConversationId &&
    merged.lastConversationAt &&
    now - merged.lastConversationAt <= CONV_TTL_MS
  ) {
    out.lastConversationId = merged.lastConversationId;
    out.lastConversationAt = merged.lastConversationAt;
  }
  const sp = pruneScroll(merged.scrollPositions, now);
  if (sp) out.scrollPositions = sp;
  return out;
}

export function shouldPersistRoute(pathname: string, search: string): boolean {
  const p = pathname.toLowerCase();
  if (!pathname || pathname.length > 2048) return false;
  if (p.startsWith("/api/")) return false;
  if (p.startsWith("/_next")) return false;

  const blockPrefixes = [
    "/login",
    "/register",
    "/logout",
    "/auth",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/checkout",
    "/social-login-success",
    "/auth/social-success",
  ];
  for (const b of blockPrefixes) {
    if (p === b || p.startsWith(`${b}/`)) return false;
  }
  if (p.includes("payment")) return false;
  if (p.includes("stripe")) return false;

  const s = search.toLowerCase();
  if (s.includes("token=") && p.includes("reset")) return false;

  return true;
}

export function shouldRestoreRoute(fullPath: string): boolean {
  const q = fullPath.indexOf("?");
  const path = q >= 0 ? fullPath.slice(0, q) : fullPath;
  const search = q >= 0 ? fullPath.slice(q) : "";
  return shouldPersistRoute(path, search);
}

export function saveLastRoute(pathname: string, search: string): void {
  if (!shouldPersistRoute(pathname, search)) return;
  const searchNorm =
    !search || search === "?"
      ? ""
      : search.startsWith("?")
        ? search
        : `?${search}`;
  const full = `${pathname}${searchNorm}`;
  if (full.length > 3800) return;
  writeAppResumeState({ lastRoute: full });
}

export function saveLastConversationId(conversationId: string): void {
  if (!conversationId || conversationId.length > 128) return;
  writeAppResumeState({ lastConversationId: conversationId });
}

export function readLastConversationIdIfFresh(): string | null {
  const st = readAppResumeState();
  if (!st.lastConversationId || !st.lastConversationAt) return null;
  if (Date.now() - st.lastConversationAt > CONV_TTL_MS) return null;
  return st.lastConversationId;
}

export function saveScrollPosition(key: string, y: number): void {
  if (!key || key.length > 200) return;
  if (typeof y !== "number" || !Number.isFinite(y)) return;
  const cur = readAppResumeState();
  const scrollPositions = {
    ...cur.scrollPositions,
    [key]: { y: Math.max(0, Math.min(y, 1_000_000)), at: Date.now() },
  };
  writeAppResumeState({ scrollPositions });
}

export function readScrollPosition(key: string): number | null {
  const st = readAppResumeState();
  const e = st.scrollPositions?.[key];
  if (!e || typeof e.y !== "number") return null;
  if (Date.now() - e.at > SCROLL_TTL_MS) return null;
  return e.y;
}

export function isResumeHomeEntry(pathname: string): boolean {
  return pathname === "/" || pathname === "/en" || pathname === "";
}

/** Window scroll on mobile homepage (existing key). */
export const HOME_FEED_WINDOW_SCROLL_KEY = "feed:home";
/** Desktop sticky feed column scroll (#homecheff-feed-desktop). */
export const HOME_FEED_DESKTOP_SCROLL_KEY = "feed:home:desktop";

export function getScrollStorageKey(
  pathname: string,
  search: string
): string | null {
  const q = search.startsWith("?") ? search.slice(1) : search;
  const sp = new URLSearchParams(q);
  const isMessagesPath =
    pathname === "/messages" || pathname === "/en/messages";
  if (isMessagesPath && sp.has("conversation")) return null;
  if (pathname === "/" || pathname === "/en") return HOME_FEED_WINDOW_SCROLL_KEY;
  if (pathname === "/profile" || pathname === "/en/profile")
    return "feed:profile";
  if (pathname === "/mijn-hcp" || pathname === "/en/mijn-hcp")
    return "feed:mijn-hcp";
  if (isMessagesPath) return "ui:messages-list";
  return null;
}
