import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { CommissionLedgerEventType, CommissionLedgerStatus } from '@prisma/client';
import { commissionReversalPlan, processCommissionReversal } from '@/lib/affiliate-commission';
import { assessDeliverySourceCharge } from '@/lib/delivery/delivery-payout';
import { observeStandaloneChargeRefund } from '@/lib/delivery/delivery-webhook-events';
import { classifyDeliveryOperations, readMonitoredQuery } from '@/lib/delivery/delivery-operations-status';

test('a partial commission refund stays partial and a later full refund adds only the remainder', () => {
  const half = commissionReversalPlan({
    originalAmountCents: 300,
    originalStatus: 'PENDING',
    targetCents: 150,
    alreadyReversedCents: 0,
  });
  assert.equal(half.deltaCents, 150);
  assert.equal(half.remainderCents, 150);
  assert.equal(half.closeOriginal, true);
  assert.equal(half.reverseRemainder, false);

  const replay = commissionReversalPlan({
    originalAmountCents: 300,
    originalStatus: 'REVERSED',
    targetCents: 150,
    alreadyReversedCents: 150,
  });
  assert.equal(replay.deltaCents, 0);
  assert.equal(replay.remainderCents, 150);

  const rest = commissionReversalPlan({
    originalAmountCents: 300,
    originalStatus: 'REVERSED',
    targetCents: 300,
    alreadyReversedCents: 150,
  });
  assert.equal(rest.deltaCents, 150);
  assert.equal(rest.remainderCents, 0);
  assert.equal(rest.reverseRemainder, true);

  const paid = commissionReversalPlan({
    originalAmountCents: 300,
    originalStatus: 'PAID',
    targetCents: 300,
    alreadyReversedCents: 0,
  });
  assert.equal(paid.deltaCents, 300);
  assert.equal(paid.remainderCents, 0);
  assert.equal(paid.closeOriginal, false);
});

test('commission reversal records one partial row, then one top-up, and does not pay the reversed portion twice', async () => {
  const rows: Array<Record<string, unknown>> = [{
    id: 'led_1',
    eventId: 'order_1_product_1',
    eventType: CommissionLedgerEventType.ORDER_PAID,
    affiliateId: 'aff_1',
    amountCents: 300,
    currency: 'eur',
    status: CommissionLedgerStatus.PENDING,
    availableAt: null,
    businessSubscriptionId: null,
    meta: { orderId: 'order_1' },
  }];
  const db = {
    commissionLedger: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        return rows.filter((row) => matches(row, where));
      },
      findUnique: async ({ where }: { where: { eventId?: string; id?: string } }) => {
        return rows.find((row) => row.eventId === where.eventId || row.id === where.id) ?? null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `row_${rows.length + 1}`, ...data };
        rows.push(row);
        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const row = rows.find((item) => item.id === where.id);
        if (!row) throw new Error('missing');
        Object.assign(row, data);
        return row;
      },
    },
  };

  const first = await processCommissionReversal({
    reversalEventId: 'ch_partial',
    eventType: 'REFUND',
    refundedAmountCents: 5000,
    chargeAmountCents: 10000,
    orderId: 'order_1',
    db: db as never,
  });
  assert.equal(first.reversedCount, 1);
  const reversal = rows.find((row) => row.eventId === 'ch_partial_led_1');
  assert.equal(reversal?.amountCents, -150);
  const remainder = rows.find((row) => String(row.eventId).startsWith('commission_keep_led_1_'));
  assert.equal(remainder?.amountCents, 150);
  assert.equal(rows.find((row) => row.id === 'led_1')?.status, CommissionLedgerStatus.REVERSED);

  const replay = await processCommissionReversal({
    reversalEventId: 'ch_partial',
    eventType: 'REFUND',
    refundedAmountCents: 5000,
    chargeAmountCents: 10000,
    orderId: 'order_1',
    db: db as never,
  });
  assert.equal(replay.reversedCount, 1);
  assert.equal(rows.filter((row) => Number(row.amountCents) < 0).length, 1);

  await processCommissionReversal({
    reversalEventId: 'ch_partial',
    eventType: 'REFUND',
    refundedAmountCents: 10000,
    chargeAmountCents: 10000,
    orderId: 'order_1',
    db: db as never,
  });
  const payable = rows.filter((row) => row.status === CommissionLedgerStatus.PENDING && Number(row.amountCents) > 0);
  assert.equal(payable.length, 0);
  const reversed = rows.filter((row) => Number(row.amountCents) < 0).reduce((sum, row) => sum + Number(row.amountCents), 0);
  assert.equal(reversed, -450);
});

