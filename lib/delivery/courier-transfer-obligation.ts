/**
 * One courier transfer obligation per delivery order and source charge.
 * A failed Stripe lookup is not proof that no transfer exists.
 * The idempotency key never includes a timestamp or a retry count.
 */

import type Stripe from 'stripe';

export const COURIER_TRANSFER_PURPOSE = 'delivery_provider_principal';
export const COURIER_TRANSFER_LEASE_MS = 2 * 60 * 1000;
const LIST_LIMIT = 20;
const WAIT_FOR_OWNER_MS = 50;
const WAIT_FOR_OWNER_ATTEMPTS = 40;

export type CourierObligationState =
  | 'PENDING'
  | 'PROCESSING'
  | 'CONFIRMED'
  | 'UNKNOWN'
  | 'FAILED'
  | 'REQUIRES_REVIEW';

export type CourierObligationRow = {
  id: string;
  deliveryOrderId: string;
  chargeId: string;
  purpose: string;
  idempotencyKey: string;
  state: CourierObligationState | string;
  amountCents: number;
  currency: string;
  destinationConnectAccountId: string;
  recipientUserId: string;
  transferGroup: string;
  stripeTransferId: string | null;
  stripeCreateAttemptedAt: Date | null;
  processingLeaseUntil: Date | null;
  processingOwner: string | null;
  lastErrorCode: string | null;
};

type ListedTransfer = {
  id?: string | null;
  amount?: number | null;
  currency?: string | null;
  reversed?: boolean | null;
  destination?: string | { id?: string | null } | null;
  metadata?: Record<string, string | null> | null;
};

export type TransferLookup =
  | { ok: true; found: { id: string } | null }
  | { ok: false; code: 'LOOKUP_TIMEOUT' | 'LOOKUP_AUTH' | 'LOOKUP_RATE_LIMIT' | 'LOOKUP_FAILED' | 'LOOKUP_INCOMPLETE' };

type ObligationDb = {
  courierTransferObligation: {
    findUnique: (args: { where: Record<string, unknown> }) => Promise<CourierObligationRow | null>;
    create: (args: { data: Record<string, unknown> }) => Promise<CourierObligationRow>;
    update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<CourierObligationRow>;
    updateMany: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => Promise<{ count: number }>;
  };
};

export function courierTransferIdempotencyKey(deliveryOrderId: string, chargeId: string): string {
  return `homecheff:delivery:courier-transfer:${deliveryOrderId}:${chargeId}:v1`;
}

export function classifyTransferList(input: {
  data: ListedTransfer[] | null | undefined;
  hasMore?: boolean;
  limit?: number;
  deliveryOrderId: string;
  amountCents: number;
  currency: string;
  destinationAccountId: string;
}): TransferLookup {
  const data = input.data ?? [];
  const limit = input.limit ?? LIST_LIMIT;
  const match = data.find((transfer) => {
    const purpose = transfer.metadata?.purpose;
    const destination = typeof transfer.destination === 'string'
      ? transfer.destination
      : transfer.destination?.id;
    return Boolean(
      transfer.id?.startsWith('tr_') &&
      transfer.reversed !== true &&
      transfer.amount === input.amountCents &&
      (transfer.currency || 'eur').toLowerCase() === input.currency.toLowerCase() &&
      transfer.metadata?.deliveryOrderId === input.deliveryOrderId &&
      (!purpose || purpose === COURIER_TRANSFER_PURPOSE) &&
      (!destination || destination === input.destinationAccountId),
    );
  });
  if (match?.id) return { ok: true, found: { id: match.id } };
  if (input.hasMore === true) return { ok: false, code: 'LOOKUP_INCOMPLETE' };
  if (input.hasMore == null && data.length >= limit) return { ok: false, code: 'LOOKUP_INCOMPLETE' };
  return { ok: true, found: null };
}

export function classifyLookupFailure(error: unknown): Exclude<TransferLookup, { ok: true }>['code'] {
  const record = error && typeof error === 'object' ? error as { statusCode?: number; code?: string; type?: string; message?: string } : {};
  const message = `${record.message || ''} ${error instanceof Error ? error.message : ''}`.toLowerCase();
  const status = record.statusCode;
  if (status === 401 || status === 403 || message.includes('api key') || message.includes('authentication')) {
    return 'LOOKUP_AUTH';
  }
  if (status === 429 || message.includes('rate limit')) return 'LOOKUP_RATE_LIMIT';
  if (record.code === 'ETIMEDOUT' || message.includes('timeout') || message.includes('timed out')) {
    return 'LOOKUP_TIMEOUT';
  }
  return 'LOOKUP_FAILED';
}

