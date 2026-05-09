/**
 * Idempotent badge-evaluatie voor alle gebruikers (V3 rules).
 * Usage: npx tsx scripts/backfill-badges.ts
 */
import { prisma } from '@/lib/prisma';
import { runBadgeEvaluationForUser } from '@/lib/gamification/unlock-badges';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  let deltaBadges = 0;
  for (const u of users) {
    const before = await prisma.userBadge.count({ where: { userId: u.id } });
    await runBadgeEvaluationForUser(u.id);
    const after = await prisma.userBadge.count({ where: { userId: u.id } });
    deltaBadges += after - before;
  }
  console.log(`Users processed: ${users.length}`);
  console.log(`New UserBadge rows (sum of per-user deltas): ${deltaBadges}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
