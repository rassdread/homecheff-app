import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';
import { describeDeliveryPayout } from '@/lib/delivery/delivery-ops-queue';
import { assessMapsProductionConfig } from '@/lib/delivery/maps-key-placement';
import {
  boundedOpsLimit,
  classifyDeliveryOperations,
  opsCursor,
} from '@/lib/delivery/delivery-operations-status';

export const dynamic = 'force-dynamic';

const STALE_MS = 5 * 60_000;

/**
 * Read-only delivery operations view.
 * Shows webhook receipt status and courier payouts that have no transfer id.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdminPermission('canViewDeliveryDetails');
  if (!guard.ok) return guard.response;

  const limit = boundedOpsLimit(req.nextUrl.searchParams.get('limit'));
  const cursor = opsCursor(req.nextUrl.searchParams.get('cursor'));
  const maps = assessMapsProductionConfig();
  const staleBefore = new Date(Date.now() - STALE_MS);

  let receiptStoreReady = true;
  let statusCounts: Record<string, number> = {};
  let unresolvedWebhookReceipts: Array<{
    eventId: string;
    eventType: string;
    livemode: boolean;
    status: string;
    httpStatus: number | null;
    attemptCount: number;
    updatedAt: Date;
  }> = [];
  let nextCursor: string | null = null;
  let repeatedFailures: typeof unresolvedWebhookReceipts = [];
  let staleProcessing: typeof unresolvedWebhookReceipts = [];
  let recentRecoveryAttempts: Array<{
    eventId: string;
    actorUserId: string;
    result: string;
    createdAt: Date;
  }> = [];

  try {
    const grouped = await prisma.stripeWebhookReceipt.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    statusCounts = Object.fromEntries(grouped.map((row) => [row.status, row._count._all]));
    const cursorRow = cursor
      ? await prisma.stripeWebhookReceipt.findUnique({
          where: { eventId: cursor },
          select: { updatedAt: true },
        })
      : null;
    const page = await prisma.stripeWebhookReceipt.findMany({
      where: {
        status: { in: ['FAILED', 'PROCESSING', 'REJECTED'] },
        ...(cursorRow ? { updatedAt: { lt: cursorRow.updatedAt } } : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit + 1,
      select: {
        eventId: true,
        eventType: true,
        livemode: true,
        status: true,
        httpStatus: true,
        attemptCount: true,
        updatedAt: true,
      },
    });
    if (page.length > limit) {
      nextCursor = page[limit - 1]?.eventId ?? null;
      unresolvedWebhookReceipts = page.slice(0, limit);
    } else {
      unresolvedWebhookReceipts = page;
    }
    repeatedFailures = await prisma.stripeWebhookReceipt.findMany({
      where: { status: 'FAILED', attemptCount: { gte: 3 } },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        eventId: true,
        eventType: true,
        livemode: true,
        status: true,
        httpStatus: true,
        attemptCount: true,
        updatedAt: true,
      },
    });
    staleProcessing = await prisma.stripeWebhookReceipt.findMany({
      where: { status: 'PROCESSING', updatedAt: { lt: staleBefore } },
      orderBy: { updatedAt: 'asc' },
      take: 20,
      select: {
        eventId: true,
        eventType: true,
        livemode: true,
        status: true,
        httpStatus: true,
        attemptCount: true,
        updatedAt: true,
      },
    });
  } catch {
    receiptStoreReady = false;
  }

  try {
    recentRecoveryAttempts = await prisma.stripeWebhookRecoveryAttempt.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { eventId: true, actorUserId: true, result: true, createdAt: true },
    });
  } catch {
    recentRecoveryAttempts = [];
  }

  const payouts = await prisma.payout.findMany({
    where: { id: { startsWith: 'payout_delivery_' } },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      amountCents: true,
      toUserId: true,
      providerRef: true,
      transferFailureCode: true,
      transferFailureAt: true,
    },
  });
  const openPayouts = payouts
    .map(describeDeliveryPayout)
    .filter((row) => !row.transferExists);

  const alerts = classifyDeliveryOperations({
    failedRepeated: repeatedFailures.length,
    processingStale: staleProcessing.length,
    rejected: statusCounts.REJECTED ?? 0,
    payoutsMissingTransfer: openPayouts.length,
    mapsRuntime: maps.runtime,
    mapsPayable: maps.payable,
    receiptStoreReady,
  });

  return NextResponse.json({
    webhookReceiptStoreReady: receiptStoreReady,
    webhookStatusCounts: statusCounts,
    unresolvedWebhookReceipts,
    nextCursor,
    repeatedFailures,
    staleProcessing,
    recentRecoveryAttempts,
    alerts,
    deliveryPayoutsMissingTransfer: openPayouts,
    livemodeRecoveryEnabled: process.env.HOMECHEFF_WEBHOOK_RECOVERY_LIVEMODE === 'enabled',
    maps: {
      runtime: maps.runtime,
      source: maps.serverKeyConfigured ? 'server' : 'missing',
      browserKeyUsedForDistance: false,
      serverKeyCopiedToBrowser: maps.serverKeyCopiedToBrowser,
      ipAllowlistFitsVercel: false,
      serverKeyConfigured: maps.serverKeyConfigured,
      payable: maps.payable,
      reason: maps.reason,
    },
    identity: {
      governmentDocumentStoredByHomeCheff: false,
      assignmentUsesStripeDocumentCheck: false,
    },
  });
}
