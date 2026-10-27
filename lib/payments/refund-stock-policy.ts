/**
 * Stock is restored only for a full refund of an order that was never handed over.
 * A duplicate-payment refund belongs to a charge that did not fulfill, so it must
 * not put back the stock of the order that did.
 */

export type RefundStockKind = 'ORDER_REFUND' | 'DUPLICATE_PAYMENT';

export type RefundStockLine = {
  productId: string;
  quantity: number;
};

export type RefundStockDecision =
  | { restore: false; reason: string }
  | { restore: true; reason: 'UNFULFILLED_FULL_REFUND'; lines: RefundStockLine[] };

const FULFILLED_ORDER_STATUSES = new Set(['SHIPPED', 'DELIVERED']);

export function decideRefundStockRestoration(input: {
  kind: RefundStockKind;
  fullRefund: boolean;
  orderStatus: string;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  pickedUp: boolean;
  courierDelivered: boolean;
  alreadyRestored: boolean;
  lines: RefundStockLine[];
}): RefundStockDecision {
  if (input.kind === 'DUPLICATE_PAYMENT') {
    return { restore: false, reason: 'DUPLICATE_PAYMENT_KEEPS_VALID_ORDER_STOCK' };
  }
  if (!input.fullRefund) {
    return { restore: false, reason: 'PARTIAL_REFUND' };
  }
  if (input.alreadyRestored) {
    return { restore: false, reason: 'ALREADY_RESTORED' };
  }
  if (
    FULFILLED_ORDER_STATUSES.has(input.orderStatus) ||
    input.shippedAt ||
    input.deliveredAt ||
    input.pickedUp ||
    input.courierDelivered
  ) {
    return { restore: false, reason: 'ALREADY_FULFILLED' };
  }
  const lines = input.lines.filter((line) => line.productId && line.quantity > 0);
  if (lines.length === 0) {
    return { restore: false, reason: 'NO_STOCK_LINES' };
  }
  return { restore: true, reason: 'UNFULFILLED_FULL_REFUND', lines };
}
