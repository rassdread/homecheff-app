import { prisma } from '@/lib/prisma';
import { decideRefundStockRestoration, type RefundStockKind } from '@/lib/payments/refund-stock-policy';

const PICKED_UP_DELIVERY_STATUSES = new Set([
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
]);

function inventoryMarkerKey(orderId: string): string {
  return `hc_inventory_restore_${orderId}`;
}

function isUniqueConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'P2002');
}

/**
 * Restores stock once for a qualifying refund.
 * The claim is a RefundSettlement row with a unique idempotency key, so a second
 * webhook cannot increment stock again. The row has no Stripe refund id and does
 * not change the buyer refund total.
 */
export async function restoreStockForFullRefund(input: {
  orderId: string;
  fullRefund: boolean;
  kind: RefundStockKind;
}): Promise<{ restored: boolean; reason: string }> {
  const markerKey = inventoryMarkerKey(input.orderId);
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.refundSettlement.findUnique({
        where: { idempotencyKey: markerKey },
        select: { id: true },
      });
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: { select: { productId: true, quantity: true } },
          deliveryOrder: { select: { status: true, pickedUpAt: true, deliveredAt: true } },
        },
      });
      if (!order) return { restored: false, reason: 'ORDER_MISSING' };

      const deliveryStatus = (order.deliveryOrder?.status || '').toUpperCase();
      const decision = decideRefundStockRestoration({
        kind: input.kind,
        fullRefund: input.fullRefund,
        orderStatus: order.status,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        pickedUp:
          Boolean(order.deliveryOrder?.pickedUpAt) ||
          PICKED_UP_DELIVERY_STATUSES.has(deliveryStatus),
        courierDelivered:
          Boolean(order.deliveryOrder?.deliveredAt) || deliveryStatus === 'DELIVERED',
        alreadyRestored: existing != null,
        lines: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      if (!decision.restore) return { restored: false, reason: decision.reason };

      await tx.refundSettlement.create({
        data: {
          id: markerKey,
          orderId: order.id,
          idempotencyKey: markerKey,
          status: 'COMPLETED',
          mode: 'INVENTORY_RESTORE',
          buyerRefundCents: 0,
          planJson: JSON.stringify({
            reason: decision.reason,
            lines: decision.lines,
          }),
          reason: decision.reason,
        },
      });
      for (const line of decision.lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: { stock: { increment: line.quantity } },
        });
      }
      if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'REFUNDED' },
        });
      }
      return { restored: true, reason: decision.reason };
    });
  } catch (error) {
    if (isUniqueConflict(error)) return { restored: false, reason: 'ALREADY_RESTORED' };
    throw error;
  }
}
