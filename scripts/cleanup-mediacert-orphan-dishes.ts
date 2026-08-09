/**
 * Delete ONLY MediaCert certification Dish orphans (title prefix MediaCert).
 * Does not touch unrelated user recipes.
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const targets = await prisma.dish.findMany({
    where: { title: { startsWith: 'MediaCert' } },
    select: { id: true, title: true, status: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('FOUND', targets.length);
  for (const row of targets) {
    console.log(`  ${row.id} | ${row.status} | ${row.title}`);
  }

  if (targets.length === 0) {
    console.log('leftover', 0);
    await prisma.$disconnect();
    return;
  }

  const ids = targets.map((t) => t.id);
  const result = await prisma.dish.deleteMany({
    where: { id: { in: ids }, title: { startsWith: 'MediaCert' } },
  });
  console.log('DELETED', result.count);

  const leftover = await prisma.dish.count({
    where: { title: { startsWith: 'MediaCert' } },
  });
  console.log('leftover', leftover);
  await prisma.$disconnect();
  if (leftover !== 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
