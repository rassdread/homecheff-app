import { prisma } from '@/lib/prisma';
import { resolveConversationContext } from '@/lib/communication/resolveConversationContext';
import type { ConversationContextType } from '@prisma/client';
import {
  legacyDeliveryToFulfillment,
} from '@/lib/marketplace/fulfillment';
import {
  parseFulfillmentOptions,
  type FulfillmentOptions,
} from '@/lib/marketplace/listing-taxonomy';
import {
  canPurchaseViaHomecheff,
  sellerPaymentsReady,
} from '@/lib/product/order-method';
import type { ProposalPaymentPath } from '@/lib/proposals/proposal-product-binding';

export type ConversationHeaderProduct = {
  id: string;
  title: string;
  priceCents: number;
  priceModel: string | null;
  category: string | null;
  marketplaceCategory: import('@prisma/client').MarketplaceCategory | null;
  delivery: string | null;
  imageUrl: string | null;
  href: string;
  canCheckout: boolean;
  acceptedSpecializations: string[];
  barterOpenness: string | null;
  stock: number;
  maxStock: number | null;
  availableStock: number | null;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  canHomeCheffCheckout: boolean;
  homeCheffCheckoutBlockedReason: string | null;
  fulfillmentOptions: FulfillmentOptions;
  defaultPaymentPath: ProposalPaymentPath;
};

export type ConversationHeaderOrder = {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number;
  href: string;
};

export type ConversationHeaderGeneral = {
  peerName: string;
  peerUsername: string | null;
  peerAvatar: string | null;
  peerHref: string | null;
};

export type ConversationHeaderFuture = {
  contextType: ConversationContextType;
  title: string;
  subtitle: string;
};

export type ResolvedConversationHeader =
  | { kind: 'PRODUCT'; product: ConversationHeaderProduct }
  | { kind: 'ORDER'; order: ConversationHeaderOrder }
  | { kind: 'GENERAL'; general: ConversationHeaderGeneral }
  | { kind: 'FUTURE'; future: ConversationHeaderFuture };

type LoadHeaderInput = {
  conversationId: string;
  currentUserId: string;
  peer?: {
    id: string;
    name?: string | null;
    username?: string | null;
    profileImage?: string | null;
  } | null;
};

const PRODUCT_SELECT = {
  id: true,
  title: true,
  priceCents: true,
  priceModel: true,
  category: true,
  marketplaceCategory: true,
  delivery: true,
  orderMethod: true,
  isActive: true,
  stock: true,
  maxStock: true,
  acceptHomeCheffPayment: true,
  acceptDirectContact: true,
  fulfillmentOptions: true,
  acceptedSpecializations: true,
  barterOpenness: true,
  Image: {
    select: { fileUrl: true },
    orderBy: { sortOrder: 'asc' as const },
    take: 1,
  },
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
} as const;

