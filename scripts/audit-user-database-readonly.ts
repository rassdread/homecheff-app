/**
 * READ-ONLY user-population audit. Prints counts only. Never writes.
 *
 *   npx tsx scripts/audit-user-database-readonly.ts
 */
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import {
  anonymizedUserWhere,
  classifyUserPopulation,
  demonstrableTestUserWhere,
  emptyRetentionDeps,
  hardDeleteIsObjectivelySafe,
  isKeepFixture,
  realUserWhere,
  registrationOrigin,
  type RetentionDeps,
  type UserPopulationClass,
} from '../lib/admin/user-population';

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2]!;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]!]) process.env[match[1]!] = value;
  }
}

loadEnv('.env');
loadEnv('.env.local');

const prisma = new PrismaClient();

const REVIEW_RE = /(testuser|test-user|dummy|seed|e2e|smoke|qa[-_]|demo[-_])/i;

async function main() {
  const now = new Date();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      emailVerified: true,
      termsAccepted: true,
      accountDeletedAt: true,
      stripeConnectAccountId: true,
      sellerActivatedAt: true,
      acquisitionActivatedAt: true,
      acquisitionFirstTouch: true,
      SellerProfile: {
        select: { id: true, stripeCustomerId: true, stripeSubscriptionId: true },
      },
      affiliate: { select: { id: true, stripeConnectAccountId: true } },
    },
  });

  const classes = { real: 0, test: 0, deleted: 0 };
  const byRole: Record<string, Record<UserPopulationClass, number>> = {};
  let verified = 0;
  let active = 0;
  let newToday = 0;
  let new7 = 0;
  let new30 = 0;
  let unverifiedReal = 0;
  let termsMissingReal = 0;
  let reviewNotExcluded = 0;
  let deletedWithTimestamp = 0;
  let deletedEmailOnly = 0;
  const deletedYears: Record<string, number> = {};
  const created = {
    deleted: [] as string[],
    test: [] as string[],
  };

  for (const user of users) {
    const population = classifyUserPopulation(user);
    classes[population] += 1;
    const role = String(user.role);
    byRole[role] ??= { real: 0, test: 0, deleted: 0 };
    byRole[role][population] += 1;
    if (population === 'real') {
      if (user.emailVerified) verified += 1;
      else unverifiedReal += 1;
      if (!user.termsAccepted) termsMissingReal += 1;
      if (user.updatedAt >= day7) active += 1;
      if (user.createdAt >= today) newToday += 1;
      if (user.createdAt >= day7) new7 += 1;
      if (user.createdAt >= day30) new30 += 1;
      const blob = `${user.email || ''} ${user.username || ''}`;
      if (REVIEW_RE.test(blob)) reviewNotExcluded += 1;
    }
    if (population === 'deleted') {
      created.deleted.push(user.createdAt.toISOString());
      if (user.accountDeletedAt) deletedWithTimestamp += 1;
      else deletedEmailOnly += 1;
      const year = String(user.createdAt.getUTCFullYear());
      deletedYears[year] = (deletedYears[year] || 0) + 1;
    }
    if (population === 'test') created.test.push(user.createdAt.toISOString());
  }

  const nonReal = users.filter((user) => classifyUserPopulation(user) !== 'real');
  const nonRealIds = nonReal.map((user) => user.id);
  const sellerIdToUser = new Map<string, string>();
  const affiliateIdToUser = new Map<string, string>();
  for (const user of nonReal) {
    if (user.SellerProfile?.id) sellerIdToUser.set(user.SellerProfile.id, user.id);
    if (user.affiliate?.id) affiliateIdToUser.set(user.affiliate.id, user.id);
  }
  const sellerIds = [...sellerIdToUser.keys()];
  const affiliateIds = [...affiliateIdToUser.keys()];

  const deps = new Map<string, RetentionDeps>();
  for (const user of nonReal) deps.set(user.id, emptyRetentionDeps());

  if (nonRealIds.length > 0) {
    const [
      ordersBuyer,
      transactionsBuyer,
      transactionsSeller,
      payouts,
      escrows,
      hcSettlements,
      communityBuyer,
      communitySeller,
      reservationsBuyer,
      reservationsSeller,
      reviews,
      messages,
      proposalsBuyer,
      proposalsSeller,
      listings,
      reportsFiled,
      reportsTarget,
      expenses,
      evidence,
      attributions,
      products,
      sellerOrders,
      ledgers,
      affiliatePayouts,
      auditLogs,
      deliveryProfiles,
      dishes,
      conversationParticipants,
    ] = await Promise.all([
      prisma.order.groupBy({
        by: ['userId'],
        where: { userId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ['buyerId'],
        where: { buyerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.transaction.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.payout.groupBy({
        by: ['toUserId'],
        where: { toUserId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.paymentEscrow.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.marketplaceHcSettlementExposure.groupBy({
        by: ['sellerUserId'],
        where: { sellerUserId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.communityOrder.groupBy({
        by: ['buyerId'],
        where: { buyerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.communityOrder.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.reservation.groupBy({
        by: ['buyerId'],
        where: { buyerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.reservation.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.productReview.groupBy({
        by: ['buyerId'],
        where: { buyerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.message.groupBy({
        by: ['senderId'],
        where: { senderId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.proposal.groupBy({
        by: ['buyerId'],
        where: { buyerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.proposal.groupBy({
        by: ['sellerId'],
        where: { sellerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.listing.groupBy({
        by: ['ownerId'],
        where: { ownerId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.report.groupBy({
        by: ['reporterId'],
        where: { reporterId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.report.groupBy({
        by: ['targetUserId'],
        where: { targetUserId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.sellerExpense.groupBy({
        by: ['sellerUserId'],
        where: { sellerUserId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.sellerFinancialEvidence.groupBy({
        by: ['ownerUserId'],
        where: { ownerUserId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.attribution.groupBy({
        by: ['userId'],
        where: { userId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      sellerIds.length
        ? prisma.product.groupBy({
            by: ['sellerId'],
            where: { sellerId: { in: sellerIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      sellerIds.length
        ? prisma.orderItem.groupBy({
            by: ['productId'],
            where: { Product: { sellerId: { in: sellerIds } } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      affiliateIds.length
        ? prisma.commissionLedger.groupBy({
            by: ['affiliateId'],
            where: { affiliateId: { in: affiliateIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      affiliateIds.length
        ? prisma.affiliatePayout.groupBy({
            by: ['affiliateId'],
            where: { affiliateId: { in: affiliateIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { userId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.deliveryProfile.groupBy({
        by: ['userId'],
        where: { userId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.dish.groupBy({
        by: ['userId'],
        where: { userId: { in: nonRealIds } },
        _count: { _all: true },
      }),
      prisma.conversationParticipant.groupBy({
        by: ['userId'],
        where: { userId: { in: nonRealIds } },
        _count: { _all: true },
      }),
    ]);

    const bump = (
      rows: Array<Record<string, string | number | { _all: number } | null>>,
      field: string,
      apply: (dep: RetentionDeps, count: number) => void,
      remap?: Map<string, string>,
    ) => {
      for (const row of rows) {
        const raw = row[field];
        if (typeof raw !== 'string') continue;
        const userId = remap ? remap.get(raw) : raw;
        if (!userId) continue;
        const dep = deps.get(userId);
        if (!dep) continue;
        const count = (row._count as { _all: number })._all;
        apply(dep, count);
      }
    };

    bump(ordersBuyer, 'userId', (dep, n) => {
      dep.ordersBuyer += n;
    });
    bump(transactionsBuyer, 'buyerId', (dep, n) => {
      dep.transactionsBuyer += n;
    });
    bump(transactionsSeller, 'sellerId', (dep, n) => {
      dep.transactionsSeller += n;
    });
    bump(payouts, 'toUserId', (dep, n) => {
      dep.payouts += n;
    });
    bump(escrows, 'sellerId', (dep, n) => {
      dep.escrows += n;
    });
    bump(hcSettlements, 'sellerUserId', (dep, n) => {
      dep.hcSettlements += n;
    });
    bump(communityBuyer, 'buyerId', (dep, n) => {
      dep.communityOrders += n;
    });
    bump(communitySeller, 'sellerId', (dep, n) => {
      dep.communityOrders += n;
    });
    bump(reservationsBuyer, 'buyerId', (dep, n) => {
      dep.reservations += n;
    });
    bump(reservationsSeller, 'sellerId', (dep, n) => {
      dep.reservations += n;
    });
    bump(reviews, 'buyerId', (dep, n) => {
      dep.reviews += n;
    });
    bump(messages, 'senderId', (dep, n) => {
      dep.messages += n;
    });
    bump(proposalsBuyer, 'buyerId', (dep, n) => {
      dep.proposals += n;
    });
    bump(proposalsSeller, 'sellerId', (dep, n) => {
      dep.proposals += n;
    });
    bump(listings, 'ownerId', (dep, n) => {
      dep.listings += n;
    });
    bump(reportsFiled, 'reporterId', (dep, n) => {
      dep.reports += n;
    });
    bump(reportsTarget, 'targetUserId', (dep, n) => {
      dep.reports += n;
    });
    bump(expenses, 'sellerUserId', (dep, n) => {
      dep.sellerExpenses += n;
    });
    bump(evidence, 'ownerUserId', (dep, n) => {
      dep.financialEvidence += n;
    });
    bump(attributions, 'userId', (dep, n) => {
      dep.attributions += n;
    });
    bump(products, 'sellerId', (dep, n) => {
      dep.products += n;
    }, sellerIdToUser);
    bump(ledgers, 'affiliateId', (dep, n) => {
      dep.commissionLedger += n;
    }, affiliateIdToUser);
    bump(affiliatePayouts, 'affiliateId', (dep, n) => {
      dep.affiliatePayouts += n;
    }, affiliateIdToUser);
    bump(auditLogs, 'userId', (dep, n) => {
      dep.auditLogs += n;
    });
    bump(deliveryProfiles, 'userId', (dep, n) => {
      dep.deliveryProfiles += n;
    });
    bump(dishes, 'userId', (dep, n) => {
      dep.dishes += n;
    });
    bump(conversationParticipants, 'userId', (dep, n) => {
      dep.conversationParticipants += n;
    });

    if (sellerOrders.length > 0) {
      const productIds = sellerOrders
        .map((row) => row.productId)
        .filter((id): id is string => Boolean(id));
      const productSellers = productIds.length
        ? await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, sellerId: true },
          })
        : [];
      const productToUser = new Map<string, string>();
      for (const product of productSellers) {
        const userId = sellerIdToUser.get(product.sellerId);
        if (userId) productToUser.set(product.id, userId);
      }
      for (const row of sellerOrders) {
        const userId = productToUser.get(row.productId);
        const dep = userId ? deps.get(userId) : undefined;
        if (dep) dep.ordersSeller += row._count._all;
      }
    }
  }

  let safe = 0;
  let safeDeleted = 0;
  let safeTest = 0;
  let blockedDeleted = 0;
  let blockedTest = 0;
  const blockReasons: Record<string, number> = {};

  for (const user of nonReal) {
    const dep = deps.get(user.id) ?? emptyRetentionDeps();
    if (user.stripeConnectAccountId) dep.stripeConnect = true;
    if (user.SellerProfile?.stripeCustomerId || user.SellerProfile?.stripeSubscriptionId) {
      dep.sellerStripe = true;
    }
    if (user.affiliate) {
      dep.affiliateRow = true;
      if (user.affiliate.stripeConnectAccountId) dep.affiliateStripe = true;
    }
    const population = classifyUserPopulation(user);
    const ok = hardDeleteIsObjectivelySafe({
      population,
      role: user.role,
      keepFixture: isKeepFixture(user),
      deps: dep,
    });
    if (ok) {
      safe += 1;
      if (population === 'deleted') safeDeleted += 1;
      else safeTest += 1;
    } else if (population === 'deleted') {
      blockedDeleted += 1;
    } else {
      blockedTest += 1;
    }
    for (const [key, value] of Object.entries(dep)) {
      const hit = typeof value === 'boolean' ? value : value > 0;
      if (!hit) continue;
      blockReasons[key] = (blockReasons[key] || 0) + 1;
    }
  }

  const signupAttributions = await prisma.attribution.findMany({
    where: { type: { in: ['USER_SIGNUP', 'BUSINESS_SIGNUP'] } },
    select: { userId: true },
    distinct: ['userId'],
  });
  const attributed = new Set(signupAttributions.map((row) => row.userId));
  const origins = { meta: 0, affiliate: 0, organic: 0, recorded_other: 0, unknown: 0 };
  const sourceHistogram: Record<string, number> = {};
  let metaVerified = 0;
  let metaActivated = 0;
  let metaFirstListing = 0;
  let withTouch = 0;
  let touchOnDeletedOrTest = 0;

  for (const user of users) {
    const population = classifyUserPopulation(user);
    const touch = user.acquisitionFirstTouch;
    if (touch && typeof touch === 'object') {
      if (population === 'real') withTouch += 1;
      else touchOnDeletedOrTest += 1;
      const source =
        typeof (touch as { utm_source?: unknown }).utm_source === 'string'
          ? String((touch as { utm_source?: string }).utm_source).toLowerCase()
          : '(none)';
      if (population === 'real') {
        sourceHistogram[source] = (sourceHistogram[source] || 0) + 1;
      }
    }
    if (population !== 'real') continue;
    const origin = registrationOrigin({
      acquisitionFirstTouch: user.acquisitionFirstTouch,
      hasAffiliateAttribution: attributed.has(user.id),
    });
    origins[origin] += 1;
    if (origin !== 'meta') continue;
    if (user.emailVerified) metaVerified += 1;
    if (user.acquisitionActivatedAt || user.sellerActivatedAt) metaActivated += 1;
    if (user.sellerActivatedAt) metaFirstListing += 1;
  }

  const span = (values: string[]) =>
    values.length === 0
      ? null
      : { earliest: values.slice().sort()[0], latest: values.slice().sort().at(-1), count: values.length };

  const [sqlReal, sqlTest, sqlDeleted] = await Promise.all([
    prisma.user.count({ where: realUserWhere() }),
    prisma.user.count({ where: demonstrableTestUserWhere() }),
    prisma.user.count({ where: anonymizedUserWhere() }),
  ]);

  const report = {
    READ_ONLY: true,
    DELETED_ROWS: 0,
    TOTAL_DATABASE_ACCOUNTS: users.length,
    PARTITION_SUM: classes.real + classes.test + classes.deleted,
    SQL_FILTER_MATCH: {
      real: sqlReal === classes.real,
      test: sqlTest === classes.test,
      deleted: sqlDeleted === classes.deleted,
      sqlReal,
      sqlTest,
      sqlDeleted,
    },
    REAL_USERS: classes.real,
    DEMONSTRABLE_TEST_ACCOUNTS: classes.test,
    ANONYMIZED_ACCOUNTS: classes.deleted,
    ANONYMIZED_WITH_DELETED_AT: deletedWithTimestamp,
    ANONYMIZED_EMAIL_ONLY: deletedEmailOnly,
    ANONYMIZED_CREATED_YEAR: deletedYears,
    VERIFIED_REAL: verified,
    UNVERIFIED_REAL: unverifiedReal,
    REAL_WITHOUT_TERMS: termsMissingReal,
    ACTIVE_REAL_7D: active,
    NEW_REAL_TODAY: newToday,
    NEW_REAL_7D: new7,
    NEW_REAL_30D: new30,
    REVIEW_PATTERN_KEPT_AS_REAL: reviewNotExcluded,
    ROLES: byRole,
    CREATED_SPAN: { deleted: span(created.deleted), test: span(created.test) },
    OBJECTIVELY_SAFE_HARD_DELETE: safe,
    SAFE_DELETED: safeDeleted,
    SAFE_TEST: safeTest,
    MUST_RETAIN: users.length - safe,
    BLOCKED_DELETED: blockedDeleted,
    BLOCKED_TEST: blockedTest,
    NON_REAL_BLOCK_REASON_ACCOUNTS: blockReasons,
    ACQUISITION: {
      REAL_WITH_STORED_UTM: withTouch,
      TOUCH_ON_DELETED_OR_TEST: touchOnDeletedOrTest,
      UTM_SOURCE_HISTOGRAM_REAL: sourceHistogram,
      ORIGINS_REAL: origins,
      ORIGIN_SUM: Object.values(origins).reduce((sum, n) => sum + n, 0),
      META_VISITORS: null,
      META_REGISTRATIONS: origins.meta,
      META_VERIFIED: metaVerified,
      META_ACTIVATED: metaActivated,
      META_FIRST_LISTING: metaFirstListing,
      AFFILIATE_SIGNUP_ATTRIBUTIONS: signupAttributions.length,
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'audit failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
