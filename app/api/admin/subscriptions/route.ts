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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const subscriptionId = searchParams.get('subscriptionId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status'); // active, expired, cancelled

    const where: any = {};

    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Get all seller profiles with subscriptions
    const sellerProfiles = await prisma.sellerProfile.findMany({
      where: {
        ...where,
        subscriptionId: { not: null }
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true
          }
        },
        Subscription: true
      },
      orderBy: {
        subscriptionValidUntil: 'desc'
      }
    });

    // Filter by status
    const now = new Date();
    let filtered = sellerProfiles;

    if (status === 'active') {
      filtered = sellerProfiles.filter(sp => 
        sp.subscriptionValidUntil && sp.subscriptionValidUntil > now
      );
    } else if (status === 'expired') {
      filtered = sellerProfiles.filter(sp => 
        sp.subscriptionValidUntil && sp.subscriptionValidUntil <= now
      );
    }

    // Get subscription revenue
    const subscriptionOrders = await prisma.order.findMany({
      where: {
        orderNumber: {
          startsWith: 'SUB-'
        },
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1) // This month
        }
      },
      select: {
        totalAmount: true,
        createdAt: true
      }
    });

    const monthlyRevenue = subscriptionOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Group by subscription type
    const revenueByPlan = await prisma.order.groupBy({
      by: ['notes'],
      where: {
        orderNumber: {
          startsWith: 'SUB-'
        },
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    return NextResponse.json({
      subscriptions: filtered.map(sp => ({
        id: sp.id,
        userId: sp.userId,
        user: sp.User,
        subscription: sp.Subscription,
        validUntil: sp.subscriptionValidUntil,
        isActive: sp.subscriptionValidUntil ? sp.subscriptionValidUntil > now : false,
        stripeSubscriptionId: sp.stripeSubscriptionId
      })),
      stats: {
        total: filtered.length,
        active: filtered.filter(sp => sp.subscriptionValidUntil && sp.subscriptionValidUntil > now).length,
        expired: filtered.filter(sp => sp.subscriptionValidUntil && sp.subscriptionValidUntil <= now).length,
        monthlyRevenue,
        revenueByPlan: revenueByPlan.map(r => ({
          plan: r.notes || 'Unknown',
          revenue: r._sum.totalAmount || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}




