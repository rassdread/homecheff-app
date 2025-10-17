import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sellerId, initialMessage } = await req.json();

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get seller info
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { id: sellerId },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true
          }
        }
      }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 });
    }

    // Don't allow sellers to start conversations with themselves
    if (user.id === sellerProfile.User.id) {
      return NextResponse.json(
        { error: 'Cannot start conversation with yourself' },
        { status: 400 }
      );
    }

    // 🔒 WATERDICHT: Check if 1-on-1 general conversation already exists between EXACTLY these 2 users
    let conversation = await prisma.conversation.findFirst({
      where: {
        productId: null,
        AND: [
          {
            ConversationParticipant: {
              some: { userId: user.id }
            }
          },
          {
            ConversationParticipant: {
              some: { userId: sellerProfile.User.id }
            }
          }
        ]
      },
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
        }
      }
    });

    // 🔒 SAFETY CHECK: Verify this is a 1-on-1 conversation (exactly 2 participants)
    if (conversation && conversation.ConversationParticipant.length !== 2) {
      console.warn(`[StartGeneralConversation] ⚠️ Found conversation with ${conversation.ConversationParticipant.length} participants, creating new one`);
      conversation = null; // Force creation of new conversation
    }

    // If conversation exists but was deleted, reactivate it
    if (conversation && !conversation.isActive) {
      console.log('[StartGeneralConversation] Reactivating deleted conversation:', conversation.id);
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { 
          isActive: true,
          lastMessageAt: new Date()
        }
      });
      conversation.isActive = true;
    }

    // Create new conversation if it doesn't exist
    if (!conversation) {
      const sellerName = sellerProfile.User.name || sellerProfile.User.username || 'Verkoper';
      
      const newConversation = await prisma.conversation.create({
        data: {
          id: crypto.randomUUID(),
          productId: null,
          title: `Gesprek met ${sellerName}`,
          isActive: true,
          lastMessageAt: new Date()
        }
      });

      // Add participants
      await prisma.conversationParticipant.createMany({
        data: [
          { id: crypto.randomUUID(), conversationId: newConversation.id, userId: user.id },
          { id: crypto.randomUUID(), conversationId: newConversation.id, userId: sellerProfile.User.id }
        ]
      });

      // Fetch the conversation with participants
      conversation = await prisma.conversation.findUnique({
        where: { id: newConversation.id },
        include: {
          ConversationParticipant: {
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
          }
        }
      });
    }

    // Send initial message if provided
    let initialMessageData: any = null;
    if (initialMessage && conversation) {
      initialMessageData = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: user.id,
          text: initialMessage,
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
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    // Get other participant (the seller)
    const otherParticipant = conversation.ConversationParticipant
      .find(p => p.userId !== user.id)?.User;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        product: null,
        otherParticipant,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt
      },
      initialMessage: initialMessageData
    });

  } catch (error) {
    console.error('Error starting general conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



