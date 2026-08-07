/**
 * Production-safe live validation for post-promotion CONTINUE / END.
 * Creates TESTCONTINUE + TESTEND, verifies quotes + lifecycle routing,
 * exercises END free entitlement reserve once, then disables both.
 */

import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { encodePlatformPercentAppliesTo } from '../lib/promo-codes/discount-policy';
import { buildPromoDurationQuote } from '../lib/promo-codes/platform-promo-duration';
import { planPromoLifecycle } from '../lib/promo-codes/post-promotion-lifecycle';

const prisma = new PrismaClient();

async function upsertPromo(params: {
  code: string;
  postPromotionAction: 'CONTINUE' | 'END';
}) {
  const existing = await prisma.promoCode.findUnique({ where: { code: params.code } });
  const data = {
    affiliateId: null as string | null,
    name: `Live test ${params.code} — disable after`,
    discountSharePct: 100,
    discountDurationCycles: 1,
    postPromotionAction: params.postPromotionAction,
    maxRedemptions: 5,
    maxRedemptionsPerUser: 1,
    redemptionCount: 0,
    status: 'ACTIVE' as const,
    startsAt: new Date(Date.now() - 60_000),
    endsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    appliesTo: encodePlatformPercentAppliesTo('testing'),
  };
  if (existing) {
    await prisma.promoCodeRedemption.deleteMany({ where: { promoCodeId: existing.id } });
    return prisma.promoCode.update({ where: { id: existing.id }, data });
  }
  return prisma.promoCode.create({ data: { ...data, code: params.code } });
}

async function main() {
  const report: Record<string, unknown> = {
    startedAt: new Date().toISOString(),
  };

  // Migration column present
  const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'PromoCode' AND column_name = 'postPromotionAction'
  `;
  assert.equal(cols.length, 1, 'postPromotionAction column missing');

  const cont = await upsertPromo({ code: 'TESTCONTINUE', postPromotionAction: 'CONTINUE' });
  const end = await upsertPromo({ code: 'TESTEND', postPromotionAction: 'END' });
  report.created = { TESTCONTINUE: cont.id, TESTEND: end.id };

  const qCont = buildPromoDurationQuote(1, cont.postPromotionAction);
  assert.equal(qCont.postPromotionAction, 'CONTINUE');
  assert.equal(qCont.resumesAtListPrice, true);
  assert.equal(qCont.endsAutomatically, false);
  const lifeCont = planPromoLifecycle({
    finalPriceCents: 0,
    isPlatform: true,
    discountDurationCycles: 1,
    postPromotionAction: 'CONTINUE',
  });
  assert.equal(lifeCont.useStripeTrialThenPaid, true);
  assert.equal(lifeCont.useFreeEntitlement, false);
  report.TESTCONTINUE = { quote: qCont, lifecycle: lifeCont };

  const qEnd = buildPromoDurationQuote(1, end.postPromotionAction);
  assert.equal(qEnd.postPromotionAction, 'END');
  assert.equal(qEnd.endsAutomatically, true);
  assert.equal(qEnd.resumesAtListPrice, false);
  const lifeEnd = planPromoLifecycle({
    finalPriceCents: 0,
    isPlatform: true,
    discountDurationCycles: 1,
    postPromotionAction: 'END',
  });
  assert.equal(lifeEnd.useFreeEntitlement, true);
  assert.equal(lifeEnd.useStripeTrialThenPaid, false);
  report.TESTEND = { quote: qEnd, lifecycle: lifeEnd };

  // Atomic reserve for END (does not activate seller entitlement — reserve only then release)
  const user = await prisma.user.findFirst({
    where: { accountDeletedAt: null },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });
  assert.ok(user);
  const { reservePromoRedemption, releasePromoRedemption } = await import(
    '../lib/promo-codes/redeem-promo'
  );
  const reserved = await reservePromoRedemption({
    promoCodeId: end.id,
    userId: user!.id,
    planKey: 'PREMIUM',
    path: 'FREE',
    initialStatus: 'RESERVED',
    discountSharePct: 100,
    discountDurationCycles: 1,
    postPromotionAction: 'END',
    basePriceCents: 19900,
    finalPriceCents: 0,
  });
  assert.equal(reserved.ok, true);
  if (reserved.ok) {
    const row = await prisma.promoCodeRedemption.findUnique({
      where: { id: reserved.redemptionId },
    });
    assert.equal(row?.postPromotionAction, 'END');
    await releasePromoRedemption({ redemptionId: reserved.redemptionId });
    report.endReserve = { ok: true, redemptionId: reserved.redemptionId, snapshot: 'END' };
  }

  // Disable + clean
  for (const p of [cont, end]) {
    await prisma.promoCodeRedemption.deleteMany({ where: { promoCodeId: p.id } });
    await prisma.promoCode.update({
      where: { id: p.id },
      data: { status: 'DISABLED', redemptionCount: 0 },
    });
  }
  report.disabled = ['TESTCONTINUE', 'TESTEND'];
  report.finishedAt = new Date().toISOString();
  report.verdict = 'HOMECHEFF_POST_PROMOTION_LIVE_VALIDATION_PASS';
  console.log(JSON.stringify(report, null, 2));
  console.log('HOMECHEFF_POST_PROMOTION_LIVE_VALIDATION_PASS');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