function isUniqueConflict(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as { code?: string }).code === 'P2002');
}

function parameterConflict(row: CourierObligationRow, input: {
  amountCents: number;
  currency: string;
  destinationAccountId: string;
  recipientUserId: string;
}): string | null {
  if (row.amountCents !== input.amountCents) return 'TRANSFER_AMOUNT_CHANGED';
  if (row.currency.toLowerCase() !== input.currency.toLowerCase()) return 'TRANSFER_CURRENCY_CHANGED';
  if (row.destinationConnectAccountId !== input.destinationAccountId) return 'TRANSFER_DESTINATION_CHANGED';
  if (row.recipientUserId !== input.recipientUserId) return 'TRANSFER_RECIPIENT_CHANGED';
  return null;
}

async function readObligation(db: ObligationDb, deliveryOrderId: string, chargeId: string) {
  return db.courierTransferObligation.findUnique({
    where: {
      deliveryOrderId_chargeId_purpose: {
        deliveryOrderId,
        chargeId,
        purpose: COURIER_TRANSFER_PURPOSE,
      },
    },
  });
}

async function mark(db: ObligationDb, id: string, data: Record<string, unknown>) {
  return db.courierTransferObligation.update({ where: { id }, data });
}

export async function settleCourierTransferObligation(input: {
  db: ObligationDb;
  stripe: Stripe;
  deliveryOrderId: string;
  orderId: string;
  chargeId: string;
  amountCents: number;
  currency: string;
  destinationAccountId: string;
  recipientUserId: string;
  now?: Date;
}): Promise<{ created: boolean; transferId: string | null; state: CourierObligationState; blockCode?: string }> {
  const now = input.now ?? new Date();
  const idempotencyKey = courierTransferIdempotencyKey(input.deliveryOrderId, input.chargeId);
  const transferGroup = `order_${input.orderId}`;
  let row: CourierObligationRow | null = null;
  try {
    row = await readObligation(input.db, input.deliveryOrderId, input.chargeId);
    if (!row) {
      row = await input.db.courierTransferObligation.create({
        data: {
          deliveryOrderId: input.deliveryOrderId,
          chargeId: input.chargeId,
          purpose: COURIER_TRANSFER_PURPOSE,
          idempotencyKey,
          state: 'PENDING',
          amountCents: input.amountCents,
          currency: input.currency.toLowerCase(),
          destinationConnectAccountId: input.destinationAccountId,
          recipientUserId: input.recipientUserId,
          transferGroup,
          stripeTransferId: null,
          stripeCreateAttemptedAt: null,
          processingLeaseUntil: null,
          processingOwner: null,
          lastErrorCode: null,
        },
      });
    }
  } catch (error) {
    if (!isUniqueConflict(error)) {
      return { created: false, transferId: null, state: 'FAILED', blockCode: 'RESERVATION_FAILED' };
    }
    row = await readObligation(input.db, input.deliveryOrderId, input.chargeId);
  }
  if (!row) return { created: false, transferId: null, state: 'FAILED', blockCode: 'RESERVATION_FAILED' };

  const conflict = parameterConflict(row, input);
  if (conflict) {
    await mark(input.db, row.id, { state: 'REQUIRES_REVIEW', lastErrorCode: conflict });
    return { created: false, transferId: row.stripeTransferId, state: 'REQUIRES_REVIEW', blockCode: conflict };
  }
  if (row.stripeTransferId?.startsWith('tr_') || row.state === 'CONFIRMED') {
    return { created: false, transferId: row.stripeTransferId, state: 'CONFIRMED' };
  }

  const owner = crypto.randomUUID();
  const leaseUntil = new Date(now.getTime() + COURIER_TRANSFER_LEASE_MS);
  const claimed = await input.db.courierTransferObligation.updateMany({
    where: {
      id: row.id,
      stripeTransferId: null,
      stripeCreateAttemptedAt: null,
      OR: [
        { state: { in: ['PENDING', 'FAILED', 'UNKNOWN'] } },
        { state: 'PROCESSING', processingLeaseUntil: { lt: now } },
      ],
    },
    data: {
      state: 'PROCESSING',
      processingOwner: owner,
      processingLeaseUntil: leaseUntil,
      lastErrorCode: null,
    },
  });
  if (claimed.count !== 1) {
    const current = await waitForConfirmed(input.db, input.deliveryOrderId, input.chargeId);
    if (current?.stripeTransferId?.startsWith('tr_') || current?.state === 'CONFIRMED') {
      return { created: false, transferId: current.stripeTransferId, state: 'CONFIRMED' };
    }
    if (current?.state === 'REQUIRES_REVIEW') {
      return { created: false, transferId: current.stripeTransferId, state: 'REQUIRES_REVIEW', blockCode: current.lastErrorCode || 'TRANSFER_REQUIRES_REVIEW' };
    }
    if (current?.stripeCreateAttemptedAt) {
      return reconcileAttempt(input, current);
    }
    return {
      created: false,
      transferId: null,
      state: 'PROCESSING',
      blockCode: 'TRANSFER_IN_FLIGHT',
    };
  }

  const lookup = await lookupTransfers(input);
  if (!lookup.ok) {
    await mark(input.db, row.id, { state: 'UNKNOWN', lastErrorCode: lookup.code, processingLeaseUntil: null });
    return { created: false, transferId: null, state: 'UNKNOWN', blockCode: lookup.code };
  }
  if (lookup.found) {
    await mark(input.db, row.id, {
      state: 'CONFIRMED',
      stripeTransferId: lookup.found.id,
      lastErrorCode: null,
      processingLeaseUntil: null,
    });
    return { created: false, transferId: lookup.found.id, state: 'CONFIRMED' };
  }

  await mark(input.db, row.id, { stripeCreateAttemptedAt: now });
  try {
    const transfer = await input.stripe.transfers.create(
      {
        amount: input.amountCents,
        currency: input.currency.toLowerCase(),
        destination: input.destinationAccountId,
        transfer_group: transferGroup,
        source_transaction: input.chargeId,
        metadata: {
          orderId: input.orderId,
          deliveryOrderId: input.deliveryOrderId,
          purpose: COURIER_TRANSFER_PURPOSE,
          providerUserId: input.recipientUserId,
          sourceTransactionChargeId: input.chargeId,
        },
      },
      { idempotencyKey },
    );
    if (!transfer.id?.startsWith('tr_')) {
      await mark(input.db, row.id, { state: 'UNKNOWN', lastErrorCode: 'TRANSFER_ID_MISSING', processingLeaseUntil: null });
      return { created: false, transferId: null, state: 'UNKNOWN', blockCode: 'TRANSFER_ID_MISSING' };
    }
    try {
      await mark(input.db, row.id, {
        state: 'CONFIRMED',
        stripeTransferId: transfer.id,
        lastErrorCode: null,
        processingLeaseUntil: null,
      });
    } catch {
      return { created: true, transferId: transfer.id, state: 'UNKNOWN', blockCode: 'TRANSFER_RECORD_FAILED' };
    }
    return { created: true, transferId: transfer.id, state: 'CONFIRMED' };
  } catch (error) {
    const code = classifyCreateFailure(error);
    const state: CourierObligationState = code === 'INSUFFICIENT_BALANCE' ? 'FAILED' : 'UNKNOWN';
    await mark(input.db, row.id, { state, lastErrorCode: code, processingLeaseUntil: null });
    return { created: false, transferId: null, state, blockCode: code };
  }
}

