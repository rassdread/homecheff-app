import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'MESSAGE_READ',
          entityType: 'MESSAGE',
          entityId: messageId,
          userId: user.id,
          metadata: {
            senderId: message.senderId,
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
      }
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
