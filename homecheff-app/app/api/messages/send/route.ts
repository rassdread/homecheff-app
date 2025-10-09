import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, text, messageType = 'TEXT' } = await request.json();

    if (!conversationId || !text?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, username: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        text: text.trim(),
        messageType,
        isEncrypted: false,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          }
        }
      }
    });

    // Update conversation last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() }
    });

    // Create notification for other participants
    const otherParticipants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId,
        userId: { not: user.id }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          }
        }
      }
    });

    // Create notifications for each other participant
    for (const participant of otherParticipants) {
      await prisma.notification.create({
        data: {
          userId: participant.userId,
          type: 'MESSAGE',
          title: 'Nieuw bericht',
          message: `${user.name || user.username || 'Iemand'} heeft je een bericht gestuurd`,
          data: JSON.stringify({
            conversationId,
            messageId: message.id,
            senderName: user.name || user.username,
            messageText: text.trim(),
          }),
          isRead: false,
        }
      });
    }

    console.log(`[SendMessage] Message created: ${message.id} for conversation: ${conversationId}`);
    console.log(`[SendMessage] Notifications created for ${otherParticipants.length} participants`);

    return NextResponse.json({ 
      success: true, 
      message: {
        id: message.id,
        text: message.text,
        senderId: message.senderId,
        createdAt: message.createdAt,
        User: message.User
      }
    });

  } catch (error) {
    console.error('[SendMessage] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
