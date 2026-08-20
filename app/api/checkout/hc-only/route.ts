import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { assertAccountRequirementsOr403 } from '@/lib/account-requirements-server';
import { assertNotSuspended } from '@/lib/user-suspend';
import { prisma } from '@/lib/prisma';
import {
  createHcOnlyOrderWithReserve,
  resolveHcOnlyCheckoutContext,
} from '@/lib/hc/marketplace-hc-order-service';
import { stripSpoofedFeeFields } from '@/lib/hc/marketplace-order-fee-snapshot';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' };

/**
 * Dedicated HC_ONLY checkout — no Stripe, no Connect.
 * Fail-closed unless narrow marketplace pilot gates pass.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, code: 'UNAUTHENTICATED' }, { status: 401, headers: NO_STORE });
    }

    const buyer = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        emailVerified: true,
        username: true,
        termsAccepted: true,
        passwordHash: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true,
        Account: { select: { provider: true } },
      },
    });
    if (!buyer) {
      return NextResponse.json({ ok: false, code: 'USER_NOT_FOUND' }, { status: 404, headers: NO_STORE });
    }

    const suspendBlock = await assertNotSuspended(buyer.id, 'checkout');
    if (suspendBlock.blocked) {
      return NextResponse.json({ ok: false, code: 'SUSPENDED', message: suspendBlock.message }, { status: 403, headers: NO_STORE });
    }

    const checkoutBlock = assertAccountRequirementsOr403(buyer, 'postItem');
    if (checkoutBlock) return checkoutBlock;

    const body = stripSpoofedFeeFields((await req.json()) as Record<string, unknown>);
    const items = body?.items as Array<{ productId: string; quantity: number }> | undefined;
    if (!items?.length) {
      return NextResponse.json({ ok: false, code: 'NO_ITEMS' }, { status: 400, headers: NO_STORE });
    }

    const ctx = await resolveHcOnlyCheckoutContext({ buyerUserId: buyer.id, items });
    if ('error' in ctx) {
      return NextResponse.json({ ok: false, code: ctx.code, message: ctx.error }, { status: 403, headers: NO_STORE });
    }

    const result = await createHcOnlyOrderWithReserve(ctx);
    if (!result.ok) {
      return NextResponse.json(result, { status: 422, headers: NO_STORE });
    }

    return NextResponse.json(
      {
        ok: true,
        paymentMethod: 'HC_ONLY',
        orderId: result.orderId,
        reservationId: result.reservationId,
        requiredHc: result.requiredHc,
        remainingEurCents: 0,
        duplicate: result.duplicate,
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    console.error('[checkout/hc-only]', error);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500, headers: NO_STORE });
  }
}
