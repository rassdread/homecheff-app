/** In-process cooldown between verification resend emails per address (per runtime). */
const COOLDOWN_MS = 60_000;

type Entry = { lastSentAt: number };
const store = new Map<string, Entry>();
const inFlight = new Set<string>();

function resendKey(email: string): string {
  return email.toLowerCase().trim();
}

function pruneStale(now: number) {
  const maxAge = 15 * 60_000;
  for (const [k, v] of store.entries()) {
    if (now - v.lastSentAt > maxAge) store.delete(k);
  }
}

/**
 * Cooldown plus a single in-flight send per address.
 * A second request while the first is still sending does not mint another code.
 */
export function tryBeginVerificationResend(email: string):
  | { ok: true }
  | { ok: false; retryAfterSec: number } {
  const cooldown = assertCanResendVerification(email);
  if (!cooldown.ok) return cooldown;
  const key = resendKey(email);
  if (!key) return { ok: true };
  if (inFlight.has(key)) return { ok: false, retryAfterSec: 5 };
  inFlight.add(key);
  return { ok: true };
}

export function endVerificationResend(email: string) {
  const key = resendKey(email);
  if (!key) return;
  inFlight.delete(key);
}

export function assertCanResendVerification(email: string):
  | { ok: true }
  | { ok: false; retryAfterSec: number } {
  const key = resendKey(email);
  if (!key) return { ok: true };
  const now = Date.now();
  if (store.size > 5000) pruneStale(now);
  const prev = store.get(key);
  if (prev && now - prev.lastSentAt < COOLDOWN_MS) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((COOLDOWN_MS - (now - prev.lastSentAt)) / 1000)),
    };
  }
  return { ok: true };
}

export function markResendVerificationSent(email: string) {
  const key = resendKey(email);
  if (!key) return;
  store.set(key, { lastSentAt: Date.now() });
}

export function _resetVerificationResendRateLimitForTests() {
  store.clear();
  inFlight.clear();
}
