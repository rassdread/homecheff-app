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
import { assertMarketplaceHcOnlyCheckoutAllowed } from '@/lib/hc/marketplace-hc-pilot-gate';
import {
  createSettlementExposurePending,
  markSettlementExposureEarned,
  parseStoredHcFeeSnapshot,
  voidSettlementExposure,
} from '@/lib/hc/marketplace-hc-settlement-exposure';

const HC_FACE_CENTS_PER_HC = 1;

export function mapCategoryKey(category: string, marketplaceCategory?: string | null): string {
  const mc = (marketplaceCategory ?? '').toUpperCase();
  if (mc.includes('FOOD') || mc === 'GROW') return 'FOOD';
  if (category === 'CHEFF' || category === 'GROWN') return 'FOOD';
  return 'SERVICE';
}

export function geographyKey(input: {
  city?: string | null;
  postalCode?: string | null;
  placeName?: string | null;
  country?: string | null;
}): string {
  const city = (input.city ?? input.placeName ?? '').trim().toUpperCase();
  if (city) return city.replace(/\s+/g, '_');
  const postal = (input.postalCode ?? '').trim().toUpperCase();
  if (postal) return postal.slice(0, 4);
  return (input.country ?? 'NL').toUpperCase();
}

export async function resolveCentralUserId(localUserId: string): Promise<string | null> {
  const link = await prisma.authIdentityLink.findFirst({
    where: { sourceSystem: 'homecheff', sourceUserId: localUserId, status: 'linked' },
    select: { centralUserId: true },
  });
  return link?.centralUserId ?? localUserId;
}

export type ResolvedHcCheckoutContext = {
  centralUserId: string;
  buyerUserId: string;
  productId: string;
  quantity: number;
  orderTotalCents: number;
  requiredHc: number;
  trustedOrder: TrustedOrderPayload;
  sellerUserId: string;
  deliveryMode: 'PICKUP';
};

export async function resolveHcOnlyCheckoutContext(input: {
  buyerUserId: string;
  items: Array<{ productId: string; quantity: number }>;
}): Promise<ResolvedHcCheckoutContext | { error: string; code: string }> {
  if (input.items.length !== 1) {
    return { error: 'HC_ONLY pilot supports single-item checkout.', code: 'HC_ONLY_SINGLE_ITEM' };
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
  const orderTotalCents = product.priceCents * quantity;
  const requiredHc = Math.floor(orderTotalCents / HC_FACE_CENTS_PER_HC);
  const centralUserId = await resolveCentralUserId(input.buyerUserId);
  if (!centralUserId) return { error: 'Identity not linked.', code: 'IDENTITY_UNLINKED' };

  const sellerUser = product.seller?.User;
  const sellerUserId = product.seller?.userId ?? sellerUser?.id ?? '';
  const sellerCentralUserId = sellerUserId;

  try {
    assertMarketplaceHcOnlyCheckoutAllowed({ centralUserId, listingId: product.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg, code: 'HC_PILOT_DENIED' };
  }

  const orderId = crypto.randomUUID();
  const trustedOrder: TrustedOrderPayload = {
    orderId,
    listingId: product.id,
    sellerCentralUserId,
    merchantId: `MERCH_${sellerCentralUserId.replace(/-/g, '').slice(0, 16).toUpperCase()}`,
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
    requiredHc,
    trustedOrder,
    sellerUserId,
    deliveryMode: 'PICKUP',
  };
}

export async function createHcOnlyOrderWithReserve(ctx: ResolvedHcCheckoutContext) {
  const reserve = await growthReserveMarketplaceHc({
    centralUserId: ctx.centralUserId,
    trustedOrder: ctx.trustedOrder,
    amountHc: ctx.requiredHc,
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
    orderTotalCents: ctx.orderTotalCents,
    paymentMethod: 'HC_ONLY',
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

  if (fee?.engineLive && (!fee.ok || !fee.snapshot)) {
    await growthReleaseMarketplaceHc({
      centralUserId: ctx.centralUserId,
      orderId: ctx.trustedOrder.orderId,
      reservationId: reserve.reservationId,
      reason: 'ORDER_CREATE_FAILED',
    });
    return { ok: false as const, code: 'FEE_RESOLUTION_FAILED', message: 'Seller-program fee engine live but snapshot missing.' };
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
          paymentMethod: 'HC_ONLY',
          totalAmount: ctx.orderTotalCents,
          deliveryMode: 'PICKUP',
          stripeSessionId: null,
          paymentHeld: false,
          payoutTrigger: null,
          hcReservationId: reserve.reservationId,
          hcPaymentPhase: 'HC_RESERVED',
          buyerCentralUserId: ctx.centralUserId,
          platformFeeCollected: false,
          hcFeeSnapshot,
        },
      });
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          productId: ctx.productId,
          quantity: ctx.quantity,
          priceCents: Math.floor(ctx.orderTotalCents / ctx.quantity),
        },
      });
      return newOrder;
    });

    return {
      ok: true as const,
      orderId: order.id,
      reservationId: reserve.reservationId,
      duplicate: reserve.duplicate,
      requiredHc: ctx.requiredHc,
      remainingEurCents: 0,
    };
  } catch (e) {
    await growthRollbackMarketplaceFeeSnapshot(ctx.trustedOrder.orderId);
    await growthReleaseMarketplaceHc({
      centralUserId: ctx.centralUserId,
      orderId: ctx.trustedOrder.orderId,
      reservationId: reserve.reservationId,
      reason: 'ORDER_CREATE_FAILED',
    });
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false as const, code: 'ORDER_CREATE_FAILED', message: msg };
  }
}

