/**
 * Centrale mapping: Prisma OrderStatus → verkoper-tab + NL-label voor UI/API.
 * Gebruikt door /verkoper/orders en GET /api/seller/dashboard/orders.
 */

import type { OrderStatus } from '@prisma/client';

export type SellerOrderTabKey =
  | 'all'
  | 'new'
  | 'ongoing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

/** NL-statusstring zoals in verkoper-lijst (compatibel met bestaande UI). */
export function orderStatusToSellerLabel(status: OrderStatus): string {
  switch (status) {
    case 'DELIVERED':
      return 'Voltooid';
    case 'CONFIRMED':
      return 'Bevestigd';
    case 'PROCESSING':
      return 'In behandeling';
    case 'CANCELLED':
      return 'Geannuleerd';
    case 'REFUNDED':
      return 'Terugbetaald';
    case 'SHIPPED':
      return 'Verzonden';
    case 'PENDING':
    default:
      return 'Wachtend';
  }
}

/** Welke tab hoort bij deze DB-status? */
export function orderStatusToSellerTab(status: OrderStatus): SellerOrderTabKey {
  switch (status) {
    case 'DELIVERED':
      return 'completed';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'cancelled';
    case 'SHIPPED':
      return 'shipped';
    case 'PROCESSING':
      return 'ongoing';
    case 'PENDING':
    case 'CONFIRMED':
      return 'new';
    default:
      return 'all';
  }
}

/**
 * Filter op tab; `order.status` mag NL-label (API) of enum-string zijn.
 */
export function orderMatchesSellerTab(
  orderStatus: string,
  tab: SellerOrderTabKey
): boolean {
  if (tab === 'all') return true;
  const s = orderStatus.toLowerCase().trim();
  const tabKey = orderStatusToSellerTabFromDisplay(s);
  return tabKey === tab;
}

function orderStatusToSellerTabFromDisplay(s: string): SellerOrderTabKey {
  if (
    s === 'voltooid' ||
    s === 'delivered' ||
    s === 'bezorgd'
  ) {
    return 'completed';
  }
  if (
    s === 'geannuleerd' ||
    s === 'cancelled' ||
    s === 'terugbetaald' ||
    s === 'refunded'
  ) {
    return 'cancelled';
  }
  if (s === 'verzonden' || s === 'shipped') return 'shipped';
  if (s === 'in behandeling' || s === 'processing') return 'ongoing';
  if (
    s === 'wachtend' ||
    s === 'pending' ||
    s === 'bevestigd' ||
    s === 'confirmed'
  ) {
    return 'new';
  }
  return 'all';
}

/** Korte contextregel voor chat (geen orderbeheer in chat). */
export function orderChatContextLine(displayOrderNumber: string): string {
  return `Bestelling ${displayOrderNumber} — volg status bij Verkooporders of Mijn bestellingen.`;
}
