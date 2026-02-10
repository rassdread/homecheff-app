import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { matchesCurrentMode } from '@/lib/stripe';

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
      // Get seller profile to find sellerId and subscription
      prisma.sellerProfile.findUnique({
        where: { userId: user.id },
        include: {
          Subscription: true
        }
      })
    ]);

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 });
    }

    // Get orders with limited data for calculations (much faster)
    // We only need items data, not full order objects
    // IMPORTANT: Only include orders that match current Stripe mode (test/live)
    const allOrders = await prisma.order.findMany({
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
    });

    // Filter orders to only include those matching current Stripe mode (test/live)
    const orders = allOrders.filter(order => 
      order.stripeSessionId && matchesCurrentMode(order.stripeSessionId)
    );
    
    const ordersCount = orders.length;

    // Calculate total earnings from order items (items already filtered by query)
    const totalEarnings = orders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.priceCents * item.quantity);
      }, 0);
    }, 0);

    // Calculate platform fees (12% default for individuals, or subscription fee if applicable)
    let platformFeePercentage = 12; // Default for individuals
    
    if (sellerProfile?.Subscription) {
      // Use subscription fee (stored in basis points)
      platformFeePercentage = sellerProfile.Subscription.feeBps / 100;
    }
    
    const platformFee = Math.round((totalEarnings * platformFeePercentage) / 100);
    
    // Net earnings (what seller should receive = gross - platform fees)
    const netEarnings = totalEarnings - platformFee;

    // Calculate pending payout correctly:
    // Only count CAPTURED transactions that don't have a payout yet OR have payout with providerRef: null
    // Exclude transactions with active escrow (shipping orders - handled separately)
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        sellerId: user.id,
        status: 'CAPTURED',
        providerRef: { not: null },
        OR: [
          { Payout: { none: {} } },
          { Payout: { some: { providerRef: null } } }
        ]
      },
      select: {
        id: true,
        amountCents: true,
        platformFeeBps: true,
        providerRef: true
      },
      take: 1000
    });

    // Filter to only include transactions matching current Stripe mode
    const validPendingTransactions = pendingTransactions.filter(tx => 
      tx.providerRef && matchesCurrentMode(tx.providerRef)
    );

    // Get providerRefs to check for active escrows
    const providerRefs = validPendingTransactions
      .map(tx => tx.providerRef)
      .filter((ref): ref is string => ref !== null);

    // Check for active escrows (shipping orders)
    const ordersWithEscrows = providerRefs.length > 0 ? await prisma.order.findMany({
      where: {
        stripeSessionId: { in: providerRefs }
      },
      select: {
        stripeSessionId: true,
        paymentEscrow: {
          where: { currentStatus: 'held' },
          select: { currentStatus: true }
        }
      }
    }) : [];

    const escrowMap = new Map<string, boolean>();
    ordersWithEscrows.forEach(order => {
      if (order.stripeSessionId) {
        escrowMap.set(order.stripeSessionId, order.paymentEscrow.length > 0);
      }
    });

    // Calculate pending payout: sum of transactions without active escrow
    const pendingPayout = validPendingTransactions
      .filter(tx => {
        if (!tx.providerRef) return false;
        const hasActiveEscrow = escrowMap.get(tx.providerRef) || false;
        return !hasActiveEscrow; // Exclude transactions with active escrow
      })
      .reduce((sum, tx) => {
        // Calculate net amount (with platform fee)
        const platformFeeBps = tx.platformFeeBps || (platformFeePercentage * 100);
        const platformFee = Math.round((tx.amountCents * platformFeeBps) / 10000);
        return sum + (tx.amountCents - platformFee);
      }, 0);
    
    // Total payouts (what has actually been paid out - only payouts with providerRef)
    const totalPayouts = payouts
      .filter(p => p.providerRef && matchesCurrentMode(p.providerRef))
      .reduce((sum, payout) => sum + payout.amountCents, 0);
    
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
      platformFeePercentage, // Add platform fee percentage
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

