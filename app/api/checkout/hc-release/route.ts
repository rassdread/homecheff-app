import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { releaseMixedHcReservation } from '@/lib/hc/marketplace-hc-mixed-service';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' };

/** Buyer cancels mixed checkout / abandons Stripe — release HC reservation. */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401, headers: NO_STORE });
    }
    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!buyer) {
      return NextResponse.json({ ok: false, code: 'USER_NOT_FOUND' }, { status: 404, headers: NO_STORE });
    }

    const body = (await req.json()) as { orderId?: string };
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : '';
    if (!orderId) {
      return NextResponse.json({ ok: false, code: 'ORDER_REQUIRED' }, { status: 400, headers: NO_STORE });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, paymentMethod: true },
    });
    if (!order || order.userId !== buyer.id) {
      return NextResponse.json({ ok: false, code: 'ORDER_NOT_FOUND' }, { status: 404, headers: NO_STORE });
    }
    if (order.paymentMethod !== 'MIXED_HC_EUR') {
      return NextResponse.json({ ok: false, code: 'NOT_MIXED_ORDER' }, { status: 422, headers: NO_STORE });
    }

    const result = await releaseMixedHcReservation(orderId, 'BUYER_CANCELLED');
    return NextResponse.json(result, { status: result.ok ? 200 : 422, headers: NO_STORE });
  } catch (e) {
    console.error('[checkout/hc-release]', e);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500, headers: NO_STORE });
  }
}
