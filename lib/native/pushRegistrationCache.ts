/**
 * Laatste geregistreerde FCM-token voor logout-unregister (DELETE /api/push/register).
 * Key zonder "token" substring zodat session-cleanup bij login/logout niet per ongeluk auth-keys raakt.
 */

const STORAGE_KEY = "hc_npush_reg";

export function setCachedPushRegistrationId(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, token.trim());
  } catch {
    /* ignore */
  }
}

export function getCachedPushRegistrationId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearCachedPushRegistrationId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