async function reconcileAttempt(
  input: Parameters<typeof settleCourierTransferObligation>[0],
  row: CourierObligationRow,
): Promise<{ created: boolean; transferId: string | null; state: CourierObligationState; blockCode?: string }> {
  const lookup = await lookupTransfers(input);
  if (!lookup.ok) {
    await mark(input.db, row.id, { state: 'UNKNOWN', lastErrorCode: lookup.code });
    return { created: false, transferId: null, state: 'UNKNOWN', blockCode: lookup.code };
  }
  if (lookup.found) {
    await mark(input.db, row.id, { state: 'CONFIRMED', stripeTransferId: lookup.found.id, lastErrorCode: null });
    return { created: false, transferId: lookup.found.id, state: 'CONFIRMED' };
  }
  await mark(input.db, row.id, { state: 'REQUIRES_REVIEW', lastErrorCode: 'TRANSFER_NOT_FOUND_AFTER_ATTEMPT' });
  return { created: false, transferId: null, state: 'REQUIRES_REVIEW', blockCode: 'TRANSFER_NOT_FOUND_AFTER_ATTEMPT' };
}

async function lookupTransfers(input: Parameters<typeof settleCourierTransferObligation>[0]): Promise<TransferLookup> {
  try {
    const listed = await input.stripe.transfers.list({
      transfer_group: `order_${input.orderId}`,
      limit: LIST_LIMIT,
    });
    return classifyTransferList({
      data: listed.data,
      hasMore: listed.has_more,
      deliveryOrderId: input.deliveryOrderId,
      amountCents: input.amountCents,
      currency: input.currency,
      destinationAccountId: input.destinationAccountId,
    });
  } catch (error) {
    return { ok: false, code: classifyLookupFailure(error) };
  }
}

