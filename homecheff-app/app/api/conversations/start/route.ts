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

    const { productId, initialMessage } = await req.json();

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get product and seller info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        Image: {
          select: {
            fileUrl: true,
            sortOrder: true
          },
          orderBy: { sortOrder: 'asc' }
        },
        seller: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const sellerId = product.seller.User.id;

    // Don't allow sellers to start conversations about their own products
    if (user.id === sellerId) {
      return NextResponse.json(
        { error: 'Cannot start conversation about your own product' },
        { status: 400 }
      );
    }

    // Check if conversation already exists (including inactive ones)
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

    // If conversation exists but was deleted, reactivate it
    if (conversation && !conversation.isActive) {
      console.log('[StartConversation] Reactivating deleted conversation:', conversation.id);
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
      const newConversation = await prisma.conversation.create({
        data: {
          id: crypto.randomUUID(),
          productId,
          title: `Gesprek over ${product.title}`,
          isActive: true,
          lastMessageAt: new Date()
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
              profileImage: true,
              displayFullName: true,
              displayNameOption: true
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
        product: {
          id: product.id,
          title: product.title,
          priceCents: product.priceCents,
          Image: product.Image || []
        },
        otherParticipant,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt
      },
      initialMessage: initialMessageData
    });

  } catch (error) {
    console.error('Error starting conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}



