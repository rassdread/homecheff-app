/**
 * Na login automatisch quick-add openen (normale create-CTA’s terwijl uitgelogd).
 * Alleen frontend; één keer consumeren om dubbele opens te voorkomen.
 */
export const AFTER_LOGIN_CREATE_ACTION_KEY = "homecheff:afterLoginAction";
export const AFTER_LOGIN_OPEN_QUICK_ADD = "openQuickAdd";

export function setPendingOpenQuickAddAfterLogin(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(AFTER_LOGIN_CREATE_ACTION_KEY, AFTER_LOGIN_OPEN_QUICK_ADD);
  } catch {
    /* quota / private mode */
  }
}

export function clearPendingOpenQuickAddAfterLogin(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(AFTER_LOGIN_CREATE_ACTION_KEY);
  } catch {
    /* ignore */
  }
}

export function hasPendingOpenQuickAddAfterLogin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      sessionStorage.getItem(AFTER_LOGIN_CREATE_ACTION_KEY) === AFTER_LOGIN_OPEN_QUICK_ADD
    );
  } catch {
    return false;
  }
}
