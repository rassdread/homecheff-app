/**
 * Mixed HC + EUR Marketplace checkout orchestration.
 * Underlying order value must meet €10 floor BEFORE HC (checkout-floor.ts).
 * Seller GMV remains full order; HC funds treasury leg; Stripe funds remainder only.
 */

import { prisma } from '@/lib/prisma';
import { OrderNumberGenerator } from '@/lib/orderNumberGenerator';
import {
  growthCaptureMarketplaceHc,
  growthReleaseMarketplaceHc,
  growthReserveMarketplaceHc,
  growthResolveMarketplaceFeeSnapshot,
  growthRollbackMarketplaceFeeSnapshot,
  type TrustedOrderPayload,
} from '@/lib/hc/growth-marketplace-mutation-client';
import { assertMarketplaceHcMixedCheckoutAllowed } from '@/lib/hc/marketplace-hc-pilot-gate';
import {
  createSettlementExposurePending,
  markSettlementExposureEarned,
  parseStoredHcFeeSnapshot,
} from '@/lib/hc/marketplace-hc-settlement-exposure';
import {
  geographyKey,
  mapCategoryKey,
  resolveCentralUserId,
} from '@/lib/hc/marketplace-hc-order-service';
import { evaluateCheckoutFloor } from '@/lib/marketplace/checkout-floor';
import {
  isLocalDeliveryMode,
  normalizeHcDeliveryMode,
} from '@/lib/hc/marketplace-hc-delivery-economics';

const HC_FACE_CENTS_PER_HC = 1;
export const HC_ECONOMIC_POLICY_VERSION = 'model_a_v1';

export type MixedHcCheckoutInput = {
  buyerUserId: string;
  items: Array<{ productId: string; quantity: number }>;
  requestedHc: number;
  deliveryFeeCents: number;
  smsNotificationCostCents?: number;
  deliveryMode: string;
};

