/**
 * Courier payout verification gate.
 * Stripe clients are in-memory fakes. They do not call Stripe.
 *
 * Run: npx tsx --test lib/delivery/delivery-payout-verification.test.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { DELIVERY_DELIVERER_PERCENT, DELIVERY_PLATFORM_FEE_PERCENT } from '@/lib/fees';
import { allocateMarketplaceAffiliatePool } from '@/lib/marketplace-affiliate-pool';
import { assertCommercialCourierCanReceivePayout } from '@/lib/delivery/delivery-eligibility';
import { ensureDeliveryPayout } from '@/lib/delivery/delivery-payout';
import { createMemoryCourierTransferObligation } from '@/lib/delivery/courier-transfer-obligation';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';

const root = path.resolve(__dirname, '../..');

type Profile = {
  id: string;
  userId: string;
  isVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  age: number;
  stripeTransfersStatus: string;
  stripePayoutsEnabled: boolean;
  stripeTransfersCheckedAt: Date;
  user: {
    id: string;
    dateOfBirth: Date | null;
    stripeConnectAccountId: string | null;
    stripeConnectOnboardingCompleted: boolean;
  };
};

function adultProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'p1',
    userId: 'courier',
    isVerified: true,
    isActive: true,
    isBlocked: false,
    age: 36,
    stripeTransfersStatus: 'active',
    stripePayoutsEnabled: true,
    stripeTransfersCheckedAt: new Date(),
    user: {
      id: 'courier',
      dateOfBirth: new Date('1990-01-01T00:00:00Z'),
      stripeConnectAccountId: 'acct_test',
      stripeConnectOnboardingCompleted: true,
    },
    ...overrides,
  };
}

function harness(
  profile: Profile,
  options?: {
    payout?: Record<string, unknown> | null;
    profiles?: Profile[];
    list?: () => Promise<{ data: Array<Record<string, unknown>>; has_more?: boolean }>;
    create?: (params: { amount: number; source_transaction?: string }) => Promise<{ id: string; amount: number }>;
  },
) {
  const calls: string[] = [];
  const writes: string[] = [];
  let storedEarnings = 0;
  let payout = options?.payout === undefined ? null : options.payout;
  const queue = options?.profiles ? [...options.profiles] : [];
  const stripe = {
    accounts: {
      retrieve: async (id: string) => ({
        id,
        business_type: 'individual',
        individual: { verification: { status: 'verified', details_code: null } },
        requirements: { disabled_reason: null, currently_due: [] },
      }),
    },
    checkout: {
      sessions: {
        retrieve: async () => ({
          id: 'cs_order',
          payment_intent: {
            id: 'pi_order',
            latest_charge: {
              id: 'ch_order',
              amount: 1040,
              amount_refunded: 0,
              currency: 'eur',
              status: 'succeeded',
              refunded: false,
              livemode: false,
              metadata: { orderId: 'd1' },
            },
          },
        }),
      },
    },
    transfers: {
      list: options?.list ?? (async () => ({ data: [] })),
      create: async (params: { amount: number; source_transaction?: string }) => {
        calls.push(params.source_transaction ?? 'create');
        if (options?.create) return options.create(params);
        return { id: 'tr_test_new', amount: params.amount };
      },
    },
  };
  const prisma = {
    deliveryProfile: {
      findUnique: async () => {
        const row = queue.length > 0 ? queue.shift()! : profile;
        return { ...row, totalEarnings: storedEarnings };
      },
      updateMany: async ({ data }: { data?: { totalEarnings?: { increment?: number } } }) => {
        if (typeof data?.totalEarnings?.increment === 'number') storedEarnings += data.totalEarnings.increment;
        writes.push('earnings');
        return { count: 1 };
      },
      update: async ({ data }: { data?: { totalEarnings?: number } }) => {
        if (typeof data?.totalEarnings === 'number') storedEarnings = data.totalEarnings;
        writes.push('profile-update');
        return { ...profile, totalEarnings: storedEarnings };
      },
    },
    deliveryOrder: {
      findUnique: async () => ({
        quotedFeeCents: 1000,
        deliveryFee: 1000,
        status: 'DELIVERED',
        notes: null,
        orderId: 'd1',
      }),
      findMany: async () => [{ id: 'd1', status: 'DELIVERED', orderId: 'd1' }],
    },
    order: {
      findUnique: async () => ({ stripeSessionId: 'cs_order', paymentMethod: 'IDEAL' }),
    },
    standaloneDeliveryRequest: { findFirst: async () => null },
    payout: {
      findFirst: async () => payout,
      findUnique: async () => payout,
      findMany: async () => (payout ? [payout] : []),
      update: async ({ data }: { data: Record<string, unknown> }) => {
        writes.push('payout-update');
        payout = { ...(payout ?? {}), ...data };
        return payout;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        writes.push('payout-create');
        payout = data;
        return payout;
      },
      delete: async () => {
        writes.push('payout-delete');
        payout = null;
      },
    },
    transaction: {
      findUnique: async () => ({ id: 'txn_delivery_d1' }),
      findFirst: async () => null,
      findMany: async () => [],
      create: async () => {
        writes.push('transaction-create');
        return { id: 'txn_delivery_d1' };
      },
    },
    courierTransferObligation: createMemoryCourierTransferObligation(),
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };
  return {
    stripe,
    prisma,
    calls,
    writes,
    payout: () => payout,
    earnings: () => storedEarnings,
  };
}

const input = {
  deliveryOrderId: 'd1',
  orderId: 'd1',
  delivererUserId: 'courier',
  buyerUserId: 'buyer',
};

describe('courier payout verification', () => {
  it('A: verified adult with Connect still receives the existing payout path', async () => {
    const box = harness(adultProfile(), { payout: null });
    const result = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(result.blocked, undefined);
    assert.equal(result.transferStatus, 'SUCCEEDED');
    assert.equal(result.transferId, 'tr_test_new');
    assert.equal(result.amountCents, 880);
    assert.equal(box.calls.length, 1);
  });

  it('B: unverified adult is blocked before a transfer', async () => {
    const box = harness(adultProfile({ isVerified: false }));
    const result = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(result.blocked, true);
    assert.equal(result.blockCode, 'DELIVERY_NOT_VERIFIED');
    assert.equal(result.transferId ?? null, null);
    assert.equal(box.calls.length, 0);
  });

  it('C: verification revoked before completion blocks the new payout', async () => {
    const box = harness(adultProfile({ isVerified: false }), { payout: null });
    const result = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(result.blockCode, 'DELIVERY_NOT_VERIFIED');
    assert.equal(box.calls.length, 0);
    assert.equal(box.writes.includes('payout-create'), false);
  });

  it('D: verification revoked before a delayed retry blocks the transfer', async () => {
    const existing = {
      id: 'payout_delivery_d1',
      amountCents: 880,
      providerRef: null,
      toUserId: 'courier',
    };
    const box = harness(adultProfile({ isVerified: false }), { payout: existing });
    const result = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(result.blockCode, 'DELIVERY_NOT_VERIFIED');
    assert.equal(box.calls.length, 0);
    assert.equal(box.payout()?.providerRef, null);
    assert.equal(box.payout()?.amountCents, 880);
  });

  it('E: missing date of birth stays blocked', () => {
    const gate = assertCommercialCourierCanReceivePayout({
      profile: adultProfile({ user: { ...adultProfile().user, dateOfBirth: null } }),
      dateOfBirth: null,
      ageGateEnabled: true,
    });
    assert.equal(gate.ok, false);
    if (gate.ok) return;
    assert.equal(gate.code, 'DELIVERY_DOB_REQUIRED');
  });

  it('F: under 18 is blocked before a transfer', async () => {
    const box = harness(
      adultProfile({
        age: 16,
        user: { ...adultProfile().user, dateOfBirth: new Date('2010-06-01T00:00:00Z') },
      }),
    );
    const result = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(result.blocked, true);
    assert.equal(result.blockCode, 'DELIVERY_UNDERAGE');
    assert.equal(box.calls.length, 0);
  });

  it('G: verified adult without Connect is blocked by the existing readiness gate', async () => {
    const box = harness(
      adultProfile({
        user: { ...adultProfile().user, stripeConnectAccountId: null },
      }),
      { payout: null },
    );
    const result = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(result.blocked, true);
    assert.equal(result.blockCode, 'COURIER_CONNECT_REQUIRED');
    assert.equal(box.calls.length, 0);
  });

  it('H: a blocked courier cannot be paid', async () => {
    const box = harness(adultProfile({ isBlocked: true }));
    const result = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(result.blockCode, 'DELIVERY_BLOCKED');
    assert.equal(box.calls.length, 0);
  });

  it('I: a blocked payout does not rewrite financial records', async () => {
    const existing = {
      id: 'payout_delivery_d1',
      amountCents: 880,
      providerRef: null,
      toUserId: 'courier',
    };
    const box = harness(adultProfile({ isVerified: false }), { payout: existing });
    await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.deepEqual(box.writes, []);
    assert.equal(box.payout()?.amountCents, 880);
    assert.equal(box.payout()?.providerRef, null);
  });

  it('J: repeated blocks do not create transfers, payouts, or affiliate rows', async () => {
    const box = harness(adultProfile({ isVerified: false }), { payout: null });
    const first = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    const second = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(first.blockCode, 'DELIVERY_NOT_VERIFIED');
    assert.equal(second.blockCode, 'DELIVERY_NOT_VERIFIED');
    assert.equal(box.calls.length, 0);
    assert.equal(box.writes.length, 0);
    const payoutSource = fs.readFileSync(path.join(root, 'lib/delivery/delivery-payout.ts'), 'utf8');
    assert.equal(payoutSource.includes('affiliate'), false);
  });

  it('K: an already completed payout record is left intact', async () => {
    const existing = {
      id: 'payout_delivery_d1',
      amountCents: 880,
      providerRef: 'tr_historical',
      destinationConnectAccountId: 'acct_test',
      toUserId: 'courier',
    };
    const revoked = harness(adultProfile({ isVerified: false }), { payout: { ...existing } });
    const blocked = await ensureDeliveryPayout(revoked.prisma as never, input, { stripe: revoked.stripe as never });
    assert.equal(blocked.blockCode, 'DELIVERY_NOT_VERIFIED');
    assert.equal(revoked.payout()?.providerRef, 'tr_historical');
    assert.equal(revoked.writes.includes('payout-update'), false);
    assert.equal(revoked.calls.length, 0);

    const kept = harness(adultProfile(), { payout: { ...existing } });
    const done = await ensureDeliveryPayout(kept.prisma as never, input, { stripe: kept.stripe as never });
    assert.equal(done.transferStatus, 'ALREADY_DONE');
    assert.equal(done.transferId, 'tr_historical');
    assert.equal(kept.calls.length, 0);
  });

  it('L: a later eligible retry pays once and does not pay again', async () => {
    const profile = adultProfile({ isVerified: false });
    const box = harness(profile, { payout: null });
    const blocked = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(blocked.blockCode, 'DELIVERY_NOT_VERIFIED');
    profile.isVerified = true;
    const paid = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(paid.transferStatus, 'SUCCEEDED');
    assert.equal(paid.transferId, 'tr_test_new');
    const again = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(again.transferStatus, 'ALREADY_DONE');
    assert.equal(box.calls.length, 1);
  });

  it('M: seller escrow and seller payouts do not use the courier verification gate', () => {
    const escrow = fs.readFileSync(path.join(root, 'lib/releaseEscrowOnDelivered.ts'), 'utf8');
    const seller = fs.readFileSync(path.join(root, 'app/api/seller/payouts/request/route.ts'), 'utf8');
    assert.equal(escrow.includes('assertCommercialCourierCanReceivePayout'), false);
    assert.equal(seller.includes('assertCommercialCourierCanReceivePayout'), false);
    assert.match(escrow, /type: 'product_sale'/);
  });

  it('N: 88/12 and the affiliate share of the platform fee stay unchanged', () => {
    assert.equal(DELIVERY_DELIVERER_PERCENT, 88);
    assert.equal(DELIVERY_PLATFORM_FEE_PERCENT, 12);
    const split = splitDeliveryCommission(1000);
    assert.equal(split.providerNetPayoutCents, 880);
    assert.equal(split.platformCommissionCents, 120);
    const pool = allocateMarketplaceAffiliatePool({
      platformFeeCents: 120,
      buyerAffiliateId: 'aff_buyer',
      sellerAffiliateId: null,
    });
    assert.equal(pool.lines[0]?.commissionCents, 60);
  });

  it('revocation after the first read and before transfer creates no Stripe transfer', async () => {
    const verified = adultProfile();
    const revoked = adultProfile({ isVerified: false });
    const box = harness(verified, {
      payout: null,
      profiles: [verified, verified, revoked],
    });
    const result = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(result.blocked, true);
    assert.equal(result.blockCode, 'DELIVERY_NOT_VERIFIED');
    assert.equal(result.transferStatus, 'SKIPPED');
    assert.equal(box.calls.length, 0);
    assert.equal(box.payout()?.providerRef ?? null, null);
    assert.equal(box.writes.includes('payout-delete'), false);
  });

  it('delivery with a successful transfer earns once and a repeat does not add it again', async () => {
    const box = harness(adultProfile(), { payout: null });
    const first = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    const earnedWrites = box.writes.filter((write) => write === 'earnings').length;
    const second = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(first.transferStatus, 'SUCCEEDED');
    assert.equal(second.transferStatus, 'ALREADY_DONE');
    assert.equal(earnedWrites, 1);
    assert.equal(box.writes.filter((write) => write === 'earnings').length, 1);
    assert.equal(box.calls.length, 1);
    assert.equal(box.earnings(), 880);
  });

  it('a rejected transfer stays earned and the retry does not add the fee or create another transfer', async () => {
    const box = harness(adultProfile(), {
      payout: null,
      create: async () => {
        throw Object.assign(new Error('insufficient funds'), { statusCode: 402 });
      },
    });
    const failed = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(failed.transferStatus, 'FAILED');
    assert.equal(box.earnings(), 880);
    assert.equal(box.payout()?.providerRef ?? null, null);
    const retried = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(retried.transferId ?? null, null);
    assert.equal(box.calls.length, 1);
    assert.equal(box.writes.filter((write) => write === 'earnings').length, 1);
    assert.equal(box.earnings(), 880);
  });

  it('a lookup failure can be followed by one transfer without adding the fee again', async () => {
    let lookups = 0;
    const box = harness(adultProfile(), {
      payout: null,
      list: async () => {
        lookups += 1;
        if (lookups === 1) throw new Error('stripe timeout');
        return { data: [] };
      },
    });
    const unknown = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(unknown.transferStatus, 'FAILED');
    assert.equal(box.calls.length, 0);
    const retried = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(retried.transferId, 'tr_test_new');
    assert.equal(box.calls.length, 1);
    assert.equal(box.writes.filter((write) => write === 'earnings').length, 1);
    assert.equal(box.earnings(), 880);
  });

  it('an uncertain lookup does not create a second transfer when the transfer already exists', async () => {
    let lookups = 0;
    const box = harness(adultProfile(), {
      payout: null,
      list: async () => {
        lookups += 1;
        if (lookups === 1) throw new Error('stripe timeout');
        return {
          data: [{
            id: 'tr_already_there',
            amount: 880,
            currency: 'eur',
            reversed: false,
            destination: 'acct_test',
            metadata: { deliveryOrderId: 'd1', purpose: 'delivery_provider_principal' },
          }],
        };
      },
    });
    const unknown = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(unknown.transferStatus, 'FAILED');
    assert.equal(box.calls.length, 0);
    const found = await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.equal(found.transferId, 'tr_already_there');
    assert.equal(found.transferStatus, 'ALREADY_DONE');
    assert.equal(box.calls.length, 0);
    assert.equal(box.writes.filter((write) => write === 'earnings').length, 1);
  });
});
