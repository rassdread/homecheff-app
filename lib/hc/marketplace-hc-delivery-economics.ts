/**
 * Pure HC × Delivery economics (no Prisma).
 */

import {
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';

export const HC_DELIVERY_POLICY_VERSION = 'hc_full_delivery_v1';

export type CheckoutAmountSplit = {
  productsTotalCents: number;
  deliveryFeeCents: number;
  smsCents: number;
  orderTotalCents: number;
  sellerGmvCents: number;
  providerPrincipalCents: number;
  homeCheffDeliveryFeeCents: number;
};

export function splitCheckoutAmounts(input: {
  productsTotalCents: number;
  deliveryFeeCents?: number;
  smsNotificationCostCents?: number;
}): CheckoutAmountSplit {
  const productsTotalCents = Math.max(0, Math.floor(input.productsTotalCents));
  const deliveryFeeCents = Math.max(0, Math.floor(input.deliveryFeeCents ?? 0));
  const smsCents = Math.max(0, Math.floor(input.smsNotificationCostCents ?? 0));
  const orderTotalCents = productsTotalCents + deliveryFeeCents + smsCents;
  const split = splitDeliveryCommission(deliveryFeeCents);
  return {
    productsTotalCents,
    deliveryFeeCents,
    smsCents,
    orderTotalCents,
    sellerGmvCents: productsTotalCents,
    providerPrincipalCents: split.providerNetPayoutCents,
    homeCheffDeliveryFeeCents: split.platformCommissionCents,
  };
}

export function isLocalDeliveryMode(mode: string | null | undefined): boolean {
  const m = (mode || '').toUpperCase();
  return (
    m === 'DELIVERY' ||
    m === 'LOCAL_PROVIDER' ||
    m === 'TEEN_DELIVERY' ||
    m === 'LOCAL_DELIVERY'
  );
}

export function normalizeHcDeliveryMode(mode: string | null | undefined): string {
  const m = (mode || 'PICKUP').toUpperCase();
  if (m === 'TEEN_DELIVERY' || m === 'LOCAL_DELIVERY') return 'LOCAL_PROVIDER';
  if (
    m === 'PICKUP' ||
    m === 'DELIVERY' ||
    m === 'SHIPPING' ||
    m === 'LOCAL_PROVIDER'
  ) {
    return m;
  }
  return 'PICKUP';
}

export function deliveryPlatformFeeCents(deliveryFeeCents: number): number {
  return Math.round(
    (Math.max(0, Math.floor(deliveryFeeCents)) * DELIVERY_PLATFORM_FEE_PERCENT) / 100,
  );
}

export { splitDeliveryCommission };
