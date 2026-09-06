/**
 * Incremental EctaroShip label status + cost sync via GET /api/v1/shipping/labels
 * Rate limit: 10 req/min/API key — keep cadence conservative.
 */

import { listShippingLabels } from '@/lib/ectaroship/partner-client';
import { prisma } from '@/lib/prisma';
import { mapProviderStatus } from '@/lib/shipping/status-map';
import { logShippingEvent } from '@/lib/shipping/observability';

function formatUpdatedSince(d: Date): string {
  // yyyy-MM-dd HH:mm:ss
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export async function runShippingStatusSync(): Promise<{
  ok: boolean;
  updated: number;
  pages: number;
  error?: string;
}> {
  const state = await prisma.shippingSyncState.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  });

  // Overlap window: 2h before last success to tolerate missed runs
  const cursorDate = state.lastSuccessfulSyncAt
    ? new Date(state.lastSuccessfulSyncAt.getTime() - 2 * 60 * 60 * 1000)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const updatedSince =
    state.updatedSinceCursor || formatUpdatedSince(cursorDate);

  let page = 1;
  let pages = 0;
  let updated = 0;
  const maxPages = 5; // stay under rate limit

  while (page <= maxPages) {
    const result = await listShippingLabels({
      updatedSince,
      page,
      pageSize: 50,
    });

    if (!result.ok) {
      if (result.status === 429 && result.retryAfterMs) {
        await new Promise((r) => setTimeout(r, result.retryAfterMs));
        continue;
      }
      return { ok: false, updated, pages, error: result.error };
    }

    pages += 1;
    if (result.labels.length === 0) break;

    for (const row of result.labels) {
      const mapped = mapProviderStatus(row.statusRaw);
      const whereOr: Array<{
        shippingProviderOrderId?: string;
        shippingLabelId?: string;
        shippingTrackingNumber?: string;
      }> = [];
      if (row.providerOrderId) {
        whereOr.push({ shippingProviderOrderId: row.providerOrderId });
        whereOr.push({ shippingLabelId: row.providerOrderId });
      }
      if (row.trackingCode) {
        whereOr.push({ shippingTrackingNumber: row.trackingCode });
      }

      if (whereOr.length === 0) continue;

      const orders = await prisma.order.findMany({
        where: { OR: whereOr },
        select: {
          id: true,
          shippingBuyerChargedCents: true,
          shippingCostCents: true,
          shippingActualCostCents: true,
        },
        take: 5,
      });

      for (const order of orders) {
        const actualCents =
          row.totalPrice != null && Number.isFinite(row.totalPrice)
            ? Math.round(row.totalPrice * 100)
            : undefined;
        const charged =
          order.shippingBuyerChargedCents ?? order.shippingCostCents ?? null;

        await prisma.order.update({
          where: { id: order.id },
          data: {
            shippingProviderStatus: mapped.internal,
            shippingProviderStatusRaw: mapped.raw,
            shippingStatus:
              mapped.internal === 'DELIVERED'
                ? 'delivered'
                : mapped.internal === 'IN_TRANSIT' || mapped.internal === 'SCANNED'
                  ? 'in_transit'
                  : mapped.internal === 'CANCELED'
                    ? 'canceled'
                    : mapped.internal === 'CREATED' || mapped.internal === 'PRINTED'
                      ? 'label_created'
                      : mapped.internal,
            shippingLastSyncedAt: new Date(),
            ...(row.trackingUrl
              ? { shippingTrackingUrl: row.trackingUrl }
              : {}),
            ...(row.trackingCode
              ? { shippingTrackingNumber: row.trackingCode }
              : {}),
            ...(row.carrier ? { shippingCarrier: row.carrier } : {}),
            ...(actualCents != null
              ? {
                  shippingActualCostCents: actualCents,
                  shippingLabelCostCents: actualCents,
                }
              : {}),
            ...(row.currency ? { shippingCurrency: row.currency } : {}),
            ...(mapped.internal === 'DELIVERED'
              ? { deliveredAt: new Date() }
              : {}),
          },
        });

        if (actualCents != null && charged != null) {
          const delta = charged - actualCents;
          logShippingEvent('SHIPPING_COST_RECONCILED', {
            orderId: order.id,
            charged,
            actual: actualCents,
            delta,
          });
          if (delta < 0) {
            logShippingEvent('SHIPPING_NEGATIVE_MARGIN', {
              orderId: order.id,
              charged,
              actual: actualCents,
              delta,
            });
          }
        }

        logShippingEvent('SHIPMENT_SYNC_UPDATED', {
          orderId: order.id,
          status: mapped.internal,
          raw: mapped.raw,
        });
        updated += 1;
      }
    }

    if (result.labels.length < 50) break;
    page += 1;
    // throttle between pages (~10/min → ≥6s)
    await new Promise((r) => setTimeout(r, 6500));
  }

  const now = new Date();
  await prisma.shippingSyncState.update({
    where: { id: 'default' },
    data: {
      lastSuccessfulSyncAt: now,
      updatedSinceCursor: formatUpdatedSince(now),
    },
  });

  return { ok: true, updated, pages };
}
