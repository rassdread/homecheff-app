/**
 * Carrier math stays on the server. Buyers receive the price, not the
 * seller's origin postcode or street.
 */

export function toPublicShippingQuoteResponse<T extends Record<string, unknown>>(
  body: T,
): Omit<T, 'origin'> {
  const rest = { ...body };
  delete rest.origin;
  return rest;
}
