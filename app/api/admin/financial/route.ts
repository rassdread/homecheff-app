import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { matchesCurrentMode } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

interface MonthlyStats {
  month: string;
  orders: number;
  revenue: number;
  subscriptionRevenue?: number;
  payouts: number;
  platformFee: number;
  homecheffFee?: number; // HomeCheff fee (same as platform fee)
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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get financial overview data with error handling for each query
    const [
      totalOrders,
      totalRevenue,
      subscriptionRevenue,
      totalPayouts,
      platformFees,
      recentOrders,
      topSellers,
      topDeliverers,
      monthlyStats
    ] = await Promise.allSettled([
      // Total orders (only Stripe Connect orders, excluding subscription orders)
      prisma.order.count({
        where: {
          stripeSessionId: { not: null }, // Only Stripe Connect orders
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          }
        }
      }),
      
      // Total revenue (sum of all Stripe Connect order amounts, excluding subscriptions)
      prisma.order.aggregate({
        where: {
          stripeSessionId: { not: null }, // Only Stripe Connect orders
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          }
        },
        _sum: { totalAmount: true }
      }),
      
      // Subscription revenue breakdown by type
      getSubscriptionRevenueByType(),
      
      // Total payouts (filtered by current mode via transactions)
      prisma.payout.findMany({
        include: {
          Transaction: {
            select: { providerRef: true }
          }
        }
      }).then(async payouts => {
        // Get orders by stripeSessionId from providerRef
        const stripeSessionIds = payouts
          .map(p => p.Transaction?.providerRef)
          .filter(Boolean) as string[];
        
        if (stripeSessionIds.length === 0) {
          return { _sum: { amountCents: 0 } };
        }
        
        const orders = await prisma.order.findMany({
          where: { stripeSessionId: { in: stripeSessionIds } },
          select: { stripeSessionId: true }
        });
        
        const validSessionIds = new Set(
          orders
            .filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId))
            .map(o => o.stripeSessionId!)
        );
        
        const filtered = payouts.filter(payout => {
          const providerRef = payout.Transaction?.providerRef;
          return providerRef && validSessionIds.has(providerRef);
        });
        
