/**
 * Direct DB + resolver chain for temporary online (same functions as APIs).
 *   npx tsx scripts/prove-temporary-online-db-chain.ts
 */
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  applyDeliveryOnlineSession,
  expireExpiredTemporaryOnline,
} from '../lib/delivery/delivery-online-session';
import { resolveDeliveryTimeAvailability } from '../lib/delivery/delivery-time-availability';

const prisma = new PrismaClient();

async function main() {
  const id = randomUUID();
  const email = `tonl_chain_${Date.now()}@homecheff-validation.test`;
  let userId: string | null = null;
  try {
    const user = await prisma.user.create({
      data: {
        id,
        email,
        name: 'Chain Courier',
        username: `tcc_${Date.now().toString(36)}`.slice(0, 28),
        emailVerified: new Date(),
        privacyPolicyAccepted: true,
        termsAccepted: true,
        dateOfBirth: new Date('1994-01-01'),
        role: 'DELIVERY',
        lat: 51.912,
        lng: 4.343,
        country: 'NL',
      },
    });
    userId = user.id;
    const profile = await prisma.deliveryProfile.create({
      data: {
        userId: user.id,
        age: 32,
        transportation: ['BIKE'],
        availableDays: ['zondag'],
        availableTimeSlots: ['morning'],
        workStartTime: '09:00',
        workEndTime: '10:00',
        isActive: true,
        isVerified: true,
        pricingEnabled: true,
        baseFeeCents: 350,
        pricePerKmCents: 80,
        minimumFeeCents: 495,
        homeLat: 51.912,
        homeLng: 4.343,
        maxDistance: 12,
        isOnline: false,
      },
    });

    const online = await applyDeliveryOnlineSession(prisma, profile.id, {
      action: 'online',
      preset: '30m',
    });
    if (!online.ok) throw new Error(online.error);
    const afterOnline = await prisma.deliveryProfile.findUnique({ where: { id: profile.id } });
    const availability = resolveDeliveryTimeAvailability(afterOnline!);
    const scheduleUnchanged =
      JSON.stringify(afterOnline?.availableDays) === JSON.stringify(['zondag']) &&
      afterOnline?.workStartTime === '09:00';

    await prisma.deliveryProfile.update({
      where: { id: profile.id },
      data: { onlineUntil: new Date(Date.now() - 1000) },
    });
    const expiredCount = await expireExpiredTemporaryOnline(prisma);
    const afterExpire = await prisma.deliveryProfile.findUnique({ where: { id: profile.id } });
    const expiredAvail = resolveDeliveryTimeAvailability(afterExpire!);

    const report = {
      APPLY_ONLINE: online.ok && online.isOnline === true,
      OVERRIDE_ACTIVE: availability.source === 'TEMPORARY_ONLINE_OVERRIDE',
      FIXED_SCHEDULE_UNCHANGED: scheduleUnchanged,
      EXPIRE_COUNT: expiredCount >= 1,
      AFTER_EXPIRY_OFFLINE: afterExpire?.isOnline === false && expiredAvail.available === false,
      MATCHABLE_WHILE_OVERRIDE: availability.available === true,
      MATCHABLE_AFTER_EXPIRY: expiredAvail.available === false,
    };
    const pass = Object.entries(report)
      .filter(([k]) => k !== 'EXPIRE_COUNT')
      .every(([, v]) => v === true);
    console.log(JSON.stringify({ pass, ...report, onlineUntil: online.ok ? online.onlineUntil : null }, null, 2));
    if (!pass) process.exitCode = 1;
  } finally {
    if (userId) {
      await prisma.deliveryProfile.deleteMany({ where: { userId } }).catch(() => {});
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
