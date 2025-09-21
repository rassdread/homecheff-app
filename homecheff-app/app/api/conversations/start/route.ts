import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Create new conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          productId,
          title: `Gesprek over ${product.title}`,
          isActive: true,
          lastMessageAt: new Date()
        }
      });

      // Add participants
      await prisma.conversationParticipant.createMany({
        data: [
          { conversationId: conversation.id, userId: user.id },
          { conversationId: conversation.id, userId: sellerId }
        ]
      });

      // Fetch conversation with participants
      conversation = await prisma.conversation.findUnique({
        where: { id: conversation.id },
        include: {
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
                take: 1,
                orderBy: { sortOrder: 'asc' }
              }
            }
          },
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
    let initialMessageData = null;
    if (initialMessage) {
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

    // Get other participant (the seller)
    const otherParticipant = conversation.ConversationParticipant
      .find(p => p.userId !== user.id)?.User;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        product: conversation.Product,
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
  } finally {
    await prisma.$disconnect();
  }
}



