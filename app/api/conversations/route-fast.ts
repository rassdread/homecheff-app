import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// In-memory cache for conversations
const conversationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check cache first
    const cacheKey = `conversations-${session.user.email}`;
    const cached = conversationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const response = NextResponse.json(cached.data);
      response.headers.set('Cache-Control', 'private, max-age=30');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Optimized user lookup with minimal data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        ConversationParticipant: {
          where: {
            isHidden: false  // Only fetch non-hidden conversations
          },
          select: {
            Conversation: {
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
                    messageType: true,
                    createdAt: true,
                    readAt: true,
                    senderId: true,
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
                ConversationParticipant: {
                  select: {
                    userId: true,
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
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Transform conversations - optimized processing
    const conversations = user.ConversationParticipant
    .map(participant => {
      const conversation = participant.Conversation;
      
      // Get other participants (exclude current user) with minimal data
      const otherParticipants = conversation.ConversationParticipant
        .filter(p => p.userId !== user.id)
        .map(p => ({
          id: p.User.id,
          name: p.User.name,
          username: p.User.username,
          profileImage: p.User.profileImage,
          displayFullName: p.User.displayFullName,
          displayNameOption: p.User.displayNameOption
        }));

      // Get the first other participant (for 1-on-1 chats)
      const otherParticipant = otherParticipants[0] || null;

      return {
        id: conversation.id,
        title: conversation.title || 
               (conversation.Product ? conversation.Product.title : 
               otherParticipant ? (otherParticipant.name || otherParticipant.username || 'Gesprek') : 'Nieuwe conversatie'),
        product: conversation.Product,
        lastMessage: conversation.Message[0] || null,
        participants: otherParticipants,
        otherParticipant: otherParticipant,
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
    const responseData = { conversations };

    // Cache the result
    conversationCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Clean old cache entries
    for (const [key, value] of conversationCache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL) {
        conversationCache.delete(key);
      }
    }

    const response = NextResponse.json(responseData);
    response.headers.set('Cache-Control', 'private, max-age=30');
    response.headers.set('X-Cache', 'MISS');
    
    return response;

  } catch (error) {
    console.error('[Conversations API FAST] ❌ Critical error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
