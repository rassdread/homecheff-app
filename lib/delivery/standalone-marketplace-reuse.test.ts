import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { bookStandaloneCourier, createStandaloneQuote } from '@/lib/delivery/standalone-delivery';
import { acceptDeliveryBookingRequest, rejectDeliveryBookingRequest } from '@/lib/delivery/booking-request-service';
import { DELIVERY_MARKET_TIMEZONE, weekdayNlInTimeZone, zonedLocalToUtc } from '@/lib/delivery/delivery-time-availability';

const databaseUrl = process.env.DATABASE_URL || '';
const local = databaseUrl.includes('127.0.0.1:5432/hc_v6_mkt') && !databaseUrl.includes('neon');
const prisma = new PrismaClient();
const buyerId = 'cc92ba55-10bc-4af0-9e50-d0e4b3f12bfa';
const courierAUser = '47e976a6-8864-4e62-a741-8a2a82126178';
const route = {
  pickupAddress: 'Koerierstraat 4, 3511 CD Utrecht',
  deliveryAddress: 'Teststraat 12, 3511 AB Utrecht',
  itemDescription: 'Synthetische testdoos, geen product',
  pickupLat: 52.0907,
  pickupLng: 5.1216,
  dropoffLat: 52.073,
  dropoffLng: 5.1216,
};

