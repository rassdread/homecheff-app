/**
 * Admin recovery of a failed webhook.
 * The event is retrieved from Stripe. The stored receipt has no payload.
 * Live events are refused unless recovery is explicitly enabled.
 * A processed or rejected receipt is not run again.
 */

const EVENT_ID = /^evt_[A-Za-z0-9]+$/;
export const WEBHOOK_RECOVERY_HOURLY_LIMIT = 5;

export type RecoveryReceipt = {
  eventId: string;
  eventType: string;
  livemode: boolean;
  status: string;
};

export type RetrievedStripeEvent = {
  id: string;
  type: string;
  livemode: boolean;
};

export type RecoveryBlockCode =
  | 'EVENT_ID_INVALID'
  | 'RECEIPT_MISSING'
  | 'NOT_FAILED'
  | 'LIVEMODE_RECOVERY_DISABLED'
  | 'RATE_LIMITED'
  | 'RETRIEVE_FAILED'
  | 'EVENT_MISMATCH'
  | 'IN_FLIGHT';

export function assessWebhookRecovery(input: {
  eventId: string;
  receipt: RecoveryReceipt | null;
  retrieved?: RetrievedStripeEvent | null;
  recentAttemptCount: number;
  livemodeRecoveryEnabled: boolean;
}): { ok: true } | { ok: false; code: RecoveryBlockCode } {
  if (!EVENT_ID.test(input.eventId)) return { ok: false, code: 'EVENT_ID_INVALID' };
  if (!input.receipt || input.receipt.eventId !== input.eventId) {
    return { ok: false, code: 'RECEIPT_MISSING' };
  }
  if (input.receipt.status !== 'FAILED') return { ok: false, code: 'NOT_FAILED' };
  if (input.receipt.livemode && !input.livemodeRecoveryEnabled) {
    return { ok: false, code: 'LIVEMODE_RECOVERY_DISABLED' };
  }
  if (input.recentAttemptCount >= WEBHOOK_RECOVERY_HOURLY_LIMIT) {
    return { ok: false, code: 'RATE_LIMITED' };
  }
  if (input.retrieved === undefined) return { ok: true };
  if (!input.retrieved) return { ok: false, code: 'RETRIEVE_FAILED' };
  const matches =
    input.retrieved.id === input.receipt.eventId &&
    input.retrieved.type === input.receipt.eventType &&
    input.retrieved.livemode === input.receipt.livemode;
  if (!matches) return { ok: false, code: 'EVENT_MISMATCH' };
  return { ok: true };
}

export async function recoverFailedStripeEvent<TEvent extends RetrievedStripeEvent>(input: {
  eventId: string;
  livemodeRecoveryEnabled: boolean;
  recentAttemptCount: number;
  receipt: RecoveryReceipt | null;
  retrieve: (eventId: string) => Promise<TEvent | null>;
  dispatch: (event: TEvent) => Promise<{ status: number }>;
  recordAttempt: (result: string) => Promise<void>;
  begin: () => Promise<'PROCESS' | 'SKIP' | 'IN_FLIGHT'>;
  finish: (httpStatus: number) => Promise<void>;
}): Promise<{ httpStatus: number; code: string; dispatched: boolean }> {
  const request = assessWebhookRecovery({
    eventId: input.eventId,
    receipt: input.receipt,
    recentAttemptCount: input.recentAttemptCount,
    livemodeRecoveryEnabled: input.livemodeRecoveryEnabled,
  });
  if (!request.ok) {
    await input.recordAttempt(request.code);
    return { httpStatus: request.code === 'EVENT_ID_INVALID' ? 400 : 409, code: request.code, dispatched: false };
  }

  let retrieved: TEvent | null = null;
  try {
    retrieved = await input.retrieve(input.eventId);
  } catch {
    retrieved = null;
  }
  const checked = assessWebhookRecovery({
    eventId: input.eventId,
    receipt: input.receipt,
    retrieved,
    recentAttemptCount: input.recentAttemptCount,
    livemodeRecoveryEnabled: input.livemodeRecoveryEnabled,
  });
  if (!checked.ok || !retrieved) {
    const code = checked.ok ? 'RETRIEVE_FAILED' : checked.code;
    await input.recordAttempt(code);
    return { httpStatus: code === 'RETRIEVE_FAILED' ? 502 : 409, code, dispatched: false };
  }

  const action = await input.begin();
  if (action !== 'PROCESS') {
    const code = action === 'IN_FLIGHT' ? 'IN_FLIGHT' : 'NOT_FAILED';
    await input.recordAttempt(code);
    return { httpStatus: action === 'SKIP' ? 200 : 409, code, dispatched: false };
  }

  let status = 500;
  try {
    const response = await input.dispatch(retrieved);
    status = response.status;
  } catch {
    status = 500;
  }
  await input.finish(status);
  const code = status >= 200 && status < 300 ? 'RECOVERED' : 'HANDLER_FAILED';
  await input.recordAttempt(code);
  return { httpStatus: status, code, dispatched: true };
}
