import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const messageId = params.messageId;

    // First check if message exists
    const existingMessage = await prisma.message.findUnique({
      where: {
        id: messageId,
      },
      select: {
        id: true,
        senderId: true,
        readAt: true
      }
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // If already read, return success
    if (existingMessage.readAt) {
      return NextResponse.json({
        success: true,
        message: {
          id: existingMessage.id,
          isRead: true,
          readAt: existingMessage.readAt
        }
      });
    }

    // Update message as read
    const message = await prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        readAt: new Date()
      },
      select: {
        id: true,
        conversationId: true,
        readAt: true
      }
    });

    // Recalculate unread count for the conversation
    const unreadCount = await prisma.message.count({
      where: {
        conversationId: message.conversationId,
        readAt: null,
        NOT: { senderId: user.id } // Exclude messages sent by the current user
      }
    });

    // Create analytics event for message read
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'MESSAGE_READ',
          entityType: 'MESSAGE',
          entityId: messageId,
          userId: user.id,
          metadata: {
            readAt: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      // Analytics event creation is optional, don't fail the request
      console.warn('Failed to create analytics event:', error);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        isRead: !!message.readAt,
        readAt: message.readAt
      },
      unreadCount: unreadCount
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
  }
}