async function buildProductHeader(product: {
  id: string;
  title: string;
  priceCents: number;
  priceModel: string | null;
  category: string | null;
  marketplaceCategory: import('@prisma/client').MarketplaceCategory | null;
  delivery: string;
  orderMethod: string;
  isActive: boolean;
  stock: number;
  maxStock: number | null;
  acceptHomeCheffPayment: boolean;
  acceptDirectContact: boolean;
  fulfillmentOptions: unknown;
  acceptedSpecializations: string[];
  barterOpenness: string | null;
  Image: Array<{ fileUrl: string }>;
  seller: {
    user: {
      stripeConnectAccountId: string | null;
      stripeConnectOnboardingCompleted: boolean;
    };
  };
}): Promise<{ kind: 'PRODUCT'; product: ConversationHeaderProduct }> {
  const reserved = await prisma.stockReservation.aggregate({
    where: {
      productId: product.id,
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
    product.acceptHomeCheffPayment && product.orderMethod !== 'CONTACT';
  const stripeReady = sellerPaymentsReady(sellerUser);
  const canHomeCheffCheckout =
    acceptsHomeCheff &&
    product.isActive &&
    product.priceCents > 0 &&
    stripeReady &&
    canPurchaseViaHomecheff(product, sellerUser);

  const fulfillmentOptions = product.fulfillmentOptions
    ? parseFulfillmentOptions(product.fulfillmentOptions)
    : legacyDeliveryToFulfillment(product.delivery);

  const defaultPaymentPath: ProposalPaymentPath = canHomeCheffCheckout
    ? 'HOMECHEFF_CHECKOUT'
    : product.acceptDirectContact || product.orderMethod === 'CONTACT'
      ? 'DIRECT_CONTACT'
      : 'NONE';

  return {
    kind: 'PRODUCT',
    product: {
      id: product.id,
      title: product.title,
      priceCents: product.priceCents,
      priceModel: product.priceModel,
      category: product.category,
      marketplaceCategory: product.marketplaceCategory,
      delivery: product.delivery,
      imageUrl: product.Image[0]?.fileUrl ?? null,
      href: `/product/${product.id}`,
      canCheckout: canHomeCheffCheckout,
      acceptedSpecializations: product.acceptedSpecializations ?? [],
      barterOpenness: product.barterOpenness,
      stock: product.stock,
      maxStock: product.maxStock,
      availableStock,
      acceptHomeCheffPayment: acceptsHomeCheff,
      acceptDirectContact:
        product.acceptDirectContact || product.orderMethod === 'CONTACT',
      canHomeCheffCheckout,
      homeCheffCheckoutBlockedReason:
        acceptsHomeCheff && !stripeReady
          ? 'proposal.productBinding.paymentsRequired'
          : null,
      fulfillmentOptions,
      defaultPaymentPath,
    },
  };
}

/**
 * Load context header data for a conversation thread.
 */
export async function resolveConversationHeader(
  input: LoadHeaderInput,
): Promise<ResolvedConversationHeader | null> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: input.conversationId },
    select: {
      contextType: true,
      contextId: true,
      productId: true,
      orderId: true,
      title: true,
      Product: {
        select: PRODUCT_SELECT,
      },
      Order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
        },
      },
    },
  });

  if (!conversation) return null;

  const ctx = resolveConversationContext(conversation);
  const contextType = ctx.contextType;

  if (contextType === 'PRODUCT') {
    const product =
      conversation.Product ??
      (ctx.contextId
        ? await prisma.product.findUnique({
            where: { id: ctx.contextId },
            select: PRODUCT_SELECT,
          })
        : null);

    if (product) {
      return buildProductHeader(product);
    }
  }

  if (contextType === 'ORDER') {
    const order =
      conversation.Order ??
      (ctx.contextId
        ? await prisma.order.findUnique({
            where: { id: ctx.contextId },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
            },
          })
        : null);

    if (order) {
      return {
        kind: 'ORDER',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          href: `/orders/${order.id}`,
        },
      };
    }
  }

  const futureLabels: Partial<Record<ConversationContextType, { title: string; subtitle: string }>> = {
    DELIVERY: {
      title: 'Bezorging',
      subtitle: 'Bezorgcontext — binnenkort beschikbaar',
    },
    SERVICE: {
      title: 'Dienst',
      subtitle: 'Offerte & afspraak — binnenkort beschikbaar',
    },
    TASK: {
      title: 'Klus',
      subtitle: 'Kluscontext — binnenkort beschikbaar',
    },
    REQUEST: {
      title: 'Hulpvraag',
      subtitle: 'Hulpcontext — binnenkort beschikbaar',
    },
    BARTER: {
      title: 'Waarde-uitwisseling',
      subtitle: 'Voorstel — binnenkort beschikbaar',
    },
    PARTNER: {
      title: 'Partner',
      subtitle: 'Partnercontext — binnenkort beschikbaar',
    },
  };

  if (futureLabels[contextType]) {
    const labels = futureLabels[contextType]!;
    return {
      kind: 'FUTURE',
      future: {
        contextType,
        title: conversation.title?.trim() || labels.title,
        subtitle: labels.subtitle,
      },
    };
  }

  const peer = input.peer;
  const peerName =
    peer?.name?.trim() ||
    peer?.username?.trim() ||
    'Gesprekspartner';
  const peerUsername = peer?.username?.trim() || null;
  const peerHref = peer?.username
    ? `/user/${peer.username}`
    : peer?.id
      ? `/user/${peer.id}`
      : null;

  return {
    kind: 'GENERAL',
    general: {
      peerName,
      peerUsername,
      peerAvatar: peer?.profileImage ?? null,
      peerHref,
    },
  };
}
