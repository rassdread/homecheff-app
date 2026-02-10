import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface MonthlyStats {
  month: string;
  orders: number;
  revenue: number;
  subscriptionRevenue?: number;
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

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get financial overview data
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
    ] = await Promise.all([
      // Total orders (only Stripe-paid orders, excluding subscription orders)
      prisma.order.count({
        where: {
          stripeSessionId: { not: null }, // Only paid orders (Stripe source)
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          }
        }
      }),
      
      // Total revenue (sum of all Stripe-paid order amounts, excluding subscriptions)
      prisma.order.aggregate({
        where: {
          stripeSessionId: { not: null }, // Only paid orders (Stripe source)
          NOT: {
            orderNumber: {
              startsWith: 'SUB-'
            }
          }
        },
        _sum: {
          totalAmount: true
        }
      }),
      
      // Subscription revenue breakdown by type
      getSubscriptionRevenueByType(),
      
      // Total payouts
      prisma.payout.aggregate({
        _sum: {
          amountCents: true
        }
      }),
      
      // Platform fees (calculated directly from orders since transactions may not exist)
      // Calculate platform fees based on order items and seller subscription tiers
      calculatePlatformFeesFromOrders(),
      
      // Recent orders (only Stripe-paid orders, including subscription orders)
      prisma.order.findMany({
        where: {
          stripeSessionId: { not: null } // Only paid orders (Stripe source)
        },
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
      
      // Top sellers by earnings - calculate from actual orders, not just payouts
      getTopSellers(),
      
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
    const subscriptionRevenueCents = subscriptionRevenue.total;
    const totalPayoutsCents = totalPayouts._sum.amountCents || 0;
    const platformFeesTotal = typeof platformFees === 'object' ? platformFees.total : platformFees;
    const platformFeesProduct = typeof platformFees === 'object' ? platformFees.productFees : 0;
    const platformFeesDelivery = typeof platformFees === 'object' ? platformFees.deliveryFees : 0;
    const totalPlatformRevenue = platformFeesTotal + subscriptionRevenueCents; // Subscription revenue is 100% platform revenue
    const stripeFeesPaid = Math.max(totalRevenueCents - totalPayoutsCents - platformFeesTotal, 0);
    const netPlatformRevenue = totalPlatformRevenue;

    return NextResponse.json({
      overview: {
        totalOrders,
        totalRevenue: totalRevenueCents,
        subscriptionRevenue: subscriptionRevenueCents,
        subscriptionRevenueByType: subscriptionRevenue,
        totalPayouts: totalPayoutsCents,
        platformFees: platformFeesTotal,
        platformFeesProduct,
        platformFeesDelivery,
        stripeFeesPaid,
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

// Platform fee percentages based on subscription tiers
const PLATFORM_FEES = {
  BASIC: 7,    // 7%
  PRO: 4,      // 4%  
  PREMIUM: 2,  // 2%
  DEFAULT: 10  // 10% for users without subscription
};

async function getTopSellers() {
  const sellers = await prisma.sellerProfile.findMany({
    where: {
      User: {
        role: 'SELLER'
      },
      products: {
        some: {
          orderItems: {
            some: {
              Order: {
                stripeSessionId: { not: null },
                NOT: {
                  orderNumber: {
                    startsWith: 'SUB-'
                  }
                }
              }
            }
          }
        }
      }
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          username: true
        }
      },
      products: {
        include: {
          orderItems: {
            where: {
              Order: {
                stripeSessionId: { not: null },
                NOT: {
                  orderNumber: {
                    startsWith: 'SUB-'
                  }
                }
              }
            },
            select: {
              priceCents: true,
              quantity: true
            }
          }
        }
      }
    }
  });

  // Calculate earnings for each seller based on their order items
  const sellersWithEarnings = sellers.map(seller => {
    const totalEarnings = seller.products.reduce((sum, product) => {
      return sum + product.orderItems.reduce((itemSum, item) => {
        return itemSum + (item.priceCents * item.quantity);
      }, 0);
    }, 0);
    
    return {
      id: seller.User.id,
      name: seller.User.name || seller.User.username || 'Unknown',
      totalEarnings,
      totalPayouts: 0 // We'll calculate this separately if needed
    };
  });
  
  // Sort by earnings and take top 5
  return sellersWithEarnings
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 5);
}

async function calculatePlatformFeesFromOrders() {
  const orders = await prisma.order.findMany({
    where: {
      stripeSessionId: { not: null },
      NOT: {
        orderNumber: { startsWith: 'SUB-' }
      }
    },
    include: {
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: { id: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  let productFees = 0;
  let deliveryFees = 0; // For future delivery fee implementation

  for (const order of orders) {
    for (const item of order.items) {
      if (!item.Product.seller?.User) continue;

      // For now, use DEFAULT tier (10%)
      // In the future, check seller's subscription tier
      const platformFeePercentage = PLATFORM_FEES.DEFAULT;
      const itemTotal = item.priceCents * item.quantity;
      const platformFee = Math.round((itemTotal * platformFeePercentage) / 100);
      
      productFees += platformFee;
    }
  }

  return {
    total: productFees + deliveryFees,
    productFees,
    deliveryFees
  };
}

async function calculateMonthlyPlatformFees(monthStart: Date, monthEnd: Date) {
  const orders = await prisma.order.findMany({
    where: {
      stripeSessionId: { not: null },
      createdAt: {
        gte: monthStart,
        lte: monthEnd
      },
      NOT: {
        orderNumber: { startsWith: 'SUB-' }
      }
    },
    include: {
      items: {
        include: {
          Product: {
            include: {
              seller: {
                include: {
                  User: {
                    select: { id: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  let totalFees = 0;
  for (const order of orders) {
    for (const item of order.items) {
      if (!item.Product.seller?.User) continue;
      const platformFeePercentage = PLATFORM_FEES.DEFAULT;
      const itemTotal = item.priceCents * item.quantity;
      const platformFee = Math.round((itemTotal * platformFeePercentage) / 100);
      totalFees += platformFee;
    }
  }

  return totalFees;
}

async function getSubscriptionRevenueByType() {
  // Get all subscription orders (both SUB- and HC-SUB- formats)
  const subscriptionOrders = await prisma.order.findMany({
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
  // Get subscription orders for this month
  const subscriptionOrders = await prisma.order.findMany({
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
    
    const [ordersCount, revenueResult, subscriptionRevenueResult, payoutsResult, platformFees] = await Promise.all([
      prisma.order.count({
        where: {
          stripeSessionId: { not: null }, // Only paid orders (Stripe source)
          createdAt: {
            gte: monthStart,
            lte: monthEnd
          }
        }
      }),
      prisma.order.aggregate({
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
        _sum: {
          totalAmount: true
        }
      }),
      
      // Monthly subscription revenue by type
      getMonthlySubscriptionRevenueByType(monthStart, monthEnd),
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
      }),
      // Calculate platform fees for this month
      calculateMonthlyPlatformFees(monthStart, monthEnd)
    ]);

    // Platform fees are already calculated
    const platformFee = platformFees;

    months.push({
      month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
      orders: ordersCount,
      revenue: revenueResult._sum.totalAmount || 0,
      subscriptionRevenue: subscriptionRevenueResult.total || 0,
      payouts: payoutsResult._sum.amountCents || 0,
      platformFee
    });
  }
  
  return months;
}




