/**
 * Deferred public listing enrichment (trust, badges, contacts, dish, review stats).
 * Not on RSC critical path — fetched after first paint.
 */

import { prisma } from '@/lib/prisma';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import { loadPublicContactChannelsForUser } from '@/lib/profile/load-public-contact-channels';
import { fetchAuthorBadgeSummariesByUserIds } from '@/lib/gamification/author-badge-summaries';
import { fetchSellerTrustBundles } from '@/lib/discovery/trust/batch-enrichment';
import { buildDiscoveryTrust } from '@/lib/discovery/trust/build-discovery-trust';
import {
  getInspiratieDetailHref,
  type InspirationCategory,
} from '@/lib/inspiratie/instruction-content';
import { getCachedListingProductCore } from '@/lib/marketplace/detail/get-cached-listing-product-core';

export type ListingDetailExtras = {
  publicContactChannels: unknown[];
  sellerBadges: unknown[];
  discoveryTrust: ReturnType<typeof buildDiscoveryTrust>;
  isDish: boolean;
  dishCategory: string | null;
  linkedInspiration: {
    href: string;
    category: InspirationCategory;
    status: string;
    isOwner: boolean;
  } | null;
  stats: {
    averageRating: number;
    reviewCount: number;
  };
};

export async function loadListingDetailExtras(
  rawId: string,
): Promise<ListingDetailExtras | null> {
  const id = resolveProductIdFromParam(rawId);
  if (!id) return null;

  // Prefer request-scoped core when called from same request; else lean user id lookup.
  const product = await getCachedListingProductCore(id);
  if (!product) return null;

  const sellerUserId: string | undefined = product.seller?.User?.id;

  const [reviewAgg, publicContactChannels, sellerBadgesMap, trustBundles, dishLite] =
    await Promise.all([
      prisma.productReview.aggregate({
        where: {
          productId: id,
          reviewSubmittedAt: { not: null },
          rating: { gt: 0 },
        },
        _count: { _all: true },
        _avg: { rating: true },
      }),
      loadPublicContactChannelsForUser(sellerUserId),
      sellerUserId
        ? fetchAuthorBadgeSummariesByUserIds([sellerUserId], 2)
        : Promise.resolve(new Map()),
      sellerUserId
        ? fetchSellerTrustBundles([sellerUserId])
        : Promise.resolve(new Map()),
      prisma.dish.findUnique({
        where: { id },
        select: {
          id: true,
          category: true,
          status: true,
          ingredients: true,
          instructions: true,
          plantType: true,
          materials: true,
          dimensions: true,
          notes: true,
          _count: { select: { growthPhotos: true } },
        },
      }),
    ]);

  let isDish = false;
  let dishCategory: string | null = null;
  if (dishLite) {
    const isRecipe =
      dishLite.category === 'CHEFF' &&
      (dishLite.ingredients.length > 0 || dishLite.instructions.length > 0);
    const isGarden =
      dishLite.category === 'GROWN' &&
      (dishLite.plantType || (dishLite._count.growthPhotos ?? 0) > 0);
    const isDesign =
      dishLite.category === 'DESIGNER' &&
      ((dishLite.materials && dishLite.materials.length > 0) ||
        dishLite.dimensions ||
        dishLite.notes ||
        (dishLite.instructions && dishLite.instructions.length > 0));
    if (isRecipe || isGarden || isDesign) {
      isDish = true;
      dishCategory = dishLite.category || null;
    }
  }

  const reviewStats = {
    averageRating: reviewAgg._avg.rating ?? 0,
    reviewCount: reviewAgg._count._all ?? 0,
  };

  const sellerBadges = sellerUserId
    ? sellerBadgesMap.get(sellerUserId) ?? []
    : [];
  const trustBundle = sellerUserId ? trustBundles.get(sellerUserId) : undefined;
  const discoveryTrust = buildDiscoveryTrust({
    listingProductReviewCount: reviewStats.reviewCount,
    listingIsActive: Boolean(product.isActive ?? true),
    sellerSnapshot: trustBundle?.snapshot,
    trustBadges: trustBundle?.trustBadges,
  });

  let linkedInspiration: ListingDetailExtras['linkedInspiration'] = null;
  if (isDish && dishLite && dishCategory && dishLite.status === 'PUBLISHED') {
    linkedInspiration = {
      href: getInspiratieDetailHref(dishCategory as InspirationCategory, id),
      category: dishCategory as InspirationCategory,
      status: dishLite.status,
      isOwner: false,
    };
  }

  return {
    publicContactChannels,
    sellerBadges,
    discoveryTrust,
    isDish,
    dishCategory,
    linkedInspiration,
    stats: reviewStats,
  };
}
