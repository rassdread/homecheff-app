/** Scroll position to restore after returning from soft-auth → login/register. */
export const SOFT_GATE_SCROLL_Y_KEY = 'hc_soft_gate_scroll_y';

export function rememberScrollForSoftGate(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SOFT_GATE_SCROLL_Y_KEY, String(window.scrollY));
  } catch {
    /* ignore */
  }
}

export function consumeScrollRestoreY(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SOFT_GATE_SCROLL_Y_KEY);
    sessionStorage.removeItem(SOFT_GATE_SCROLL_Y_KEY);
    if (!raw) return null;
    const y = parseInt(raw, 10);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}
