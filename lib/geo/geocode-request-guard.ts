/**
 * Public geocoding is forward lookup of an address the caller typed.
 * It must not accept a stored user, seller, product, or order id.
 */

const STORED_RECORD_KEYS = [
  'userId',
  'sellerId',
  'productId',
  'orderId',
  'deliveryProfileId',
  'deliveryOrderId',
  'bookingRequestId',
  'communityOrderId',
] as const;

export function storedRecordLookupRejection(
  fields: Record<string, unknown> | null | undefined,
): string | null {
  if (!fields) return null;
  for (const key of STORED_RECORD_KEYS) {
    const value = fields[key];
    if (value == null) continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    return 'Geocoding only accepts an address you enter.';
  }
  return null;
}
