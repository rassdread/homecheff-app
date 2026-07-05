/**
 * Product ↔ proposal binding — prefill, validation, stock, payment paths.
 */
import { prisma } from '@/lib/prisma';
import {
  canPurchaseViaHomecheff,
  hasPublicDisplayPrice,
  sellerPaymentsReady,
  type SellerPaymentsUser,
} from '@/lib/product/order-method';
import {
  legacyDeliveryToFulfillment,
} from '@/lib/marketplace/fulfillment';
import {
  parseFulfillmentOptions,
  type FulfillmentOptions,
} from '@/lib/marketplace/listing-taxonomy';
import { allowedFulfillmentTypes } from './proposal-fulfillment-utils';
import type { ProposalFulfillmentType } from '@prisma/client';

export type ProposalPaymentPath =
  | 'HOMECHEFF_CHECKOUT'
  | 'DIRECT_CONTACT'
  | 'NONE';

export type ProductProposalContext = {
  id: string;
  title: string;
  priceCents: number;
  priceModel: string;
  stock: number;
  maxStock: number | null;
  availableStock: number | null;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  acceptedSpecializations: string[];
  barterOpenness: string | null;
  delivery: string;
  fulfillmentOptions: FulfillmentOptions;
  sellerUser: SellerPaymentsUser;
  canHomeCheffCheckout: boolean;
  homeCheffCheckoutBlockedReason: string | null;
};

export async function resolveConversationProductId(
  conversationId: string,
  explicitProductId?: string | null,
): Promise<string | null> {
  if (explicitProductId?.trim()) return explicitProductId.trim();
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { contextType: true, contextId: true, productId: true },
  });
  if (!conversation) return null;
  if (conversation.productId) return conversation.productId;
  if (conversation.contextType === 'PRODUCT' && conversation.contextId) {
    return conversation.contextId;
  }
  return null;
}

export async function loadProductProposalContext(
  productId: string,
): Promise<ProductProposalContext | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      priceCents: true,
      priceModel: true,
      stock: true,
      maxStock: true,
      acceptHomeCheffPayment: true,
      acceptDirectContact: true,
      orderMethod: true,
      acceptedSpecializations: true,
      barterOpenness: true,
      delivery: true,
      fulfillmentOptions: true,
      seller: {
        select: {
          user: {
            select: {
              stripeConnectAccountId: true,
              stripeConnectOnboardingCompleted: true,
            },
          },
        },
      },
    },
  });
  if (!product) return null;

  const reserved = await prisma.stockReservation.aggregate({
    where: {
      productId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    _sum: { quantity: true },
  });
  const reservedQty = reserved._sum.quantity ?? 0;
  const totalStock =
    typeof product.stock === 'number'
      ? product.stock
      : typeof product.maxStock === 'number'
        ? product.maxStock
        : null;
  const availableStock =
    totalStock != null ? Math.max(0, totalStock - reservedQty) : null;

  const sellerUser = product.seller.user;
  const acceptsHomeCheff =
    product.acceptHomeCheffPayment &&
    product.orderMethod !== 'CONTACT';
  const stripeReady = sellerPaymentsReady(sellerUser);
  const canHomeCheffCheckout =
    acceptsHomeCheff &&
    hasPublicDisplayPrice(product) &&
    stripeReady &&
    canPurchaseViaHomecheff(product, sellerUser);

  const fulfillmentOptions = product.fulfillmentOptions
    ? parseFulfillmentOptions(product.fulfillmentOptions)
    : legacyDeliveryToFulfillment(product.delivery);

  return {
    id: product.id,
    title: product.title,
    priceCents: product.priceCents,
    priceModel: product.priceModel,
    stock: product.stock,
    maxStock: product.maxStock,
    availableStock,
    acceptHomeCheffPayment: acceptsHomeCheff,
    acceptDirectContact:
      product.acceptDirectContact || product.orderMethod === 'CONTACT',
    acceptedSpecializations: product.acceptedSpecializations ?? [],
    barterOpenness: product.barterOpenness,
    delivery: product.delivery,
    fulfillmentOptions,
    sellerUser,
    canHomeCheffCheckout,
    homeCheffCheckoutBlockedReason: acceptsHomeCheff && !stripeReady
      ? 'proposal.productBinding.paymentsRequired'
      : null,
  };
}

export { allowedFulfillmentTypes } from './proposal-fulfillment-utils';

