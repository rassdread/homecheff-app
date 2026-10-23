/**
 * Administrative courier block stays in place through self-service.
 * Stripe clients are in-memory fakes. They do not call Stripe.
 *
 * Run: npx tsx --test lib/delivery/delivery-revocation-hardening.test.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { DELIVERY_DELIVERER_PERCENT, DELIVERY_PLATFORM_FEE_PERCENT } from '@/lib/fees';
import { allocateMarketplaceAffiliatePool } from '@/lib/marketplace-affiliate-pool';
import { buildCanonicalSettingsUpdate } from '@/lib/delivery/delivery-profile-canonical';
import {
  assertCommercialCourierCanReceivePayout,
  assertDelivererCanAccept,
  deliveryProfileAutoVerifyPatch,
  deliverySelfServiceActivationDecision,
  deliverySelfServiceIsActivePatch,
  isCommerciallyMatchableDeliverer,
} from '@/lib/delivery/delivery-eligibility';
import { ensureDeliveryPayout } from '@/lib/delivery/delivery-payout';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';

const root = path.resolve(__dirname, '../..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

const adultDob = new Date('1990-01-01T00:00:00Z');

function adult(overrides: Record<string, unknown> = {}) {
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
      dateOfBirth: adultDob,
      stripeConnectAccountId: 'acct_test',
      stripeConnectOnboardingCompleted: true,
    },
    ...overrides,
  };
}

function harness(
  profile: ReturnType<typeof adult>,
  payout: Record<string, unknown> | null = null,
) {
  const calls: string[] = [];
  const writes: string[] = [];
  let row = payout;
  const stripe = {
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
              metadata: { orderId: 'd1' },
            },
          },
        }),
      },
    },
    transfers: {
      list: async () => ({ data: [] }),
      create: async (params: { amount: number; source_transaction?: string }) => {
        calls.push(params.source_transaction ?? 'create');
        return { id: 'tr_test_new', amount: params.amount };
      },
    },
  };
  const prisma = {
    deliveryProfile: {
      findUnique: async () => profile,
      updateMany: async () => {
        writes.push('earnings');
        return { count: 1 };
      },
      update: async () => profile,
    },
    deliveryOrder: {
      findUnique: async () => ({
        quotedFeeCents: 1000,
        deliveryFee: 1000,
        status: 'DELIVERED',
        notes: null,
      }),
    },
    order: {
      findUnique: async () => ({ stripeSessionId: 'cs_order', paymentMethod: 'IDEAL' }),
    },
    standaloneDeliveryRequest: { findFirst: async () => null },
    payout: {
      findFirst: async () => row,
      findUnique: async () => row,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        writes.push('payout-update');
        row = { ...(row ?? {}), ...data };
        return row;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        writes.push('payout-create');
        row = data;
        return row;
      },
      delete: async () => {
        writes.push('payout-delete');
        row = null;
      },
    },
    transaction: {
      findUnique: async () => ({ id: 'txn_delivery_d1' }),
      findFirst: async () => null,
      create: async () => ({ id: 'txn_delivery_d1' }),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };
  return { stripe, prisma, calls, writes, payout: () => row };
}

const input = {
  deliveryOrderId: 'd1',
  orderId: 'd1',
  delivererUserId: 'courier',
  buyerUserId: 'buyer',
};

describe('administrative courier restriction', () => {
  it('A: a complete unblocked profile can still be marked verified', () => {
    const patch = deliveryProfileAutoVerifyPatch(
      { isVerified: false, isBlocked: false },
      true,
    );
    assert.deepEqual(patch, { isVerified: true });
    const signup = read('lib/delivery/delivery-signup-service.ts');
    const create = signup.slice(
      signup.indexOf('function profileCreateData'),
      signup.indexOf('async function ensureBusinessForUser'),
    );
    assert.equal(create.includes('isVerified'), false);
    assert.equal(create.includes('isBlocked'), false);
    assert.match(create, /isActive: true/);
  });

  it('B: a verified adult who is blocked is not matchable', () => {
    assert.equal(
      isCommerciallyMatchableDeliverer({
        isActive: true,
        isVerified: true,
        isBlocked: true,
        dateOfBirth: adultDob,
        profileAge: 36,
        ageGateEnabled: true,
      }),
      false,
    );
  });

  it('C: a blocked courier cannot accept an assignment', () => {
    const gate = assertDelivererCanAccept(adult({ isBlocked: true }), {
      dateOfBirth: adultDob,
      ageGateEnabled: true,
    });
    assert.equal(gate.ok, false);
    if (gate.ok) return;
    assert.equal(gate.code, 'DELIVERY_BLOCKED');
    const claim = read('lib/delivery/delivery-request-service.ts');
    const fn = claim.slice(claim.indexOf('static async claimByCourier'));
    assert.ok(fn.indexOf('isBlocked: true') < fn.indexOf('assertDelivererCanAccept'));
  });

  it('D: an already assigned delivery cannot start a new transfer after a block', async () => {
    const box = harness(adult({ isBlocked: true }), {
      id: 'payout_delivery_d1',
      amountCents: 880,
      providerRef: null,
      toUserId: 'courier',
    });
    const result = await ensureDeliveryPayout(box.prisma as never, input, {
      stripe: box.stripe as never,
    });
    assert.equal(result.blockCode, 'DELIVERY_BLOCKED');
    assert.equal(box.calls.length, 0);
    assert.equal(box.payout()?.amountCents, 880);
    const accept = read('lib/delivery/booking-request-service.ts');
    const fn = accept.slice(accept.indexOf('export async function acceptDeliveryBookingRequest'));
    assert.ok(fn.indexOf('isBlocked') < fn.indexOf('deliveryBookingRequest.updateMany'));
    const status = read('app/api/delivery/orders/[orderId]/update-status/route.ts');
    assert.match(status, /ensureDeliveryPayout/);
  });

  it('E: a blocked unpaid obligation is preserved and not transferred', async () => {
    const box = harness(adult({ isBlocked: true, isVerified: true }), {
      id: 'payout_delivery_d1',
      amountCents: 880,
      providerRef: null,
    });
    await ensureDeliveryPayout(box.prisma as never, input, { stripe: box.stripe as never });
    assert.deepEqual(box.writes, []);
    assert.equal(box.payout()?.amountCents, 880);
    assert.equal(box.payout()?.providerRef, null);
  });

  it('F: opening settings does not verify or unblock a blocked profile', () => {
    assert.deepEqual(
      deliveryProfileAutoVerifyPatch({ isVerified: false, isBlocked: true }, true),
      {},
    );
    const settings = read('app/api/delivery/settings/route.ts');
    assert.match(settings, /deliveryProfileAutoVerifyPatch/);
    assert.match(settings, /isBlocked: true/);
    assert.equal(settings.includes('data: { isVerified: true }'), false);
  });

  it('G: saving settings cannot clear a block or force availability back on', () => {
    const built = buildCanonicalSettingsUpdate({
      body: {
        bio: 'fiets',
        isBlocked: false,
        isVerified: true,
        isActive: true,
      },
      existing: {
        isActive: false,
        isOnline: false,
        maxDistance: 3,
        preferredRadius: 3,
        homeLat: 52.3,
        homeLng: 4.9,
        homeAddress: 'Straat 1',
        availableDays: ['MONDAY'],
        availableTimeSlots: ['MORNING'],
        transportation: ['BIKE'],
        deliveryRegions: [],
        deliveryMode: 'FIXED',
        bio: null,
        currency: 'EUR',
        acceptanceMode: 'MANUAL_CONFIRM',
        pricingEnabled: false,
        baseFeeCents: null,
        pricePerKmCents: null,
        minimumFeeCents: null,
        freeDeliveryRadiusKm: 0,
        nationalCoverage: false,
        providerType: 'INDEPENDENT',
        companyDisplayName: null,
      },
    });
    assert.equal('isBlocked' in built.data, false);
    assert.equal('isVerified' in built.data, false);
    assert.equal(
      deliverySelfServiceIsActivePatch({ isBlocked: true }, built.data.isActive),
      undefined,
    );
    const settings = read('app/api/delivery/settings/route.ts');
    assert.match(settings, /deliverySelfServiceIsActivePatch/);
  });

  it('H: activation cannot lift a block', () => {
    const decision = deliverySelfServiceActivationDecision({ isBlocked: true }, true);
    assert.equal(decision.ok, false);
    if (decision.ok) return;
    assert.equal(decision.code, 'DELIVERY_BLOCKED');
    const activate = read('app/api/delivery/activate/route.ts');
    const updateAt = activate.indexOf('deliveryProfile.update');
    assert.ok(activate.indexOf('deliverySelfServiceActivationDecision') < updateAt);
    assert.ok(activate.indexOf('if (!activation.ok)') < updateAt);
  });

  it('I: a request body cannot set isBlocked to false', () => {
    const profile = read('app/api/delivery/profile/route.ts');
    const location = read('app/api/delivery/location/route.ts');
    assert.equal(/isBlocked:\s*false/.test(profile), false);
    assert.equal(/isBlocked:\s*false/.test(location), false);
    assert.match(profile, /deliverySelfServiceIsActivePatch/);
    assert.match(location, /deliverySelfServiceIsActivePatch/);
    assert.equal(
      deliverySelfServiceIsActivePatch({ isBlocked: true }, true),
      undefined,
    );
  });

  it('J: sending isVerified true does not restore matching or payout eligibility', () => {
    assert.equal(
      isCommerciallyMatchableDeliverer({
        isActive: true,
        isVerified: true,
        isBlocked: true,
        dateOfBirth: adultDob,
        profileAge: 36,
        ageGateEnabled: true,
      }),
      false,
    );
    const gate = assertCommercialCourierCanReceivePayout({
      profile: adult({ isBlocked: true, isVerified: true }),
      dateOfBirth: adultDob,
      ageGateEnabled: true,
    });
    assert.equal(gate.ok, false);
    if (gate.ok) return;
    assert.equal(gate.code, 'DELIVERY_BLOCKED');
    assert.deepEqual(
      deliveryProfileAutoVerifyPatch({ isVerified: false, isBlocked: true }, true),
      {},
    );
  });

  it('K: repeated completion checks leave the block in place', () => {
    const profile = { isVerified: false, isBlocked: true };
    assert.deepEqual(deliveryProfileAutoVerifyPatch(profile, true), {});
    assert.deepEqual(deliveryProfileAutoVerifyPatch(profile, true), {});
    assert.equal(deliverySelfServiceActivationDecision(profile, true).ok, false);
    assert.equal(deliverySelfServiceActivationDecision(profile, true).ok, false);
  });

  it('L: an unblocked eligible courier still matches and can be paid once', async () => {
    assert.equal(
      isCommerciallyMatchableDeliverer({
        isActive: true,
        isVerified: true,
        isBlocked: false,
        dateOfBirth: adultDob,
        profileAge: 36,
        ageGateEnabled: true,
      }),
      true,
    );
    const open = deliverySelfServiceActivationDecision({ isBlocked: false }, true);
    assert.equal(open.ok, true);
    if (!open.ok) return;
    assert.equal(open.verify, true);
    const box = harness(adult(), null);
    const paid = await ensureDeliveryPayout(box.prisma as never, input, {
      stripe: box.stripe as never,
    });
    assert.equal(paid.transferStatus, 'SUCCEEDED');
    assert.equal(paid.amountCents, 880);
    const again = await ensureDeliveryPayout(box.prisma as never, input, {
      stripe: box.stripe as never,
    });
    assert.equal(again.transferStatus, 'ALREADY_DONE');
    assert.equal(box.calls.length, 1);
  });

  it('M: pausing availability does not delete a payout obligation', async () => {
    const box = harness(adult({ isActive: false, isBlocked: false }), {
      id: 'payout_delivery_d1',
      amountCents: 880,
      providerRef: null,
    });
    const result = await ensureDeliveryPayout(box.prisma as never, input, {
      stripe: box.stripe as never,
    });
    assert.equal(result.transferStatus, 'SUCCEEDED');
    assert.equal(result.amountCents, 880);
    assert.equal(box.payout()?.amountCents, 880);
    assert.equal(box.writes.includes('payout-delete'), false);
  });

  it('N: a blocked retry does not create a transfer', async () => {
    const box = harness(adult({ isBlocked: true }), {
      id: 'payout_delivery_d1',
      amountCents: 880,
      providerRef: null,
    });
    const first = await ensureDeliveryPayout(box.prisma as never, input, {
      stripe: box.stripe as never,
    });
    const second = await ensureDeliveryPayout(box.prisma as never, input, {
      stripe: box.stripe as never,
    });
    assert.equal(first.blockCode, 'DELIVERY_BLOCKED');
    assert.equal(second.blockCode, 'DELIVERY_BLOCKED');
    assert.equal(box.calls.length, 0);
    assert.equal(box.writes.length, 0);
  });

  it('O: a completed transfer record stays intact after a later block', async () => {
    const box = harness(adult({ isBlocked: true }), {
      id: 'payout_delivery_d1',
      amountCents: 880,
      providerRef: 'tr_historical',
      toUserId: 'courier',
    });
    const result = await ensureDeliveryPayout(box.prisma as never, input, {
      stripe: box.stripe as never,
    });
    assert.equal(result.blockCode, 'DELIVERY_BLOCKED');
    assert.equal(box.payout()?.providerRef, 'tr_historical');
    assert.equal(box.calls.length, 0);
    assert.equal(box.writes.includes('payout-update'), false);
  });

  it('P: commission, affiliate share, and payout idempotency stay unchanged', () => {
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
    const payout = read('lib/delivery/delivery-payout.ts');
    assert.match(payout, /delivery_xfer_/);
    assert.equal(payout.includes('affiliate'), false);
  });

  it('Q: only an admin route can clear isBlocked', () => {
    const block = read('app/api/admin/delivery/[profileId]/block/route.ts');
    assert.match(block, /requireAdminPermission/);
    assert.match(block, /isBlocked: false/);
    const courierFiles = [
      'app/api/delivery/settings/route.ts',
      'app/api/delivery/activate/route.ts',
      'app/api/delivery/profile/route.ts',
      'app/api/delivery/location/route.ts',
      'app/api/delivery/online/route.ts',
      'app/api/delivery/toggle-status/route.ts',
      'lib/delivery/delivery-signup-service.ts',
    ];
    for (const file of courierFiles) {
      assert.equal(/isBlocked:\s*false/.test(read(file)), false, file);
    }
    const guard = read('lib/admin-guard.ts');
    assert.match(guard, /user\.role === 'ADMIN'/);
    assert.match(guard, /user\.role === 'SUPERADMIN'/);
  });

  it('R: marketplace credential login is unchanged', () => {
    const auth = read('lib/auth.ts');
    const authorize = auth.slice(auth.indexOf('async authorize(credentials)'));
    assert.match(authorize, /emailOrUsername/);
    assert.match(authorize, /!credentials\?\.emailOrUsername \|\| !credentials\?\.password/);
    const seller = read('app/api/seller/payouts/request/route.ts');
    assert.equal(seller.includes('assertCommercialCourierCanReceivePayout'), false);
    assert.equal(seller.includes('deliveryProfileAutoVerifyPatch'), false);
  });
});
