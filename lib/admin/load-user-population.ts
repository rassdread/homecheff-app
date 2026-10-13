import { prisma } from '@/lib/prisma';
import {
  anonymizedUserWhere,
  demonstrableTestUserWhere,
  realUserWhere,
  registrationOrigin,
  type AdminUserPopulationSnapshot,
  type RegistrationOrigin,
} from '@/lib/admin/user-population';

export type { AdminUserPopulationSnapshot };

const META_VISITORS_NOTE =
  'Meta-bezoekers worden niet in de database opgeslagen. De pixel en GA sturen geen bezoekersaantal terug, en cookietoestemming blokkeert analytics zonder toestemming.';

function startOfLocalDay(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function loadAdminUserPopulation(now = new Date()): Promise<AdminUserPopulationSnapshot> {
  const real = realUserWhere();
  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const today = startOfLocalDay(now);

  const [
    totalRegistered,
    totalRealUsers,
    totalVerified,
    totalActive,
    totalSoftDeleted,
    totalTestAccounts,
    newUsersToday,
    newUsers7Days,
    newUsers30Days,
    unverifiedRealUsers,
    attributions,
    realRows,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: real }),
    prisma.user.count({ where: { AND: [real, { emailVerified: { not: null } }] } }),
    prisma.user.count({ where: { AND: [real, { updatedAt: { gte: day7 } }] } }),
    prisma.user.count({ where: anonymizedUserWhere() }),
    prisma.user.count({ where: demonstrableTestUserWhere() }),
    prisma.user.count({ where: { AND: [real, { createdAt: { gte: today } }] } }),
    prisma.user.count({ where: { AND: [real, { createdAt: { gte: day7 } }] } }),
    prisma.user.count({ where: { AND: [real, { createdAt: { gte: day30 } }] } }),
    prisma.user.count({ where: { AND: [real, { emailVerified: null }] } }),
    prisma.attribution.findMany({
      where: { type: { in: ['USER_SIGNUP', 'BUSINESS_SIGNUP'] } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.user.findMany({
      where: real,
      select: {
        id: true,
        emailVerified: true,
        sellerActivatedAt: true,
        acquisitionActivatedAt: true,
        acquisitionFirstTouch: true,
      },
    }),
  ]);

  const affiliateIds = new Set(attributions.map((row) => row.userId));
  const origins: Record<RegistrationOrigin, number> = {
    meta: 0,
    affiliate: 0,
    organic: 0,
    recorded_other: 0,
    unknown: 0,
  };
  let metaVerified = 0;
  let metaActivated = 0;
  let metaFirstListing = 0;

  for (const row of realRows) {
    const origin = registrationOrigin({
      acquisitionFirstTouch: row.acquisitionFirstTouch,
      hasAffiliateAttribution: affiliateIds.has(row.id),
    });
    origins[origin] += 1;
    if (origin !== 'meta') continue;
    if (row.emailVerified) metaVerified += 1;
    if (row.acquisitionActivatedAt || row.sellerActivatedAt) metaActivated += 1;
    if (row.sellerActivatedAt) metaFirstListing += 1;
  }

  return {
    totalRegistered,
    totalRealUsers,
    totalVerified,
    totalActive,
    totalSoftDeleted,
    totalTestAccounts,
    newUsersToday,
    newUsers7Days,
    newUsers30Days,
    unverifiedRealUsers,
    origins,
    meta: {
      visitors: null,
      visitorsNote: META_VISITORS_NOTE,
      registrations: origins.meta,
      verifiedRegistrations: metaVerified,
      activatedUsers: metaActivated,
      firstListing: metaFirstListing,
    },
  };
}
