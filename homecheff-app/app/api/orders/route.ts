import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: session.user.id,
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            Product: {
              include: {
                Image: {
                  where: { sortOrder: 0 },
                  take: 1,
                },
                seller: {
                  include: {
                    User: {
                      select: {
                        id: true,
                        name: true,
                        username: true,
                        profileImage: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        conversations: {
          take: 1,
          include: {
            Message: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                User: {
                  select: {
                    name: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Transform orders for frontend
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryMode: order.deliveryMode,
      pickupAddress: order.pickupAddress,
      deliveryAddress: order.deliveryAddress,
      pickupDate: order.pickupDate,
      deliveryDate: order.deliveryDate,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        priceCents: item.priceCents,
        product: {
          id: item.Product.id,
          title: item.Product.title,
          image: item.Product.Image[0]?.fileUrl,
          seller: {
            id: item.Product.seller.User.id,
            name: item.Product.seller.User.name,
            username: item.Product.seller.User.username,
            profileImage: item.Product.seller.User.profileImage,
          },
        },
      })),
      hasUnreadMessages: order.conversations[0]?.Message[0]?.readAt ? false : true,
      lastMessage: order.conversations[0]?.Message[0] ? {
        text: order.conversations[0].Message[0].text,
        sender: order.conversations[0].Message[0].User.name || order.conversations[0].Message[0].User.username,
        createdAt: order.conversations[0].Message[0].createdAt,
      } : null,
    }));

    return NextResponse.json({ orders: transformedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}