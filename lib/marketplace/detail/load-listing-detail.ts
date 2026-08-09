/**
 * Server-first public listing detail loader.
 * Shared by RSC product/request pages and (optionally) the API route.
 * Omits reviews list + analytics view tracking — those stay client/deferred.
 */

import { prisma } from '@/lib/prisma';
import { resolveProductIdFromParam } from '@/lib/seo/productSlug';
import { loadPublicContactChannelsForUser } from '@/lib/profile/load-public-contact-channels';
import { requiresStripeForHomecheffCheckout } from '@/lib/product/order-method';
import { buildPublicPaymentStatus } from '@/lib/stripe/seller-payment-status';
import { fetchAuthorBadgeSummariesByUserIds } from '@/lib/gamification/author-badge-summaries';
import { fetchSellerTrustBundles } from '@/lib/discovery/trust/batch-enrichment';
import { buildDiscoveryTrust } from '@/lib/discovery/trust/build-discovery-trust';
import {
  getInspiratieDetailHref,
  type InspirationCategory,
} from '@/lib/inspiratie/instruction-content';

const productInclude = {
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

export type ListingDetailPayload = {
  product: Record<string, unknown>;
  publicContactChannels: unknown[];
  checkoutAvailable: boolean;
  checkoutBlockedReason: string | null;
  paymentStatus: ReturnType<typeof buildPublicPaymentStatus>;
  sellerBadges: unknown[];
  isBusiness: boolean;
  companyName: string | null;
  isDish: boolean;
  dishCategory: string | null;
  linkedInspiration: {
    href: string;
    category: InspirationCategory;
    status: string;
    isOwner: boolean;
  } | null;
  dish: Record<string, unknown> | null;
  stats: {
    viewCount: number;
    orderCount: number;
    favoriteCount: number;
    averageRating: number;
    reviewCount: number;
  };
  discoveryTrust: ReturnType<typeof buildDiscoveryTrust>;
};

/**
 * Critical public listing payload for RSC first paint.
 * Skips: review rows, view/order/favorite counts (0 until client refresh optional),
 * heavy dish step media (loaded lightly when dish row exists).
 */
export async function loadListingDetail(
  rawId: string,
): Promise<ListingDetailPayload | null> {
  const id = resolveProductIdFromParam(rawId);
  if (!id) return null;

  let product: any = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  if (!product) {
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
          },
        },
        ListingMedia: {
          select: { id: true, url: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!listing) return null;
    // Shape as product-like for the client mapper
    product = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      priceCents: listing.priceCents,
      isActive: listing.status === 'ACTIVE',
      category: 'CHEFF',
      Image: (listing.ListingMedia || []).map((m: { id: string; url: string; sortOrder: number }, i: number) => ({
        id: m.id,
        fileUrl: m.url,
        sortOrder: m.sortOrder ?? i,
      })),
      Video: [],
      seller: {
        id: null,
        lat: listing.User?.lat ?? null,
        lng: listing.User?.lng ?? null,
        kvk: null,
        companyName: null,
        User: listing.User,
      },
      User: listing.User,
    };
  }

  if (!product.isActive && product.status !== 'ACTIVE') {
    // Allow inactive only if we still want notFound at page — treat as missing for public
    // Keep payload; page can decide. Public feed only shows active.
  }

  const sellerUserId: string | undefined =
    product.seller?.User?.id ?? product.User?.id;

  const [reviewAgg, publicContactChannels, sellerBadgesMap, sellerStripe, trustBundles, dishLite] =
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
        ? prisma.user.findUnique({
            where: { id: sellerUserId },
            select: {
              stripeConnectAccountId: true,
              stripeConnectOnboardingCompleted: true,
            },
          })
        : Promise.resolve(null),
      sellerUserId
        ? fetchSellerTrustBundles([sellerUserId])
        : Promise.resolve(new Map()),
      // Light dish probe for linked inspiration / isDish — no step photos
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

  const sortedVideo =
    product.Video && Array.isArray(product.Video) && product.Video.length > 0
      ? [...product.Video].sort((a: { createdAt?: string | Date }, b: { createdAt?: string | Date }) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        })
      : product.Video;

  const sellerBadges = sellerUserId
    ? sellerBadgesMap.get(sellerUserId) ?? []
    : [];
  const isBusiness = Boolean(product.seller?.kvk && product.seller?.companyName);

  const requiresStripeCheckout = requiresStripeForHomecheffCheckout({
    orderMethod: product.orderMethod,
    priceCents: product.priceCents,
  });
  const paymentStatus = buildPublicPaymentStatus({
    requiresStripeCheckout,
    seller: sellerStripe,
  });
  const checkoutAvailable = requiresStripeCheckout
    ? paymentStatus.canCheckout
    : false;

  const reviewStats = {
    averageRating: reviewAgg._avg.rating ?? 0,
    reviewCount: reviewAgg._count._all ?? 0,
  };

  const trustBundle = sellerUserId ? trustBundles.get(sellerUserId) : undefined;
  const discoveryTrust = buildDiscoveryTrust({
    listingProductReviewCount: reviewStats.reviewCount,
    listingIsActive: Boolean(product.isActive ?? true),
    sellerSnapshot: trustBundle?.snapshot,
    trustBadges: trustBundle?.trustBadges,
  });

  let linkedInspiration: ListingDetailPayload['linkedInspiration'] = null;
  if (isDish && dishLite && dishCategory && dishLite.status === 'PUBLISHED') {
    linkedInspiration = {
      href: getInspiratieDetailHref(dishCategory as InspirationCategory, id),
      category: dishCategory as InspirationCategory,
      status: dishLite.status,
      isOwner: false,
    };
  }

  return {
    product: {
      ...product,
      Video: sortedVideo,
    },
    publicContactChannels,
    checkoutAvailable,
    checkoutBlockedReason: paymentStatus.reason ?? null,
    paymentStatus,
    sellerBadges,
    isBusiness,
    companyName: product.seller?.companyName ?? null,
    isDish,
    dishCategory,
    linkedInspiration,
    dish: null, // heavy step media deferred — domain story still works without steps
    stats: {
      viewCount: 0,
      orderCount: 0,
      favoriteCount: 0,
      ...reviewStats,
    },
    discoveryTrust,
  };
}
