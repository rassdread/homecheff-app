import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { ListingCategory, ProductCategory } from "@prisma/client";
import { getCorsHeaders } from "@/lib/apiCors";
import { isStripeTestId } from "@/lib/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAuthorBadgeSummariesByUserIds } from "@/lib/gamification/author-badge-summaries";
import { isContactOnlyProduct } from "@/lib/product/order-method";
import {
  FEED_RADIUS_DEFAULT_KM,
  FEED_RADIUS_MODE_LOCAL_FIRST,
  FEED_RADIUS_MODE_STRICT_LOCAL,
  normalizeFeedRadiusKm,
  sortFeedItemsLocalFirst,
} from "@/lib/geo/local-discovery";
import { isNationalNetherlandsListing } from "@/lib/geo/netherlands-mainland";
import {
  FEED_SCOPE_INTERNATIONAL,
  FEED_SCOPE_NATIONAL,
  FEED_SCOPE_NEARBY,
  normalizeFeedScope,
  scopeUsesRadiusFilter,
} from "@/lib/feed/feed-scope";
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
} from "@/lib/discovery/trust/batch-enrichment";
import { fetchSellerTrustBundlesWithTiming } from "@/lib/feed/trust-enrichment-timing";
import { buildTrustTimingDebugPayload } from "@/lib/feed/trust-timing-debug";
import type { DiscoveryEnrichment } from "@/lib/discovery/mappers/enrichment";
import {
  isMarketplaceSaleItem,
  marketplaceSaleAuditSample,
} from "@/lib/feed/marketplace-sale";
import { geocodePlaceQuery } from "@/lib/global-geocoding";
import {
  buildDiscoveryFeed,
  reorderFeedItemsByDiscovery,
} from "@/lib/feed/build-discovery-feed";
import {
  collectUniqueSellerUserIds,
  computeEnrichmentPoolCap,
  deduplicateCrossSourceFeedItems,
  linkedDishMediaFromPhotoMetadata,
  mergeLinkedFeedItemMedia,
  FEED_DB_DISH_CAP,
  FEED_DB_LISTING_CAP,
  FEED_DB_PRODUCT_CAP,
  FEED_RESPONSE_ITEM_CAP,
} from "@/lib/feed/feed-candidate-window";
import {
  loadDishPhotoMetadata,
  loadProductImageMetadata,
  productNeedsLinkedDishMedia,
} from "@/lib/feed/feed-media-metadata.server";
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
  classifyFeedCachePolicy,
  buildFeedResponseCacheHeaders,
  isAnonymousNationalFirstPageTierA,
} from "@/lib/feed/feed-cache-policy";
import { buildFeedOriginCacheKey } from "@/lib/feed/feed-cache-keys";
import {
  readAnonymousNationalOriginCache,
  type FeedOriginCachePayload,
  type FeedOriginCacheStatus,
} from "@/lib/feed/feed-origin-cache.server";
import {
  applyFeedViewerDistanceLabels,
  stripFeedViewerDistanceLabels,
} from "@/lib/feed/feed-distance-labels";
import {
  createFeedApiTiming,
} from "@/lib/feed/feed-api-timing";
import {
  shouldExposeFeedDebug,
  shouldExposeFeedPerfPayload,
  shouldRunFeedApiTiming,
} from "@/lib/feed/feed-perf-probe";
import { fetchFeedProductIdRows, hydrateFeedProductsFromIdRows, productIdRowToStripeRow } from "@/lib/feed/feed-product-query.server";
import { fetchFeedPublishedDishes } from "@/lib/feed/feed-dish-query.server";
import {
  getPrismaPerfSnapshot,
  prismaPerfSetCategory,
  runWithPrismaPerfContext,
} from "@/lib/performance/prisma-perf-context.server";
import { getPerfPrisma } from "@/lib/performance/perf-prisma.server";
import {
  buildFeedPaginationMeta,
  parseFeedPaginationParams,
} from "@/lib/feed/feed-pagination";
import {
  countInlineDataMediaUrls,
  sanitizeFeedItemsForResponse,
} from "@/lib/feed/sanitize-feed-response-media";
import {
  buildFeedMediaProxyUrl,
  classifyFeedMediaUrl,
  resolveFeedMediaUrlForResponse,
  resolveFeedUrlsFromMetadata,
} from "@/lib/feed/resolve-feed-media-url";

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

