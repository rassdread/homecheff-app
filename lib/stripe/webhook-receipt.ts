export type WebhookReceiptStatus = 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'REJECTED';

export type WebhookReceiptRow = {
  eventId: string;
  eventType: string;
  livemode: boolean;
  status: WebhookReceiptStatus;
  httpStatus: number | null;
  attemptCount: number;
  updatedAt: Date;
};

export type WebhookReceiptStore = {
  find(eventId: string): Promise<WebhookReceiptRow | null>;
  insert(row: WebhookReceiptRow): Promise<'created' | 'conflict'>;
  update(
    eventId: string,
    patch: Partial<Pick<WebhookReceiptRow, 'status' | 'httpStatus' | 'attemptCount' | 'updatedAt'>>,
  ): Promise<void>;
};

export type WebhookReceiptAction = 'PROCESS' | 'SKIP' | 'IN_FLIGHT';

const IN_FLIGHT_MS = 5 * 60_000;

export async function beginStripeWebhookReceipt(
  store: WebhookReceiptStore,
  input: { eventId: string; eventType: string; livemode: boolean; now?: Date },
): Promise<{ action: WebhookReceiptAction }> {
  const now = input.now ?? new Date();
  const existing = await store.find(input.eventId);
  if (!existing) {
    const inserted = await store.insert({
      eventId: input.eventId,
      eventType: input.eventType,
      livemode: input.livemode,
      status: 'PROCESSING',
      httpStatus: null,
      attemptCount: 1,
      updatedAt: now,
    });
    if (inserted === 'created') return { action: 'PROCESS' };
    const raced = await store.find(input.eventId);
    if (!raced) return { action: 'PROCESS' };
    return decideExisting(store, raced, now);
  }
  return decideExisting(store, existing, now);
}

async function decideExisting(
  store: WebhookReceiptStore,
  row: WebhookReceiptRow,
  now: Date,
): Promise<{ action: WebhookReceiptAction }> {
  if (row.status === 'PROCESSED' || row.status === 'REJECTED') {
    return { action: 'SKIP' };
  }
  const age = now.getTime() - row.updatedAt.getTime();
  if (row.status === 'PROCESSING' && age >= 0 && age < IN_FLIGHT_MS) {
    return { action: 'IN_FLIGHT' };
  }
  await store.update(row.eventId, {
    status: 'PROCESSING',
    attemptCount: row.attemptCount + 1,
    updatedAt: now,
  });
  return { action: 'PROCESS' };
}

export function receiptStatusForHttp(httpStatus: number): WebhookReceiptStatus {
  if (httpStatus >= 200 && httpStatus < 300) return 'PROCESSED';
  if (httpStatus >= 500) return 'FAILED';
  return 'REJECTED';
}

export async function finishStripeWebhookReceipt(
  store: WebhookReceiptStore,
  input: { eventId: string; httpStatus: number; now?: Date },
): Promise<void> {
  await store.update(input.eventId, {
    status: receiptStatusForHttp(input.httpStatus),
    httpStatus: input.httpStatus,
    updatedAt: input.now ?? new Date(),
  });
}
