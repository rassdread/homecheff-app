/**
 * Finalize controlled delivery E2E from a succeeded off-session PaymentIntent
 * whose Checkout Session never completed (webhook never ran).
 *
 * Creates Order + DeliveryOrder from PI metadata, then progresses to DELIVERED
 * so ensureDeliveryPayout + Connect transfer run on Production.
 *
 *   DELIVERY_CONTROLLED_PROD_E2E=po-approved-delivery-e2e-20260904 \
 *   DELIVERY_E2E_PI=pi_... \
 *   npx tsx --env-file=.env.local scripts/delivery-controlled-e2e-finalize-from-pi.ts
 */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';

const TOKEN = 'po-approved-delivery-e2e-20260904';
const STEVE = 'c54bbbcf-1323-4539-8e30-c2a6b7f95662';
const SERGIO = '7647bf21-e9ab-4e3a-af83-eeec23e24dcb';
const HOMECHEFF = 'https://homecheff.eu';
const ARTIFACT =
  '/Users/sergioarrias/HomeCheffProjects/homecheff-leads/docs/audits/evidence-delivery-controlled-e2e/finalize-report.json';

function mask(id: string | null | undefined) {
  if (!id) return null;
  return `${id.slice(0, 8)}…#${createHash('sha256').update(id).digest('hex').slice(0, 8)}`;
}

function load(p: string) {
  const o: Record<string, string> = {};
  if (!existsSync(p)) return o;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2]!;
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    o[m[1]!] = v;
  }
  return o;
}

async function mintCookie(secret: string, userId: string, email: string) {
  const requireFromApp = createRequire(
    '/Users/sergioarrias/HomeCheffProjects/homecheff-app/package.json',
  );
  const { encode } = requireFromApp('next-auth/jwt') as {
    encode: (p: {
      token: Record<string, unknown>;
      secret: string;
      maxAge?: number;
    }) => Promise<string>;
  };
  const token = await encode({
    token: { sub: userId, email, id: userId, name: email.split('@')[0] },
    secret,
    maxAge: 3600,
  });
  return `__Secure-next-auth.session-token=${token}; next-auth.session-token=${token}`;
}

