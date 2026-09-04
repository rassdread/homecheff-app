/**
 * Pure HC Delivery refund helpers (no Prisma) — economics + durable notes marker.
 */

import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';

export const HC_DELIVERY_REFUND_MARKER = 'hcDeliveryRefund' as const;

export type HcDeliveryRefundMarker = {
  status:
    | 'COMPLETE'
    | 'PROVIDER_REVERSED'
    | 'AFFILIATE_REVERSED'
    | 'RECOVERY_REQUIRED'
    | 'FAILED';
  at: string;
  deliveryOrderId: string;
  deliveryGrossCents: number;
  providerPrincipalCents: number;
  homeCheffFeeCents: number;
  providerMode:
    | 'NONE'
    | 'CANCELLED_UNEARNED'
    | 'LEDGER_CLAWBACK'
    | 'STRIPE_TRANSFER_REVERSAL'
    | 'RECOVERY_REQUIRED';
  providerReversalId: string | null;
  affiliateReversed: boolean;
  affiliateAlreadyDone: boolean;
  error?: string;
};

function parseNotes(raw: string | null | undefined): Record<string, unknown> {
  if (!raw?.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function readHcDeliveryRefundMarker(
  notes: string | null | undefined
): HcDeliveryRefundMarker | null {
  const obj = parseNotes(notes);
  const raw = obj[HC_DELIVERY_REFUND_MARKER];
  if (!raw || typeof raw !== 'object') return null;
  return raw as HcDeliveryRefundMarker;
}

export function mergeHcDeliveryRefundNotes(
  existingNotes: string | null | undefined,
  marker: HcDeliveryRefundMarker
): string {
  return JSON.stringify({
    ...parseNotes(existingNotes),
    [HC_DELIVERY_REFUND_MARKER]: marker,
  });
}

/** Pure snapshot economics for refund certification / admin preview. */
export function deliveryRefundEconomicsFromGross(deliveryGrossCents: number): {
  deliveryGrossCents: number;
  providerPrincipalCents: number;
  homeCheffFeeCents: number;
} {
  const g = Math.max(0, Math.floor(deliveryGrossCents));
  const split = splitDeliveryCommission(g);
  return {
    deliveryGrossCents: g,
    providerPrincipalCents: split.providerNetPayoutCents,
    homeCheffFeeCents: split.platformCommissionCents,
  };
}
