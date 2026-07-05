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
import {
  isMarketplaceSaleItem,
  marketplaceSaleAuditSample,
} from "@/lib/feed/marketplace-sale";
import { normalizeFeedScope, scopeUsesRadiusFilter } from "@/lib/feed/feed-scope";
import { geocodePlaceQuery } from "@/lib/global-geocoding";

function attachFeedItemTaxonomy(item: Record<string, unknown>): void {
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
  });
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
  const { searchParams } = new URL(req.url);
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

  const session = await getServerSession(authOptions as any);
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
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } }
          ]
        } : {}),
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
        listingIntent: true,
        priceModel: true,
        delivery: true,
        category: true,
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
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } }
          ]
        } : {}),
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
        ...(q ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } }
          ]
        } : {}),
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
    return {
    id: dish.id,
    feedSource: 'DISH' as const,
    title: dish.title || "",
    description: dish.description || "",
    priceCents: dish.priceCents || 0,
    delivery: dish.deliveryMode || "PICKUP",
    category: "CHEFF", // Default category for dishes
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
    return {
    id: listing.id,
    feedSource: 'LISTING' as const,
    title: listing.title || "",
    description: listing.description || "",
    priceCents: listing.priceCents || 0,
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
    listingIntent: product.listingIntent ?? 'OFFER',
    priceModel: product.priceModel ?? 'FIXED',
    category: product.category || "HOMECHEFF",
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

  const sortedItems = sortedPool.slice(0, 30) as typeof allItems;

  // Get view counts, review counts, and average ratings only for returned items
  const allItemIds = sortedItems.map(item => item.id);
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

    // Add stats to returned items
    sortedItems.forEach(item => {
      (item as any).viewCount = viewCountMap.get(item.id) || 0;
      (item as any).reviewCount = reviewCountMap.get(item.id) || 0;
      (item as any).averageRating = avgRatingMap.get(item.id) || 0;
      (item as any).favoriteCount = favoriteCountMap.get(item.id) || 0;
    });
  }
  
  const sellerIdsForBadges: string[] = [];
  const seenBadges = new Set<string>();
  for (const item of sortedItems) {
    const uid = extractFeedItemSellerUserId(item as Record<string, unknown>);
    if (!uid || seenBadges.has(uid)) continue;
    seenBadges.add(uid);
    sellerIdsForBadges.push(uid);
  }
  const badgeMap =
    sellerIdsForBadges.length > 0
      ? await fetchAuthorBadgeSummariesByUserIds(sellerIdsForBadges, 2)
      : new Map<string, { key: string; name: string; icon: string }[]>();
  for (const item of sortedItems) {
    const uid = extractFeedItemSellerUserId(item as Record<string, unknown>);
    if (!uid) continue;
    const chips = badgeMap.get(uid);
    if (chips?.length) (item as Record<string, unknown>).sellerBadges = chips;
  }

  let statsPreview:
    | Awaited<ReturnType<typeof batchComputeUserStatsPreview>>
    | undefined;
  try {
    const previewIds: string[] = [];
    const seen = new Set<string>();
    for (const item of sortedItems) {
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

  for (const item of sortedItems) {
    attachFeedItemTaxonomy(item as Record<string, unknown>);
  }

  const feedDebug =
    process.env.NODE_ENV === "development"
      ? (() => {
          const saleInResponse = sortedItems.filter((item) =>
            isMarketplaceSaleItem(item as Record<string, unknown>)
          );
          return {
            scope: feedScope,
            activeProductsFromDb,
            productsWithPrice,
            productsAfterStripeFilter: allNewProducts.length,
            transformedProducts: transformedProducts.length,
            transformedListings: transformedListings.length,
            transformedDishes: transformedDishes.length,
            combinedBeforeSort: allItems.length,
            finalFeedItems: sortedItems.length,
            saleItemsInResponse: saleInResponse.length,
            saleSample: marketplaceSaleAuditSample(
              sortedItems as Record<string, unknown>[]
            ),
          };
        })()
      : undefined;

  const cors = getCorsHeaders(req);
  const headers = {
    ...cors,
    ...(isPublicDefaultFeed
      ? { 'Cache-Control': 'public, s-maxage=45, stale-while-revalidate=90' }
      : {}),
  };
  return NextResponse.json(
    {
      filters: {
        q,
        vertical,
        subfilters,
        scope: feedScope,
        radius: effectiveRadius,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
      },
      count: sortedItems.length,
      items: sortedItems,
      ...(feedDebug ? { debug: feedDebug } : {}),
      ...(statsPreview ? { statsPreview } : {}),
    },
    { headers }
  );
}
