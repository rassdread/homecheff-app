/**
 * Affiliate Dashboard API
 * 
 * GET /api/affiliate/dashboard
 * Returns overview stats for affiliate dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommissionLedgerStatus } from "@prisma/client";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        affiliate: {
          include: {
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
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            commissionLedgers: true,
            payouts: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            promoCodes: {
              where: {
                status: 'ACTIVE',
              },
            },
            attributions: {
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
              },
            },
          },
        },
      },
    });

    if (!user?.affiliate) {
      return NextResponse.json({ error: "Affiliate account not found" }, { status: 404 });
    }

    const affiliate = user.affiliate;

    // Calculate earnings
    const allCommissions = affiliate.commissionLedgers;
    const pendingCents = allCommissions
      .filter((c) => c.status === CommissionLedgerStatus.PENDING)
      .reduce((sum, c) => sum + c.amountCents, 0);
    
    const availableCents = allCommissions
      .filter((c) => c.status === CommissionLedgerStatus.AVAILABLE)
      .reduce((sum, c) => sum + c.amountCents, 0);
    
    const paidCents = allCommissions
      .filter((c) => c.status === CommissionLedgerStatus.PAID)
      .reduce((sum, c) => sum + c.amountCents, 0);

    // Calculate user commissions vs business commissions
    const userCommissions = allCommissions.filter((c) => {
      return c.eventType === 'ORDER_PAID'; // Commissies van transacties (gebruikers)
    });
    const businessCommissions = allCommissions.filter((c) => {
      return c.eventType === 'INVOICE_PAID'; // Commissies van abonnementen (bedrijven)
    });

    const userCommissionsCents = userCommissions
      .filter((c) => c.status === CommissionLedgerStatus.PAID)
      .reduce((sum, c) => sum + c.amountCents, 0);
    
    const businessCommissionsCents = businessCommissions
      .filter((c) => c.status === CommissionLedgerStatus.PAID)
      .reduce((sum, c) => sum + c.amountCents, 0);

    // Count referrals
    const totalReferrals = affiliate.attributions.length;
    const businessReferrals = affiliate.attributions.filter(
      (a) => a.type === 'BUSINESS_SIGNUP'
    ).length;

    // Map referrals with user information (ordered by most recent first)
    const referrals = affiliate.attributions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((attribution) => ({
        id: attribution.id,
        userId: attribution.userId,
        name: attribution.user.name,
        email: attribution.user.email,
        username: attribution.user.username || null,
        type: attribution.type,
        source: attribution.source,
        createdAt: attribution.createdAt,
        startsAt: attribution.startsAt,
        endsAt: attribution.endsAt,
      }));

    // Count active promo codes
    const activePromoCodes = affiliate.promoCodes.length;

    // Recent payouts
    const recentPayouts = affiliate.payouts.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      status: p.status,
      createdAt: p.createdAt,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
    }));

    // Downline count and sub-affiliates
    const downlineCount = affiliate.childAffiliates.length;
    const subAffiliates = affiliate.childAffiliates.map((child) => ({
      id: child.id,
      userId: child.userId,
      name: child.user.name,
      email: child.user.email,
      status: child.status,
      createdAt: child.createdAt,
      customUserCommissionPct: child.customUserCommissionPct,
      customBusinessCommissionPct: child.customBusinessCommissionPct,
      customParentUserCommissionPct: child.customParentUserCommissionPct,
      customParentBusinessCommissionPct: child.customParentBusinessCommissionPct,
    }));

    // Calculate parent commissions (if this is a sub-affiliate)
    const parentCommissions = affiliate.parentAffiliateId
      ? allCommissions.filter((c) => {
          const meta = c.meta as any;
          return meta?.tier === 'PARENT';
        })
      : [];
    
    const parentCommissionsCents = parentCommissions
      .filter((c) => c.status === CommissionLedgerStatus.PAID)
      .reduce((sum, c) => sum + c.amountCents, 0);

    // Get referral link code if it exists
    const referralLink = affiliate.referralLinks[0];
    
    // Generate the full referral link with correct base URL
    // Detect language from referrer header or cookie
    // API routes don't have /en/ in pathname, so check referrer or cookie
    const referer = req.headers.get('referer') || '';
    const isEnglish = referer.includes('/en/') || req.cookies.get('homecheff-language')?.value === 'en';
    const langPrefix = isEnglish ? '/en' : '';
    
    const referralLinkUrl = referralLink 
      ? `${req.nextUrl.origin}${langPrefix}/welkom/${referralLink.code}`
      : null;

    return NextResponse.json({
      affiliate: {
        id: affiliate.id,
        status: affiliate.status,
        stripeConnectAccountId: affiliate.stripeConnectAccountId,
        stripeConnectOnboardingCompleted: affiliate.stripeConnectOnboardingCompleted,
        createdAt: affiliate.createdAt,
        isSubAffiliate: !!affiliate.parentAffiliateId,
      },
      referralCode: referralLink?.code || null, // Include referral code in dashboard data
      referralLink: referralLinkUrl, // Include full referral link with correct base URL
      earnings: {
        pendingCents,
        availableCents,
        paidCents,
        totalCents: pendingCents + availableCents + paidCents,
        userCommissionsCents,
        businessCommissionsCents,
        parentCommissionsCents, // Commissions from sub-affiliates (if this is a parent)
      },
      stats: {
        totalReferrals,
        businessReferrals,
        activePromoCodes,
        downlineCount,
      },
      referrals, // List of referrals with user information
      upline: affiliate.parentAffiliate
        ? {
            id: affiliate.parentAffiliate.id,
            name: affiliate.parentAffiliate.user.name,
            email: affiliate.parentAffiliate.user.email,
          }
        : null,
      subAffiliates, // List of sub-affiliates (if this is a parent)
      recentPayouts,
    });
  } catch (error) {
    console.error("Error fetching affiliate dashboard:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

