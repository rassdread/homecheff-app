import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DELIVERY_DELIVERER_PERCENT } from '@/lib/fees';

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
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has delivery profile
    const deliveryProfile = await prisma.deliveryProfile.findUnique({
      where: { userId: user.id }
    });

    if (!deliveryProfile) {
      return NextResponse.json({ error: 'No delivery profile found' }, { status: 404 });
    }

    // OrderIds waar deze bezorger een afgeronde bezorging heeft (bezorgkosten uit triggerDeliveryPayout)
    const deliveredByMe = await prisma.deliveryOrder.findMany({
      where: {
        deliveryProfileId: deliveryProfile.id,
        status: 'DELIVERED'
      },
      select: { orderId: true }
    });
    const deliveredOrderIds = new Set(deliveredByMe.map(d => d.orderId));

    // Get all payouts for this deliverer
    const payouts = await prisma.payout.findMany({
      where: {
        toUserId: user.id
      },
      include: {
        Transaction: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Delivery payouts: (1) transactionId bevat 'delivery'/'txn_delivery' (webhook) OF (2) transactionId = orderId van een door mij geleverde order (triggerDeliveryPayout)
    const deliveryPayouts = payouts.filter(payout => 
      payout.transactionId.includes('delivery') ||
      payout.transactionId.includes('txn_delivery') ||
      deliveredOrderIds.has(payout.transactionId)
    );

    // Officieel uitbetaald = alleen payouts met providerRef (transfer uitgevoerd)
    const paidPayouts = deliveryPayouts.filter(p => p.providerRef != null);
    const paidEarnings = paidPayouts.reduce((sum, p) => sum + p.amountCents, 0);
    const earningsFromPayouts = deliveryPayouts.reduce((sum, p) => sum + p.amountCents, 0);
    // Bezorgkosten meenemen: verdiensten uit alle afgeronde bezorgingen (deliveryFee * 88%)
    const allCompletedDeliveries = await prisma.deliveryOrder.findMany({
      where: { deliveryProfileId: deliveryProfile.id, status: 'DELIVERED' },
      select: { deliveryFee: true }
    });
    const earnedFromCompletedDeliveries = allCompletedDeliveries
      .filter(o => o.deliveryFee != null)
      .reduce((sum, o) => sum + Math.round((o.deliveryFee ?? 0) * DELIVERY_DELIVERER_PERCENT / 100), 0);
    const totalEarnings = Math.max(earningsFromPayouts, earnedFromCompletedDeliveries);
    
    // Today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = deliveryPayouts
      .filter(p => new Date(p.createdAt) >= today)
      .reduce((sum, payout) => sum + payout.amountCents, 0);

    // This week's earnings
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekEarnings = deliveryPayouts
      .filter(p => new Date(p.createdAt) >= weekAgo)
      .reduce((sum, payout) => sum + payout.amountCents, 0);

    // This month's earnings
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEarnings = deliveryPayouts
      .filter(p => new Date(p.createdAt) >= monthStart)
      .reduce((sum, payout) => sum + payout.amountCents, 0);

    // Get delivery order count and stats
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: {
        deliveryProfileId: deliveryProfile.id
      },
      include: {
        order: {
          include: {
            items: {
              include: {
                Product: {
                  select: {
                    title: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const totalDeliveries = await prisma.deliveryOrder.count({ where: { deliveryProfileId: deliveryProfile.id } });
    const completedDeliveries = allCompletedDeliveries.length;
    const pendingDeliveries = await prisma.deliveryOrder.count({
      where: {
        deliveryProfileId: deliveryProfile.id,
        status: { in: ['PENDING', 'ACCEPTED', 'PICKED_UP'] }
      }
    });

    // Transform payouts for frontend (status = officieel uitbetaald als providerRef gezet)
    const transformedPayouts = deliveryPayouts.map(payout => ({
      id: payout.id,
      amount: payout.amountCents,
      createdAt: payout.createdAt,
      status: payout.providerRef ? 'COMPLETED' : 'PENDING',
      transactionId: payout.transactionId,
      orderId: payout.transactionId.includes('txn_delivery_') ? payout.transactionId.replace('txn_delivery_', '').split('_')[0] : payout.transactionId
    }));

    return NextResponse.json({
      stats: {
        totalEarnings,
        paidEarnings,
        todayEarnings,
        weekEarnings,
        monthEarnings,
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries,
        averageDeliveryValue: completedDeliveries > 0 ? Math.round(totalEarnings / completedDeliveries) : 0,
        deliveryRadius: deliveryProfile.maxDistance,
        isActive: deliveryProfile.isActive,
        averageRating: deliveryProfile.averageRating || 0
      },
      payouts: transformedPayouts,
      recentDeliveries: deliveryOrders.map(order => ({
        id: order.id,
        orderNumber: order.order?.orderNumber || 'N/A',
        productTitle: order.order?.items[0]?.Product?.title || 'Product',
        deliveryFee: order.deliveryFee,
        status: order.status,
        createdAt: order.createdAt,
        deliveredAt: order.deliveredAt,
        estimatedTime: order.estimatedTime || 30
      }))
    });
  } catch (error) {
    console.error('Error fetching delivery earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery earnings' },
      { status: 500 }
    );
  }
}
