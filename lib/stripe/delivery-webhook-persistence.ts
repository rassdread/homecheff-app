/**
 * Every webhook needs a stored receipt before it is acknowledged.
 * A missing or unfinished receipt returns HTTP 500 so Stripe retries.
 * Product checkout is included. It is not acknowledged as processed.
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

export function isDeliveryFinancialEvent(event: DeliveryWebhookEventLike): boolean {
  const metadata = event.data?.object?.metadata ?? {};
  if (metadata.checkoutKind === 'STANDALONE_DELIVERY') return true;
  if (metadata.deliveryProfileId || metadata.deliveryOrderId) return true;
  const purpose = metadata.purpose ?? '';
  return purpose.startsWith('delivery_');
}

export function isStandaloneDeliveryFinancialEvent(event: DeliveryWebhookEventLike): boolean {
  return event.data?.object?.metadata?.checkoutKind === 'STANDALONE_DELIVERY';
}

export function receiptUnavailableDecision(event: DeliveryWebhookEventLike): ReceiptUnavailableDecision {
  void event;
  return 'FAIL_CLOSED';
}

export function statusAfterReceiptFinish(input: {
  deliveryFinancial: boolean;
  handlerStatus: number;
  receiptFinished: boolean;
}): number {
  if (!input.receiptFinished) return 500;
  return input.handlerStatus;
}

export function isMissingDatabaseRelation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String((error as { code?: unknown }).code ?? '') : '';
  if (code === 'P2021' || code === 'P2022') return true;
  const message = error instanceof Error ? error.message : '';
  return /does not exist/i.test(message);
}
