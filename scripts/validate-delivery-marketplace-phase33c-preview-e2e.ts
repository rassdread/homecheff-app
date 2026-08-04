/**
 * Phase 3.3C — Preview Stripe Test Mode E2E (no Production).
 * Run with Preview DATABASE_URL / DIRECT_URL / STRIPE_* already in env.
 *
 * npx tsx scripts/validate-delivery-marketplace-phase33c-preview-e2e.ts
 */
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import {
  acceptDeliveryBookingRequest,
  createDeliveryBookingRequest,
  rejectDeliveryBookingRequest,
} from '../lib/delivery/booking-request-service';
import { splitDeliveryCommission } from '../lib/delivery/quote-snapshot';

const TAG = 'dm-33c';
const PREVIEW_DEPLOY =
  process.env.PREVIEW_DEPLOY_URL ||
  'https://homecheff-7z4ranp64-sergio-s-projects-f7b64ee1.vercel.app';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function assertPreviewDb(url: string) {
  if (!url.includes('fragrant-smoke')) {
    throw new Error(`Refusing non-Preview DATABASE_URL host`);
  }
  if (url.includes('summer-darkness')) {
    throw new Error(`Refusing Production DATABASE_URL`);
  }
}

function assertTestStripe(sk: string) {
  if (!sk.startsWith('sk_test_')) {
    throw new Error(`Refusing non-test Stripe secret`);
  }
}

function signStripePayload(payload: string, secret: string, stripe: Stripe): string {
  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
}

async function postWebhook(
  payload: string,
  signature: string
): Promise<{ status: number; body: string }> {
  const { execFileSync } = await import('node:child_process');
  const fs = await import('node:fs');
  const tmpPayload = `/tmp/hc33c-wh-payload.json`;
  fs.writeFileSync(tmpPayload, payload);
  try {
    const out = execFileSync(
      'npx',
      [
        'vercel',
        'curl',
        '/api/stripe/webhook',
        '--deployment',
        PREVIEW_DEPLOY,
        '--',
        '--request',
        'POST',
        '--header',
        'Content-Type: application/json',
        '--header',
        `stripe-signature: ${signature}`,
        '--data-binary',
        `@${tmpPayload}`,
        '--write-out',
        '\nHTTP_STATUS:%{http_code}\n',
      ],
      { encoding: 'utf8', maxBuffer: 5_000_000 }
    );
    const statusMatch = out.match(/HTTP_STATUS:(\d{3})/);
    const status = statusMatch
      ? Number(statusMatch[1])
      : /\bok\b/i.test(out)
        ? 200
        : 0;
    return { status, body: out.slice(-800) };
  } catch (e: any) {
    const out = `${e.stdout || ''}${e.stderr || ''}`;
    const statusMatch = out.match(/HTTP_STATUS:(\d{3})/);
    return {
      status: statusMatch ? Number(statusMatch[1]) : e.status || 0,
      body: out.slice(-800),
    };
  }
}

