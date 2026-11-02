import { toPublicPlaceLabel } from '@/lib/geo/public-place';

export type LocationUser = {
  name?: string | null;
  username?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  postalCode?: string | null;
  city?: string | null;
  place?: string | null;
  lat?: number | null;
  lng?: number | null;
};

export type DeliveryDashboardPhase = 'available' | 'assigned';

/** Area label only — no street address or postcode digits. */
export function formatAreaLabel(user: LocationUser | null | undefined): string {
  if (!user) return 'Regio onbekend';
  const parts = [
    toPublicPlaceLabel(user.place),
    toPublicPlaceLabel(user.city),
  ].filter(Boolean) as string[];
  const unique = [...new Set(parts)];
  return unique.length > 0 ? unique.join(', ') : 'Regio onbekend';
}

/**
 * Exact pickup/delivery coordinates are operationally required after accept.
 * Pre-accept / available pool must not expose doorstep GPS.
 */
export function coordsForPhase(
  lat: number | null | undefined,
  lng: number | null | undefined,
  phase: DeliveryDashboardPhase,
): { lat: number | null; lng: number | null } {
  if (phase === 'available') {
    return { lat: null, lng: null };
  }
  return {
    lat: lat != null && Number.isFinite(lat) ? lat : null,
    lng: lng != null && Number.isFinite(lng) ? lng : null,
  };
}

export function formatFullAddress(
  user: LocationUser | null | undefined,
  deliveryAddressFallback?: string | null
): string {
  if (!user) {
    return deliveryAddressFallback?.trim() || 'Adres niet beschikbaar';
  }
  const parts = [user.address, user.postalCode, user.city || user.place].filter(
    Boolean
  );
  if (parts.length > 0) return parts.join(', ');
  return deliveryAddressFallback?.trim() || 'Adres niet beschikbaar';
}

export function customerPhoneForPhase(
  user: LocationUser | null | undefined,
  phase: DeliveryDashboardPhase
): string | null {
  if (phase === 'available') return null;
  return user?.phoneNumber?.trim() || null;
}

export function customerAddressForPhase(
  user: LocationUser | null | undefined,
  deliveryAddress: string | null | undefined,
  phase: DeliveryDashboardPhase
): string {
  if (phase === 'available') {
    return formatAreaLabel(user);
  }
  return formatFullAddress(user, deliveryAddress);
}

export function sellerAddressForPhase(
  sellerUser: LocationUser | null | undefined,
  phase: DeliveryDashboardPhase
): string {
  if (phase === 'available') {
    return formatAreaLabel(sellerUser);
  }
  return formatFullAddress(sellerUser);
}

export function sellerPhoneForPhase(
  sellerUser: LocationUser | null | undefined,
  phase: DeliveryDashboardPhase
): string | null {
  if (phase === 'available') return null;
  return sellerUser?.phoneNumber?.trim() || null;
}

/** Courier sees the doorstep only after they accept the job. */
export function courierMaySeeExactAddress(
  assignmentStatus: string | null | undefined,
): boolean {
  const status = (assignmentStatus || '').trim().toUpperCase();
  return status === 'ACCEPTED' || status === 'COMPLETED';
}

const DELIVERY_ORDER_EXACT_STATUSES = new Set([
  'ACCEPTED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'COMPLETED',
]);

export function deliveryOrderExactAddressAllowed(
  status: string | null | undefined,
): boolean {
  return DELIVERY_ORDER_EXACT_STATUSES.has((status || '').trim().toUpperCase());
}

/** City label before accept. Exact line only after the courier is authorized. */
export function addressForCourierPhase(
  address: string | null | undefined,
  assignmentStatus: string | null | undefined,
): string | null {
  const raw = address?.trim() || '';
  if (!raw) return null;
  if (courierMaySeeExactAddress(assignmentStatus)) return raw;
  return toPublicPlaceLabel(raw);
}

export function deliveryInboxLine(
  status: string | null | undefined,
  address: string | null | undefined,
): string {
  if (!deliveryOrderExactAddressAllowed(status)) {
    return 'Nieuwe bezorgopdracht in jouw regio';
  }
  const line = address?.trim();
  return line ? `Nieuwe bezorgopdracht: ${line}` : 'Nieuwe bezorgopdracht';
}

/** Drop doorstep lines from notes shown before accept. Keep other courier notes. */
export function notesForPreAccept(
  notes: string | null | undefined,
  exactAddresses: Array<string | null | undefined> = [],
): string {
  if (!notes?.trim()) return '';
  const kept = notes
    .split('\n')
    .filter((line) => !/^\s*(bezorgadres|afhaaladres|adres)\s*:/i.test(line))
    .join('\n')
    .trim();
  if (!kept) return '';
  const normalized = kept.replace(/\s+/g, ' ').trim().toLowerCase();
  for (const exact of exactAddresses) {
    const candidate = exact?.replace(/\s+/g, ' ').trim().toLowerCase();
    if (candidate && candidate === normalized) return '';
  }
  if (/\b\d{4}\s?[A-Za-z]{2}\b/.test(kept)) return '';
  return kept;
}
