import { PrismaClient } from '@prisma/client';
import { agreementAcceptanceRow } from '@/lib/delivery/delivery-agreement-version';

async function main() {
  const prisma = new PrismaClient();
  const profileId = 'cmvx1tvty00012jmna2p373cu';
  const userId = '33333333-3333-4333-8333-333333333333';
  const row = agreementAcceptanceRow({
    deliveryProfileId: profileId,
    userId,
    language: 'nl',
  });
  await prisma.deliveryAgreementAcceptance.create({ data: row });
  await prisma.deliveryProfile.update({
    where: { id: profileId },
    data: {
      deliveryAgreementAcceptedAt: row.acceptedAt,
      deliveryAgreementDocumentId: row.documentId,
      stripeIdentityState: 'VERIFIED',
      stripeIdentityCheckedAt: new Date(),
      isOnline: true,
      temporaryOffline: false,
      onlineUntil: new Date(Date.now() + 6 * 60 * 60 * 1000),
      lastOnlineAt: new Date(),
    },
  });
  console.log('agreement accepted', row.version, row.contentHash.slice(0, 12));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
