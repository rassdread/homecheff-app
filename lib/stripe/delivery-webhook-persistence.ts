/**
 * Standalone Delivery money events need a webhook receipt before they run.
 * Marketplace checkout does not use this gate, so a missing receipt table
 * does not stop an existing product payment.
 * A missing receipt is not a successful Delivery acknowledgment. Stripe retries a 500.
 */

export type DeliveryWebhookEventLike = {
  type: string;
  data?: {
    object?: {
      metadata?: Record<string, string | null> | null;
    } | null;
  } | null;
};

export type ReceiptUnavailableDecision = 'FAIL_CLOSED' | 'CONTINUE_MARKETPLACE';

export function isStandaloneDeliveryFinancialEvent(event: DeliveryWebhookEventLike): boolean {
  return event.data?.object?.metadata?.checkoutKind === 'STANDALONE_DELIVERY';
}

export function receiptUnavailableDecision(event: DeliveryWebhookEventLike): ReceiptUnavailableDecision {
  return isStandaloneDeliveryFinancialEvent(event) ? 'FAIL_CLOSED' : 'CONTINUE_MARKETPLACE';
}

export function statusAfterReceiptFinish(input: {
  standaloneDelivery: boolean;
  handlerStatus: number;
  receiptFinished: boolean;
}): number {
  if (input.standaloneDelivery && !input.receiptFinished) return 500;
  return input.handlerStatus;
}

export function isMissingDatabaseRelation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  if (code === 'P2021' || code === 'P2022') return true;
  const message = error instanceof Error ? error.message : '';
  return /does not exist/i.test(message);
}
