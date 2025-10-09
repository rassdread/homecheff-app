import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = params;

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
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

    // Mark conversation as inactive for this user
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { isActive: false }
    });

    // Mark all messages in this conversation as deleted
    await prisma.message.updateMany({
      where: {
        conversationId
      },
      data: {
        deletedAt: new Date()
      }
    });

    console.log(`[DeleteConversation] Conversation ${conversationId} marked as inactive`);

    return NextResponse.json({ 
      success: true, 
      message: 'Gesprek succesvol gewist' 
    });

  } catch (error) {
    console.error('[DeleteConversation] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
