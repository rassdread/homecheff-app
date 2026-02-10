import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDisplayName } from '@/lib/displayName';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details with role information
    const user = await prisma.user.findUnique({
      where: { id: (session as any).user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        profileImage: true,
        SellerProfile: {
          select: { id: true, userId: true }
        },
        DeliveryProfile: {
          select: { id: true, userId: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine user categories and permissions
    const isAdmin = user.role === 'ADMIN';
    const isSeller = !!user.SellerProfile;
    const isDelivery = !!user.DeliveryProfile;
    const isRegularUser = !isAdmin && !isSeller && !isDelivery;

    // Get personalized messages based on user role and categories
    const [
      directMessages,
      roleSpecificMessages,
      categoryMessages,
      systemMessages
    ] = await Promise.all([
      // Direct messages (all users)
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

      // Role-specific messages
      getRoleSpecificMessages(user.role, (session as any).user.id, isSeller, isDelivery),

      // Category-specific messages (based on user interests/preferences)
      getCategorySpecificMessages((session as any).user.id, user.role),

      // System messages for user
      prisma.analyticsEvent.findMany({
        where: {
          entityType: 'SYSTEM_MESSAGE',
          userId: (session as any).user.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      })
    ]);

    // Transform all messages into unified format
    const allMessages = [
      // Direct messages
      ...directMessages.map(msg => ({
        id: `msg_${msg.id}`,
        type: 'message' as const,
        category: 'personal',
        senderId: msg.senderId,
        receiverId: (session as any).user.id, // Current user as receiver
        content: msg.text || '',
        timestamp: msg.createdAt,
        isRead: !!msg.readAt,
        priority: 'medium' as const,
        sender: {
          id: msg.User.id,
          name: getDisplayName(msg.User),
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

      // Role-specific messages
      ...roleSpecificMessages,

      // Category messages
      ...categoryMessages,

      // System messages
      ...systemMessages.map(msg => ({
        id: `system_${msg.id}`,
        type: 'system' as const,
        category: 'system',
        senderId: 'system',
        receiverId: (session as any).user.id,
        content: (msg.metadata as any)?.message || 'Systeembericht',
        timestamp: msg.createdAt,
        isRead: false,
        priority: (msg.metadata as any)?.priority || 'low' as const,
        sender: {
          id: 'system',
          name: 'Systeem',
          username: 'system',
          image: null,
          role: 'SYSTEM'
        },
        receiver: {
          id: (session as any).user.id,
          name: user.name || 'Jij',
          username: user.username,
          image: user.profileImage,
          role: user.role || 'USER'
        },
        product: null
      }))
    ];

    // Sort by timestamp
    const sortedMessages = allMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Count unread messages
    const unreadCount = sortedMessages.filter(msg => !msg.isRead && msg.receiverId === (session as any).user.id).length;

    // Get message statistics by category
    const categoryStats = {
      personal: sortedMessages.filter(msg => msg.category === 'personal').length,
      role: sortedMessages.filter(msg => msg.category === 'role').length,
      category: sortedMessages.filter(msg => msg.category === 'category').length,
      system: sortedMessages.filter(msg => msg.category === 'system').length
    };

    return NextResponse.json({
      messages: sortedMessages,
      unreadCount,
      totalCount: sortedMessages.length,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        categories: {
          isAdmin,
          isSeller,
          isDelivery,
          isRegularUser
        }
      },
      categoryStats,
      permissions: {
        canReceiveAdminMessages: isAdmin,
        canReceiveSellerMessages: isSeller,
        canReceiveDeliveryMessages: isDelivery,
        canReceiveUserMessages: isRegularUser
      }
    });

  } catch (error) {
    console.error('Error fetching personal messages:', error);
    return NextResponse.json({ error: 'Failed to fetch personal messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create a new message
    const message = await prisma.message.create({
      data: {
        senderId: (session as any).user.id,
        text: content,
        conversationId: 'temp-conversation', // Temporary - will be handled by conversation logic
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
        }
      }
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

// Helper function to get role-specific messages
async function getRoleSpecificMessages(role: string | null, userId: string, isSeller: boolean, isDelivery: boolean) {
  const messages: any[] = [];

  // Admin messages
  if (role === 'ADMIN') {
    const adminMessages = await prisma.analyticsEvent.findMany({
      where: {
        entityType: 'ADMIN_MESSAGE',
        userId: userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    messages.push(...adminMessages.map(msg => ({
      id: `admin_${msg.id}`,
      type: 'admin' as const,
      category: 'role',
      senderId: 'admin',
      receiverId: userId,
      content: (msg.metadata as any)?.message || 'Admin bericht',
      timestamp: msg.createdAt,
      isRead: false,
      priority: 'high' as const,
      sender: {
        id: 'admin',
        name: 'Admin',
        username: 'admin',
        image: null,
        role: 'ADMIN'
      },
      receiver: {
        id: userId,
        name: 'Jij',
        username: null,
        image: null,
        role: role || 'USER'
      },
      product: null
    })));
  }

  // Seller-specific messages
  if (isSeller) {
    const [sellerOrders, sellerReviews, sellerFollowers] = await Promise.all([
      // Orders for seller's products
      prisma.order.findMany({
        where: {
          items: {
            some: {
              Product: {
                seller: {
                  userId: userId
                }
              }
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

      // Reviews on seller's products
      prisma.productReview.findMany({
        where: {
          product: {
            seller: {
              userId: userId
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

      // New followers
      prisma.follow.findMany({
        where: { sellerId: userId },
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
      })
    ]);

    // Add seller order messages
    messages.push(...sellerOrders.map(order => ({
      id: `seller_order_${order.id}`,
      type: 'order' as const,
      category: 'role',
      senderId: order.userId,
      receiverId: userId,
      content: `Nieuwe bestelling #${order.orderNumber || order.id.slice(-6)} - Status: ${order.status}`,
      timestamp: order.updatedAt,
      isRead: false,
      priority: 'high' as const,
      sender: {
        id: order.User.id,
        name: getDisplayName(order.User),
        username: order.User.username,
        image: order.User.profileImage,
        role: 'USER'
      },
      receiver: {
        id: userId,
        name: 'Jij',
        username: null,
        image: null,
        role: role || 'USER'
      },
      product: order.items[0]?.Product ? {
        id: order.items[0].Product.id,
        title: order.items[0].Product.title,
        image: order.items[0].Product.Image?.[0]?.fileUrl
      } : null
    })));

    // Add seller review messages
    messages.push(...sellerReviews.map(review => ({
      id: `seller_review_${review.id}`,
      type: 'review' as const,
      category: 'role',
      senderId: review.buyerId,
      receiverId: userId,
      content: `Nieuwe review (${review.rating}⭐): "${review.comment?.substring(0, 100)}${review.comment && review.comment.length > 100 ? '...' : ''}"`,
      timestamp: review.createdAt,
      isRead: false,
      priority: 'medium' as const,
      sender: {
        id: review.buyer.id,
        name: getDisplayName(review.buyer),
        username: review.buyer.username,
        image: review.buyer.profileImage,
        role: 'USER'
      },
      receiver: {
        id: userId,
        name: 'Jij',
        username: null,
        image: null,
        role: role || 'USER'
      },
      product: {
        id: review.product.id,
        title: review.product.title,
        image: review.product.Image?.[0]?.fileUrl
      }
    })));

    // Add seller follower messages
    messages.push(...sellerFollowers.map(follow => ({
      id: `seller_follow_${follow.id}`,
      type: 'follow' as const,
      category: 'role',
      senderId: follow.followerId,
      receiverId: userId,
      content: `${getDisplayName(follow.User)} is nu jouw fan!`,
      timestamp: follow.createdAt,
      isRead: false,
      priority: 'low' as const,
      sender: {
        id: follow.User.id,
        name: getDisplayName(follow.User),
        username: follow.User.username,
        image: follow.User.profileImage,
        role: 'USER'
      },
      receiver: {
        id: userId,
        name: 'Jij',
        username: null,
        image: null,
        role: role || 'USER'
      },
      product: null
    })));
  }

  // Delivery-specific messages
  if (isDelivery) {
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: {
        deliveryProfileId: userId
      },
      include: {
        order: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    messages.push(...deliveryOrders.map(delivery => ({
      id: `delivery_${delivery.id}`,
      type: 'order' as const,
      category: 'role',
      senderId: delivery.order.userId,
      receiverId: userId,
      content: `Nieuwe bezorgopdracht: ${delivery.order.deliveryAddress}`,
      timestamp: delivery.createdAt,
      isRead: false,
      priority: 'high' as const,
      sender: {
        id: delivery.order.User.id,
        name: getDisplayName(delivery.order.User),
        username: delivery.order.User.username,
        image: delivery.order.User.profileImage,
        role: 'USER'
      },
      receiver: {
        id: userId,
        name: 'Jij',
        username: null,
        image: null,
        role: role || 'USER'
      },
      product: null
    })));
  }

  return messages;
}

// Helper function to get category-specific messages
async function getCategorySpecificMessages(userId: string, role: string | null) {
  const messages: any[] = [];

  // Get user's favorite categories/interests
  const userFavorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      Product: {
        select: {
          category: true,
          seller: {
            select: {
              User: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profileImage: true,
                }
              }
            }
          }
        }
      }
    },
    take: 20
  });

  // Create category-based notifications
  const categoryMap = new Map<string, number>();
  userFavorites.forEach(fav => {
    const category = fav.Product?.category;
    if (category) {
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    }
  });

  // Get top 3 categories - filter out invalid categories
  const validCategories = ['CHEFF', 'GROWN', 'DESIGNER'] as const;
  const topCategories = Array.from(categoryMap.entries())
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category)
    .filter((category): category is 'CHEFF' | 'GROWN' | 'DESIGNER' => 
      validCategories.includes(category as any)
    );

  // Get new products in user's favorite categories
  if (topCategories.length > 0) {
    const newProductsInCategories = await prisma.product.findMany({
      where: {
        category: { in: topCategories },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        seller: {
          select: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                profileImage: true,
              }
            }
          }
        },
        Image: {
          select: { fileUrl: true },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    messages.push(...newProductsInCategories.map(product => ({
      id: `category_${product.id}`,
      type: 'system' as const,
      category: 'category',
      senderId: 'system',
      receiverId: userId,
      content: `Nieuw product in je favoriete categorie: ${product.title}`,
      timestamp: product.createdAt,
      isRead: false,
      priority: 'low' as const,
      sender: {
        id: 'system',
        name: 'Systeem',
        username: 'system',
        image: null,
        role: 'SYSTEM'
      },
      receiver: {
        id: userId,
        name: 'Jij',
        username: null,
        image: null,
        role: role || 'USER'
      },
      product: {
        id: product.id,
        title: product.title,
        image: product.Image?.[0]?.fileUrl
      }
    })));
  }

  return messages;
}
