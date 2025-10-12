import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface MonthlyStats {
  month: string;
  orders: number;
  revenue: number;
  payouts: number;
  platformFee: number;
}

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

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get financial overview data
    const [
      totalOrders,
      totalRevenue,
      totalPayouts,
      platformFees,
      recentOrders,
      topSellers,
      topDeliverers,
      monthlyStats
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      
      // Total revenue (sum of all order amounts)
      prisma.order.aggregate({
        _sum: {
          totalAmount: true
        }
      }),
      
      // Total payouts
      prisma.payout.aggregate({
        _sum: {
          amountCents: true
        }
      }),
      
      // Platform fees (calculated from transactions)
      prisma.transaction.aggregate({
        _sum: {
          amountCents: true
        }
      }).then(result => {
        // Platform fee is typically 12% of total transactions
        return Math.round((result._sum.amountCents || 0) * 0.12);
      }),
      
      // Recent orders
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              Product: {
                include: {
                  seller: {
                    include: {
                      User: {
                        select: {
                          name: true,
                          username: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          User: {
            select: {
              name: true,
              username: true
            }
          }
        }
      }),
      
      // Top sellers by earnings
      prisma.user.findMany({
        where: {
          role: 'SELLER',
          Payout: {
            some: {}
          }
        },
        include: {
          Payout: {
            include: {
              Transaction: true
            }
          },
          SellerProfile: true
        },
        take: 5
      }).then(users => 
        users.map(user => ({
          id: user.id,
          name: user.name || user.username || 'Unknown',
          totalEarnings: user.Payout.reduce((sum, payout) => sum + payout.amountCents, 0),
          totalPayouts: user.Payout.length,
          sellerProfile: user.SellerProfile
        })).sort((a, b) => b.totalEarnings - a.totalEarnings)
      ),
      
      // Top deliverers by earnings
      prisma.deliveryProfile.findMany({
        where: {
          totalEarnings: {
            gt: 0
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true
            }
          }
        },
        orderBy: {
          totalEarnings: 'desc'
        },
        take: 5
      }),
      
      // Monthly stats (last 6 months)
      getMonthlyStats()
    ]);

    // Calculate financial summary
    const totalRevenueCents = totalRevenue._sum.totalAmount || 0;
    const totalPayoutsCents = totalPayouts._sum.amountCents || 0;
    const netPlatformRevenue = totalRevenueCents - totalPayoutsCents;

    return NextResponse.json({
      overview: {
        totalOrders,
        totalRevenue: totalRevenueCents,
        totalPayouts: totalPayoutsCents,
        platformFees,
        netPlatformRevenue,
        averageOrderValue: totalOrders > 0 ? Math.round(totalRevenueCents / totalOrders) : 0
      },
      recentOrders: recentOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        buyer: order.User.name || order.User.username || 'Unknown',
        items: order.items.map(item => ({
          title: item.Product.title,
          seller: item.Product.seller?.User?.name || item.Product.seller?.User?.username || 'Unknown',
          quantity: item.quantity,
          price: item.priceCents
        }))
      })),
      topSellers,
      topDeliverers: topDeliverers.map(deliverer => ({
        id: deliverer.user.id,
        name: deliverer.user.name || deliverer.user.username || 'Unknown',
        totalEarnings: deliverer.totalEarnings,
        totalDeliveries: deliverer.totalDeliveries,
        averageRating: deliverer.averageRating || 0,
        maxDistance: deliverer.maxDistance
      })),
      monthlyStats
    });
  } catch (error) {
    console.error('Error fetching admin financial data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}

async function getMonthlyStats(): Promise<MonthlyStats[]> {
  const months: MonthlyStats[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    
    const [orders, revenue, payouts] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      prisma.payout.aggregate({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: {
          amountCents: true
        }
      })
    ]);
    
    months.push({
      month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
      orders,
      revenue: revenue._sum.totalAmount || 0,
      payouts: payouts._sum.amountCents || 0,
      platformFee: Math.round((revenue._sum.totalAmount || 0) * 0.12)
    });
  }
  
  return months;
}
