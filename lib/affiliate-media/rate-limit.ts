const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkAffiliateMediaUploadRateLimit(
  userId: string,
  maxPerHour: number,
  now = Date.now(),
): { allowed: boolean; remaining: number } {
  const key = userId;
  const hour = 60 * 60 * 1000;
  const rec = buckets.get(key);
  if (!rec || now >= rec.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + hour });
    return { allowed: true, remaining: maxPerHour - 1 };
  }
  if (rec.count >= maxPerHour) return { allowed: false, remaining: 0 };
  rec.count += 1;
  return { allowed: true, remaining: maxPerHour - rec.count };
}

export function _resetAffiliateMediaRateLimitForTests(): void {
  buckets.clear();
}
