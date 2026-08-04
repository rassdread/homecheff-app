import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { createDeliveryBookingRequest } from '@/lib/delivery/booking-request-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
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
    } = body;

    if (!deliveryProfileId || typeof deliveryProfileId !== 'string') {
      return NextResponse.json(
        { error: 'deliveryProfileId required', code: 'DELIVERY_PROVIDER_REQUIRED' },
        { status: 400 }
      );
    }

    const result = await createDeliveryBookingRequest(prisma, {
      buyerId: buyer.id,
      deliveryProfileId,
      productId,
      buyerLat,
      buyerLng,
      routeDistanceKm,
      quotedFeeCents,
      notes,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
          failedChecks: 'failedChecks' in result ? result.failedChecks : undefined,
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      bookingRequestId: result.request.id,
      status: result.request.status,
      acceptanceMode: result.acceptanceMode,
      confirmed: result.confirmed,
      expiresAt: result.request.expiresAt,
      quotedFeeCents: result.request.quotedFeeCents,
    });
  } catch (error) {
    console.error('create booking request', error);
    return NextResponse.json({ error: 'Failed to create booking request' }, { status: 500 });
  }
}
