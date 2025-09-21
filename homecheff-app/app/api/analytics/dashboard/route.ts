import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '7d'; // 7d, 30d, 90d, 1y
    const entityType = searchParams.get('entityType') || 'PRODUCT';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get analytics data
    const [
      totalViews,
      uniqueUsers,
      topProducts,
      viewsByDay,
      eventTypes
    ] = await Promise.all([
      // Total views
      prisma.analyticsEvent.count({
        where: {
          eventType: 'VIEW',
          entityType: entityType,
          createdAt: { gte: startDate }
        }
      }),

      // Unique users
      prisma.analyticsEvent.findMany({
        where: {
          eventType: 'VIEW',
          entityType: entityType,
          createdAt: { gte: startDate },
          userId: { not: null }
        },
        select: { userId: true },
        distinct: ['userId']
      }),

      // Top products by views
      prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          eventType: 'VIEW',
          entityType: entityType,
          createdAt: { gte: startDate }
        },
        _count: { entityId: true },
        orderBy: { _count: { entityId: 'desc' } },
        take: 10
      }),

      // Views by day
      prisma.analyticsEvent.groupBy({
        by: ['createdAt'],
        where: {
          eventType: 'VIEW',
          entityType: entityType,
          createdAt: { gte: startDate }
        },
        _count: { entityId: true },
        orderBy: { createdAt: 'asc' }
      }),

      // Event types breakdown
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: {
          entityType: entityType,
          createdAt: { gte: startDate }
        },
        _count: { eventType: true }
      })
    ]);

    // Get product details for top products
    const topProductIds = topProducts.map(p => p.entityId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: {
        id: true,
        title: true,
        priceCents: true,
        viewCount: true,
        seller: {
          select: {
            User: {
              select: { name: true, username: true }
            }
          }
        }
      }
    });

    // Combine top products with their details
    const topProductsWithDetails = topProducts.map(product => {
      const details = topProductDetails.find(d => d.id === product.entityId);
      return {
        id: product.entityId,
        views: product._count.entityId,
        title: details?.title || 'Unknown Product',
        priceCents: details?.priceCents || 0,
        viewCount: details?.viewCount || 0,
        seller: details?.seller?.User?.name || details?.seller?.User?.username || 'Unknown'
      };
    });

    return NextResponse.json({
      period,
      entityType,
      totalViews,
      uniqueUsers: uniqueUsers.length,
      topProducts: topProductsWithDetails,
      viewsByDay: viewsByDay.map(day => ({
        date: day.createdAt.toISOString().split('T')[0],
        views: day._count.entityId
      })),
      eventTypes: eventTypes.map(event => ({
        type: event.eventType,
        count: event._count.eventType
      }))
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}
