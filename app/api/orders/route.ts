import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const stripeSessionId = searchParams.get('stripeSessionId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    });

    if (!user) {
      console.error('User not found for email:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('🔍 Orders API: Fetching orders for user:', user.id, 'email:', session.user.email, 'status:', status, 'stripeSessionId:', stripeSessionId);

    const where: any = {
      userId: user.id,
    };

    // Filter by stripeSessionId if provided (for polling after payment)
    if (stripeSessionId) {
      where.stripeSessionId = stripeSessionId;
    }
    // Note: We show ALL orders for the user (including unpaid ones) so they can see their order history
    // This allows users to see orders even if webhook hasn't processed yet

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }, // Most recent orders first
        { orderNumber: 'desc' } // Then by order number for consistency
      ],
      take: limit,
      skip: offset,
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
    });

    console.log(`✅ Orders API: Found ${orders.length} orders for user ${user.id}`);
    if (orders.length > 0) {
      console.log(`📦 Orders:`, orders.map(o => ({ id: o.id, orderNumber: o.orderNumber, status: o.status, stripeSessionId: o.stripeSessionId })));
    }

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