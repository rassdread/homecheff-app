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

    // Get current period stats
    const currentStats = await getStatsForPeriod(sellerProfile.id, startDate, now);

    // Get previous period stats for comparison
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousStats = await getStatsForPeriod(sellerProfile.id, previousStartDate, startDate);

    // Calculate changes
    const revenueChange = previousStats.totalRevenue > 0 
      ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
      : 0;

    const ordersChange = previousStats.totalOrders > 0
      ? ((currentStats.totalOrders - previousStats.totalOrders) / previousStats.totalOrders) * 100
      : 0;

    const customersChange = previousStats.totalCustomers > 0
      ? ((currentStats.totalCustomers - previousStats.totalCustomers) / previousStats.totalCustomers) * 100
      : 0;

    const ratingChange = previousStats.averageRating > 0
      ? ((currentStats.averageRating - previousStats.averageRating) / previousStats.averageRating) * 100
      : 0;

    const viewsChange = previousStats.totalViews > 0
      ? ((currentStats.totalViews - previousStats.totalViews) / previousStats.totalViews) * 100
      : 0;

    return NextResponse.json({
      totalRevenue: currentStats.totalRevenue,
      totalOrders: currentStats.totalOrders,
      totalCustomers: currentStats.totalCustomers,
      averageRating: currentStats.averageRating,
      totalViews: currentStats.totalViews,
      revenueChange: Math.round(revenueChange * 100) / 100,
      ordersChange: Math.round(ordersChange * 100) / 100,
      customersChange: Math.round(customersChange * 100) / 100,
      ratingChange: Math.round(ratingChange * 100) / 100,
      viewsChange: Math.round(viewsChange * 100) / 100,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function getStatsForPeriod(sellerId: string, startDate: Date, endDate: Date) {
  // Get orders for this seller
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      items: {
        some: {
          Product: {
            sellerId: sellerId
          }
        }
      }
    },
    include: {
      items: {
        include: {
          Product: {
            select: {
              sellerId: true
            }
          }
        }
      }
    }
  });

  // Filter orders to only include items from this seller
  const filteredOrders = orders.map(order => ({
    ...order,
    items: order.items.filter((item: any) => item.Product?.sellerId === sellerId)
  })).filter(order => order.items.length > 0);

  // Calculate stats
  const totalRevenue = filteredOrders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => {
      return itemSum + (item.priceCents * item.quantity);
    }, 0);
  }, 0);

  const totalOrders = filteredOrders.length;

  const uniqueCustomers = new Set(filteredOrders.map(order => order.userId)).size;

  // Get average rating from reviews
  const reviews = await prisma.productReview.findMany({
    where: {
      product: {
        sellerId: sellerId
      },
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      rating: true
    }
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  // Get total views (this would need to be tracked separately)
  // For now, we'll estimate based on orders
  const totalViews = totalOrders * 10; // Rough estimate

  return {
    totalRevenue,
    totalOrders,
    totalCustomers: uniqueCustomers,
    averageRating,
    totalViews
  };
}
