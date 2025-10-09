import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        ConversationParticipant: {
          where: {
            isActive: true // Only show active participants
          },
          select: {
            Conversation: {
              where: {
                isActive: true // Only show active conversations
              },
              select: {
                id: true,
                title: true,
                lastMessageAt: true,
                isActive: true,
                createdAt: true,
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
                Message: {
                  take: 1,
                  orderBy: { createdAt: 'desc' },
                  select: {
                    id: true,
                    text: true,
                    createdAt: true,
                    readAt: true,
                    User: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        profileImage: true
                      }
                    }
                  }
                },
                ConversationParticipant: {
                  select: {
                    userId: true,
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
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform conversations
    const conversations = user.ConversationParticipant.map(participant => {
      const conversation = participant.Conversation;
      const otherParticipants = conversation.ConversationParticipant
        .filter(p => p.userId !== user.id)
        .map(p => p.User);

      return {
        id: conversation.id,
        title: conversation.title || 
               (conversation.Product ? conversation.Product.title : 'Nieuwe conversatie'),
        product: conversation.Product,
        lastMessage: conversation.Message[0] || null,
        participants: otherParticipants,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        createdAt: conversation.createdAt
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessageAt || a.createdAt;
      const bTime = b.lastMessageAt || b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    return NextResponse.json({ conversations });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, sellerId, message } = await req.json();

    if (!productId || !sellerId) {
      return NextResponse.json(
        { error: 'Product ID and seller ID are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      initialMessage
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}



