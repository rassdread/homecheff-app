/**
 * Post-payment EctaroShip shipment creation — idempotent, fail-soft on provider outage.
 *
 * State machine (shippingStatus):
 *   QUOTE → CHECKOUT_CREATED → PAYMENT_SUCCEEDED →
 *   SHIPMENT_PENDING | SHIPMENT_CREATING → SHIPMENT_CREATED / label_created → …
 *   SHIPMENT_FAILED_RETRYABLE | SHIPMENT_BLOCKED_NO_CHARGE
 */

import { createShippingLabel, type EctaroShipLabelRequest } from '@/lib/ectaroship';
import { prisma } from '@/lib/prisma';
import {
  parseShippingAddressSnapshot,
  type ShippingAddressSnapshot,
} from '@/lib/shipping/address-snapshot';
import type { ShippingQuoteSnapshot } from '@/lib/shipping/quote-service';
import { NotificationService } from '@/lib/notifications/notification-service';

export { assertShippingChargeBeforeBillableLabel } from '@/lib/shipping/invariants';

export type EnsureShipmentResult =
  | { status: 'already_created'; labelId: string }
  | { status: 'created'; labelId: string; trackingNumber: string }
  | { status: 'blocked_no_charge' }
  | { status: 'pending_provider_config' }
  | { status: 'failed_retryable'; error: string }
  | { status: 'skipped_not_shipping' }
  | { status: 'concurrent_in_progress' }
  | { status: 'order_not_found' }
  | { status: 'address_incomplete'; error: string };

const TERMINAL_OK = new Set([
  'label_created',
  'SHIPMENT_CREATED',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
]);

function parseQuoteSnapshot(raw: unknown): ShippingQuoteSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.priceCents !== 'number' || typeof o.weightKg !== 'number') return null;
  return o as unknown as ShippingQuoteSnapshot;
}

/**
 * Create at most one billable EctaroShip label per order after payment.
 * Safe under Stripe webhook retries and concurrent workers.
 */
