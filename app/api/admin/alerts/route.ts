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

    const alerts: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      count?: number;
      data?: any;
    }> = [];

    // Check for failed payouts
    const failedPayouts = await prisma.payout.findMany({
      where: {
        providerRef: {
          startsWith: 'failed_'
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    if (failedPayouts.length > 0) {
      alerts.push({
        type: 'failed_payouts',
        severity: 'high',
        message: `${failedPayouts.length} uitbetaling(en) zijn mislukt`,
        count: failedPayouts.length,
        data: failedPayouts
      });
    }

    // Check for high refund rate
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recentOrders, recentRefunds] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: { gte: last30Days },
          NOT: { orderNumber: { startsWith: 'SUB-' } }
        }
      }),
      prisma.refund.count({
        where: {
          createdAt: { gte: last30Days }
        }
      })
    ]);

    const refundRate = recentOrders > 0 ? (recentRefunds / recentOrders) * 100 : 0;
    if (refundRate > 10) {
      alerts.push({
        type: 'high_refund_rate',
        severity: 'medium',
        message: `Hoge refund rate: ${refundRate.toFixed(1)}% (${recentRefunds} refunds van ${recentOrders} orders)`,
        count: recentRefunds
      });
    }

    // Check for orders stuck in processing
    const stuckOrders = await prisma.order.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Older than 7 days
        }
      }
    });

    if (stuckOrders.length > 0) {
      alerts.push({
        type: 'stuck_orders',
        severity: 'medium',
        message: `${stuckOrders.length} bestelling(en) vast in PROCESSING status`,
        count: stuckOrders.length,
        data: stuckOrders
      });
    }

    // Check for pending transactions (CREATED or AUTHORIZED status)
    const pendingTransactions = await prisma.transaction.count({
      where: {
        status: {
          in: ['CREATED', 'AUTHORIZED']
        },
        createdAt: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
        }
      }
    });

    if (pendingTransactions > 0) {
      alerts.push({
        type: 'pending_transactions',
        severity: 'low',
        message: `${pendingTransactions} transactie(s) al meer dan 24 uur in PENDING status`,
        count: pendingTransactions
      });
    }

    // Check for sellers without Stripe Connect
    const sellersWithoutStripe = await prisma.sellerProfile.count({
      where: {
        User: {
          OR: [
            { stripeConnectAccountId: null },
            { stripeConnectOnboardingCompleted: false }
          ]
        },
        products: {
          some: {
            stock: { gt: 0 }
          }
        }
      }
    });

    if (sellersWithoutStripe > 0) {
      alerts.push({
        type: 'sellers_without_stripe',
        severity: 'low',
        message: `${sellersWithoutStripe} verkoper(s) zonder Stripe Connect koppeling`,
        count: sellersWithoutStripe
      });
    }

    return NextResponse.json({
      alerts,
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      high: alerts.filter(a => a.severity === 'high').length,
      medium: alerts.filter(a => a.severity === 'medium').length,
      low: alerts.filter(a => a.severity === 'low').length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

