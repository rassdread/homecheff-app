/**
 * Self-referral is rejected at commission creation.
 * Stripe and Growth are not called. The database client is an in-memory fake.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { processCommissionForInvoice, processCommissionForOrder } from '@/lib/affiliate-commission';
import { beneficiaryUserIdBlocked, parentOverrideAllowed } from '@/lib/affiliates/self-referral-guard';

type AffiliateRow = {
  id: string;
  userId: string;
  parentAffiliateId: string | null;
  parentAffiliate?: AffiliateRow | null;
  customBusinessCommissionPct?: number | null;
  customParentBusinessCommissionPct?: number | null;
};

type LedgerRow = {
  eventId: string;
  affiliateId: string;
  amountCents: number;
};

function affiliate(row: AffiliateRow): AffiliateRow {
  return { customBusinessCommissionPct: null, customParentBusinessCommissionPct: null, parentAffiliate: null, ...row };
}

function memory(input: {
  attributions?: Array<{ userId: string; affiliate: AffiliateRow; startsAt?: Date }>;
  affiliates?: AffiliateRow[];
  subscription?: Record<string, unknown> | null;
}) {
  const created: LedgerRow[] = [];
  const byId = new Map((input.affiliates ?? []).map((row) => [row.id, row]));
  const db = {
    commissionLedger: {
      findFirst: async ({ where }: { where: { OR: Array<{ eventId: string | { startsWith: string } }> } }) =>
        created.find((row) =>
          where.OR.some((clause) =>
            typeof clause.eventId === 'string'
              ? row.eventId === clause.eventId
              : row.eventId.startsWith(clause.eventId.startsWith),
          ),
        ) ?? null,
      findUnique: async ({ where }: { where: { eventId: string } }) =>
        created.find((row) => row.eventId === where.eventId) ?? null,
      create: async ({ data }: { data: LedgerRow }) => {
        created.push({ eventId: data.eventId, affiliateId: data.affiliateId, amountCents: data.amountCents });
        return data;
      },
    },
    attribution: {
      findFirst: async ({ where }: { where: { userId: string; startsAt?: { lte: Date } } }) => {
        const row = (input.attributions ?? []).find((item) => item.userId === where.userId);
        if (!row) return null;
        if (where.startsAt?.lte && row.startsAt && row.startsAt > where.startsAt.lte) return null;
        return { userId: row.userId, type: 'USER_SIGNUP', affiliateId: row.affiliate.id, affiliate: row.affiliate };
      },
    },
    affiliate: {
      findUnique: async ({ where }: { where: { id?: string; userId?: string } }) => {
        if (where.id) return byId.get(where.id) ?? null;
        return (input.affiliates ?? []).find((row) => row.userId === where.userId) ?? null;
      },
      create: async () => {
        throw new Error('accrual must not create an affiliate account');
      },
      update: async () => {
        throw new Error('accrual must not rewrite an affiliate account');
      },
    },
    businessSubscription: {
      findFirst: async () => input.subscription ?? null,
    },
  };
  return { db: db as never, created };
}

async function withoutGrowth<T>(run: () => Promise<T>): Promise<T> {
  const previous = {
    VERCEL_ENV: process.env.VERCEL_ENV,
    GROWTH_HC_QUOTE_BASE_URL: process.env.GROWTH_HC_QUOTE_BASE_URL,
    GROWTH_API_BASE_URL: process.env.GROWTH_API_BASE_URL,
  };
  process.env.VERCEL_ENV = 'preview';
  delete process.env.GROWTH_HC_QUOTE_BASE_URL;
  delete process.env.GROWTH_API_BASE_URL;
  try {
    return await run();
  } finally {
    if (previous.VERCEL_ENV === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = previous.VERCEL_ENV;
    if (previous.GROWTH_HC_QUOTE_BASE_URL === undefined) delete process.env.GROWTH_HC_QUOTE_BASE_URL;
    else process.env.GROWTH_HC_QUOTE_BASE_URL = previous.GROWTH_HC_QUOTE_BASE_URL;
    if (previous.GROWTH_API_BASE_URL === undefined) delete process.env.GROWTH_API_BASE_URL;
    else process.env.GROWTH_API_BASE_URL = previous.GROWTH_API_BASE_URL;
  }
}

function order(db: never, orderId: string, buyerId: string, sellerId: string) {
  return withoutGrowth(() => processCommissionForOrder(orderId, 120, buyerId, sellerId, { orderId }, db));
}

test('valid direct and partner referrals keep the 60 cent pool inside HomeCheff 120', async () => {
  const direct = affiliate({ id: 'aff_direct', userId: 'referrer', parentAffiliateId: null });
  const directDb = memory({
    affiliates: [direct],
    attributions: [{ userId: 'buyer', affiliate: direct, startsAt: new Date('2020-01-01T00:00:00Z') }],
  });
  await order(directDb.db, 'order_direct', 'buyer', 'courier');
  assert.deepEqual(
    directDb.created.map((row) => row.amountCents),
    [60],
  );
  assert.equal(directDb.created[0].affiliateId, 'aff_direct');
  assert.ok(directDb.created.reduce((sum, row) => sum + row.amountCents, 0) <= 120);

  const parent = affiliate({ id: 'aff_parent', userId: 'main_user', parentAffiliateId: null });
  const partner = affiliate({ id: 'aff_partner', userId: 'partner_user', parentAffiliateId: 'aff_parent' });
  const partnerDb = memory({
    affiliates: [parent, partner],
    attributions: [{ userId: 'buyer', affiliate: partner, startsAt: new Date('2020-01-01T00:00:00Z') }],
  });
  await order(partnerDb.db, 'order_partner', 'buyer', 'courier');
  const amounts = Object.fromEntries(partnerDb.created.map((row) => [row.affiliateId, row.amountCents]));
  assert.equal(amounts.aff_partner, 48);
  assert.equal(amounts.aff_parent, 12);
  assert.equal(48 + 12, 60);

  await order(partnerDb.db, 'order_partner', 'buyer', 'courier');
  assert.equal(partnerDb.created.length, 2);
});

test('a stored self-attribution and a missing owner create no commission', async () => {
  const self = affiliate({ id: 'aff_self', userId: 'buyer', parentAffiliateId: null });
  const selfDb = memory({
    affiliates: [self],
    attributions: [{ userId: 'buyer', affiliate: self, startsAt: new Date('2020-01-01T00:00:00Z') }],
  });
  await order(selfDb.db, 'order_self', 'buyer', 'courier');
  assert.equal(selfDb.created.length, 0);

  const none = memory({ attributions: [], affiliates: [] });
  await order(none.db, 'order_none', 'buyer', 'courier');
  assert.equal(none.created.length, 0);

  const blank = affiliate({ id: 'aff_blank', userId: '   ', parentAffiliateId: null });
  const blankDb = memory({
    affiliates: [blank],
    attributions: [{ userId: 'buyer', affiliate: blank }],
  });
  await order(blankDb.db, 'order_blank', 'buyer', 'courier');
  assert.equal(blankDb.created.length, 0);
});

test('different accounts are paid and an invalid parent does not take the partner share', async () => {
  const buyerAffiliate = affiliate({ id: 'aff_buyer', userId: 'referrer_buyer', parentAffiliateId: null });
  const sellerAffiliate = affiliate({ id: 'aff_seller', userId: 'referrer_seller', parentAffiliateId: null });
  const both = memory({
    affiliates: [buyerAffiliate, sellerAffiliate],
    attributions: [
      { userId: 'buyer', affiliate: buyerAffiliate },
      { userId: 'courier', affiliate: sellerAffiliate },
    ],
  });
  await order(both.db, 'order_both', 'buyer', 'courier');
  assert.deepEqual(both.created.map((row) => row.amountCents).sort(), [30, 30]);
  assert.equal(both.created.reduce((sum, row) => sum + row.amountCents, 0), 60);

  const parent = affiliate({ id: 'aff_parent_self', userId: 'buyer', parentAffiliateId: null });
  const partner = affiliate({ id: 'aff_partner_ok', userId: 'partner_user', parentAffiliateId: 'aff_parent_self' });
  const invalidParent = memory({
    affiliates: [parent, partner],
    attributions: [{ userId: 'buyer', affiliate: partner }],
  });
  await order(invalidParent.db, 'order_parent_self', 'buyer', 'courier');
  assert.deepEqual(
    invalidParent.created.map((row) => [row.affiliateId, row.amountCents]),
    [['aff_partner_ok', 48]],
  );

  const samePerson = affiliate({ id: 'aff_parent_same', userId: 'partner_user', parentAffiliateId: null });
  const child = affiliate({ id: 'aff_child', userId: 'partner_user', parentAffiliateId: 'aff_parent_same' });
  const collapsed = memory({
    affiliates: [samePerson, child],
    attributions: [{ userId: 'buyer', affiliate: child }],
  });
  await order(collapsed.db, 'order_parent_same', 'buyer', 'courier');
  assert.deepEqual(
    collapsed.created.map((row) => [row.affiliateId, row.amountCents]),
    [['aff_child', 48]],
  );
});

test('subscription accrual blocks a self-owned affiliate and an invalid parent', async () => {
  const self = affiliate({ id: 'aff_self', userId: 'business_user', parentAffiliateId: null });
  const selfDb = memory({
    subscription: {
      id: 'sub_row',
      businessUserId: 'business_user',
      endsAt: new Date('2099-01-01T00:00:00Z'),
      promoCode: null,
      promoCodeId: null,
      attribution: { userId: 'business_user', affiliateId: self.id, affiliate: self },
    },
  });
  await withoutGrowth(() => processCommissionForInvoice('in_self', 'stripe_sub', 1000, undefined, selfDb.db));
  assert.equal(selfDb.created.length, 0);

  const partner = affiliate({
    id: 'aff_partner',
    userId: 'partner_user',
    parentAffiliateId: 'aff_parent',
  });
  const parent = affiliate({ id: 'aff_parent', userId: 'business_user', parentAffiliateId: null });
  partner.parentAffiliate = parent;
  const validChild = memory({
    subscription: {
      id: 'sub_row',
      businessUserId: 'business_user',
      endsAt: new Date('2099-01-01T00:00:00Z'),
      promoCode: null,
      promoCodeId: null,
      attribution: { userId: 'business_user', affiliateId: partner.id, affiliate: partner },
    },
  });
  await withoutGrowth(() => processCommissionForInvoice('in_partner', 'stripe_sub', 1000, undefined, validChild.db));
  assert.equal(validChild.created.length, 1);
  assert.equal(validChild.created[0].affiliateId, 'aff_partner');
  assert.equal(validChild.created.some((row) => row.eventId.endsWith('_parent')), false);
});

test('identity guard fails closed and does not treat a different user as self', () => {
  assert.equal(beneficiaryUserIdBlocked('buyer', ['buyer']), true);
  assert.equal(beneficiaryUserIdBlocked('referrer', ['buyer', 'courier']), false);
  assert.equal(beneficiaryUserIdBlocked('  ', ['buyer']), true);
  assert.equal(beneficiaryUserIdBlocked(null, ['buyer']), true);
  assert.equal(
    parentOverrideAllowed({
      affiliateId: 'child',
      affiliateUserId: 'partner_user',
      parentAffiliateId: 'parent',
      parentUserId: 'main_user',
      partyUserIds: ['buyer'],
    }),
    true,
  );
  assert.equal(
    parentOverrideAllowed({
      affiliateId: 'child',
      affiliateUserId: 'partner_user',
      parentAffiliateId: 'child',
      parentUserId: 'main_user',
      partyUserIds: ['buyer'],
    }),
    false,
  );
});
