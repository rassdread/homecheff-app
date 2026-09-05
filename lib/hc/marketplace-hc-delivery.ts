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
}): Promise<{
  ok: true;
  affiliateBaseCents: number;
  skipped?: boolean;
  resolverSource?: 'ECOSYSTEM' | 'MARKETPLACE_ATTRIBUTION' | 'NONE';
  affiliateEventId?: string;
}> {
  const fee = Math.max(0, Math.floor(input.deliveryFeeCents));
  const platformFee = deliveryPlatformFeeCents(fee);
  if (platformFee <= 0) {
    return { ok: true, affiliateBaseCents: 0, skipped: true, resolverSource: 'NONE' };
  }

  const split = splitDeliveryCommission(fee);
  const sourceTransactionId = `${input.orderId}_delivery_${input.deliveryOrderId}`;

  // 1) Canonical ecosystem attribution on BUYER (one HomeCheff referral → eligible Delivery fee).
  const {
    resolveActiveEcosystemAttribution,
    recordDeliveryPlatformFeeEcosystemCommission,
  } = await import('@/lib/affiliates/ecosystem-attribution-bridge');
  const { resolveDeliveryFeeAffiliateSides } = await import(
    '@/lib/affiliates/cross-ecosystem-attribution-precedence'
  );

  const [buyerEco, providerEco] = await Promise.all([
    resolveActiveEcosystemAttribution({ referredUserId: input.buyerUserId }),
    resolveActiveEcosystemAttribution({ referredUserId: input.providerUserId }),
  ]);

  // Legacy Marketplace Attribution (fallback only) — read without accruing yet.
  const { prisma: db } = await import('@/lib/prisma');
  const now = new Date();
  const [buyerLocal, providerLocal] = await Promise.all([
    db.attribution.findFirst({
      where: {
        userId: input.buyerUserId,
        type: 'USER_SIGNUP',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: { affiliateId: true },
    }),
    db.attribution.findFirst({
      where: {
        userId: input.providerUserId,
        type: 'USER_SIGNUP',
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      select: { affiliateId: true },
    }),
  ]);

  const sides = resolveDeliveryFeeAffiliateSides({
    buyer: {
      side: 'BUYER',
      ecosystemAffiliateCentralUserId: buyerEco.found
        ? buyerEco.attribution?.affiliateCentralUserId ?? null
        : null,
      ecosystemAttributionId: buyerEco.found ? buyerEco.attribution?.id ?? null : null,
      referralOriginPlatform: buyerEco.found
        ? buyerEco.attribution?.sourcePlatform ?? null
        : null,
      marketplaceAffiliateId: buyerLocal?.affiliateId ?? null,
    },
    provider: {
      side: 'SELLER',
      ecosystemAffiliateCentralUserId: providerEco.found
        ? providerEco.attribution?.affiliateCentralUserId ?? null
        : null,
      ecosystemAttributionId: providerEco.found ? providerEco.attribution?.id ?? null : null,
      referralOriginPlatform: providerEco.found
        ? providerEco.attribution?.sourcePlatform ?? null
        : null,
      marketplaceAffiliateId: providerLocal?.affiliateId ?? null,
    },
  });

  if (sides.buyerSource === 'ECOSYSTEM' && sides.buyerAffiliateKey) {
    const eco = await recordDeliveryPlatformFeeEcosystemCommission({
      referredUserId: input.buyerUserId,
      sourceTransactionId,
      deliveryPlatformFeeCents: platformFee,
      deliveryFeeGrossCents: fee,
      orderId: input.orderId,
      deliveryOrderId: input.deliveryOrderId,
      providerUserId: input.providerUserId,
    });
    if (eco.ok) {
      return {
        ok: true,
        affiliateBaseCents: platformFee,
        resolverSource: 'ECOSYSTEM',
        affiliateEventId: eco.eventId,
      };
    }
    console.warn(
      `[delivery-affiliate] ecosystem accrue failed (${eco.code}); falling back to Marketplace Attribution`,
    );
  }

  if (sides.providerSource === 'ECOSYSTEM' && sides.providerAffiliateKey && !sides.buyerAffiliateKey) {
    const eco = await recordDeliveryPlatformFeeEcosystemCommission({
      referredUserId: input.providerUserId,
      sourceTransactionId,
      deliveryPlatformFeeCents: platformFee,
      deliveryFeeGrossCents: fee,
      orderId: input.orderId,
      deliveryOrderId: input.deliveryOrderId,
      providerUserId: input.providerUserId,
    });
    if (eco.ok) {
      return {
        ok: true,
        affiliateBaseCents: platformFee,
        resolverSource: 'ECOSYSTEM',
        affiliateEventId: eco.eventId,
      };
    }
  }

  // 2) Legacy Marketplace Attribution path (historical MP-only relationships).
  const { processCommissionForOrder } = await import('@/lib/affiliate-commission');
  await processCommissionForOrder(
    sourceTransactionId,
    platformFee,
    input.buyerUserId,
    input.providerUserId,
    {
      revenueType: 'DELIVERY_PLATFORM_FEE',
      courierPrincipalCents: String(split.providerNetPayoutCents),
      deliveryFeeCents: String(fee),
      paymentMethodNeutral: 'true',
      hcDeliveryPolicy: HC_DELIVERY_POLICY_VERSION,
      attributionResolver: 'MARKETPLACE_ATTRIBUTION_FALLBACK',
    },
  );

  const hadLegacy = Boolean(sides.buyerAffiliateKey || sides.providerAffiliateKey);
  return {
    ok: true,
    affiliateBaseCents: platformFee,
    resolverSource: hadLegacy ? 'MARKETPLACE_ATTRIBUTION' : 'NONE',
  };
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
