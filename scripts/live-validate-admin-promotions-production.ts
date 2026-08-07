/**
 * Production-safe live validation for Admin Promotions.
 * Creates TESTADMIN (100%/1mo/per-user=1), exercises quote + reserve + second reject,
 * then disables the code.
 *
 * Usage: from repo root with .env.local loaded.
 */

import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import {
  calculatePromoSubscriptionPricing,
  encodePlatformPercentAppliesTo,
} from '../lib/promo-codes/discount-policy';
import { buildPromoDurationQuote } from '../lib/promo-codes/platform-promo-duration';
import { evaluatePromoRedemptionLimits } from '../lib/promo-codes/redemption-limits';

const prisma = new PrismaClient();
const CODE = 'TESTADMIN';

async function main() {
  const report: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
    code: CODE,
  };

  // Ensure columns/table exist
  const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'PromoCode'
      AND column_name IN ('discountDurationCycles', 'maxRedemptionsPerUser', 'name', 'createdByAdminId')
  `;
  assert.ok(cols.length >= 4, 'PromoCode duration columns missing');
  const table = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'PromoCodeRedemption'
  `;
  assert.equal(table.length, 1, 'PromoCodeRedemption missing');
  report.schema = 'ok';

  // Pick two distinct users (prefer sellers) for per-user check
  const users = await prisma.user.findMany({
    where: { accountDeletedAt: null },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
    take: 2,
  });
  assert.ok(users.length >= 1, 'need at least one user');
  const userA = users[0]!;
  const userB = users[1] ?? null;
  report.userA = userA.email;
  report.userB = userB?.email ?? null;

  // Upsert TESTADMIN platform promo
  const existing = await prisma.promoCode.findUnique({ where: { code: CODE } });
  if (existing) {
    await prisma.promoCodeRedemption.deleteMany({ where: { promoCodeId: existing.id } });
    await prisma.promoCode.update({
      where: { id: existing.id },
      data: {
        affiliateId: null,
        name: 'Production live test — disable after',
        discountSharePct: 100,
        discountDurationCycles: 1,
        maxRedemptions: 10,
        maxRedemptionsPerUser: 1,
        redemptionCount: 0,
        status: 'ACTIVE',
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        appliesTo: encodePlatformPercentAppliesTo('testing'),
      },
    });
  } else {
    await prisma.promoCode.create({
      data: {
        affiliateId: null,
        name: 'Production live test — disable after',
        code: CODE,
        discountSharePct: 100,
        discountDurationCycles: 1,
        maxRedemptions: 10,
        maxRedemptionsPerUser: 1,
        redemptionCount: 0,
        status: 'ACTIVE',
        startsAt: new Date(Date.now() - 60_000),
        endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        appliesTo: encodePlatformPercentAppliesTo('testing'),
      },
    });
  }

  const promo = await prisma.promoCode.findUniqueOrThrow({ where: { code: CODE } });
  assert.equal(promo.affiliateId, null);
  assert.equal(promo.discountSharePct, 100);
  assert.equal(promo.discountDurationCycles, 1);
  assert.equal(promo.maxRedemptionsPerUser, 1);
  report.promoId = promo.id;
  report.created = true;

  // Quote math (Premium €199)
  const base = 19900;
  const pricing = calculatePromoSubscriptionPricing({
    basePriceCents: base,
    discountSharePct: 100,
    affiliateId: null,
    appliesTo: promo.appliesTo,
  });
  assert.equal(pricing.finalPriceCents, 0);
  assert.equal(pricing.isPlatform, true);
  const duration = buildPromoDurationQuote(1);
  assert.equal(duration.discountDurationCycles, 1);
  assert.equal(duration.resumesAtListPrice, true);
  report.quote = {
    basePriceCents: base,
    finalPriceCents: pricing.finalPriceCents,
    discountDurationCycles: duration.discountDurationCycles,
  };

  // Atomic reserve via dynamic import (uses shared prisma from lib — ensure DATABASE_URL)
  const { reservePromoRedemption, releasePromoRedemption } = await import(
    '../lib/promo-codes/redeem-promo'
  );

  const first = await reservePromoRedemption({
    promoCodeId: promo.id,
    userId: userA.id,
    planKey: 'PREMIUM',
    path: 'FREE',
    initialStatus: 'RESERVED',
    discountSharePct: 100,
    discountDurationCycles: 1,
    basePriceCents: base,
    finalPriceCents: 0,
  });
  assert.equal(first.ok, true, 'first redeem should pass');
  report.firstRedeem = first;

  const second = await reservePromoRedemption({
    promoCodeId: promo.id,
    userId: userA.id,
    planKey: 'PREMIUM',
    path: 'FREE',
    initialStatus: 'RESERVED',
    discountSharePct: 100,
    discountDurationCycles: 1,
    basePriceCents: base,
    finalPriceCents: 0,
  });
  assert.equal(second.ok, false);
  if (!second.ok) {
    assert.equal(second.reason, 'max_redemptions_per_user');
    report.secondRedeem = { ok: false, reason: second.reason, errorNl: second.errorNl };
  }

  if (userB) {
    const other = await reservePromoRedemption({
      promoCodeId: promo.id,
      userId: userB.id,
      planKey: 'PREMIUM',
      path: 'FREE',
      initialStatus: 'RESERVED',
      discountSharePct: 100,
      discountDurationCycles: 1,
      basePriceCents: base,
      finalPriceCents: 0,
    });
    assert.equal(other.ok, true, 'other user should pass');
    report.otherUserRedeem = other;
    if (other.ok) {
      await releasePromoRedemption({ redemptionId: other.redemptionId });
    }
  }

  // Policy cross-check
  const limit = evaluatePromoRedemptionLimits({
    maxRedemptions: 10,
    maxRedemptionsPerUser: 1,
    globalActiveCount: 1,
    userActiveCount: 1,
  });
  assert.equal(limit.ok, false);

  // Cleanup: release first reservation, disable promo
  if (first.ok) {
    await releasePromoRedemption({ redemptionId: first.redemptionId });
  }
  await prisma.promoCodeRedemption.deleteMany({ where: { promoCodeId: promo.id } });
  await prisma.promoCode.update({
    where: { id: promo.id },
    data: { status: 'DISABLED', redemptionCount: 0 },
  });
  report.disabled = true;
  report.finishedAt = new Date().toISOString();
  report.verdict = 'HOMECHEFF_ADMIN_PROMOTIONS_LIVE_VALIDATION_PASS';

  console.log(JSON.stringify(report, null, 2));
  console.log('HOMECHEFF_ADMIN_PROMOTIONS_LIVE_VALIDATION_PASS');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
