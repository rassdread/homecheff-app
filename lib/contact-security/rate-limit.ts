/**
 * Contact form IP rate limiting (in-memory, serverless-best-effort).
 * 5 / hour / IP, burst 3 / minute.
 */

import type { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/contact-security/client-ip';

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const MAX_PER_HOUR = 5;
const MAX_PER_MINUTE = 3;

type Bucket = { hourCount: number; hourReset: number; minuteCount: number; minuteReset: number };

const store = new Map<string, Bucket>();

function prune(now: number) {
  if (store.size < 5000) return;
  for (const [k, v] of store) {
    if (v.hourReset < now && v.minuteReset < now) store.delete(k);
  }
}

export type ContactRateLimitResult =
  | { allowed: true; remainingHour: number; retryAfterSec?: undefined }
  | { allowed: false; reason: 'RATE_LIMIT'; remainingHour: 0; retryAfterSec: number };

export function checkContactRateLimit(
  req: NextRequest,
  now = Date.now(),
): ContactRateLimitResult {
  // Dev localhost: generous
  if (process.env.NODE_ENV === 'development') {
    const ip = getClientIp(req);
    if (ip.includes('127.0.0.1') || ip.includes('::1') || ip === 'unknown') {
      return { allowed: true, remainingHour: MAX_PER_HOUR };
    }
  }

  prune(now);
  const ip = getClientIp(req);
  let bucket = store.get(ip);
  if (!bucket || now > bucket.hourReset) {
    bucket = {
      hourCount: 0,
      hourReset: now + HOUR_MS,
      minuteCount: 0,
      minuteReset: now + MINUTE_MS,
    };
    store.set(ip, bucket);
  }
  if (now > bucket.minuteReset) {
    bucket.minuteCount = 0;
    bucket.minuteReset = now + MINUTE_MS;
  }

  if (bucket.minuteCount >= MAX_PER_MINUTE) {
    return {
      allowed: false,
      reason: 'RATE_LIMIT',
      remainingHour: Math.max(0, MAX_PER_HOUR - bucket.hourCount),
      retryAfterSec: Math.max(1, Math.ceil((bucket.minuteReset - now) / 1000)),
    };
  }
  if (bucket.hourCount >= MAX_PER_HOUR) {
    return {
      allowed: false,
      reason: 'RATE_LIMIT',
      remainingHour: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.hourReset - now) / 1000)),
    };
  }

  bucket.minuteCount += 1;
  bucket.hourCount += 1;
  return {
    allowed: true,
    remainingHour: MAX_PER_HOUR - bucket.hourCount,
  };
}

/** Test helper — clear store between unit tests. */
export function __resetContactRateLimitStoreForTests() {
  store.clear();
}
