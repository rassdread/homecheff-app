import type { PrismaClient } from '@prisma/client';
import { STRIPE_SESSION_ID_PREFIX } from '@/lib/stripe';
import {
  isSellerDashboardOrderBadgeNotification,
  resolveNotificationTargetUrl,
} from '@/lib/notifications/notificationRouting';
import {
  blockedProductEditHref,
  messagesConversationHref,
  sellerOrderHighlightHref,
} from '@/lib/action-center/action-deep-links';

export type ActionCenterEntityHints = {
  firstUnreadConversationId?: string;
  firstUnreadConversationSenderName?: string;
  firstPendingOrderId?: string;
  firstPendingOrderNumber?: string;
  firstBlockedProductId?: string;
  firstBlockedProductTitle?: string;
  firstSellerOrderNotificationHref?: string;
  firstSellerOrderNotificationOrderNumber?: string;
};

export async function fetchActionCenterEntityHints(
  prisma: PrismaClient,
  userId: string,
  sellerProfileId?: string | null,
): Promise<ActionCenterEntityHints> {
  const hints: ActionCenterEntityHints = {};

  const firstUnreadMessage = await prisma.message.findFirst({
    where: {
      readAt: null,
      NOT: { senderId: userId },
      Conversation: {
        ConversationParticipant: { some: { userId } },
      },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      conversationId: true,
      User: { select: { name: true, username: true } },
    },
  });

  if (firstUnreadMessage) {
    hints.firstUnreadConversationId = firstUnreadMessage.conversationId;
    hints.firstUnreadConversationSenderName =
      firstUnreadMessage.User.name?.trim() ||
      firstUnreadMessage.User.username?.trim() ||
      undefined;
  }

  if (sellerProfileId) {
    const [firstBlocked, firstPending] = await Promise.all([
      prisma.product.findFirst({
        where: {
          sellerId: sellerProfileId,
          isActive: false,
          orderMethod: 'HOMECHEFF_PAYMENT',
          priceCents: { gt: 0 },
        },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true },
      }),
      prisma.order.findFirst({
        where: {
          status: 'PENDING',
          stripeSessionId: { startsWith: STRIPE_SESSION_ID_PREFIX },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
          items: { some: { Product: { sellerId: sellerProfileId } } },
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, orderNumber: true },
      }),
    ]);

    if (firstBlocked) {
      hints.firstBlockedProductId = firstBlocked.id;
      hints.firstBlockedProductTitle = firstBlocked.title;
    }
    if (firstPending) {
      hints.firstPendingOrderId = firstPending.id;
      hints.firstPendingOrderNumber = firstPending.orderNumber ?? undefined;
    }

    const sellerOrderNotifs = await prisma.notification.findMany({
      where: {
        userId,
        readAt: null,
        type: { in: ['ORDER_RECEIVED', 'ORDER_UPDATE'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { type: true, payload: true, orderId: true },
    });

    for (const row of sellerOrderNotifs) {
      const prismaType = String(row.type);
      const payload = (row.payload as Record<string, unknown>) || {};
      if (!isSellerDashboardOrderBadgeNotification(prismaType, payload)) {
        continue;
      }
      const href =
        resolveNotificationTargetUrl(prismaType, payload) ||
        (row.orderId ? sellerOrderHighlightHref(row.orderId) : undefined);
      if (!href) continue;
      hints.firstSellerOrderNotificationHref = href;
      const data = (payload.data as Record<string, unknown> | undefined) || {};
      const orderNumber =
        (typeof payload.orderNumber === 'string' && payload.orderNumber) ||
        (typeof data.orderNumber === 'string' && data.orderNumber) ||
        undefined;
      hints.firstSellerOrderNotificationOrderNumber = orderNumber;
      break;
    }
  }

  return hints;
}

/** Valideer hints → concrete hrefs (fallback naar generieke routes). */
export function resolveEntityHrefs(hints: ActionCenterEntityHints): {
  messagesHref: string;
  pendingOrderHref: string;
  sellerOrderNotifHref: string;
  blockedProductHref: string;
} {
  return {
    messagesHref: hints.firstUnreadConversationId
      ? messagesConversationHref(hints.firstUnreadConversationId)
      : '/messages',
    pendingOrderHref: hints.firstPendingOrderId
      ? sellerOrderHighlightHref(hints.firstPendingOrderId)
      : '/verkoper/orders',
    sellerOrderNotifHref:
      hints.firstSellerOrderNotificationHref || '/verkoper/orders',
    blockedProductHref: hints.firstBlockedProductId
      ? blockedProductEditHref(hints.firstBlockedProductId)
      : '/profile',
  };
}
