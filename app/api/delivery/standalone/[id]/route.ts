import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readHcDeliveryRefundMarker } from '@/lib/hc/marketplace-hc-delivery-refund-pure';
import { standaloneRefundView } from '@/lib/delivery/standalone-cancellation';

export const dynamic = 'force-dynamic';

export async function GET(
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
    return NextResponse.json({ error: 'Niet gevonden', code: 'FORBIDDEN' }, { status: 403 });
  }
  const job = row.deliveryOrderId
    ? await prisma.deliveryOrder.findUnique({
        where: { id: row.deliveryOrderId },
        select: { id: true, status: true, deliveryProfileId: true, deliveredAt: true, pickedUpAt: true, notes: true },
      })
    : null;
  const booking = row.bookingRequestId
    ? await prisma.deliveryBookingRequest.findUnique({
        where: { id: row.bookingRequestId },
        select: { id: true, status: true, expiresAt: true, notes: true },
      })
    : null;
  return NextResponse.json({
    id: row.id,
    status: row.status,
    paymentStatus: row.paymentStatus,
    quotedFeeCents: row.quotedFeeCents,
    stripeFeeCents: row.stripeFeeCents,
    buyerTotalCents: row.buyerTotalCents,
    providerDisplayName: row.providerDisplayName,
    routeDistanceKm: row.routeDistanceKm,
    itemDescription: row.itemDescription,
    requestedPickupAt: row.requestedPickupAt,
    paymentAvailable: booking?.status === 'ACCEPTED' || booking?.status === 'AUTO_CONFIRMED',
    booking,
    delivery: job ? { id: job.id, status: job.status, deliveryProfileId: job.deliveryProfileId, deliveredAt: job.deliveredAt, pickedUpAt: job.pickedUpAt } : null,
    refund: standaloneRefundView(readHcDeliveryRefundMarker(job?.notes)),
  });
}
