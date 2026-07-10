import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { ListingCategory, ProductCategory } from "@prisma/client";
import { getCorsHeaders } from "@/lib/apiCors";
import { batchComputeUserStatsPreview } from "@/lib/userStatsBatchPreview";
import { isStripeTestId } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAuthorBadgeSummariesByUserIds } from "@/lib/gamification/author-badge-summaries";
import { isContactOnlyProduct } from "@/lib/product/order-method";
import {
  FEED_RADIUS_DEFAULT_KM,
  FEED_RADIUS_MODE_LOCAL_FIRST,
  normalizeFeedRadiusKm,
  sortFeedItemsLocalFirst,
} from "@/lib/geo/local-discovery";
import {
  resolveDishCoords,
  resolveDishPlaceLabel,
  resolveFeedItemCoordsFromRaw,
  resolveListingCoords,
  resolveListingPlaceLabel,
  resolveProductCoords,
  resolveProductPlaceLabel,
} from "@/lib/geo/item-location";
import { deriveFeedTaxonomy } from "@/lib/feed/feed-taxonomy";
import { attachListingKindToRecord } from "@/lib/marketplace/listing-kind/feed-attach";
import {
  buildDishTextSearchWhere,
  buildListingTextSearchWhere,
  buildProductTextSearchWhere,
  matchesSearchItem,
  parseSearchFilterParams,
} from "@/lib/search";
import { attachSearchClassificationToRecord } from "@/lib/search/classify-result";
import { attachDiscoveryReadModel } from "@/lib/discovery";
import { legacyFeedSettlementBooleans } from "@/lib/marketplace/tiles/legacy-feed-settlement";
import {
  discoveryEnrichmentFromBundle,
  fetchSellerTrustBundles,
} from "@/lib/discovery/trust/batch-enrichment";
import type { DiscoveryEnrichment } from "@/lib/discovery/mappers/enrichment";
import {
  isMarketplaceSaleItem,
  marketplaceSaleAuditSample,
} from "@/lib/feed/marketplace-sale";
import { normalizeFeedScope, scopeUsesRadiusFilter } from "@/lib/feed/feed-scope";
import { geocodePlaceQuery } from "@/lib/global-geocoding";
import {
  buildDiscoveryFeed,
  FEED_DISCOVERY_POOL_CAP,
  reorderFeedItemsByDiscovery,
} from "@/lib/feed/build-discovery-feed";
import type { DiscoveryFeedPayload } from "@/lib/feed/discovery-feed-contract";
import {
  buildActivityCardsFeedSlot,
} from "@/lib/discovery/activity-cards/build-activity-cards-feed-slot";
import { resolveActivityCardContracts } from "@/lib/discovery/activity-cards/resolve-activity-card-contracts";
import {
  countNearbyRequestsInPool,
  fetchActivityCardEligibilityInput,
} from "@/lib/discovery/activity-cards/fetch-activity-card-eligibility";
import { buildSurfacesFeedSlot } from "@/lib/discovery/surfaces/build-surfaces-feed-slot";
import {
  buildServerSurfaceContext,
  countNearbyWorkshopsInPool,
  countNewMakersInPool,
  countActiveNeighboursInPool,
  countUpcomingWorkshopsInPool,
} from "@/lib/discovery/surfaces/build-server-surface-context";
import {
  createFeedApiTiming,
  isFeedApiTimingEnabled,
} from "@/lib/feed/feed-api-timing";
import {
  buildFeedPaginationMeta,
  parseFeedPaginationParams,
} from "@/lib/feed/feed-pagination";
import {
  countInlineDataMediaUrls,
  sanitizeFeedItemsForResponse,
} from "@/lib/feed/sanitize-feed-response-media";

function attachFeedItemTaxonomy(item: Record<string, unknown>): void {
  const listingKind = attachListingKindToRecord(item);
  attachSearchClassificationToRecord(item);
  item.taxonomy = deriveFeedTaxonomy({
    priceCents: item.priceCents as number | null | undefined,
    orderMethod: item.orderMethod as string | null | undefined,
    category: item.category as string | null | undefined,
    type: item.type as string | null | undefined,
    isRecipe: item.isRecipe as boolean | null | undefined,
    isInspiration: item.isInspiration as boolean | null | undefined,
    listingIntent: item.listingIntent as string | null | undefined,
    priceModel: item.priceModel as string | null | undefined,
    feedSource: item.feedSource as string | null | undefined,
    marketplaceCategory: item.marketplaceCategory as string | null | undefined,
    specializations: item.specializations as string[] | null | undefined,
    subcategory: item.subcategory as string | null | undefined,
    listingKind,
  });
}

