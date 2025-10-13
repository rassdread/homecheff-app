import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = params;

    // Mark message as delivered
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        deliveredAt: new Date()
      },
      include: {
        Conversation: true
      }
    });

    // Notify sender via Pusher
    await pusherServer.trigger(
      `conversation-${updatedMessage.conversationId}`,
      'message-delivered',
      {
        messageId: updatedMessage.id,
        deliveredAt: updatedMessage.deliveredAt
      }
    );

    return NextResponse.json({ 
      success: true,
      deliveredAt: updatedMessage.deliveredAt
    });

  } catch (error) {
    console.error('[Message Delivered API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as delivered' },
      { status: 500 }
    );
  }
}

