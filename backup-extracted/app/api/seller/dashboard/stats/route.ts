import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // Get current and previous period stats in parallel for better performance
    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const [currentStats, previousStats] = await Promise.all([
      getStatsForPeriod(sellerProfile.id, startDate, now),
      getStatsForPeriod(sellerProfile.id, previousStartDate, startDate)
    ]);

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

    const conversionRate = currentStats.totalViews > 0
      ? (currentStats.totalOrders / currentStats.totalViews) * 100
      : currentStats.totalOrders > 0 ? 100 : 0;

    return NextResponse.json({
      totalRevenue: currentStats.totalRevenue,
      totalOrders: currentStats.totalOrders,
      totalCustomers: currentStats.totalCustomers,
      averageRating: currentStats.averageRating,
      totalViews: currentStats.totalViews,
      conversionRate: Math.round(conversionRate * 10) / 10,
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
  // Parallelize all queries for better performance
  const [sellerProducts, orders, reviews, viewsCount] = await Promise.all([
    // Get seller products (just IDs for filtering)
    prisma.product.findMany({
      where: { sellerId },
      select: { id: true }
    }),
    // Get orders for this seller - ONLY orders with Stripe payment (stripeSessionId)
    // Use select to only get what we need
    prisma.order.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        stripeSessionId: { not: null },
        NOT: { orderNumber: { startsWith: 'SUB-' } },
        items: {
          some: {
            Product: { sellerId: sellerId }
          }
        }
      },
      select: {
        id: true,
        userId: true,
        createdAt: true,
        items: {
          where: {
            Product: { sellerId: sellerId }
          },
          select: {
            priceCents: true,
            quantity: true
          }
        }
      },
      take: 1000 // Limit to prevent loading too much data
    }),
    // Get average rating from reviews
    prisma.productReview.findMany({
      where: {
        product: { sellerId: sellerId },
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { rating: true }
    }),
    // Get total views for seller products
    prisma.product.count({
      where: { sellerId }
    }).then(count => {
      if (count === 0) return 0;
      return prisma.product.findMany({
        where: { sellerId },
        select: { id: true }
      }).then(products => {
        const productIds = products.map(p => p.id);
        if (productIds.length === 0) return 0;
        return prisma.analyticsEvent.count({
          where: {
            eventType: 'VIEW',
            entityType: 'PRODUCT',
            entityId: { in: productIds },
            createdAt: { gte: startDate, lte: endDate }
          }
        });
      });
    })
  ]);

  // Calculate stats from order items (items already filtered by query)
  const totalRevenue = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => {
      return itemSum + (item.priceCents * item.quantity);
    }, 0);
  }, 0);

  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map(order => order.userId)).size;
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const totalViews = viewsCount;

  return {
    totalRevenue,
    totalOrders,
    totalCustomers: uniqueCustomers,
    averageRating,
    totalViews
  };
}
