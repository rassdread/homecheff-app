export type ProductDeliveryMode = 'PICKUP' | 'DELIVERY' | 'SHIPPING' | 'BOTH';

const VALID = new Set<string>(['PICKUP', 'DELIVERY', 'SHIPPING', 'BOTH']);

/**
 * Maps UI multi-select to a single Prisma DeliveryMode enum value.
 */
export function deliveryModeFromOptions(options: string[]): ProductDeliveryMode {
  const normalized = [
    ...new Set(
      options
        .map((o) => String(o).trim())
        .filter((o) => o.length > 0)
    ),
  ];
  if (normalized.length === 0) return 'PICKUP';
  if (normalized.length === 1) {
    const one = normalized[0];
    return VALID.has(one) ? (one as ProductDeliveryMode) : 'PICKUP';
  }
  const set = new Set(normalized);
  const p = set.has('PICKUP');
  const d = set.has('DELIVERY');
  const s = set.has('SHIPPING');
  if (p && d && !s) return 'BOTH';
  if (p && s && !d) return 'SHIPPING';
  if (!p && d && s) return 'DELIVERY';
  if (p && d && s) return 'BOTH';
  if (d && !p && !s) return 'DELIVERY';
  if (s && !p && !d) return 'SHIPPING';
  if (p && !d && !s) return 'PICKUP';
  return 'PICKUP';
}

/**
 * Normalizes client payload: single enum or legacy comma-separated join.
 */
export function normalizeDeliveryModeInput(
  mode: string | undefined | null
): ProductDeliveryMode {
  const raw = (mode ?? 'PICKUP').trim();
  if (VALID.has(raw)) return raw as ProductDeliveryMode;
  if (raw.includes(',')) {
    return deliveryModeFromOptions(raw.split(','));
  }
  return 'PICKUP';
}
