import { classifyOfferMarketplaceCategories } from '@/lib/marketplace/commercial-capability';
import { prisma } from '@/lib/prisma';

/** Read-only. Active commercial offers for one user, classified by marketplace category. */
export async function loadActiveOfferCapabilities(userId: string): Promise<{
  hasServiceOffer: boolean;
  hasProductOffer: boolean;
}> {
  const rows = await prisma.product.findMany({
    where: {
      isActive: true,
      integrityStatus: 'ACTIVE',
      listingIntent: 'OFFER',
      seller: { userId },
    },
    select: { marketplaceCategory: true, specializations: true },
  });
  return classifyOfferMarketplaceCategories(rows);
}
