/**
 * Idempotent HCP-beloningen voor alle gebruikers.
 * Usage: npx tsx scripts/backfill-hcp-rewards.ts
 */
import { prisma } from '@/lib/prisma';
import { evaluateHcpRewardsForUser } from '@/lib/gamification/hcp-rewards-engine';

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  let delta = 0;
  for (const u of users) {
    const before = await prisma.userHcpReward.count({ where: { userId: u.id } });
    await evaluateHcpRewardsForUser(u.id);
    const after = await prisma.userHcpReward.count({ where: { userId: u.id } });
    delta += after - before;
  }
  console.log(`Users processed: ${users.length}`);
  console.log(`New UserHcpReward rows (sum of per-user deltas): ${delta}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
