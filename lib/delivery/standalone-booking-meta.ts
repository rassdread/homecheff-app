/** Notes marker so a marketplace DeliveryBookingRequest can carry a product-less job. */

export const STANDALONE_BOOKING_KIND = 'STANDALONE';

export type StandaloneBookingMeta = {
  kind: typeof STANDALONE_BOOKING_KIND;
  standaloneRequestId?: string;
  requestedPickupAt?: string | null;
  itemDescription?: string;
};

export function standaloneBookingNotes(input: {
  standaloneRequestId?: string;
  requestedPickupAt?: Date | null;
  itemDescription: string;
}): string {
  const meta: StandaloneBookingMeta = {
    kind: STANDALONE_BOOKING_KIND,
    standaloneRequestId: input.standaloneRequestId,
    requestedPickupAt: input.requestedPickupAt?.toISOString() ?? null,
    itemDescription: input.itemDescription.slice(0, 240),
  };
  return JSON.stringify(meta);
}

export function readStandaloneBookingMeta(notes: string | null | undefined): StandaloneBookingMeta | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as StandaloneBookingMeta;
    if (parsed?.kind !== STANDALONE_BOOKING_KIND) return null;
    return parsed;
  } catch {
    return null;
  }
}
