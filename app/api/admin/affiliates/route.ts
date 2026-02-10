import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CommissionLedgerStatus, AffiliatePayoutStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all affiliates with their stats
    const affiliates = await prisma.affiliate.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            createdAt: true,
          },
        },
        parentAffiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        childAffiliates: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        referralLinks: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get the latest referral link
        },
        _count: {
          select: {
            referralLinks: true,
            promoCodes: true,
            attributions: true,
            commissionLedgers: true,
            payouts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get commission statistics
    const commissionStats = await prisma.commissionLedger.groupBy({
      by: ['status'],
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    });

    // Get payout statistics
    const payoutStats = await prisma.affiliatePayout.groupBy({
      by: ['status'],
      _sum: {
        amountCents: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate totals
    const totalCommissions = commissionStats.reduce(
      (sum, stat) => sum + (stat._sum.amountCents || 0),
      0
    );
    const totalPayouts = payoutStats.reduce(
      (sum, stat) => sum + (stat._sum.amountCents || 0),
      0
    );

    // Get recent payouts
    const recentPayouts = await prisma.affiliatePayout.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Get recent commissions
    const recentCommissions = await prisma.commissionLedger.findMany({
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        affiliate: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Get detailed income per affiliate
    const affiliateIncomes = await Promise.all(
      affiliates.map(async (aff) => {
        // Get all commissions for this affiliate
        const allCommissions = await prisma.commissionLedger.findMany({
          where: {
            affiliateId: aff.id,
            amountCents: { gt: 0 }, // Only positive amounts
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Calculate income breakdown by type and tier
        const subscriptionCommissions = allCommissions.filter(
          (c) => c.eventType === 'INVOICE_PAID'
        );
        const transactionCommissions = allCommissions.filter(
          (c) => c.eventType === 'ORDER_PAID'
        );
        const refunds = allCommissions.filter(
          (c) => c.eventType === 'REFUND' || c.eventType === 'CHARGEBACK'
        );

        // Breakdown by tier (from meta.tier)
        const directSubscriptions = subscriptionCommissions.filter(
          (c) => (c.meta as any)?.tier === 'DIRECT' || !(c.meta as any)?.tier
        );
        const subSubscriptions = subscriptionCommissions.filter(
          (c) => (c.meta as any)?.tier === 'SUB'
        );
        const parentSubscriptions = subscriptionCommissions.filter(
          (c) => (c.meta as any)?.tier === 'PARENT'
        );

        const directTransactions = transactionCommissions.filter(
          (c) => (c.meta as any)?.tier === 'DIRECT' || !(c.meta as any)?.tier
        );
        const subTransactions = transactionCommissions.filter(
          (c) => (c.meta as any)?.tier === 'SUB'
        );
        const parentTransactions = transactionCommissions.filter(
          (c) => (c.meta as any)?.tier === 'PARENT'
        );

        const totalIncome = allCommissions.reduce((sum, c) => sum + c.amountCents, 0);
        const subscriptionIncome = subscriptionCommissions.reduce(
          (sum, c) => sum + c.amountCents,
          0
        );
        const transactionIncome = transactionCommissions.reduce(
          (sum, c) => sum + c.amountCents,
          0
        );
        const refundAmount = refunds.reduce((sum, c) => sum + Math.abs(c.amountCents), 0);

        // Detailed breakdown
        const directSubscriptionIncome = directSubscriptions.reduce(
          (sum, c) => sum + c.amountCents,
          0
        );
        const subSubscriptionIncome = subSubscriptions.reduce(
          (sum, c) => sum + c.amountCents,
          0
        );
        const parentSubscriptionIncome = parentSubscriptions.reduce(
          (sum, c) => sum + c.amountCents,
          0
        );

        const directTransactionIncome = directTransactions.reduce(
          (sum, c) => sum + c.amountCents,
          0
        );
        const subTransactionIncome = subTransactions.reduce(
          (sum, c) => sum + c.amountCents,
          0
        );
        const parentTransactionIncome = parentTransactions.reduce(
          (sum, c) => sum + c.amountCents,
          0
        );

        // Calculate monthly income (last 12 months)
        const monthlyIncome: Record<string, number> = {};
        const now = new Date();
        for (let i = 0; i < 12; i++) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
          monthlyIncome[monthKey] = 0;
        }

        allCommissions.forEach((c) => {
          const month = new Date(c.createdAt);
          const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
          if (monthlyIncome[monthKey] !== undefined) {
            monthlyIncome[monthKey] += c.amountCents;
          }
        });

        // Get paid out amount
        const paidOut = await prisma.affiliatePayout.aggregate({
          where: {
            affiliateId: aff.id,
            status: 'SENT',
          },
          _sum: {
            amountCents: true,
          },
        });

        // Get pending/available amounts
        const pending = allCommissions
          .filter((c) => c.status === 'PENDING')
          .reduce((sum, c) => sum + c.amountCents, 0);
        const available = allCommissions
          .filter((c) => c.status === 'AVAILABLE')
          .reduce((sum, c) => sum + c.amountCents, 0);

        return {
          affiliateId: aff.id,
          totalIncome,
          subscriptionIncome,
          transactionIncome,
          refundAmount,
          paidOut: paidOut._sum.amountCents || 0,
          pending,
          available,
          monthlyIncome,
          commissionCount: allCommissions.length,
          subscriptionCount: subscriptionCommissions.length,
          transactionCount: transactionCommissions.length,
          // Detailed breakdown
          directSubscriptionIncome,
          subSubscriptionIncome,
          parentSubscriptionIncome,
          directTransactionIncome,
          subTransactionIncome,
          parentTransactionIncome,
          // Counts
          directSubscriptionCount: directSubscriptions.length,
          subSubscriptionCount: subSubscriptions.length,
          parentSubscriptionCount: parentSubscriptions.length,
          directTransactionCount: directTransactions.length,
          subTransactionCount: subTransactions.length,
          parentTransactionCount: parentTransactions.length,
        };
      })
    );

    // Sort by total income for top performers
    const topPerformers = affiliateIncomes
      .map((income, index) => ({
        ...income,
        affiliate: affiliates[index],
      }))
      .sort((a, b) => b.totalIncome - a.totalIncome)
      .slice(0, 10);

    return NextResponse.json({
      affiliates: affiliates.map((aff) => ({
        id: aff.id,
        userId: aff.userId,
        status: aff.status,
        parentAffiliateId: aff.parentAffiliateId,
        parentAffiliate: aff.parentAffiliate
          ? {
              id: aff.parentAffiliate.id,
              name: aff.parentAffiliate.user.name,
              email: aff.parentAffiliate.user.email,
            }
          : null,
        childAffiliates: aff.childAffiliates.map((child) => ({
          id: child.id,
          name: child.user.name,
          email: child.user.email,
        })),
        user: {
          id: aff.user.id,
          name: aff.user.name,
          email: aff.user.email,
          username: aff.user.username,
          createdAt: aff.user.createdAt,
        },
        stats: {
          referralLinks: aff._count.referralLinks,
          promoCodes: aff._count.promoCodes,
          attributions: aff._count.attributions,
          commissions: aff._count.commissionLedgers,
          payouts: aff._count.payouts,
        },
        referralLink: aff.referralLinks[0] ? {
          id: aff.referralLinks[0].id,
          code: aff.referralLinks[0].code,
          createdAt: aff.referralLinks[0].createdAt,
        } : null,
        stripeConnectAccountId: aff.stripeConnectAccountId,
        stripeConnectOnboardingCompleted: aff.stripeConnectOnboardingCompleted,
        createdAt: aff.createdAt,
      })),
      statistics: {
        totalAffiliates: affiliates.length,
        activeAffiliates: affiliates.filter((a) => a.status === 'ACTIVE').length,
        suspendedAffiliates: affiliates.filter((a) => a.status === 'SUSPENDED').length,
        totalCommissions,
        totalPayouts,
        pendingCommissions: commissionStats.find((s) => s.status === 'PENDING')?._sum.amountCents || 0,
        availableCommissions: commissionStats.find((s) => s.status === 'AVAILABLE')?._sum.amountCents || 0,
        paidCommissions: commissionStats.find((s) => s.status === 'PAID')?._sum.amountCents || 0,
        commissionCounts: {
          pending: commissionStats.find((s) => s.status === 'PENDING')?._count.id || 0,
          available: commissionStats.find((s) => s.status === 'AVAILABLE')?._count.id || 0,
          paid: commissionStats.find((s) => s.status === 'PAID')?._count.id || 0,
        },
        payoutCounts: {
          created: payoutStats.find((s) => s.status === 'CREATED')?._count.id || 0,
          sent: payoutStats.find((s) => s.status === 'SENT')?._count.id || 0,
          failed: payoutStats.find((s) => s.status === 'FAILED')?._count.id || 0,
        },
      },
      recentPayouts: recentPayouts.map((p) => ({
        id: p.id,
        affiliateId: p.affiliateId,
        affiliateName: p.affiliate.user.name,
        affiliateEmail: p.affiliate.user.email,
        amountCents: p.amountCents,
        status: p.status,
        stripeTransferId: p.stripeTransferId,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        createdAt: p.createdAt,
      })),
      recentCommissions: recentCommissions.map((c) => ({
        id: c.id,
        affiliateId: c.affiliateId,
        affiliateName: c.affiliate.user.name,
        affiliateEmail: c.affiliate.user.email,
        amountCents: c.amountCents,
        status: c.status,
        eventType: c.eventType,
        eventId: c.eventId,
        createdAt: c.createdAt,
      })),
      affiliateIncomes: affiliateIncomes.map((income, index) => ({
        ...income,
        affiliate: {
          id: affiliates[index].id,
          name: affiliates[index].user.name,
          email: affiliates[index].user.email,
          username: affiliates[index].user.username,
        },
        childAffiliates: affiliates[index].childAffiliates.map((child) => ({
          id: child.id,
          name: child.user.name,
          email: child.user.email,
        })),
        parentAffiliate: affiliates[index].parentAffiliate
          ? {
              id: affiliates[index].parentAffiliate.id,
              name: affiliates[index].parentAffiliate.user.name,
              email: affiliates[index].parentAffiliate.user.email,
            }
          : null,
      })),
      topPerformers: topPerformers.map((performer) => ({
        affiliateId: performer.affiliate.id,
        affiliateName: performer.affiliate.user.name,
        affiliateEmail: performer.affiliate.user.email,
        totalIncome: performer.totalIncome,
        subscriptionIncome: performer.subscriptionIncome,
        transactionIncome: performer.transactionIncome,
        paidOut: performer.paidOut,
        pending: performer.pending,
        available: performer.available,
        commissionCount: performer.commissionCount,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching affiliate data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch affiliate data' },
      { status: 500 }
    );
  }
}

