import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-guard';
import { ensurePaidOrderShipment } from '@/lib/shipping/ensure-order-shipment';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Operational recovery: retry carrier label after payment when provider was down.
 * Does not refund. Idempotent.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const guard = await requireAdminPermission('canViewPaymentInfo');
  if (guard instanceof NextResponse) return guard;

  const { orderId } = await params;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      deliveryMode: true,
      shippingCostCents: true,
      shippingStatus: true,
      shippingLabelId: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (String(order.deliveryMode) !== 'SHIPPING') {
    return NextResponse.json(
      { error: 'Order is not a shipping order', code: 'NOT_SHIPPING' },
      { status: 422 },
    );
  }

  const result = await ensurePaidOrderShipment(orderId);
  return NextResponse.json({
    orderId,
    previousStatus: order.shippingStatus,
    result,
  });
}
