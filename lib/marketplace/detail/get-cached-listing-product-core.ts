/**
 * Request-scoped SSOT product read for public listing routes.
 * Shared by generateMetadata, layout (JSON-LD), and loadListingDetail.
 * Cross-request: short unstable_cache (30s) with tag invalidation on product mutations.
 */

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';

/** Lean include covering SEO + critical listing body + Stripe CTA flags. */
export const listingProductCoreInclude = {
  seller: {
    select: {
      id: true,
      lat: true,
      lng: true,
      kvk: true,
      companyName: true,
      User: {
        select: {
          id: true,
          name: true,
          username: true,
          profileImage: true,
          image: true,
          place: true,
          city: true,
          lat: true,
          lng: true,
          displayFullName: true,
          displayNameOption: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      },
    },
  },
  Image: {
    select: { id: true, fileUrl: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  Video: {
    select: {
      id: true,
      url: true,
      thumbnail: true,
      duration: true,
      createdAt: true,
    },
  },
} as const;

export function listingProductCacheTag(productId: string) {
  return `listing-product:${productId}`;
}

async function fetchListingProductCoreUncached(id: string) {
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

/** Uncached core fetch (scripts / tests). Prefer getCachedListingProductCore in RSC. */
export async function fetchListingProductCore(rawId: string) {
  const id = resolveProductIdFromParam(rawId);
  if (!id) return null;
  return fetchListingProductCoreUncached(id);
}

/**
 * Dedupes within one request (React.cache) and across requests (unstable_cache 30s).
 * Invalidate via `listingProductCacheTag(id)` on product publish/edit/unpublish.
 */
export const getCachedListingProductCore = cache(async (rawId: string) => {
  const id = resolveProductIdFromParam(rawId);
  if (!id) return null;
  return unstable_cache(
    () => fetchListingProductCoreUncached(id),
    ['listing-product-core', id],
    { revalidate: 30, tags: [listingProductCacheTag(id)] },
  )();
});

export type ListingProductCore = NonNullable<
  Awaited<ReturnType<typeof fetchListingProductCore>>
>;
