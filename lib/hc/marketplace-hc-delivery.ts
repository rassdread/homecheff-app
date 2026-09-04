/**
 * Marketplace HC × Delivery: attach DeliveryOrder + affiliate for HC/mixed checkouts.
 */

import { prisma } from '@/lib/prisma';
import {
  HC_DELIVERY_POLICY_VERSION,
  deliveryPlatformFeeCents,
  isLocalDeliveryMode,
  splitDeliveryCommission,
} from '@/lib/hc/marketplace-hc-delivery-economics';
import { ensureDeliveryPayout } from '@/lib/delivery/delivery-payout';

export {
  HC_DELIVERY_POLICY_VERSION,
  isLocalDeliveryMode,
  normalizeHcDeliveryMode,
  splitCheckoutAmounts,
  splitDeliveryCommission,
} from '@/lib/hc/marketplace-hc-delivery-economics';

export async function ensureHcCheckoutDeliveryOrder(input: {
  orderId: string;
  deliveryFeeCents: number;
  deliveryMode: string;
  deliveryAddress?: string | null;
  deliveryProfileId?: string | null;
  quotedFeeCents?: number | null;
  providerDisplayNameSnapshot?: string | null;
  pricingSource?: string | null;
  pricingFormulaVersion?: string | null;
}): Promise<{ deliveryOrderId: string; created: boolean } | null> {
  const fee = Math.max(0, Math.floor(input.deliveryFeeCents));
  if (fee <= 0 || !isLocalDeliveryMode(input.deliveryMode)) {
    return null;
  }

  const existing = await prisma.deliveryOrder.findUnique({
    where: { orderId: input.orderId },
    select: { id: true },
  });
  if (existing) {
    return { deliveryOrderId: existing.id, created: false };
  }

  const quoted = Math.max(
    0,
    Math.floor(
      typeof input.quotedFeeCents === 'number' ? input.quotedFeeCents : fee,
    ),
  );

  const created = await prisma.deliveryOrder.create({
    data: {
      orderId: input.orderId,
      deliveryProfileId: input.deliveryProfileId || null,
      deliveryAddress: input.deliveryAddress || '',
      deliveryFee: quoted,
      quotedFeeCents: quoted,
      providerDisplayNameSnapshot: input.providerDisplayNameSnapshot || null,
      pricingSource: input.pricingSource || 'HC_CHECKOUT',
      pricingFormulaVersion: input.pricingFormulaVersion || HC_DELIVERY_POLICY_VERSION,
      status: input.deliveryProfileId ? 'ACCEPTED' : 'PENDING',
      notes: JSON.stringify({
        hcDeliveryPolicy: HC_DELIVERY_POLICY_VERSION,
        paymentAgnostic: true,
      }),
    },
  });

  return { deliveryOrderId: created.id, created: true };
}

export async function accrueHcDeliveryPlatformFeeAffiliate(input: {
  orderId: string;
  deliveryOrderId: string;
  deliveryFeeCents: number;
  buyerUserId: string;
  providerUserId: string;
}): Promise<{ ok: true; affiliateBaseCents: number; skipped?: boolean }> {
  const fee = Math.max(0, Math.floor(input.deliveryFeeCents));
  const platformFee = deliveryPlatformFeeCents(fee);
  if (platformFee <= 0) {
    return { ok: true, affiliateBaseCents: 0, skipped: true };
  }

  const split = splitDeliveryCommission(fee);
  const { processCommissionForOrder } = await import('@/lib/affiliate-commission');
  await processCommissionForOrder(
    `${input.orderId}_delivery_${input.deliveryOrderId}`,
    platformFee,
    input.buyerUserId,
    input.providerUserId,
    {
      revenueType: 'DELIVERY_PLATFORM_FEE',
      courierPrincipalCents: String(split.providerNetPayoutCents),
      deliveryFeeCents: String(fee),
      paymentMethodNeutral: 'true',
      hcDeliveryPolicy: HC_DELIVERY_POLICY_VERSION,
    },
  );

  return { ok: true, affiliateBaseCents: platformFee };
}

export async function attachHcPaidDeliveryEconomics(input: {
  orderId: string;
  buyerUserId: string;
  deliveryFeeCents: number;
  deliveryMode: string;
  deliveryAddress?: string | null;
  deliveryProfileId?: string | null;
  quotedFeeCents?: number | null;
}): Promise<{
  ok: true;
  deliveryOrderId: string | null;
  affiliateBaseCents: number;
  providerPrincipalCents: number;
}> {
  const ensured = await ensureHcCheckoutDeliveryOrder(input);
  if (!ensured) {
    return {
      ok: true,
      deliveryOrderId: null,
      affiliateBaseCents: 0,
      providerPrincipalCents: 0,
    };
  }

  const deliveryOrder = await prisma.deliveryOrder.findUnique({
    where: { id: ensured.deliveryOrderId },
    include: {
      deliveryProfile: { select: { userId: true } },
    },
  });

  const fee = Math.max(
    0,
    Math.floor(
      deliveryOrder?.quotedFeeCents ??
        input.quotedFeeCents ??
        input.deliveryFeeCents,
    ),
  );
  const split = splitDeliveryCommission(fee);

  let affiliateBaseCents = 0;
  const providerUserId = deliveryOrder?.deliveryProfile?.userId;
  if (providerUserId && fee > 0) {
    const aff = await accrueHcDeliveryPlatformFeeAffiliate({
      orderId: input.orderId,
      deliveryOrderId: ensured.deliveryOrderId,
      deliveryFeeCents: fee,
      buyerUserId: input.buyerUserId,
      providerUserId,
    });
    affiliateBaseCents = aff.affiliateBaseCents;
  }

  return {
    ok: true,
    deliveryOrderId: ensured.deliveryOrderId,
    affiliateBaseCents,
    providerPrincipalCents: split.providerNetPayoutCents,
  };
}

export { ensureDeliveryPayout };
