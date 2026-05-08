import {
  isSafeRestorablePath,
  toTrailingSlashPath,
  parseInternalPathFromUnknownInput,
} from "@/lib/native/safeRoute";
import type { NativePendingRoute } from "@/lib/native/nativeShellKeys";
import { NATIVE_PENDING_ROUTE_KEY } from "@/lib/native/nativeShellKeys";

function readDataRecord(
  data: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  return data;
}

/**
 * Zet FCM / Capacitor notification data om naar een intern pad.
 * Alleen allowlist-paden; geen externe URL's.
 */
export function pathFromPushNotificationData(
  data: Record<string, unknown> | undefined
): string | null {
  const d = readDataRecord(data);

  const direct =
    typeof d.path === "string"
      ? d.path
      : typeof d.route === "string"
        ? d.route
        : typeof d.link === "string"
          ? d.link
          : typeof d.actionUrl === "string"
            ? d.actionUrl
            : null;
  if (direct) {
    const parsed = parseInternalPathFromUnknownInput(direct);
    if (parsed) return parsed;
  }

  const conversationId =
    typeof d.conversationId === "string"
      ? d.conversationId
      : typeof d.conversation_id === "string"
        ? d.conversation_id
        : null;
  if (conversationId && /^[a-zA-Z0-9_-]{6,}$/.test(conversationId)) {
    const p = `/messages/${conversationId}`;
    if (isSafeRestorablePath(p)) return toTrailingSlashPath(p);
  }

  const orderId =
    typeof d.orderId === "string"
      ? d.orderId
      : typeof d.order_id === "string"
        ? d.order_id
        : null;
  if (orderId && /^[a-zA-Z0-9_-]{6,}$/.test(orderId)) {
    const p = `/orders/${orderId}`;
    if (isSafeRestorablePath(p)) return toTrailingSlashPath(p);
  }

  return null;
}

export function storePendingNativeRoute(path: string): void {
  if (typeof window === "undefined") return;
  if (!isSafeRestorablePath(path)) return;
  try {
    const payload: NativePendingRoute = {
      v: 1,
      path: toTrailingSlashPath(path),
      ts: Date.now(),
    };
    sessionStorage.setItem(NATIVE_PENDING_ROUTE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private */
  }
}

export function readPendingNativeRoute(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(NATIVE_PENDING_ROUTE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NativePendingRoute;
    if (parsed?.v !== 1 || typeof parsed.path !== "string") return null;
    if (Date.now() - (parsed.ts ?? 0) > 10 * 60 * 1000) {
      sessionStorage.removeItem(NATIVE_PENDING_ROUTE_KEY);
      return null;
    }
    if (!isSafeRestorablePath(parsed.path)) return null;
    return toTrailingSlashPath(parsed.path);
  } catch {
    return null;
  }
}

export function consumePendingNativeRoute(): string | null {
  const p = readPendingNativeRoute();
  if (p) {
    try {
      sessionStorage.removeItem(NATIVE_PENDING_ROUTE_KEY);
    } catch {
      /* ignore */
    }
  }
  return p;
}
