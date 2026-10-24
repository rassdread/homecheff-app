import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';
import { describeDeliveryPayout } from '@/lib/delivery/delivery-ops-queue';
import { describeMapsKeyPlacement } from '@/lib/delivery/maps-key-placement';

export const dynamic = 'force-dynamic';

/**
 * Read-only delivery operations view.
 * Shows failed webhook receipts and courier payouts that have no transfer id.
 */
export async function GET() {
  const guard = await requireAdminPermission('canViewDeliveryDetails');
  if (!guard.ok) return guard.response;

  const maps = describeMapsKeyPlacement();
  let webhookReceipts: Array<{
    eventId: string;
    eventType: string;
    livemode: boolean;
    status: string;
    httpStatus: number | null;
    attemptCount: number;
    updatedAt: Date;
  }> = [];
  let receiptStoreReady = true;
  try {
    webhookReceipts = await prisma.stripeWebhookReceipt.findMany({
      where: { status: { in: ['FAILED', 'PROCESSING', 'REJECTED'] } },
      orderBy: { updatedAt: 'desc' },
      take: 50,
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

  return NextResponse.json({
    webhookReceiptStoreReady: receiptStoreReady,
    unresolvedWebhookReceipts: webhookReceipts,
    deliveryPayoutsMissingTransfer: openPayouts,
    maps: {
      source: maps.source,
      browserKeyUsedForDistance: maps.browserKeyUsedForDistance,
      ipAllowlistFitsVercel: maps.ipAllowlistFitsVercel,
      serverKeyConfigured: maps.serverKeyConfigured,
    },
  });
}
