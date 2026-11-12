import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { readTransportCargo, respondToTransportProposal } from '@/lib/delivery/transport-proposal-service';

export const dynamic = 'force-dynamic';

function minutes(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  const action = body.action;
  if (action !== 'ACCEPT' && action !== 'REJECT' && action !== 'COUNTER' && action !== 'QUESTION' && action !== 'REVISE') {
    return NextResponse.json({ error: 'Onbekende actie', code: 'BAD_ACTION' }, { status: 400 });
  }
  const revisedCargo = action === 'REVISE' && body.cargo != null ? readTransportCargo(body.cargo) : null;
  if (action === 'REVISE' && body.cargo != null && !revisedCargo) {
    return NextResponse.json({ error: 'De opdrachtgegevens zijn onvolledig.', code: 'CARGO_REQUIRED' }, { status: 400 });
  }
  const confirmation = body.confirmation && typeof body.confirmation === 'object'
    ? {
        loadMinutes: minutes(body.confirmation.loadMinutes),
        unloadMinutes: minutes(body.confirmation.unloadMinutes),
        acceptEstimatedDrive: body.confirmation.acceptEstimatedDrive === true,
        acknowledgeUnknownConnections: body.confirmation.acknowledgeUnknownConnections === true,
      }
    : null;
  const result = await respondToTransportProposal({
    actorUserId: userId,
    requestId: String(body.requestId || ''),
    expectedVersion: Number(body.expectedVersion),
    action,
    priceCents: body.priceCents == null ? null : Number(body.priceCents),
    note: typeof body.note === 'string' ? body.note : '',
    negotiable: body.negotiable === true,
    confirmation,
    revision: action === 'REVISE' ? {
      pickupAddress: typeof body.pickupAddress === 'string' ? body.pickupAddress : null,
      deliveryAddress: typeof body.deliveryAddress === 'string' ? body.deliveryAddress : null,
      pickupLat: body.pickupLat == null ? null : Number(body.pickupLat),
      pickupLng: body.pickupLng == null ? null : Number(body.pickupLng),
      dropoffLat: body.dropoffLat == null ? null : Number(body.dropoffLat),
      dropoffLng: body.dropoffLng == null ? null : Number(body.dropoffLng),
      requestedPickupAt: typeof body.requestedPickupAt === 'string' && body.requestedPickupAt.trim()
        ? new Date(body.requestedPickupAt)
        : body.requestedPickupAt === null ? null : undefined,
      cargo: revisedCargo,
    } : null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: 'code' in result ? result.code : undefined, schedule: 'schedule' in result ? result.schedule : undefined },
      { status: result.status },
    );
  }
  return NextResponse.json({ success: true, request: result.request });
}
