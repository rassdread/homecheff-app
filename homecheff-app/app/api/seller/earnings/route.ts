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

    // Get all payouts for this seller
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

    // Calculate stats
    const totalEarnings = payouts.reduce((sum, payout) => sum + payout.amountCents, 0);
    
    // Today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = payouts
      .filter(p => new Date(p.createdAt) >= today)
      .reduce((sum, payout) => sum + payout.amountCents, 0);

    // This week's earnings
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekEarnings = payouts
      .filter(p => new Date(p.createdAt) >= weekAgo)
      .reduce((sum, payout) => sum + payout.amountCents, 0);

    // This month's earnings
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEarnings = payouts
      .filter(p => new Date(p.createdAt) >= monthStart)
      .reduce((sum, payout) => sum + payout.amountCents, 0);

    // Get order count
    const orders = await prisma.orderItem.findMany({
      where: {
        Product: {
          seller: {
            userId: user.id
          }
        }
      },
      include: {
        Order: true,
        Product: {
          select: {
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter(item => item.Order.status === 'CONFIRMED').length;

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
      recentOrders: orders.map(item => ({
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

