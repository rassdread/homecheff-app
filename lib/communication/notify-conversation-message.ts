import { NotificationService } from '@/lib/notifications/notification-service';
import { stripReferralNoise } from '@/lib/chat/stripReferralNoise';

/**
 * Notify conversation participants when an initial or outbound message is sent.
 */
export async function notifyConversationMessageRecipients(params: {
  conversationId: string;
  senderId: string;
  text: string;
}): Promise<void> {
  const { prisma } = await import('@/lib/prisma');

  const recipients = await prisma.conversationParticipant.findMany({
    where: {
      conversationId: params.conversationId,
      userId: { not: params.senderId },
    },
    select: { userId: true },
  });

  const preview = stripReferralNoise(
    params.text.trim().slice(0, 100),
    'Nieuw bericht',
  );

  for (const row of recipients) {
    try {
      await NotificationService.sendChatNotification(
        row.userId,
        params.senderId,
        preview,
        params.conversationId,
      );
    } catch (err) {
      console.error(
        `[notifyConversationMessageRecipients] failed for ${row.userId}:`,
        err,
      );
    }
  }
}
