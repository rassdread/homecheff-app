/**
 * Structured contact security logging + lightweight metrics (AuditLog + memory).
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';

export type ContactRejectReason =
  | 'TURNSTILE_FAILED'
  | 'TURNSTILE_MISSING'
  | 'HONEYPOT_TRIGGERED'
  | 'RATE_LIMIT'
  | 'TIMING_TOO_FAST'
  | 'HIGH_SPAM_SCORE'
  | 'INVALID_EMAIL'
  | 'INVALID_FIELDS'
  | 'MESSAGE_TOO_LONG';

type MetricBucket = {
  dayKey: string;
  rejected: number;
  accepted: number;
  byReason: Record<string, number>;
};

declare global {
  // eslint-disable-next-line no-var
  var __hcContactSecurityMetrics: MetricBucket | undefined;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getBucket(): MetricBucket {
  const key = todayKey();
  const existing = globalThis.__hcContactSecurityMetrics;
  if (!existing || existing.dayKey !== key) {
    globalThis.__hcContactSecurityMetrics = {
      dayKey: key,
      rejected: 0,
      accepted: 0,
      byReason: {},
    };
  }
  return globalThis.__hcContactSecurityMetrics!;
}

export function getContactSecurityMetricsSnapshot() {
  const b = getBucket();
  return {
    day: b.dayKey,
    spamBlockedToday: b.rejected,
    acceptedToday: b.accepted,
    byReason: { ...b.byReason },
    turnstileFailures: (b.byReason.TURNSTILE_FAILED || 0) + (b.byReason.TURNSTILE_MISSING || 0),
    rateLimitHits: b.byReason.RATE_LIMIT || 0,
    honeypotHits: b.byReason.HONEYPOT_TRIGGERED || 0,
    timingHits: b.byReason.TIMING_TOO_FAST || 0,
    highSpamScore: b.byReason.HIGH_SPAM_SCORE || 0,
  };
}

export async function logContactSecurityEvent(params: {
  outcome: 'rejected' | 'accepted';
  reason?: ContactRejectReason | string;
  ipHash?: string;
  uaHash?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const bucket = getBucket();
  if (params.outcome === 'rejected') {
    bucket.rejected += 1;
    const reason = params.reason || 'UNKNOWN';
    bucket.byReason[reason] = (bucket.byReason[reason] || 0) + 1;
  } else {
    bucket.accepted += 1;
  }

  const payload = {
    outcome: params.outcome,
    reason: params.reason,
    ipHash: params.ipHash,
    uaHash: params.uaHash,
    ...params.meta,
  };

  console.info(
    JSON.stringify({
      type: 'CONTACT_SECURITY',
      ts: new Date().toISOString(),
      ...payload,
    }),
  );

  try {
    await prisma.auditLog.create({
      data: {
        id: randomUUID(),
        action: 'CONTACT_SECURITY',
        meta: payload,
      },
    });
  } catch (err) {
    // Never fail the request path on metrics persistence
    console.error('[contact-security] audit log failed', err);
  }
}
