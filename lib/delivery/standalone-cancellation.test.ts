import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { DELIVERY_AGREEMENT_DOCUMENT_ID, deliveryAgreementAcceptanceData } from '@/lib/delivery/delivery-agreement';
import { applyStandalonePaidCancellation } from '@/lib/delivery/standalone-cancellation';
import { parseAndValidateDeliverySignupFields } from '@/lib/delivery/delivery-signup-validation';

const databaseUrl = process.env.DATABASE_URL || '';
const local = databaseUrl.includes('127.0.0.1:5432/hc_v6_mkt') && !databaseUrl.includes('neon');
const prisma = new PrismaClient();
const buyerId = 'cc92ba55-10bc-4af0-9e50-d0e4b3f12bfa';
const courierUser = '47e976a6-8864-4e62-a741-8a2a82126178';

async function paidJob(label: string, status: 'PENDING' | 'PICKED_UP') {
  const profile = await prisma.deliveryProfile.findUnique({ where: { userId: courierUser } });
  assert.ok(profile);
  const order = await prisma.deliveryOrder.create({
    data: {
      origin: 'STANDALONE',
      requesterUserId: buyerId,
      deliveryProfileId: profile.id,
      status,
      deliveryFee: 510,
      quotedFeeCents: 510,
      deliveryAddress: 'Teststraat 12',
      pickupAddress: 'Koerierstraat 4',
      itemDescription: label,
      pricingSource: 'PROVIDER',
      pricingCurrency: 'EUR',
    },
  });
  await prisma.standaloneDeliveryRequest.create({
    data: {
      id: order.id,
      requesterUserId: buyerId,
      pickupAddress: 'Koerierstraat 4',
      deliveryAddress: 'Teststraat 12',
      pickupLat: 52.09,
      pickupLng: 5.12,
      dropoffLat: 52.07,
      dropoffLng: 5.12,
      itemDescription: label,
      deliveryProfileId: profile.id,
      providerDisplayName: 'Iso Courier',
      quotedFeeCents: 510,
      stripeFeeCents: 33,
      buyerTotalCents: 543,
      routeDistanceKm: 2,
      baseFeeCents: 200,
      pricePerKmCents: 50,
      minimumFeeCents: 200,
      platformCommissionCents: 61,
      providerNetPayoutCents: 449,
      quoteExpiresAt: new Date(Date.now() + 60_000),
      paymentStatus: 'PAID',
      status: 'PAID',
      deliveryOrderId: order.id,
    },
  });
  await prisma.transaction.create({
    data: {
      id: `txn_delivery_${order.id}`,
      buyerId,
      sellerId: courierUser,
      amountCents: 510,
      platformFeeBps: 1200,
      status: 'CAPTURED',
      provider: 'STRIPE',
      providerRef: `cs_test_cancel_${order.id}`,
      updatedAt: new Date(),
    },
  });
  await prisma.payout.create({
    data: {
      id: `payout_delivery_${order.id}`,
      transactionId: `txn_delivery_${order.id}`,
      toUserId: courierUser,
      amountCents: 449,
      providerRef: `pi_test_${order.id.slice(0, 8)}`,
    },
  });
  await prisma.deliveryProfile.update({
    where: { id: profile.id },
    data: { totalEarnings: { increment: 449 } },
  });
  return { order, profileId: profile.id };
}

