/**
 * Post-payment Partner API label creation — idempotent under Stripe retries.
 */

import {
  createPartnerLabel,
  isAllowedEctaroDocumentUrl,
  type PartnerAddress,
} from '@/lib/ectaroship/partner-client';
import { prisma } from '@/lib/prisma';
import {
  parseShippingAddressSnapshot,
  type ShippingAddressSnapshot,
} from '@/lib/shipping/address-snapshot';
import type { ShippingQuoteSnapshot } from '@/lib/shipping/quote-service';
import { NotificationService } from '@/lib/notifications/notification-service';
import { logShippingEvent } from '@/lib/shipping/observability';
import { assertShippingChargeBeforeBillableLabel } from '@/lib/shipping/invariants';

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
  'created',
  'printed',
  'scanned',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
]);

function parseQuoteSnapshot(raw: unknown): ShippingQuoteSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.priceCents !== 'number') return null;
  return o as unknown as ShippingQuoteSnapshot;
}

function splitStreet(addressLine: string): { street: string; houseNumber: string } {
  const m = addressLine.trim().match(/^(.+?)\s+(\d+[a-zA-Z0-9\-\/]*)$/);
  if (m) return { street: m[1]!.trim(), houseNumber: m[2]! };
  return { street: addressLine.trim(), houseNumber: '1' };
}

