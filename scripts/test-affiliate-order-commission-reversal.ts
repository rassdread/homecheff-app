/**
 * Phase 4.2 — Affiliate order commission reversal regression (Preview-safe).
 * Run: npx tsx scripts/test-affiliate-order-commission-reversal.ts
 *
 * Uses Preview DATABASE_URL when provided. Does not touch Stripe live mode.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient, CommissionLedgerEventType, CommissionLedgerStatus } from '@prisma/client';
import {
  processCommissionForOrder,
  processCommissionReversal,
} from '../lib/affiliate-commission';

function assertPreviewDb(url: string | undefined) {
  if (!url) throw new Error('DATABASE_URL required');
  if (url.includes('summer-darkness')) throw new Error('Refusing Production DB');
}

async function main() {
  assertPreviewDb(process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  const tag = `aff-rev-${Date.now().toString(36)}`;

  try {
    const affiliateUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        email: `${tag}+aff@example.test`,
        name: 'Aff Reversal',
        username: `affrev_${tag}`.slice(0, 30),
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
        name: 'Buyer',
        username: `affbuy_${tag}`.slice(0, 30),
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
        name: 'Seller',
        username: `affsel_${tag}`.slice(0, 30),
        role: 'USER',
        sellerRoles: ['CHEFF'],
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
      },
    });

    const affiliate = await prisma.affiliate.create({
      data: {
        id: randomUUID(),
        userId: affiliateUser.id,
        status: 'ACTIVE',
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

    const orderId = randomUUID();
    const productId = randomUUID();
    const eventId = `${orderId}_${productId}`;
    const homecheffFeeCents = 1200; // 12% of 10000

    await processCommissionForOrder(eventId, homecheffFeeCents, buyer.id, seller.id, {
      orderId,
      productId,
      itemTotal: '10000',
      platformFeePercentage: '12',
    });

    const created = await prisma.commissionLedger.findMany({
      where: { eventId: { startsWith: `${orderId}_` } },
    });
    assert.ok(created.length >= 1, 'ORDER_PAID ledger missing');
    assert.equal(created[0].eventType, CommissionLedgerEventType.ORDER_PAID);
    assert.equal(created[0].status, CommissionLedgerStatus.PENDING);
    assert.equal(created[0].amountCents, 300); // 25% of 1200

    // Full refund reversal via orderId (marketplace path)
    const chargeId = `ch_test_${tag}`;
    const r1 = await processCommissionReversal({
      reversalEventId: chargeId,
      eventType: 'REFUND',
      refundedAmountCents: 10000,
      chargeAmountCents: 10000,
      orderId,
    });
    assert.equal(r1.reversedCount, created.length);

    const after = await prisma.commissionLedger.findMany({
      where: {
        OR: [
          { eventId: { startsWith: `${orderId}_` } },
          { eventId: { startsWith: `${chargeId}_` } },
        ],
      },
    });
    const originals = after.filter((l) => l.eventType === CommissionLedgerEventType.ORDER_PAID);
    const reversals = after.filter((l) => l.eventType === CommissionLedgerEventType.REFUND);
    assert.ok(originals.every((l) => l.status === CommissionLedgerStatus.REVERSED));
    assert.ok(reversals.length >= 1);
    assert.ok(reversals.every((l) => l.amountCents < 0));
    const net = after.reduce((s, l) => s + l.amountCents, 0);
    assert.equal(net, 0, 'ledger must net to zero after full refund');

    // Idempotent replay
    const r2 = await processCommissionReversal({
      reversalEventId: chargeId,
      eventType: 'REFUND',
      refundedAmountCents: 10000,
      chargeAmountCents: 10000,
      orderId,
    });
    assert.equal(r2.reversedCount, created.length);
    const afterReplay = await prisma.commissionLedger.count({
      where: { eventId: { startsWith: `${chargeId}_` } },
    });
    assert.equal(afterReplay, reversals.length, 'no duplicate reversal rows');

    // Invoice path still works (subscription-style eventId)
    const invoiceId = `in_test_${tag}`;
    await prisma.commissionLedger.create({
      data: {
        eventId: invoiceId,
        eventType: CommissionLedgerEventType.INVOICE_PAID,
        affiliateId: affiliate.id,
        amountCents: 1950,
        currency: 'eur',
        status: CommissionLedgerStatus.PENDING,
        availableAt: new Date(Date.now() + 14 * 86400000),
        meta: { baseAmountCents: 3900, invoiceId },
      },
    });
    const r3 = await processCommissionReversal({
      reversalEventId: `ch_inv_${tag}`,
      eventType: 'REFUND',
      refundedAmountCents: 3900,
      chargeAmountCents: 3900,
      invoiceId,
    });
    assert.equal(r3.reversedCount, 1);

    // Partial refund proportion
    const orderId2 = randomUUID();
    const productId2 = randomUUID();
    const eventId2 = `${orderId2}_${productId2}`;
    await processCommissionForOrder(eventId2, 1200, buyer.id, seller.id, {
      orderId: orderId2,
      productId: productId2,
    });
    const r4 = await processCommissionReversal({
      reversalEventId: `ch_partial_${tag}`,
      eventType: 'REFUND',
      refundedAmountCents: 5000,
      chargeAmountCents: 10000,
      orderId: orderId2,
    });
    assert.ok(r4.reversedCount >= 1);
    const partialRev = await prisma.commissionLedger.findFirst({
      where: {
        eventId: { startsWith: `ch_partial_${tag}_` },
        eventType: CommissionLedgerEventType.REFUND,
      },
    });
    assert.equal(partialRev?.amountCents, -150); // 50% of 300

    console.log(
      JSON.stringify({
        ok: true,
        fullRefundNetZero: true,
        idempotent: true,
        invoicePath: true,
        partialProportion: partialRev?.amountCents,
      })
    );
  } finally {
    // Cleanup synthetic rows (best-effort)
    try {
      await prisma.commissionLedger.deleteMany({
        where: {
          OR: [
            { eventId: { contains: tag } },
            { meta: { path: ['orderId'], string_contains: tag } },
          ],
        },
      });
    } catch {
      /* ignore */
    }
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('AFFILIATE_REVERSAL_TEST_FAIL', e);
  process.exit(1);
});
