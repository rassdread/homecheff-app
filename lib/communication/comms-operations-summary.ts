import { prisma } from '@/lib/prisma';
import { resolveConversationContext } from '@/lib/communication/resolveConversationContext';

export type CommsOperationsSummary = {
  /** Conversations where the other party sent the last message (user should respond). */
  unansweredCount: number;
  /** Subset: product/order context where user is the seller/provider. */
  customerWaitingCount: number;
  /** Deep link to most urgent unanswered thread. */
  primaryConversationHref: string | null;
  primaryConversationLabel: string | null;
};

/**
 * Computed communication tasks for Operations (not stored in DB).
 */
export async function getCommsOperationsSummary(
  userId: string,
): Promise<CommsOperationsSummary> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { userId, isHidden: false },
    select: {
      Conversation: {
        select: {
          id: true,
          contextType: true,
          contextId: true,
          productId: true,
          orderId: true,
          Product: {
            select: {
              sellerId: true,
              seller: { select: { User: { select: { id: true } } } },
            },
          },
          Order: {
            select: {
              items: {
                take: 1,
                select: {
                  Product: {
                    select: {
                      seller: { select: { User: { select: { id: true } } } },
                    },
                  },
                },
              },
            },
          },
          Message: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              senderId: true,
              readAt: true,
              User: { select: { name: true, username: true } },
            },
          },
        },
      },
    },
  });

  let unansweredCount = 0;
  let customerWaitingCount = 0;
  let primaryConversationHref: string | null = null;
  let primaryConversationLabel: string | null = null;

  for (const row of participants) {
    const conv = row.Conversation;
    const last = conv.Message[0];
    if (!last || last.senderId === userId) continue;

    unansweredCount += 1;

    const ctx = resolveConversationContext(conv);
    const isSellerContext =
      ctx.contextType === 'PRODUCT' &&
      conv.Product?.seller?.User?.id === userId;
    const isOrderSellerContext =
      ctx.contextType === 'ORDER' &&
      conv.Order?.items.some(
        (item) => item.Product?.seller?.User?.id === userId,
      );

    if (isSellerContext || isOrderSellerContext) {
      customerWaitingCount += 1;
    }

    if (!primaryConversationHref) {
      primaryConversationHref = `/messages/${conv.id}`;
      const senderName =
        last.User?.name?.trim() ||
        last.User?.username?.trim() ||
        null;
      primaryConversationLabel = senderName
        ? `Bericht van ${senderName}`
        : 'Nieuw bericht';
    }
  }

  return {
    unansweredCount,
    customerWaitingCount,
    primaryConversationHref,
    primaryConversationLabel,
  };
}

/**
 * Count unread messages (same query as /api/messages/unread-count).
 */
export async function countUnreadMessagesForUser(userId: string): Promise<number> {
  return prisma.message.count({
    where: {
      Conversation: {
        ConversationParticipant: {
          some: { userId, isHidden: false },
        },
      },
      readAt: null,
      NOT: { senderId: userId },
    },
  });
}
