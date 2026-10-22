import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  affiliatePayoutIntentId,
  isPayableCommission,
  settleAffiliatePayout,
  type AffiliatePayoutStore,
  type PayableCommission,
  type PayoutRecord,
} from '@/lib/affiliate-payout-safety';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const READY = new Date('2026-05-01T00:00:00.000Z');

function row(id: string, amountCents: number, status = 'AVAILABLE', availableAt: Date | null = READY): PayableCommission {
  return { id, amountCents, status, availableAt, meta: {} };
}

function memory() {
  const payouts = new Map<string, PayoutRecord>();
  const owners = new Map<string, string>();
  const paid: string[] = [];
  let saveFailures = 0;
  const transfers: Array<{ id: string; key: string; amount: number }> = [];
  let failCreate: { error: Error; record: boolean } | null = null;
  const store: AffiliatePayoutStore = {
    findPayout: async (id) => payouts.get(id) ?? null,
    createPayout: async (input) => {
      if (payouts.has(input.id)) return 'exists';
      payouts.set(input.id, { id: input.id, status: 'CREATED', stripeTransferId: null, amountCents: input.amountCents });
      return 'created';
    },
    saveTransfer: async (id, stripeTransferId) => {
      if (saveFailures > 0) {
        saveFailures -= 1;
        throw new Error('database down');
      }
      const current = payouts.get(id);
      if (!current) throw new Error('missing payout');
      current.stripeTransferId = stripeTransferId;
      current.status = 'SENT';
    },
    markFailed: async (id) => {
      const current = payouts.get(id);
      if (current) current.status = 'FAILED';
    },
    claim: async (ids, intentId) => {
      if (ids.some((id) => owners.has(id) && owners.get(id) !== intentId)) return [];
      for (const id of ids) owners.set(id, intentId);
      return ids;
    },
    markPaid: async (ids, intentId, stripeTransferId) => {
      for (const id of ids) {
        if (owners.get(id) === intentId) paid.push(`${id}:${stripeTransferId}`);
      }
    },
  };
  return {
    payouts,
    owners,
    paid,
    transfers,
    store,
    failNextSave() { saveFailures += 1; },
    stripe: {
      findTransfer: async (intentId: string) => {
        const found = transfers.find((row) => row.key === intentId);
        return found ? { id: found.id } : null;
      },
      createTransfer: async (input: { amountCents: number; intentId: string; idempotencyKey: string }) => {
        if (failCreate) {
          const pending = failCreate;
          failCreate = null;
          if (pending.record) {
            const existing = transfers.find((row) => row.key === input.idempotencyKey);
            if (!existing) transfers.push({ id: `tr_${transfers.length + 1}`, key: input.idempotencyKey, amount: input.amountCents });
          }
          throw pending.error;
        }
        const existing = transfers.find((row) => row.key === input.idempotencyKey);
        if (existing) return { id: existing.id };
        const created = { id: `tr_${transfers.length + 1}`, key: input.idempotencyKey, amount: input.amountCents };
        transfers.push(created);
        return { id: created.id };
      },
    },
    failNextCreate(error: Error, record = false) { failCreate = { error, record }; },
  };
}

async function settle(env: ReturnType<typeof memory>, commissions: PayableCommission[], extra?: { resume?: boolean; destination?: string | null; onboarding?: boolean }) {
  return settleAffiliatePayout({
    affiliateId: 'aff_1',
    commissions,
    currency: 'eur',
    destinationAccountId: extra?.destination === undefined ? 'acct_1' : extra.destination,
    onboardingCompleted: extra?.onboarding !== false,
    periodStart: new Date('2026-05-01T00:00:00.000Z'),
    periodEnd: NOW,
    minimumCents: 1000,
    resume: extra?.resume === true,
    store: env.store,
    stripe: env.stripe,
  });
}

test('pending, immature, negative, and paid rows are not payable', () => {
  assert.equal(isPayableCommission(row('a', 1000, 'PENDING'), NOW), false);
  assert.equal(isPayableCommission(row('b', 1000, 'AVAILABLE', new Date('2026-07-01T00:00:00.000Z')), NOW), false);
  assert.equal(isPayableCommission(row('c', 999), NOW), true);
  assert.equal(isPayableCommission(row('d', -60), NOW), false);
  assert.equal(isPayableCommission(row('e', 1000, 'PAID'), NOW), false);
  assert.equal(isPayableCommission(row('f', 1000, 'REVERSED'), NOW), false);
});