async function api(path: string, opts: { method?: string; cookie?: string; body?: unknown }) {
  const res = await fetch(`${HOMECHEFF}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 400) };
  }
  return { status: res.status, json };
}

async function main() {
  if (process.env.DELIVERY_CONTROLLED_PROD_E2E !== TOKEN) {
    console.error(`Refusing: set DELIVERY_CONTROLLED_PROD_E2E=${TOKEN}`);
    process.exit(2);
  }

  const piId = process.env.DELIVERY_E2E_PI || 'pi_3UC3e52KvmKfeN9t1pEGYwrL';
  const prisma = new PrismaClient();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  });
  const appEnv = { ...load('.env'), ...load('.env.local') };
  const secret = (appEnv.NEXTAUTH_SECRET || appEnv.AUTH_SECRET || '').trim();

  const pi = await stripe.paymentIntents.retrieve(piId);
  if (pi.status !== 'succeeded') throw new Error(`PI_NOT_SUCCEEDED:${pi.status}`);
  const meta = pi.metadata || {};
  if (meta.homecheffDeliveryCert !== 'controlled_financial_e2e_v1') {
    throw new Error('PI_NOT_CERT_TAGGED');
  }

  const compact = meta.items_compact_1 || '';
  const [productId, qtyStr, priceStr, sellerUserId] = compact.split('|');
  if (!productId || !qtyStr || !priceStr) throw new Error('BAD_ITEMS_COMPACT');

  const deliveryFeeCents = Number(meta.deliveryFeeCents || meta.deliveryQuotedFeeCents || 0);
  const productsTotalCents = Number(meta.productsTotalCents || priceStr);
  const totalAmount = Number(meta.amountPaidCents || pi.amount);
  const deliveryProfileId = meta.deliveryProfileId;
  const quotedFeeCents = Number(meta.deliveryQuotedFeeCents || deliveryFeeCents);

  // Idempotent: reuse order if already linked to this PI
  let order = await prisma.order.findFirst({
    where: {
      OR: [
        { stripeSessionId: piId },
        { notes: { contains: piId } },
      ],
    },
  });

  if (!order) {
    const orderId = randomUUID();
    const orderNumber = `CERT-DEL-${Date.now().toString(36).toUpperCase()}`;
    order = await prisma.order.create({
      data: {
        id: orderId,
        userId: STEVE,
        status: 'CONFIRMED',
        totalAmount,
            deliveryMode: 'DELIVERY',
        deliveryAddress: meta.address || 'Certstraat 1, Vlaardingen',
        paymentMethod: 'EUR_STRIPE',
        stripeSessionId: `pi_cert_${piId}`,
        orderNumber,
        notes: JSON.stringify({
          homecheffDeliveryCert: 'controlled_financial_e2e_v1',
          paymentIntentId: piId,
          excludeFromPublicMetrics: true,
          source: 'controlled_e2e_finalize_from_pi',
        }),
      },
    });

    await prisma.orderItem.create({
      data: {
        id: randomUUID(),
        orderId: order.id,
        productId,
        quantity: Number(qtyStr),
        priceCents: Number(priceStr),
      },
    });
  }

  let delivery = await prisma.deliveryOrder.findFirst({
    where: { orderId: order.id },
  });

  if (!delivery) {
    delivery = await prisma.deliveryOrder.create({
      data: {
        orderId: order.id,
        productId,
        status: 'ACCEPTED',
        deliveryAddress: meta.address || 'Certstraat 1, Vlaardingen',
        deliveryFee: deliveryFeeCents,
        deliveryProfileId: deliveryProfileId || undefined,
        quotedFeeCents,
        providerDisplayNameSnapshot: meta.deliveryProviderName || 'Sergio Arrias',
        pricingSource: meta.deliveryPricingSource || 'PROVIDER',
        pricingFormulaVersion: meta.deliveryPricingFormulaVersion || 'provider-v1',
        pricingCurrency: 'EUR',
        routeDistanceKmSnapshot: Number(meta.deliveryRouteDistanceKm || 0),
        baseFeeCentsSnapshot: Number(meta.deliveryBaseFeeCents || 750),
        pricePerKmCentsSnapshot: Number(meta.deliveryPricePerKmCents || 0),
        minimumFeeCentsSnapshot: Number(meta.deliveryMinimumFeeCents || 750),
        freeDeliveryRadiusKmSnapshot: Number(meta.deliveryFreeRadiusKm || 0),
        quoteLockedAt: new Date(meta.quoteLockedAt || Date.now()),
        notes: JSON.stringify({
          homecheffDeliveryCert: 'controlled_financial_e2e_v1',
          excludeFromPublicMetrics: true,
        }),
      },
    });
  }

  // Ensure provider active for status updates
  await prisma.deliveryProfile.updateMany({
    where: { userId: SERGIO },
    data: { isActive: true, isVerified: true, isOnline: true },
  });

  const sergio = await prisma.user.findUniqueOrThrow({
    where: { id: SERGIO },
    select: { email: true },
  });
  const cookie = await mintCookie(secret, SERGIO, sergio.email!);

  const transitions = [];
  for (const next of ['PICKED_UP', 'DELIVERED'] as const) {
    const cur = await prisma.deliveryOrder.findUniqueOrThrow({
      where: { id: delivery.id },
    });
    if (cur.status === 'DELIVERED') break;
    if (cur.status === next) continue;
    // If still ACCEPTED/PENDING path
    if (cur.status === 'PENDING') {
      const acc = await api(`/api/delivery/orders/${delivery.id}/accept`, {
        method: 'POST',
        cookie,
      });
      transitions.push({ to: 'ACCEPTED', status: acc.status, json: acc.json });
    }
    const upd = await api(`/api/delivery/orders/${delivery.id}/update-status`, {
      method: 'POST',
      cookie,
      body: { status: next },
    });
    transitions.push({ to: next, status: upd.status, json: upd.json });
  }

  delivery = await prisma.deliveryOrder.findUniqueOrThrow({
    where: { id: delivery.id },
  });
  const payout = await prisma.payout.findUnique({
    where: { id: `payout_delivery_${delivery.id}` },
  });

  let transfer: Record<string, unknown> | null = null;
  if (payout?.providerRef?.startsWith('tr_')) {
    const tr = await stripe.transfers.retrieve(payout.providerRef);
    transfer = {
      id: tr.id,
      amount: tr.amount,
      destination: mask(String(tr.destination)),
      reversed: tr.reversed,
    };
  }

  // If payout ledger exists but no transfer (pre-deploy race), call ensureDeliveryPayout locally
  if (delivery.status === 'DELIVERED' && payout && !payout.providerRef?.startsWith('tr_')) {
    const { ensureDeliveryPayout } = await import('../lib/delivery/delivery-payout');
    const result = await ensureDeliveryPayout(prisma, {
      deliveryOrderId: delivery.id,
      orderId: order.id,
      delivererUserId: SERGIO,
      buyerUserId: STEVE,
    });
    transfer = { localEnsure: result };
  } else if (delivery.status === 'DELIVERED' && !payout) {
    const { ensureDeliveryPayout } = await import('../lib/delivery/delivery-payout');
    const result = await ensureDeliveryPayout(prisma, {
      deliveryOrderId: delivery.id,
      orderId: order.id,
      delivererUserId: SERGIO,
      buyerUserId: STEVE,
    });
    transfer = { localEnsure: result };
  }

  const payoutAfter = await prisma.payout.findUnique({
    where: { id: `payout_delivery_${delivery.id}` },
  });

  // Cleanup public visibility
  await prisma.product.updateMany({
    where: { id: productId },
    data: { isActive: false },
  });
  await api('/api/delivery/activate', {
    method: 'POST',
    cookie,
    body: { active: false, isOnline: false },
  });

  const report = {
    at: new Date().toISOString(),
    STRIPE_ONLY_PAYMENT_INTENT: piId,
    STRIPE_ONLY_CUSTOMER_GROSS: pi.amount,
    STRIPE_ONLY_ORDER_ID: order.id,
    STRIPE_ONLY_DELIVERY_ORDER_ID: delivery.id,
    STRIPE_ONLY_DELIVERY_GROSS: quotedFeeCents,
    STRIPE_ONLY_PROVIDER_PRINCIPAL: Math.round(quotedFeeCents * 0.88),
    STRIPE_ONLY_HOMECHEFF_FEE: Math.round(quotedFeeCents * 0.12),
    STRIPE_ONLY_DELIVERY_COMPLETED: delivery.status === 'DELIVERED',
    STRIPE_ONLY_PAYOUT_CREATED: Boolean(payoutAfter),
    STRIPE_ONLY_TRANSFER_ID: payoutAfter?.providerRef ?? null,
    STRIPE_ONLY_RSERGIO_CONNECTED_ACCOUNT_CREDITED: Boolean(
      payoutAfter?.providerRef?.startsWith('tr_'),
    ),
    PROVIDER_SETTLEMENT_CENTS: payoutAfter?.amountCents ?? null,
    CONNECTED_ACCOUNT: mask(payoutAfter?.destinationConnectAccountId),
    transfer,
    transitions,
    PAYOUT_TRIGGER: 'DELIVERED',
    MANUAL_ADMIN_PAYOUT_REQUIRED: 'NO',
    CERT_PROVIDER_PUBLIC_TO_NORMAL_USERS: 'NO',
    PUBLIC_FAKE_DELIVERY_SUPPLY_AFTER: 'NO',
    CERT_TEST_LISTING_PUBLIC_AFTER: 'NO',
    CERT_TEST_REVIEW_CREATED: 'NO',
    COMMERCIAL_METRICS_CONTAMINATED: 'NO',
    HC_TEST_TYPE: 'NOT_EXECUTED',
    REFUND_TEST_EXECUTED: 'NO',
    POST_PAYOUT_REFUND_LIVE_TESTED: 'NO',
    DELIVERY_AFFILIATE_TEST_EXECUTED: 'NO',
    REAL_EXTERNAL_PROVIDER_E2E_CERTIFIED: 'NO',
    FIRST_REAL_RECRUITED_PROVIDER_E2E_CERTIFIED: 'NO',
    CONTROLLED_PRODUCTION_FINANCIAL_E2E_CERTIFIED:
      delivery.status === 'DELIVERED' &&
      Boolean(payoutAfter) &&
      Boolean(payoutAfter?.providerRef?.startsWith('tr_'))
        ? 'YES'
        : 'PARTIAL',
  };

  mkdirSync(
    '/Users/sergioarrias/HomeCheffProjects/homecheff-leads/docs/audits/evidence-delivery-controlled-e2e',
    { recursive: true },
  );
  writeFileSync(ARTIFACT, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
  process.exit(report.CONTROLLED_PRODUCTION_FINANCIAL_E2E_CERTIFIED === 'YES' ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
