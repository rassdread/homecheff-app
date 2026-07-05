import { prisma } from '@/lib/prisma';
import { resolveConversationContext } from '@/lib/communication/resolveConversationContext';
import type { ConversationContextType } from '@prisma/client';

export type ConversationHeaderProduct = {
  id: string;
  title: string;
  priceCents: number;
  priceModel: string | null;
  category: string | null;
  delivery: string | null;
  imageUrl: string | null;
  href: string;
  canCheckout: boolean;
  acceptedSpecializations: string[];
  barterOpenness: string | null;
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
        select: {
          id: true,
          title: true,
          priceCents: true,
          priceModel: true,
          category: true,
          delivery: true,
          orderMethod: true,
          isActive: true,
          acceptedSpecializations: true,
          barterOpenness: true,
          Image: {
            select: { fileUrl: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
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
            select: {
              id: true,
              title: true,
              priceCents: true,
              priceModel: true,
              category: true,
              delivery: true,
              orderMethod: true,
              isActive: true,
              acceptedSpecializations: true,
              barterOpenness: true,
              Image: {
                select: { fileUrl: true },
                orderBy: { sortOrder: 'asc' },
                take: 1,
              },
            },
          })
        : null);

    if (product) {
      const canCheckout =
        product.isActive &&
        product.orderMethod === 'HOMECHEFF_PAYMENT' &&
        product.priceCents > 0;

      return {
        kind: 'PRODUCT',
        product: {
          id: product.id,
          title: product.title,
          priceCents: product.priceCents,
          priceModel: product.priceModel,
          category: product.category,
          delivery: product.delivery,
          imageUrl: product.Image[0]?.fileUrl ?? null,
          href: `/product/${product.id}`,
          canCheckout,
          acceptedSpecializations: product.acceptedSpecializations ?? [],
          barterOpenness: product.barterOpenness,
        },
      };
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
