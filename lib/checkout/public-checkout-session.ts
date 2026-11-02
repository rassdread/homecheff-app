/**
 * Payment success needs amount and line-item ids.
 * Seller origin snapshots and doorstep coordinates stay on the server
 * for the carrier label.
 */

const PRIVATE_METADATA_KEYS = new Set([
  'shippingOriginSnapshot',
  'shippingAddressSnapshot',
  'coordinates',
  'address',
  'deliveryAddress',
  'pickupAddress',
  'postalCode',
  'buyerLat',
  'buyerLng',
  'lat',
  'lng',
]);

function isPrivateMetadataKey(key: string): boolean {
  if (PRIVATE_METADATA_KEYS.has(key)) return true;
  return /origin|snapshot|coordinate|postal|address/i.test(key);
}

export type PublicCheckoutSession = {
  id: string | null;
  payment_status: string | null;
  status: string | null;
  amount_total: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_details: { email: string } | null;
  metadata: Record<string, string>;
};

export function toPublicCheckoutSession(session: {
  id?: string | null;
  payment_status?: string | null;
  status?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null; address?: unknown } | null;
  metadata?: Record<string, string> | null;
  shipping?: unknown;
  shipping_details?: unknown;
}): PublicCheckoutSession {
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(session.metadata || {})) {
    if (isPrivateMetadataKey(key)) continue;
    if (typeof value === 'string') metadata[key] = value;
  }
  const email =
    session.customer_email?.trim() ||
    session.customer_details?.email?.trim() ||
    null;
  return {
    id: session.id ?? null,
    payment_status: session.payment_status ?? null,
    status: session.status ?? null,
    amount_total: typeof session.amount_total === 'number' ? session.amount_total : null,
    currency: session.currency ?? null,
    customer_email: email,
    customer_details: email ? { email } : null,
    metadata,
  };
}
