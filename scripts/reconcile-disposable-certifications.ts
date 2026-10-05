/**
 * Idempotent certification reconciliation.
 * Dry-run unless HOMECHEFF_CERT_INTENT=production and HOMECHEFF_CERT_RECONCILE=1.
 * Never prints emails, names, or Stripe ids.
 *
 *   HOMECHEFF_CERT_INTENT=production HOMECHEFF_CERT_RECONCILE=1 npx tsx scripts/reconcile-disposable-certifications.ts
 */
import { PrismaClient } from '@prisma/client';
import { decideCertHygiene, isTempGoogleUsername, type CertHygieneFacts } from '../lib/certification/cert-hygiene';
import { finishLeftoverCertificationTombstone, performUserAccountDeletion } from '../lib/account-deletion';

const EXPECTED = {
  liveDispose: 1,
  finishTombstone: 15,
  keepSkip: 1,
  financialSkip: 4,
  ordinaryTombstones: 184,
  tempGoogleCohort: 5,
};

function gateFailure(counts: Record<string, number>): string | null {
  if (counts.DISPOSE_LIVE !== EXPECTED.liveDispose) return 'live_dispose';
  if (counts.FINISH_TOMBSTONE !== EXPECTED.finishTombstone) return 'finish_tombstone';
  if (counts.RETAIN_FIXTURE < EXPECTED.keepSkip) return 'keep_fixture';
  if (counts.RETAIN_FINANCIAL < EXPECTED.financialSkip) return 'financial';
  if (counts.NOOP_TOMBSTONE !== EXPECTED.ordinaryTombstones) return 'tombstones';
  if (counts.tempGoogleCohort !== EXPECTED.tempGoogleCohort) return 'temp_google';
  return null;
}

