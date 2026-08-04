/**
 * Phase 4.2 — Preview webhook-only affiliate order refund proof (no local fallback).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { processCommissionForOrder } from '../lib/affiliate-commission';

const base =
  process.env.PREVIEW_DEPLOY_URL ||
  'https://homecheff-app-git-wx-phase-1c-c349dd-sergio-s-projects-f7b64ee1.vercel.app';
const bypass =
  process.env.VERCEL_PROTECTION_BYPASS ||
  (fs.existsSync('/tmp/hc4-bypass.secret')
    ? fs.readFileSync('/tmp/hc4-bypass.secret', 'utf8').trim()
    : '');
const whsec = fs.existsSync('/tmp/hc4-new-whsec.secret')
  ? fs.readFileSync('/tmp/hc4-new-whsec.secret', 'utf8').trim()
  : process.env.STRIPE_WEBHOOK_SECRET!;

async function main() {
  assert.ok(process.env.DATABASE_URL?.includes('fragrant-smoke'));
  assert.ok(process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_'));
  assert.ok(bypass && whsec);

  const prisma = new PrismaClient();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-07-30.basil' as any,
  });
  const tag = `whonly-${Date.now().toString(36)}`;

  const affUser = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${tag}+aff@example.test`,
      name: 'WH Aff',
      username: `whaff_${tag}`.slice(0, 30),
      role: 'USER',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
    },
  });
  const buyer = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${tag}+buyer@example.test`,
      name: 'WH Buyer',
      username: `whbuy_${tag}`.slice(0, 30),
      role: 'USER',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
    },
  });
  const seller = await prisma.user.create({
    data: {
      id: randomUUID(),
      email: `${tag}+seller@example.test`,
      name: 'WH Seller',
      username: `whsel_${tag}`.slice(0, 30),
      role: 'USER',
      sellerRoles: ['CHEFF'],
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      privacyPolicyAccepted: true,
      privacyPolicyAcceptedAt: new Date(),
    },
  });
  const affiliate = await prisma.affiliate.create({
    data: { id: randomUUID(), userId: affUser.id, status: 'ACTIVE' },
  });
  await prisma.sellerProfile.create({
    data: {
      id: seller.id,
      userId: seller.id,
      displayName: 'WH Seller',
      lat: 52.37,
      lng: 4.89,
    },
  });
  await prisma.attribution.create({
    data: {
      id: randomUUID(),
      affiliateId: affiliate.id,
      userId: buyer.id,
      type: 'USER_SIGNUP',
      source: 'REF_LINK',
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 365 * 86400000),
    },
  });
  const product = await prisma.product.create({
    data: {
      id: randomUUID(),
      sellerId: seller.id,
      category: 'CHEFF',
      title: `WH ${tag}`,
      description: 'webhook only',
      priceCents: 10000,
      unit: 'PORTION',
      delivery: 'PICKUP',
      isActive: true,
      stock: 5,
      tags: [tag],
    },
  });
  const order = await prisma.order.create({
    data: {
      id: randomUUID(),
      userId: buyer.id,
      orderNumber: `WH${Date.now().toString().slice(-8)}`,
      status: 'CONFIRMED',
      totalAmount: 10000,
      deliveryMode: 'PICKUP',
      notes: tag,
    },
  });

  const eventId = `${order.id}_${product.id}`;
  await processCommissionForOrder(eventId, 1200, buyer.id, seller.id, {
    orderId: order.id,
    productId: product.id,
  });

  const before = await prisma.commissionLedger.findMany({
    where: { meta: { path: ['orderId'], equals: order.id } },
  });
  assert.ok(before.length >= 1, 'commission not created');

  const chargeId = `ch_${tag}`;
  const event = {
    id: `evt_${tag}`,
    object: 'event',
    api_version: '2025-07-30.basil',
    created: Math.floor(Date.now() / 1000),
    type: 'charge.refunded',
    livemode: false,
    data: {
      object: {
        id: chargeId,
        object: 'charge',
        amount: 10000,
        amount_refunded: 10000,
        currency: 'eur',
        paid: true,
        refunded: true,
        payment_intent: null,
        invoice: null,
        metadata: { orderId: order.id },
        livemode: false,
      },
    },
  };
  const payload = JSON.stringify(event);
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: whsec,
  });
  const url = `${base}/api/stripe/webhook?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
      'x-vercel-protection-bypass': bypass,
    },
    body: payload,
  });
  const body = (await res.text()).slice(0, 300);
  const webhookMs = Date.now() - t0;
  await new Promise((r) => setTimeout(r, 5000));

  const after = await prisma.commissionLedger.findMany({
    where: {
      OR: [
        { meta: { path: ['orderId'], equals: order.id } },
        { eventId: { startsWith: `${chargeId}_` } },
      ],
    },
  });
  const evidence = {
    deploy: base,
    status: res.status,
    body,
    webhookMs,
    before: before.map((l) => ({
      t: l.eventType,
      s: l.status,
      a: l.amountCents,
    })),
    after: after.map((l) => ({
      t: l.eventType,
      s: l.status,
      a: l.amountCents,
      e: l.eventId.slice(0, 48),
    })),
    net: after.reduce((s, l) => s + l.amountCents, 0),
    refundRows: after.filter((l) => l.eventType === 'REFUND').length,
    webhookOnlyPass:
      res.status === 200 &&
      after.some((l) => l.eventType === 'REFUND') &&
      after
        .filter((l) => l.eventType === 'ORDER_PAID')
        .every((l) => l.status === 'REVERSED'),
  };
  fs.mkdirSync('docs/audits/wx-phase42-final-readiness', { recursive: true });
  fs.writeFileSync(
    'docs/audits/wx-phase42-final-readiness/webhook-only-reversal.json',
    JSON.stringify(evidence, null, 2)
  );
  console.log(JSON.stringify(evidence, null, 2));
  assert.equal(evidence.webhookOnlyPass, true);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
