/**
 * PHASE 8B — identify the seller behind the live financial fixture. Read-only.
 *   npx tsx --env-file=.env.local docs/audits/seller-financial-year-8b/probe-identity.ts <sellerIdPrefix>
 */
import { prisma } from '../../../lib/prisma';

async function main() {
  const prefix = process.argv[2] ?? '';
  const t = await prisma.transaction.findFirst({
    where: { sellerId: { startsWith: prefix } },
    select: { sellerId: true },
  });
  if (!t?.sellerId) {
    console.log('not found');
    return prisma.$disconnect();
  }
  const u = await prisma.user.findUnique({
    where: { id: t.sellerId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      SellerProfile: { select: { id: true } },
      DeliveryProfile: { select: { id: true } },
    },
  });
  console.log(JSON.stringify(u, null, 2));
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