        return { _sum: { amountCents: filtered.reduce((sum, p) => sum + p.amountCents, 0) } };
      }),
      
      // Platform fees (calculated directly from orders since transactions may not exist)
      // Calculate platform fees based on order items and seller subscription tiers
      calculatePlatformFeesFromOrders(),
      
      // Recent orders (only Stripe-paid orders matching current mode, including subscription orders)
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null } // Only paid orders (Stripe source)
        },
        orderBy: { createdAt: 'desc' },
        take: 50, // Get more to filter
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
      }).then(orders => orders.slice(0, 10)),
      
      // Top sellers by earnings (filtered by current mode)
      prisma.user.findMany({
        where: {
          role: 'SELLER',
          Payout: {
            some: {
              Transaction: {
                providerRef: { not: null }
              }
            }
          }
        },
        include: {
          Payout: {
            include: {
              Transaction: {
                select: { providerRef: true }
              }
            }
          },
          SellerProfile: true
        },
        take: 20 // Get more to filter
      }).then(async users => {
        // Get all providerRefs from transactions
        const allProviderRefs = users
          .flatMap(user => user.Payout.map(p => p.Transaction?.providerRef))
          .filter(Boolean) as string[];
        
        // Get orders by stripeSessionId
        const orders = allProviderRefs.length > 0 ? await prisma.order.findMany({
          where: { stripeSessionId: { in: allProviderRefs } },
          select: { stripeSessionId: true }
        }) : [];
        
        const validSessionIds = new Set(
          orders
            .filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId))
            .map(o => o.stripeSessionId!)
        );
        
        return users.map(user => {
          // Filter payouts by current mode
          const filteredPayouts = user.Payout.filter(payout => {
            const providerRef = payout.Transaction?.providerRef;
            return providerRef && validSessionIds.has(providerRef);
          });
          
          return {
            id: user.id,
            name: user.name || user.username || 'Unknown',
            totalEarnings: filteredPayouts.reduce((sum, payout) => sum + payout.amountCents, 0),
            totalPayouts: filteredPayouts.length,
            sellerProfile: user.SellerProfile
          };
        }).filter(seller => seller.totalEarnings > 0)
          .sort((a, b) => b.totalEarnings - a.totalEarnings)
          .slice(0, 5);
      }),
      
      // Top deliverers by earnings (filtered by current mode - earnings come from orders)
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
            include: {
              order: {
                select: { stripeSessionId: true, totalAmount: true }
              }
            }
          }
        },
        take: 20 // Get more to filter
      }).then(profiles => {
        return profiles.map(profile => {
          // Calculate earnings only from orders matching current mode
          const filteredOrders = profile.deliveryOrders.filter(deliveryOrder => {
            const order = deliveryOrder.order;
            return order?.stripeSessionId && matchesCurrentMode(order.stripeSessionId);
          });
          
          const totalEarnings = filteredOrders.reduce((sum, deliveryOrder) => sum + (deliveryOrder.deliveryFee || 0), 0);
          
          return {
            ...profile,
            totalEarnings,
            totalDeliveries: filteredOrders.length,
            averageRating: profile.averageRating,
            maxDistance: profile.maxDistance
          };
        }).filter(p => p.totalEarnings > 0)
          .sort((a, b) => b.totalEarnings - a.totalEarnings)
          .slice(0, 5);
      }),
      
      // Monthly stats (last 6 months)
      getMonthlyStats()
    ]);

    // Extract values from Promise.allSettled results with defaults
    const totalOrdersValue = totalOrders.status === 'fulfilled' ? totalOrders.value : 0;
    const totalRevenueValue = totalRevenue.status === 'fulfilled' ? (totalRevenue.value._sum?.totalAmount || 0) : 0;
    const subscriptionRevenueValue = subscriptionRevenue.status === 'fulfilled' 
      ? subscriptionRevenue.value 
      : { basic: 0, pro: 0, premium: 0, total: 0 };
    const totalPayoutsValue = totalPayouts.status === 'fulfilled' 
      ? (totalPayouts.value._sum?.amountCents || 0) 
      : 0;
    const platformFeesValue = platformFees.status === 'fulfilled' ? platformFees.value : { total: 0, productFees: 0, deliveryFees: 0 };
    const recentOrdersValue = recentOrders.status === 'fulfilled' ? recentOrders.value : [];
    const topSellersValue = topSellers.status === 'fulfilled' ? topSellers.value : [];
    const topDeliverersValue = topDeliverers.status === 'fulfilled' ? topDeliverers.value : [];
    const monthlyStatsValue = monthlyStats.status === 'fulfilled' ? monthlyStats.value : [];

    // Calculate financial summary
    const totalRevenueCents = totalRevenueValue;
    const subscriptionRevenueCents = subscriptionRevenueValue.total || 0;
    const totalPayoutsCents = totalPayoutsValue;
    const platformFeesTotal = typeof platformFeesValue === 'object' ? (platformFeesValue.total || 0) : (platformFeesValue || 0);
    const platformFeesProduct = typeof platformFeesValue === 'object' ? (platformFeesValue.productFees || 0) : 0;
    const platformFeesDelivery = typeof platformFeesValue === 'object' ? (platformFeesValue.deliveryFees || 0) : 0;
    const totalPlatformRevenue = platformFeesTotal + subscriptionRevenueCents; // Subscription revenue is 100% platform revenue
    const stripeFeesPaid = Math.max(totalRevenueCents - totalPayoutsCents - platformFeesTotal, 0);
    const netPlatformRevenue = totalPlatformRevenue;

    // Calculate HomeCheff fee (same as platform fees - the fee collected from sellers)
    const homecheffFeeTotal = platformFeesTotal;
    const homecheffFeeProduct = platformFeesProduct;
    const homecheffFeeDelivery = platformFeesDelivery;

    // Debug logging
    console.log('[Financial API] Platform Fees:', {
      total: platformFeesTotal,
      product: platformFeesProduct,
      delivery: platformFeesDelivery,
    });
    console.log('[Financial API] HomeCheff Fee:', {
      total: homecheffFeeTotal,
      product: homecheffFeeProduct,
      delivery: homecheffFeeDelivery,
    });

    return NextResponse.json({
      overview: {
        totalOrders: totalOrdersValue,
        totalRevenue: totalRevenueCents,
        subscriptionRevenue: subscriptionRevenueCents,
        subscriptionRevenueByType: subscriptionRevenueValue,
        totalPayouts: totalPayoutsCents,
        platformFees: platformFeesTotal,
        platformFeesProduct,
        platformFeesDelivery,
        homecheffFee: homecheffFeeTotal, // HomeCheff fee (same as platform fees)
        homecheffFeeProduct,
        homecheffFeeDelivery,
        stripeFeesPaid,
        netPlatformRevenue,
        averageOrderValue: totalOrdersValue > 0 ? Math.round(totalRevenueCents / totalOrdersValue) : 0
      },
      recentOrders: recentOrdersValue.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        buyer: order.User.name || order.User.username || 'Unknown',
        totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
        uniqueProducts: order.items.length,
        items: order.items.map(item => ({
          title: item.Product.title,
          seller: item.Product.seller?.User?.name || item.Product.seller?.User?.username || 'Unknown',
          quantity: item.quantity,
          price: item.priceCents,
          subtotal: item.priceCents * item.quantity
        }))
      })),
      topSellers: topSellersValue,
      topDeliverers: topDeliverersValue.map(deliverer => ({
        id: deliverer.user.id,
        name: deliverer.user.name || deliverer.user.username || 'Unknown',
        totalEarnings: deliverer.totalEarnings,
        totalDeliveries: deliverer.totalDeliveries,
        averageRating: deliverer.averageRating || 0,
        maxDistance: deliverer.maxDistance
      })),
      monthlyStats: monthlyStatsValue
    });
  } catch (error) {
    console.error('Error fetching admin financial data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial data' },
      { status: 500 }
    );
  }
}

