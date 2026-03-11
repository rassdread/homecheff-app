import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCorsHeaders } from '@/lib/apiCors';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: cors });
    }

    const { conversationId } = params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: cors });
    }

    // Check if user is participant in conversation
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: user.id
      }
    });

    if (!participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403, headers: cors });
    }

    // Fetch conversation with all details
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ConversationParticipant: {
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
        },
        Product: {
          select: {
            id: true,
            title: true,
            priceCents: true,
            Image: {
              select: {
                fileUrl: true,
                sortOrder: true
              },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: cors });
    }

    // Get other participant (not the current user) with consistent data structure
    const otherParticipantData = conversation.ConversationParticipant
      .find(p => p.userId !== user.id)?.User;
    
       const otherParticipant = otherParticipantData ? {
         id: otherParticipantData.id,
         name: otherParticipantData.name,
         username: otherParticipantData.username,
         profileImage: otherParticipantData.profileImage,
         displayFullName: otherParticipantData.displayFullName,
         displayNameOption: otherParticipantData.displayNameOption
       } : null;

    // Transform to match the expected format
    const conversationData = {
      id: conversation.id,
      title: conversation.title,
      product: conversation.Product ? {
        id: conversation.Product.id,
        title: conversation.Product.title,
        priceCents: conversation.Product.priceCents,
        Image: conversation.Product.Image
      } : null,
      otherParticipant,
      lastMessageAt: conversation.lastMessageAt,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt
    };

    return NextResponse.json({ conversation: conversationData }, { headers: cors });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}
