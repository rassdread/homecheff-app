import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deliveryDisabledBody } from '@/lib/delivery/delivery-deployment-gate';
import { deliveryAccessDeniedBody, evaluateDeliveryAccess, publicDeliveryIsClosed } from '@/lib/delivery/delivery-pilot-access';
import { prisma } from '@/lib/prisma';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import {
  cancelPendingBookingForReplacement,
  createDeliveryBookingRequest,
  expireStaleBookingRequests,
  markBookingSuperseded,
} from '@/lib/delivery/booking-request-service';
import { readMarketplaceSlot } from '@/lib/delivery/checkout-courier-consistency';
import { readSalesLocationId } from '@/lib/delivery/delivery-origin';
import {
  attachBookingToHold,
  openPaymentWindowForBooking,
  releaseUnattachedHold,
  reservationTiming,
  reserveOrReuseCourierHold,
} from '@/lib/products/courier-stock-hold';
import {
  formatPhysicalDeliveryAddress,
  isCompletePhysicalDeliveryAddress,
  validatePhysicalDeliveryAddress,
} from '@/lib/checkout/physical-delivery-address';

function bookingRouteMoved(
  request: { notes: string | null; buyerLat: number | null; buyerLng: number | null },
  buyerLat: unknown,
  buyerLng: unknown,
  originId: string | null,
): boolean {
  const booked = readSalesLocationId(request.notes);
  if ((originId || booked) && originId !== booked) return true;
  if (typeof buyerLat === 'number' && request.buyerLat != null && Math.abs(buyerLat - request.buyerLat) > 0.0001) {
    return true;
  }
  if (typeof buyerLng === 'number' && request.buyerLng != null && Math.abs(buyerLng - request.buyerLng) > 0.0001) {
    return true;
  }
  return false;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
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
    const productId = req.nextUrl.searchParams.get('productId');
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }
    const booking = await prisma.deliveryBookingRequest.findFirst({
      where: {
        buyerId: buyer.id,
        productId,
        status: { in: ['PENDING', 'ACCEPTED', 'AUTO_CONFIRMED', 'REJECTED', 'EXPIRED'] },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        deliveryProfile: {
          select: {
            id: true,
            acceptanceMode: true,
            transportation: true,
            user: { select: { name: true } },
          },
        },
      },
    });
    if (!booking) {
      return NextResponse.json({ booking: null, serverNow: new Date().toISOString() });
    }
    await expireStaleBookingRequests(prisma, [booking.id]);
    const fresh = await prisma.deliveryBookingRequest.findUnique({
      where: { id: booking.id },
    });
    const hold = await prisma.stockReservation.findFirst({
      where: { bookingRequestId: booking.id },
      orderBy: { createdAt: 'desc' },
    });
    const status = fresh?.status ?? booking.status;
    return NextResponse.json({
      serverNow: new Date().toISOString(),
      booking: {
        id: booking.id,
        status,
        expiresAt: booking.expiresAt,
        quotedFeeCents: booking.quotedFeeCents,
        deliveryProfileId: booking.deliveryProfileId,
        providerName: booking.deliveryProfile.user?.name ?? null,
        acceptanceMode: booking.acceptanceModeSnapshot,
        vehicleType: booking.deliveryProfile.transportation?.[0] ?? null,
        routeDistanceKm: booking.routeDistanceKm,
        buyerLat: booking.buyerLat,
        buyerLng: booking.buyerLng,
        requestedPickupAt: readMarketplaceSlot(booking.notes),
      },
      reservation: reservationTiming(hold),
    });
  } catch (error) {
    console.error('list booking request', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (publicDeliveryIsClosed()) {
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
      street,
      houseNumber,
      postalCode,
      city,
      country,
      deliveryOriginLocationId,
    } = body;
    const requestedOriginId =
      typeof deliveryOriginLocationId === 'string' && deliveryOriginLocationId.trim()
        ? deliveryOriginLocationId.trim()
        : null;
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

    const deliveryAddressInput = {
      street: typeof street === 'string' ? street : '',
      houseNumber: typeof houseNumber === 'string' ? houseNumber : '',
      postalCode: typeof postalCode === 'string' ? postalCode : '',
      city: typeof city === 'string' ? city : '',
      country: typeof country === 'string' ? country : 'NL',
      lat: typeof buyerLat === 'number' ? buyerLat : null,
      lng: typeof buyerLng === 'number' ? buyerLng : null,
    };
    if (!isCompletePhysicalDeliveryAddress(deliveryAddressInput)) {
      const codes = validatePhysicalDeliveryAddress(deliveryAddressInput);
      return NextResponse.json(
        {
          error: codes.includes('houseNumber')
            ? 'Vul een huisnummer in voor bezorging.'
            : 'Vul een volledig bezorgadres in (straat, huisnummer, postcode, plaats).',
          code: 'DELIVERY_ADDRESS_INCOMPLETE',
          fields: codes,
        },
        { status: 400 },
      );
    }
    const formattedDeliveryAddress = formatPhysicalDeliveryAddress(deliveryAddressInput);
    const bookingAccess = evaluateDeliveryAccess({
      requesterUserId: buyer.id,
      courierProfileId: deliveryProfileId,
    });
    if (!bookingAccess.allowed) {
      return NextResponse.json(deliveryAccessDeniedBody(bookingAccess.code), { status: 403 });
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
        if (bookingRouteMoved(alreadyAccepted, buyerLat, buyerLng, requestedOriginId)) {
          return NextResponse.json(
            {
              error: 'De ophaal- of bezorglocatie wijkt af van de geaccepteerde boeking.',
              code: 'DELIVERY_ROUTE_CHANGED',
              bookingRequestId: alreadyAccepted.id,
            },
            { status: 409 },
          );
        }
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
        samePending.id !== replacesBookingRequestId &&
        !bookingRouteMoved(samePending, buyerLat, buyerLng, requestedOriginId)
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
      if (
        samePending &&
        bookingRouteMoved(samePending, buyerLat, buyerLng, requestedOriginId)
      ) {
        const replaced = await cancelPendingBookingForReplacement(prisma, {
          requestId: samePending.id,
          buyerId: buyer.id,
        });
        if (!replaced.ok) {
          return NextResponse.json(
            { error: replaced.error, code: replaced.code },
            { status: replaced.status },
          );
        }
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

    const notesWithAddress = [
      typeof notes === 'string' ? notes.trim() : '',
      formattedDeliveryAddress ? `Bezorgadres: ${formattedDeliveryAddress}` : '',
    ]
      .filter(Boolean)
      .join('\n');

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
        notes: notesWithAddress || undefined,
        pickupLocationId: requestedOriginId,
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
          bookingRequestId:
            'bookingRequestId' in result ? result.bookingRequestId : undefined,
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
      serverNow: new Date().toISOString(),
      quotedFeeCents: result.request.quotedFeeCents,
      reservation: reservationTiming(storedHold),
    });
  } catch (error) {
    console.error('create booking request', error);
    return NextResponse.json({ error: 'Failed to create booking request' }, { status: 500 });
  }
}
