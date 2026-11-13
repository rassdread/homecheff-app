import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createStandaloneQuote } from '@/lib/delivery/standalone-delivery';
import { publicJobView, transportCheckoutAmounts, transportProposalsEnabled } from '@/lib/delivery/transport-job';
import { readTransportCargo, sendTransportProposal } from '@/lib/delivery/transport-proposal-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  const profile = await prisma.deliveryProfile.findUnique({ where: { userId }, select: { id: true } });
  const rows = await prisma.standaloneDeliveryRequest.findMany({
    where: {
      jobKind: 'TRANSPORT',
      status: 'PROPOSAL',
      OR: [
        { requesterUserId: userId },
        ...(profile ? [{ deliveryProfileId: profile.id }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { proposals: { orderBy: { version: 'desc' }, take: 1 } },
  });
  return NextResponse.json({
    proposals: rows.map((row) => {
      const latest = row.proposals[0];
      const view = publicJobView({
        pickupAddress: row.pickupAddress,
        deliveryAddress: row.deliveryAddress,
        paid: false,
      });
      return {
        id: row.id,
        role: row.requesterUserId === userId ? 'CUSTOMER' : 'COURIER',
        version: latest?.version ?? 0,
        action: latest?.action ?? 'OFFER',
        authorRole: latest?.authorRole ?? 'CUSTOMER',
        priceCents: latest?.priceCents ?? row.quotedFeeCents,
        ...transportCheckoutAmounts(latest?.priceCents ?? row.quotedFeeCents ?? 0),
        note: latest?.note ?? null,
        expiresAt: latest?.expiresAt ?? row.proposalExpiresAt,
        itemDescription: row.itemDescription,
        photoIds: Array.isArray((row.cargo as { photoIds?: unknown } | null)?.photoIds)
          ? (row.cargo as { photoIds: unknown[] }).photoIds.filter((id): id is string => typeof id === 'string')
          : [],
        cargo: row.cargo,
        ...view,
      };
    }),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  if (!transportProposalsEnabled()) {
    return NextResponse.json({ error: 'Transportvoorstellen staan uit.', code: 'TRANSPORT_DISABLED' }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Ongeldige aanvraag' }, { status: 400 });
  }
  const cargo = readTransportCargo(body.cargo);
  if (!cargo) return NextResponse.json({ error: 'De opdrachtgegevens zijn onvolledig.', code: 'CARGO_REQUIRED' }, { status: 400 });
  const requestedRaw = body.requestedPickupAt;
  const listed = await createStandaloneQuote({
    requesterUserId: userId,
    pickupAddress: String(body.pickupAddress || ''),
    deliveryAddress: String(body.deliveryAddress || ''),
    itemDescription: String(body.itemDescription || ''),
    pickupLat: Number(body.pickupLat),
    pickupLng: Number(body.pickupLng),
    dropoffLat: Number(body.dropoffLat),
    dropoffLng: Number(body.dropoffLng),
    requestedPickupAt: typeof requestedRaw === 'string' && requestedRaw.trim() ? new Date(requestedRaw) : null,
  });
  if (!listed.ok) return NextResponse.json({ error: listed.error, code: listed.code }, { status: listed.status });
  const selected = listed.couriers.find((courier) => courier.id === String(body.deliveryProfileId || ''));
  if (!selected) {
    return NextResponse.json({ error: 'Deze bezorger past niet bij de opdracht.', code: 'DELIVERY_PROVIDER_INELIGIBLE' }, { status: 422 });
  }
  const sent = await sendTransportProposal({
    requesterUserId: userId,
    deliveryProfileId: selected.id,
    pickupAddress: String(body.pickupAddress || ''),
    deliveryAddress: String(body.deliveryAddress || ''),
    itemDescription: String(body.itemDescription || ''),
    pickupLat: Number(body.pickupLat),
    pickupLng: Number(body.pickupLng),
    dropoffLat: Number(body.dropoffLat),
    dropoffLng: Number(body.dropoffLng),
    requestedPickupAt: typeof requestedRaw === 'string' && requestedRaw.trim() ? new Date(requestedRaw) : null,
    priceCents: body.priceCents == null ? null : Number(body.priceCents),
    note: typeof body.note === 'string' ? body.note : cargo.note,
    negotiable: body.negotiable === true,
    action: body.action === 'QUESTION' ? 'QUESTION' : 'OFFER',
    cargo,
    routeDistanceKm: listed.routeDistanceKm,
  });
  if (!sent.ok) return NextResponse.json({ error: sent.error, code: sent.code }, { status: sent.status });
  return NextResponse.json({ success: true, request: sent.request });
}
