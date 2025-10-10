import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notifications: any[] = [];

    // 1. Unread Messages
    const unreadMessages = await prisma.message.findMany({
      where: {
        Conversation: {
          ConversationParticipant: {
            some: {
              userId: user.id
            }
          }
        },
        senderId: { not: user.id },
        readAt: null
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        },
        Conversation: {
          select: {
            id: true,
            Product: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    unreadMessages.forEach(msg => {
      notifications.push({
        id: `msg_${msg.id}`,
        type: 'message',
        title: 'Nieuw bericht',
        message: msg.text || 'Je hebt een nieuw bericht ontvangen',
        link: `/messages`,
        isRead: false,
        createdAt: msg.createdAt.toISOString(),
        from: {
          id: msg.User.id,
          name: msg.User.name || 'Gebruiker',
          username: msg.User.username || undefined,
          image: msg.User.profileImage || undefined
        },
        metadata: {
          conversationId: msg.conversationId
        }
      });
    });

    // 2. New Followers (Fans)
    const newFollowers = await prisma.follow.findMany({
      where: {
        sellerId: user.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
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

    newFollowers.forEach(follow => {
      notifications.push({
        id: `follow_${follow.id}`,
        type: 'follow',
        title: 'Nieuwe fan!',
        message: `${follow.User.name || 'Iemand'} volgt je nu`,
        link: `/user/${follow.User.username || follow.User.id}`,
        isRead: false, // You might want to track this separately
        createdAt: follow.createdAt.toISOString(),
        from: {
          id: follow.User.id,
          name: follow.User.name || 'Gebruiker',
          username: follow.User.username,
          image: follow.User.profileImage
        }
      });
    });

    // 3. Fan Requests
    const fanRequests = await prisma.fanRequest.findMany({
      where: {
        targetId: user.id,
        status: 'PENDING'
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        }
      }
    });

    fanRequests.forEach(request => {
      notifications.push({
        id: `fan_req_${request.id}`,
        type: 'fan',
        title: 'Nieuw fan verzoek',
        message: `${request.requester.name || 'Iemand'} wil je fan worden`,
        link: `/profile/fans`,
        isRead: false,
        createdAt: request.createdAt.toISOString(),
        from: {
          id: request.requester.id,
          name: request.requester.name || 'Gebruiker',
          username: request.requester.username,
          image: request.requester.profileImage
        }
      });
    });

    // 4. New Orders (for sellers)
    const newOrders = await prisma.order.findMany({
      where: {
        items: {
          some: {
            Product: {
              seller: {
                userId: user.id
              }
            }
          }
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
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

    newOrders.forEach(order => {
      notifications.push({
        id: `order_${order.id}`,
        type: 'order',
        title: 'Nieuwe bestelling!',
        message: `${order.User.name || 'Een klant'} heeft een bestelling geplaatst`,
        link: `/orders/${order.id}`,
        isRead: false,
        createdAt: order.createdAt.toISOString(),
        from: {
          id: order.User.id,
          name: order.User.name || 'Klant',
          username: order.User.username,
          image: order.User.profileImage
        },
        metadata: {
          orderId: order.id
        }
      });
    });

    // 5. New Props (WorkspaceContent props) - Skip for now due to complex schema
    // TODO: Add when workspace content schema is finalized

    // 6. New Favorites
    const newFavorites = await prisma.favorite.findMany({
      where: {
        OR: [
          {
            Product: {
              seller: {
                userId: user.id
              }
            }
          },
          {
            Listing: {
              ownerId: user.id
            }
          }
        ],
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true
          }
        },
        Product: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    newFavorites.forEach(fav => {
      notifications.push({
        id: `fav_${fav.id}`,
        type: 'favorite',
        title: 'Nieuw favoriet!',
        message: `${fav.User.name || 'Iemand'} heeft je product favoriet gemaakt`,
        link: fav.Product ? `/product/${fav.Product.id}` : '/profile',
        isRead: false,
        createdAt: fav.createdAt.toISOString(),
        from: {
          id: fav.User.id,
          name: fav.User.name || 'Gebruiker',
          username: fav.User.username,
          image: fav.User.profileImage
        },
        metadata: {
          productId: fav.productId
        }
      });
    });

    // Sort all notifications by date
    notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Take only latest 20
    const latestNotifications = notifications.slice(0, 20);
    const unreadCount = latestNotifications.filter(n => !n.isRead).length;

    return NextResponse.json({
      notifications: latestNotifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

