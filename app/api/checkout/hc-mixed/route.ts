import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { assertAccountRequirementsOr403 } from '@/lib/account-requirements-server';
import { assertNotSuspended } from '@/lib/user-suspend';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { calculateStripeFeeForBuyer } from '@/lib/fees';
import {
  createMixedHcOrderWithReserve,
  resolveMixedHcCheckoutContext,
  releaseMixedHcReservation,
} from '@/lib/hc/marketplace-hc-mixed-service';
import { stripSpoofedFeeFields } from '@/lib/hc/marketplace-order-fee-snapshot';
import { readMarketplaceUtmFromCookies } from '@/lib/acquisition/read-marketplace-utm-cookie';
import { marketplaceUtmToStripeMetadata } from '@/lib/acquisition/utm-persistence';

export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' };

/**
 * Mixed HC + Stripe checkout.
 * Reserves HC, creates PENDING order, Stripe session for remaining EUR only.
 * Seller GMV = full order; treasury funds HC leg after Stripe success (webhook).
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
    const requestedHc = Math.floor(Number(body?.requestedHc ?? 0));
    const deliveryFeeCents = Math.max(0, Math.round(Number(body?.deliveryFeeCents ?? 0)));
    const smsNotificationCostCents = Math.max(0, Math.round(Number(body?.smsNotificationCostCents ?? 0)));
    const deliveryModeRaw = String(body?.deliveryMode ?? 'PICKUP').toUpperCase();
    const deliveryMode =
      deliveryModeRaw === 'DELIVERY' ||
      deliveryModeRaw === 'SHIPPING' ||
      deliveryModeRaw === 'PICKUP' ||
      deliveryModeRaw === 'LOCAL_PROVIDER' ||
      deliveryModeRaw === 'TEEN_DELIVERY'
        ? deliveryModeRaw
        : 'PICKUP';
    const deliveryAddress =
      typeof body?.address === 'string'
        ? body.address
        : typeof body?.deliveryAddress === 'string'
          ? body.deliveryAddress
          : null;
    const deliveryProfileId =
      typeof body?.selectedDeliveryProfileId === 'string'
        ? body.selectedDeliveryProfileId
        : typeof body?.deliveryProfileId === 'string'
          ? body.deliveryProfileId
          : null;

    if (!items?.length) {
      return NextResponse.json({ ok: false, code: 'NO_ITEMS' }, { status: 400, headers: NO_STORE });
    }

    const ctx = await resolveMixedHcCheckoutContext({
      buyerUserId: buyer.id,
      items,
      requestedHc,
      deliveryFeeCents,
      smsNotificationCostCents,
      deliveryMode,
      deliveryAddress,
      deliveryProfileId,
    });
    if ('error' in ctx) {
      return NextResponse.json({ ok: false, code: ctx.code, message: ctx.error }, { status: 422, headers: NO_STORE });
    }

    const created = await createMixedHcOrderWithReserve(ctx);
    if (!created.ok) {
      return NextResponse.json(created, { status: 422, headers: NO_STORE });
    }

    const { buyerTotalCents } = calculateStripeFeeForBuyer(created.remainingEurCents);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://homecheff.eu';

    try {
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card', 'ideal'],
        line_items: [
          {
            price_data: {
              currency: 'eur',
              unit_amount: buyerTotalCents,
              product_data: {
                name: 'HomeCheff bestelling (restant na HC)',
                description: `HC gebruikt: ${created.requestedHc} · Order ${created.orderId.slice(0, 8)}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/orders/${created.orderId}?hc=mixed&success=1`,
        cancel_url: `${baseUrl}/checkout?hc=cancelled&orderId=${created.orderId}`,
        customer_email: session.user.email,
        metadata: {
          paymentMode: 'MIXED_HC_EUR',
          orderId: created.orderId,
          buyerId: buyer.id,
          hcReservationId: created.reservationId,
          requestedHc: String(created.requestedHc),
          orderTotalCents: String(created.orderTotalCents),
          remainingEurCents: String(created.remainingEurCents),
          deliveryFeeCents: String(ctx.deliveryFeeCents),
          deliveryMode: ctx.localDeliveryMode,
          economicPolicyVersion: created.economicPolicyVersion,
          orderCreated: 'true',
          ...marketplaceUtmToStripeMetadata(await readMarketplaceUtmFromCookies()),
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      });

      await prisma.order.update({
        where: { id: created.orderId },
        data: { stripeSessionId: checkoutSession.id },
      });

      return NextResponse.json(
        {
          ok: true,
          paymentMethod: 'MIXED_HC_EUR',
          orderId: created.orderId,
          reservationId: created.reservationId,
          requestedHc: created.requestedHc,
          remainingEurCents: created.remainingEurCents,
          checkoutUrl: checkoutSession.url,
          sessionId: checkoutSession.id,
        },
        { status: 200, headers: NO_STORE },
      );
    } catch (stripeErr) {
      await releaseMixedHcReservation(created.orderId, 'ORDER_CREATE_FAILED');
      console.error('[checkout/hc-mixed] stripe', stripeErr);
      return NextResponse.json({ ok: false, code: 'STRIPE_SESSION_FAILED' }, { status: 502, headers: NO_STORE });
    }
  } catch (error) {
    console.error('[checkout/hc-mixed]', error);
    return NextResponse.json({ ok: false, code: 'INTERNAL_ERROR' }, { status: 500, headers: NO_STORE });
  }
}
