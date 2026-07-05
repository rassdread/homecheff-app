import { prisma } from '@/lib/prisma';
import type { ConversationStatus } from '@prisma/client';

const TERMINAL_STATUSES: ConversationStatus[] = ['CLOSED', 'RESOLVED', 'DISPUTED'];

/**
 * After an outbound message the recipient should respond → AWAITING_RESPONSE.
 * Terminal statuses (CLOSED, RESOLVED, DISPUTED) are never overwritten.
 */
export async function syncConversationStatusAfterMessage(
  conversationId: string,
): Promise<ConversationStatus> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { status: true },
  });

  if (!conversation) {
    return 'ACTIVE';
  }

  if (TERMINAL_STATUSES.includes(conversation.status)) {
    return conversation.status;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'AWAITING_RESPONSE', isActive: true },
  });

  return 'AWAITING_RESPONSE';
}

/**
 * Mark conversation ACTIVE when participant reads all messages (thread caught up for reader).
 */
export async function syncConversationStatusAfterRead(
  conversationId: string,
  readerId: string,
): Promise<void> {
  const unreadFromOther = await prisma.message.count({
    where: {
      conversationId,
      readAt: null,
      NOT: { senderId: readerId },
      deletedAt: null,
    },
  });

  if (unreadFromOther > 0) return;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { status: true },
  });

  if (!conversation || TERMINAL_STATUSES.includes(conversation.status)) {
    return;
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { status: 'ACTIVE' },
  });
}
