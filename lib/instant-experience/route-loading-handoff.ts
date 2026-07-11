/**
 * Phase 13N — avoids duplicate loading skeletons when route loading.tsx
 * already displayed a skeleton for the same navigation.
 */

const SESSION_KEY = 'hc_route_loading_handoff_at';

export function markRouteLoadingBoundaryShown(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  } catch {
    /* quota / private mode */
  }
}

/** True once within `maxAgeMs` after route loading.tsx mounted; consumes the flag. */
export function consumeRouteLoadingHandoff(maxAgeMs = 1200): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const age = Date.now() - Number(raw);
    sessionStorage.removeItem(SESSION_KEY);
    return age >= 0 && age <= maxAgeMs;
  } catch {
    return false;
  }
}
