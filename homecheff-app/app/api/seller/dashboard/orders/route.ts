import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Calculate date range
    const now = new Date();
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[period] || 30;

    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get orders for this seller
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now
        },
        items: {
          some: {
            Product: {
              sellerId: sellerProfile.id
            }
          }
        }
      },
      include: {
        User: {
          select: {
            name: true,
            username: true
          }
        },
        items: {
          include: {
            Product: {
              select: {
                title: true,
                sellerId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Filter orders to only include items from this seller
    const filteredOrders = orders.map(order => ({
      ...order,
      items: order.items.filter((item: any) => item.Product?.sellerId === sellerProfile.id)
    })).filter(order => order.items.length > 0);

    // Transform orders to include seller-specific data
    const transformedOrders = filteredOrders.map(order => {
      const sellerItems = order.items.filter(item => item.Product);
      const totalAmount = sellerItems.reduce((sum, item) => {
        return sum + (item.priceCents * item.quantity);
      }, 0);

      return {
        id: order.id,
        customerName: order.User?.name || order.User?.username || 'Onbekend',
        productTitle: sellerItems.length === 1 
          ? sellerItems[0].Product?.title || 'Onbekend product'
          : `${sellerItems.length} producten`,
        amount: totalAmount,
        status: 'Voltooid', // This would need to be tracked in the Order model
        createdAt: order.createdAt.toISOString()
      };
    });

    return NextResponse.json({ orders: transformedOrders });
  } catch (error) {
    console.error('Error fetching dashboard orders:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
