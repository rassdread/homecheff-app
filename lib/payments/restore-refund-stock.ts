import { prisma } from '@/lib/prisma';
import { decideRefundStockRestoration, type RefundStockKind } from '@/lib/payments/refund-stock-policy';

const PICKED_UP_DELIVERY_STATUSES = new Set([
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
]);

export async function restoreStockForFullRefund(input: {
  orderId: string;
  fullRefund: boolean;
  kind: RefundStockKind;
}): Promise<{ restored: boolean; reason: string }> {
  return prisma.$transaction(async (tx) => {
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
      pickedUp: Boolean(order.deliveryOrder?.pickedUpAt) || PICKED_UP_DELIVERY_STATUSES.has(deliveryStatus),
      courierDelivered: Boolean(order.deliveryOrder?.deliveredAt) || deliveryStatus === 'DELIVERED',
      alreadyRestored: order.inventoryRestoredAt != null,
      lines: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    if (!decision.restore) return { restored: false, reason: decision.reason };

    const claimed = await tx.order.updateMany({
      where: { id: order.id, inventoryRestoredAt: null },
      data: {
        inventoryRestoredAt: new Date(),
        status: order.status === 'CANCELLED' ? 'CANCELLED' : 'REFUNDED',
      },
    });
    if (claimed.count !== 1) return { restored: false, reason: 'ALREADY_RESTORED' };

    for (const line of decision.lines) {
      await tx.product.update({
        where: { id: line.productId },
        data: { stock: { increment: line.quantity } },
      });
    }
    return { restored: true, reason: decision.reason };
  });
}