export async function resolveMixedHcCheckoutContext(input: MixedHcCheckoutInput) {
  if (input.items.length !== 1) {
    return { error: 'Mixed HC checkout supports single-seller single-item carts in this phase.', code: 'HC_MIXED_SINGLE_ITEM' };
  }
  const item = input.items[0]!;
  const product = await prisma.product.findUnique({
    where: { id: item.productId },
    select: {
      id: true,
      priceCents: true,
      category: true,
      marketplaceCategory: true,
      placeName: true,
      isActive: true,
      seller: {
        select: {
          userId: true,
          User: { select: { id: true, city: true, postalCode: true, country: true } },
        },
      },
    },
  });
  if (!product?.isActive) return { error: 'Product not found or inactive.', code: 'PRODUCT_INACTIVE' };

  const quantity = Math.max(1, Math.floor(item.quantity));
  const productsTotalCents = product.priceCents * quantity;
  const deliveryFeeCents = Math.max(0, Math.floor(input.deliveryFeeCents));
  const smsCents = Math.max(0, Math.floor(input.smsNotificationCostCents ?? 0));
  const orderTotalCents = productsTotalCents + deliveryFeeCents + smsCents;

  const floor = evaluateCheckoutFloor({
    lineItems: [{ productId: product.id, quantity, unitPriceCents: product.priceCents }],
    deliveryFeeCents,
    smsNotificationCostCents: smsCents,
  });
  if (!floor.eligible) {
    return { error: 'Order below €10 minimum before HC.', code: 'CHECKOUT_MINIMUM_NOT_MET' };
  }

  const requestedHc = Math.max(0, Math.floor(input.requestedHc));
  if (requestedHc <= 0) {
    return { error: 'requestedHc must be > 0 for mixed path.', code: 'HC_AMOUNT_INVALID' };
  }

  const maxHcByOrder = Math.floor(orderTotalCents / HC_FACE_CENTS_PER_HC);
  if (requestedHc > maxHcByOrder) {
    return { error: 'requestedHc exceeds order face value.', code: 'HC_AMOUNT_EXCEEDS_ORDER' };
  }

  const remainingEurCents = orderTotalCents - requestedHc * HC_FACE_CENTS_PER_HC;
  if (remainingEurCents <= 0) {
    return { error: 'Use HC-only path for full HC payment.', code: 'USE_HC_ONLY_PATH' };
  }

  const centralUserId = await resolveCentralUserId(input.buyerUserId);
  if (!centralUserId) return { error: 'Identity not linked.', code: 'IDENTITY_UNLINKED' };

  const sellerUser = product.seller?.User;
  const sellerUserId = product.seller?.userId ?? sellerUser?.id ?? '';

  try {
    assertMarketplaceHcMixedCheckoutAllowed({ centralUserId, listingId: product.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg, code: 'HC_PILOT_DENIED' };
  }

  const orderId = crypto.randomUUID();
  let deliveryMode = normalizeHcDeliveryMode(input.deliveryMode);
  if (deliveryFeeCents > 0 && !isLocalDeliveryMode(deliveryMode) && deliveryMode !== 'SHIPPING') {
    deliveryMode = 'LOCAL_PROVIDER';
  }
  const orderDeliveryMode: 'PICKUP' | 'DELIVERY' | 'SHIPPING' =
    deliveryMode === 'LOCAL_PROVIDER' || deliveryMode === 'TEEN_DELIVERY'
      ? 'DELIVERY'
      : deliveryMode === 'SHIPPING'
        ? 'SHIPPING'
        : deliveryMode === 'PICKUP'
          ? 'PICKUP'
          : 'DELIVERY';

  const trustedOrder: TrustedOrderPayload = {
    orderId,
    listingId: product.id,
    sellerCentralUserId: sellerUserId,
    merchantId: `MERCH_${sellerUserId.replace(/-/g, '').slice(0, 16).toUpperCase()}`,
    categoryKey: mapCategoryKey(product.category, product.marketplaceCategory),
    geographyKey: geographyKey({
      city: sellerUser?.city,
      postalCode: sellerUser?.postalCode,
      placeName: product.placeName,
      country: sellerUser?.country,
    }),
    orderTotalCents,
  };

  return {
    centralUserId,
    buyerUserId: input.buyerUserId,
    productId: product.id,
    quantity,
    orderTotalCents,
    productsTotalCents,
    deliveryFeeCents,
    requestedHc,
    remainingEurCents,
    trustedOrder,
    sellerUserId,
    deliveryMode: orderDeliveryMode,
    localDeliveryMode: deliveryMode,
  };
}

export type MixedHcResolved = Exclude<
  Awaited<ReturnType<typeof resolveMixedHcCheckoutContext>>,
  { error: string; code: string }
>;

export async function createMixedHcOrderWithReserve(ctx: MixedHcResolved) {
  const reserve = await growthReserveMarketplaceHc({
    centralUserId: ctx.centralUserId,
    trustedOrder: ctx.trustedOrder,
    amountHc: ctx.requestedHc,
    billingMode: 'MIXED_HC_EUR',
  });

  if (!reserve) {
    return { ok: false as const, code: 'GROWTH_UNAVAILABLE', message: 'Growth HC mutation API unavailable.' };
  }
  if (!reserve.ok) {
    return { ok: false as const, code: reserve.code, message: reserve.message };
  }

  const fee = await growthResolveMarketplaceFeeSnapshot({
    orderId: ctx.trustedOrder.orderId,
    sellerCentralUserId: ctx.trustedOrder.sellerCentralUserId,
    // Seller GMV excludes courier delivery gross.
    orderTotalCents: ctx.productsTotalCents,
    paymentMethod: 'MIXED_HC_EUR',
    categoryKey: ctx.trustedOrder.categoryKey,
    geographyKey: ctx.trustedOrder.geographyKey,
    persist: true,
  });

  if (fee && fee.ok === false && fee.code !== 'GROWTH_UNAVAILABLE') {
    await growthReleaseMarketplaceHc({
      centralUserId: ctx.centralUserId,
      orderId: ctx.trustedOrder.orderId,
      reservationId: reserve.reservationId,
      reason: 'ORDER_CREATE_FAILED',
    });
    return { ok: false as const, code: fee.code ?? 'FEE_RESOLUTION_FAILED', message: fee.message ?? 'Fee resolution failed.' };
  }

  const hcFeeSnapshot = fee?.ok && fee.engineLive && fee.snapshot ? fee.snapshot : undefined;

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          id: ctx.trustedOrder.orderId,
          userId: ctx.buyerUserId,
          orderNumber: await OrderNumberGenerator.generateOrderNumber(),
          status: 'PENDING',
          paymentMethod: 'MIXED_HC_EUR',
          totalAmount: ctx.orderTotalCents,
          deliveryMode: ctx.deliveryMode,
          stripeSessionId: null,
          paymentHeld: true,
          payoutTrigger: null,
          hcReservationId: reserve.reservationId,
          hcPaymentPhase: 'HC_RESERVED',
          buyerCentralUserId: ctx.centralUserId,
          platformFeeCollected: false,
          hcFeeSnapshot,
          notes: JSON.stringify({
            economicPolicyVersion: HC_ECONOMIC_POLICY_VERSION,
            hcDeliveryPolicy: 'hc_full_delivery_v1',
            hcSelected: ctx.requestedHc,
            hcRedemptionCents: ctx.requestedHc * HC_FACE_CENTS_PER_HC,
            buyerStripeEurCents: ctx.remainingEurCents,
            treasuryFundedEurCents: ctx.requestedHc * HC_FACE_CENTS_PER_HC,
            paymentMode: 'MIXED',
            productsTotalCents: ctx.productsTotalCents,
            deliveryFeeCents: ctx.deliveryFeeCents,
            localDeliveryMode: ctx.localDeliveryMode,
          }),
        },
      });
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: ctx.productId,
          quantity: ctx.quantity,
          priceCents: Math.floor(ctx.productsTotalCents / ctx.quantity),
        },
      });
      return newOrder;
    });

    if (ctx.deliveryFeeCents > 0) {
      const { attachHcPaidDeliveryEconomics } = await import('@/lib/hc/marketplace-hc-delivery');
      await attachHcPaidDeliveryEconomics({
        orderId: order.id,
        buyerUserId: ctx.buyerUserId,
        deliveryFeeCents: ctx.deliveryFeeCents,
        deliveryMode: ctx.localDeliveryMode,
        quotedFeeCents: ctx.deliveryFeeCents,
      });
    }

    return {
      ok: true as const,
      orderId: order.id,
      reservationId: reserve.reservationId,
      remainingEurCents: ctx.remainingEurCents,
      requestedHc: ctx.requestedHc,
      orderTotalCents: ctx.orderTotalCents,
      duplicate: reserve.duplicate,
      economicPolicyVersion: HC_ECONOMIC_POLICY_VERSION,
    };
  } catch (e) {
    await growthRollbackMarketplaceFeeSnapshot(ctx.trustedOrder.orderId);
    await growthReleaseMarketplaceHc({
      centralUserId: ctx.centralUserId,
      orderId: ctx.trustedOrder.orderId,
      reservationId: reserve.reservationId,
      reason: 'ORDER_CREATE_FAILED',
    });
    return { ok: false as const, code: 'ORDER_CREATE_FAILED', message: e instanceof Error ? e.message : String(e) };
  }
}

