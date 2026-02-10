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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '24h':
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
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get previous period for growth calculations
    const periodLength = now.getTime() - startDate.getTime();
    const previousStartDate = new Date(startDate.getTime() - periodLength);
    const previousEndDate = startDate;

    // Parallel queries for all analytics data
    const [
      // Revenue & Financial
      currentOrders,
      previousOrders,
      currentRevenue,
      previousRevenue,
      platformFeesData,
      
      // User Metrics
      totalUsers,
      activeUsers,
      newUsers,
      previousNewUsers,
      
      // Product Metrics
      totalProducts,
      activeProducts,
      newProducts,
      productViews,
      productFavorites,
      
      // Order Metrics
      completedOrders,
      cancelledOrders,
      
      // Delivery Metrics
      totalDeliveries,
      activeDeliverers,
      
      // Engagement Metrics
      totalViews,
      totalFavorites,
      totalMessages,
      
      // Geographic & Category Data
      ordersByCity,
      categoryData,
      
      // Top Performers
      topSellersData,
      topDeliverersData,
      topProductsData
    ] = await Promise.all([
      // Current period orders
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null },
          createdAt: { gte: startDate },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
        },
        select: { totalAmount: true, createdAt: true }
      }),
      
      // Previous period orders
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null },
          createdAt: { gte: previousStartDate, lte: previousEndDate },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
        },
        select: { totalAmount: true }
      }),
      
      // Current revenue
      prisma.order.aggregate({
        where: {
          stripeSessionId: { not: null },
          createdAt: { gte: startDate },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
        },
        _sum: { totalAmount: true }
      }),
      
      // Previous revenue
      prisma.order.aggregate({
        where: {
          stripeSessionId: { not: null },
          createdAt: { gte: previousStartDate, lte: previousEndDate },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
        },
        _sum: { totalAmount: true }
      }),
      
      // Platform fees (simplified calculation)
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null },
          createdAt: { gte: startDate },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
        },
        include: {
          items: {
            include: {
              Product: {
                include: {
                  seller: {
                    include: {
                      User: { select: { id: true } }
                    }
                  }
                }
              }
            }
          }
        }
      }).then(orders => {
        let totalFees = 0;
        orders.forEach(order => {
          order.items.forEach(item => {
            const itemTotal = item.priceCents * item.quantity;
            const platformFee = Math.round((itemTotal * 10) / 100); // 10% default
            totalFees += platformFee;
          });
        });
        return totalFees;
      }),
      
      // Total users
      prisma.user.count(),
      
      // Active users (users who placed orders in period)
      prisma.user.count({
        where: {
          orders: {
            some: {
              stripeSessionId: { not: null },
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      
      // New users
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Previous period new users
      prisma.user.count({
        where: { createdAt: { gte: previousStartDate, lte: previousEndDate } }
      }),
      
      // Total products
      prisma.product.count(),
      
      // Active products (products with orders in period)
      prisma.product.count({
        where: {
          orderItems: {
            some: {
              Order: {
                stripeSessionId: { not: null },
                createdAt: { gte: startDate }
              }
            }
          }
        }
      }),
      
      // New products
      prisma.product.count({
        where: { createdAt: { gte: startDate } }
      }),
      
      // Product views
      prisma.analyticsEvent.count({
        where: {
          eventType: 'VIEW',
          entityType: 'PRODUCT',
          createdAt: { gte: startDate }
        }
      }),
      
      // Product favorites
      prisma.analyticsEvent.count({
        where: {
          eventType: 'FAVORITE',
          entityType: 'PRODUCT',
          createdAt: { gte: startDate }
        }
      }),
      
      // Completed orders
      prisma.order.count({
        where: {
          stripeSessionId: { not: null },
          status: 'CONFIRMED',
          createdAt: { gte: startDate },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
        }
      }),
      
      // Cancelled orders
      prisma.order.count({
        where: {
          status: 'CANCELLED',
          createdAt: { gte: startDate }
        }
      }),
      
      // Total deliveries
      prisma.deliveryOrder.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Active deliverers
      prisma.deliveryProfile.count({
        where: {
          isActive: true,
          deliveryOrders: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        }
      }),
      
      // Total views
      prisma.analyticsEvent.count({
        where: {
          eventType: 'VIEW',
          createdAt: { gte: startDate }
        }
      }),
      
      // Total favorites
      prisma.analyticsEvent.count({
        where: {
          eventType: 'FAVORITE',
          createdAt: { gte: startDate }
        }
      }),
      
      // Total messages
      prisma.message.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Orders by city (simplified - using user city)
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null },
          createdAt: { gte: startDate },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
        },
        include: {
          User: {
            select: { city: true }
          },
          items: {
            select: { priceCents: true, quantity: true }
          }
        }
      }).then(orders => {
        const cityMap = new Map<string, { count: number; revenue: number }>();
        orders.forEach(order => {
          const city = order.User?.city || 'Unknown';
          const revenue = order.items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
          const existing = cityMap.get(city) || { count: 0, revenue: 0 };
          cityMap.set(city, {
            count: existing.count + 1,
            revenue: existing.revenue + revenue
          });
        });
        return Array.from(cityMap.entries()).map(([city, data]) => ({
          city,
          count: data.count,
          revenue: data.revenue
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
      }),
      
      // Category stats
      prisma.product.findMany({
        where: {
          orderItems: {
            some: {
              Order: {
                stripeSessionId: { not: null },
                createdAt: { gte: startDate }
              }
            }
          }
        },
        include: {
          orderItems: {
            where: {
              Order: {
                stripeSessionId: { not: null },
                createdAt: { gte: startDate }
              }
            },
            select: { priceCents: true, quantity: true }
          }
        }
      }).then(products => {
        const categoryMap = new Map<string, { products: Set<string>; revenue: number }>();
        products.forEach(product => {
          const category = product.category || 'Uncategorized';
          const revenue = product.orderItems.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
          const existing = categoryMap.get(category) || { products: new Set(), revenue: 0 };
          existing.products.add(product.id);
          existing.revenue += revenue;
          categoryMap.set(category, existing);
        });
        return Array.from(categoryMap.entries()).map(([category, data]) => ({
          category,
          products: data.products.size,
          revenue: data.revenue,
          avgPrice: data.revenue / data.products.size,
          growth: 0 // Simplified - would need previous period data
        })).sort((a, b) => b.revenue - a.revenue);
      }),
      
      // Top sellers
      prisma.sellerProfile.findMany({
        where: {
          products: {
            some: {
              orderItems: {
                some: {
                  Order: {
                    stripeSessionId: { not: null },
                    createdAt: { gte: startDate }
                  }
                }
              }
            }
          }
        },
        include: {
          User: {
            select: { id: true, name: true, username: true }
          },
          products: {
            include: {
              orderItems: {
                where: {
                  Order: {
                    stripeSessionId: { not: null },
                    createdAt: { gte: startDate }
                  }
                },
                select: { priceCents: true, quantity: true }
              }
            }
          }
        },
        take: 10
      }).then(sellers => {
        return sellers.map(seller => {
          const revenue = seller.products.reduce((sum, product) => {
            return sum + product.orderItems.reduce((itemSum, item) => {
              return itemSum + (item.priceCents * item.quantity);
            }, 0);
          }, 0);
          
          return {
            id: seller.User.id,
            name: seller.User.name || seller.User.username || 'Unknown',
            products: seller.products.length,
            revenue,
            rating: 0 // Would need to calculate from reviews
          };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
      }),
      
      // Top deliverers
      prisma.deliveryProfile.findMany({
        where: {
          isActive: true,
          deliveryOrders: {
            some: {
              createdAt: { gte: startDate }
            }
          }
        },
        include: {
          user: {
            select: { id: true, name: true, username: true }
          },
          deliveryOrders: {
            where: {
              createdAt: { gte: startDate }
            },
            select: { deliveryFee: true, status: true }
          }
        },
        take: 10
      }).then(deliverers => {
        return deliverers.map(deliverer => {
          const deliveries = deliverer.deliveryOrders.filter(d => d.status === 'DELIVERED').length;
          const earnings = deliverer.deliveryOrders
            .filter(d => d.status === 'DELIVERED')
            .reduce((sum, d) => sum + (d.deliveryFee || 0), 0);
          
          return {
            id: deliverer.user.id,
            name: deliverer.user.name || deliverer.user.username || 'Unknown',
            deliveries,
            rating: deliverer.averageRating || 0,
            earnings: Math.round(earnings * 100) // Convert to cents
          };
        }).sort((a, b) => b.earnings - a.earnings).slice(0, 5);
      }),
      
      // Top products
      prisma.product.findMany({
        where: {
          orderItems: {
            some: {
              Order: {
                stripeSessionId: { not: null },
                createdAt: { gte: startDate }
              }
            }
          }
        },
        include: {
          orderItems: {
            where: {
              Order: {
                stripeSessionId: { not: null },
                createdAt: { gte: startDate }
              }
            },
            select: { priceCents: true, quantity: true }
          }
        },
        take: 20
      }).then(async products => {
        const productIds = products.map(p => p.id);
        
        const [viewsData, favoritesData] = await Promise.all([
          prisma.analyticsEvent.groupBy({
            by: ['entityId'],
            where: {
              eventType: 'VIEW',
              entityType: 'PRODUCT',
              entityId: { in: productIds },
              createdAt: { gte: startDate }
            },
            _count: { entityId: true }
          }),
          prisma.analyticsEvent.groupBy({
            by: ['entityId'],
            where: {
              eventType: 'FAVORITE',
              entityType: 'PRODUCT',
              entityId: { in: productIds },
              createdAt: { gte: startDate }
            },
            _count: { entityId: true }
          })
        ]);
        
        const viewsMap = new Map(viewsData.map(v => [v.entityId, v._count.entityId]));
        const favoritesMap = new Map(favoritesData.map(f => [f.entityId, f._count.entityId]));
        
        return products.map(product => {
          const revenue = product.orderItems.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
          const orders = product.orderItems.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            id: product.id,
            title: product.title,
            views: viewsMap.get(product.id) || 0,
            favorites: favoritesMap.get(product.id) || 0,
            orders,
            revenue
          };
        }).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
      })
    ]);

    // Calculate derived metrics
    const totalRevenue = currentRevenue._sum.totalAmount || 0;
    const previousTotalRevenue = previousRevenue._sum.totalAmount || 0;
    const revenueGrowth = previousTotalRevenue > 0 
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
      : 0;
    
    const averageOrderValue = currentOrders.length > 0 
      ? totalRevenue / currentOrders.length 
      : 0;
    
    const monthlyRevenue = range === '30d' ? totalRevenue : 
      (range === '7d' ? (totalRevenue / 7) * 30 : 
      (range === '90d' ? (totalRevenue / 90) * 30 : totalRevenue));
    
    const userGrowth = previousNewUsers > 0 
      ? ((newUsers - previousNewUsers) / previousNewUsers) * 100 
      : 0;
    
    const orderGrowth = previousOrders.length > 0 
      ? ((currentOrders.length - previousOrders.length) / previousOrders.length) * 100 
      : 0;

    // Calculate average product price
    const allProducts = await prisma.product.findMany({
      where: {
        priceCents: {
          gt: 0
        }
      },
      select: { priceCents: true }
    });
    const averageProductPrice = allProducts.length > 0
      ? allProducts.reduce((sum, p) => sum + (p.priceCents || 0), 0) / allProducts.length
      : 0;

    // Calculate average delivery time (simplified)
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: 'DELIVERED',
        createdAt: { gte: startDate },
        pickedUpAt: { not: null },
        deliveredAt: { not: null }
      },
      select: {
        pickedUpAt: true,
        deliveredAt: true
      }
    });
    
    const averageDeliveryTime = deliveryOrders.length > 0
      ? deliveryOrders.reduce((sum, order) => {
          if (order.pickedUpAt && order.deliveredAt) {
            const timeDiff = order.deliveredAt.getTime() - order.pickedUpAt.getTime();
            return sum + (timeDiff / (1000 * 60)); // Convert to minutes
          }
          return sum;
        }, 0) / deliveryOrders.length
      : 0;

    const deliverySuccessRate = totalDeliveries > 0
      ? (completedOrders / totalDeliveries) * 100
      : 0;

    return NextResponse.json({
      // Revenue & Financial
      totalRevenue: totalRevenue / 100, // Convert cents to euros
      monthlyRevenue: monthlyRevenue / 100,
      averageOrderValue: averageOrderValue / 100,
      revenueGrowth,
      platformFees: platformFeesData / 100,
      
      // User Metrics
      totalUsers,
      activeUsers,
      newUsers,
      userRetention: 0, // Would need more complex calculation
      userGrowth,
      
      // Product Metrics
      totalProducts,
      activeProducts,
      newProducts,
      averageProductPrice: averageProductPrice / 100,
      productViews,
      productFavorites,
      
      // Order Metrics
      totalOrders: currentOrders.length,
      completedOrders,
      cancelledOrders,
      averageDeliveryTime,
      orderGrowth,
      
      // Delivery Metrics
      totalDeliveries,
      activeDeliverers,
      averageDeliveryRating: 0, // Would need to calculate from reviews
      deliverySuccessRate,
      
      // Engagement Metrics
      totalViews,
      totalFavorites,
      totalMessages,
      averageSessionTime: 0, // Would need session tracking
      bounceRate: 0, // Would need session tracking
      
      // Geographic Data
      topCities: ordersByCity,
      deliveryRegions: [], // Would need delivery region data
      
      // Time-based Data (simplified - would need more complex aggregation)
      hourlyActivity: [],
      dailyActivity: [],
      weeklyActivity: [],
      
      // Category Performance
      categoryStats: categoryData,
      
      // Top Performers
      topSellers: topSellersData.map(s => ({ ...s, revenue: s.revenue / 100 })),
      topDeliverers: topDeliverersData.map(d => ({ ...d, earnings: d.earnings / 100 })),
      topProducts: topProductsData.map(p => ({ ...p, revenue: p.revenue / 100 }))
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