function attachFeedItemDiscovery(
  item: Record<string, unknown>,
  enrichment?: DiscoveryEnrichment,
): void {
  attachFeedItemTaxonomy(item);
  attachDiscoveryReadModel(item, enrichment);
}

function toNumber(v: string | null, fallback: number) {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

/** Zelfde seller-user-id als GeoFeed `normalizeFeedItem` (owner → User → seller). */
function extractFeedItemSellerUserId(item: Record<string, unknown>): string | null {
  const ownerRaw = item.ownerId;
  if (ownerRaw != null && String(ownerRaw).trim() !== "") {
    return String(ownerRaw).trim();
  }
  const user = item.User as { id?: string } | undefined;
  if (user?.id) return String(user.id);
  const seller = item.seller as { id?: string } | undefined;
  if (seller?.id) return String(seller.id);
  return null;
}

function extractItemLatLng(item: Record<string, unknown>): { lat: number; lng: number } | null {
  return resolveFeedItemCoordsFromRaw(item);
}

const STATS_PREVIEW_SELLER_CAP = 9;
const FEED_RESPONSE_ITEM_CAP = 40;

/** Maps feed UI slugs (cheff, garden, …) to Prisma `ProductCategory` (GROWN, not GARDEN). */
function resolveProductCategory(verticalRaw: string): ProductCategory | null {
  const v = verticalRaw.trim().toLowerCase();
  if (!v || v === "all") return null;
  if (v === "cheff" || v === "chef" || v === "keuken") return ProductCategory.CHEFF;
  if (v === "grown" || v === "garden" || v === "tuin") return ProductCategory.GROWN;
  if (v === "designer" || v === "design" || v === "studio") return ProductCategory.DESIGNER;
  const u = verticalRaw.trim().toUpperCase();
  if (u === "CHEFF" || u === "GROWN" || u === "DESIGNER") return u as ProductCategory;
  return null;
}

/** Legacy listings use `ListingCategory`, not product enums. */
function resolveListingCategory(verticalRaw: string): ListingCategory | null {
  const v = verticalRaw.trim().toLowerCase();
  if (!v || v === "all") return null;
  if (v === "cheff" || v === "chef" || v === "keuken") return ListingCategory.HOMECHEFF;
  if (v === "grown" || v === "garden" || v === "tuin") return ListingCategory.HOMEGROWN;
  if (v === "designer" || v === "design" || v === "studio") return ListingCategory.OTHER;
  return null;
}

export async function GET(req: NextRequest) {
  const apiPerf = isFeedApiTimingEnabled() ? createFeedApiTiming() : null;
  const { searchParams } = new URL(req.url);
  const searchFilters = parseSearchFilterParams(searchParams);
  const q = searchParams.get("q") || "";
  const vertical = (searchParams.get("vertical") || "all").toLowerCase();
  const productCategory = resolveProductCategory(vertical);
  const listingCategory = resolveListingCategory(vertical);
  const subfilters = (searchParams.get("subfilters") || "").split(",").map(s => s.trim()).filter(Boolean);
  let radius = toNumber(searchParams.get("radius"), FEED_RADIUS_DEFAULT_KM);
  const placeParam = searchParams.get("place")?.trim() || "";
  const feedScope = normalizeFeedScope(searchParams.get("scope"));
  const place = scopeUsesRadiusFilter(feedScope) ? placeParam : "";
  if (!scopeUsesRadiusFilter(feedScope)) {
    radius = 0;
  }
  const { take: feedTake, skip: feedSkip, isFirstPage } =
    parseFeedPaginationParams(
      searchParams.get("take"),
      searchParams.get("skip"),
    );
  apiPerf?.mark('params_parsed');

  const session = await getServerSession(authOptions as any);
  apiPerf?.mark('session_resolved');
  const userId = (session as any)?.user?.id || null;
  const isPublicDefaultFeed =
    !userId &&
    !q &&
    !placeParam &&
    vertical === 'all' &&
    !searchParams.get('lat') &&
    !searchParams.get('lng') &&
    !searchParams.get('subfilters');

  let lat = searchParams.get("lat");
  let lng = searchParams.get("lng");

  // Viewer priority: place text (nearby filter or national distance labels) → profile User
  if (placeParam && (!lat || !lng)) {
    try {
      const geocodeResult = await geocodePlaceQuery(placeParam, "NL");
      if (
        geocodeResult.lat &&
        geocodeResult.lng &&
        !geocodeResult.error
      ) {
        lat = String(geocodeResult.lat);
        lng = String(geocodeResult.lng);
      }
    } catch (error) {
      console.warn("[feed] place geocode failed:", error);
    }
  } else if ((!lat || !lng) && userId) {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { lat: true, lng: true } });
    if (u?.lat != null && u?.lng != null) {
      lat = String(u.lat);
      lng = String(u.lng);
    }
  }

  const viewerGeo =
    lat &&
    lng &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
      ? { lat: Number(lat), lng: Number(lng) }
      : null;
  apiPerf?.mark('viewer_geo_resolved');

  const effectiveRadius = normalizeFeedRadiusKm(radius);

  // Get Products from both new and old models
  const [rawProductsFromDb, oldListings, publishedDishes] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { isActive: true },
          // Include inactive products that have orders (products with sales history should remain visible)
          {
            isActive: false,
            orderItems: {
              some: {
                Order: {
                  stripeSessionId: { not: null }
                }
              }
            }
          }
        ],
        ...(q ? buildProductTextSearchWhere(q) : {}),
        ...(searchFilters.listingIntent === 'REQUEST'
          ? { listingIntent: 'REQUEST' as const }
          : searchFilters.listingIntent === 'OFFER'
            ? { OR: [{ listingIntent: 'OFFER' as const }, { listingIntent: null }] }
            : {}),
        ...(productCategory ? {
          category: productCategory as any
        } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        priceCents: true,
        orderMethod: true,
        acceptHomeCheffPayment: true,
        acceptDirectContact: true,
        listingIntent: true,
        priceModel: true,
        delivery: true,
        category: true,
        marketplaceCategory: true,
        specializations: true,
        acceptedSpecializations: true,
        subcategory: true,
        barterOpenness: true,
        createdAt: true,
        pickupAddress: true,
        pickupLat: true,
        pickupLng: true,
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
                displayFullName: true, 
                displayNameOption: true,
                stripeConnectAccountId: true,
                stripeConnectOnboardingCompleted: true,
                lat: true,
                lng: true,
                place: true,
                city: true,
              } 
            }
          }
        },
        Image: { 
          select: { fileUrl: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' }
        },
        Video: {
          select: { url: true, thumbnail: true },
        },
      }
    }),
    prisma.listing.findMany({
      where: {
        isPublic: true,
        ...(q ? buildListingTextSearchWhere(q) : {}),
        ...(listingCategory ? {
          category: listingCategory
        } : {}),
        ...(lat && lng && effectiveRadius > 0 ? {
          lat: { gte: Number(lat) - (effectiveRadius / 111.32), lte: Number(lat) + (effectiveRadius / 111.32) },
          lng: { gte: Number(lng) - (effectiveRadius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))), lte: Number(lng) + (effectiveRadius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))) }
        } : {})
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true,
            place: true,
            city: true,
            lat: true,
            lng: true,
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
          },
        },
        ListingMedia: { 
          select: { url: true, order: true },
          orderBy: { order: 'asc' }
        }
      }
    }),
    // Haal gepubliceerde dishes op
    prisma.dish.findMany({
      where: {
        status: "PUBLISHED",
        ...(q ? buildDishTextSearchWhere(q) : {}),
        ...(lat && lng && effectiveRadius > 0 ? {
          lat: { gte: Number(lat) - (effectiveRadius / 111.32), lte: Number(lat) + (effectiveRadius / 111.32) },
          lng: { gte: Number(lng) - (effectiveRadius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))), lte: Number(lng) + (effectiveRadius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))) }
        } : {}),
        ...(productCategory ? { category: productCategory } : {}),
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            profileImage: true,
            displayFullName: true,
            displayNameOption: true,
            place: true,
            city: true,
            lat: true,
            lng: true,
            stripeConnectAccountId: true,
            stripeConnectOnboardingCompleted: true,
          },
        },
        photos: { 
          select: { url: true, idx: true },
          orderBy: { idx: 'asc' }
        },
        videos: {
          select: { url: true, thumbnail: true },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
        },
      }
    })
  ]);

  apiPerf?.mark('db_parallel_done');
  apiPerf?.setCounts({
    productsDb: rawProductsFromDb.length,
    listingsDb: oldListings.length,
    dishesDb: publishedDishes.length,
    prismaQueryBatches: 1,
  });

  const activeProductsFromDb = rawProductsFromDb.length;
  const productsWithPrice = rawProductsFromDb.filter(
    (p) => (p.priceCents ?? 0) > 0
  ).length;

  const allNewProducts = rawProductsFromDb.filter((product) => {
    if (isContactOnlyProduct(product)) return true;
    if (!product.priceCents || product.priceCents === 0) return true;
    const seller = product.seller?.User;
    if (!seller?.stripeConnectAccountId) return true;
    return !isStripeTestId(seller.stripeConnectAccountId);
  });

  // Transform dishes to match new product format
  const transformedDishes = publishedDishes.map((dish) => {
    const dishCoords = resolveDishCoords({
      lat: dish.lat,
      lng: dish.lng,
      user: dish.user,
    });
    const dishPlace = resolveDishPlaceLabel({
      place: dish.place,
      user: dish.user,
    });
    const dishPriceCents = dish.priceCents || 0;
    const dishStripeReady = !!(
      dish.user?.stripeConnectAccountId &&
      dish.user?.stripeConnectOnboardingCompleted
    );
    const dishSettlement = legacyFeedSettlementBooleans(dishPriceCents, dishStripeReady);
    return {
    id: dish.id,
    feedSource: 'DISH' as const,
    type: 'dish' as const,
    title: dish.title || "",
    description: dish.description || "",
    priceCents: dishPriceCents,
    orderMethod: 'HOMECHEFF_PAYMENT',
    acceptHomeCheffPayment: dishSettlement.acceptHomeCheffPayment,
    acceptDirectContact: dishSettlement.acceptDirectContact,
    sellerStripeConnectReady: dishStripeReady,
    listingIntent: 'OFFER' as const,
    priceModel: 'FIXED' as const,
    delivery: dish.deliveryMode || "PICKUP",
    category: dish.category || "CHEFF",
    createdAt: dish.createdAt,
    place: dishPlace,
    lat: dishCoords?.lat ?? null,
    lng: dishCoords?.lng ?? null,
    User: {
      id: dish.user.id,
      name: dish.user.name,
      username: dish.user.username,
      profileImage: dish.user.profileImage,
      displayFullName: dish.user.displayFullName,
      displayNameOption: dish.user.displayNameOption
    },
    images: dish.photos.map(photo => photo.url),
    image: dish.photos[0]?.url || null,
    videos:
      dish.videos?.length > 0
        ? dish.videos.map((v) => ({
            url: v.url,
            thumbnail: v.thumbnail ?? null,
          }))
        : [],
    videoUrl: dish.videos?.[0]?.url ?? null,
    location: {
      place: dishPlace,
      lat: dishCoords?.lat ?? null,
      lng: dishCoords?.lng ?? null
    },
    stock: dish.stock || 0,
    maxStock: dish.maxStock,
    seller: {
      id: dish.user.id,
      name: dish.user.name,
      username: dish.user.username,
      avatar: dish.user.profileImage,
      displayFullName: dish.user.displayFullName,
      displayNameOption: dish.user.displayNameOption
    }
  };
  });

  // Transform old listings to match new product format
  const transformedListings = oldListings.map((listing) => {
    const listingCoords = resolveListingCoords(listing);
    const listingPlace = resolveListingPlaceLabel(listing);
    const listingPriceCents = listing.priceCents || 0;
    const listingStripeReady = !!(
      listing.User?.stripeConnectAccountId &&
      listing.User?.stripeConnectOnboardingCompleted
    );
    const listingSettlement = legacyFeedSettlementBooleans(
      listingPriceCents,
      listingStripeReady,
    );
    return {
    id: listing.id,
    feedSource: 'LISTING' as const,
    title: listing.title || "",
    description: listing.description || "",
    priceCents: listingPriceCents,
    orderMethod: 'HOMECHEFF_PAYMENT',
    acceptHomeCheffPayment: listingSettlement.acceptHomeCheffPayment,
    acceptDirectContact: listingSettlement.acceptDirectContact,
    sellerStripeConnectReady: listingStripeReady,
    listingIntent: 'OFFER' as const,
    priceModel: 'FIXED' as const,
        category: (listing as any).vertical || "HOMECHEFF",
    status: "ACTIVE" as const,
    place: listingPlace,
    lat: listingCoords?.lat ?? null,
    lng: listingCoords?.lng ?? null,
    isPublic: true,
    viewCount: 0,
    createdAt: listing.createdAt,
    updatedAt: listing.createdAt,
    User: listing.User,
    image: listing.ListingMedia?.[0]?.url || null, // Add main image field
    images: listing.ListingMedia?.map(media => media.url) || [], // All images for slider
    ListingMedia: listing.ListingMedia.map(media => ({
      url: media.url,
      order: media.order,
      isMain: media.order === 0
    })),
    seller: listing.User ? {
      id: listing.User.id || undefined,
      name: listing.User.name || undefined,
      username: listing.User.username || undefined,
      avatar: listing.User.profileImage || undefined,
      displayFullName: listing.User.displayFullName || undefined,
      displayNameOption: listing.User.displayNameOption || undefined
    } : undefined
  };
  });

  // Transform new products to match listing format
  const transformedProducts = allNewProducts.map((product) => {
    const productCoords = resolveProductCoords(product);
    const productPlace = resolveProductPlaceLabel(product);
    return {
    id: product.id,
    feedSource: 'PRODUCT' as const,
    ownerId: product.seller?.User?.id || "",
    title: product.title || "",
    description: product.description || "",
    priceCents: product.priceCents || 0,
    orderMethod: product.orderMethod ?? 'HOMECHEFF_PAYMENT',
    acceptHomeCheffPayment: product.acceptHomeCheffPayment ?? null,
    acceptDirectContact: product.acceptDirectContact ?? null,
    sellerStripeConnectReady: !!(
      product.seller?.User?.stripeConnectAccountId &&
      product.seller?.User?.stripeConnectOnboardingCompleted
    ),
    listingIntent: product.listingIntent ?? 'OFFER',
    priceModel: product.priceModel ?? 'FIXED',
    category: product.category || "HOMECHEFF",
    marketplaceCategory: product.marketplaceCategory ?? null,
    specializations: product.specializations ?? [],
    subcategory: product.subcategory ?? null,
    barterOpenness: product.barterOpenness ?? null,
    acceptedSpecializations: product.acceptedSpecializations ?? [],
    status: "ACTIVE" as const,
    place: productPlace,
    lat: productCoords?.lat ?? null,
    lng: productCoords?.lng ?? null,
    pickupLat: product.pickupLat ?? null,
    pickupLng: product.pickupLng ?? null,
    isPublic: true,
    viewCount: 0,
    createdAt: product.createdAt,
    updatedAt: product.createdAt,
    User: product.seller?.User || null,
    image: product.Image?.[0]?.fileUrl || null, // Add main image field
    images: product.Image?.map(img => img.fileUrl) || [], // All images for slider
    ListingMedia: product.Image.map(img => ({
      url: img.fileUrl,
      order: img.sortOrder,
      isMain: img.sortOrder === 0
    })),
    seller: product.seller ? {
      id: product.seller.User?.id || undefined,
      name: product.seller.User?.name || undefined,
      username: product.seller.User?.username || undefined,
      avatar: product.seller.User?.profileImage || undefined,
      displayFullName: product.seller.User?.displayFullName || undefined,
      displayNameOption: product.seller.User?.displayNameOption || undefined,
      lat: product.seller.lat ?? null,
      lng: product.seller.lng ?? null,
      User: product.seller.User
        ? {
            lat: product.seller.User.lat ?? null,
            lng: product.seller.User.lng ?? null,
          }
        : undefined,
      isBusiness: !!(product.seller.kvk && product.seller.companyName),
      companyName: product.seller.companyName || null,
      kvk: product.seller.kvk || null
    } : undefined,
    isBusiness: !!(product.seller?.kvk && product.seller?.companyName),
    // Voor GeoFeed / pickPrimaryVideoUrl (ProductVideo 1:1)
    Video: product.Video
      ? { url: product.Video.url, thumbnail: product.Video.thumbnail ?? null }
      : undefined,
    videoUrl: product.Video?.url ?? null,
    primaryVideoUrl: product.Video?.url ?? null,
  };
  });

  // Combine all items
  const allItems = [...transformedProducts, ...transformedListings, ...transformedDishes];
  apiPerf?.mark('transform_done');

  /** Binnen ~7 dagen licht voorrang voor makers die je volgt (tie-break, geen harde filter). */
  let followedSellerUserIds = new Set<string>();
  if (userId) {
    try {
      const followRows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { sellerId: true },
        take: 400,
      });
      followedSellerUserIds = new Set(followRows.map((r) => r.sellerId));
    } catch {
      followedSellerUserIds = new Set();
    }
  }

  const sortedPool = sortFeedItemsLocalFirst(allItems as Record<string, unknown>[], {
    viewerGeo,
    radiusKm: effectiveRadius,
    radiusMode: FEED_RADIUS_MODE_LOCAL_FIRST,
    followedSellerUserIds,
    extractSellerUserId: (item) => extractFeedItemSellerUserId(item),
    extractCoords: (item) => extractItemLatLng(item),
  });

  const marketplacePool = sortedPool
    .filter((item) => isMarketplaceSaleItem(item as Record<string, unknown>))
    .slice(0, FEED_DISCOVERY_POOL_CAP) as typeof allItems;

  const nonMarketplaceTail = sortedPool.filter(
    (item) => !isMarketplaceSaleItem(item as Record<string, unknown>),
  );

  const enrichTargets = marketplacePool as typeof allItems;

  // Get view counts, review counts, and average ratings for discovery pool
  const allItemIds = enrichTargets.map(item => item.id);
  if (allItemIds.length > 0) {
    const [viewCounts, reviewCounts, avgRatings, favoriteCounts] = await Promise.all([
      // View counts from analytics
      prisma.analyticsEvent.groupBy({
        by: ['entityId'],
        where: {
          entityId: { in: allItemIds },
          eventType: { in: ['PRODUCT_VIEW', 'VIEW'] },
          entityType: { in: ['PRODUCT', 'DISH'] }
        },
        _count: {
          entityId: true
        }
      }).catch(() => []),
      // Review counts
      prisma.productReview.groupBy({
        by: ['productId'],
        where: {
          productId: { in: allItemIds }
        },
        _count: {
          productId: true
        }
      }).catch(() => []),
      // Average ratings
      prisma.productReview.groupBy({
        by: ['productId'],
        where: {
          productId: { in: allItemIds }
        },
        _avg: {
          rating: true
        }
      }).catch(() => []),
      prisma.favorite
        .groupBy({
          by: ['productId'],
          where: { productId: { in: allItemIds } },
          _count: { productId: true },
        })
        .catch(() => [] as { productId: string | null; _count: { productId: number } }[]),
    ]);

    // Create maps
    const viewCountMap = new Map<string, number>();
    (viewCounts as Array<{ entityId: string; _count: { entityId: number } }>).forEach(item => {
      viewCountMap.set(item.entityId, item._count.entityId);
    });

    const reviewCountMap = new Map<string, number>();
    (reviewCounts as Array<{ productId: string; _count: { productId: number } }>).forEach(item => {
      reviewCountMap.set(item.productId, item._count.productId);
    });

    const avgRatingMap = new Map<string, number>();
    (avgRatings as Array<{ productId: string; _avg: { rating: number | null } }>).forEach(item => {
      if (item._avg.rating) {
        avgRatingMap.set(item.productId, Math.round(item._avg.rating * 10) / 10);
      }
    });

    const favoriteCountMap = new Map<string, number>();
    (favoriteCounts as Array<{ productId: string | null; _count: { productId: number } }>).forEach(
      (row) => {
        if (row.productId) favoriteCountMap.set(row.productId, row._count.productId);
      }
    );

    // Add stats to marketplace pool items
    enrichTargets.forEach(item => {
      (item as any).viewCount = viewCountMap.get(item.id) || 0;
      (item as any).reviewCount = reviewCountMap.get(item.id) || 0;
      (item as any).averageRating = avgRatingMap.get(item.id) || 0;
      (item as any).favoriteCount = favoriteCountMap.get(item.id) || 0;
    });
  }
  apiPerf?.mark('stats_enrichment_done');
  
  const sellerIdsForBadges: string[] = [];
  const seenBadges = new Set<string>();
  for (const item of enrichTargets) {
    const uid = extractFeedItemSellerUserId(item as Record<string, unknown>);
    if (!uid || seenBadges.has(uid)) continue;
    seenBadges.add(uid);
    sellerIdsForBadges.push(uid);
  }
  const badgeMap =
    sellerIdsForBadges.length > 0
      ? await fetchAuthorBadgeSummariesByUserIds(sellerIdsForBadges, 2)
      : new Map<string, { key: string; name: string; icon: string }[]>();
  let trustBundles: Awaited<ReturnType<typeof fetchSellerTrustBundles>> =
    new Map();
  if (sellerIdsForBadges.length > 0) {
    try {
      trustBundles = await fetchSellerTrustBundles(
        sellerIdsForBadges,
        badgeMap,
      );
    } catch (e) {
      console.error("[feed] trust enrichment:", e);
    }
  }
  for (const item of enrichTargets) {
    const uid = extractFeedItemSellerUserId(item as Record<string, unknown>);
    if (!uid) continue;
    const chips = badgeMap.get(uid);
    if (chips?.length) (item as Record<string, unknown>).sellerBadges = chips;
  }
  apiPerf?.mark('trust_business_dna_done');
  apiPerf?.setCounts({
    sellerTrustLookups: sellerIdsForBadges.length,
    discoveryPool: enrichTargets.length,
    prismaQueryBatches: 3,
  });

  let statsPreview:
    | Awaited<ReturnType<typeof batchComputeUserStatsPreview>>
    | undefined;
  try {
    const previewIds: string[] = [];
    const seen = new Set<string>();
    for (const item of enrichTargets) {
      const uid = extractFeedItemSellerUserId(item as Record<string, unknown>);
      if (!uid || seen.has(uid)) continue;
      seen.add(uid);
      previewIds.push(uid);
      if (previewIds.length >= STATS_PREVIEW_SELLER_CAP) break;
    }
    if (previewIds.length > 0) {
      const computed = await batchComputeUserStatsPreview(previewIds);
      if (Object.keys(computed).length > 0) {
        statsPreview = computed;
      }
    }
  } catch (e) {
    console.error("[feed] statsPreview:", e);
  }

  for (const item of enrichTargets) {
    const uid = extractFeedItemSellerUserId(item as Record<string, unknown>);
    const bundle = uid ? trustBundles.get(uid) : undefined;
    attachFeedItemDiscovery(
      item as Record<string, unknown>,
      discoveryEnrichmentFromBundle(bundle, {
        productReviewCount: Number((item as { reviewCount?: number }).reviewCount) || 0,
        listingIsActive: (item as { isActive?: boolean }).isActive !== false,
      }),
    );
  }

  let discoveryFeed: DiscoveryFeedPayload | null = null;
  if (isFirstPage) {
    try {
      discoveryFeed = buildDiscoveryFeed({
        items: enrichTargets as Record<string, unknown>[],
        viewer: viewerGeo
          ? { radiusKm: effectiveRadius > 0 ? effectiveRadius : undefined }
          : undefined,
        radiusKm: effectiveRadius,
        extractSellerUserId: (item) => extractFeedItemSellerUserId(item),
      });
    } catch (e) {
      console.error("[feed] discovery sections:", e);
    }

    if (discoveryFeed && userId) {
      try {
        const eligibility = await fetchActivityCardEligibilityInput({
          userId,
          nearbyRequestCount: countNearbyRequestsInPool(
            enrichTargets as Array<{
              discovery?: { listingKind?: string; listingIntent?: string } | null;
            }>,
          ),
        });
        const activityContracts = resolveActivityCardContracts({
          input: eligibility,
          limit: 8,
        });
        const activitySlot = buildActivityCardsFeedSlot({
          eligibility,
          enabled: true,
        });
        const userMeta = await prisma.user.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        });
        const poolItems = enrichTargets as Array<{
          userId?: string;
          discovery?: {
            listingKind?: string;
            listingIntent?: string;
            trust?: { sellerTier?: number };
            availabilityDate?: string | null;
          } | null;
        }>;
        const surfacesSlot = buildSurfacesFeedSlot({
          enabled: true,
          activityContracts,
          context: buildServerSurfaceContext({
            eligibility,
            accountCreatedAt: userMeta?.createdAt ?? null,
            nearbyWorkshopCount: countNearbyWorkshopsInPool(poolItems),
            upcomingWorkshopCount: countUpcomingWorkshopsInPool(poolItems),
            newMakersNearbyCount: countNewMakersInPool(poolItems),
            activeNeighboursCount: countActiveNeighboursInPool(poolItems),
            completedDealCount: eligibility.completedDealWithoutReview ? 1 : 0,
          }),
        });
        discoveryFeed = {
          ...discoveryFeed,
          futureSlots: [
            activitySlot,
            surfacesSlot,
            ...discoveryFeed.futureSlots.filter(
              (s) => s.kind !== "activity_cards" && s.kind !== "surfaces",
            ),
          ],
        };
      } catch (e) {
        console.error("[feed] activity cards:", e);
      }
    }
  }
  apiPerf?.mark('discovery_done');

  let orderedMarketplace = enrichTargets as typeof allItems;
  if (discoveryFeed?.orderedListingIds.length) {
    orderedMarketplace = reorderFeedItemsByDiscovery(
      enrichTargets as Array<{ id: string }>,
      discoveryFeed.orderedListingIds,
    ) as typeof allItems;
  }

  const marketplaceCap = Math.max(
    0,
    FEED_RESPONSE_ITEM_CAP - Math.min(nonMarketplaceTail.length, 10),
  );
  const responseMarketplace = orderedMarketplace.slice(0, marketplaceCap);
  const responseNonMarketplace = nonMarketplaceTail.slice(
    0,
    FEED_RESPONSE_ITEM_CAP - responseMarketplace.length,
  );
  let responseItems = [
    ...responseMarketplace,
    ...responseNonMarketplace,
  ] as typeof allItems;

  const listingKindFilter = Array.isArray(searchFilters.listingKind)
    ? searchFilters.listingKind
    : searchFilters.listingKind
      ? [searchFilters.listingKind]
      : [];
  if (listingKindFilter.length > 0) {
    responseItems = responseItems.filter((item) =>
      matchesSearchItem(item as Record<string, unknown>, {
        ...searchFilters,
        listingKind: listingKindFilter,
        q: null,
      }),
    );
  }
  apiPerf?.mark('response_mapped');

  const feedTotal = responseItems.length;
  const pagination = buildFeedPaginationMeta(feedTake, feedSkip, feedTotal);
  const pageItems = sanitizeFeedItemsForResponse(
    responseItems.slice(feedSkip, feedSkip + feedTake) as Record<string, unknown>[],
  );
  const inlineDataRemaining = countInlineDataMediaUrls(pageItems);
  if (inlineDataRemaining > 0) {
    console.warn(
      `[feed] ${inlineDataRemaining} inline data URLs after sanitize`,
    );
  }
  apiPerf?.setCounts({ responseItems: pageItems.length });

  const feedDebug =
    process.env.NODE_ENV === "development" || process.env.FEED_PERF_TIMING === "1"
      ? (() => {
          const saleInResponse = responseItems.filter((item) =>
            isMarketplaceSaleItem(item as Record<string, unknown>)
          );
          return {
            scope: feedScope,
            searchFilters,
            activeProductsFromDb,
            productsWithPrice,
            productsAfterStripeFilter: allNewProducts.length,
            transformedProducts: transformedProducts.length,
            transformedListings: transformedListings.length,
            transformedDishes: transformedDishes.length,
            combinedBeforeSort: allItems.length,
            finalFeedItems: pageItems.length,
            feedTotal,
            feedTake,
            feedSkip,
            inlineDataRemaining,
            saleItemsInResponse: saleInResponse.length,
            saleSample: marketplaceSaleAuditSample(
              responseItems as Record<string, unknown>[]
            ),
            discoveryPool: enrichTargets.length,
            discoverySections: discoveryFeed?.sections.map((s) => ({
              id: s.sectionId,
              count: s.listingIds.length,
            })),
            discoveryMetrics: discoveryFeed?.metrics,
          };
        })()
      : undefined;

  const cors = getCorsHeaders(req);
  const headers: Record<string, string> = {
    ...cors,
    ...(isPublicDefaultFeed
      ? { 'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=90' }
      : {}),
  };
  const serverTiming = apiPerf?.toServerTimingHeader();
  if (serverTiming) {
    headers['Server-Timing'] = serverTiming;
  }

  const body = {
    filters: {
      q,
      vertical,
      subfilters,
      scope: feedScope,
      radius: effectiveRadius,
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
      listingKind: listingKindFilter.length ? listingKindFilter : null,
      listingIntent: searchFilters.listingIntent ?? null,
    },
    count: pageItems.length,
    items: pageItems,
    pagination,
    ...(isFirstPage && discoveryFeed ? { discovery: discoveryFeed } : {}),
    ...(feedDebug ? { debug: feedDebug } : {}),
    ...(isFirstPage && statsPreview ? { statsPreview } : {}),
  };

  if (apiPerf && feedDebug && typeof feedDebug === 'object') {
    const size = JSON.stringify(body).length;
    (feedDebug as Record<string, unknown>).perf = apiPerf.toPayload(size);
  }

  return NextResponse.json(body, { headers });
}