/** After Stripe cash leg succeeds: capture HC + earn settlement exposure (treasury funds seller). */
export async function finalizeMixedHcAfterStripePaid(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== 'MIXED_HC_EUR') {
    return { ok: false as const, code: 'NOT_MIXED_ORDER' };
  }
  if (!order.hcReservationId || !order.buyerCentralUserId) {
    return { ok: false as const, code: 'MISSING_HC_STATE' };
  }
  if (order.hcPaymentPhase === 'HC_CAPTURED' || order.hcPaymentPhase === 'SETTLEMENT_EARNED') {
    return { ok: true as const, duplicate: true, capturedHc: order.hcCapturedHc ?? 0 };
  }

  const capture = await growthCaptureMarketplaceHc({
    centralUserId: order.buyerCentralUserId,
    orderId,
    reservationId: order.hcReservationId,
  });
  if (!capture?.ok) {
    await prisma.order.update({
      where: { id: orderId },
      data: { hcPaymentPhase: 'FAILED' },
    });
    return { ok: false as const, code: capture?.code ?? 'CAPTURE_FAILED', message: capture?.message };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CONFIRMED',
      paymentHeld: false,
      hcCapturedHc: capture.capturedHc,
      hcPaymentPhase: 'HC_CAPTURED',
    },
  });

  const item = await prisma.orderItem.findFirst({
    where: { orderId },
    include: { Product: { select: { seller: { select: { userId: true } } } } },
  });
  const sellerUserId = item?.Product.seller?.userId ?? '';
  await createSettlementExposurePending({
    orderId,
    sellerUserId,
    buyerCentralUserId: order.buyerCentralUserId,
    hcCaptured: capture.capturedHc,
    grossOrderCents: parseStoredHcFeeSnapshot(order.hcFeeSnapshot)?.orderTotalCents ?? order.totalAmount,
    feeSnapshot: parseStoredHcFeeSnapshot(order.hcFeeSnapshot),
  });
  await markSettlementExposureEarned(orderId);

  await prisma.order.update({
    where: { id: orderId },
    data: { hcPaymentPhase: 'SETTLEMENT_EARNED' },
  });

  return { ok: true as const, duplicate: capture.duplicate, capturedHc: capture.capturedHc };
}

export async function releaseMixedHcReservation(orderId: string, reason: 'BUYER_CANCELLED' | 'ORDER_CREATE_FAILED' | 'ADMIN_CANCELLED') {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== 'MIXED_HC_EUR') return { ok: false as const, code: 'NOT_MIXED_ORDER' };
  if (!order.hcReservationId || !order.buyerCentralUserId) return { ok: false as const, code: 'MISSING_HC_STATE' };
  if (order.hcPaymentPhase === 'HC_CAPTURED' || order.hcPaymentPhase === 'SETTLEMENT_EARNED') {
    return { ok: false as const, code: 'ALREADY_CAPTURED' };
  }
  if (order.hcPaymentPhase === 'RELEASED') return { ok: true as const, duplicate: true };

  const release = await growthReleaseMarketplaceHc({
    centralUserId: order.buyerCentralUserId,
    orderId,
    reservationId: order.hcReservationId,
    reason,
  });
  if (!release?.ok) {
    return { ok: false as const, code: release?.code ?? 'RELEASE_FAILED', message: release?.message };
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', hcPaymentPhase: 'RELEASED', paymentHeld: false },
  });
  return { ok: true as const, duplicate: release.duplicate };
}
