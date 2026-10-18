import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyStandalonePaidCancellation } from '@/lib/delivery/standalone-cancellation';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }
  const row = await prisma.standaloneDeliveryRequest.findUnique({
    where: { id: params.id },
  });
  if (!row || row.requesterUserId !== userId) {
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 403 });
  }
  if (row.paymentStatus !== 'PAID' || !row.deliveryOrderId) {
    return NextResponse.json(
      { error: 'Er is nog geen betaalde bezorging om te annuleren.', code: 'NOT_PAID' },
      { status: 409 },
    );
  }
  const order = await prisma.deliveryOrder.findUnique({ where: { id: row.deliveryOrderId } });
  if (!order) {
    return NextResponse.json({ error: 'Bezorgopdracht niet gevonden' }, { status: 404 });
  }
  if (order.status === 'DELIVERED') {
    return NextResponse.json(
      { error: 'Een bezorgde opdracht kan niet worden geannuleerd.', code: 'ALREADY_DELIVERED' },
      { status: 409 },
    );
  }
  if (order.status !== 'CANCELLED') {
    await prisma.deliveryOrder.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });
    await prisma.standaloneDeliveryRequest.update({
      where: { id: row.id },
      data: { status: 'CANCELLED_AFTER_PAYMENT', updatedAt: new Date() },
    });
  }
  const review = await applyStandalonePaidCancellation(prisma, {
    deliveryOrderId: order.id,
    previousStatus: order.status,
    actorUserId: userId,
    actor: 'REQUESTER',
  });
  if (!review.ok) {
    return NextResponse.json({ error: review.error, code: review.code }, { status: review.status });
  }
  return NextResponse.json({
    success: true,
    status: 'CANCELLED_AFTER_PAYMENT',
    refund: review.view,
  });
}
