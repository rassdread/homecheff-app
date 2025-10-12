import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any);
    
    if (!(session as any)?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: (session as any).user.id },
      select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const range = url.searchParams.get('range') || '7d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get all analytics data in parallel
    const [
      // Financial metrics
      totalRevenue,
      monthlyRevenue,
      averageOrderValue,
      platformFees,
      
      // User metrics
      totalUsers,
      activeUsers,
      newUsers,
      
      // Product metrics
      totalProducts,
      activeProducts,
      newProducts,
      averageProductPrice,
      productViews,
      productFavorites,
      
      // Order metrics
      totalOrders,
      completedOrders,
      cancelledOrders,
      averageDeliveryTime,
      
      // Delivery metrics
      totalDeliveries,
      activeDeliverers,
      averageDeliveryRating,
      deliverySuccessRate,
      
      // Engagement metrics
      totalViews,
      totalFavorites,
      totalMessages,
      averageSessionTime,
      bounceRate,
      
      // Geographic data
      topCities,
      deliveryRegions,
      
      // Time-based data
      hourlyActivity,
      dailyActivity,
      weeklyActivity,
      
      // Category performance
      categoryStats,
      
      // Top performers
      topSellers,
      topDeliverers,
      topProducts
    ] = await Promise.all([
      // Financial metrics
      prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { status: 'CAPTURED' }
      }).then(result => (result._sum.amountCents || 0) / 100),
      
      prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { 
          status: 'CAPTURED',
          createdAt: { gte: startDate }
        }
      }).then(result => (result._sum.amountCents || 0) / 100),
      
      prisma.transaction.aggregate({
        _avg: { amountCents: true },
        where: { status: 'CAPTURED' }
      }).then(result => (result._avg.amountCents || 0) / 100),
      
      prisma.transaction.aggregate({
        _sum: { platformFeeBps: true },
        where: { status: 'CAPTURED' }
      }).then(result => (result._sum.platformFeeBps || 0) / 100),
      
      // User metrics
      prisma.user.count(),
      
      prisma.user.count({
        where: {
          updatedAt: { gte: startDate }
        }
      }),
      
      prisma.user.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Product metrics
      prisma.product.count(),
      
      prisma.product.count({
        where: { isActive: true }
      }),
      
      prisma.product.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      prisma.product.aggregate({
        _avg: { priceCents: true },
        where: { isActive: true }
      }).then(result => (result._avg.priceCents || 0) / 100),
      
      prisma.analyticsEvent.count({
        where: {
          eventType: 'PRODUCT_VIEW',
          createdAt: { gte: startDate }
        }
      }),
      
      prisma.favorite.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Order metrics
      prisma.transaction.count({
        where: { status: 'CAPTURED' }
      }),
      
      prisma.transaction.count({
        where: { 
          status: 'CAPTURED',
          createdAt: { gte: startDate }
        }
      }),
      
      prisma.transaction.count({
        where: { 
          status: 'CANCELLED',
          createdAt: { gte: startDate }
        }
      }),
      
      // Average delivery time (mock data for now)
      Promise.resolve(45), // 45 minutes
      
      // Delivery metrics
      prisma.deliveryOrder.count({
        where: { status: 'CAPTURED' }
      }),
      
      prisma.deliveryProfile.count({
        where: { isActive: true }
      }),
      
      // Average delivery rating (mock data for now)
      Promise.resolve(4.7),
      
      // Delivery success rate (mock data for now)
      Promise.resolve(96.5),
      
      // Engagement metrics
      prisma.analyticsEvent.count({
        where: {
          eventType: 'PRODUCT_VIEW',
          createdAt: { gte: startDate }
        }
      }),
      
      prisma.favorite.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      prisma.message.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Average session time (mock data for now)
      Promise.resolve(8.5), // 8.5 minutes
      
      // Bounce rate (mock data for now)
      Promise.resolve(35.2), // 35.2%
      
      // Geographic data
      prisma.user.groupBy({
        by: ['place'],
        _count: { place: true },
        _sum: {},
        where: {
          place: { not: null },
          createdAt: { gte: startDate }
        },
        orderBy: { _count: { place: 'desc' } },
        take: 10
      }).then(results => results.map(r => ({
        city: r.place || 'Onbekend',
        count: r._count.place,
        revenue: 0
      }))),
      
      // Delivery regions (mock data for now)
      Promise.resolve([
        { region: 'Amsterdam', deliveries: 245, avgTime: 32 },
        { region: 'Rotterdam', deliveries: 189, avgTime: 28 },
        { region: 'Den Haag', deliveries: 156, avgTime: 35 },
        { region: 'Utrecht', deliveries: 134, avgTime: 30 },
        { region: 'Eindhoven', deliveries: 98, avgTime: 38 }
      ]),
      
      // Hourly activity (mock data for now)
      Promise.resolve(Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        users: Math.floor(Math.random() * 100) + 50,
        orders: Math.floor(Math.random() * 50) + 20
      }))),
      
      // Daily activity
      prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(DISTINCT user_id) as users,
          COUNT(CASE WHEN event_type = 'PURCHASE' THEN 1 END) as orders,
          COALESCE(SUM(CASE WHEN event_type = 'PURCHASE' THEN (metadata->>'amount')::numeric END), 0) as revenue
        FROM "AnalyticsEvent" 
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      ` as any,
      
      // Weekly activity (mock data for now)
      Promise.resolve(Array.from({ length: 12 }, (_, i) => ({
        week: `Week ${i + 1}`,
        users: Math.floor(Math.random() * 500) + 200,
        orders: Math.floor(Math.random() * 200) + 100,
        revenue: Math.floor(Math.random() * 10000) + 5000
      }))),
      
      // Category performance
      prisma.product.groupBy({
        by: ['category'],
        _count: { category: true },
        _avg: { priceCents: true },
        where: {
          isActive: true,
          createdAt: { gte: startDate }
        },
        orderBy: { _count: { category: 'desc' } },
        take: 10
      }).then(results => results.map(r => ({
        category: r.category || 'Onbekend',
        products: r._count.category,
        revenue: Math.floor(Math.random() * 5000) + 1000, // Mock revenue
        avgPrice: (r._avg.priceCents || 0) / 100,
        growth: Math.floor(Math.random() * 40) - 10 // Mock growth
      }))),
      
      // Top sellers
      prisma.sellerProfile.findMany({
        include: {
          User: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          products: {
            select: {
              id: true,
              priceCents: true
            }
          }
        },
        take: 10
      }).then(sellers => sellers.map(seller => ({
        id: seller.id,
        name: seller.User.name || seller.User.username || 'Onbekend',
        products: seller.products.length,
        revenue: Math.floor(Math.random() * 10000) + 1000, // Mock revenue
        rating: Math.random() * 2 + 3 // Mock rating 3-5
      }))),
      
      // Top deliverers
      prisma.deliveryProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          },
          deliveryOrders: {
            select: {
              id: true,
              deliveryFee: true
            }
          }
        },
        where: { isActive: true },
        take: 10
      }).then(deliverers => deliverers.map(deliverer => ({
        id: deliverer.id,
        name: deliverer.user.name || deliverer.user.username || 'Onbekend',
        deliveries: deliverer.deliveryOrders.length,
        rating: Math.random() * 2 + 3, // Mock rating 3-5
        earnings: deliverer.deliveryOrders.reduce((sum, order) => sum + order.deliveryFee, 0)
      }))),
      
      // Top products with real view counts
      prisma.product.findMany({
        include: {
          Image: {
            select: { fileUrl: true },
            take: 1
          },
          favorites: {
            select: { id: true }
          }
        },
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 20 // Get more to sort by views
      }).then(async (products) => {
        // Get view counts for each product
        const productsWithViews = await Promise.all(
          products.map(async (product) => {
            const viewCount = await prisma.analyticsEvent.count({
              where: {
                entityId: product.id,
                eventType: 'PRODUCT_VIEW'
              }
            });
            
            const orderCount = await prisma.orderItem.count({
              where: {
                productId: product.id,
                Order: {
                  status: {
                    in: ['PROCESSING', 'SHIPPED', 'DELIVERED']
                  }
                }
              }
            });
            
            return {
              id: product.id,
              title: product.title,
              views: viewCount,
              favorites: product.favorites.length,
              orders: orderCount,
              revenue: orderCount * (product.priceCents / 100) // Approximate revenue
            };
          })
        );
        
        // Sort by views and return top 10
        return productsWithViews.sort((a, b) => b.views - a.views).slice(0, 10);
      })
    ]);

    // Calculate growth percentages
    const previousPeriodStart = new Date(startDate);
    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setTime(previousPeriodEnd.getTime() + (now.getTime() - startDate.getTime()));
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime()));

    const [
      previousRevenue,
      previousUsers,
      previousOrders
    ] = await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amountCents: true },
        where: { 
          status: 'CAPTURED',
          createdAt: { 
            gte: previousPeriodStart,
            lt: previousPeriodEnd
          }
        }
      }).then(result => (result._sum.amountCents || 0) / 100),
      
      prisma.user.count({
        where: {
          createdAt: { 
            gte: previousPeriodStart,
            lt: previousPeriodEnd
          }
        }
      }),
      
      prisma.transaction.count({
        where: { 
          status: 'CAPTURED',
          createdAt: { 
            gte: previousPeriodStart,
            lt: previousPeriodEnd
          }
        }
      })
    ]);

    const revenueGrowth = previousRevenue > 0 ? ((monthlyRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const userGrowth = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;
    const orderGrowth = previousOrders > 0 ? ((completedOrders - previousOrders) / previousOrders) * 100 : 0;

    // Calculate user retention (mock data for now)
    const userRetention = 78.5;

    const analyticsData = {
      // Revenue & Financial
      totalRevenue,
      monthlyRevenue,
      averageOrderValue,
      revenueGrowth,
      platformFees,
      
      // User Metrics
      totalUsers,
      activeUsers,
      newUsers,
      userRetention,
      userGrowth,
      
      // Product Metrics
      totalProducts,
      activeProducts,
      newProducts,
      averageProductPrice,
      productViews,
      productFavorites,
      
      // Order Metrics
      totalOrders,
      completedOrders,
      cancelledOrders,
      averageDeliveryTime,
      orderGrowth,
      
      // Delivery Metrics
      totalDeliveries,
      activeDeliverers,
      averageDeliveryRating,
      deliverySuccessRate,
      
      // Engagement Metrics
      totalViews,
      totalFavorites,
      totalMessages,
      averageSessionTime,
      bounceRate,
      
      // Geographic Data
      topCities,
      deliveryRegions,
      
      // Time-based Data
      hourlyActivity,
      dailyActivity: dailyActivity || [],
      weeklyActivity,
      
      // Category Performance
      categoryStats,
      
      // Top Performers
      topSellers,
      topDeliverers,
      topProducts
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
