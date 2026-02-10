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
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sellerId = searchParams.get('sellerId');
    const buyerId = searchParams.get('buyerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeSubscriptions = searchParams.get('includeSubscriptions') === 'true';

    const where: any = {
      stripeSessionId: { not: null } // Only show Stripe-paid orders (Stripe source)
    };

    console.log('🔍 Admin Orders API: Fetching orders with filters:', {
      status,
      search,
      dateFrom,
      dateTo,
      sellerId,
      buyerId,
      includeSubscriptions,
      stripeSessionIdFilter: 'not null'
    });

    // Filter subscriptions if needed
    if (!includeSubscriptions) {
      where.NOT = {
        orderNumber: {
          startsWith: 'SUB-'
        }
      };
    }

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { User: { name: { contains: search, mode: 'insensitive' } } },
        { User: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (buyerId) {
      where.userId = buyerId;
    }

    if (sellerId) {
      where.items = {
        some: {
          Product: {
            seller: {
              userId: sellerId
            }
          }
        }
      };
    }

    // First, check total orders (including unpaid) for debugging
    const totalAllOrders = await prisma.order.count();
    const totalPaidOrders = await prisma.order.count({
      where: { stripeSessionId: { not: null } }
    });
    const totalUnpaidOrders = await prisma.order.count({
      where: { stripeSessionId: null }
    });

    console.log(`📊 Admin Orders API: Total orders in DB: ${totalAllOrders} (Paid: ${totalPaidOrders}, Unpaid: ${totalUnpaidOrders})`);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true
            }
          },
          items: {
            include: {
              Product: {
                include: {
                  seller: {
                    include: {
                      User: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                          username: true
                        }
                      }
                    }
                  },
                  Image: {
                    select: { fileUrl: true },
                    take: 1
                  }
                }
              }
            }
          },
          deliveryOrder: {
            include: {
              deliveryProfile: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          conversations: {
            select: {
              id: true,
              lastMessageAt: true
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.order.count({ where })
    ]);

    // Get transaction info for each order
    const ordersWithTransactions = await Promise.all(
      orders.map(async (order) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            providerRef: order.stripeSessionId || undefined
          },
          include: {
            Payout: true,
            Refund: true
          }
        });

        return {
          ...order,
          transactions,
          totalPayouts: transactions.reduce((sum, tx) => 
            sum + tx.Payout.reduce((pSum, p) => pSum + p.amountCents, 0), 0
          ),
          totalRefunds: transactions.reduce((sum, tx) => 
            sum + tx.Refund.reduce((rSum, r) => rSum + r.amountCents, 0), 0
          )
        };
      })
    );

    console.log(`✅ Admin Orders API: Returning ${ordersWithTransactions.length} orders (total matching: ${total})`);

    return NextResponse.json({
      orders: ordersWithTransactions,
      total,
      limit,
      offset,
      debug: {
        totalAllOrders,
        totalPaidOrders,
        totalUnpaidOrders
      }
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

