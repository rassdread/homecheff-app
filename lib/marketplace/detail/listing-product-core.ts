/**
 * Uncached listing product core fetch (safe in Node scripts + RSC).
 */

import { prisma } from '@/lib/prisma';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import { listingProductCoreInclude } from '@/lib/marketplace/detail/listing-product-core-include';

export async function fetchListingProductCoreUncached(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: listingProductCoreInclude,
  });
  if (product) return product;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
          image: true,
          place: true,
          lat: true,
          lng: true,
          displayFullName: true,
          displayNameOption: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      },
      ListingMedia: {
        select: { id: true, url: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });
  if (!listing) return null;

  return {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    priceCents: listing.priceCents,
    isActive: listing.status === 'ACTIVE',
    category: 'CHEFF',
    subcategory: null,
    marketplaceCategory: null,
    stock: null,
    maxStock: null,
    orderMethod: 'HOMECHEFF_PAYMENT',
    Image: (listing.ListingMedia || []).map(
      (m: { id: string; url: string; sortOrder: number }, i: number) => ({
        id: m.id,
        fileUrl: m.url,
        sortOrder: m.sortOrder ?? i,
      }),
    ),
    Video: [],
    seller: {
      id: null,
      lat: listing.User?.lat ?? null,
      lng: listing.User?.lng ?? null,
      kvk: null,
      companyName: null,
      User: listing.User,
    },
  };
}

export async function fetchListingProductCore(rawId: string) {
  const id = resolveProductIdFromParam(rawId);
  if (!id) return null;
  return fetchListingProductCoreUncached(id);
}

export type ListingProductCore = NonNullable<
  Awaited<ReturnType<typeof fetchListingProductCore>>
>;

export function listingProductCacheTag(productId: string) {
  return `listing-product:${productId}`;
}
