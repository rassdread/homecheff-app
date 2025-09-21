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

    const { orderId, initialMessage } = await req.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get order with items and seller info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            Product: {
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
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user owns this order
    if (order.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get unique sellers from order items
    const sellers = order.items.reduce((acc: any[], item) => {
      const sellerId = item.Product.seller.User.id;
      if (!acc.find(s => s.id === sellerId)) {
        acc.push({
          id: sellerId,
          name: item.Product.seller.User.name || item.Product.seller.User.username,
          sellerProfile: item.Product.seller
        });
      }
      return acc;
    }, []);

    // For now, we'll create a conversation with the first seller
    // In a more complex scenario, you might want separate conversations per seller
    const seller = sellers[0];
    if (!seller) {
      return NextResponse.json({ error: 'No seller found for this order' }, { status: 404 });
    }

    // Generate order number if not exists
    let orderNumber = order.orderNumber;
    if (!orderNumber) {
      const year = new Date().getFullYear();
      const orderCount = await prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`)
          }
        }
      });
      orderNumber = `ORD-${year}-${String(orderCount + 1).padStart(3, '0')}`;
      
      // Update order with generated number
      await prisma.order.update({
        where: { id: orderId },
        data: { orderNumber }
      });
    }

    // Check if conversation already exists for this order
    let conversation = await prisma.conversation.findFirst({
      where: {
        orderId,
        ConversationParticipant: {
          some: {
            userId: { in: [user.id, seller.id] }
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
      const newConversation = await prisma.conversation.create({
        data: {
          id: crypto.randomUUID(),
          orderId,
          title: `Bestelling ${orderNumber}`,
          isActive: true,
          lastMessageAt: new Date()
        }
      });

      // Add participants
      await prisma.conversationParticipant.createMany({
        data: [
          { id: crypto.randomUUID(), conversationId: newConversation.id, userId: user.id },
          { id: crypto.randomUUID(), conversationId: newConversation.id, userId: seller.id }
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
          messageType: 'TEXT',
          orderNumber: orderNumber
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
        order: null, // Order relation not included in query
        otherParticipant,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt
      },
      initialMessage: initialMessageData
    });

  } catch (error) {
    console.error('Error starting order conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}