test('a partial source-charge refund blocks a new courier transfer', () => {
  const partial = assessDeliverySourceCharge({
    chargeId: 'ch_partial',
    orderId: 'order_1',
    charge: {
      id: 'ch_partial',
      amount: 1040,
      amount_refunded: 100,
      currency: 'eur',
      status: 'succeeded',
      refunded: false,
    },
  });
  assert.equal(partial.ok, false);
  if (!partial.ok) assert.equal(partial.blockCode, 'SOURCE_CHARGE_PARTIALLY_REFUNDED');
});

test('an ambiguous courier obligation is manual review and does not create a reversal', async () => {
  const decisions: Array<Record<string, unknown>> = [];
  let reversals = 0;
  const db = {
    standaloneDeliveryRequest: {
      findUnique: async () => ({ id: 'req_1', deliveryOrderId: 'del_1', buyerTotalCents: 1040 }),
    },
    deliveryRefundDecision: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        decisions.push(data);
        return data;
      },
    },
    payout: { findUnique: async () => null },
    courierTransferObligation: {
      findFirst: async () => ({ state: 'UNKNOWN', stripeTransferId: null }),
    },
    deliveryOrder: { findUnique: async () => ({ id: 'del_1', status: 'DELIVERED', quotedFeeCents: 1000, deliveryFee: 1000, deliveryProfileId: 'prof_1' }) },
  };
  const observed = await observeStandaloneChargeRefund(db as never, {
    id: 'ch_unknown',
    amount: 1040,
    amount_refunded: 1040,
    currency: 'eur',
    metadata: { checkoutKind: 'STANDALONE_DELIVERY', standaloneRequestId: 'req_1' },
  }, undefined, {
    listReversals: async () => [],
    createReversal: async () => {
      reversals += 1;
      return { id: 'trr_should_not', amount: 1 };
    },
  });
  assert.equal(observed.handled, true);
  assert.equal(reversals, 0);
  assert.equal(decisions[0]?.stripeStatus, 'MANUAL');
});

test('operations monitoring distinguishes an empty obligation result from a failed query', async () => {
  const empty = await readMonitoredQuery(async () => []);
  assert.equal(empty.ready, true);
  assert.deepEqual(empty.rows, []);
  const populated = await readMonitoredQuery(async () => [{ state: 'REQUIRES_REVIEW' }]);
  assert.equal(populated.ready, true);
  assert.equal(populated.rows?.length, 1);
  for (const message of ['timeout', 'connect ECONNREFUSED', 'query failed']) {
    const failed = await readMonitoredQuery(async () => {
      throw new Error(message);
    });
    assert.equal(failed.ready, false);
    assert.equal(failed.rows, null);
  }
  assert.deepEqual(
    classifyDeliveryOperations({
      failedRepeated: 0,
      processingStale: 0,
      rejected: 0,
      payoutsMissingTransfer: 0,
      mapsRuntime: 'production',
      mapsPayable: true,
      courierObligationStoreReady: false,
    }),
    ['COURIER_OBLIGATION_STORE_UNAVAILABLE'],
  );
  const route = readFileSync(new URL('../../app/api/admin/delivery/operations/route.ts', import.meta.url), 'utf8');
  const guard = route.indexOf("await requireAdminPermission('canViewDeliveryDetails')");
  const query = route.indexOf('await readMonitoredQuery');
  assert.ok(guard >= 0 && guard < query);
  assert.equal(route.includes('courierTransferObligations = []'), false);
});

function matches(row: Record<string, unknown>, where: Record<string, unknown>) {
  const eventId = where.eventId as { startsWith?: string } | undefined;
  if (eventId?.startsWith && !String(row.eventId).startsWith(eventId.startsWith)) return false;
  const eventType = where.eventType as { in?: string[] } | undefined;
  if (eventType?.in && !eventType.in.includes(String(row.eventType))) return false;
  const meta = where.meta as { path?: string[]; equals?: unknown } | undefined;
  if (meta?.path?.[0] === 'originalLedgerId') {
    const record = row.meta as { originalLedgerId?: unknown } | null;
    if (record?.originalLedgerId !== meta.equals) return false;
  }
  if (meta?.path?.[0] === 'orderId') {
    const record = row.meta as { orderId?: unknown } | null;
    if (record?.orderId !== meta.equals) return false;
  }
  const or = where.OR as Array<Record<string, unknown>> | undefined;
  if (or && !or.some((item) => matches(row, item))) return false;
  return true;
}
