import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';
import { loadConversationsForSessionUser } from '@/lib/chat/loadConversationsForSessionUser';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const result = await loadConversationsForSessionUser(session.user.email);
    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }
    return NextResponse.json({ conversations: result.conversations }, { headers: cors });

  } catch (error) {
    console.error('[Conversations API] ❌ Critical error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const { productId, sellerId, message } = await req.json();

    if (!productId || !sellerId) {
      return NextResponse.json(
        { error: 'Product ID and seller ID are required' },
        { status: 400, headers: cors }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        productId,
        ConversationParticipant: {
          some: {
            userId: { in: [user.id, sellerId] }
          }
        }
      },
      include: {
        ConversationParticipant: true
      }
    });

    // Create new conversation if it doesn't exist
    if (!conversation) {
      const newConversation = await prisma.conversation.create({
        data: {
          id: crypto.randomUUID(),
          productId,
          title: null,
          isActive: true
        }
      });

      // Add participants
      await prisma.conversationParticipant.createMany({
        data: [
          { id: crypto.randomUUID(), conversationId: newConversation.id, userId: user.id },
          { id: crypto.randomUUID(), conversationId: newConversation.id, userId: sellerId }
        ]
      });

      // Fetch the conversation with participants
      conversation = await prisma.conversation.findUnique({
        where: { id: newConversation.id },
        include: {
          ConversationParticipant: true
        }
      });
    }

    // Send initial message if provided
    let initialMessage: any = null;
    if (message && conversation) {
      initialMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          text: message,
          messageType: 'TEXT'
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true
            }
          }
        }
      });

      // Update conversation last message time
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() }
      });
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500, headers: cors });
    }

    return NextResponse.json(
      { conversationId: conversation.id, initialMessage },
      { headers: cors }
    );
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getCorsHeaders(req) }
    );
  }
}

