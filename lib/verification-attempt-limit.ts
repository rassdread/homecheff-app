/** Failed verification attempts. In-process; each serverless instance enforces its own window. */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_EMAIL = 8;
const MAX_PER_IP = 30;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function touch(key: string, now: number): Bucket {
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, fresh);
    return fresh;
  }
  return existing;
}

function lockedRetry(key: string, max: number, now: number): number {
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt || bucket.count < max) return 0;
  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

export function verificationClientIp(forwardedFor: string | null): string {
  const first = forwardedFor?.split(',')[0]?.trim() || '';
  if (!first || first.length > 80) return 'unknown';
  return first.slice(0, 80);
}

export function assertVerificationAttemptAllowed(input: {
  email?: string | null;
  ip?: string | null;
  now?: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = input.now ?? Date.now();
  const email = input.email?.trim().toLowerCase() || '';
  const ip = input.ip?.trim() || '';
  const waits = [
    email ? lockedRetry(`e:${email}`, MAX_PER_EMAIL, now) : 0,
    ip ? lockedRetry(`ip:${ip}`, MAX_PER_IP, now) : 0,
  ];
  const retryAfterSec = Math.max(...waits, 0);
  if (retryAfterSec > 0) return { ok: false, retryAfterSec };
  return { ok: true };
}

export function recordVerificationFailure(input: {
  email?: string | null;
  ip?: string | null;
  now?: number;
}): void {
  const now = input.now ?? Date.now();
  const email = input.email?.trim().toLowerCase() || '';
  const ip = input.ip?.trim() || '';
  if (buckets.size > 8000) {
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
  }
  if (email) touch(`e:${email}`, now).count += 1;
  if (ip) touch(`ip:${ip}`, now).count += 1;
}

export function clearVerificationFailures(email: string): void {
  const key = email.trim().toLowerCase();
  if (!key) return;
  buckets.delete(`e:${key}`);
}

export function _resetVerificationAttemptLimitForTests(): void {
  buckets.clear();
}
