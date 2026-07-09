import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';

export const dynamic = 'force-dynamic';

type QueueItem = {
  id: string;
  source: string;
  type: string;
  status: string;
  reason: string;
  createdAt: string;
  tracked: boolean;
  note?: string;
  links: {
    userId?: string;
    orderId?: string;
    productId?: string;
    reportId?: string;
  };
};

export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission('canModerateContent');
  if (!guard.ok) return guard.response;

  const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') || 50), 100);
  const items: QueueItem[] = [];

  const [reports, moderationEvents, userReports, suspendedUsers, blockedCouriers] =
    await Promise.all([
      prisma.report.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          User_Report_reporterIdToUser: {
            select: { id: true, email: true, name: true },
          },
          User_Report_targetUserIdToUser: {
            select: { id: true, email: true, name: true },
          },
        },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          eventType: { in: ['CONTENT_MODERATION', 'MANUAL_MODERATION_REVIEW', 'USER_REPORT'] },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.analyticsEvent.findMany({
        where: { eventType: 'USER_REPORT' },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.user.findMany({
        where: { suspendedAt: { not: null } },
        orderBy: { suspendedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          email: true,
          name: true,
          suspendedAt: true,
          suspendReason: true,
        },
      }),
      prisma.deliveryProfile.findMany({
        where: { isBlocked: true },
        take: 20,
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      }),
    ]);

  for (const r of reports) {
    items.push({
      id: r.id,
      source: 'report',
      type: 'report',
      status: r.status,
      reason: r.reason,
      createdAt: r.createdAt.toISOString(),
      tracked: true,
      links: {
        userId: r.targetUserId ?? undefined,
        reportId: r.id,
      },
    });
  }

  const seenModeration = new Set<string>();
  for (const e of moderationEvents) {
    if (seenModeration.has(e.id)) continue;
    seenModeration.add(e.id);
    const meta = (e.metadata as Record<string, unknown>) || {};
    items.push({
      id: e.id,
      source: 'moderation',
      type: e.eventType,
      status: String(meta.status || 'pending'),
      reason: String(meta.reason || meta.flag || e.eventType),
      createdAt: e.createdAt.toISOString(),
      tracked: true,
      links: {
        userId: typeof meta.userId === 'string' ? meta.userId : undefined,
        productId: typeof meta.productId === 'string' ? meta.productId : undefined,
      },
    });
  }

  for (const u of suspendedUsers) {
    items.push({
      id: `suspended_${u.id}`,
      source: 'user_suspend',
      type: 'suspended_user',
      status: 'SUSPENDED',
      reason: u.suspendReason || 'Account suspended',
      createdAt: (u.suspendedAt ?? new Date()).toISOString(),
      tracked: true,
      links: { userId: u.id },
    });
  }

  for (const c of blockedCouriers) {
    items.push({
      id: `blocked_courier_${c.id}`,
      source: 'delivery',
      type: 'blocked_courier',
      status: 'BLOCKED',
      reason: c.blockReason || 'Courier blocked',
      createdAt: (c.blockedAt ?? c.updatedAt).toISOString(),
      tracked: true,
      links: { userId: c.userId },
    });
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    items: items.slice(0, limit),
    sources: {
      disputes: { tracked: true, count: reports.length },
      moderationLogs: { tracked: true, count: moderationEvents.length },
      userReports: {
        tracked: true,
        count: userReports.length,
        note: 'USER_REPORT events from analyticsEvent',
      },
      refundRequests: {
        tracked: false,
        note: 'Dedicated refund request queue not modeled separately',
      },
      suspiciousAffiliate: {
        tracked: false,
        note: 'Fraud scoring not persisted; use affiliate tab + commission ledger',
      },
      failedPaymentDisputes: {
        tracked: false,
        note: 'Stripe dispute objects not aggregated in admin API yet',
      },
    },
  });
}