function toPartnerAddress(
  snap: ShippingAddressSnapshot,
  opts?: { companyName?: string | null },
): PartnerAddress {
  const street = snap.street || splitStreet(snap.addressLine).street;
  const houseNumber =
    snap.houseNumber || splitStreet(snap.addressLine).houseNumber;
  return {
    fullname: snap.name,
    companyName: opts?.companyName?.trim() || undefined,
    countryCode: snap.country,
    city: snap.city,
    postalCode: snap.postalCode,
    street,
    houseNumber,
    email: snap.email,
    phone: snap.phone,
  };
}

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
                select: {
                  companyName: true,
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

  const collected =
    (order as { shippingBuyerChargedCents?: number | null }).shippingBuyerChargedCents ??
    order.shippingCostCents ??
    0;
  if (!assertShippingChargeBeforeBillableLabel(collected)) {
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

  logShippingEvent('SHIPMENT_CREATE_STARTED', { orderId });

  try {
    const quote = parseQuoteSnapshot(order.shippingQuoteSnapshot);
    const destSnap =
      parseShippingAddressSnapshot(order.shippingAddressSnapshot) ||
      parseShippingAddressSnapshot(null);
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

    const methodId =
      (order as { shippingMethodId?: string | null }).shippingMethodId ||
      quote?.shippingMethodId;
    const weightGrams =
      quote?.weightGrams ??
      (quote && typeof (quote as unknown as { weightKg?: number }).weightKg === 'number'
        ? Math.round((quote as unknown as { weightKg: number }).weightKg * 1000)
        : null);

    if (!methodId || !weightGrams) {
      await prisma.order.update({
        where: { id: orderId },
        data: { shippingStatus: 'SHIPMENT_FAILED_RETRYABLE' },
      });
      return {
        status: 'failed_retryable',
        error: 'Missing shippingMethodId or weightGrams on quote snapshot',
      };
    }

    const marketplaceOrderId =
      order.orderNumber || `HC-${orderId.replace(/-/g, '').slice(0, 10).toUpperCase()}`;

    // Minimal STRICT payload: documented address/fromAddress fields only.
    // Omit optional note/orderItems until address acceptance is proven — avoids
    // optional-field noise around generic "Invalid address!!!" failures.
    const sellerProfile = order.items[0]?.Product?.seller;
    const sellerCompany =
      sellerProfile?.companyName?.trim() ||
      (order.shippingOriginSnapshot as { company?: string; companyName?: string } | null)
        ?.companyName ||
      (order.shippingOriginSnapshot as { company?: string; companyName?: string } | null)
        ?.company ||
      undefined;

    const destAddress = toPartnerAddress(destSnap);
    // Prefer live order buyer contact when snapshot omitted them
    if (!destAddress.email && order.User?.email) destAddress.email = order.User.email;
    if (!destAddress.phone && order.User?.phoneNumber) {
      destAddress.phone = order.User.phoneNumber;
    }

    const fromAddress = toPartnerAddress(originSnap, {
      companyName: sellerCompany,
    });
    if (!fromAddress.email && sellerProfile?.User?.email) {
      fromAddress.email = sellerProfile.User.email;
    }
    if (!fromAddress.phone && sellerProfile?.User?.phoneNumber) {
      fromAddress.phone = sellerProfile.User.phoneNumber;
    }

    const labelResult = await createPartnerLabel({
      shippingMethodId: methodId,
      productId:
        (order as { shippingProductId?: string | null }).shippingProductId ||
        quote?.productId,
      carrier: quote?.carrier || order.shippingCarrier || undefined,
      weightGrams,
      marketplaceOrderId,
      address: destAddress,
      fromAddress,
    });

    if (!labelResult.ok) {
      await prisma.order.update({
        where: { id: orderId },
        data: { shippingStatus: 'SHIPMENT_FAILED_RETRYABLE' },
      });
      logShippingEvent('SHIPMENT_CREATE_FAILED', {
        orderId,
        code: labelResult.code,
        status: labelResult.status,
      });
      return { status: 'failed_retryable', error: labelResult.error };
    }

    const race = await prisma.shippingLabel.findFirst({ where: { orderId } });
    if (race) {
      return { status: 'already_created', labelId: race.ectaroShipLabelId };
    }

    const label = labelResult.label;
    const pdfUrl =
      typeof label.labelsExport === 'string' &&
      isAllowedEctaroDocumentUrl(label.labelsExport)
        ? label.labelsExport
        : typeof label.labelsExport === 'object' &&
            label.labelsExport &&
            typeof (label.labelsExport as { url?: string }).url === 'string' &&
            isAllowedEctaroDocumentUrl((label.labelsExport as { url: string }).url)
          ? (label.labelsExport as { url: string }).url
          : '';

    const actualCents =
      label.totalPrice != null && Number.isFinite(label.totalPrice)
        ? Math.round(label.totalPrice * 100)
        : collected;

    try {
      await prisma.shippingLabel.create({
        data: {
          orderId,
          ectaroShipLabelId: label.providerOrderId,
          pdfUrl: pdfUrl || 'pending',
          trackingNumber: label.trackingCode,
          carrier: label.carrier || quote?.carrier || 'Carrier',
          status: 'generated',
          priceCents: actualCents,
        },
      });
    } catch {
      const existing = await prisma.shippingLabel.findFirst({ where: { orderId } });
      if (existing) {
        return { status: 'already_created', labelId: existing.ectaroShipLabelId };
      }
      throw new Error('Failed to persist ShippingLabel');
    }

    const margin = collected - actualCents;
    if (margin < 0) {
      logShippingEvent('SHIPPING_NEGATIVE_MARGIN', {
        orderId,
        charged: collected,
        actual: actualCents,
        delta: margin,
      });
    }
    logShippingEvent('SHIPPING_COST_RECONCILED', {
      orderId,
      quoted: quote?.priceCents ?? null,
      charged: collected,
      actual: actualCents,
      delta: margin,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        shippingLabelId: label.providerOrderId,
        shippingTrackingNumber: label.trackingCode,
        shippingCarrier: label.carrier || quote?.carrier || undefined,
        shippingStatus: 'label_created',
        shippingLabelCostCents: actualCents,
        shippingMethod: quote?.method || undefined,
        shippingTrackingUrl:
          label.trackingUrl && isAllowedEctaroDocumentUrl(label.trackingUrl)
            ? label.trackingUrl
            : undefined,
        shippingProviderOrderId: label.providerOrderId,
        shippingActualCostCents: actualCents,
        shippingBuyerChargedCents: collected,
        shippingQuotedCents: quote?.priceCents ?? collected,
        shippingCurrency: label.currency || quote?.currency || 'EUR',
        shippingMethodId: methodId,
        shippingProductId: quote?.productId || undefined,
        shippingProviderStatus: 'created',
        shippingProviderStatusRaw: 'created',
      },
    });

    logShippingEvent('SHIPMENT_CREATE_SUCCEEDED', {
      orderId,
      tracking: label.trackingCode ? 'yes' : 'no',
    });

    const sellerId = order.items[0]?.Product?.seller?.User?.id;
    if (sellerId) {
      try {
        await NotificationService.sendShippingLabelReadyNotification(
          sellerId,
          orderId,
          order.orderNumber || orderId,
          label.trackingCode,
        );
      } catch (notifError) {
        console.error('[ensurePaidOrderShipment] notification failed', notifError);
      }
    }

    return {
      status: 'created',
      labelId: label.providerOrderId,
      trackingNumber: label.trackingCode,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown';
    await prisma.order
      .update({
        where: { id: orderId },
        data: { shippingStatus: 'SHIPMENT_FAILED_RETRYABLE' },
      })
      .catch(() => undefined);
    logShippingEvent('SHIPMENT_CREATE_FAILED', { orderId, error: message });
    return { status: 'failed_retryable', error: message };
  }
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
