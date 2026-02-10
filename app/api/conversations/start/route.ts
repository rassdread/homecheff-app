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

    // 🔒 PRIVACY CHECK: Check if seller allows messages from this user
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        messagePrivacy: true,
        role: true
      }
    });

    if (seller) {
      // Admins can always send messages
      if (seller.role !== 'ADMIN') {
        if (seller.messagePrivacy === 'NOBODY') {
          return NextResponse.json(
            { error: 'Deze gebruiker accepteert geen berichten' },
            { status: 403 }
          );
        } else if (seller.messagePrivacy === 'FANS_ONLY') {
          // Check if user is a fan of the seller
          const fanRelation = await prisma.follow.findFirst({
            where: {
              sellerId: sellerId,
              followerId: user.id
            }
          });
          if (!fanRelation) {
            return NextResponse.json(
              { error: 'Je moet een fan zijn van deze gebruiker om berichten te kunnen sturen' },
              { status: 403 }
            );
          }
        }
        // 'EVERYONE' allows all messages, no check needed
      }
    }

    // 🔒 WATERDICHT: Check if 1-on-1 conversation already exists between EXACTLY these 2 users
    let conversation = await prisma.conversation.findFirst({
      where: {
        productId,
        AND: [
          {
            ConversationParticipant: {
              some: { userId: user.id }
            }
          },
          {
            ConversationParticipant: {
              some: { userId: sellerId }
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
      console.warn(`[StartConversation] ⚠️ Found conversation with ${conversation.ConversationParticipant.length} participants, creating new one`);
      conversation = null; // Force creation of new conversation
    }

    // If conversation exists, make sure it's visible for this user and reactivate it
    if (conversation) {
      // Unhide conversation for this user if it was hidden
      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId: conversation.id,
          userId: user.id
        },
        data: {
          isHidden: false
        }
      });
      
      // Reactivate conversation
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

