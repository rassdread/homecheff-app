import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { syncCourierEarningsCounter } from '@/lib/delivery/courier-earnings-counter';

const databaseUrl = process.env.DATABASE_URL || '';
const proof = databaseUrl.includes('127.0.0.1:5432/hc_rel_proof') && !databaseUrl.includes('neon');
const prisma = new PrismaClient();
const stamp = `orphan${Date.now()}`;

after(async () => {
  await prisma.$disconnect();
});

test('a confirmed transfer without a delivery order stays in the counter', { skip: !proof }, async () => {
  const buyer = await prisma.user.create({
    data: {
      email: `${stamp}-buyer@example.com`,
      username: `${stamp}buyer`,
      name: 'Proof Buyer',
      passwordHash: 'not-used',
    },
  });
  const courier = await prisma.user.create({
    data: {
      email: `${stamp}-courier@example.com`,
      username: `${stamp}courier`,
      name: 'Proof Courier',
      passwordHash: 'not-used',
    },
  });
  const profile = await prisma.deliveryProfile.create({
    data: {
      userId: courier.id,
      age: 36,
      transportation: ['BIKE'],
      totalEarnings: 1980,
    },
  });
  const delivered = await prisma.deliveryOrder.create({
    data: {
      origin: 'STANDALONE',
      requesterUserId: buyer.id,
      deliveryProfileId: profile.id,
      status: 'DELIVERED',
      deliveryFee: 1500,
      deliveredAt: new Date('2026-09-04T12:00:00.000Z'),
    },
  });
  const missingId = `${stamp}missing`;
  await prisma.transaction.createMany({
    data: [
      {
        id: `txn_delivery_${delivered.id}`,
        buyerId: buyer.id,
        sellerId: courier.id,
        amountCents: 1500,
        status: 'CAPTURED',
        updatedAt: new Date(),
      },
      {
        id: `txn_delivery_${missingId}`,
        buyerId: buyer.id,
        sellerId: courier.id,
        amountCents: 750,
        status: 'CAPTURED',
        updatedAt: new Date('2026-09-04T12:00:00.000Z'),
      },
    ],
  });
  await prisma.payout.createMany({
    data: [
      {
        id: `payout_delivery_${delivered.id}`,
        transactionId: `txn_delivery_${delivered.id}`,
        toUserId: courier.id,
        amountCents: 1320,
        providerRef: 'tr_proof_delivered',
      },
      {
        id: `payout_delivery_${missingId}`,
        transactionId: `txn_delivery_${missingId}`,
        toUserId: courier.id,
        amountCents: 660,
        providerRef: 'tr_proof_existing',
      },
    ],
  });

  try {
    const payoutsBefore = await prisma.payout.count({ where: { toUserId: courier.id } });
    const first = await syncCourierEarningsCounter(prisma, courier.id);
    const stored = await prisma.deliveryProfile.findUnique({ where: { id: profile.id } });
    const second = await syncCourierEarningsCounter(prisma, courier.id);
    const payouts = await prisma.payout.findMany({
      where: { toUserId: courier.id },
      select: { id: true, amountCents: true, providerRef: true },
    });

    assert.equal(first.earnedCents, 1320);
    assert.equal(first.unresolvedTransferCents, 660);
    assert.equal(first.reviewRequired, true);
    assert.equal(first.changed, false);
    assert.equal(stored?.totalEarnings, 1980);
    assert.equal(second.keptCents, 1980);
    assert.equal(second.changed, false);
    assert.equal(payoutsBefore, 2);
    assert.equal(payouts.length, 2);
    assert.equal(payouts.filter((row) => (row.providerRef || '').startsWith('tr_')).length, 2);
    assert.equal(payouts.some((row) => row.amountCents < 0), false);
    assert.equal(payouts.filter((row) => row.amountCents === 660).length, 1);
  } finally {
    await prisma.payout.deleteMany({ where: { toUserId: courier.id } });
    await prisma.transaction.deleteMany({ where: { sellerId: courier.id } });
    await prisma.deliveryOrder.deleteMany({ where: { deliveryProfileId: profile.id } });
    await prisma.deliveryProfile.delete({ where: { id: profile.id } });
    await prisma.user.deleteMany({ where: { id: { in: [buyer.id, courier.id] } } });
  }
});
