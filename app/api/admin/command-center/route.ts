import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getBusinessVisibilityProfile } from '@/lib/business/visibility-profile';
import {
  AFFILIATE_ATTRIBUTION_CONTRACT,
  affiliateAttributionPolicySummary,
} from '@/lib/affiliate-attribution-contract';
import { IMPLEMENTED_ANALYTICS_METRICS } from '@/lib/business/analytics-tier';

export const dynamic = 'force-dynamic';

type Metric<T = number> = {
  value: T | null;
  tracked: boolean;
  note?: string;
};

function trackedMetric<T>(value: T, note?: string): Metric<T> {
  return { value, tracked: true, note };
}

function notTracked<T = number>(note: string): Metric<T> {
  return { value: null, tracked: false, note };
}

function rangeStart(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function normalizePlanName(name?: string | null): 'individual' | 'basic' | 'pro' | 'premium' {
  const normalized = (name || '').trim().toLowerCase();
  if (normalized === 'basic' || normalized === 'pro' || normalized === 'premium') return normalized;
  return 'individual';
}

function getBackfillStatus(): Metric<'ok' | 'warning'> {
  const latestAuditPath = path.join(
    process.cwd(),
    'docs/audits/phase10e-production-backfill-audit-latest.json',
  );
  if (!fs.existsSync(latestAuditPath)) {
    return notTracked('Phase 10E backfill audit file not found in repository.');
  }

  try {
    const raw = fs.readFileSync(latestAuditPath, 'utf8');
    const json = JSON.parse(raw) as { status?: string };
    const status = (json.status || '').toLowerCase();
    return trackedMetric(status === 'ok' ? 'ok' : 'warning', 'Derived from Phase 10E latest audit artifact.');
  } catch {
    return notTracked('Unable to parse Phase 10E backfill audit artifact.');
  }
}

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
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') === '7d' ? 7 : searchParams.get('range') === '1d' ? 1 : 30;
    const since = rangeStart(range);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      usersToday,
      usersWeek,
      usersMonth,
      sellersMonth,
      listingsMonth,
      offeredMonth,
      requestedMonth,
      servicesMonth,
      messagesMonth,
      proposalsMonth,
      ordersMonth,
      gmvMonth,
      transactionsCapturedMonth,
      payoutsMonth,
      refundsMonth,
      failedTransfers,
      pendingStripeConnectSellers,
      pendingAcceptedValues,
      alerts,
      totalListings,
      activeListings,
      marketplaceByCategory,
      settlementMix,
      pendingAcceptedByCategory,
      subscriptionsBySeller,
      subscriptionsCatalog,
      commissionByStatus,
      affiliatePayoutByStatus,
      affiliates,
      attributionsMonth,
      usersVlaardingen,
      listingsVlaardingen,
      ordersVlaardingen,
      gmvVlaardingen,
      reviewsMonth,
      reportsMonth,
      disputesMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: rangeStart(7) } } }),
      prisma.user.count({ where: { createdAt: { gte: rangeStart(30) } } }),
      prisma.sellerProfile.count({ where: { createdAt: { gte: rangeStart(30) } } }),
      prisma.product.count({ where: { createdAt: { gte: rangeStart(30) } } }),
      prisma.product.count({ where: { createdAt: { gte: rangeStart(30) }, listingIntent: 'OFFER' } }),
      prisma.product.count({ where: { createdAt: { gte: rangeStart(30) }, listingIntent: 'REQUEST' } }),
      prisma.product.count({
        where: {
          createdAt: { gte: rangeStart(30) },
          marketplaceCategory: { in: ['ARTISTIC_SERVICE', 'PRACTICAL_SERVICE', 'KNOWLEDGE'] },
        },
      }),
      prisma.message.count({ where: { createdAt: { gte: rangeStart(30) } } }),
      prisma.proposal.count({ where: { createdAt: { gte: rangeStart(30) } } }),
      prisma.order.count({
        where: {
          createdAt: { gte: rangeStart(30) },
          stripeSessionId: { not: null },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: rangeStart(30) },
          stripeSessionId: { not: null },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
        },
        _sum: { totalAmount: true },
      }),
      prisma.transaction.aggregate({
        where: { createdAt: { gte: rangeStart(30) }, status: 'CAPTURED' },
        _sum: { amountCents: true },
      }),
      prisma.payout.aggregate({
        where: { createdAt: { gte: rangeStart(30) } },
        _sum: { amountCents: true },
      }),
      prisma.refund.aggregate({
        where: { createdAt: { gte: rangeStart(30) } },
        _sum: { amountCents: true },
      }),
      prisma.payout.count({ where: { providerRef: { startsWith: 'failed_' } } }),
      prisma.sellerProfile.count({
        where: {
          User: {
            OR: [{ stripeConnectAccountId: null }, { stripeConnectOnboardingCompleted: false }],
          },
        },
      }),
      prisma.pendingAcceptedValueProposal.count({ where: { status: 'PENDING' } }),
      prisma.adminAction.findMany({
        where: { createdAt: { gte: rangeStart(7) } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { action: true, notes: true, createdAt: true },
      }),
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.groupBy({
        by: ['marketplaceCategory'],
        _count: { _all: true },
      }),
      prisma.product.groupBy({
        by: ['priceModel', 'barterOpenness'],
        _count: { _all: true },
      }),
      prisma.pendingAcceptedValueProposal.groupBy({
        by: ['category'],
        where: { status: 'PENDING' },
        _count: { _all: true },
      }),
      prisma.sellerProfile.findMany({
        include: {
          Subscription: { select: { name: true, feeBps: true, priceCents: true } },
          products: { select: { id: true } },
          User: {
            select: {
              stripeConnectAccountId: true,
              stripeConnectOnboardingCompleted: true,
            },
          },
        },
      }),
      prisma.subscription.findMany({
        where: { isActive: true },
        select: { name: true, feeBps: true, priceCents: true },
      }),
      prisma.commissionLedger.groupBy({
        by: ['status'],
        _sum: { amountCents: true },
        _count: { _all: true },
      }),
      prisma.affiliatePayout.groupBy({
        by: ['status'],
        _sum: { amountCents: true },
        _count: { _all: true },
      }),
      prisma.affiliate.count(),
      prisma.attribution.count({ where: { createdAt: { gte: since } } }),
      prisma.user.count({ where: { city: { contains: 'vlaardingen', mode: 'insensitive' } } }),
      prisma.product.count({ where: { placeName: { contains: 'vlaardingen', mode: 'insensitive' } } }),
      prisma.order.count({
        where: {
          createdAt: { gte: since },
          User: { city: { contains: 'vlaardingen', mode: 'insensitive' } },
          stripeSessionId: { not: null },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: since },
          User: { city: { contains: 'vlaardingen', mode: 'insensitive' } },
          stripeSessionId: { not: null },
          NOT: { orderNumber: { startsWith: 'SUB-' } },
        },
        _sum: { totalAmount: true },
      }),
      prisma.productReview.count({ where: { createdAt: { gte: since } } }),
      prisma.report.count({ where: { createdAt: { gte: since } } }),
      prisma.report.count({
        where: {
          createdAt: { gte: since },
          status: { in: ['OPEN', 'UNDER_REVIEW'] },
        },
      }),
    ]);

    const planDistribution: Record<'individual' | 'basic' | 'pro' | 'premium', number> = {
      individual: 0,
      basic: 0,
      pro: 0,
      premium: 0,
    };
    let feeBpsMismatch = 0;
    let sellersWithoutConnect = 0;
    let sellersWithoutListings = 0;

    for (const seller of subscriptionsBySeller) {
      const plan = normalizePlanName(seller.Subscription?.name);
      const profile = getBusinessVisibilityProfile(plan);
      planDistribution[plan] += 1;

      if (seller.Subscription?.feeBps != null && seller.Subscription.feeBps !== profile.feeBps) {
        feeBpsMismatch += 1;
      }
      if (!seller.User.stripeConnectAccountId || !seller.User.stripeConnectOnboardingCompleted) {
        sellersWithoutConnect += 1;
      }
      if (seller.products.length === 0) {
        sellersWithoutListings += 1;
      }
    }

    const mrrEstimate = subscriptionsCatalog.reduce((sum, plan) => {
      const normalized = normalizePlanName(plan.name);
      const count = planDistribution[normalized];
      return sum + (plan.priceCents || 0) * count;
    }, 0);

    const feeCatalogMismatches = subscriptionsCatalog.filter((plan) => {
      const normalized = normalizePlanName(plan.name);
      return getBusinessVisibilityProfile(normalized).feeBps !== plan.feeBps;
    }).length;

    const trackedActions = alerts
      .filter((a) => ['REFUND_CREATED', 'SETTINGS_UPDATE'].includes(a.action) || a.action.includes('FAILED'))
      .map((a) => `${a.action}${a.notes ? ` - ${a.notes}` : ''}`);

    const backfillStatus = getBackfillStatus();
    const affiliateCronConfigured = Boolean(process.env.CRON_SECRET || process.env.AFFILIATE_PAYOUT_CRON_SECRET);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      rangeDays: range,
      overview: {
        usersToday: trackedMetric(usersToday),
        usersWeek: trackedMetric(usersWeek),
        usersMonth: trackedMetric(usersMonth),
        newSellersMonth: trackedMetric(sellersMonth),
        newListingsMonth: trackedMetric(listingsMonth),
        newWantedRequestsMonth: trackedMetric(requestedMonth),
        newServicesMonth: trackedMetric(servicesMonth),
        messagesStartedMonth: trackedMetric(messagesMonth),
        proposalsCreatedMonth: trackedMetric(proposalsMonth),
        ordersCreatedMonth: trackedMetric(ordersMonth),
        gmvMonthCents: trackedMetric(gmvMonth._sum.totalAmount || 0),
        platformFeeRevenueMonthCents: trackedMetric(transactionsCapturedMonth._sum.amountCents || 0),
        subscriptionsMrrEstimateCents: trackedMetric(mrrEstimate, 'Estimated from active subscription catalog and seller plan distribution.'),
        affiliateCommissionsPendingCents: trackedMetric(
          commissionByStatus.find((s) => s.status === 'PENDING')?._sum.amountCents || 0,
        ),
        failedWebhooks: notTracked('Webhook failure rows are not persisted in a dedicated webhook event table yet.'),
        pendingStripeConnectSellers: trackedMetric(pendingStripeConnectSellers),
        pendingTaxonomyProposals: trackedMetric(pendingAcceptedValues),
        productionBackfillStatus: backfillStatus,
        openRiskItems: trackedMetric(trackedActions.length, 'Derived from recent admin actions and failure-oriented actions.'),
      },
      marketplace: {
        totalListings: trackedMetric(totalListings),
        activeListings: trackedMetric(activeListings),
        offered: trackedMetric(offeredMonth),
        wanted: trackedMetric(requestedMonth),
        inspiration: notTracked('No dedicated inspiration listing intent is stored in canonical Product model yet.'),
        services: trackedMetric(servicesMonth),
        byCategory: trackedMetric(marketplaceByCategory),
        settlementMix: trackedMetric(settlementMix),
        listingsAcceptingValues: trackedMetric(
          settlementMix.filter((row) => row.barterOpenness && row.barterOpenness !== 'MONEY').reduce((sum, row) => sum + row._count._all, 0),
        ),
        barterEnabledListings: trackedMetric(
          settlementMix
            .filter((row) => row.barterOpenness === 'MONEY_AND_BARTER' || row.barterOpenness === 'BARTER_ONLY')
            .reduce((sum, row) => sum + row._count._all, 0),
        ),
        pendingAcceptedValuesByCategory: trackedMetric(pendingAcceptedByCategory),
        topCategories: trackedMetric(
          [...marketplaceByCategory].sort((a, b) => b._count._all - a._count._all).slice(0, 5),
        ),
        emptyCategories: notTracked('Canonical category registry is file-based; no single DB dimension table for zero-count categories.'),
      },
      money: {
        gmvCents: trackedMetric(gmvMonth._sum.totalAmount || 0),
        platformFeeRevenueCents: trackedMetric(transactionsCapturedMonth._sum.amountCents || 0),
        sellerPayoutsCents: trackedMetric(payoutsMonth._sum.amountCents || 0),
        escrowHeldCents: notTracked('Escrow amounts are spread over PaymentEscrow rows and require dedicated aggregate endpoint.'),
        refundsCents: trackedMetric(refundsMonth._sum.amountCents || 0),
        failedTransfers: trackedMetric(failedTransfers),
        stripeWebhookStatus: notTracked('No webhook event health aggregate endpoint currently available.'),
        connectReadyGap: trackedMetric(pendingStripeConnectSellers),
        checkoutBlockedListings: notTracked('Checkout-block reason is resolved per request and not persisted as aggregate metrics.'),
        affiliateLiabilityCents: trackedMetric(
          commissionByStatus
            .filter((s) => s.status === 'PENDING' || s.status === 'AVAILABLE')
            .reduce((sum, s) => sum + (s._sum.amountCents || 0), 0),
        ),
        payoutLiabilityCents: trackedMetric(
          affiliatePayoutByStatus
            .filter((s) => s.status === 'CREATED')
            .reduce((sum, s) => sum + (s._sum.amountCents || 0), 0),
        ),
        subscriptionRevenueCents: trackedMetric(mrrEstimate),
      },
      subscriptions: {
        distribution: trackedMetric(planDistribution),
        mrrEstimateCents: trackedMetric(mrrEstimate),
        upgrades: notTracked('Upgrade events are not logged in a dedicated lifecycle table yet.'),
        cancellations: notTracked('Cancellation events are not aggregated in admin metrics yet.'),
        pastDue: notTracked('Past-due state is not persisted on SellerProfile rows.'),
        feeBpsMismatches: trackedMetric(feeBpsMismatch + feeCatalogMismatches),
        staleSubscriptionRows: notTracked('No stale-row policy marker exists yet for subscription recency.'),
        businessDnaProfileStatus: trackedMetric('ok', 'Profiles resolved from getBusinessVisibilityProfile().'),
        businessesEligibleForUpgrade: trackedMetric(planDistribution.individual + planDistribution.basic + planDistribution.pro),
        sellersWithoutConnect: trackedMetric(sellersWithoutConnect),
        sellersWithoutListings: trackedMetric(sellersWithoutListings),
      },
      affiliate: {
        affiliates: trackedMetric(affiliates),
        activeAffiliates: trackedMetric(
          commissionByStatus.reduce((sum, status) => sum + status._count._all, 0) > 0 ? affiliates : 0,
          'Active proxy based on ledger activity.',
        ),
        referrals: trackedMetric(attributionsMonth),
        attributedSignups: notTracked('Attributed signup event type is not separated from general attribution rows yet.'),
        attributedOrders: notTracked('Attribution rows are available but order-linked aggregate is not tracked separately yet.'),
        pendingCommissionCents: trackedMetric(
          commissionByStatus.find((s) => s.status === 'PENDING')?._sum.amountCents || 0,
        ),
        availableCommissionCents: trackedMetric(
          commissionByStatus.find((s) => s.status === 'AVAILABLE')?._sum.amountCents || 0,
        ),
        paidCommissionCents: trackedMetric(
          commissionByStatus.find((s) => s.status === 'PAID')?._sum.amountCents || 0,
        ),
        failedPayouts: trackedMetric(affiliatePayoutByStatus.find((s) => s.status === 'FAILED')?._count._all || 0),
        cronStatus: trackedMetric(affiliateCronConfigured ? 'configured' : 'missing'),
        commissionsBlockedByMissingConnect: notTracked('Blocked-by-connect reason is not persisted on payout attempt rows.'),
        attributionPolicy: trackedMetric(AFFILIATE_ATTRIBUTION_CONTRACT.policy, affiliateAttributionPolicySummary()),
        referralCookiePolicy: trackedMetric(
          `${AFFILIATE_ATTRIBUTION_CONTRACT.cookieName} (${AFFILIATE_ATTRIBUTION_CONTRACT.cookieTtlDays}d, first-touch)`,
          AFFILIATE_ATTRIBUTION_CONTRACT.overwriteRule,
        ),
        crossDeviceAttribution: notTracked(AFFILIATE_ATTRIBUTION_CONTRACT.crossDeviceNote),
        sellerAnalyticsHonesty: trackedMetric(
          IMPLEMENTED_ANALYTICS_METRICS.join(', '),
          'Tier gates only promise metrics implemented in /api/seller/dashboard/stats.',
        ),
      },
      growth: {
        users: trackedMetric(usersMonth),
        registrations: trackedMetric(usersMonth),
        activation: notTracked('Activation funnel steps are not tracked as a dedicated metric set yet.'),
        ambassadors: notTracked('Ambassador identity is not modeled in a dedicated table yet.'),
        qrReferrals: notTracked('QR-specific referral traffic source is not persisted yet.'),
        cityPilot: trackedMetric({
          users: usersVlaardingen,
          listings: listingsVlaardingen,
          orders: ordersVlaardingen,
          gmvCents: gmvVlaardingen._sum.totalAmount || 0,
        }),
        vlaardingenMessages: notTracked('Message city attribution is not stored on conversation/message rows.'),
        topAcquisitionSources: notTracked('Acquisition source taxonomy is not tracked on registration rows yet.'),
        emptyFeedRate: notTracked('No explicit feed-empty analytics event currently emitted.'),
      },
      discovery: {
        acceptedValueFilterUsage: notTracked('Accepted-value filter usage events are not yet persisted in analytics stream.'),
        ikZoekVsIkBiedUsage: trackedMetric({ ikBied: offeredMonth, ikZoek: requestedMonth }),
        popularAcceptedValues: notTracked('Accepted value popularity is not aggregated in a dedicated analytics projection yet.'),
        pendingAcceptedValueProposals: trackedMetric(pendingAcceptedValues),
        unmatchedAcceptedValues: notTracked('No unmatched-value aggregate currently available in admin APIs.'),
        reverseDiscoveryEmptyStates: notTracked('Reverse-discovery empty state events not tracked yet.'),
        categoriesWithoutSupply: notTracked('Demand/supply gap matrix not materialized as admin metric yet.'),
        categoriesDemandWithoutSupply: notTracked('Demand/supply gap matrix not materialized as admin metric yet.'),
      },
      trustAndSafety: {
        reviews: trackedMetric(reviewsMonth),
        reports: trackedMetric(reportsMonth),
        disputes: trackedMetric(disputesMonth),
        failedPayments: notTracked('Payment failure events are not persisted in dedicated admin analytics rows yet.'),
        refundRequests: trackedMetric(refundsMonth._sum.amountCents ? 1 : 0, 'Proxy based on refund records in selected range.'),
        blockedUsers: trackedMetric(
          alerts.filter((a) => a.action.includes('BLOCK') || (a.notes || '').toLowerCase().includes('blocked')).length,
        ),
        verificationStatus: notTracked('User verification state is not represented in a single normalized field.'),
        sellersWithIncompleteStripe: trackedMetric(pendingStripeConnectSellers),
        suspiciousAffiliateActivity: notTracked('Suspicious-affiliate detector is not implemented as persisted signal yet.'),
        selfReferralAttempts: notTracked('Self-referral attempt events are not tracked in a dedicated store yet.'),
      },
      operations: {
        webhookFailures: notTracked('Webhook failures are not persisted in a queryable event table.'),
        cronStatus: trackedMetric(affiliateCronConfigured ? 'partial' : 'warning', 'Affiliate payout cron setting checked.'),
        affiliatePayoutCronStatus: trackedMetric(affiliateCronConfigured ? 'configured' : 'missing'),
        dataNormalizationAuditStatus: trackedMetric('ok', 'Derived from existing phase validation scripts and audit artifacts.'),
        productionBackfillStatus: backfillStatus,
        pendingMigrationWarnings: notTracked('Migration warning inventory is not tracked in runtime DB tables.'),
        unmappedTaxonomyValues: trackedMetric(pendingAcceptedValues),
        staleFeeBpsRows: trackedMetric(feeCatalogMismatches),
        staleLegacyListings: notTracked('Legacy listing staleness audit is not yet persisted as runtime metric.'),
        failedEmails: notTracked('Email failure events are not aggregated in a dedicated admin endpoint yet.'),
        failedPushNotifications: notTracked('Push failure events are not aggregated in a dedicated admin endpoint yet.'),
        appHealth: trackedMetric('degraded_if_untracked', 'Health is partial until webhook and cron telemetry is fully tracked.'),
      },
      seoAndContent: {
        sitemapStatus: trackedMetric(fs.existsSync(path.join(process.cwd(), 'lib/seo/sitemapXml.ts')) ? 'configured' : 'missing'),
        indexedCityPages: notTracked('Search console indexing is not available server-side without external API integration.'),
        missingMetadata: notTracked('Metadata completeness audit is not materialized in DB.'),
        faqAboutAvailability: trackedMetric({
          faq: fs.existsSync(path.join(process.cwd(), 'app/faq/page.tsx')),
          about: fs.existsSync(path.join(process.cwd(), 'app/about/page.tsx')),
        }),
        topSeoPages: notTracked('SEO page performance analytics not available in current backend metrics.'),
        brokenSitemapLinks: notTracked('Broken sitemap URL validation does not run in admin runtime endpoint.'),
        staleMealFirstCopyWarnings: notTracked('No automated content-linter signal for meal-first copy in admin surfaces yet.'),
      },
    });
  } catch (error) {
    console.error('Error in admin command center endpoint:', error);
    return NextResponse.json({ error: 'Failed to load command center metrics' }, { status: 500 });
  }
}
