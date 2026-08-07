/**
 * Admin contact security metrics (aggregates, no PII).
 * GET /api/admin/contact-security-metrics
 */

import { NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-guard';
import { getContactSecurityMetricsSnapshot } from '@/lib/contact-security/logging';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAdminPermission('canViewAuditLogs');
  if (!guard.ok) return guard.response;

  const memory = getContactSecurityMetricsSnapshot();

  let dbByReason: Record<string, number> = {};
  let dbRejected24h = 0;
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const rows = await prisma.auditLog.findMany({
      where: {
        action: 'CONTACT_SECURITY',
        createdAt: { gte: since },
      },
      select: { meta: true },
      take: 2000,
    });
    for (const row of rows) {
      const meta = row.meta as { outcome?: string; reason?: string } | null;
      if (!meta || meta.outcome !== 'rejected') continue;
      dbRejected24h += 1;
      const reason = meta.reason || 'UNKNOWN';
      dbByReason[reason] = (dbByReason[reason] || 0) + 1;
    }
  } catch {
    /* memory-only fallback */
  }

  const topReasons = Object.entries({ ...memory.byReason, ...dbByReason })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));

  return NextResponse.json({
    ok: true,
    memory,
    last24h: {
      spamBlocked: Math.max(memory.spamBlockedToday, dbRejected24h),
      byReason: dbByReason,
    },
    topSpamReasons: topReasons,
    turnstileFailures:
      memory.turnstileFailures +
      (dbByReason.TURNSTILE_FAILED || 0) +
      (dbByReason.TURNSTILE_MISSING || 0),
    rateLimitHits: memory.rateLimitHits + (dbByReason.RATE_LIMIT || 0),
  });
}
