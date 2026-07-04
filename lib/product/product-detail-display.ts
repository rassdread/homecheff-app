/**
 * Product detail copy derived from stored Product fields — no invented claims.
 */

import { placeFromPickupAddress } from '@/lib/geo/item-location';

export type ProductDeliveryDisplayInput = {
  delivery?: string | null;
  sellerCanDeliver?: boolean | null;
  deliveryRadiusKm?: number | null;
  orderMethod?: string | null;
};

export type ProductDeliveryLabels = {
  pickupAvailable: string;
  pickupOnly: string;
  deliveryAvailable: string;
  deliveryUpToKm: string;
  contactForDelivery: string;
};

export function formatProductDeliveryMessages(
  input: ProductDeliveryDisplayInput,
  labels: ProductDeliveryLabels,
): string[] {
  const mode = String(input.delivery ?? 'PICKUP').toUpperCase();
  const lines: string[] = [];
  const allowsPickup = mode === 'PICKUP' || mode === 'BOTH';
  const allowsDelivery = mode === 'DELIVERY' || mode === 'BOTH' || mode === 'SHIPPING';

  if (allowsPickup && !allowsDelivery) {
    lines.push(labels.pickupOnly);
    return lines;
  }

  if (allowsPickup) {
    lines.push(labels.pickupAvailable);
  }

  if (allowsDelivery) {
    const radius =
      input.deliveryRadiusKm != null && Number.isFinite(Number(input.deliveryRadiusKm))
        ? Number(input.deliveryRadiusKm)
        : null;

    if (input.sellerCanDeliver && radius != null && radius > 0) {
      lines.push(labels.deliveryUpToKm.replace('{km}', String(Math.round(radius))));
    } else if (input.sellerCanDeliver) {
      lines.push(labels.deliveryAvailable);
    } else if (input.orderMethod === 'CONTACT') {
      lines.push(labels.contactForDelivery);
    } else if (allowsDelivery && !allowsPickup) {
      lines.push(labels.deliveryAvailable);
    }
  }

  return lines;
}

/** City/neighbourhood label from pickup address — no street-level detail. */
export function formatPickupAreaLabel(
  pickupAddress: string | null | undefined,
  pickupAreaPrefix: string,
): string | null {
  const area = placeFromPickupAddress(pickupAddress);
  if (!area) return null;
  return `${pickupAreaPrefix} ${area}`;
}
