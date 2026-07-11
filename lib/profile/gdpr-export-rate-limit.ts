/**
 * Phase 13T — Per-user GDPR export rate limit (pilot scale, in-memory).
 * Production scale: move to Redis or DB-backed counter.
 */

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_EXPORTS_PER_WINDOW =
  process.env.NODE_ENV === 'development' ? 50 : 3;

const store = new Map<string, { count: number; resetAt: number }>();

export type GdprExportRateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

export function checkGdprExportRateLimit(userId: string): GdprExportRateLimitResult {
  const now = Date.now();
  const record = store.get(userId);

  if (!record || now >= record.resetAt) {
    store.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_EXPORTS_PER_WINDOW - 1 };
  }

  if (record.count >= MAX_EXPORTS_PER_WINDOW) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  record.count += 1;
  return { allowed: true, remaining: MAX_EXPORTS_PER_WINDOW - record.count };
}

/** Test helper — reset counters. */
export function resetGdprExportRateLimitForTests(): void {
  store.clear();
}
