import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all types of messages and notifications for the user
    const [
      directMessages,
      follows,
      reviews,
      orders,
      adminMessages,
      favorites
    ] = await Promise.all([
      // Direct messages
      prisma.message.findMany({
        where: {
          senderId: (session as any).user.id
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
              role: true,
            }
          },
          Conversation: {
            select: {
              id: true,
              Product: {
                select: {
                  id: true,
                  title: true,
                  Image: {
                    select: { fileUrl: true },
                    take: 1
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // New followers
      prisma.follow.findMany({
        where: { sellerId: (session as any).user.id },
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
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // New reviews on user's products
      prisma.productReview.findMany({
        where: {
          product: {
            seller: {
              userId: (session as any).user.id
            }
          }
        },
        include: {
          buyer: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            }
          },
          product: {
            select: {
              id: true,
              title: true,
              Image: {
                select: { fileUrl: true },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Order updates
      prisma.order.findMany({
        where: {
          OR: [
            { userId: (session as any).user.id }, // User's orders
            {
              items: {
                some: {
                  Product: {
                    seller: {
                      userId: (session as any).user.id
                    }
                  }
                }
              }
            }
          ]
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            }
          },
          items: {
            include: {
              Product: {
                select: {
                  id: true,
                  title: true,
                  Image: {
                    select: { fileUrl: true },
                    take: 1
                  }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      }),

      // Admin messages (from analytics events)
      prisma.analyticsEvent.findMany({
        where: {
          entityType: 'ADMIN_MESSAGE',
          userId: (session as any).user.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // New favorites on user's products
      prisma.favorite.findMany({
        where: {
          Product: {
            seller: {
              userId: (session as any).user.id
            }
          }
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
            }
          },
          Product: {
            select: {
              id: true,
              title: true,
              Image: {
                select: { fileUrl: true },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Transform all messages into a unified format
    const allMessages = [
      // Direct messages
      ...directMessages.map(msg => ({
        id: `msg_${msg.id}`,
        type: 'message' as const,
        senderId: msg.senderId,
        receiverId: (session as any).user.id,
        content: msg.text || '',
        timestamp: msg.createdAt,
        isRead: !!msg.readAt,
        sender: {
          id: msg.User.id,
          name: msg.User.name || 'Onbekende gebruiker',
          username: msg.User.username,
          image: msg.User.profileImage,
          role: msg.User.role
        },
        receiver: {
          id: (session as any).user.id,
          name: (session as any).user.name || 'Jij',
          username: (session as any).user.username,
          image: (session as any).user.image,
          role: (session as any).user.role || 'USER'
        },
        product: msg.Conversation?.Product ? {
          id: msg.Conversation.Product.id,
          title: msg.Conversation.Product.title,
          image: msg.Conversation.Product.Image?.[0]?.fileUrl
        } : null
      })),

      // New followers
      ...follows.map(follow => ({
        id: `follow_${follow.id}`,
        type: 'follow' as const,
        senderId: follow.followerId,
        receiverId: follow.sellerId,
        content: `${follow.User.name || 'Iemand'} is nu jouw fan!`,
        timestamp: follow.createdAt,
        isRead: false, // Will be marked as read when viewed
        sender: {
          id: follow.User.id,
          name: follow.User.name || 'Onbekende gebruiker',
          username: follow.User.username,
          image: follow.User.profileImage,
          role: 'USER'
        },
        receiver: {
          id: (session as any).user.id,
          name: (session as any).user.name || 'Jij',
          username: (session as any).user.username,
          image: (session as any).user.image,
          role: (session as any).user.role || 'USER'
        },
        product: null
      })),

      // New reviews
      ...reviews.map(review => ({
        id: `review_${review.id}`,
        type: 'review' as const,
        senderId: review.buyerId,
        receiverId: (session as any).user.id,
        content: `${review.buyer.name || 'Iemand'} heeft een review achtergelaten: "${review.comment?.substring(0, 100)}${review.comment && review.comment.length > 100 ? '...' : ''}"`,
        timestamp: review.createdAt,
        isRead: false,
        sender: {
          id: review.buyer.id,
          name: review.buyer.name || 'Onbekende gebruiker',
          username: review.buyer.username,
          image: review.buyer.profileImage,
          role: 'USER'
        },
        receiver: {
          id: (session as any).user.id,
          name: (session as any).user.name || 'Jij',
          username: (session as any).user.username,
          image: (session as any).user.image,
          role: (session as any).user.role || 'USER'
        },
        product: {
          id: review.product.id,
          title: review.product.title,
          image: review.product.Image?.[0]?.fileUrl
        }
      })),

      // Order updates
      ...orders.map(order => ({
        id: `order_${order.id}`,
        type: 'order' as const,
        senderId: order.userId,
        receiverId: (session as any).user.id,
        content: `Bestelling #${order.orderNumber || order.id.slice(-6)} is ${order.status.toLowerCase()}`,
        timestamp: order.updatedAt,
        isRead: false,
        sender: {
          id: order.User.id,
          name: order.User.name || 'Onbekende gebruiker',
          username: order.User.username,
          image: order.User.profileImage,
          role: 'USER'
        },
        receiver: {
          id: (session as any).user.id,
          name: (session as any).user.name || 'Jij',
          username: (session as any).user.username,
          image: (session as any).user.image,
          role: (session as any).user.role || 'USER'
        },
        product: order.items[0]?.Product ? {
          id: order.items[0].Product.id,
          title: order.items[0].Product.title,
          image: order.items[0].Product.Image?.[0]?.fileUrl
        } : null
      })),

      // Admin messages
      ...adminMessages.map(msg => ({
        id: `admin_${msg.id}`,
        type: 'admin' as const,
        senderId: 'admin',
        receiverId: (session as any).user.id,
        content: (msg.metadata as any)?.message || 'Nieuw bericht van admin',
        timestamp: msg.createdAt,
        isRead: false,
        sender: {
          id: 'admin',
          name: 'Admin',
          username: 'admin',
          image: null,
          role: 'ADMIN'
        },
        receiver: {
          id: (session as any).user.id,
          name: (session as any).user.name || 'Jij',
          username: (session as any).user.username,
          image: (session as any).user.image,
          role: (session as any).user.role || 'USER'
        },
        product: null
      })),

      // New favorites
      ...favorites.map(fav => ({
        id: `favorite_${fav.id}`,
        type: 'favorite' as const,
        senderId: fav.userId,
        receiverId: (session as any).user.id,
        content: `${fav.User.name || 'Iemand'} heeft je product toegevoegd aan favorieten!`,
        timestamp: fav.createdAt,
        isRead: false,
        sender: {
          id: fav.User.id,
          name: fav.User.name || 'Onbekende gebruiker',
          username: fav.User.username,
          image: fav.User.profileImage,
          role: 'USER'
        },
        receiver: {
          id: (session as any).user.id,
          name: (session as any).user.name || 'Jij',
          username: (session as any).user.username,
          image: (session as any).user.image,
          role: (session as any).user.role || 'USER'
        },
        product: fav.Product ? {
          id: fav.Product.id,
          title: fav.Product.title,
          image: fav.Product.Image?.[0]?.fileUrl
        } : null
      }))
    ];

    // Sort all messages by timestamp
    const sortedMessages = allMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Count unread messages
    const unreadCount = sortedMessages.filter(msg => !msg.isRead && msg.receiverId === (session as any).user.id).length;

    return NextResponse.json({
      messages: sortedMessages,
      unreadCount,
      totalCount: sortedMessages.length,
      breakdown: {
        directMessages: directMessages.length,
        follows: follows.length,
        reviews: reviews.length,
        orders: orders.length,
        adminMessages: adminMessages.length,
        favorites: favorites.length
      }
    });

  } catch (error) {
    console.error('Error fetching all messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