function classifyCreateFailure(error: unknown): string {
  const record = error && typeof error === 'object' ? error as { statusCode?: number; message?: string } : {};
  const message = `${record.message || ''} ${error instanceof Error ? error.message : ''}`.toLowerCase();
  if (message.includes('insufficient')) return 'INSUFFICIENT_BALANCE';
  const status = record.statusCode;
  if (status != null && status >= 400 && status < 500 && !message.includes('idempoten')) return 'TRANSFER_REJECTED';
  return 'TRANSFER_OUTCOME_UNKNOWN';
}

async function waitForConfirmed(db: ObligationDb, deliveryOrderId: string, chargeId: string) {
  let current = await readObligation(db, deliveryOrderId, chargeId);
  for (let attempt = 0; attempt < WAIT_FOR_OWNER_ATTEMPTS; attempt += 1) {
    if (!current) return current;
    if (current.stripeTransferId?.startsWith('tr_') || current.state === 'CONFIRMED') return current;
    const leaseOpen = current.state === 'PROCESSING'
      && current.processingLeaseUntil
      && current.processingLeaseUntil.getTime() > Date.now();
    if (!leaseOpen && (current.stripeCreateAttemptedAt || current.state === 'REQUIRES_REVIEW' || current.state === 'FAILED' || current.state === 'UNKNOWN')) {
      return current;
    }
    await new Promise((resolve) => setTimeout(resolve, WAIT_FOR_OWNER_MS));
    current = await readObligation(db, deliveryOrderId, chargeId);
  }
  return current;
}

export function createMemoryCourierTransferObligation() {
  const rows: CourierObligationRow[] = [];
  function find(where: Record<string, unknown>): CourierObligationRow | undefined {
    return rows.find((row) => matches(row, where));
  }
  function matches(row: CourierObligationRow, where: Record<string, unknown>): boolean {
    const alternatives = where.OR as Array<Record<string, unknown>> | undefined;
    if (alternatives?.length) {
      const rest = { ...where };
      delete rest.OR;
      return alternatives.some((branch) => matches(row, { ...rest, ...branch }));
    }
    const compound = where.deliveryOrderId_chargeId_purpose as {
      deliveryOrderId?: string;
      chargeId?: string;
      purpose?: string;
    } | undefined;
    if (where.id && row.id !== where.id) return false;
    if (where.idempotencyKey && row.idempotencyKey !== where.idempotencyKey) return false;
    if (compound) {
      if (row.deliveryOrderId !== compound.deliveryOrderId) return false;
      if (row.chargeId !== compound.chargeId) return false;
      if (row.purpose !== compound.purpose) return false;
    }
    const state = where.state as { in?: string[] } | string | undefined;
    if (typeof state === 'string' && row.state !== state) return false;
    if (state && typeof state === 'object' && state.in && !state.in.includes(row.state)) return false;
    if ('stripeTransferId' in where && where.stripeTransferId === null && row.stripeTransferId != null) return false;
    if ('stripeCreateAttemptedAt' in where && where.stripeCreateAttemptedAt === null && row.stripeCreateAttemptedAt != null) return false;
    const lease = where.processingLeaseUntil as { lt?: Date } | undefined;
    if (lease?.lt) {
      if (!row.processingLeaseUntil || row.processingLeaseUntil.getTime() >= lease.lt.getTime()) return false;
    }
    return true;
  }
  return {
    rows,
    async findUnique({ where }: { where: Record<string, unknown> }) {
      return find(where) ?? null;
    },
    async create({ data }: { data: Record<string, unknown> }) {
      const duplicate = rows.some((row) =>
        (row.deliveryOrderId === data.deliveryOrderId && row.chargeId === data.chargeId && row.purpose === data.purpose)
        || row.idempotencyKey === data.idempotencyKey,
      );
      if (duplicate) {
        const error = new Error('Unique constraint failed');
        (error as { code?: string }).code = 'P2002';
        throw error;
      }
      const row = {
        id: `obl_${rows.length + 1}`,
        stripeTransferId: null,
        stripeCreateAttemptedAt: null,
        processingLeaseUntil: null,
        processingOwner: null,
        lastErrorCode: null,
        ...data,
      } as CourierObligationRow;
      rows.push(row);
      return row;
    },
    async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
      const row = rows.find((item) => item.id === where.id);
      if (!row) throw new Error('missing obligation');
      Object.assign(row, data);
      return row;
    },
    async updateMany({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      const row = find(where);
      if (!row) return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    },
  };
}
