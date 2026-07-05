import { prisma } from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

const CHAT_TYPES: NotificationType[] = [
  NotificationType.MESSAGE_RECEIVED,
  NotificationType.NEW_CONVERSATION,
  NotificationType.PROPOSAL_RECEIVED,
  NotificationType.PROPOSAL_ACCEPTED,
  NotificationType.PROPOSAL_REJECTED,
  NotificationType.PROPOSAL_COUNTERED,
];

/**
 * Marks in-app chat notifications for a conversation read when the thread has no remaining unread for the user.
 */
export async function markChatNotificationsReadForConversation(
  userId: string,
  conversationId: string
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
      type: { in: CHAT_TYPES },
      OR: [
        { payload: { path: ['conversationId'], equals: conversationId } },
        { payload: { path: ['data', 'conversationId'], equals: conversationId } },
      ],
    },
    data: { readAt: new Date() },
  });
  return result.count;
}