const STATS_PREVIEW_DEFERRED = true;

type FeedProductStripeRow = {
  priceCents: number | null;
  orderMethod?: string | null;
  seller?: { User?: { stripeConnectAccountId?: string | null } | null } | null;
};

/** Same gate as `allNewProducts` — used before Dish `notIn` to avoid hiding standalone dishes. */
function passesFeedProductStripeFilter(product: FeedProductStripeRow): boolean {
  if (isContactOnlyProduct(product)) return true;
  if (!product.priceCents || product.priceCents === 0) return true;
  const seller = product.seller?.User;
  if (!seller?.stripeConnectAccountId) return true;
  return !isStripeTestId(seller.stripeConnectAccountId);
}

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
  const searchParams = new URL(req.url).searchParams;
  if (shouldRunFeedApiTiming(searchParams)) {
    return runWithPrismaPerfContext(() => handleFeedGet(req, {}));
  }
  return handleFeedGet(req, {});
}

type HandleFeedGetOptions = {
  originBuild?: boolean;
  originCacheBypass?: boolean;
};

const ORIGIN_CACHE_PAYLOAD_KEY = '__feedOriginCachePayload';

async function handleFeedGet(
  req: NextRequest,
  opts: HandleFeedGetOptions,
): Promise<NextResponse> {
  const prisma = getPerfPrisma();
  const { searchParams } = new URL(req.url);
  const apiPerf = shouldRunFeedApiTiming(searchParams)
    ? createFeedApiTiming()
    : null;
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
  const effectiveRadius = normalizeFeedRadiusKm(radius);
  const imageTraceById = new Map<
    string,
    {
      feedSource: string;
      rawProductImage?: string | null;
      rawProductImageKind?: string;
      linkedDishPhoto?: string | null;
      mappedImage?: string | null;
      discoveryCoverImage?: string | null;
    }
  >();
  apiPerf?.mark('params_parsed');

  const session = await getServerSession(authOptions as any);
  apiPerf?.mark('session_resolved');
  const userId = (session as any)?.user?.id || null;
  const cachePolicy = classifyFeedCachePolicy({
    userId,
    q,
    placeParam,
    vertical,
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    hasSubfilters: subfilters.length > 0,
    feedScope,
    skip: feedSkip,
    radiusKm: effectiveRadius,
    searchParams,
  });

  const cacheClassInput = {
    userId,
    q,
    placeParam,
    vertical,
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
    hasSubfilters: subfilters.length > 0,
    feedScope,
    skip: feedSkip,
    radiusKm: effectiveRadius,
    searchParams,
  };

  let originCacheStatus: FeedOriginCacheStatus = 'bypass';

  if (
    !opts.originBuild &&
    !opts.originCacheBypass &&
    isAnonymousNationalFirstPageTierA(cacheClassInput)
  ) {
    const cacheKey = buildFeedOriginCacheKey({
      feedScope,
      take: feedTake,
      skip: feedSkip,
      vertical,
      listingIntent: searchFilters.listingIntent ?? null,
      listingKind: Array.isArray(searchFilters.listingKind)
        ? searchFilters.listingKind.join(',')
        : searchFilters.listingKind ?? null,
    });
    const buildUrl = new URL(req.url);
    buildUrl.searchParams.delete('lat');
    buildUrl.searchParams.delete('lng');
    const buildReq = new NextRequest(buildUrl.toString(), {
      headers: req.headers,
    });
    try {
      const { payload, status } = await readAnonymousNationalOriginCache(
        cacheKey,
        async () => {
          const buildRes = await handleFeedGet(buildReq, { originBuild: true });
          const buildJson = (await buildRes.json()) as Record<string, unknown>;
          const wrapped = buildJson[ORIGIN_CACHE_PAYLOAD_KEY] as
            | FeedOriginCachePayload
            | undefined;
          if (!wrapped?.items) {
            throw new Error('origin cache build missing payload');
          }
          return wrapped;
        },
      );
      originCacheStatus = status;
      let latLabel = searchParams.get("lat");
      let lngLabel = searchParams.get("lng");
      const viewerGeoLabels =
        latLabel &&
        lngLabel &&
        Number.isFinite(Number(latLabel)) &&
        Number.isFinite(Number(lngLabel))
          ? { lat: Number(latLabel), lng: Number(lngLabel) }
          : null;
      const labeledItems = applyFeedViewerDistanceLabels(
        payload.items,
        viewerGeoLabels,
      );
      const listingKindFilterEarly = Array.isArray(searchFilters.listingKind)
        ? searchFilters.listingKind
        : searchFilters.listingKind
          ? [searchFilters.listingKind]
          : [];
      const cors = getCorsHeaders(req);
      const headers: Record<string, string> = {
        ...cors,
        ...buildFeedResponseCacheHeaders(cachePolicy),
        'X-Feed-Origin-Cache': status,
      };
      const body = {
        filters: {
          q,
          vertical,
          subfilters,
          scope: feedScope,
          radius: effectiveRadius,
          lat: latLabel ? Number(latLabel) : null,
          lng: lngLabel ? Number(lngLabel) : null,
          listingKind: listingKindFilterEarly.length
            ? listingKindFilterEarly
            : null,
          listingIntent: searchFilters.listingIntent ?? null,
        },
        count: labeledItems.length,
        items: labeledItems,
        pagination: payload.pagination,
        ...(payload.discovery ? { discovery: payload.discovery } : {}),
        ...(shouldExposeFeedDebug(searchParams)
          ? {
              debug: {
                scope: feedScope,
                cacheTier: cachePolicy.tier,
                cacheReasons: cachePolicy.reasons,
                originCacheStatus: status,
                originCacheKeyVersion: cacheKey.split(':')[0],
              },
            }
          : {}),
      };
      return NextResponse.json(body, { headers });
    } catch (error) {
      console.error('[feed] origin cache path failed, falling back:', error);
      originCacheStatus = 'bypass';
    }
  }

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

  prismaPerfSetCategory("feed-db");
  const dbProductStart = performance.now();
  const dbListingStart = performance.now();

  const productWhereExtras = {
    ...(q ? buildProductTextSearchWhere(q) : {}),
    ...(searchFilters.listingIntent === 'REQUEST'
      ? { listingIntent: 'REQUEST' as const }
      : searchFilters.listingIntent === 'OFFER'
        ? { OR: [{ listingIntent: 'OFFER' as const }, { listingIntent: null }] }
        : {}),
    ...(productCategory ? { category: productCategory as any } : {}),
  };

  const productIdPhase = fetchFeedProductIdRows(prisma, productWhereExtras).then(
    (phase) => {
      apiPerf?.setCounts({
        dbProductIdsMs: Math.round(performance.now() - dbProductStart),
      });
      return phase;
    },
  );

  const listingQuery = prisma.listing.findMany({
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
      take: FEED_DB_LISTING_CAP,
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
    }).then((rows) => {
      const dbListingMs = Math.round(performance.now() - dbListingStart);
      apiPerf?.setCounts({ dbListingMs });
      return rows;
    });

  const productIdResult = await productIdPhase;
  const { idRows: productIdRows } = productIdResult;

  const linkedProductIds = productIdRows
    .filter((row) => passesFeedProductStripeFilter(productIdRowToStripeRow(row)))
    .map((row) => row.id);

  const linkedIdsNeedingDonor = productIdRows
    .filter((row) => passesFeedProductStripeFilter(productIdRowToStripeRow(row)))
    .filter((row) => productNeedsLinkedDishMedia(row._count.Image))
    .map((row) => row.id);

  const productIdsForMetadata = productIdRows.map((p) => p.id);
  const productMetadataStart = performance.now();
  const productImageMetadataPromise = loadProductImageMetadata(
    productIdsForMetadata,
  ).then((rows) => {
    apiPerf?.setCounts({
      productMetadataMs: Math.round(performance.now() - productMetadataStart),
    });
    return rows;
  });

  const dbProductHydrateStart = performance.now();
  const productHydratePromise = hydrateFeedProductsFromIdRows(
    prisma,
    productIdRows,
  ).then((result) => {
    const hydrateMs = Math.round(performance.now() - dbProductHydrateStart);
    apiPerf?.setCounts({
      dbProductMs: Math.round(performance.now() - dbProductStart),
      dbProductHydrateMs: hydrateMs,
      sellerHydrateMs: result.timing.sellerHydrateMs,
    });
    return result.rows;
  });

  const linkedDishMetaStart = performance.now();
  const linkedDishMetadataPromise =
    linkedIdsNeedingDonor.length > 0
      ? loadDishPhotoMetadata(linkedIdsNeedingDonor)
      : Promise.resolve(new Map<string, import('@/lib/feed/resolve-feed-media-url').FeedMediaMetaRow[]>());

  const dbDishStart = performance.now();
  const dbLinkedStart = performance.now();
  const dishWhere = {
    status: "PUBLISHED" as const,
    ...(linkedProductIds.length > 0 ? { id: { notIn: linkedProductIds } } : {}),
    ...(q ? buildDishTextSearchWhere(q) : {}),
    ...(lat && lng && effectiveRadius > 0 ? {
      lat: { gte: Number(lat) - (effectiveRadius / 111.32), lte: Number(lat) + (effectiveRadius / 111.32) },
      lng: { gte: Number(lng) - (effectiveRadius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))), lte: Number(lng) + (effectiveRadius / (111.32 * Math.cos((Number(lat) * Math.PI) / 180))) }
    } : {}),
    ...(productCategory ? { category: productCategory } : {}),
  };
  const dishQuery = fetchFeedPublishedDishes(prisma, { where: dishWhere }).then(
    (result) => {
      const dbDishMs = Math.round(performance.now() - dbDishStart);
      apiPerf?.setCounts({
        dbDishMs,
        dbDishUserHydrateMs: result.idsFirstTiming?.userHydrateMs,
      });
      return result.rows;
    },
  );

  const linkedMediaQuery =
    linkedIdsNeedingDonor.length > 0
      ? prisma.dish.findMany({
          where: { id: { in: linkedIdsNeedingDonor }, status: "PUBLISHED" },
          select: {
            id: true,
            videos: {
              select: { url: true, thumbnail: true },
              orderBy: { createdAt: 'desc' as const },
              take: 1,
            },
          },
        }).then((rows) => {
          const dbLinkedMediaMs = Math.round(performance.now() - dbLinkedStart);
          apiPerf?.setCounts({ dbLinkedMediaMs });
          return rows;
        })
      : Promise.resolve([]).then((rows) => {
          apiPerf?.setCounts({ dbLinkedMediaMs: 0 });
          return rows;
        });

  const [rawProductsFromDb, publishedDishes, linkedDishMediaRows, productImageMetadata, linkedDishMetaEarly, oldListings] =
    await Promise.all([
      productHydratePromise,
      dishQuery,
      linkedMediaQuery,
      productImageMetadataPromise,
      linkedDishMetadataPromise,
      listingQuery,
    ]);
  apiPerf?.mark('db_product_listing_done');
  apiPerf?.mark('db_dish_linked_done');

  const publishedOnlyIds = publishedDishes
    .map((d) => d.id)
    .filter((id) => !linkedIdsNeedingDonor.includes(id));
  const publishedDishMeta =
    publishedOnlyIds.length > 0
      ? await loadDishPhotoMetadata(publishedOnlyIds)
      : new Map<string, import('@/lib/feed/resolve-feed-media-url').FeedMediaMetaRow[]>();
  const dishPhotoMetadata = new Map([
    ...linkedDishMetaEarly.entries(),
    ...publishedDishMeta.entries(),
  ]);
  apiPerf?.setCounts({
    dishMetadataMs: Math.round(performance.now() - linkedDishMetaStart),
  });

  const linkedDishMediaById = new Map(
    linkedDishMediaRows.map((row) => [
      row.id,
      linkedDishMediaFromPhotoMetadata(
        row.id,
        dishPhotoMetadata.get(row.id) ?? [],
        row.videos,
      ),
    ]),
  );

  apiPerf?.mark('db_parallel_done');
  apiPerf?.setCounts({
    productsDb: rawProductsFromDb.length,
    listingsDb: oldListings.length,
    dishesDb: publishedDishes.length,
    prismaQueryBatches: 2,
  });

  const activeProductsFromDb = rawProductsFromDb.length;
  const productsWithPrice = rawProductsFromDb.filter(
    (p) => (p.priceCents ?? 0) > 0
  ).length;

  const allNewProducts = rawProductsFromDb.filter(passesFeedProductStripeFilter);

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
    const dishMedia = resolveFeedUrlsFromMetadata(
      'dish',
      dish.id,
      dishPhotoMetadata.get(dish.id) ?? [],
    );
    const row = {
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
    images: dishMedia.images,
    image: dishMedia.image,
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
    imageTraceById.set(dish.id, {
      feedSource: 'DISH',
      rawProductImage: null,
      rawProductImageKind: dishMedia.image
        ? classifyFeedMediaUrl(dishMedia.image)
        : 'empty',
      mappedImage: dishMedia.image,
    });
    return row;
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
    image:
      resolveFeedMediaUrlForResponse(listing.ListingMedia?.[0]?.url, {
        entity: 'listing',
        id: listing.id,
        index: 0,
      }) ?? null,
    images: (listing.ListingMedia ?? [])
      .map((media, index) =>
        resolveFeedMediaUrlForResponse(media.url, {
          entity: 'listing',
          id: listing.id,
          index,
        }),
      )
      .filter((u): u is string => Boolean(u)),
    ListingMedia: listing.ListingMedia.map((media, index) => ({
      url:
        resolveFeedMediaUrlForResponse(media.url, {
          entity: 'listing',
          id: listing.id,
          index,
        }) ?? media.url,
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
    const productMedia = resolveFeedUrlsFromMetadata(
      'product',
      product.id,
      productImageMetadata.get(product.id) ?? [],
    );
    const productMediaRows = productImageMetadata.get(product.id) ?? [];
    const base = {
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
    image: productMedia.image,
    images: productMedia.images,
    ListingMedia: productMediaRows.map((row, index) => ({
      url: row.httpUrl
        ? resolveFeedMediaUrlForResponse(row.httpUrl, {
            entity: 'product',
            id: product.id,
            index,
          }) ?? row.httpUrl
        : row.isLegacyInline
          ? buildFeedMediaProxyUrl('product', product.id, index)
          : null,
      order: row.sortOrder,
      isMain: row.sortOrder === 0
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
    const donor = linkedDishMediaById.get(product.id);
    const merged = donor ? mergeLinkedFeedItemMedia(base, donor) : base;
    const hasLegacyInline = productMediaRows.some((row) => row.isLegacyInline);
    imageTraceById.set(product.id, {
      feedSource: 'PRODUCT',
      rawProductImage: hasLegacyInline ? 'data:[metadata]' : null,
      rawProductImageKind: hasLegacyInline
        ? 'data'
        : productMedia.image
          ? classifyFeedMediaUrl(productMedia.image)
          : 'empty',
      linkedDishPhoto: donor?.image ?? null,
      mappedImage: merged.image ?? null,
    });
    return merged;
  });

  const combinedRaw = [...transformedProducts, ...transformedListings, ...transformedDishes];
  const { items: allItems, dropped: crossSourceDropped } =
    deduplicateCrossSourceFeedItems(combinedRaw);
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

  const nearbyNeedsLocation =
    feedScope === FEED_SCOPE_NEARBY &&
    effectiveRadius > 0 &&
    !viewerGeo;

  const radiusModeForSort =
    feedScope === FEED_SCOPE_NEARBY && viewerGeo && effectiveRadius > 0
      ? FEED_RADIUS_MODE_STRICT_LOCAL
      : FEED_RADIUS_MODE_LOCAL_FIRST;

  let sortedPool = sortFeedItemsLocalFirst(allItems as Record<string, unknown>[], {
    viewerGeo,
    radiusKm: nearbyNeedsLocation ? 0 : effectiveRadius,
    radiusMode: radiusModeForSort,
    followedSellerUserIds,
    extractSellerUserId: (item) => extractFeedItemSellerUserId(item),
    extractCoords: (item) => extractItemLatLng(item),
  });

  // Nearby without viewer location must not silently return a national/global pool.
  if (nearbyNeedsLocation) {
    sortedPool = sortedPool.filter(
      (item) => !isMarketplaceSaleItem(item as Record<string, unknown>),
    );
  }

  // Heel Nederland = European mainland only (exclude SX/CW/AW/BQ and foreign).
  if (feedScope === FEED_SCOPE_NATIONAL) {
    sortedPool = sortedPool.filter((item) => {
      if (!isMarketplaceSaleItem(item as Record<string, unknown>)) return true;
      const coords = extractItemLatLng(item);
      const countryCode =
        (item.countryCode as string | undefined) ||
        (item.country as string | undefined) ||
        ((item.User as { country?: string } | undefined)?.country) ||
        ((item.seller as { User?: { country?: string } } | undefined)?.User
          ?.country) ||
        null;
      return isNationalNetherlandsListing({ coords, countryCode });
    });
  }

  // International keeps worldwide results including NL (contract a).
  void FEED_SCOPE_INTERNATIONAL;

  const enrichmentPoolCap = computeEnrichmentPoolCap(feedSkip, feedTake);

  const marketplacePool = sortedPool
    .filter((item) => isMarketplaceSaleItem(item as Record<string, unknown>))
    .slice(0, enrichmentPoolCap) as typeof allItems;

  const nonMarketplaceTail = sortedPool.filter(
    (item) => !isMarketplaceSaleItem(item as Record<string, unknown>),
  );

  const enrichTargets = marketplacePool as typeof allItems;

  // Get view counts, review counts, and average ratings for discovery pool
  prismaPerfSetCategory("stats");
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
  
  const sellerIdsForBadges = collectUniqueSellerUserIds(
    enrichTargets as Array<Record<string, unknown>>,
    extractFeedItemSellerUserId,
  );
  const badgeMap =
    sellerIdsForBadges.length > 0
      ? await fetchAuthorBadgeSummariesByUserIds(sellerIdsForBadges, 2)
      : new Map<string, { key: string; name: string; icon: string }[]>();
  let trustTiming: import('@/lib/feed/trust-enrichment-timing').TrustEnrichmentTiming | null =
    null;
  let trustBundles: Awaited<
    ReturnType<typeof fetchSellerTrustBundlesWithTiming>
  >['bundles'] = new Map();
  prismaPerfSetCategory("trust");
  if (sellerIdsForBadges.length > 0) {
    try {
      const trustResult = await fetchSellerTrustBundlesWithTiming(
        sellerIdsForBadges,
        badgeMap,
      );
      trustBundles = trustResult.bundles;
      trustTiming = trustResult.timing;
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
    trustTotalMs: trustTiming?.totalMs,
    statsPreviewDeferred: STATS_PREVIEW_DEFERRED,
  });

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
  apiPerf?.mark('discovery_attach_done');

  let discoveryFeed: DiscoveryFeedPayload | null = null;
  prismaPerfSetCategory("enrichment");
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
    apiPerf?.mark('discovery_sections_done');

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
    apiPerf?.mark('activity_slots_done');
  } else {
    apiPerf?.mark('discovery_sections_done');
    apiPerf?.mark('activity_slots_done');
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
    shouldExposeFeedDebug(searchParams)
      ? (() => {
          const saleInResponse = responseItems.filter((item) =>
            isMarketplaceSaleItem(item as Record<string, unknown>)
          );
          return {
            scope: feedScope,
            branch: nearbyNeedsLocation
              ? 'nearby_needs_location'
              : feedScope === FEED_SCOPE_NATIONAL
                ? 'national_mainland'
                : feedScope === FEED_SCOPE_NEARBY
                  ? 'nearby_strict_local'
                  : 'international_worldwide',
            nearbyNeedsLocation,
            radiusMode: radiusModeForSort,
            viewerGeo: viewerGeo
              ? { lat: viewerGeo.lat, lng: viewerGeo.lng }
              : null,
            cacheTier: cachePolicy.tier,
            cacheReasons: cachePolicy.reasons,
            statsPreviewDeferred: STATS_PREVIEW_DEFERRED,
            trustTiming: buildTrustTimingDebugPayload(trustTiming),
            searchFilters,
            activeProductsFromDb,
            productsWithPrice,
            productsAfterStripeFilter: allNewProducts.length,
            transformedProducts: transformedProducts.length,
            transformedListings: transformedListings.length,
            transformedDishes: transformedDishes.length,
            crossSourceDropped: crossSourceDropped.length,
            combinedBeforeSort: combinedRaw.length,
            combinedAfterDedup: allItems.length,
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
            linkedMediaDonorCount: linkedIdsNeedingDonor.length,
            linkedMediaSkippedCount: linkedProductIds.length - linkedIdsNeedingDonor.length,
            productMetadataCount: productImageMetadata.size,
            dishMetadataCount: dishPhotoMetadata.size,
            candidateWindow: {
              dbProductCap: FEED_DB_PRODUCT_CAP,
              dbListingCap: FEED_DB_LISTING_CAP,
              dbDishCap: FEED_DB_DISH_CAP,
              enrichmentPoolCap,
            },
            discoverySections: discoveryFeed?.sections.map((s) => ({
              id: s.sectionId,
              count: s.listingIds.length,
            })),
            discoveryMetrics: discoveryFeed?.metrics,
            imageTrace: pageItems.map((item) => {
              const id = String(item.id ?? '');
              const trace = imageTraceById.get(id);
              const discovery = item.discovery as
                | { coverImage?: string | null; imageCount?: number }
                | undefined;
              return {
                id,
                title: item.title,
                feedSource: trace?.feedSource ?? item.feedSource,
                rawProductImage: trace?.rawProductImage ?? null,
                rawProductImageKind: trace?.rawProductImageKind ?? null,
                linkedDishPhoto: trace?.linkedDishPhoto ?? null,
                mappedImage: item.image ?? trace?.mappedImage ?? null,
                discoveryCoverImage: discovery?.coverImage ?? null,
                discoveryImageCount: discovery?.imageCount ?? 0,
              };
            }),
          };
        })()
      : undefined;

  const cors = getCorsHeaders(req);
  const headers: Record<string, string> = {
    ...cors,
    ...buildFeedResponseCacheHeaders(cachePolicy),
  };

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
  };

  if (opts.originBuild) {
    const originPayload: FeedOriginCachePayload = {
      items: stripFeedViewerDistanceLabels(
        pageItems as Record<string, unknown>[],
      ),
      discovery: isFirstPage ? discoveryFeed : null,
      pagination,
      feedTotal,
    };
    return NextResponse.json({
      [ORIGIN_CACHE_PAYLOAD_KEY]: originPayload,
    });
  }

  if (apiPerf && shouldExposeFeedPerfPayload(searchParams)) {
    apiPerf.setPrismaSnapshot(getPrismaPerfSnapshot());
    const responseBytesEstimate = JSON.stringify(body).length;
    apiPerf.mark('serialize_done');
    if (feedDebug && typeof feedDebug === 'object') {
      const perfPayload = apiPerf.toPayload(responseBytesEstimate);
      perfPayload.trustTiming = buildTrustTimingDebugPayload(trustTiming);
      if (originCacheStatus !== 'bypass') {
        (perfPayload.counts as Record<string, unknown>).originCacheStatus =
          originCacheStatus;
      }
      (feedDebug as Record<string, unknown>).perf = perfPayload;
    }
    const serverTiming = apiPerf.toServerTimingHeader();
    if (serverTiming) {
      headers['Server-Timing'] = serverTiming;
      headers['Access-Control-Expose-Headers'] = 'Server-Timing';
    }
  } else if (apiPerf) {
    apiPerf.mark('serialize_done');
  }

  return NextResponse.json(body, { headers });
}