export async function ensurePaidOrderShipment(
  orderId: string,
): Promise<EnsureShipmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      shippingLabels: { take: 1, orderBy: { createdAt: 'asc' } },
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      address: true,
                      postalCode: true,
                      city: true,
                      country: true,
                      phoneNumber: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
  });

  if (!order) return { status: 'order_not_found' };

  if (String(order.deliveryMode) !== 'SHIPPING') {
    return { status: 'skipped_not_shipping' };
  }

  if (order.shippingLabels[0]?.ectaroShipLabelId || order.shippingLabelId) {
    return {
      status: 'already_created',
      labelId: order.shippingLabels[0]?.ectaroShipLabelId || order.shippingLabelId!,
    };
  }

  if (TERMINAL_OK.has(String(order.shippingStatus ?? ''))) {
    return {
      status: 'already_created',
      labelId: order.shippingLabelId || 'unknown',
    };
  }

  const collected = order.shippingCostCents ?? 0;
  if (!Number.isInteger(collected) || collected <= 0) {
    await prisma.order.update({
      where: { id: orderId },
      data: { shippingStatus: 'SHIPMENT_BLOCKED_NO_CHARGE' },
    });
    return { status: 'blocked_no_charge' };
  }

  if (!process.env.ECTAROSHIP_API_KEY?.trim()) {
    await prisma.order.update({
      where: { id: orderId },
      data: { shippingStatus: 'SHIPMENT_PENDING' },
    });
    return { status: 'pending_provider_config' };
  }

  // Atomic claim — concurrent Stripe retries lose here
  const claimed = await prisma.order.updateMany({
    where: {
      id: orderId,
      shippingLabelId: null,
      OR: [
        { shippingStatus: null },
        { shippingStatus: 'SHIPMENT_PENDING' },
        { shippingStatus: 'SHIPMENT_FAILED_RETRYABLE' },
        { shippingStatus: 'PAYMENT_SUCCEEDED' },
      ],
    },
    data: { shippingStatus: 'SHIPMENT_CREATING' },
  });

  if (claimed.count === 0) {
    const again = await prisma.shippingLabel.findFirst({ where: { orderId } });
    if (again) {
      return { status: 'already_created', labelId: again.ectaroShipLabelId };
    }
    return { status: 'concurrent_in_progress' };
  }

  try {
    const quote = parseQuoteSnapshot(order.shippingQuoteSnapshot);
    const destSnap =
      parseShippingAddressSnapshot(order.shippingAddressSnapshot) ||
      fallbackDestinationFromOrder(order);
    const originSnap =
      parseShippingAddressSnapshot(order.shippingOriginSnapshot) ||
      fallbackOriginFromItems(order);

    if (!destSnap || !originSnap) {
      await prisma.order.update({
        where: { id: orderId },
        data: { shippingStatus: 'SHIPMENT_FAILED_RETRYABLE' },
      });
      return {
        status: 'address_incomplete',
        error: 'Checkout address snapshot missing for label creation',
      };
    }

    const weight = quote?.weightKg;
    const dims = quote
      ? {
          length: quote.lengthCm,
          width: quote.widthCm,
          height: quote.heightCm,
        }
      : null;

    if (!weight || !dims) {
      await prisma.order.update({
        where: { id: orderId },
        data: { shippingStatus: 'SHIPMENT_FAILED_RETRYABLE' },
      });
      return {
        status: 'failed_retryable',
        error: 'Missing authoritative parcel quote snapshot',
      };
    }

    const labelRequest: EctaroShipLabelRequest = {
      orderId,
      recipient: {
        name: destSnap.name,
        address: destSnap.addressLine,
        postalCode: destSnap.postalCode,
        city: destSnap.city,
        country: destSnap.country,
        email: destSnap.email,
        phone: destSnap.phone,
      },
      sender: {
        name: originSnap.name,
        address: originSnap.addressLine,
        postalCode: originSnap.postalCode,
        city: originSnap.city,
        country: originSnap.country,
        email: originSnap.email,
        phone: originSnap.phone,
      },
      weight,
      dimensions: dims,
      carrier: quote?.carrier,
      description: `Order ${order.orderNumber || orderId}`,
    };

    const labelResult = await createShippingLabel(labelRequest);

    if ('error' in labelResult) {
      await prisma.order.update({
        where: { id: orderId },
        data: { shippingStatus: 'SHIPMENT_FAILED_RETRYABLE' },
      });
      return { status: 'failed_retryable', error: labelResult.error };
    }

    // Persist label — unique-ish by checking again before create
    const race = await prisma.shippingLabel.findFirst({ where: { orderId } });
    if (race) {
      return { status: 'already_created', labelId: race.ectaroShipLabelId };
    }

    try {
      await prisma.shippingLabel.create({
        data: {
          orderId,
          ectaroShipLabelId: labelResult.labelId,
          pdfUrl: labelResult.pdfUrl,
          trackingNumber: labelResult.trackingNumber,
          carrier: labelResult.carrier,
          status: 'generated',
          priceCents: Math.round(labelResult.price * 100),
        },
      });
    } catch (e: unknown) {
      // Concurrent create — treat as success if row exists
      const existing = await prisma.shippingLabel.findFirst({ where: { orderId } });
      if (existing) {
        return { status: 'already_created', labelId: existing.ectaroShipLabelId };
      }
      throw e;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingLabelId: labelResult.labelId,
        shippingTrackingNumber: labelResult.trackingNumber,
        shippingCarrier: labelResult.carrier,
        shippingStatus: 'label_created',
        shippingLabelCostCents: Math.round(labelResult.price * 100),
      },
    });

    const sellerId = order.items[0]?.Product?.seller?.User?.id;
    if (sellerId) {
      try {
        await NotificationService.sendShippingLabelReadyNotification(
          sellerId,
          orderId,
          order.orderNumber || orderId,
          labelResult.trackingNumber,
        );
      } catch (notifError) {
        console.error('[ensurePaidOrderShipment] notification failed', notifError);
      }
    }

    return {
      status: 'created',
      labelId: labelResult.labelId,
      trackingNumber: labelResult.trackingNumber,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    await prisma.order.update({
      where: { id: orderId },
      data: { shippingStatus: 'SHIPMENT_FAILED_RETRYABLE' },
    }).catch(() => undefined);
    return { status: 'failed_retryable', error: message };
  }
}

function fallbackDestinationFromOrder(order: {
  deliveryAddress: string | null;
  shippingAddressSnapshot: unknown;
  User: { name: string | null; email: string | null; phoneNumber: string | null } | null;
}): ShippingAddressSnapshot | null {
  // Prefer snapshot; free-text deliveryAddress alone is insufficient for labels
  return parseShippingAddressSnapshot(order.shippingAddressSnapshot);
}

function fallbackOriginFromItems(order: {
  shippingOriginSnapshot: unknown;
  items: Array<{
    Product: {
      seller: {
        User: {
          name: string | null;
          email: string | null;
          phoneNumber: string | null;
          address: string | null;
          postalCode: string | null;
          city: string | null;
          country: string | null;
        } | null;
      } | null;
    } | null;
  }>;
}): ShippingAddressSnapshot | null {
  const snap = parseShippingAddressSnapshot(order.shippingOriginSnapshot);
  if (snap) return snap;
  const u = order.items[0]?.Product?.seller?.User;
  if (!u?.address || !u.postalCode || !u.city || !u.country) return null;
  return {
    name: u.name || 'Verkoper',
    addressLine: u.address,
    postalCode: u.postalCode,
    city: u.city,
    country: u.country.toUpperCase(),
    email: u.email || undefined,
    phone: u.phoneNumber || undefined,
  };
}
