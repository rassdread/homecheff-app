/**
 * Map EctaroShip provider statuses → HomeCheff internal + Dutch UI.
 * Unknown future values → UNKNOWN (never reject sync).
 */

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
  pickuppoint: 'PICKUP_POINT',
  delivered: 'DELIVERED',
  actionrequired: 'ACTION_REQUIRED',
  canceled: 'CANCELED',
  cancelled: 'CANCELED',
  error: 'ERROR',
  vvb: 'UNKNOWN',
  easyship: 'UNKNOWN',
};

export function mapProviderStatus(raw: string | null | undefined): {
  internal: InternalShipmentStatus;
  raw: string;
  dutchLabel: string;
} {
  const rawStatus = String(raw ?? '').trim() || 'UNKNOWN';
  const key = rawStatus.replace(/[\s_-]/g, '').toLowerCase();
  // normalize pickUpPoint → pickuppoint
  const internal = MAP[key] ?? MAP[rawStatus.toLowerCase()] ?? 'UNKNOWN';
  return {
    internal,
    raw: rawStatus,
    dutchLabel: dutchLabelFor(internal),
  };
}

export function dutchLabelFor(internal: InternalShipmentStatus): string {
  switch (internal) {
    case 'PENDING':
      return 'Label wordt aangemaakt';
    case 'CREATED':
      return 'Klaar voor verzending';
    case 'PRINTED':
      return 'Label geprint';
    case 'SCANNED':
      return 'Pakket ontvangen door vervoerder';
    case 'IN_TRANSIT':
      return 'Onderweg';
    case 'PICKUP_POINT':
      return 'Afhaalpunt';
    case 'DELIVERED':
      return 'Bezorgd';
    case 'ACTION_REQUIRED':
      return 'Actie nodig';
    case 'CANCELED':
      return 'Geannuleerd';
    case 'ERROR':
      return 'Probleem met verzending';
    default:
      return 'Status bijwerken…';
  }
}
