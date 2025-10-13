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

    const deliveredAt = new Date();

    // Mark message as delivered (using raw SQL until Prisma regenerates)
    await prisma.$executeRaw`
      UPDATE "Message" 
      SET "deliveredAt" = ${deliveredAt}
      WHERE "id" = ${messageId}
    `;

    // Get conversation ID for Pusher
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { conversationId: true }
    });

    if (message) {
      // Notify sender via Pusher
      await pusherServer.trigger(
        `conversation-${message.conversationId}`,
        'message-delivered',
        {
          messageId: messageId,
          deliveredAt: deliveredAt.toISOString()
        }
      );
    }

    return NextResponse.json({ 
      success: true,
      deliveredAt: deliveredAt.toISOString()
    });

  } catch (error) {
    console.error('[Message Delivered API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as delivered' },
      { status: 500 }
    );
  }
}

