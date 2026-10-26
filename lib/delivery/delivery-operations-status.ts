/**
 * Operational signals for the delivery admin view.
 * Counts and ids only. No webhook payload and no payment secrets.
 */

export type DeliveryOpsAlert =
  | 'WEBHOOK_FAILED_REPEATED'
  | 'WEBHOOK_PROCESSING_STALE'
  | 'WEBHOOK_REJECTED'
  | 'WEBHOOK_RECEIPT_STORE_UNAVAILABLE'
  | 'PAYOUT_MISSING_TRANSFER'
  | 'COURIER_TRANSFER_NEEDS_REVIEW'
  | 'MAPS_PRODUCTION_NOT_READY';

const EVENT_ID = /^evt_[A-Za-z0-9]+$/;

export function boundedOpsLimit(value: string | null, fallback = 25, max = 50): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(max, parsed);
}

export function courierObligationNextAction(state: string): string {
  if (state === 'UNKNOWN') return 'Reconcile Stripe evidence. Do not create another transfer.';
  if (state === 'REQUIRES_REVIEW') return 'Review the recipient, amount, and existing Stripe transfer. Do not create another transfer.';
  if (state === 'PROCESSING') return 'Wait for the current attempt to finish or for its lease to expire, then reconcile.';
  if (state === 'FAILED') return 'Inspect the failure. A new transfer requires reconciliation, not another automatic create.';
  if (state === 'CONFIRMED') return 'No action. The transfer is recorded.';
  return 'Reconcile before any payout.';
}

export function opsCursor(value: string | null): string | null {
  if (!value || !EVENT_ID.test(value)) return null;
  return value;
}

export function classifyDeliveryOperations(input: {
  failedRepeated: number;
  processingStale: number;
  rejected: number;
  payoutsMissingTransfer: number;
  courierTransfersNeedingReview?: number;
  mapsRuntime: 'production' | 'non_production';
  mapsPayable: boolean;
  receiptStoreReady?: boolean;
}): DeliveryOpsAlert[] {
  const alerts: DeliveryOpsAlert[] = [];
  if (input.receiptStoreReady === false) alerts.push('WEBHOOK_RECEIPT_STORE_UNAVAILABLE');
  if (input.failedRepeated > 0) alerts.push('WEBHOOK_FAILED_REPEATED');
  if (input.processingStale > 0) alerts.push('WEBHOOK_PROCESSING_STALE');
  if (input.rejected > 0) alerts.push('WEBHOOK_REJECTED');
  if (input.payoutsMissingTransfer > 0) alerts.push('PAYOUT_MISSING_TRANSFER');
  if ((input.courierTransfersNeedingReview ?? 0) > 0) alerts.push('COURIER_TRANSFER_NEEDS_REVIEW');
  if (input.mapsRuntime === 'production' && !input.mapsPayable) alerts.push('MAPS_PRODUCTION_NOT_READY');
  return alerts;
}