test('paid cancellation reviews the charge and claws back unearned courier ledger', { skip: !local }, async () => {
  const before = await prisma.deliveryProfile.findUnique({ where: { userId: courierUser }, select: { totalEarnings: true } });
  const pending = await paidJob('cancel-before', 'PENDING');
  const picked = await paidJob('cancel-after-pickup', 'PICKED_UP');
  const customer = await paidJob('customer-before', 'PENDING');
  await prisma.deliveryOrder.update({ where: { id: customer.order.id }, data: { status: 'ACCEPTED' } });
  try {
    const courier = await applyStandalonePaidCancellation(prisma, {
      deliveryOrderId: pending.order.id,
      previousStatus: 'PENDING',
      actorUserId: courierUser,
      actor: 'COURIER',
    });
    assert.equal(courier.ok, true);
    if (!courier.ok) return;
    assert.equal(courier.view.status, 'REVIEW_REQUIRED');
    assert.equal(courier.view.stripeRefundId, null);
    assert.equal(courier.view.ledgerAdjusted, true);
    const refunds = await prisma.refund.findMany({ where: { id: `refund_delivery_ledger_${pending.order.id}` } });
    assert.equal(refunds.length, 1);
    assert.equal(refunds[0]?.amountCents, 449);
    assert.equal(refunds[0]?.providerRef, 'ledger_clawback');
    assert.equal(String(refunds[0]?.providerRef).startsWith('tr_'), false);

    const again = await applyStandalonePaidCancellation(prisma, {
      deliveryOrderId: pending.order.id,
      previousStatus: 'CANCELLED',
      actorUserId: courierUser,
      actor: 'COURIER',
    });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.view.duplicate, true);
    assert.equal(await prisma.refund.count({ where: { id: `refund_delivery_ledger_${pending.order.id}` } }), 1);

    const stranger = await applyStandalonePaidCancellation(prisma, {
      deliveryOrderId: picked.order.id,
      previousStatus: 'PICKED_UP',
      actorUserId: buyerId,
      actor: 'COURIER',
    });
    assert.equal(stranger.ok, false);

    const afterPickup = await applyStandalonePaidCancellation(prisma, {
      deliveryOrderId: picked.order.id,
      previousStatus: 'PICKED_UP',
      actorUserId: buyerId,
      actor: 'REQUESTER',
    });
    assert.equal(afterPickup.ok, true);
    if (!afterPickup.ok) return;
    assert.equal(afterPickup.view.ledgerAdjusted, false);
    assert.equal(afterPickup.view.stripeRefundId, null);
    assert.equal(await prisma.refund.count({ where: { transactionId: `txn_delivery_${picked.order.id}` } }), 0);

    const otherBuyer = await applyStandalonePaidCancellation(prisma, {
      deliveryOrderId: customer.order.id,
      previousStatus: 'ACCEPTED',
      actorUserId: '5087cfb3-8c7d-4ef8-8423-95a7058cbf2e',
      actor: 'REQUESTER',
    });
    assert.equal(otherBuyer.ok, false);
    if (!otherBuyer.ok) assert.equal(otherBuyer.status, 403);
    const customerCancel = await applyStandalonePaidCancellation(prisma, {
      deliveryOrderId: customer.order.id,
      previousStatus: 'ACCEPTED',
      actorUserId: buyerId,
      actor: 'REQUESTER',
    });
    assert.equal(customerCancel.ok, true);
    if (!customerCancel.ok) return;
    assert.equal(customerCancel.view.ledgerAdjusted, true);
    assert.equal(customerCancel.view.stripeRefundId, null);
    const customerAgain = await applyStandalonePaidCancellation(prisma, {
      deliveryOrderId: customer.order.id,
      previousStatus: 'CANCELLED',
      actorUserId: buyerId,
      actor: 'REQUESTER',
    });
    assert.equal(customerAgain.ok, true);
    if (!customerAgain.ok) return;
    assert.equal(customerAgain.view.duplicate, true);

    const earnings = await prisma.deliveryProfile.findUnique({ where: { userId: courierUser }, select: { totalEarnings: true } });
    assert.equal(earnings?.totalEarnings, (before?.totalEarnings ?? 0) + 449);

    const missing = parseAndValidateDeliverySignupFields(
      { acceptDeliveryAgreement: false, transportation: ['BIKE'], age: 30, name: 'A', email: 'a@example.com', password: 'secret12', username: 'abc' },
      { requireAccountFields: true },
    );
    assert.equal(missing.ok, false);

    const user = await prisma.user.create({
      data: {
        email: `iso-agree-${Date.now()}@example.com`,
        username: `isoagree${Date.now()}`,
        name: 'Agree',
        role: 'DELIVERY',
        passwordHash: 'not-used',
      },
    });
    const bare = await prisma.deliveryProfile.create({
      data: { userId: user.id, age: 30, transportation: ['BIKE'] },
    });
    assert.equal(bare.deliveryAgreementAcceptedAt, null);
    const firstAt = new Date('2026-10-18T00:00:00.000Z');
    await prisma.deliveryProfile.update({ where: { id: bare.id }, data: deliveryAgreementAcceptanceData(firstAt) });
    const saved = await prisma.deliveryProfile.findUnique({ where: { id: bare.id } });
    assert.equal(saved?.deliveryAgreementDocumentId, DELIVERY_AGREEMENT_DOCUMENT_ID);
    assert.equal(saved?.deliveryAgreementAcceptedAt?.toISOString(), firstAt.toISOString());
    await prisma.deliveryProfile.update({
      where: { id: bare.id },
      data: saved?.deliveryAgreementAcceptedAt ? {} : deliveryAgreementAcceptanceData(new Date()),
    });
    const kept = await prisma.deliveryProfile.findUnique({ where: { id: bare.id } });
    assert.equal(kept?.deliveryAgreementAcceptedAt?.toISOString(), firstAt.toISOString());
    await prisma.deliveryProfile.delete({ where: { id: bare.id } });
    await prisma.user.delete({ where: { id: user.id } });
  } finally {
    for (const id of [pending.order.id, picked.order.id, customer.order.id]) {
      await prisma.refund.deleteMany({ where: { id: `refund_delivery_ledger_${id}` } });
      await prisma.payout.deleteMany({ where: { id: `payout_delivery_${id}` } });
      await prisma.transaction.deleteMany({ where: { id: `txn_delivery_${id}` } });
      await prisma.standaloneDeliveryRequest.deleteMany({ where: { id } });
      await prisma.deliveryOrder.deleteMany({ where: { id } });
    }
    if (before) {
      await prisma.deliveryProfile.update({ where: { userId: courierUser }, data: { totalEarnings: before.totalEarnings } });
    }
    await prisma.$disconnect();
  }
});