export async function acceptHcOnlyOrder(orderId: string, sellerUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { Product: { select: { seller: { select: { userId: true } } } } } } },
  });
  if (!order || order.paymentMethod !== 'HC_ONLY') return { ok: false as const, code: 'NOT_HC_ORDER' };
  if (order.status !== 'PENDING') return { ok: false as const, code: 'INVALID_STATUS' };
  const isSeller = order.items.some((i) => i.Product.seller?.userId === sellerUserId);
  if (!isSeller) return { ok: false as const, code: 'NOT_SELLER' };

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CONFIRMED', hcPaymentPhase: 'ORDER_ACCEPTED' },
  });
  return { ok: true as const };
}

export async function rejectHcOnlyOrder(orderId: string, sellerUserId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { Product: { select: { seller: { select: { userId: true } } } } } } },
  });
  if (!order || order.paymentMethod !== 'HC_ONLY') return { ok: false as const, code: 'NOT_HC_ORDER' };
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) return { ok: false as const, code: 'INVALID_STATUS' };
  const isSeller = order.items.some((i) => i.Product.seller?.userId === sellerUserId);
  if (!isSeller) return { ok: false as const, code: 'NOT_SELLER' };
  if (!order.hcReservationId || !order.buyerCentralUserId) {
    return { ok: false as const, code: 'MISSING_HC_STATE' };
  }

  const release = await growthReleaseMarketplaceHc({
    centralUserId: order.buyerCentralUserId,
    orderId,
    reservationId: order.hcReservationId,
    reason: 'SELLER_REJECTED',
  });
  if (!release?.ok) {
    return { ok: false as const, code: release?.code ?? 'RELEASE_FAILED', message: release?.message };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED', hcPaymentPhase: 'RELEASED' },
  });
  await voidSettlementExposure(orderId);
  return { ok: true as const };
}

export async function fulfillHcOnlyOrderCapture(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== 'HC_ONLY') return { ok: false as const, code: 'NOT_HC_ORDER' };
  if (!order.hcReservationId || !order.buyerCentralUserId) {
    return { ok: false as const, code: 'MISSING_HC_STATE' };
  }
  if (order.hcPaymentPhase === 'HC_CAPTURED' || order.hcPaymentPhase === 'SETTLEMENT_EARNED') {
    return { ok: true as const, duplicate: true, capturedHc: order.hcCapturedHc ?? 0 };
  }
  if (order.hcPaymentPhase !== 'ORDER_ACCEPTED') {
    return { ok: false as const, code: 'INVALID_HC_PHASE' };
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
      hcCapturedHc: capture.capturedHc,
      hcPaymentPhase: 'HC_CAPTURED',
    },
  });

  const item = await prisma.orderItem.findFirst({ where: { orderId }, include: { Product: { select: { seller: { select: { userId: true } } } } } });
  const sellerUserId = item?.Product.seller?.userId ?? '';
  await createSettlementExposurePending({
    orderId,
    sellerUserId,
    buyerCentralUserId: order.buyerCentralUserId,
    hcCaptured: capture.capturedHc,
    grossOrderCents: order.totalAmount,
    feeSnapshot: parseStoredHcFeeSnapshot(order.hcFeeSnapshot),
  });
  await markSettlementExposureEarned(orderId);

  await prisma.order.update({
    where: { id: orderId },
    data: { hcPaymentPhase: 'SETTLEMENT_EARNED' },
  });

  return { ok: true as const, duplicate: capture.duplicate, capturedHc: capture.capturedHc };
}
