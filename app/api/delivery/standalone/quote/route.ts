import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deliveryDisabledBody } from '@/lib/delivery/delivery-deployment-gate';
import { deliveryAccessDeniedBody, evaluateDeliveryAccess, publicDeliveryIsClosed } from '@/lib/delivery/delivery-pilot-access';
import { createStandaloneQuote } from '@/lib/delivery/standalone-delivery';
import { resolveStandaloneStops, splitCouriersByCapacity } from '@/lib/delivery/standalone-request';

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
  const access = evaluateDeliveryAccess({ requesterUserId: userId, requireCourier: false });
  if (!access.allowed) {
    return NextResponse.json(deliveryAccessDeniedBody(access.code), { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Ongeldige aanvraag', code: 'MISSING_ADDRESS' }, { status: 400 });
  }
  const stops = await resolveStandaloneStops(body as Record<string, unknown>);
  if (!stops.ok) {
    return NextResponse.json({ error: stops.error, code: stops.code }, { status: stops.status });
  }
  const requestedRaw = (body as { requestedPickupAt?: unknown }).requestedPickupAt;
  const result = await createStandaloneQuote({
    requesterUserId: userId,
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
  const capacity = splitCouriersByCapacity(result.couriers, stops.shipment);
  return NextResponse.json({
    success: true,
    routeDistanceKm: result.routeDistanceKm,
    requestedPickupAt: result.requestedPickupAt,
    couriers: capacity.matched,
    unavailable: [
      ...(result.unavailable || []),
      ...capacity.excluded.map((courier) => ({
        id: 'id' in courier ? String((courier as { id?: string }).id || '') : '',
        name: 'name' in courier ? String((courier as { name?: string }).name || 'Bezorger') : 'Bezorger',
        code: courier.capacity,
        reason: courier.capacityReason,
      })),
    ],
    capacity: capacity.matched.length > 0 ? 'FITS' : 'UNKNOWN',
  });
}
