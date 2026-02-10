import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session as any).user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN' && user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { conversationId } = params;

    // Fetch conversation details
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
                image: true,
              }
            }
          }
        },
        Product: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch all messages in the conversation
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt,
        participants: conversation.ConversationParticipant.map(p => ({
          id: p.User.id,
          name: p.User.name,
          username: p.User.username,
          profileImage: p.User.image,
        })),
        product: conversation.Product,
      },
      messages: messages.map(message => ({
        id: message.id,
        text: message.text,
        messageType: message.messageType,
        createdAt: message.createdAt,
        readAt: message.readAt,
        isEncrypted: message.isEncrypted,
        User: {
          id: message.User.id,
          name: message.User.name,
          username: message.User.username,
          profileImage: message.User.profileImage,
        }
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching conversation messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation messages' },
      { status: 500 }
    );
  }
}
