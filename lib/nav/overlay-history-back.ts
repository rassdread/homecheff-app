/**
 * Overlay Back contract (web + Capacitor).
 *
 * Temporary UI layers register while open. Phone/browser Back dismisses the
 * topmost layer before route history.
 *
 * Programmatic close (X, Link click, backdrop) MUST NOT call history.back() —
 * that races Next.js <Link> navigation and cancels the destination (e.g. Careers).
 * Instead strip the overlay marker via replaceState.
 */

import { pushAndroidBackHandler } from "@/lib/native/androidCreateFlowBack";

export const OVERLAY_BACK_STATE_KEY = "hcOverlayBack";

type OverlayBackState = Record<string, unknown> & {
  [OVERLAY_BACK_STATE_KEY]?: string;
};

function readOverlayKey(state: unknown): string | null {
  if (!state || typeof state !== "object") return null;
  const key = (state as OverlayBackState)[OVERLAY_BACK_STATE_KEY];
  return typeof key === "string" && key.length > 0 ? key : null;
}

function stripOverlayKey(state: unknown): object {
  if (!state || typeof state !== "object") return {};
  const next = { ...(state as OverlayBackState) };
  delete next[OVERLAY_BACK_STATE_KEY];
  return next;
}

/**
 * While `active`, own one history entry + Android back slot.
 * `onDismiss` must close the overlay (idempotent).
 * Returns cleanup (also safe if already closed).
 */
export function bindOverlayHistoryBack(args: {
  id: string;
  active: boolean;
  onDismiss: () => void;
}): () => void {
  if (typeof window === "undefined" || !args.active) {
    return () => undefined;
  }

  const id = args.id;
  let ownedHistory = false;
  let closedByPop = false;
  let disposed = false;

  try {
    const base =
      window.history.state && typeof window.history.state === "object"
        ? { ...(window.history.state as object) }
        : {};
    window.history.pushState({ ...base, [OVERLAY_BACK_STATE_KEY]: id }, "");
    ownedHistory = true;
  } catch {
    ownedHistory = false;
  }

  const onPop = (event: PopStateEvent) => {
    if (disposed) return;
    const nextKey = readOverlayKey(event.state);
    if (nextKey === id) return;
    closedByPop = true;
    ownedHistory = false;
    try {
      args.onDismiss();
    } catch {
      /* ignore */
    }
  };

  window.addEventListener("popstate", onPop);

  const unsubAndroid = pushAndroidBackHandler(() => {
    if (disposed) return false;
    try {
      if (ownedHistory && readOverlayKey(window.history.state) === id) {
        window.history.back();
        return true;
      }
    } catch {
      /* fall through */
    }
    try {
      args.onDismiss();
      return true;
    } catch {
      return false;
    }
  });

  return () => {
    if (disposed) return;
    disposed = true;
    window.removeEventListener("popstate", onPop);
    unsubAndroid();
    if (closedByPop || !ownedHistory) return;
    try {
      if (readOverlayKey(window.history.state) === id) {
        // Do NOT history.back() — that aborts concurrent <Link> navigations.
        window.history.replaceState(stripOverlayKey(window.history.state), "");
      }
    } catch {
      /* ignore */
    }
  };
}
