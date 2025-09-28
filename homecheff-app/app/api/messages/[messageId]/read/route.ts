import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      include: {
        User: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          }
        }
      }
    });

    // Create analytics event for message read
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'MESSAGE_READ',
        entityType: 'MESSAGE',
        entityId: messageId,
        userId: (session as any).user.id,
        metadata: {
          senderId: message.senderId,
          readAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        isRead: !!message.readAt,
        readAt: message.readAt
      }
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
  }
}