async function main() {
  const prisma = new PrismaClient();
  const apply = process.env.HOMECHEFF_CERT_RECONCILE === '1' && process.env.HOMECHEFF_CERT_INTENT === 'production';
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        sellerRoles: true,
        accountDeletedAt: true,
        stripeConnectAccountId: true,
        SellerProfile: {
          select: { id: true, stripeCustomerId: true, stripeSubscriptionId: true },
        },
        affiliate: { select: { stripeConnectAccountId: true } },
        _count: {
          select: {
            followsAsFollower: true,
            followsAsSeller: true,
            Message: true,
            orders: true,
            Payout: true,
          },
        },
      },
    });

    const sellerIds = users.map((u) => u.SellerProfile?.id).filter((id): id is string => Boolean(id));
    const [products, dishes, transactions, escrows, paidOrders] = await Promise.all([
      sellerIds.length
        ? prisma.product.findMany({
            where: { sellerId: { in: sellerIds } },
            select: { sellerId: true, isActive: true, integrityStatus: true, listingIntent: true },
          })
        : [],
      prisma.dish.groupBy({ by: ['userId', 'status'], _count: { _all: true } }),
      prisma.transaction.findMany({ select: { buyerId: true, sellerId: true } }),
      prisma.paymentEscrow.findMany({ select: { sellerId: true } }),
      prisma.order.findMany({
        where: { stripeSessionId: { not: null } },
        select: { userId: true, items: { select: { Product: { select: { seller: { select: { userId: true } } } } } } },
      }),
    ]);

    const activeBySeller = new Map<string, number>();
    for (const product of products) {
      if (product.isActive && product.integrityStatus === 'ACTIVE' && product.listingIntent === 'OFFER') {
        activeBySeller.set(product.sellerId, (activeBySeller.get(product.sellerId) || 0) + 1);
      }
    }
    const publishedByUser = new Map<string, number>();
    for (const row of dishes) {
      if (row.status === 'PUBLISHED') {
        publishedByUser.set(row.userId, (publishedByUser.get(row.userId) || 0) + row._count._all);
      }
    }
    const moneyUsers = new Set<string>();
    for (const row of transactions) {
      if (row.buyerId) moneyUsers.add(row.buyerId);
      if (row.sellerId) moneyUsers.add(row.sellerId);
    }
    for (const row of escrows) moneyUsers.add(row.sellerId);
    for (const order of paidOrders) {
      moneyUsers.add(order.userId);
      for (const item of order.items) {
        const seller = item.Product?.seller?.userId;
        if (seller) moneyUsers.add(seller);
      }
    }

    const decisions = users.map((user) => {
      const facts: CertHygieneFacts = {
        email: user.email,
        username: user.username,
        bio: user.bio,
        accountDeletedAt: user.accountDeletedAt,
        stripeConnectAccountId: user.stripeConnectAccountId,
        sellerStripeCustomerId: user.SellerProfile?.stripeCustomerId ?? null,
        sellerStripeSubscriptionId: user.SellerProfile?.stripeSubscriptionId ?? null,
        affiliateStripeAccountId: user.affiliate?.stripeConnectAccountId ?? null,
        paymentEvidence: moneyUsers.has(user.id) || user._count.orders > 0 || user._count.Payout > 0,
        crossAccountFinancial: false,
        activePublicProducts: user.SellerProfile ? activeBySeller.get(user.SellerProfile.id) || 0 : 0,
        publishedDishes: publishedByUser.get(user.id) || 0,
        follows: user._count.followsAsFollower + user._count.followsAsSeller,
        messages: user._count.Message,
      };
      const decision = decideCertHygiene(facts);
      const tempCohort =
        isTempGoogleUsername(user.username) &&
        !user.accountDeletedAt &&
        (Boolean(user.SellerProfile) || (user.sellerRoles || []).length > 0 || facts.activePublicProducts > 0);
      return { id: user.id, decision, tempCohort };
    });

    const counts: Record<string, number> = {
      DISPOSE_LIVE: 0,
      FINISH_TOMBSTONE: 0,
      RETAIN_FIXTURE: 0,
      RETAIN_FINANCIAL: 0,
      RETAIN_ORDINARY: 0,
      NOOP_TOMBSTONE: 0,
      RETAIN_MANUAL: 0,
      tempGoogleCohort: 0,
    };
    for (const row of decisions) {
      counts[row.decision] += 1;
      if (row.tempCohort) counts.tempGoogleCohort += 1;
    }

    const drift = gateFailure(counts);
    const plan = {
      total: users.length,
      ...counts,
      AUDIT_DRIFT_DETECTED: drift ? 'YES' : 'NO',
      drift,
      apply,
    };
    console.log(JSON.stringify(plan));
    if (drift || !apply) {
      process.exitCode = drift ? 2 : 0;
      return;
    }

    const liveIds = decisions.filter((row) => row.decision === 'DISPOSE_LIVE').map((row) => row.id);
    const finishIds = decisions.filter((row) => row.decision === 'FINISH_TOMBSTONE').map((row) => row.id);
    let disposed = 0;
    let tombstoned = 0;
    for (const id of liveIds) {
      const again = await prisma.user.findUnique({
        where: { id },
        select: {
          email: true,
          username: true,
          bio: true,
          accountDeletedAt: true,
          stripeConnectAccountId: true,
          SellerProfile: { select: { stripeCustomerId: true, stripeSubscriptionId: true } },
        },
      });
      if (!again || again.accountDeletedAt || again.stripeConnectAccountId || again.SellerProfile) {
        throw new Error('SAFE_ACCOUNT_CHANGED_SINCE_AUDIT');
      }
      await performUserAccountDeletion(id);
      disposed += 1;
    }
    for (const id of finishIds) {
      const again = await prisma.user.findUnique({
        where: { id },
        select: {
          email: true,
          username: true,
          bio: true,
          accountDeletedAt: true,
          stripeConnectAccountId: true,
          SellerProfile: { select: { stripeCustomerId: true, stripeSubscriptionId: true } },
          _count: { select: { orders: true, Payout: true, Message: true, followsAsFollower: true, followsAsSeller: true } },
        },
      });
      if (!again?.accountDeletedAt || again.stripeConnectAccountId || again.SellerProfile?.stripeCustomerId || again.SellerProfile?.stripeSubscriptionId) {
        throw new Error('SAFE_ACCOUNT_CHANGED_SINCE_AUDIT');
      }
      if (again._count.orders || again._count.Payout || again._count.Message || again._count.followsAsFollower || again._count.followsAsSeller) {
        throw new Error('SAFE_ACCOUNT_CHANGED_SINCE_AUDIT');
      }
      await finishLeftoverCertificationTombstone(id);
      tombstoned += 1;
    }
    console.log(JSON.stringify({ disposed, tombstoned, hardDeleted: 0 }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'reconcile_failed';
  console.error(message);
  process.exitCode = 1;
});
