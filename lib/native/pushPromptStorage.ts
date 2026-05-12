/**
 * Lokale opslag voor update-gerelateerde push-uitleg (geen tokens).
 */

const PREV_NATIVE_APP_VER_KEY = "hc_push_prev_seen_native_ver";
const PROMPT_DISMISSED_UNTIL_KEY = "hc_push_prompt_dismissed_until_ms";

/**
 * Eerste run na install: `prev` ontbreekt → false (geen “update”).
 * Na semver-wijziging op hetzelfde apparaat: true (één keer per nieuwe versie).
 */
export function consumeNativeBinaryVersionStep(
  currentVersion: string | null
): boolean {
  if (!currentVersion?.trim() || typeof window === "undefined") return false;
  const cur = currentVersion.trim().slice(0, 64);
  try {
    const prev = localStorage.getItem(PREV_NATIVE_APP_VER_KEY)?.trim();
    if (prev === cur) return false;
    localStorage.setItem(PREV_NATIVE_APP_VER_KEY, cur);
    return prev != null && prev !== cur;
  } catch {
    return false;
  }
}

export function getPushPromptDismissedUntil(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(PROMPT_DISMISSED_UNTIL_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function setPushPromptDismissedForDays(days = 7): void {
  if (typeof window === "undefined") return;
  try {
    const until = Date.now() + days * 24 * 60 * 60 * 1000;
    localStorage.setItem(PROMPT_DISMISSED_UNTIL_KEY, String(until));
  } catch {
    /* ignore */
  }
}

/** Alias met vaste 7-dagen cooldown (productrichtlijn). */
export function setPushPromptDismissedStandardCooldown(): void {
  setPushPromptDismissedForDays(7);
}

export const PUSH_PROMPT_STANDARD_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
