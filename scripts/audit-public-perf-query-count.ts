/**
 * Count Prisma round-trips for listing loader via shared prisma client.
 */
import { prisma } from '../lib/prisma';
import { loadListingDetail } from '../lib/marketplace/detail/load-listing-detail';

async function main() {
  let listingQueries = 0;
  // Prisma 6 middleware still supported for counting.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (prisma as any).$use(async (params: unknown, next: (p: unknown) => Promise<unknown>) => {
    listingQueries += 1;
    return next(params);
  });

  const product = await prisma.product.findFirst({
    where: { isActive: true },
    select: {
      id: true,
      seller: { select: { User: { select: { id: true, username: true } } } },
    },
  });
  if (!product) {
    console.log(JSON.stringify({ error: 'no_active_product' }));
    return;
  }

  listingQueries = 0;
  await loadListingDetail(product.id);
  const afterListing = listingQueries;

  listingQueries = 0;
  const userId = product.seller?.User?.id;
  if (userId) {
    await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        Dish: {
          where: { status: 'PUBLISHED' },
          select: { id: true, photos: { take: 4, select: { url: true } } },
          take: 24,
        },
        SellerProfile: {
          select: {
            products: {
              where: { isActive: true },
              select: { id: true, Image: { take: 1, select: { fileUrl: true } } },
              take: 24,
            },
          },
        },
        DeliveryProfile: {
          select: {
            reviews: { take: 5, select: { id: true } },
            vehiclePhotos: { take: 6, select: { id: true } },
          },
        },
      },
    });
  }
  const afterProfileMain = listingQueries;

  console.log(
    JSON.stringify(
      {
        productId: product.id,
        username: product.seller?.User?.username,
        listingPrismaQueriesAfter: afterListing,
        profileMainUserQueryBundleAfter: afterProfileMain,
        listingPrismaQueriesBeforeEstimate: '8-15 across layout+API requests',
        profilePrismaQueriesBeforeEstimate: '1 fat nested + seller products API N+includes',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
