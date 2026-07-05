import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';
import { NotificationService } from '@/lib/notifications/notification-service';
import { stripReferralNoise } from '@/lib/chat/stripReferralNoise';
import { tryAwardChatQuickResponseHcp } from '@/lib/gamification/interaction-hcp';
import { syncConversationStatusAfterMessage } from '@/lib/communication/sync-conversation-status';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;
    const { text, messageType = 'TEXT' } = await req.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
    }

    // Quick user lookup
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, username: true, profileImage: true, displayFullName: true, displayNameOption: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Quick participant check
    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: user.id },
      select: { id: true }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create message quickly (no encryption for speed)
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        text: text.trim(),
        messageType,
        isEncrypted: false
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true
          }
        }
      }
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { 
        lastMessageAt: new Date(),
        isActive: true
      }
    });

    void syncConversationStatusAfterMessage(conversationId).catch((e) =>
      console.warn('[messages/quick] status sync', e),
    );

    // Unhide conversation for all participants
    await prisma.conversationParticipant.updateMany({
      where: { conversationId },
      data: { isHidden: false }
    });

    // Send Pusher event immediately
    try {
      await pusherServer.trigger(
        `conversation-${conversationId}`,
        'new-message',
        message
      );
    } catch (pusherError) {
      console.error('Pusher error:', pusherError);
      // Don't fail the request
    }

    try {
      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: user.id },
        },
        select: { userId: true },
      });
      const previewBase = text.trim().slice(0, 100);
      const preview = stripReferralNoise(previewBase, 'Nieuw bericht');
      for (const participant of otherParticipants) {
        try {
          await NotificationService.sendChatNotification(
            participant.userId,
            user.id,
            preview,
            conversationId
          );
        } catch (notifError) {
          console.error(
            `[Notifications] quick route failed for ${participant.userId}:`,
            notifError
          );
        }
      }
    } catch (notifError) {
      console.error('[Notifications] quick route:', notifError);
    }

    void tryAwardChatQuickResponseHcp(user.id, conversationId).catch((e) =>
      console.warn('[gamification] CHAT_QUICK_RESPONSE', e),
    );

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Quick message API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
