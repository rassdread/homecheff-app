/**
 * Lightweight session hints for in-app "back" when the browser history stack is shallow
 * (e.g. cold open / deep link). Synced by NavigationHistorySync on pathname changes.
 */
const CUR = 'hc_nav_cur';
const PREV = 'hc_nav_prev';

/** `path` = pathname + optional search + hash (e.g. `/?chip=sale#homecheff-feed`). */
export function syncNavPath(path: string): void {
  if (typeof window === 'undefined') return;
  if (!path.startsWith('/')) return;
  try {
    const normalized = path.length > 3800 ? path.slice(0, 3800) : path;
    const cur = sessionStorage.getItem(CUR);
    if (cur && cur !== normalized) {
      sessionStorage.setItem(PREV, cur);
    }
    sessionStorage.setItem(CUR, normalized);
  } catch {
    /* ignore quota / private mode */
  }
}

export function getTrackedPreviousPath(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const p = sessionStorage.getItem(PREV);
    const cur = `${window.location.pathname}${window.location.search}`;
    if (!p || !p.startsWith('/') || p === cur) return null;
    return p;
  } catch {
    return null;
  }
}

export function getSameOriginReferrerPath(): string | null {
  if (typeof document === 'undefined' || !document.referrer) return null;
  try {
    const ref = new URL(document.referrer);
    if (ref.origin !== window.location.origin) return null;
    const path = `${ref.pathname}${ref.search}${ref.hash}`;
    const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (!path || path === cur) return null;
    return path;
  } catch {
    return null;
  }
}