// Platform fee percentages based on subscription tiers
const PLATFORM_FEES = {
  BASIC: 7,    // 7%
  PRO: 4,      // 4%  
  PREMIUM: 2,  // 2%
  DEFAULT: 12  // 12% for users without subscription (individuals)
};

async function calculatePlatformFeesFromOrders() {
  // Calculate product fees from transactions (more reliable - fees are already stored in transactions)
  // Filter by current mode via order's stripeSessionId from providerRef
  const allProductTransactions = await prisma.transaction.findMany({
    where: {
      id: { startsWith: 'txn_' },
      NOT: {
        id: { startsWith: 'txn_delivery_' } // Exclude delivery transactions
      },
      platformFeeBps: { gt: 0 }, // Only transactions with platform fees (greater than 0)
      status: 'CAPTURED'
    },
    select: { 
      providerRef: true, 
      amountCents: true, 
      platformFeeBps: true 
    }
  });

  // Get orders by stripeSessionId from providerRef to filter by current mode
  const stripeSessionIds = allProductTransactions
    .map(tx => tx.providerRef)
    .filter(Boolean) as string[];
  
  const orders = stripeSessionIds.length > 0 ? await prisma.order.findMany({
    where: { 
      stripeSessionId: { in: stripeSessionIds },
      NOT: {
        orderNumber: { startsWith: 'SUB-' } // Exclude subscription orders
      }
    },
    select: { stripeSessionId: true }
  }) : [];

  const validSessionIds = new Set(
    orders
      .filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId))
      .map(o => o.stripeSessionId!)
  );

  // Filter transactions to only include those matching current Stripe mode and non-subscription orders
  const productTransactions = allProductTransactions.filter(tx => {
    const providerRef = tx.providerRef;
    return providerRef && validSessionIds.has(providerRef);
  });

  let productFees = 0;
  for (const transaction of productTransactions) {
    if (transaction.platformFeeBps) {
      // Calculate platform fee from stored platformFeeBps (basis points)
      const platformFee = Math.round((transaction.amountCents * transaction.platformFeeBps) / 10000);
      productFees += platformFee;
    }
  }

  // Calculate delivery fees from transactions (delivery transactions have platformFeeBps: 1200 = 12%)
  const allDeliveryTransactions = await prisma.transaction.findMany({
    where: {
      id: { startsWith: 'txn_delivery_' },
      platformFeeBps: 1200, // 12% for delivery
      status: 'CAPTURED'
    },
    select: { providerRef: true, amountCents: true, platformFeeBps: true }
  });

  // Get orders by stripeSessionId from providerRef
  const deliveryStripeSessionIds = allDeliveryTransactions
    .map(tx => tx.providerRef)
    .filter(Boolean) as string[];
  
  const deliveryOrders = deliveryStripeSessionIds.length > 0 ? await prisma.order.findMany({
    where: { stripeSessionId: { in: deliveryStripeSessionIds } },
    select: { stripeSessionId: true }
  }) : [];

  const deliveryValidSessionIds = new Set(
    deliveryOrders
      .filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId))
      .map(o => o.stripeSessionId!)
  );

  // Filter transactions to only include those matching current Stripe mode
  const deliveryTransactions = allDeliveryTransactions.filter(tx => {
    const providerRef = tx.providerRef;
    return providerRef && deliveryValidSessionIds.has(providerRef);
  });

  let deliveryFees = 0;
  for (const transaction of deliveryTransactions) {
    if (transaction.platformFeeBps) {
      // Calculate platform fee from stored platformFeeBps (basis points)
      const deliveryPlatformFee = Math.round((transaction.amountCents * transaction.platformFeeBps) / 10000);
      deliveryFees += deliveryPlatformFee;
    }
  }

  return {
    total: productFees + deliveryFees,
    productFees,
    deliveryFees
  };
}

