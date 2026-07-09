import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin-guard';
import { logAdminAction } from '@/lib/admin-audit';

export const dynamic = 'force-dynamic';

/** POST manual delivery assignment when DeliveryOrder exists */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const guard = await requireAdminPermission('canViewDeliveryDetails');
  if (!guard.ok) return guard.response;

  const { orderId } = await params;
  const { deliveryProfileId } = await request.json();

  if (!deliveryProfileId) {
    return NextResponse.json({ error: 'deliveryProfileId required' }, { status: 400 });
  }

  const deliveryOrder = await prisma.deliveryOrder.findUnique({
    where: { orderId },
    select: { id: true, deliveryProfileId: true, status: true },
  });

  if (!deliveryOrder) {
    return NextResponse.json(
      {
        error: 'No delivery order for this marketplace order',
        tracked: false,
        note: 'Manual assignment requires an existing DeliveryOrder row',
      },
      { status: 404 },
    );
  }

  const profile = await prisma.deliveryProfile.findUnique({
    where: { id: deliveryProfileId },
    select: { id: true, isActive: true, isBlocked: true },
  });

  if (!profile || !profile.isActive || profile.isBlocked) {
    return NextResponse.json({ error: 'Courier not available' }, { status: 400 });
  }

  const updated = await prisma.deliveryOrder.update({
    where: { id: deliveryOrder.id },
    data: {
      deliveryProfileId,
      status: 'ASSIGNED',
    },
  });

  await logAdminAction(guard.admin.user.id, 'DELIVERY_MANUAL_ASSIGN', {
    targetType: 'delivery_order',
    targetId: deliveryOrder.id,
    oldValue: { deliveryProfileId: deliveryOrder.deliveryProfileId },
    newValue: { deliveryProfileId },
    meta: { orderId },
  });

  return NextResponse.json({ ok: true, deliveryOrder: updated });
}
