import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe, matchesCurrentMode, STRIPE_SESSION_ID_PREFIX } from '@/lib/stripe';
import { getSellerRequestablePayout } from '@/lib/sellerPayouts';
import { getCombinedRequestablePayout } from '@/lib/combinedPayouts';

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
        stripeSessionId: { not: null, startsWith: STRIPE_SESSION_ID_PREFIX },
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

    // Gecombineerd aanvraagbaar (verkoop + bezorging) als gebruiker ook bezorger is
    const hasDeliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    let requestableCents: number;
    let canRequestPayout: boolean;
    let payoutBlockedReason: string | undefined;
    let sellerRequestableCents: number;
    let deliveryRequestableCents: number;

    if (hasDeliveryProfile) {
      const combined = await getCombinedRequestablePayout(
        prisma,
        user.id,
        platformFeePercentage,
        matchesCurrentMode
      );
      requestableCents = combined.totalRequestableCents;
      canRequestPayout = combined.canRequestPayout;
      payoutBlockedReason = combined.payoutBlockedReason;
      sellerRequestableCents = combined.sellerCents;
      deliveryRequestableCents = combined.deliveryCents;
    } else {
      const sellerResult = await getSellerRequestablePayout(
        prisma,
        user.id,
        platformFeePercentage,
        matchesCurrentMode
      );
      requestableCents = sellerResult.requestableCents;
      canRequestPayout = sellerResult.canRequestPayout;
      payoutBlockedReason = sellerResult.payoutBlockedReason;
      sellerRequestableCents = sellerResult.requestableCents;
      deliveryRequestableCents = 0;
    }

    const pendingPayout = requestableCents;

    // Total payouts (wat officieel is uitbetaald: alleen payouts met providerRef)
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
      prisma.orderItem.findMany({
        where: {
          Product: { sellerId: sellerProfile.id },
          Order: {
            stripeSessionId: { not: null, startsWith: STRIPE_SESSION_ID_PREFIX },
            NOT: { orderNumber: { startsWith: 'SUB-' } },
            createdAt: { gte: today }
          }
        },
        select: { priceCents: true, quantity: true }
      }).then(items => items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0)),
      // Week earnings
      prisma.orderItem.findMany({
        where: {
          Product: { sellerId: sellerProfile.id },
          Order: {
            stripeSessionId: { not: null, startsWith: STRIPE_SESSION_ID_PREFIX },
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
            stripeSessionId: { not: null, startsWith: STRIPE_SESSION_ID_PREFIX },
            NOT: { orderNumber: { startsWith: 'SUB-' } },
            createdAt: { gte: monthStart }
          }
        },
        select: { priceCents: true, quantity: true }
      }).then(items => items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0)),
      // Completed orders count
      prisma.order.count({
        where: {
          stripeSessionId: { not: null, startsWith: STRIPE_SESSION_ID_PREFIX },
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
    const recentOrderItems = await prisma.orderItem.findMany({
      where: {
        Product: { sellerId: sellerProfile.id },
        Order: {
          stripeSessionId: { not: null, startsWith: STRIPE_SESSION_ID_PREFIX },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
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

    const stripeConnected = !!(user.stripeConnectAccountId && user.stripeConnectOnboardingCompleted);

    // Hoeveel staat er écht nog in escrow (alleen 'held') – voor correcte UI-melding
    const escrowSum = await prisma.paymentEscrow.aggregate({
      where: { sellerId: user.id, currentStatus: 'held' },
      _sum: { amountCents: true },
    });
    const amountInEscrowCents = escrowSum._sum.amountCents ?? 0;

    // Optioneel: bezorgverdiensten als deze gebruiker ook bezorger is (voor op dezelfde pagina)
    let delivery: { totalEarningsCents: number; paidCents: number } | undefined;
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (deliveryProfile) {
      const deliveredByMe = await prisma.deliveryOrder.findMany({
        where: { deliveryProfileId: deliveryProfile.id, status: 'DELIVERED' },
        select: { orderId: true, deliveryFee: true },
      });
      const deliveredOrderIds = new Set(deliveredByMe.map((d) => d.orderId));
      const deliveryPayouts = await prisma.payout.findMany({
        where: { toUserId: user.id },
        select: { amountCents: true, providerRef: true, transactionId: true },
      });
      const deliveryPayoutsFiltered = deliveryPayouts.filter(
        (p) =>
          p.transactionId.includes('delivery') ||
          p.transactionId.includes('txn_delivery') ||
          deliveredOrderIds.has(p.transactionId)
      );
      const totalDeliveryCents = deliveryPayoutsFiltered.reduce((s, p) => s + p.amountCents, 0);
      const deliveryPaidCents = deliveryPayoutsFiltered
        .filter((p) => p.providerRef != null)
        .reduce((s, p) => s + p.amountCents, 0);
      delivery = { totalEarningsCents: totalDeliveryCents, paidCents: deliveryPaidCents };
    }

    // Totaal net (verkoop + bezorging) voor één overzicht
    const combinedNetCents = netEarnings + (delivery?.totalEarningsCents ?? 0);

    // Saldo op Stripe Connect-account (zodat gebruiker ziet wat er op Stripe staat, zonder in te loggen)
    let stripeBalanceAvailableCents: number | undefined;
    let stripeBalancePendingCents: number | undefined;
    if (stripeConnected && user.stripeConnectAccountId && stripe) {
      try {
        const balance = await stripe.balance.retrieve(
          {},
          { stripeAccount: user.stripeConnectAccountId }
        );
        const eurAvailable = balance.available?.find((b: { currency: string }) => b.currency === 'eur');
        const eurPending = balance.pending?.find((b: { currency: string }) => b.currency === 'eur');
        stripeBalanceAvailableCents = eurAvailable?.amount ?? 0;
        stripeBalancePendingCents = eurPending?.amount ?? 0;
      } catch (e) {
        console.warn('Could not fetch Connect balance for user', user.id, e);
      }
    }

    return NextResponse.json({
      totalEarnings,
      pendingPayout: Math.max(0, pendingPayout),
      requestableAmountCents: Math.max(0, requestableCents),
      sellerRequestableCents: Math.max(0, sellerRequestableCents),
      deliveryRequestableCents: Math.max(0, deliveryRequestableCents),
      canRequestPayout: canRequestPayout && stripeConnected,
      payoutBlockedReason: payoutBlockedReason ?? undefined,
      amountInEscrowCents,
      delivery,
      combinedNetCents,
      lastPayout: lastPayoutAmount,
      lastPayoutDate,
      platformFee,
      platformFeePercentage,
      netEarnings,
      stripeConnected,
      stripeAccountId: user.stripeConnectAccountId,
      stripeBalanceAvailableCents: stripeBalanceAvailableCents ?? undefined,
      stripeBalancePendingCents: stripeBalancePendingCents ?? undefined,
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

