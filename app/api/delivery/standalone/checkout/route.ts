import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deliveryDisabledBody, isHomeCheffDeliveryEnabled } from '@/lib/delivery/delivery-deployment-gate';
import { createStandaloneCheckout } from '@/lib/delivery/standalone-delivery';

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
  const requestId = typeof body?.requestId === 'string' ? body.requestId : '';
  if (!requestId) {
    return NextResponse.json({ error: 'Offerte ontbreekt', code: 'NOT_FOUND' }, { status: 400 });
  }
  const clientQuotedFeeCents =
    body?.clientQuotedFeeCents == null ? null : Number(body.clientQuotedFeeCents);
  const result = await createStandaloneCheckout({
    requesterUserId: userId,
    requestId,
    origin: req.nextUrl.origin,
    clientQuotedFeeCents: Number.isFinite(clientQuotedFeeCents) ? clientQuotedFeeCents : null,
  });
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, quotedFeeCents: 'quotedFeeCents' in result ? result.quotedFeeCents : undefined },
      { status: result.status },
    );
  }
  return NextResponse.json({ url: result.url, sessionId: result.sessionId, buyerTotalCents: result.buyerTotalCents });
}
