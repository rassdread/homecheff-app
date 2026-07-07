/**
 * Canonical order-status presentation (UX-FIN-3B.1).
 *
 * One source of truth for order-status chip colours + i18n label keys so the
 * same status is instantly recognisable across buyer orders, seller orders and
 * the seller dashboard. Accepts either the raw Prisma enum (preferred) or a
 * localized NL/EN label as a fallback so existing callers keep working.
 */

export type OrderStatusTone =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'unknown';

/** Normalize a raw enum or localized label to a canonical tone. */
export function normalizeOrderStatus(status: string | null | undefined): OrderStatusTone {
  const value = (status ?? '').trim().toLowerCase();
  switch (value) {
    case 'confirmed':
    case 'bevestigd':
      return 'confirmed';
    case 'processing':
    case 'in behandeling':
      return 'processing';
    case 'shipped':
    case 'verzonden':
    case 'onderweg':
      return 'shipped';
    case 'delivered':
    case 'bezorgd':
    case 'voltooid':
    case 'completed':
      return 'delivered';
    case 'cancelled':
    case 'canceled':
    case 'geannuleerd':
      return 'cancelled';
    case 'refunded':
    case 'terugbetaald':
      return 'refunded';
    case 'pending':
    case 'wachtend':
    case 'in afwachting':
      return 'pending';
    default:
      return value ? 'unknown' : 'pending';
  }
}

/** Canonical chip colours (light background + strong text) shared everywhere. */
export const ORDER_STATUS_CHIP_CLASSES: Record<OrderStatusTone, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-900',
  unknown: 'bg-gray-100 text-gray-800',
};

/** Canonical icon-tint classes (matches chip family). */
export const ORDER_STATUS_ICON_CLASSES: Record<OrderStatusTone, string> = {
  pending: 'text-yellow-600',
  confirmed: 'text-blue-600',
  processing: 'text-purple-600',
  shipped: 'text-indigo-600',
  delivered: 'text-green-600',
  cancelled: 'text-red-600',
  refunded: 'text-orange-600',
  unknown: 'text-gray-600',
};

/** i18n key for a status label, resolved from a raw enum or localized label. */
export function orderStatusLabelKey(status: string | null | undefined): string {
  return `orderStatus.${normalizeOrderStatus(status)}`;
}

/** Canonical chip classes for a raw enum or localized label. */
export function orderStatusChipClasses(status: string | null | undefined): string {
  return ORDER_STATUS_CHIP_CLASSES[normalizeOrderStatus(status)];
}
