/**
 * Read-only by default. Pass --apply to write the planned sellerRoles union
 * and, only when the architecture requires it, a missing SellerProfile.
 * Never updates User.role, Product, Dish, orders, or Stripe fields.
 */
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

function loadEnvLocal(): void {
  const text = readFileSync('.env.local', 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function databaseKind(): 'remote' | 'local' {
  const raw = process.env.DATABASE_URL ?? '';
  let host = '';
  try {
    host = new URL(raw).hostname;
  } catch {
    host = '';
  }
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return 'local';
  return 'remote';
}

async function main(): Promise<void> {
  loadEnvLocal();
  const kind = databaseKind();
  if (kind !== 'remote') {
    console.log(JSON.stringify({ ok: false, error: 'refusing local database' }));
    process.exit(1);
  }

  const apply = process.argv.includes('--apply');
  const { PrismaClient } = await import('@prisma/client');
  const { isCertificationFixtureUser } = await import('../lib/marketplace/public-listing-eligibility');
  const { isIntegrityPubliclyDiscoverable } = await import('../lib/trust/integrity-status');
  const { productIntegrityPublicWhere } = await import('../lib/trust/integrity-status');
  const { planHistoricalRoleIntegrity, sellerRoleWriteIsAdditive } = await import(
    '../lib/seller/historical-service-backfill'
  );

  const prisma = new PrismaClient({
    log: ['error'],
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  try {
    const [
      offers,
      requestCount,
      serviceLikeRequestCount,
      dishCount,
      profiles,
      rolesWithoutProfile,
      productCount,
      orderCount,
      escrowCount,
    ] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true, listingIntent: 'OFFER', ...productIntegrityPublicWhere() },
        select: {
          id: true,
          listingIntent: true,
          category: true,
          marketplaceCategory: true,
          subcategory: true,
          specializations: true,
          integrityStatus: true,
          isActive: true,
          seller: {
            select: {
              userId: true,
              User: {
                select: {
                  id: true,
                  role: true,
                  sellerRoles: true,
                  email: true,
                  bio: true,
                  suspendedAt: true,
                  accountDeletedAt: true,
                },
              },
            },
          },
        },
      }),
      prisma.product.count({ where: { listingIntent: 'REQUEST' } }),
      prisma.product.count({
        where: {
          listingIntent: 'REQUEST',
          OR: [
            { marketplaceCategory: { in: ['PRACTICAL_SERVICE', 'KNOWLEDGE', 'ARTISTIC_SERVICE', 'DESIGN'] } },
            { subcategory: { startsWith: 'design.' } },
          ],
        },
      }),
      prisma.dish.count(),
      prisma.sellerProfile.findMany({
        select: {
          userId: true,
          User: {
            select: {
              role: true,
              sellerRoles: true,
              email: true,
              bio: true,
              suspendedAt: true,
              accountDeletedAt: true,
              DeliveryProfile: { select: { id: true } },
            },
          },
        },
      }),
      prisma.user.findMany({
        where: { SellerProfile: { is: null }, NOT: { sellerRoles: { isEmpty: true } } },
        select: {
          id: true,
          role: true,
          sellerRoles: true,
          email: true,
          bio: true,
          suspendedAt: true,
          accountDeletedAt: true,
          DeliveryProfile: { select: { id: true } },
        },
      }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.paymentEscrow.count(),
    ]);

    const users = new Map<string, {
      userId: string;
      userRole: string;
      sellerRoles: string[];
      hasSellerProfile: boolean;
      hasDeliveryProfile: boolean;
      isCertificationFixture: boolean;
      accountDeleted: boolean;
    }>();

    for (const profile of profiles) {
      const account = profile.User;
      users.set(profile.userId, {
        userId: profile.userId,
        userRole: account.role,
        sellerRoles: account.sellerRoles ?? [],
        hasSellerProfile: true,
        hasDeliveryProfile: Boolean(account.DeliveryProfile),
        isCertificationFixture: isCertificationFixtureUser(account),
        accountDeleted: Boolean(account.accountDeletedAt),
      });
    }

    for (const account of rolesWithoutProfile) {
      users.set(account.id, {
        userId: account.id,
        userRole: account.role,
        sellerRoles: account.sellerRoles ?? [],
        hasSellerProfile: false,
        hasDeliveryProfile: Boolean(account.DeliveryProfile),
        isCertificationFixture: isCertificationFixtureUser(account),
        accountDeleted: Boolean(account.accountDeletedAt),
      });
    }

    const offerRows = offers.map((row) => {
      const account = row.seller.User;
      const existing = users.get(account.id);
      users.set(account.id, {
        userId: account.id,
        userRole: account.role,
        sellerRoles: account.sellerRoles ?? [],
        hasSellerProfile: true,
        hasDeliveryProfile: existing?.hasDeliveryProfile ?? false,
        isCertificationFixture: isCertificationFixtureUser(account),
        accountDeleted: Boolean(account.accountDeletedAt),
      });
      return {
        productId: row.id,
        userId: account.id,
        listingIntent: row.listingIntent,
        marketplaceCategory: row.marketplaceCategory,
        productCategory: row.category,
        specializations: row.specializations ?? [],
        subcategory: row.subcategory,
        isActive: row.isActive,
        integrityPublic: isIntegrityPubliclyDiscoverable(row.integrityStatus),
        sellerSuspended: Boolean(account.suspendedAt),
        sellerDeleted: Boolean(account.accountDeletedAt),
        isCertificationFixture: isCertificationFixtureUser(account),
      };
    });

    const plan = planHistoricalRoleIntegrity({
      offers: offerRows,
      users: [...users.values()],
      requestCount,
      serviceLikeRequestCount,
      dishCount,
    });

    const boundaries = { products: productCount, dishes: dishCount, orders: orderCount, escrows: escrowCount };

    if (!apply) {
      console.log(JSON.stringify({
        mode: 'dry-run',
        database: 'remote',
        activeOffersRead: offerRows.length,
        boundaries,
        provenServiceUsers: plan.provenServiceUserIds.length,
        alreadyWithService: plan.serviceUsersAlreadyWithService.length,
        serviceRepairs: plan.serviceRepairs,
        otherRoleRepairs: plan.otherRoleRepairs,
        ambiguousServiceUsers: plan.ambiguousServiceUserIds,
        profilesToCreate: plan.profilesToCreate,
        profileWithoutRole: {
          count: plan.profileWithoutRole.count,
          provable: plan.profileWithoutRole.provableRoleMissing,
          legitimate: plan.profileWithoutRole.legitimateProfileWithoutRole.length,
          ambiguous: plan.profileWithoutRole.ambiguous,
          certification: plan.profileWithoutRole.certificationOrSystem.length,
        },
        roleWithoutProfile: plan.roleWithoutProfile,
        excluded: plan.excluded,
      }));
      return;
    }

    const repairs = [...plan.serviceRepairs, ...plan.otherRoleRepairs];
    for (const repair of repairs) {
      if (!sellerRoleWriteIsAdditive(repair.before, repair.after)) {
        console.log(JSON.stringify({ ok: false, error: 'non-additive plan', userId: repair.userId }));
        process.exit(2);
      }
    }

    const mutated: string[] = [];
    for (const repair of repairs) {
      const current = await prisma.user.findUnique({
        where: { id: repair.userId },
        select: { sellerRoles: true, role: true },
      });
      if (!current) {
        console.log(JSON.stringify({ ok: false, error: 'user missing at write', userId: repair.userId }));
        process.exit(2);
      }
      if (JSON.stringify(current.sellerRoles ?? []) !== JSON.stringify(repair.before)) {
        console.log(JSON.stringify({ ok: false, error: 'roles changed since plan', userId: repair.userId }));
        process.exit(2);
      }
      if (JSON.stringify(current.sellerRoles ?? []) === JSON.stringify(repair.after)) continue;
      await prisma.user.update({
        where: { id: repair.userId },
        data: { sellerRoles: repair.after },
      });
      mutated.push(repair.userId);
    }

    const profilesCreated: string[] = [];
    for (const profile of plan.profilesToCreate) {
      const existing = await prisma.sellerProfile.findUnique({
        where: { userId: profile.userId },
        select: { id: true },
      });
      if (existing) continue;
      const account = await prisma.user.findUnique({
        where: { id: profile.userId },
        select: { name: true, username: true, sellerRoles: true, role: true },
      });
      if (!account) continue;
      const hasMarketplaceRole = (account.sellerRoles ?? []).some((role) => role !== 'delivery');
      if (!hasMarketplaceRole && account.role !== 'SELLER') continue;
      await prisma.sellerProfile.create({
        data: {
          id: randomUUID(),
          userId: profile.userId,
          displayName: account.name ?? account.username ?? null,
          bio: null,
        },
      });
      profilesCreated.push(profile.userId);
    }

    const [productsAfter, dishesAfter, ordersAfter, escrowsAfter] = await Promise.all([
      prisma.product.count(),
      prisma.dish.count(),
      prisma.order.count(),
      prisma.paymentEscrow.count(),
    ]);

    const verified = await prisma.user.findMany({
      where: { id: { in: repairs.map((repair) => repair.userId) } },
      select: { id: true, role: true, sellerRoles: true },
    });

    console.log(JSON.stringify({
      mode: 'apply',
      mutatedUserIds: mutated,
      profilesCreated,
      verified: verified.map((row) => ({
        userId: row.id,
        userRole: row.role,
        sellerRoles: row.sellerRoles,
      })),
      boundariesBefore: boundaries,
      boundariesAfter: { products: productsAfter, dishes: dishesAfter, orders: ordersAfter, escrows: escrowsAfter },
    }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.name : 'error';
  console.error(JSON.stringify({ ok: false, error: message }));
  process.exit(1);
});
