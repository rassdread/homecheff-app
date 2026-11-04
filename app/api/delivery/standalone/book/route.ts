import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deliveryDisabledBody } from '@/lib/delivery/delivery-deployment-gate';
import { deliveryAccessDeniedBody, evaluateDeliveryAccess, publicDeliveryIsClosed } from '@/lib/delivery/delivery-pilot-access';
import { bookStandaloneCourier } from '@/lib/delivery/standalone-delivery';
import { resolveStandaloneStops } from '@/lib/delivery/standalone-request';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (publicDeliveryIsClosed()) {
    return NextResponse.json(deliveryDisabledBody(), { status: 403 });
  }
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }
  const deliveryProfileId = String((body as { deliveryProfileId?: unknown }).deliveryProfileId || '');
  const access = evaluateDeliveryAccess({
    requesterUserId: userId,
    courierProfileId: deliveryProfileId,
  });
  if (!access.allowed) {
    return NextResponse.json(deliveryAccessDeniedBody(access.code), { status: 403 });
  }
  const stops = await resolveStandaloneStops(body as Record<string, unknown>);
  if (!stops.ok) {
    return NextResponse.json({ error: stops.error, code: stops.code }, { status: stops.status });
  }
  const requestedRaw = (body as { requestedPickupAt?: unknown }).requestedPickupAt;
  const result = await bookStandaloneCourier({
    requesterUserId: userId,
    deliveryProfileId,
    pickupAddress: stops.pickup.address,
    deliveryAddress: stops.dropoff.address,
    itemDescription: stops.itemDescription,
    pickupLat: stops.pickup.lat,
    pickupLng: stops.pickup.lng,
    dropoffLat: stops.dropoff.lat,
    dropoffLng: stops.dropoff.lng,
    requestedPickupAt:
      typeof requestedRaw === 'string' && requestedRaw.trim() ? new Date(requestedRaw) : null,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error, code: result.code }, { status: result.status });
  }
  return NextResponse.json({ success: true, request: result.request });
}