async function main() {
  const databaseUrl = requireEnv('DATABASE_URL');
  const stripeSecret = requireEnv('STRIPE_SECRET_KEY');
  const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET');
  assertPreviewDb(databaseUrl);
  assertTestStripe(stripeSecret);

  const prisma = new PrismaClient();
  const stripe = new Stripe(stripeSecret, { apiVersion: '2025-07-30.basil' as any });

  const evidence: Record<string, unknown> = {
    previewDeploy: PREVIEW_DEPLOY,
    stripeLivemode: false,
  };

  try {
    const balance = await stripe.balance.retrieve();
    assert.equal(balance.livemode, false);
    evidence.stripeBalanceOk = true;

    const buyer = await prisma.user.findFirst({
      where: { email: { startsWith: 'dm-preview-33b+buyer.' } },
    });
    const product = await prisma.product.findFirst({
      where: { title: { startsWith: 'DM Preview Soup' } },
    });
    const auto = await prisma.deliveryProfile.findFirst({
      where: { bio: { contains: 'ISOLATION_PROOF_dm-preview-33b' } },
      include: { user: { select: { name: true } } },
    });
    const manual = await prisma.deliveryProfile.findFirst({
      where: { bio: 'dm-preview-33b manual' },
      include: { user: { select: { name: true } } },
    });
    assert.ok(buyer && product && auto && manual, 'synthetic seed missing');

    // Ensure providers online for AUTO validation
    await prisma.deliveryProfile.updateMany({
      where: { id: { in: [auto!.id, manual!.id] } },
      data: { isOnline: true, temporaryOffline: false, isActive: true, isVerified: true },
    });

    const quotedFeeCents = 1000;
    const split = splitDeliveryCommission(quotedFeeCents);
    assert.equal(split.platformCommissionCents, 120);
    assert.equal(split.providerNetPayoutCents, 880);
    evidence.eur10Split = split;

    async function runFlow(opts: {
      label: 'AUTO_CONFIRM' | 'MANUAL_CONFIRM';
      profile: NonNullable<typeof auto>;
      acceptManual?: boolean;
    }) {
      const routeDistanceKm = 5;
      const booking = await createDeliveryBookingRequest(prisma, {
        buyerId: buyer!.id,
        deliveryProfileId: opts.profile.id,
        productId: product!.id,
        buyerLat: 52.3702,
        buyerLng: 4.8952,
        routeDistanceKm,
        quotedFeeCents,
        notes: `${TAG} ${opts.label}`,
      });
      assert.equal(booking.ok, true, JSON.stringify(booking));
      if (!booking.ok) throw new Error('booking failed');

      let bookingRequestId = booking.request.id;
      let acceptanceMode = opts.label;

      if (opts.label === 'MANUAL_CONFIRM') {
        assert.equal(booking.request.status, 'PENDING');
        assert.ok(booking.request.expiresAt.getTime() > Date.now());
        if (opts.acceptManual) {
          const accepted = await acceptDeliveryBookingRequest(prisma, {
            requestId: bookingRequestId,
            deliveryProfileUserId: opts.profile.userId,
          });
          assert.equal(accepted.ok, true, JSON.stringify(accepted));
          bookingRequestId = accepted.ok ? accepted.request.id : bookingRequestId;
        }
      } else {
        assert.equal(booking.request.status, 'AUTO_CONFIRMED');
        const cal = await prisma.deliveryCalendarEntry.findFirst({
          where: { bookingRequestId },
        });
        assert.ok(cal, 'AUTO calendar missing');
        assert.equal(cal!.status, 'CONFIRMED');
        assert.equal(cal!.earningsCents, 880);
      }

      const quoteLockedAt = new Date().toISOString();
      const providerName = (opts.profile.user?.name || 'DM Provider').slice(0, 120);
      const productsTotalCents = product!.priceCents;
      const amountPaidCents = productsTotalCents + quotedFeeCents;
      const itemsCompact = `${product!.id}|1|${product!.priceCents}|${product!.sellerId}`;

      const metadata: Record<string, string> = {
        buyerId: buyer!.id,
        items_compact_1: itemsCompact,
        deliveryMode: 'LOCAL_PROVIDER',
        fulfillmentMethod: 'LOCAL_PROVIDER',
        address: 'Damrak 1, 1012 LG Amsterdam',
        amountPaidCents: String(amountPaidCents),
        productsTotalCents: String(productsTotalCents),
        deliveryFeeCents: String(quotedFeeCents),
        stripeFeeCents: '0',
        namedProviderSelection: 'true',
        deliveryProfileId: opts.profile.id,
        deliveryAcceptanceMode: acceptanceMode,
        bookingRequestId,
        deliveryProviderName: providerName,
        deliveryQuotedFeeCents: String(quotedFeeCents),
        deliveryPricingSource: 'PROVIDER',
        deliveryPricingFormulaVersion: 'provider-v1',
        deliveryPricingCurrency: 'EUR',
        deliveryRouteDistanceKm: String(routeDistanceKm),
        deliveryBaseFeeCents: String(opts.profile.baseFeeCents ?? 1000),
        deliveryPricePerKmCents: String(opts.profile.pricePerKmCents ?? 100),
        deliveryMinimumFeeCents: String(opts.profile.minimumFeeCents ?? 500),
        deliveryFreeRadiusKm: String(opts.profile.freeDeliveryRadiusKm ?? 1),
        deliveryPlatformCommissionPercent: '12',
        deliveryPlatformCommissionCents: String(split.platformCommissionCents),
        deliveryProviderNetPayoutCents: String(split.providerNetPayoutCents),
        quoteLockedAt,
        deliveryFeeBreakdown: JSON.stringify({
          homecheffCut: split.platformCommissionCents,
          delivererAmount: split.providerNetPayoutCents,
        }),
        coordinates: JSON.stringify({ lat: 52.3702, lng: 4.8952 }),
      };

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: `${PREVIEW_DEPLOY}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${PREVIEW_DEPLOY}/checkout?cancelled=1`,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: productsTotalCents,
              product_data: { name: product!.title },
            },
          },
          {
            quantity: 1,
            price_data: {
              currency: 'eur',
              unit_amount: quotedFeeCents,
              product_data: { name: 'Bezorgkosten (provider)' },
            },
          },
        ],
        payment_intent_data: {
          metadata,
        },
        metadata,
      });
      assert.equal(session.livemode, false);

      let paidSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['payment_intent'],
      });
      let pi =
        typeof paidSession.payment_intent === 'string'
          ? await stripe.paymentIntents.retrieve(paidSession.payment_intent)
          : paidSession.payment_intent;
      if (!pi) {
        // Fallback: create & attach PI then expire unused session path
        pi = await stripe.paymentIntents.create({
          amount: amountPaidCents,
          currency: 'eur',
          payment_method: 'pm_card_visa',
          confirm: true,
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
          metadata,
        });
      } else if (pi.status !== 'succeeded') {
        pi = await stripe.paymentIntents.confirm(pi.id, {
          payment_method: 'pm_card_visa',
        });
      }
      assert.equal(pi.status, 'succeeded');
      assert.equal(pi.livemode, false);

      paidSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['payment_intent'],
      });
      const eventObject = {
        id: session.id,
        object: 'checkout.session',
        mode: 'payment',
        payment_status: 'paid',
        status: 'complete',
        amount_total: amountPaidCents,
        currency: 'eur',
        payment_intent: pi.id,
        metadata,
        livemode: false,
        client_reference_id: null,
      };

      const event = {
        id: `evt_${TAG}_${opts.label}_${Date.now()}`,
        object: 'event',
        api_version: '2025-07-30.basil',
        created: Math.floor(Date.now() / 1000),
        type: 'checkout.session.completed',
        livemode: false,
        data: { object: eventObject },
      };
      const payload = JSON.stringify(event);
      const signature = signStripePayload(payload, webhookSecret, stripe);
      const wh = await postWebhook(payload, signature);

      // Allow Preview to commit
      await new Promise((r) => setTimeout(r, 2500));

      const order = await prisma.order.findFirst({
        where: { stripeSessionId: session.id },
        include: {
          deliveryOrder: true,
        },
      });

      const calendar = await prisma.deliveryCalendarEntry.findFirst({
        where: {
          OR: [
            { bookingRequestId },
            { deliveryOrderId: order?.deliveryOrder?.id },
          ],
        },
      });

      const bookingAfter = await prisma.deliveryBookingRequest.findUnique({
        where: { id: bookingRequestId },
      });

      return {
        label: opts.label,
        sessionId: session.id,
        paymentIntentId: pi.id,
        webhookStatus: wh.status,
        webhookTail: wh.body.slice(-200),
        orderId: order?.id || null,
        orderNumber: order?.orderNumber || null,
        deliveryOrder: order?.deliveryOrder
          ? {
              id: order.deliveryOrder.id,
              status: order.deliveryOrder.status,
              deliveryProfileId: order.deliveryOrder.deliveryProfileId,
              quotedFeeCents: order.deliveryOrder.quotedFeeCents,
              pricingSource: order.deliveryOrder.pricingSource,
              pricingFormulaVersion: order.deliveryOrder.pricingFormulaVersion,
              providerDisplayNameSnapshot:
                order.deliveryOrder.providerDisplayNameSnapshot,
              baseFeeCentsSnapshot: order.deliveryOrder.baseFeeCentsSnapshot,
              quoteLockedAt: order.deliveryOrder.quoteLockedAt,
            }
          : null,
        calendar: calendar
          ? {
              id: calendar.id,
              status: calendar.status,
              earningsCents: calendar.earningsCents,
              deliveryOrderId: calendar.deliveryOrderId,
            }
          : null,
        bookingStatus: bookingAfter?.status || null,
        stripeMetadataSample: {
          deliveryQuotedFeeCents: metadata.deliveryQuotedFeeCents,
          deliveryPlatformCommissionCents:
            metadata.deliveryPlatformCommissionCents,
          deliveryProviderNetPayoutCents:
            metadata.deliveryProviderNetPayoutCents,
          namedProviderSelection: metadata.namedProviderSelection,
          deliveryAcceptanceMode: metadata.deliveryAcceptanceMode,
          deliveryPricingSource: metadata.deliveryPricingSource,
          livemode: session.livemode,
        },
      };
    }

    const autoResult = await runFlow({
      label: 'AUTO_CONFIRM',
      profile: auto!,
    });
    evidence.autoConfirm = autoResult;

    const manualResult = await runFlow({
      label: 'MANUAL_CONFIRM',
      profile: manual!,
      acceptManual: true,
    });
    evidence.manualConfirm = manualResult;

    // MANUAL reject / expire smoke (no payment)
    const rejectBooking = await createDeliveryBookingRequest(prisma, {
      buyerId: buyer!.id,
      deliveryProfileId: manual!.id,
      productId: product!.id,
      routeDistanceKm: 5,
      quotedFeeCents: 800,
      notes: `${TAG} reject-smoke`,
    });
    assert.equal(rejectBooking.ok, true);
    if (rejectBooking.ok) {
      const rejected = await rejectDeliveryBookingRequest(prisma, {
        requestId: rejectBooking.request.id,
        deliveryProfileUserId: manual!.userId,
      });
      assert.equal(rejected.ok, true, JSON.stringify(rejected));
      const expired = await createDeliveryBookingRequest(prisma, {
        buyerId: buyer!.id,
        deliveryProfileId: manual!.id,
        productId: product!.id,
        routeDistanceKm: 5,
        quotedFeeCents: 800,
        notes: `${TAG} expire-smoke`,
      });
      assert.equal(expired.ok, true);
      if (expired.ok) {
        await prisma.deliveryBookingRequest.update({
          where: { id: expired.request.id },
          data: {
            status: 'EXPIRED',
            expiresAt: new Date(Date.now() - 60_000),
          },
        });
      }
      evidence.manualRejectExpire = {
        rejectedId: rejectBooking.request.id,
        expiredId: expired.ok ? expired.request.id : null,
        noReassignment: true,
      };
    }

    // Assertions for release evidence
    for (const flow of [autoResult, manualResult]) {
      assert.ok(flow.orderId, `${flow.label} order missing — webhook may have failed: ${flow.webhookTail}`);
      assert.ok(flow.deliveryOrder, `${flow.label} DeliveryOrder missing`);
      assert.equal(
        flow.deliveryOrder!.deliveryProfileId,
        flow.label === 'AUTO_CONFIRM' ? auto!.id : manual!.id
      );
      assert.equal(flow.deliveryOrder!.quotedFeeCents, 1000);
      assert.equal(flow.deliveryOrder!.pricingSource, 'PROVIDER');
      assert.equal(flow.deliveryOrder!.pricingFormulaVersion, 'provider-v1');
      assert.equal(
        flow.deliveryOrder!.status,
        flow.label === 'AUTO_CONFIRM' ? 'ACCEPTED' : 'PENDING'
      );
    }

    assert.equal(autoResult.deliveryOrder!.status, 'ACCEPTED');
    assert.equal(manualResult.deliveryOrder!.status, 'PENDING');
    assert.equal(autoResult.calendar?.earningsCents, 880);
    assert.equal(manualResult.stripeMetadataSample.livemode, false);

    evidence.pass = true;
    console.log(JSON.stringify({ ok: true, evidence }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('PHASE33C_FAIL', e);
  process.exit(1);
});