test('balances below, at, and above 1000 cents follow the minimum', async () => {
  const below = memory();
  assert.equal((await settle(below, [row('a', 999)])).outcome, 'skipped');
  assert.equal(below.transfers.length, 0);
  const exact = memory();
  const exactResult = await settle(exact, [row('a', 600), row('b', 400)]);
  assert.equal(exactResult.outcome, 'paid');
  assert.equal(exact.transfers[0].amount, 1000);
  const above = memory();
  assert.equal((await settle(above, [row('a', 1001)])).stripeTransferId?.startsWith('tr_'), true);
});

test('one intent pays a bundle once under concurrency and replay', async () => {
  const env = memory();
  const rows = [row('a', 700), row('b', 500)];
  const intent = affiliatePayoutIntentId('aff_1', ['a', 'b']);
  const [first, second] = await Promise.all([settle(env, rows), settle(env, rows)]);
  assert.equal(first.intentId, intent);
  assert.equal(second.intentId, intent);
  assert.equal(first.stripeTransferId, second.stripeTransferId);
  assert.equal(env.transfers.length, 1);
  const replay = await settle(env, rows);
  assert.equal(replay.outcome, 'already_paid');
  assert.equal(replay.stripeTransferId, env.transfers[0].id);
  assert.equal(env.transfers.length, 1);
});

test('stripe failure keeps the commission claim and a timeout adopts the transfer', async () => {
  const failed = memory();
  failed.failNextCreate(Object.assign(new Error('balance'), { code: 'insufficient_funds' }));
  const failure = await settle(failed, [row('a', 1000)]);
  assert.equal(failure.outcome, 'failed');
  assert.equal(failed.transfers.length, 0);
  assert.equal(failed.payouts.get(failure.intentId || '')?.status, 'FAILED');
  assert.equal(failed.owners.get('a'), failure.intentId);
  assert.equal(failed.paid.length, 0);

  const timeout = memory();
  timeout.failNextCreate(new Error('timeout'), true);
  const adopted = await settle(timeout, [row('a', 1500)]);
  assert.equal(adopted.outcome, 'paid');
  assert.equal(timeout.transfers.length, 1);
  assert.equal(adopted.stripeTransferId, timeout.transfers[0].id);
  assert.equal(timeout.paid.length, 1);
});

test('a crash before or after the transfer does not pay twice', async () => {
  const before = memory();
  const rows = [row('a', 1000)];
  const intent = affiliatePayoutIntentId('aff_1', ['a']);
  await before.store.createPayout({
    id: intent,
    affiliateId: 'aff_1',
    amountCents: 1000,
    currency: 'eur',
    periodStart: NOW,
    periodEnd: NOW,
  });
  await before.store.claim(['a'], intent);
  const resumed = await settle(before, rows, { resume: true });
  assert.equal(resumed.outcome, 'paid');
  assert.equal(before.transfers.length, 1);

  const after = memory();
  after.failNextSave();
  after.failNextSave();
  await assert.rejects(() => settle(after, rows));
  assert.equal(after.transfers.length, 1);
  assert.equal(after.paid.length, 0);
  const recovered = await settle(after, rows);
  assert.equal(recovered.outcome, 'paid');
  assert.equal(after.transfers.length, 1);
  assert.equal(after.paid[0].endsWith(after.transfers[0].id), true);
});

test('a refund after payout does not erase the transfer', async () => {
  const env = memory();
  const original = await settle(env, [row('paid_row', 1200)]);
  const transferId = original.stripeTransferId;
  const refunded = await settle(env, [row('adjustment', -1200, 'AVAILABLE')]);
  assert.equal(refunded.outcome, 'skipped');
  assert.equal(env.payouts.get(original.intentId || '')?.stripeTransferId, transferId);
  assert.equal(env.transfers.length, 1);
});

test('an affiliate without a connect destination is not paid', async () => {
  const env = memory();
  const missing = await settle(env, [row('a', 2000)], { destination: null });
  const incomplete = await settle(env, [row('a', 2000)], { onboarding: false });
  assert.equal(missing.reason, 'connect');
  assert.equal(incomplete.reason, 'connect');
  assert.equal(env.transfers.length, 0);
  assert.equal(env.owners.size, 0);
});
