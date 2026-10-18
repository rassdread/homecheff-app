/**
 * Deployment gate for new HomeCheff courier operations.
 * Missing, empty, and invalid values stay disabled.
 * Only an explicit true / 1 / yes enables new bookings and delivery payments.
 */
type EnvSource = Record<string, string | undefined>;

const ENABLED_VALUES = new Set(['true', '1', 'yes']);

export function isHomeCheffDeliveryEnabled(env: EnvSource = process.env): boolean {
  const raw = env.HOMECHEFF_DELIVERY_ENABLED;
  if (typeof raw !== 'string') return false;
  return ENABLED_VALUES.has(raw.trim().toLowerCase());
}

export function isNewCourierFulfillmentMode(mode: unknown): boolean {
  const value = String(mode ?? '').trim().toUpperCase();
  return value === 'DELIVERY' || value === 'TEEN_DELIVERY' || value === 'LOCAL_PROVIDER';
}

export function deliveryDisabledBody() {
  return {
    error: 'HomeCheff-bezorging is nog niet beschikbaar.',
    code: 'DELIVERY_DISABLED' as const,
  };
}
