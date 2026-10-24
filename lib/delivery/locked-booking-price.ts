/**
 * Marketplace checkout must charge the fee and destination stored on the
 * accepted booking. Coordinates or a quote in the request body cannot
 * replace that agreement.
 */

const COORDINATE_EPSILON = 0.0001;

export type LockedBookingPrice =
  | {
      ok: true;
      quotedFeeCents: number;
      routeDistanceKm: number;
      lat: number;
      lng: number;
    }
  | {
      ok: false;
      status: 409;
      code: 'DELIVERY_BOOKING_PRICE_MISSING' | 'DELIVERY_BOOKING_ROUTE_MISSING' | 'DELIVERY_ROUTE_CHANGED' | 'DELIVERY_QUOTE_CHANGED';
      error: string;
    };

export function lockedBookingCheckoutPrice(input: {
  quotedFeeCents?: number | null;
  routeDistanceKm?: number | null;
  buyerLat?: number | null;
  buyerLng?: number | null;
  bodyLat?: number | null;
  bodyLng?: number | null;
  clientQuoteCents?: number | null;
}): LockedBookingPrice {
  const fee = input.quotedFeeCents;
  const distance = input.routeDistanceKm;
  const lat = input.buyerLat;
  const lng = input.buyerLng;
  if (typeof fee !== 'number' || !Number.isInteger(fee) || fee <= 0) {
    return {
      ok: false,
      status: 409,
      code: 'DELIVERY_BOOKING_PRICE_MISSING',
      error: 'De afgesproken bezorgprijs ontbreekt.',
    };
  }
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      ok: false,
      status: 409,
      code: 'DELIVERY_BOOKING_ROUTE_MISSING',
      error: 'De afgesproken bezorglocatie ontbreekt.',
    };
  }
  if (typeof distance !== 'number' || !Number.isFinite(distance) || distance <= 0) {
    return {
      ok: false,
      status: 409,
      code: 'DELIVERY_BOOKING_ROUTE_MISSING',
      error: 'De afgesproken bezorgafstand ontbreekt.',
    };
  }
  const bodyLat = typeof input.bodyLat === 'number' && Number.isFinite(input.bodyLat) ? input.bodyLat : null;
  const bodyLng = typeof input.bodyLng === 'number' && Number.isFinite(input.bodyLng) ? input.bodyLng : null;
  if (
    (bodyLat != null && Math.abs(bodyLat - lat) > COORDINATE_EPSILON) ||
    (bodyLng != null && Math.abs(bodyLng - lng) > COORDINATE_EPSILON)
  ) {
    return {
      ok: false,
      status: 409,
      code: 'DELIVERY_ROUTE_CHANGED',
      error: 'Het bezorgadres wijkt af van de geaccepteerde boeking.',
    };
  }
  if (
    input.clientQuoteCents != null &&
    Number.isInteger(input.clientQuoteCents) &&
    input.clientQuoteCents !== fee
  ) {
    return {
      ok: false,
      status: 409,
      code: 'DELIVERY_QUOTE_CHANGED',
      error: 'Bezorgprijs is gewijzigd. Bevestig de afgesproken prijs.',
    };
  }
  return { ok: true, quotedFeeCents: fee, routeDistanceKm: distance, lat, lng };
}

export function manualAssignmentStatus(
  current: string,
): { ok: true; status: 'ACCEPTED' } | { ok: false; status: 409; code: 'DELIVERY_ASSIGNMENT_CLOSED' } {
  if (current === 'PENDING' || current === 'ASSIGNED') return { ok: true, status: 'ACCEPTED' };
  return { ok: false, status: 409, code: 'DELIVERY_ASSIGNMENT_CLOSED' };
}
