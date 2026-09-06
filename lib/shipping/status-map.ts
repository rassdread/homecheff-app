/**
 * Map EctaroShip provider statuses → HomeCheff internal + locale-aware UI.
 * Unknown future values → UNKNOWN (never reject sync).
 * Carrier brand names are never translated.
 */

import type { EcosystemLanguage } from '@/lib/ecosystem-locale';
import { shippingStatusLabel } from '@/lib/shipping/i18n';

export const KNOWN_PROVIDER_STATUSES = [
  'pending',
  'created',
  'printed',
  'scanned',
  'in_transit',
  'pickUpPoint',
  'delivered',
  'actionRequired',
  'canceled',
  'error',
  'vvb',
  'easyShip',
] as const;

export type KnownProviderStatus = (typeof KNOWN_PROVIDER_STATUSES)[number];

export type InternalShipmentStatus =
  | 'PENDING'
  | 'CREATED'
  | 'PRINTED'
  | 'SCANNED'
  | 'IN_TRANSIT'
  | 'PICKUP_POINT'
  | 'DELIVERED'
  | 'ACTION_REQUIRED'
  | 'CANCELED'
  | 'ERROR'
  | 'UNKNOWN';

const MAP: Record<string, InternalShipmentStatus> = {
  pending: 'PENDING',
  created: 'CREATED',
  printed: 'PRINTED',
  scanned: 'SCANNED',
  in_transit: 'IN_TRANSIT',
  intransit: 'IN_TRANSIT',
  pickuppoint: 'PICKUP_POINT',
  delivered: 'DELIVERED',
  actionrequired: 'ACTION_REQUIRED',
  canceled: 'CANCELED',
  cancelled: 'CANCELED',
  error: 'ERROR',
  vvb: 'UNKNOWN',
  easyship: 'UNKNOWN',
};

export function mapProviderStatus(
  raw: string | null | undefined,
  locale: EcosystemLanguage = 'nl',
): {
  internal: InternalShipmentStatus;
  raw: string;
  label: string;
  /** @deprecated use label */
  dutchLabel: string;
} {
  const rawStatus = String(raw ?? '').trim() || 'UNKNOWN';
  const key = rawStatus.replace(/[\s_-]/g, '').toLowerCase();
  const internal = MAP[key] ?? MAP[rawStatus.toLowerCase()] ?? 'UNKNOWN';
  const label = shippingStatusLabel(internal, locale);
  return {
    internal,
    raw: rawStatus,
    label,
    dutchLabel: label,
  };
}

export function dutchLabelFor(
  internal: InternalShipmentStatus,
  locale: EcosystemLanguage = 'nl',
): string {
  return shippingStatusLabel(internal, locale);
}
