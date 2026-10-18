import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deliveryDisabledBody, isHomeCheffDeliveryEnabled } from '@/lib/delivery/delivery-deployment-gate';
import { createStandaloneQuote } from '@/lib/delivery/standalone-delivery';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!isHomeCheffDeliveryEnabled()) {
    return NextResponse.json(deliveryDisabledBody(), { status: 403 });
  }
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Ongeldige aanvraag', code: 'MISSING_ADDRESS' }, { status: 400 });
  }
  const requestedRaw = body.requestedPickupAt;
  const requestedPickupAt =
    typeof requestedRaw === 'string' && requestedRaw.trim()
      ? new Date(requestedRaw)
      : null;
  const result = await createStandaloneQuote({
    requesterUserId: userId,
    pickupAddress: String(body.pickupAddress || ''),
    deliveryAddress: String(body.deliveryAddress || ''),
    itemDescription: String(body.itemDescription || ''),
    pickupLat: Number(body.pickupLat),
    pickupLng: Number(body.pickupLng),
    dropoffLat: Number(body.dropoffLat),
    dropoffLng: Number(body.dropoffLng),
    requestedPickupAt,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }
  return NextResponse.json({
    success: true,
    routeDistanceKm: result.routeDistanceKm,
    requestedPickupAt: result.requestedPickupAt,
    couriers: result.couriers,
    unavailable: result.unavailable,
  });
}
