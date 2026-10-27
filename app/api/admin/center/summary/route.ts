import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { accessDecision } from '@/lib/admin/admin-capabilities';
import { requirePlatformAdmin } from '@/lib/admin-guard';
import { paidMarketplaceOrderWhere, sumCurrentModeGrossCents } from '@/lib/admin/paid-marketplace-orders';
import { financialStripeSecret } from '@/lib/stripe';
import { isSuccessfulTransferRef } from '@/lib/payments/seller-settlement';

export const dynamic = 'force-dynamic';

/**
 * Permission-filtered admin counts.
 * Gross merchandise value is captured order value in the current Stripe mode.
 * It is not platform profit. Test mode is labeled and is not live revenue.
 */
export async function GET() {
  const guard = await requirePlatformAdmin();
  if (!guard.ok) return guard.response;
  const allowed = (capability: Parameters<typeof accessDecision>[0]['capability']) =>
    accessDecision({
      role: guard.admin.user.role,
      adminRoles: guard.admin.user.adminRoles,
      permissions: guard.admin.permissions,
      capability,
    }).allow;

  const secret = financialStripeSecret();
  const stripeMode = secret?.startsWith('sk_test_') ? 'test' : secret?.startsWith('sk_live_') ? 'live' : 'unconfigured';
  const body: Record<string, unknown> = { stripeMode };

  if (allowed('GLOBAL.DASHBOARD.VIEW') || allowed('GLOBAL.USERS.VIEW')) {
    const [users, verifiedUsers, administrators] = await Promise.all([
      prisma.user.count({ where: { accountDeletedAt: null } }),
      prisma.user.count({ where: { accountDeletedAt: null, emailVerified: { not: null } } }),
      prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPERADMIN'] }, accountDeletedAt: null } }),
    ]);
    body.global = {
      users,
      verifiedUsers,
      administrators,
      definition: 'Users exclude deleted accounts. Verified means emailVerified is set. Administrators are ADMIN and SUPERADMIN roles.',
    };
  }

  if (allowed('MARKETPLACE.ORDERS.VIEW') || allowed('MARKETPLACE.PAYMENTS.VIEW')) {
    const where = paidMarketplaceOrderWhere();
    const [paidOrders, orders, payouts, refunds, deliveryProfiles] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, select: { totalAmount: true, stripeSessionId: true } }),
      prisma.payout.findMany({ select: { amountCents: true, providerRef: true } }),
      prisma.refund.count(),
      prisma.deliveryProfile.count({ where: { isBlocked: false } }),
    ]);
    const transferredCents = payouts
      .filter((payout) => isSuccessfulTransferRef(payout.providerRef))
      .reduce((sum, payout) => sum + payout.amountCents, 0);
    body.marketplace = {
      paidOrders,
      grossMerchandiseCents: allowed('MARKETPLACE.PAYMENTS.VIEW') ? sumCurrentModeGrossCents(orders) : null,
      successfulTransferCents: allowed('MARKETPLACE.PAYMENTS.VIEW') ? transferredCents : null,
      refundRecords: allowed('MARKETPLACE.PAYMENTS.VIEW') ? refunds : null,
      deliveryProfiles,
      currency: 'EUR',
      definition: 'Paid orders use the V20 paid-marketplace filter and the current Stripe mode. Gross is item value, not platform profit. Transfers count only provider refs that start with tr_.',
    };
  }

  if (allowed('GROWTH.CAMPAIGNS.VIEW') || allowed('GROWTH.AFFILIATES.VIEW') || allowed('GROWTH.BILLING.VIEW')) {
    const [commercialAffiliates, promotions] = await Promise.all([
      prisma.affiliate.count({ where: { populationClass: 'COMMERCIAL' } }),
      prisma.promoCode.count(),
    ]);
    body.growth = {
      commercialAffiliates: allowed('GROWTH.AFFILIATES.VIEW') || allowed('GROWTH.CAMPAIGNS.VIEW') ? commercialAffiliates : null,
      promotionRecords: allowed('GROWTH.CAMPAIGNS.VIEW') ? promotions : null,
      collectedRevenueCents: null,
      unavailable: 'Growth has no separate collected-revenue ledger in this admin summary.',
    };
  }

  if (allowed('STUDIO.PROJECTS.VIEW') || allowed('STUDIO.JOBS.VIEW') || allowed('STUDIO.COSTS.VIEW')) {
    const [projects, jobs] = await Promise.all([
      prisma.workspaceContent.count(),
      prisma.marketplaceVideoJob.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    body.studio = {
      workspaceProjects: allowed('STUDIO.PROJECTS.VIEW') ? projects : null,
      generationJobsByStatus: allowed('STUDIO.JOBS.VIEW')
        ? jobs.map((row) => ({ status: row.status, count: row._count._all }))
        : null,
      providerCostCents: null,
      customerRevenueCents: null,
      mediaIncluded: false,
      unavailable: 'No studio provider-cost or customer-revenue ledger is stored. Counts are records, not money.',
    };
  }

  return NextResponse.json(body);
}
