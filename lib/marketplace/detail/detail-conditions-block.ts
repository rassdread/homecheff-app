/**
 * Logistics & conditions block — Phase 4C-UI.
 * Separate from accepted values (pickup, delivery, region, stock).
 */

export type DetailConditionLineKind =
  | 'pickup'
  | 'delivery'
  | 'delivery_radius'
  | 'region'
  | 'stock'
  | 'fulfillment_digital'
  | 'fulfillment_on_site';

export type DetailConditionLine = {
  kind: DetailConditionLineKind;
  labelKey: string;
  params?: Record<string, string | number>;
};

const KEY = 'marketplace.detail.conditions';

export function buildDetailConditionsBlock(input: {
  delivery?: string | null;
  sellerCanDeliver?: boolean;
  deliveryRadiusKm?: number | null;
  pickupAddress?: string | null;
  availableStock?: number | null;
  placeLabel?: string | null;
}): DetailConditionLine[] {
  const lines: DetailConditionLine[] = [];
  const delivery = String(input.delivery ?? 'PICKUP').toUpperCase();

  if (delivery === 'PICKUP' || delivery === 'BOTH') {
    lines.push({ kind: 'pickup', labelKey: `${KEY}.pickupAvailable` });
  }

  if (
    (delivery === 'DELIVERY' || delivery === 'BOTH') &&
    input.sellerCanDeliver
  ) {
    lines.push({ kind: 'delivery', labelKey: `${KEY}.deliveryAvailable` });
    if (input.deliveryRadiusKm != null && input.deliveryRadiusKm > 0) {
      lines.push({
        kind: 'delivery_radius',
        labelKey: `${KEY}.deliveryRadius`,
        params: { km: input.deliveryRadiusKm },
      });
    }
  }

  const region = input.pickupAddress?.trim() || input.placeLabel?.trim();
  if (region) {
    lines.push({
      kind: 'region',
      labelKey: `${KEY}.region`,
      params: { label: region },
    });
  }

  if (input.availableStock != null) {
    if (input.availableStock <= 0) {
      lines.push({ kind: 'stock', labelKey: `${KEY}.outOfStock` });
    } else if (input.availableStock <= 5) {
      lines.push({
        kind: 'stock',
        labelKey: `${KEY}.stockLow`,
        params: { count: input.availableStock },
      });
    }
  }

  return lines;
}

export function detailConditionsHasContent(lines: DetailConditionLine[]): boolean {
  return lines.length > 0;
}