async function calculateMonthlyPlatformFees(monthStart: Date, monthEnd: Date) {
  // Calculate product fees from transactions (more reliable - fees are already stored in transactions)
  const allProductTransactions = await prisma.transaction.findMany({
    where: {
      id: { startsWith: 'txn_' },
      NOT: {
        id: { startsWith: 'txn_delivery_' } // Exclude delivery transactions
      },
      platformFeeBps: { gt: 0 }, // Only transactions with platform fees (greater than 0)
      status: 'CAPTURED',
      createdAt: {
        gte: monthStart,
        lte: monthEnd
      }
    },
    select: { 
      providerRef: true, 
      amountCents: true, 
      platformFeeBps: true 
    }
  });

  // Get orders by stripeSessionId from providerRef to filter by current mode
  const stripeSessionIds = allProductTransactions
    .map(tx => tx.providerRef)
    .filter(Boolean) as string[];
  
  const orders = stripeSessionIds.length > 0 ? await prisma.order.findMany({
    where: { 
      stripeSessionId: { in: stripeSessionIds },
      NOT: {
        orderNumber: { startsWith: 'SUB-' } // Exclude subscription orders
      }
    },
    select: { stripeSessionId: true }
  }) : [];

  const validSessionIds = new Set(
    orders
      .filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId))
      .map(o => o.stripeSessionId!)
  );

  // Filter transactions to only include those matching current Stripe mode and non-subscription orders
  const productTransactions = allProductTransactions.filter(tx => {
    const providerRef = tx.providerRef;
    return providerRef && validSessionIds.has(providerRef);
  });

  let totalFees = 0;
  for (const transaction of productTransactions) {
    if (transaction.platformFeeBps) {
      // Calculate platform fee from stored platformFeeBps (basis points)
      const platformFee = Math.round((transaction.amountCents * transaction.platformFeeBps) / 10000);
      totalFees += platformFee;
    }
  }

  // Add delivery fees for this month (filtered by current mode)
  const allDeliveryTransactions = await prisma.transaction.findMany({
    where: {
      id: { startsWith: 'txn_delivery_' },
      platformFeeBps: 1200, // 12% for delivery
      status: 'CAPTURED',
      createdAt: {
        gte: monthStart,
        lte: monthEnd
      }
    },
    select: { providerRef: true, amountCents: true, platformFeeBps: true }
  });

  // Get orders by stripeSessionId from providerRef
  const monthlyStripeSessionIds = allDeliveryTransactions
    .map(tx => tx.providerRef)
    .filter(Boolean) as string[];
  
  const monthlyDeliveryOrders = monthlyStripeSessionIds.length > 0 ? await prisma.order.findMany({
    where: { stripeSessionId: { in: monthlyStripeSessionIds } },
    select: { stripeSessionId: true }
  }) : [];

  const monthlyValidSessionIds = new Set(
    monthlyDeliveryOrders
      .filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId))
      .map(o => o.stripeSessionId!)
  );

  // Filter transactions to only include those matching current Stripe mode
  const deliveryTransactions = allDeliveryTransactions.filter(tx => {
    const providerRef = tx.providerRef;
    return providerRef && monthlyValidSessionIds.has(providerRef);
  });

  for (const transaction of deliveryTransactions) {
    if (transaction.platformFeeBps) {
      // Calculate platform fee from stored platformFeeBps (basis points)
      const deliveryPlatformFee = Math.round((transaction.amountCents * transaction.platformFeeBps) / 10000);
      totalFees += deliveryPlatformFee;
    }
  }

  return totalFees;
}

