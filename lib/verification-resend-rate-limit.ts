/** In-process cooldown between verification resend emails per address (per runtime). */
const COOLDOWN_MS = 60_000;

type Entry = { lastSentAt: number };
const store = new Map<string, Entry>();

function pruneStale(now: number) {
  const maxAge = 15 * 60_000;
  for (const [k, v] of store.entries()) {
    if (now - v.lastSentAt > maxAge) store.delete(k);
  }
}

export function assertCanResendVerification(email: string):
  | { ok: true }
  | { ok: false; retryAfterSec: number } {
  const key = email.toLowerCase().trim();
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
  const key = email.toLowerCase().trim();
  if (!key) return;
  store.set(key, { lastSentAt: Date.now() });
}
