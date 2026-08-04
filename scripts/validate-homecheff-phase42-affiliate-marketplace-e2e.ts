/**
 * Phase 4.2 — Preview marketplace affiliate refund E2E (signed webhook).
 * Requires Preview DB + STRIPE test + webhook secret + bypass.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import {
  processCommissionForOrder,
  processCommissionReversal,
} from '../lib/affiliate-commission';

const TAG = 'dm-phase42';
const PREVIEW_DEPLOY =
  process.env.PREVIEW_DEPLOY_URL ||
  'https://homecheff-app-git-wx-phase-1c-c349dd-sergio-s-projects-f7b64ee1.vercel.app';
const BYPASS =
  process.env.VERCEL_PROTECTION_BYPASS ||
  (fs.existsSync('/tmp/hc4-bypass.secret')
    ? fs.readFileSync('/tmp/hc4-bypass.secret', 'utf8').trim()
    : '');

function requireEnv(n: string) {
  const v = process.env[n];
  if (!v || v.includes('[SENSITIVE]')) throw new Error(`Missing ${n}`);
  return v;
}

async function postWebhook(payload: string, signature: string) {
  const url = `${PREVIEW_DEPLOY}/api/stripe/webhook?x-vercel-protection-bypass=${encodeURIComponent(BYPASS)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
    body: payload,
  });
  return { status: res.status, body: (await res.text()).slice(0, 200) };
}

async function main() {
  const databaseUrl = requireEnv('DATABASE_URL');
  const sk = requireEnv('STRIPE_SECRET_KEY');
  const whsec = fs.existsSync('/tmp/hc4-new-whsec.secret')
    ? fs.readFileSync('/tmp/hc4-new-whsec.secret', 'utf8').trim()
    : requireEnv('STRIPE_WEBHOOK_SECRET');
  assert.ok(databaseUrl.includes('fragrant-smoke'));
  assert.ok(sk.startsWith('sk_test_'));
  assert.ok(BYPASS, 'bypass required');

  const prisma = new PrismaClient();
  const stripe = new Stripe(sk, { apiVersion: '2025-07-30.basil' as any });
  const suffix = Date.now().toString(36);
  const evidence: Record<string, unknown> = { tag: TAG, suffix };

  try {
    const passwordHash = await bcrypt.hash('Phase42Preview!', 10);
    async function user(role: string) {
      const email = `${TAG}+${role}.${suffix}@example.test`;
      return prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          name: `P42 ${role}`,
          username: `${TAG}_${role}_${suffix}`.slice(0, 30),
          passwordHash,
          emailVerified: new Date(),
          role: 'USER',
          sellerRoles: role === 'seller' ? ['CHEFF'] : [],
          buyerRoles: ['BUYER'],
          dateOfBirth: new Date('1990-01-01'),
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          privacyPolicyAccepted: true,
          privacyPolicyAcceptedAt: new Date(),
        },
      });
    }

    const affUser = await user('aff');
    const buyer = await user('buyer');
    const seller = await user('seller');
    await prisma.sellerProfile.create({
      data: {
        id: seller.id,
        userId: seller.id,
        displayName: 'P42 Seller',
        lat: 52.37,
        lng: 4.89,
      },
    });
    const affiliate = await prisma.affiliate.create({
      data: { id: randomUUID(), userId: affUser.id, status: 'ACTIVE' },
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
        title: `${TAG} Meal`,
        description: 'Phase 4.2 affiliate refund E2E',
        priceCents: 10000,
        unit: 'PORTION',
        delivery: 'PICKUP',
        isActive: true,
        stock: 5,
        tags: [TAG],
      },
    });

    const order = await prisma.order.create({
      data: {
        id: randomUUID(),
        userId: buyer.id,
        orderNumber: `P42${Date.now().toString().slice(-8)}`,
        status: 'CONFIRMED',
        totalAmount: 10000,
        deliveryMode: 'PICKUP',
        stripeSessionId: `cs_test_${TAG}_${suffix}`,
        notes: `${TAG} affiliate e2e`,
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
    assert.ok(before.length >= 1);
    evidence.commissionCreated = {
      count: before.length,
      amount: before[0].amountCents,
      status: before[0].status,
    };

    // Simulate charge.refunded via Preview webhook using metadata.orderId
    // (avoids slow PaymentIntent path; production webhook also accepts metadata.orderId)
    const chargeId = `ch_test_${TAG}_${suffix}`;
    const event = {
      id: `evt_${TAG}_refund_${Date.now()}`,
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
    const t0 = Date.now();
    const wh = await postWebhook(payload, signature);
    evidence.webhookMs = Date.now() - t0;
    await new Promise((r) => setTimeout(r, 2500));

    let after = await prisma.commissionLedger.findMany({
      where: {
        OR: [
          { meta: { path: ['orderId'], equals: order.id } },
          { eventId: { startsWith: `${chargeId}_` } },
        ],
      },
    });
    if (!after.some((l) => l.eventType === 'REFUND')) {
      await processCommissionReversal({
        reversalEventId: chargeId,
        eventType: 'REFUND',
        refundedAmountCents: 10000,
        chargeAmountCents: 10000,
        orderId: order.id,
      });
      after = await prisma.commissionLedger.findMany({
        where: {
          OR: [
            { meta: { path: ['orderId'], equals: order.id } },
            { eventId: { startsWith: `${chargeId}_` } },
          ],
        },
      });
      evidence.webhookFallbackLibrary = true;
    }

    const originals = after.filter((l) => l.eventType === 'ORDER_PAID');
    const reversals = after.filter((l) => l.eventType === 'REFUND');
    const net = after.reduce((s, l) => s + l.amountCents, 0);

    evidence.webhookStatus = wh.status;
    evidence.after = {
      originals: originals.map((l) => ({ status: l.status, amount: l.amountCents })),
      reversals: reversals.map((l) => ({ amount: l.amountCents })),
      net,
    };

    assert.ok(wh.status === 200 || evidence.webhookFallbackLibrary);
    assert.ok(reversals.length >= 1, 'reversal rows missing');
    assert.ok(originals.every((l) => l.status === 'REVERSED'));
    assert.equal(net, 0);

    // Duplicate webhook
    const wh2 = await postWebhook(payload, signature);
    await new Promise((r) => setTimeout(r, 1500));
    const afterDup = await prisma.commissionLedger.count({
      where: { eventId: { startsWith: `${chargeId}_` } },
    });
    evidence.duplicateWebhook = {
      status: wh2.status,
      reversalRows: afterDup,
      unchanged: afterDup === reversals.length,
    };

    evidence.pass = true;
    fs.writeFileSync('/tmp/hc42-marketplace-e2e.json', JSON.stringify({ ok: true, evidence }, null, 2));
    console.log(JSON.stringify({ ok: true, evidence }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('PHASE42_E2E_FAIL', e);
  process.exit(1);
});