async function getSubscriptionRevenueByType() {
  // Get all subscription orders (both SUB- and HC-SUB- formats) matching current mode
  const allSubscriptionOrders = await prisma.order.findMany({
    where: {
      stripeSessionId: { not: null },
      OR: [
        {
          orderNumber: {
            startsWith: 'SUB-'
          }
        },
        {
          orderNumber: {
            startsWith: 'HC-SUB-'
          }
        }
      ]
    },
    select: {
      totalAmount: true,
      stripeSessionId: true,
      notes: true,
      User: {
        select: {
          id: true,
          SellerProfile: {
            select: {
              subscriptionId: true,
              Subscription: {
                select: {
                  name: true,
                  priceCents: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Filter subscription orders to only include those matching current Stripe mode
  const subscriptionOrders = allSubscriptionOrders.filter(order => 
    order.stripeSessionId && matchesCurrentMode(order.stripeSessionId)
  );

  // Initialize revenue breakdown
  const revenueByType = {
    basic: 0,
    pro: 0, 
    premium: 0,
    total: 0
  };

  // Categorize subscription revenue
  subscriptionOrders.forEach(order => {
    const amount = order.totalAmount;
    revenueByType.total += amount;

    // Try to determine subscription type from user's current subscription
    const subscriptionName = order.User?.SellerProfile?.Subscription?.name?.toLowerCase();
    
    if (subscriptionName) {
      if (subscriptionName.includes('basic')) {
        revenueByType.basic += amount;
      } else if (subscriptionName.includes('pro')) {
        revenueByType.pro += amount;
      } else if (subscriptionName.includes('premium')) {
        revenueByType.premium += amount;
      }
    } else {
      // Fallback: try to determine from order amount (common subscription prices)
      if (amount === 3900) { // €39.00 = Basic
        revenueByType.basic += amount;
      } else if (amount === 9900) { // €99.00 = Pro
        revenueByType.pro += amount;
      } else if (amount === 19900) { // €199.00 = Premium
        revenueByType.premium += amount;
      }
      // If amount doesn't match known prices, it goes to total but not categorized
    }
  });

  return revenueByType;
}

async function getMonthlySubscriptionRevenueByType(monthStart: Date, monthEnd: Date) {
  // Get subscription orders for this month matching current mode
  const allSubscriptionOrders = await prisma.order.findMany({
    where: {
      stripeSessionId: { not: null },
      createdAt: {
        gte: monthStart,
        lte: monthEnd
      },
      OR: [
        {
          orderNumber: {
            startsWith: 'SUB-'
          }
        },
        {
          orderNumber: {
            startsWith: 'HC-SUB-'
          }
        }
      ]
    },
    select: {
      totalAmount: true,
      stripeSessionId: true,
      User: {
        select: {
          SellerProfile: {
            select: {
              Subscription: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Filter subscription orders to only include those matching current Stripe mode
  const subscriptionOrders = allSubscriptionOrders.filter(order => 
    order.stripeSessionId && matchesCurrentMode(order.stripeSessionId)
  );

  // Calculate monthly breakdown
  const monthlyRevenue = {
    basic: 0,
    pro: 0,
    premium: 0,
    total: 0
  };

  subscriptionOrders.forEach(order => {
    const amount = order.totalAmount;
    monthlyRevenue.total += amount;

    const subscriptionName = order.User?.SellerProfile?.Subscription?.name?.toLowerCase();
    
    if (subscriptionName) {
      if (subscriptionName.includes('basic')) {
        monthlyRevenue.basic += amount;
      } else if (subscriptionName.includes('pro')) {
        monthlyRevenue.pro += amount;
      } else if (subscriptionName.includes('premium')) {
        monthlyRevenue.premium += amount;
      }
    } else {
      // Fallback based on amount
      if (amount === 3900) monthlyRevenue.basic += amount;
      else if (amount === 9900) monthlyRevenue.pro += amount;
      else if (amount === 19900) monthlyRevenue.premium += amount;
    }
  });

  return monthlyRevenue;
}

async function getMonthlyStats(): Promise<MonthlyStats[]> {
  const months: MonthlyStats[] = [];
  const now = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    
    const [allOrders, allRevenueOrders, subscriptionRevenueResult, payoutsResult, platformFees] = await Promise.all([
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null }, // Only paid orders (Stripe source)
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        select: { stripeSessionId: true }
      }),
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null }, // Only paid orders (Stripe source)
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          },
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          }
        },
        select: { totalAmount: true, stripeSessionId: true }
      }),
      
      // Monthly subscription revenue by type
      getMonthlySubscriptionRevenueByType(monthStart, monthEnd),
      prisma.payout.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        include: {
          Transaction: {
            select: { providerRef: true }
          }
        }
      }).then(async payouts => {
        // Get all providerRefs from transactions
        const providerRefs = payouts
          .map(p => p.Transaction?.providerRef)
          .filter(Boolean) as string[];
        
        // Get orders by stripeSessionId
        const orders = providerRefs.length > 0 ? await prisma.order.findMany({
          where: { stripeSessionId: { in: providerRefs } },
          select: { stripeSessionId: true }
        }) : [];
        
        const validSessionIds = new Set(
          orders
            .filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId))
            .map(o => o.stripeSessionId!)
        );
        
        const filtered = payouts.filter(payout => {
          const providerRef = payout.Transaction?.providerRef;
          return providerRef && validSessionIds.has(providerRef);
        });
        return { _sum: { amountCents: filtered.reduce((sum, p) => sum + p.amountCents, 0) } };
      }),
      // Calculate platform fees for this month
      calculateMonthlyPlatformFees(monthStart, monthEnd)
    ]);

    // Filter orders to only include those matching current Stripe mode
    const ordersCount = allOrders.filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId)).length;
    const filteredRevenueOrders = allRevenueOrders.filter(o => o.stripeSessionId && matchesCurrentMode(o.stripeSessionId));
    const revenue = filteredRevenueOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Platform fees are already calculated
    const platformFee = platformFees;

    months.push({
      month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
      orders: ordersCount,
      revenue: revenue,
      subscriptionRevenue: subscriptionRevenueResult.total || 0,
      payouts: payoutsResult._sum.amountCents || 0,
      platformFee,
      homecheffFee: platformFee // HomeCheff fee is the same as platform fee
    });
  }
  
  return months;
}




