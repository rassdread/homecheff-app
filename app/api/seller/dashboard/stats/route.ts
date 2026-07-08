import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { matchesCurrentMode, STRIPE_SESSION_ID_PREFIX } from '@/lib/stripe';
import { getBusinessVisibilityProfile } from '@/lib/business/visibility-profile';
import {
  analyticsMetricsForLevel,
  IMPLEMENTED_ANALYTICS_METRICS,
} from '@/lib/business/analytics-tier';

export const dynamic = 'force-dynamic';

type PopularListing = {
  id: string;
  title: string;
  revenue: number;
  sales: number;
};

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
      include: {
        Subscription: true,
      },
    });

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    const now = new Date();
    const periodDays =
      {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      }[period] || 30;

    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const [currentStats, previousStats] = await Promise.all([
      getStatsForPeriod(sellerProfile.id, user.id, startDate, now),
      getStatsForPeriod(sellerProfile.id, user.id, previousStartDate, startDate),
    ]);

    const revenueChange =
      previousStats.totalRevenue > 0
        ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100
        : 0;

    const ordersChange =
      previousStats.totalOrders > 0
        ? ((currentStats.totalOrders - previousStats.totalOrders) / previousStats.totalOrders) * 100
        : 0;

    const customersChange =
      previousStats.totalCustomers > 0
        ? ((currentStats.totalCustomers - previousStats.totalCustomers) / previousStats.totalCustomers) * 100
        : 0;

    const ratingChange =
      previousStats.averageRating > 0
        ? ((currentStats.averageRating - previousStats.averageRating) / previousStats.averageRating) * 100
        : 0;

    const viewsChange =
      previousStats.totalViews > 0
        ? ((currentStats.totalViews - previousStats.totalViews) / previousStats.totalViews) * 100
        : 0;

    const favoritesChange =
      previousStats.totalFavorites > 0
        ? ((currentStats.totalFavorites - previousStats.totalFavorites) / previousStats.totalFavorites) * 100
        : 0;

    const messagesChange =
      previousStats.totalMessages > 0
        ? ((currentStats.totalMessages - previousStats.totalMessages) / previousStats.totalMessages) * 100
        : 0;

    const conversionRate =
      currentStats.totalViews > 0
        ? (currentStats.totalOrders / currentStats.totalViews) * 100
        : currentStats.totalOrders > 0
          ? 100
          : 0;

    const visibility = getBusinessVisibilityProfile({
      subscriptionId: sellerProfile.subscriptionId,
      subscriptionValidUntil: sellerProfile.subscriptionValidUntil,
      Subscription: sellerProfile.Subscription,
    });
    const platformFeePercentage = visibility.feePercent;

    const platformFee = Math.round((currentStats.totalRevenue * platformFeePercentage) / 100);
    const netEarnings = currentStats.totalRevenue - platformFee;

    return NextResponse.json({
      totalRevenue: currentStats.totalRevenue,
      platformFee,
      platformFeePercentage,
      netEarnings,
      businessPlan: visibility.plan,
      analyticsLevel: visibility.analyticsLevel,
      analyticsMetrics: analyticsMetricsForLevel(visibility.analyticsLevel),
      implementedAnalyticsMetrics: [...IMPLEMENTED_ANALYTICS_METRICS],
      totalOrders: currentStats.totalOrders,
      totalCustomers: currentStats.totalCustomers,
      averageRating: currentStats.averageRating,
      totalViews: currentStats.totalViews,
      totalFavorites: currentStats.totalFavorites,
      totalMessages: currentStats.totalMessages,
      popularListings: currentStats.popularListings,
      conversionRate: Math.round(conversionRate * 10) / 10,
      revenueChange: Math.round(revenueChange * 100) / 100,
      ordersChange: Math.round(ordersChange * 100) / 100,
      customersChange: Math.round(customersChange * 100) / 100,
      ratingChange: Math.round(ratingChange * 100) / 100,
      viewsChange: Math.round(viewsChange * 100) / 100,
      favoritesChange: Math.round(favoritesChange * 100) / 100,
      messagesChange: Math.round(messagesChange * 100) / 100,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function getStatsForPeriod(
  sellerId: string,
  sellerUserId: string,
  startDate: Date,
  endDate: Date,
) {
  const sellerProducts = await prisma.product.findMany({
    where: { sellerId },
    select: { id: true, title: true },
  });
  const productIds = sellerProducts.map((p) => p.id);

  const [orders, reviews, viewsCount, favoritesCount, messagesCount] = await Promise.all([
    prisma.order
      .findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          stripeSessionId: { startsWith: STRIPE_SESSION_ID_PREFIX },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
          items: {
            some: {
              Product: { sellerId },
            },
          },
        },
        select: {
          id: true,
          userId: true,
          stripeSessionId: true,
          items: {
            where: {
              Product: { sellerId },
            },
            select: {
              productId: true,
              priceCents: true,
              quantity: true,
            },
          },
        },
        take: 1000,
      })
      .then((rows) =>
        rows.filter((order) => order.stripeSessionId && matchesCurrentMode(order.stripeSessionId)),
      ),
    prisma.productReview.findMany({
      where: {
        product: { sellerId },
        reviewSubmittedAt: { not: null },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { rating: true },
    }),
    productIds.length === 0
      ? Promise.resolve(0)
      : prisma.analyticsEvent.count({
          where: {
            eventType: 'VIEW',
            entityType: 'PRODUCT',
            entityId: { in: productIds },
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
    productIds.length === 0
      ? Promise.resolve(0)
      : prisma.favorite.count({
          where: {
            productId: { in: productIds },
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
    prisma.message.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        deletedAt: null,
        Conversation: {
          OR: [
            { Product: { sellerId } },
            {
              ConversationParticipant: {
                some: { userId: sellerUserId },
              },
            },
          ],
        },
      },
    }),
  ]);

  const totalRevenue = orders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemSum, item) => itemSum + item.priceCents * item.quantity, 0)
    );
  }, 0);

  const totalOrders = orders.length;
  const uniqueCustomers = new Set(orders.map((order) => order.userId)).size;
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  const revenueByProduct = new Map<string, { revenue: number; sales: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.productId) continue;
      const prev = revenueByProduct.get(item.productId) ?? { revenue: 0, sales: 0 };
      prev.revenue += item.priceCents * item.quantity;
      prev.sales += item.quantity;
      revenueByProduct.set(item.productId, prev);
    }
  }

  const titleById = new Map(sellerProducts.map((p) => [p.id, p.title]));
  const popularListings: PopularListing[] = [...revenueByProduct.entries()]
    .map(([id, stats]) => ({
      id,
      title: titleById.get(id) ?? 'Listing',
      revenue: stats.revenue,
      sales: stats.sales,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    totalRevenue,
    totalOrders,
    totalCustomers: uniqueCustomers,
    averageRating,
    totalViews: viewsCount,
    totalFavorites: favoritesCount,
    totalMessages: messagesCount,
    popularListings,
  };
}
