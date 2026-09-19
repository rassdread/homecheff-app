/**
 * Read-only referral inventory. Does not mutate rows.
 * Run: npx tsx scripts/audit-referral-attribution-readonly.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function countOrphans(): Promise<number> {
  const [missingUser, missingAffiliate] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "Attribution" a
      LEFT JOIN "User" u ON u.id = a."userId"
      WHERE u.id IS NULL
    `,
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM "Attribution" a
      LEFT JOIN "Affiliate" f ON f.id = a."affiliateId"
      WHERE f.id IS NULL
    `,
  ]);
  return Number(missingUser[0]?.count ?? 0) + Number(missingAffiliate[0]?.count ?? 0);
}

async function main() {
  const [affiliates, affiliatesWithReferrals, referralRelations, referralLinks, orphanReferrals] =
    await Promise.all([
      prisma.affiliate.count(),
      prisma.affiliate.count({ where: { attributions: { some: {} } } }),
      prisma.attribution.count(),
      prisma.referralLink.count(),
      countOrphans(),
    ]);

  console.log(
    JSON.stringify(
      {
        EXISTING_AFFILIATES: affiliates,
        EXISTING_AFFILIATES_WITH_REFERRALS: affiliatesWithReferrals,
        EXISTING_REFERRAL_RELATIONS: referralRelations,
        EXISTING_REFERRAL_LINKS: referralLinks,
        ORPHAN_REFERRALS: orphanReferrals,
        LEGACY_REFERRAL_SYSTEMS: [
          'Affiliate.referralLinks.code',
          'Attribution + hc_ref first-touch cookie',
        ],
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(
      'audit-referral-attribution-readonly failed:',
      err instanceof Error ? err.message : err,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
