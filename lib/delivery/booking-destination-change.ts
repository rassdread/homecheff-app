/**
 * A confirmed checkout address replaces the previous drop-off.
 * Typing, opening the field, or loading the same coordinates again does not.
 * The unpaid booking for the old drop-off can no longer be accepted, planned, or paid.
 */

const DESTINATION_EPSILON = 0.0001;

export type ConfirmedPoint = { lat: number; lng: number };

const RETIRABLE_UNPAID = new Set(['PENDING', 'ACCEPTED', 'AUTO_CONFIRMED']);

export function sameConfirmedDestination(
  current: ConfirmedPoint | null | undefined,
  next: ConfirmedPoint | null | undefined,
): boolean {
  if (!current || !next) return false;
  if (!Number.isFinite(current.lat) || !Number.isFinite(current.lng)) return false;
  if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng)) return false;
  return (
    Math.abs(current.lat - next.lat) <= DESTINATION_EPSILON &&
    Math.abs(current.lng - next.lng) <= DESTINATION_EPSILON
  );
}

/**
 * `keep` leaves the booking and the product hold untouched.
 * `retire` cancels the unpaid booking. The product hold stays, and a payment
 * window opened by a late accept is put back to waiting for a courier.
 */
export function planUnpaidDestinationChange(input: {
  status: string;
  currentLat: number | null;
  currentLng: number | null;
  nextLat: number | null;
  nextLng: number | null;
}): 'keep' | 'retire' {
  if (!Number.isFinite(input.nextLat) || !Number.isFinite(input.nextLng)) return 'keep';
  if (input.status === 'CONSUMED') return 'keep';
  if (!RETIRABLE_UNPAID.has(input.status)) return 'keep';
  const current =
    input.currentLat != null && input.currentLng != null
      ? { lat: input.currentLat, lng: input.currentLng }
      : null;
  const next = { lat: input.nextLat as number, lng: input.nextLng as number };
  if (sameConfirmedDestination(current, next)) return 'keep';
  return 'retire';
}
