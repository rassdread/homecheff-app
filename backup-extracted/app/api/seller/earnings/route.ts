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

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { 
        id: true,
        stripeConnectAccountId: true,
        stripeConnectOnboardingCompleted: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parallelize initial queries
    const [payouts, sellerProfile] = await Promise.all([
      // Get payouts for this seller (limit to recent ones for performance)
      prisma.payout.findMany({
        where: {
          toUserId: user.id
        },
        include: {
          Transaction: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100 // Limit for performance
      }),
      // Get seller profile to find sellerId
      prisma.sellerProfile.findUnique({
        where: { userId: user.id },
        select: { id: true }
      })
    ]);

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Get orders with limited data for calculations (much faster)
    // We only need items data, not full order objects
    const [orders, ordersCount] = await Promise.all([
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null },
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          },
          items: {
            some: {
              Product: {
                sellerId: sellerProfile.id
              }
            }
          }
        },
        select: {
          id: true,
          createdAt: true,
          status: true,
          stripeSessionId: true,
          items: {
            where: {
              Product: {
                sellerId: sellerProfile.id
              }
            },
            select: {
              priceCents: true,
              quantity: true
            }
          }
        },
        take: 1000 // Limit to prevent loading too much data
      }),
      prisma.order.count({
        where: {
          stripeSessionId: { not: null },
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          },
          items: {
            some: {
              Product: {
                sellerId: sellerProfile.id
              }
            }
          }
        }
      })
    ]);

    // Calculate total earnings from order items (items already filtered by query)
    const totalEarnings = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.priceCents * item.quantity);
      }, 0);
    }, 0);

    // Calculate platform fees (12% default, or subscription fee if applicable)
    const platformFeeBps = 1200; // 12% default
    const platformFee = Math.round((totalEarnings * platformFeeBps) / 10000);
    
    // Net earnings (what seller should receive = gross - platform fees)
    const netEarnings = totalEarnings - platformFee;

    // Get transactions linked to these orders (for payout tracking)
    // Use a simpler query - just get transactions for this seller
    const transactions = await prisma.transaction.findMany({
      where: {
        sellerId: user.id,
        status: 'CAPTURED'
      },
      select: {
        id: true,
        amountCents: true,
        platformFeeBps: true
      },
      take: 1000 // Limit for performance
    });
    
    // Total payouts (what has actually been paid out)
    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amountCents, 0);
    
    // Pending payout (what hasn't been paid out yet)
    const pendingPayout = Math.max(0, netEarnings - totalPayouts);
    
    // Calculate period-based earnings using database aggregations (much faster)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [todayEarningsResult, weekEarningsResult, monthEarningsResult, completedOrdersCount] = await Promise.all([
      // Today's earnings
      prisma.orderItem.aggregate({
        where: {
          Product: {
            sellerId: sellerProfile.id
          },
          Order: {
            stripeSessionId: { not: null },
            NOT: { orderNumber: { startsWith: 'SUB-' } },
            createdAt: { gte: today }
          }
        },
        _sum: {
          priceCents: true
        }
      }).then(result => {
        // We need to calculate with quantity, so fetch items for today
        return prisma.orderItem.findMany({
          where: {
            Product: { sellerId: sellerProfile.id },
            Order: {
              stripeSessionId: { not: null },
              NOT: { orderNumber: { startsWith: 'SUB-' } },
              createdAt: { gte: today }
            }
          },
          select: { priceCents: true, quantity: true }
        }).then(items => items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0));
      }),
      // Week earnings
      prisma.orderItem.findMany({
        where: {
          Product: { sellerId: sellerProfile.id },
          Order: {
            stripeSessionId: { not: null },
            NOT: { orderNumber: { startsWith: 'SUB-' } },
            createdAt: { gte: weekAgo }
          }
        },
        select: { priceCents: true, quantity: true }
      }).then(items => items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0)),
      // Month earnings
      prisma.orderItem.findMany({
        where: {
          Product: { sellerId: sellerProfile.id },
          Order: {
            stripeSessionId: { not: null },
            NOT: { orderNumber: { startsWith: 'SUB-' } },
            createdAt: { gte: monthStart }
          }
        },
        select: { priceCents: true, quantity: true }
      }).then(items => items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0)),
      // Completed orders count
      prisma.order.count({
        where: {
          stripeSessionId: { not: null },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
          status: { in: ['CONFIRMED', 'DELIVERED'] },
          items: {
            some: {
              Product: {
                sellerId: sellerProfile.id
              }
            }
          }
        }
      })
    ]);

    const todayEarnings = todayEarningsResult;
    const weekEarnings = weekEarningsResult;
    const monthEarnings = monthEarningsResult;
    const totalOrders = ordersCount;
    const completedOrders = completedOrdersCount;

    // Get recent orders for display (only non-subscription orders with Stripe payment)
    // This can be done in parallel with other queries
    const recentOrderItems = await prisma.orderItem.findMany({
      where: {
        Product: {
          sellerId: sellerProfile.id
        },
        Order: {
          stripeSessionId: { not: null },
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          }
        }
      },
      include: {
        Order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true
          }
        },
        Product: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to 20 for performance
    });

    // Get last payout date
    const lastPayout = payouts.length > 0 ? payouts[0] : null;
    const lastPayoutDate = lastPayout ? lastPayout.createdAt.toISOString() : null;
    const lastPayoutAmount = lastPayout ? lastPayout.amountCents : 0;

    // Transform payouts for frontend
    const transformedPayouts = payouts.map(payout => ({
      id: payout.id,
      amount: payout.amountCents,
      createdAt: payout.createdAt,
      status: 'COMPLETED', // Assuming all created payouts are completed
      transactionId: payout.transactionId,
      buyer: payout.Transaction.User?.name || payout.Transaction.User?.email || 'Unknown'
    }));

    return NextResponse.json({
      totalEarnings,
      pendingPayout: Math.max(0, pendingPayout), // Ensure non-negative
      lastPayout: lastPayoutAmount,
      lastPayoutDate,
      platformFee,
      netEarnings,
      stripeConnected: !!(user.stripeConnectAccountId && user.stripeConnectOnboardingCompleted),
      stripeAccountId: user.stripeConnectAccountId,
      stats: {
        totalEarnings,
        todayEarnings,
        weekEarnings,
        monthEarnings,
        totalOrders,
        completedOrders,
        averageOrderValue: totalOrders > 0 ? Math.round(totalEarnings / totalOrders) : 0
      },
      payouts: transformedPayouts,
      recentOrders: recentOrderItems.map(item => ({
        id: item.id,
        orderNumber: item.Order.orderNumber,
        productTitle: item.Product.title,
        quantity: item.quantity,
        amount: item.priceCents * item.quantity,
        status: item.Order.status,
        createdAt: item.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching seller earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

