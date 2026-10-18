import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deliveryDisabledBody, isHomeCheffDeliveryEnabled } from '@/lib/delivery/delivery-deployment-gate';
import { prisma } from '@/lib/prisma';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import {
  cancelPendingBookingForReplacement,
  createDeliveryBookingRequest,
  markBookingSuperseded,
} from '@/lib/delivery/booking-request-service';
import {
  attachBookingToHold,
  openPaymentWindowForBooking,
  releaseUnattachedHold,
  reservationTiming,
  reserveOrReuseCourierHold,
} from '@/lib/products/courier-stock-hold';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!isHomeCheffDeliveryEnabled()) {
      return NextResponse.json(deliveryDisabledBody(), { status: 403 });
    }
    const flags = getDeliveryAlignmentFlags();
    if (!flags.namedProviderSelectionEnabled) {
      return NextResponse.json(
        { error: 'Named provider selection is disabled', code: 'FEATURE_DISABLED' },
        { status: 403 }
      );
    }

    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!buyer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      deliveryProfileId,
      productId,
      buyerLat,
      buyerLng,
      routeDistanceKm,
      quotedFeeCents,
      notes,
      replacesBookingRequestId,
      quantity,
    } = body;
    const requestedQuantity =
      typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0
        ? quantity
        : 1;

    if (!deliveryProfileId || typeof deliveryProfileId !== 'string') {
      return NextResponse.json(
        { error: 'deliveryProfileId required', code: 'DELIVERY_PROVIDER_REQUIRED' },
        { status: 400 }
      );
    }

    if (productId && typeof productId === 'string') {
      const alreadyAccepted = await prisma.deliveryBookingRequest.findFirst({
        where: {
          buyerId: buyer.id,
          productId,
          status: { in: ['ACCEPTED', 'AUTO_CONFIRMED'] },
        },
      });
      if (
        alreadyAccepted &&
        alreadyAccepted.deliveryProfileId !== deliveryProfileId
      ) {
        return NextResponse.json(
          {
            error: 'De bezorger heeft al bevestigd. Rond die betaling af.',
            code: 'COURIER_ALREADY_ACCEPTED',
            bookingRequestId: alreadyAccepted.id,
          },
          { status: 409 },
        );
      }
      if (
        alreadyAccepted &&
        alreadyAccepted.deliveryProfileId === deliveryProfileId
      ) {
        const hold = await prisma.stockReservation.findFirst({
          where: { bookingRequestId: alreadyAccepted.id, status: 'PENDING' },
        });
        return NextResponse.json({
          success: true,
          bookingRequestId: alreadyAccepted.id,
          status: alreadyAccepted.status,
          acceptanceMode: alreadyAccepted.acceptanceModeSnapshot,
          confirmed: true,
          expiresAt: alreadyAccepted.expiresAt,
          quotedFeeCents: alreadyAccepted.quotedFeeCents,
          reservation: reservationTiming(hold),
        });
      }
      const samePending = await prisma.deliveryBookingRequest.findFirst({
        where: {
          buyerId: buyer.id,
          productId,
          deliveryProfileId,
          status: 'PENDING',
        },
      });
      if (
        samePending &&
        samePending.id !== replacesBookingRequestId
      ) {
        const hold = await prisma.stockReservation.findFirst({
          where: { bookingRequestId: samePending.id, status: 'PENDING' },
        });
        return NextResponse.json({
          success: true,
          bookingRequestId: samePending.id,
          status: samePending.status,
          acceptanceMode: samePending.acceptanceModeSnapshot,
          confirmed: false,
          expiresAt: samePending.expiresAt,
          quotedFeeCents: samePending.quotedFeeCents,
          reservation: reservationTiming(hold),
        });
      }
    }

    if (replacesBookingRequestId && typeof replacesBookingRequestId === 'string') {
      const replaced = await cancelPendingBookingForReplacement(prisma, {
        requestId: replacesBookingRequestId,
        buyerId: buyer.id,
      });
      if (!replaced.ok) {
        return NextResponse.json(
          { error: replaced.error, code: replaced.code },
          { status: replaced.status },
        );
      }
    }

    let hold:
      | { id: string; created: boolean; holdUntil: Date | null; expiresAt: Date }
      | null = null;
    if (productId && typeof productId === 'string') {
      const reserved = await reserveOrReuseCourierHold(prisma, {
        buyerId: buyer.id,
        productId,
        quantity: requestedQuantity,
      });
      if (reserved.kind === 'unavailable' || reserved.kind === 'quantity') {
        return NextResponse.json(
          {
            error: 'Onvoldoende voorraad om dit product te reserveren.',
            code: 'INSUFFICIENT_STOCK',
            available: reserved.available,
          },
          { status: 409 },
        );
      }
      if (reserved.kind === 'missing') {
        return NextResponse.json({ error: 'Product niet gevonden' }, { status: 404 });
      }
      if (reserved.kind === 'created' || reserved.kind === 'reused') {
        hold = {
          id: reserved.reservation.id,
          created: reserved.created,
          holdUntil: reserved.reservation.holdUntil,
          expiresAt: reserved.reservation.expiresAt,
        };
      }
    }

    let result: Awaited<ReturnType<typeof createDeliveryBookingRequest>>;
    try {
      result = await createDeliveryBookingRequest(prisma, {
        buyerId: buyer.id,
        deliveryProfileId,
        productId,
        buyerLat,
        buyerLng,
        routeDistanceKm,
        quotedFeeCents,
        notes,
        holdUntil: hold?.holdUntil ?? hold?.expiresAt ?? null,
      });
    } catch (error) {
      if (hold?.created) await releaseUnattachedHold(prisma, hold.id);
      throw error;
    }

    if (!result.ok) {
      if (hold?.created) await releaseUnattachedHold(prisma, hold.id);
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          failedChecks: 'failedChecks' in result ? result.failedChecks : undefined,
        },
        { status: result.status }
      );
    }

    if (hold) {
      await attachBookingToHold(prisma, hold.id, result.request.id);
      if (result.confirmed) {
        await openPaymentWindowForBooking(prisma, result.request.id);
      }
    }
    if (replacesBookingRequestId && typeof replacesBookingRequestId === 'string') {
      await markBookingSuperseded(prisma, replacesBookingRequestId, result.request.id);
    }

    const storedHold = hold
      ? await prisma.stockReservation.findUnique({ where: { id: hold.id } })
      : null;

    return NextResponse.json({
      success: true,
      bookingRequestId: result.request.id,
      status: result.request.status,
      acceptanceMode: result.acceptanceMode,
      confirmed: result.confirmed,
      expiresAt: result.request.expiresAt,
      quotedFeeCents: result.request.quotedFeeCents,
      reservation: reservationTiming(storedHold),
    });
  } catch (error) {
    console.error('create booking request', error);
    return NextResponse.json({ error: 'Failed to create booking request' }, { status: 500 });
  }
}