function tomorrowAt(hour: number, minute: number) {
  const probe = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const day = weekdayNlInTimeZone(probe, DELIVERY_MARKET_TIMEZONE);
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: DELIVERY_MARKET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(probe);
  const at = zonedLocalToUtc(
    `${ymd}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
    DELIVERY_MARKET_TIMEZONE,
  );
  return { at: at!, day };
}

test('standalone quote no longer auto-selects the cheapest courier', { skip: !local }, async () => {
  const source = readFileSync(new URL('./standalone-delivery.ts', import.meta.url), 'utf8');
  assert.equal(source.includes('deliveryFeeCents < chosen'), false);

  const courierA = await prisma.deliveryProfile.findUnique({ where: { userId: courierAUser } });
  assert.ok(courierA);
  const courierAUserRow = await prisma.user.findUnique({ where: { id: courierAUser }, select: { dateOfBirth: true } });
  await prisma.user.update({
    where: { id: courierAUser },
    data: { dateOfBirth: new Date('1990-04-04') },
  });
  const original = {
    isOnline: courierA.isOnline,
    onlineUntil: courierA.onlineUntil,
    availableDays: courierA.availableDays,
    availableTimeSlots: courierA.availableTimeSlots,
    workStartTime: courierA.workStartTime,
    workEndTime: courierA.workEndTime,
    acceptanceMode: courierA.acceptanceMode,
    baseFeeCents: courierA.baseFeeCents,
    pricePerKmCents: courierA.pricePerKmCents,
    minimumFeeCents: courierA.minimumFeeCents,
    pricingEnabled: courierA.pricingEnabled,
    temporaryOffline: courierA.temporaryOffline,
  };
  const bUser = await prisma.user.create({
    data: {
      email: `iso-courier-b-${Date.now()}@example.com`,
      username: `isocourierb${Date.now()}`,
      name: 'Iso Koerier B',
      role: 'DELIVERY',
      passwordHash: 'not-used',
      dateOfBirth: new Date('1992-06-06'),
    },
  });
  const bProfile = await prisma.deliveryProfile.create({
    data: {
      userId: bUser.id,
      age: 30,
      isActive: true,
      isVerified: true,
      isBlocked: false,
      isOnline: true,
      onlineUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
      transportation: ['BIKE'],
      maxDistance: 25,
      pricingEnabled: true,
      baseFeeCents: 1500,
      pricePerKmCents: 100,
      minimumFeeCents: 1500,
      acceptanceMode: 'MANUAL_CONFIRM',
      availableDays: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'],
      workStartTime: '08:00',
      workEndTime: '20:00',
    },
  });
  await prisma.deliveryProfile.update({
    where: { id: courierA.id },
    data: {
      isOnline: true,
      onlineUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
      availableDays: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'],
      workStartTime: '08:00',
      workEndTime: '20:00',
      acceptanceMode: 'MANUAL_CONFIRM',
      pricingEnabled: true,
      baseFeeCents: 200,
      pricePerKmCents: 50,
      minimumFeeCents: 200,
      temporaryOffline: false,
    },
  });

  try {
    const listed = await createStandaloneQuote({ ...route, requesterUserId: buyerId });
    assert.equal(listed.ok, true);
    if (!listed.ok) return;
    const cheap = listed.couriers.find((c) => c.id === courierA.id);
    const costly = listed.couriers.find((c) => c.id === bProfile.id);
    assert.ok(
      cheap && costly,
      JSON.stringify({
        couriers: listed.couriers.map((c) => c.id),
        unavailable: listed.unavailable,
      }),
    );
    assert.ok(costly.quotedFeeCents > cheap.quotedFeeCents);
    const byName = [...listed.couriers].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    assert.deepEqual(listed.couriers.map((c) => c.id), byName.map((c) => c.id));

    const booked = await bookStandaloneCourier({
      ...route,
      requesterUserId: buyerId,
      deliveryProfileId: bProfile.id,
    });
    assert.equal(booked.ok, true);
    if (!booked.ok) return;
    assert.equal(booked.request.providerDisplayName, 'Iso Koerier B');
    assert.equal(booked.request.paymentAvailable, false);
    const row = await prisma.standaloneDeliveryRequest.findUnique({ where: { id: booked.request.id } });
    assert.equal(row?.deliveryProfileId, bProfile.id);
    assert.equal(row?.quotedFeeCents, costly.quotedFeeCents);

    const earlyPay = await import('@/lib/delivery/standalone-delivery');
    const denied = await earlyPay.createStandaloneCheckout({
      requesterUserId: buyerId,
      requestId: booked.request.id,
      origin: 'http://127.0.0.1:3199',
    });
    assert.equal(denied.ok, false);

    const stranger = await acceptDeliveryBookingRequest(prisma, {
      requestId: booked.request.bookingRequestId,
      deliveryProfileUserId: courierAUser,
    });
    assert.equal(stranger.ok, false);
    if (!stranger.ok) assert.equal(stranger.status, 403);

    const rejected = await rejectDeliveryBookingRequest(prisma, {
      requestId: booked.request.bookingRequestId,
      deliveryProfileUserId: bUser.id,
    });
    assert.equal(rejected.ok, true);
    const afterReject = await prisma.standaloneDeliveryRequest.findUnique({ where: { id: booked.request.id } });
    assert.equal(afterReject?.status, 'REJECTED');
    assert.equal(afterReject?.paymentStatus, 'UNPAID');

    const again = await bookStandaloneCourier({
      ...route,
      requesterUserId: buyerId,
      deliveryProfileId: courierA.id,
    });
    assert.equal(again.ok, true);
    if (!again.ok) return;
    const accepted = await acceptDeliveryBookingRequest(prisma, {
      requestId: again.request.bookingRequestId,
      deliveryProfileUserId: courierAUser,
    });
    assert.equal(accepted.ok, true);
    const payable = await prisma.standaloneDeliveryRequest.findUnique({ where: { id: again.request.id } });
    assert.equal(payable?.status, 'AWAITING_PAYMENT');

    const otherBuyer = await earlyPay.createStandaloneCheckout({
      requesterUserId: '5087cfb3-8c7d-4ef8-8423-95a7058cbf2e',
      requestId: again.request.id,
      origin: 'http://127.0.0.1:3199',
    });
    assert.equal(otherBuyer.ok, false);
    if (!otherBuyer.ok) assert.equal(otherBuyer.status, 403);

    await prisma.deliveryProfile.update({
      where: { id: bProfile.id },
      data: { temporaryOffline: true, acceptanceMode: 'AUTO_CONFIRM' },
    });
    const autoDenied = await bookStandaloneCourier({
      ...route,
      requesterUserId: buyerId,
      deliveryProfileId: bProfile.id,
    });
    assert.equal(autoDenied.ok, false);
    await prisma.deliveryProfile.update({
      where: { id: bProfile.id },
      data: {
        temporaryOffline: false,
        isOnline: true,
        onlineUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
        acceptanceMode: 'AUTO_CONFIRM',
      },
    });
    const auto = await bookStandaloneCourier({
      ...route,
      requesterUserId: buyerId,
      deliveryProfileId: bProfile.id,
    });
    assert.equal(auto.ok, true);
    if (!auto.ok) return;
    assert.equal(auto.request.bookingStatus, 'AUTO_CONFIRMED');
    assert.equal(auto.request.paymentAvailable, true);

    const slot = tomorrowAt(10, 0);
    await prisma.deliveryProfile.update({
      where: { id: bProfile.id },
      data: {
        isOnline: false,
        onlineUntil: null,
        acceptanceMode: 'MANUAL_CONFIRM',
        availableDays: [slot.day],
        workStartTime: '09:00',
        workEndTime: '17:00',
      },
    });
    await prisma.deliveryProfile.update({
      where: { id: courierA.id },
      data: { isOnline: false, onlineUntil: null, availableDays: [], workStartTime: null, workEndTime: null },
    });
    const future = await createStandaloneQuote({
      ...route,
      requesterUserId: buyerId,
      requestedPickupAt: slot.at,
    });
    assert.equal(future.ok, true);
    if (!future.ok) return;
    assert.ok(future.couriers.some((c) => c.id === bProfile.id));
    assert.equal(future.couriers.some((c) => c.id === courierA.id), false);

    const late = tomorrowAt(22, 0);
    const missed = await createStandaloneQuote({
      ...route,
      requesterUserId: buyerId,
      requestedPickupAt: late.at,
    });
    assert.equal(missed.ok, true);
    if (!missed.ok) return;
    assert.equal(missed.couriers.some((c) => c.id === bProfile.id), false);
    assert.ok(missed.unavailable.some((c) => c.id === bProfile.id));
  } finally {
    await prisma.standaloneDeliveryRequest.deleteMany({ where: { requesterUserId: buyerId, itemDescription: route.itemDescription, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } });
    await prisma.deliveryBookingRequest.deleteMany({ where: { buyerId, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } } });
    await prisma.deliveryProfile.deleteMany({ where: { id: bProfile.id } });
    await prisma.user.deleteMany({ where: { id: bUser.id } });
    await prisma.deliveryProfile.update({ where: { id: courierA.id }, data: original });
    await prisma.user.update({ where: { id: courierAUser }, data: { dateOfBirth: courierAUserRow?.dateOfBirth ?? null } });
    await prisma.$disconnect();
  }
});