export function validateProposalQuantityAgainstStock(
  availableStock: number | null,
  quantity: number | null | undefined,
): { ok: true } | { ok: false; errorKey: string; available?: number } {
  if (availableStock == null) return { ok: true };
  const qty = quantity ?? 1;
  if (qty < 1) {
    return { ok: false, errorKey: 'proposal.errors.quantityRequired' };
  }
  if (availableStock <= 0) {
    return {
      ok: false,
      errorKey: 'proposal.productBinding.outOfStock',
      available: 0,
    };
  }
  if (qty > availableStock) {
    return {
      ok: false,
      errorKey: 'proposal.productBinding.exceedsStock',
      available: availableStock,
    };
  }
  return { ok: true };
}

export function validateFulfillmentForProduct(
  productCtx: ProductProposalContext,
  fulfillmentType: string | null | undefined,
): { ok: true } | { ok: false; errorKey: string } {
  if (!fulfillmentType) return { ok: true };
  const allowed = allowedFulfillmentTypes(productCtx.fulfillmentOptions);
  if (!allowed.includes(fulfillmentType as ProposalFulfillmentType)) {
    return { ok: false, errorKey: 'proposal.productBinding.fulfillmentNotOffered' };
  }
  return { ok: true };
}

export function parsePaymentPath(raw: unknown): ProposalPaymentPath {
  const key = String(raw ?? 'NONE').trim().toUpperCase();
  if (key === 'HOMECHEFF_CHECKOUT') return 'HOMECHEFF_CHECKOUT';
  if (key === 'DIRECT_CONTACT') return 'DIRECT_CONTACT';
  return 'NONE';
}

export function validatePaymentPath(input: {
  paymentPath: ProposalPaymentPath;
  settlementMode: string;
  productCtx: ProductProposalContext | null;
}): { ok: true } | { ok: false; errorKey: string } {
  const { paymentPath, settlementMode, productCtx } = input;
  const moneyLeg =
    settlementMode === 'MONEY' || settlementMode === 'MONEY_AND_VALUE';

  if (!moneyLeg) {
    if (paymentPath === 'HOMECHEFF_CHECKOUT') {
      return { ok: false, errorKey: 'proposal.productBinding.checkoutNotApplicable' };
    }
    return { ok: true };
  }

  if (paymentPath === 'HOMECHEFF_CHECKOUT') {
    if (!productCtx?.acceptHomeCheffPayment) {
      return { ok: false, errorKey: 'proposal.productBinding.checkoutNotAllowed' };
    }
    if (!productCtx.canHomeCheffCheckout) {
      return { ok: false, errorKey: 'proposal.productBinding.paymentsRequired' };
    }
    return { ok: true };
  }

  if (paymentPath === 'DIRECT_CONTACT') {
    if (productCtx && !productCtx.acceptDirectContact) {
      return { ok: false, errorKey: 'proposal.productBinding.directContactNotAllowed' };
    }
    return { ok: true };
  }

  if (moneyLeg && paymentPath === 'NONE') {
    return { ok: false, errorKey: 'proposal.productBinding.paymentPathRequired' };
  }

  return { ok: true };
}

export function defaultPaymentPath(input: {
  settlementMode: string;
  productCtx: ProductProposalContext | null;
}): ProposalPaymentPath {
  const moneyLeg =
    input.settlementMode === 'MONEY' ||
    input.settlementMode === 'MONEY_AND_VALUE';
  if (!moneyLeg) return 'NONE';
  if (input.productCtx?.canHomeCheffCheckout) return 'HOMECHEFF_CHECKOUT';
  if (input.productCtx?.acceptDirectContact) return 'DIRECT_CONTACT';
  return 'NONE';
}

export async function decrementProductStockOnAccept(
  tx: Pick<typeof prisma, 'product' | 'stockReservation'>,
  productId: string,
  quantity: number,
): Promise<void> {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { stock: true, maxStock: true },
  });
  if (!product) return;

  const totalStock =
    typeof product.stock === 'number'
      ? product.stock
      : typeof product.maxStock === 'number'
        ? product.maxStock
        : null;
  if (totalStock == null) return;

  const updated = await tx.product.updateMany({
    where: { id: productId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity } },
  });
  if (updated.count !== 1) {
    throw new Error('STOCK_DECREMENT_FAILED');
  }
}
