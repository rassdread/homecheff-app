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

    // Get all payouts for this deliverer
    const payouts = await prisma.payout.findMany({
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
      }
    });

    // Filter payouts to only include delivery-related ones (based on transaction ID pattern)
    const deliveryPayouts = payouts.filter(payout => 
      payout.transactionId.includes('delivery') || payout.transactionId.includes('txn_delivery')
    );

    // Calculate stats
    const totalEarnings = deliveryPayouts.reduce((sum, payout) => sum + payout.amountCents, 0);
    
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

    const totalDeliveries = deliveryOrders.length;
    const completedDeliveries = deliveryOrders.filter(order => order.status === 'DELIVERED').length;
    const pendingDeliveries = deliveryOrders.filter(order => 
      ['PENDING', 'ACCEPTED', 'PICKED_UP'].includes(order.status)
    ).length;

    // Transform payouts for frontend
    const transformedPayouts = deliveryPayouts.map(payout => ({
      id: payout.id,
      amount: payout.amountCents,
      createdAt: payout.createdAt,
      status: 'COMPLETED', // Assuming all created payouts are completed
      transactionId: payout.transactionId,
      orderId: payout.transactionId.replace('txn_delivery_', '').split('_')[0] || 'Unknown'
    }));

    return NextResponse.json({
      stats: {
        totalEarnings,
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
