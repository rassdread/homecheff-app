"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState, createContext, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import {
  Filter,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  inspirationDetailHrefApi,
  feedLocationLine,
} from "@/components/feed/GeoFeedCards";
import type { GeoFeedCardItem } from "@/components/feed/GeoFeedCards";
import FeedSidebarFilters from "@/components/feed/FeedSidebarFilters";
import FeedMobileToolbar from "@/components/feed/FeedMobileToolbar";
import FeedMobileFilterSheet from "@/components/feed/FeedMobileFilterSheet";
import {
  getFeedItemHref,
} from "@/components/feed/feedItemClassification";
import {
  FeedMarketplaceCard,
  feedMarketplaceItemHref,
} from "@/components/feed/FeedMarketplaceCard";
import type { FeedChip, FeedViewFilterId } from "@/lib/feed/feed-taxonomy";
import { deriveFeedTaxonomy, type FeedTaxonomy } from "@/lib/feed/feed-taxonomy";
import { matchesSearchTextQuery } from "@/lib/search";
import type { ListingKind } from "@/lib/marketplace/contracts/listing-kind-contract";
import type { DiscoveryReadModel } from "@/lib/discovery/contracts/discovery-read-model";
import {
  getDiscoveryFavoriteCount,
  getDiscoveryLegacyVerticalCategory,
  getDiscoveryListingKind,
  getDiscoveryListingIntent,
  getDiscoveryMarketplaceCategory,
  getDiscoverySpecializations,
  toSearchableListingRecord,
} from "@/lib/discovery/consumer-accessors";
import { attachListingKind } from "@/lib/marketplace/listing-kind/feed-attach";
import FeedLayoutToggle from "@/components/feed/FeedLayoutToggle";
import FeedDesktopColumnToggle from "@/components/feed/FeedDesktopColumnToggle";
import {
  useHomeDesktopFeedColumns,
  homeDesktopFeedGridClass,
} from "@/lib/feed/homeDesktopFeedColumns";
import DiscoverGridTile, {
  inspirationApiToCardItem,
} from "@/components/feed/DiscoverGridTile";
import {
  pickPrimaryImageUrl,
  pickPrimaryVideoUrl,
} from "@/components/feed/feedMedia";
import {
  getEffectiveFeedLayoutMode,
  useFeedLayoutMode,
} from "@/lib/feed/feedLayoutPreference";
import {
  rankSalesByScore,
  applyColdStartScoreOrder,
  pickTopThreeSales,
  type TopThreeSalesResult,
} from "@/components/feed/feedSaleRanking";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTranslation } from "@/hooks/useTranslation";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import { useCreateFlow } from "@/components/create/CreateFlowContext";
import {
  parsePromoInsertId,
  resolveHomeMobileInsert,
  resolveHomeMobileTrailingPromo,
} from "@/lib/home/resolve-home-mobile-insert";
import type { HomeMobileFeedInsertId } from "@/lib/home/resolve-home-mobile-insert";
import type { HomePromotionId } from "@/lib/promotions/home-promotions";
import type {
  CreateFlowIntent,
  CreateFlowMode,
  CreateFlowVertical,
} from "@/lib/createFlowIntent";
import { useUserBootstrap } from "@/components/user/UserBootstrapProvider";
import {
  coerceUserStatsPayload,
  seedCachedUserStats,
} from "@/lib/userStatsClientCache";
import { useIsNativeAppMounted } from "@/lib/native/useIsNativeAppMounted";
import { useNarrowViewport } from "@/hooks/useNarrowViewport";
import {
  readNativeFeedPrefs,
  writeNativeFeedPrefs,
} from "@/lib/native/appPreferences";
import {
  NativeLocationError,
  requestAndGetNativeCurrentPosition,
  type NativeLocationCoords,
} from "@/lib/native/location";
import {
  NativePushError,
  maskPushTokenForDisplay,
  requestAndRegisterNativePush,
  setupNativePushDebugListeners,
} from "@/lib/native/push";
import { getOrCreatePushDeviceId } from "@/lib/native/pushClientPrefs";
import { registerFcmTokenWithServer } from "@/lib/native/pushTokenServer";
import {
  loadFeedSurfaceState,
  saveFeedSurfaceState,
} from "@/lib/feed/feedSurfaceState";
import {
  readHomeFeedReturnCache,
  saveHomeFeedReturnCache,
  peekFreshHomeFeedReturnCache,
} from "@/lib/feed/home-feed-return-cache";
import {
  compareFeedSaleItems,
  feedItemCategoryEnum,
  feedVerticalSlugToCategoryEnum,
  matchesFeedClientPriceRange,
  sortFeedSaleItems,
  type FeedClientSortField,
  type FeedClientSortOrder,
} from "@/lib/feed/feed-client-sort";
import {
  buildGeoFeedApiParams,
  buildInspiratieCategoryParam,
} from "@/lib/feed/feed-query-params";
import {
  FEED_SCOPE_INTERNATIONAL,
  FEED_SCOPE_NATIONAL,
  FEED_SCOPE_NEARBY,
  migrateHomeFeedPersist,
  scopeDefaultSort,
  scopeUsesFarthestFirstSort,
  type FeedScope,
} from "@/lib/feed/feed-scope";
import {
  countSaleAfterSearch,
  logFeedSaleVisibilityAudit,
} from "@/lib/feed/feed-sale-visibility-audit";
import {
  nextWiderFeedRadiusKm,
  RADIUS_LOCAL_KM,
} from "@/lib/geo/local-discovery";
import { partitionSaleItemsByRadius } from "@/lib/geo/feed-radius-filter";
import {
  countMarketplaceSaleItems,
  isMarketplaceSaleItem,
} from "@/lib/feed/marketplace-sale";
import { trackOnboardingEvent } from "@/lib/onboarding/onboarding-analytics";
import { reportAppDiagnostic } from "@/lib/diagnostics/appDiagnostics";
import { computeViewerDistanceKm, resolveFeedItemCoordsFromRaw } from "@/lib/geo/item-location";

type ViewerCoords = { lat: number; lng: number };

function enrichFeedItemDistance(
  item: FeedItem,
  viewer: ViewerCoords | null | undefined
): FeedItem {
  if (item.distanceKm != null && item.distanceKm > 0) return item;
  const km = computeViewerDistanceKm(viewer, item.lat, item.lng);
  if (km == null) return item;
  return { ...item, distanceKm: km };
}

function enrichFeedItemsWithDistance(
  items: FeedItem[],
  viewer: ViewerCoords | null | undefined
): FeedItem[] {
  if (!viewer) return items;
  return items.map((item) => enrichFeedItemDistance(item, viewer));
}

/** Native Capacitor GPS-testblok: alleen in dev, of met expliciete flag (niet op productie voor eindgebruikers). */
const SHOW_NATIVE_GPS_DEBUG_UI =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_CAPACITOR_NATIVE_GPS_DEBUG === "true";

/** Native push-debug (FCM): alleen dev of expliciete flag; niet voor gewone productiegebruikers. */
const SHOW_CAPACITOR_PUSH_DEBUG =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_CAPACITOR_PUSH_DEBUG === "true";

type AuthorBadgeChip = { key: string; name: string; icon: string };

type FeedItem = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  orderMethod?: string | null;
  listingIntent?: string | null;
  priceModel?: string | null;
  type?: string | null;
  isRecipe?: boolean | null;
  isInspiration?: boolean | null;
  isActive?: boolean | null;
  deliveryMode: "PICKUP" | "DELIVERY" | "BOTH" | string | null;
  place: string | null;
  lat: number | null;
  lng: number | null;
  photo: string | null;
  videoUrl: string | null;
  videoThumbnail: string | null;
  createdAt: string;
  distanceKm?: number;
  viewCount?: number;
  propsCount?: number;
  favoriteCount?: number;
  ownerId?: string | null;
  category?: string | null;
  sellerUserId?: string | null;
  sellerName?: string | null;
  sellerUsername?: string | null;
  sellerAvatar?: string | null;
  sellerDisplayFullName?: boolean | null;
  sellerDisplayNameOption?: string | null;
  sellerBadges?: AuthorBadgeChip[];
  /** Afgeleide V3 taxonomy (Fase 5D). */
  taxonomy?: FeedTaxonomy;
  /** Canonical ListingKind (Phase 1). */
  listingKind?: ListingKind;
  /** Unified discovery read model (Phase 1B). */
  discovery?: DiscoveryReadModel;
  marketplaceCategory?: string | null;
  specializations?: string[];
  acceptedSpecializations?: string[];
  feedSource?: string | null;
};

/** UI view filter — decoupled from item taxonomy (Fase 5D). Today: all | sale | inspiration. */
type FeedViewFilter = FeedViewFilterId;

function createIntentForSaleOrInspiration(
  categorySlug: string,
  chip: "sale" | "inspiration"
): CreateFlowIntent {
  const mode: CreateFlowMode = chip === "sale" ? "dorpsplein" : "inspiratie";
  if (categorySlug === "cheff") return { vertical: "CHEFF", mode };
  if (categorySlug === "garden") return { vertical: "GARDEN", mode };
  if (categorySlug === "designer") return { vertical: "DESIGNER", mode };
  return { mode };
}

/** Volledige 6-way intent: alleen als verticaal én dorpsplein/inspiratie-weergave gekozen. */
function resolvedVerticalModeIntent(
  categorySlug: string,
  feedChip: FeedViewFilter
): CreateFlowIntent | null {
  if (categorySlug === "all") return null;
  if (feedChip !== "sale" && feedChip !== "inspiration") return null;
  const vertical: CreateFlowVertical | null =
    categorySlug === "cheff"
      ? "CHEFF"
      : categorySlug === "garden"
        ? "GARDEN"
        : categorySlug === "designer"
          ? "DESIGNER"
          : null;
  if (!vertical) return null;
  return createIntentForSaleOrInspiration(categorySlug, feedChip);
}

function quickCreateLabelKey(intent: CreateFlowIntent): string {
  const v = intent.vertical;
  const m = intent.mode;
  if (v === "CHEFF" && m === "dorpsplein")
    return "feed.quickCreate.chefDorpsplein";
  if (v === "CHEFF" && m === "inspiratie")
    return "feed.quickCreate.chefInspiratie";
  if (v === "GARDEN" && m === "dorpsplein")
    return "feed.quickCreate.gardenDorpsplein";
  if (v === "GARDEN" && m === "inspiratie")
    return "feed.quickCreate.gardenInspiratie";
  if (v === "DESIGNER" && m === "dorpsplein")
    return "feed.quickCreate.designerDorpsplein";
  if (v === "DESIGNER" && m === "inspiratie")
    return "feed.quickCreate.designerInspiratie";
  return m === "dorpsplein" ? "feed.addProductCta" : "feed.shareInspirationCta";
}

type InspSlot =
  | { kind: "api"; item: InspirationItem }
  | { kind: "feed"; item: FeedItem };

function normalizeFeedItem(raw: Record<string, unknown>): FeedItem {
  const photo = pickPrimaryImageUrl(raw);
  const { url: videoUrl, thumbnail: videoThumbnail } =
    pickPrimaryVideoUrl(raw);
  const createdRaw = raw.createdAt;
  const createdAt =
    typeof createdRaw === "string"
      ? createdRaw
      : createdRaw instanceof Date
        ? createdRaw.toISOString()
        : new Date().toISOString();

  const priceRaw = raw.priceCents;
  let priceCents: number | null = null;
  if (priceRaw != null && priceRaw !== "") {
    const n = Number(priceRaw);
    if (Number.isFinite(n)) priceCents = Math.round(n);
  }

  const ownerRaw = raw.ownerId;
  const ownerId =
    ownerRaw != null && String(ownerRaw).trim() !== ""
      ? String(ownerRaw).trim()
      : null;

  const user = raw.User as
    | {
        id?: string;
        name?: string | null;
        username?: string | null;
        profileImage?: string | null;
        image?: string | null;
        displayFullName?: boolean | null;
        displayNameOption?: string | null;
      }
    | undefined;
  const seller = raw.seller as
    | {
        id?: string;
        name?: string | null;
        username?: string | null;
        avatar?: string | null;
        displayFullName?: boolean | null;
        displayNameOption?: string | null;
      }
    | undefined;

  const sellerUserId =
    ownerId ||
    (user?.id ? String(user.id) : null) ||
    (seller?.id ? String(seller.id) : null) ||
    null;
  const sellerName = user?.name ?? seller?.name ?? null;
  const sellerUsername = user?.username ?? seller?.username ?? null;
  const sellerAvatar =
    user?.profileImage ?? user?.image ?? seller?.avatar ?? null;
  const sellerDisplayFullName =
    user?.displayFullName ?? seller?.displayFullName ?? null;
  const sellerDisplayNameOption =
    user?.displayNameOption ?? seller?.displayNameOption ?? null;

  const sellerBadgesRaw = raw.sellerBadges;
  const sellerBadges = Array.isArray(sellerBadgesRaw)
    ? (sellerBadgesRaw as AuthorBadgeChip[]).filter(
        (b) => b && typeof b.key === 'string' && typeof b.name === 'string' && typeof b.icon === 'string'
      )
    : undefined;

  const rawTaxonomy = raw.taxonomy as FeedTaxonomy | undefined;
  const discovery = raw.discovery as DiscoveryReadModel | undefined;
  const category =
    discovery?.entityType === 'dish'
      ? (raw.category != null ? String(raw.category) : null)
      : getDiscoveryLegacyVerticalCategory({
          discovery,
          category: raw.category != null ? String(raw.category) : null,
          marketplaceCategory:
            raw.marketplaceCategory != null ? String(raw.marketplaceCategory) : null,
        }) ?? (raw.category != null ? String(raw.category) : null);

  const taxonomyInput = {
    priceCents,
    orderMethod: raw.orderMethod != null ? String(raw.orderMethod) : null,
    category,
    type: (raw.type as string) ?? null,
    isRecipe: raw.isRecipe as boolean | null | undefined,
    isInspiration: raw.isInspiration as boolean | null | undefined,
    listingIntent:
      raw.listingIntent != null ? String(raw.listingIntent) : null,
    priceModel: raw.priceModel != null ? String(raw.priceModel) : null,
    feedSource:
      raw.feedSource != null
        ? String(raw.feedSource)
        : raw.kind != null
          ? String(raw.kind)
          : null,
    marketplaceCategory:
      raw.marketplaceCategory != null ? String(raw.marketplaceCategory) : null,
    specializations: Array.isArray(raw.specializations)
      ? raw.specializations.filter((v): v is string => typeof v === 'string')
      : null,
    subcategory: raw.subcategory != null ? String(raw.subcategory) : null,
  };
  const withKind = discovery
    ? { ...taxonomyInput, listingKind: discovery.listingKind }
    : attachListingKind(taxonomyInput);
  const taxonomy =
    rawTaxonomy ??
    deriveFeedTaxonomy({
      ...taxonomyInput,
      listingKind: withKind.listingKind,
    });

  const resolvedCoords = resolveFeedItemCoordsFromRaw(raw);

  return {
    id: String(raw.id ?? ""),
    title: (raw.title as string) ?? null,
    description: (raw.description as string) ?? null,
    priceCents,
    orderMethod:
      raw.orderMethod != null ? String(raw.orderMethod) : null,
    priceModel: raw.priceModel != null ? String(raw.priceModel) : null,
    ownerId,
    category,
    sellerUserId,
    sellerName,
    sellerUsername,
    sellerAvatar,
    sellerDisplayFullName,
    sellerDisplayNameOption,
    type: (raw.type as string) ?? null,
    isRecipe: raw.isRecipe as boolean | null | undefined,
    isInspiration: raw.isInspiration as boolean | null | undefined,
    isActive: raw.isActive !== false,
    deliveryMode:
      (raw.deliveryMode as string) ?? (raw.delivery as string) ?? null,
    place:
      (raw.place as string) ??
      ((raw.location as { place?: string } | undefined)?.place ?? null),
    lat: resolvedCoords?.lat ?? null,
    lng: resolvedCoords?.lng ?? null,
    photo,
    videoUrl,
    videoThumbnail,
    createdAt,
    distanceKm:
      raw.distanceKm != null && Number(raw.distanceKm) > 0
        ? Number(raw.distanceKm)
        : undefined,
    viewCount:
      raw.viewCount != null ? Number(raw.viewCount) : undefined,
    favoriteCount: discovery
      ? discovery.social.favoriteCount
      : raw.favoriteCount != null
        ? Number(raw.favoriteCount)
        : raw.propsCount != null
          ? Number(raw.propsCount)
          : undefined,
    sellerBadges: sellerBadges?.length ? sellerBadges : undefined,
    taxonomy,
    listingKind: discovery?.listingKind ?? withKind.listingKind,
    listingIntent:
      discovery?.listingIntent ??
      (raw.listingIntent != null ? String(raw.listingIntent) : null),
    discovery,
    marketplaceCategory:
      discovery?.marketplaceCategory != null
        ? String(discovery.marketplaceCategory)
        : raw.marketplaceCategory != null
          ? String(raw.marketplaceCategory)
          : null,
    specializations: discovery?.specializations?.length
      ? discovery.specializations
      : Array.isArray(raw.specializations)
        ? raw.specializations.filter((v): v is string => typeof v === 'string')
        : undefined,
    acceptedSpecializations: Array.isArray(raw.acceptedSpecializations)
      ? raw.acceptedSpecializations.filter((v): v is string => typeof v === 'string')
      : undefined,
    feedSource:
      raw.feedSource != null
        ? String(raw.feedSource)
        : raw.kind != null
          ? String(raw.kind)
          : null,
  };
}

function safeNormalizeFeedItem(
  raw: Record<string, unknown>,
  index: number
): FeedItem | null {
  try {
    return normalizeFeedItem(raw);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[GeoFeed] feed item normalize failed", {
        index,
        id: raw.id,
        error,
      });
    }
    reportAppDiagnostic("feed_item_normalize_failed", {
      id: raw.id != null ? String(raw.id) : null,
    });
    return null;
  }
}

function isVisible(item: FeedItem) {
  return item.isActive !== false && Boolean(item.id?.trim());
}

function matchesSearch(
  item: Pick<
    FeedItem,
    | 'title'
    | 'description'
    | 'listingKind'
    | 'listingIntent'
    | 'specializations'
    | 'marketplaceCategory'
    | 'category'
    | 'feedSource'
    | 'type'
    | 'discovery'
  >,
  q: string
) {
  return matchesSearchTextQuery(toSearchableListingRecord(item), q);
}

function inspSlotToSortable(slot: InspSlot) {
  if (slot.kind === "api") {
    return {
      id: slot.item.id,
      createdAt: slot.item.createdAt,
      priceCents: null as number | null,
      viewCount: slot.item.viewCount,
      distanceKm: slot.item.location?.distanceKm ?? undefined,
    };
  }
  return {
    id: slot.item.id,
    createdAt: slot.item.createdAt,
    priceCents: slot.item.priceCents,
    orderMethod: slot.item.orderMethod,
    viewCount: slot.item.viewCount,
    distanceKm: slot.item.distanceKm,
  };
}

function sortInspirationSlots(
  slots: InspSlot[],
  sortBy: FeedClientSortField,
  sortOrder: FeedClientSortOrder
): InspSlot[] {
  return [...slots].sort((a, b) =>
    compareFeedSaleItems(
      inspSlotToSortable(a),
      inspSlotToSortable(b),
      sortBy,
      sortOrder
    )
  );
}

function buildInspSlots(
  apiItems: InspirationItem[],
  feedOnly: FeedItem[]
): InspSlot[] {
  const slots: InspSlot[] = [
    ...apiItems.map((item) => ({ kind: "api" as const, item })),
    ...feedOnly.map((item) => ({ kind: "feed" as const, item })),
  ];
  slots.sort((a, b) => {
    const ta = new Date(
      a.kind === "api" ? a.item.createdAt : a.item.createdAt
    ).getTime();
    const tb = new Date(
      b.kind === "api" ? b.item.createdAt : b.item.createdAt
    ).getTime();
    if (tb !== ta) return tb - ta;
    const ida = a.kind === "api" ? a.item.id : a.item.id;
    const idb = b.kind === "api" ? b.item.id : b.item.id;
    return idb.localeCompare(ida);
  });
  return slots;
}

function interleaveSalesAndInspiration(
  sales: FeedItem[],
  slots: InspSlot[]
): Array<
  { row: "sale"; item: FeedItem } | { row: "insp"; slot: InspSlot }
> {
  const out: Array<
    { row: "sale"; item: FeedItem } | { row: "insp"; slot: InspSlot }
  > = [];
  let si = 0;
  let ii = 0;
  let streak = 0;
  const STRIDE = 4;

  while (si < sales.length) {
    out.push({ row: "sale", item: sales[si++] });
    streak++;
    if (streak >= STRIDE && ii < slots.length) {
      out.push({ row: "insp", slot: slots[ii++] });
      streak = 0;
    }
  }
  while (ii < slots.length) {
    out.push({ row: "insp", slot: slots[ii++] });
  }
  return out;
}

/** Eerste twee kaarten altijd sale; plek 3 inspiratie of derde sale; daarna 4:1 met tail uit cold-order. */
function interleaveWithSmartPrefix(
  coldOrdered: FeedItem[],
  slots: InspSlot[],
  top: TopThreeSalesResult<FeedItem> | null
): Array<
  { row: "sale"; item: FeedItem } | { row: "insp"; slot: InspSlot }
> {
  if (coldOrdered.length === 0) {
    return slots.map((slot) => ({ row: "insp" as const, slot }));
  }
  if (!top) {
    return interleaveSalesAndInspiration(coldOrdered, slots);
  }

  const used = new Set([top.winner.id, top.second.id]);
  if (!top.useInspirationAtThird && top.thirdSale) {
    used.add(top.thirdSale.id);
  }
  const tailSales = coldOrdered.filter((x) => !used.has(x.id));

  const rows: Array<
    { row: "sale"; item: FeedItem } | { row: "insp"; slot: InspSlot }
  > = [];
  rows.push({ row: "sale", item: top.winner });
  rows.push({ row: "sale", item: top.second });

  let ii = 0;
  if (top.useInspirationAtThird && slots.length > 0) {
    rows.push({ row: "insp", slot: slots[ii++] });
  } else if (top.thirdSale) {
    rows.push({ row: "sale", item: top.thirdSale });
  }

  let streak = rows.filter((r) => r.row === "sale").length;
  const STRIDE = 4;

  let ti = 0;
  while (ti < tailSales.length) {
    rows.push({ row: "sale", item: tailSales[ti++] });
    streak++;
    if (streak >= STRIDE && ii < slots.length) {
      rows.push({ row: "insp", slot: slots[ii++] });
      streak = 0;
    }
  }
  while (ii < slots.length) {
    rows.push({ row: "insp", slot: slots[ii++] });
  }
  return rows;
}

function orderedSaleOnlyFromTop(
  coldOrdered: FeedItem[],
  top: TopThreeSalesResult<FeedItem> | null
): FeedItem[] {
  if (!top) return coldOrdered;
  const used = new Set([top.winner.id, top.second.id]);
  if (!top.useInspirationAtThird && top.thirdSale) {
    used.add(top.thirdSale.id);
  }
  const tail = coldOrdered.filter((x) => !used.has(x.id));
  if (top.useInspirationAtThird) {
    return [top.winner, top.second, ...tail];
  }
  if (top.thirdSale) {
    return [top.winner, top.second, top.thirdSale, ...tail];
  }
  return [top.winner, top.second, ...tail];
}

function toCardItem(
  it: FeedItem,
  viewer: ViewerCoords | null | undefined
): GeoFeedCardItem {
  const distanceKm =
    it.distanceKm != null && it.distanceKm > 0
      ? it.distanceKm
      : computeViewerDistanceKm(viewer, it.lat, it.lng);
  const fav = getDiscoveryFavoriteCount(it);
  return {
    id: it.id,
    title: it.title,
    description: it.description,
    priceCents: it.priceCents,
    orderMethod: it.orderMethod,
    listingIntent: getDiscoveryListingIntent(it),
    priceModel: it.priceModel,
    type: it.type,
    isRecipe: it.isRecipe,
    isInspiration: it.isInspiration,
    deliveryMode: it.deliveryMode,
    place: it.place,
    photo: it.photo,
    videoUrl: it.videoUrl,
    videoThumbnail: it.videoThumbnail,
    distanceKm,
    viewCount: it.viewCount,
    favoriteCount: fav,
    ownerId: it.ownerId,
    category: getDiscoveryLegacyVerticalCategory(it) ?? it.category,
    sellerUserId: it.sellerUserId,
    sellerName: it.sellerName,
    sellerUsername: it.sellerUsername,
    sellerAvatar: it.sellerAvatar,
    sellerDisplayFullName: it.sellerDisplayFullName,
    sellerDisplayNameOption: it.sellerDisplayNameOption,
    sellerBadges: it.sellerBadges,
    taxonomy: it.taxonomy,
    listingKind: getDiscoveryListingKind(it),
    discovery: it.discovery,
    marketplaceCategory: getDiscoveryMarketplaceCategory(it),
    specializations: getDiscoverySpecializations(it),
    acceptedSpecializations: it.acceptedSpecializations,
  };
}

function initialDorpspleinCategoryFromServer(raw?: string): string {
  if (!raw?.trim()) return "all";
  const v = raw.toLowerCase().trim();
  if (v === "cheff" || v === "chef" || v === "keuken") return "cheff";
  if (v === "grown" || v === "garden" || v === "tuin") return "garden";
  if (v === "designer" || v === "design" || v === "studio") return "designer";
  return "all";
}

type GeoFeedProps = {
  initialInspiratieItems?: InspirationItem[];
  /** Optioneel: startfilter vanuit URL (bv. `/?feed=inspiration`) of server searchParams. */
  initialFeedChip?: FeedChip;
  /** Dorpsplein-categorie vanuit URL (`/?vertical=cheff` of ecosystem-CTA). */
  initialFeedCategory?: string;
  /** Vrije plaats-tekst vanuit URL (`/?place=Utrecht`). */
  initialFeedPlace?: string;
  /** Inject community/reputation cards between feed items on mobile. */
  enableMobileFeedInserts?: boolean;
  /** Render homepage-only insert UI (keeps GeoFeed free of components/home imports). */
  renderMobileFeedInsert?: (insertId: HomeMobileFeedInsertId) => ReactNode;
  /** Visible homepage promo ids — used for short-feed trailing insert. */
  visibleHomePromotionIds?: HomePromotionId[];
  /** Narrower main column on desktop homepage (2-col grid). */
  feedColumnLayout?: 'default' | 'home-main';
  /**
   * Homepage desktop: HomePageClient owns the 3-col sticky grid.
   * Render children with `<FeedFiltersPanel />`, `<FeedContent />`, sidebar.
   */
  homeComposedLayout?: boolean;
  children?: ReactNode;
};

type GeoFeedHomeLayoutValue = {
  filtersPanel: ReactNode;
  feedContent: ReactNode;
};

const GeoFeedHomeLayoutContext = createContext<GeoFeedHomeLayoutValue | null>(null);

/** Filters column for homepage desktop sticky grid — must be inside GeoFeed with homeComposedLayout. */
export function FeedFiltersPanel() {
  const ctx = useContext(GeoFeedHomeLayoutContext);
  return ctx?.filtersPanel ?? null;
}

/** Feed column for homepage desktop sticky grid — must be inside GeoFeed with homeComposedLayout. */
export function FeedContent() {
  const ctx = useContext(GeoFeedHomeLayoutContext);
  return ctx?.feedContent ?? null;
}

export default function GeoFeed({
  initialInspiratieItems = [],
  initialFeedChip,
  initialFeedCategory,
  initialFeedPlace,
  enableMobileFeedInserts = false,
  renderMobileFeedInsert,
  visibleHomePromotionIds = [],
  feedColumnLayout = 'default',
  homeComposedLayout = false,
  children,
}: GeoFeedProps) {
  const { t, language } = useTranslation();
  const { data: session, status: sessionStatus } = useSession();
  const createFlow = useCreateFlow();
  const { profile: bootstrapProfile, ensureProfile, status: bootstrapStatus } =
    useUserBootstrap();
  const [items, setItems] = useState<FeedItem[]>([]);
  /** Last raw API payload count (audit). */
  const [apiRawItems, setApiRawItems] = useState<Record<string, unknown>[]>(
    []
  );
  const [lastFeedApiDebug, setLastFeedApiDebug] = useState<Record<
    string,
    unknown
  > | null>(null);
  /** Geocoded viewer from /api/feed filters (manual place search). */
  const [apiViewerCoords, setApiViewerCoords] = useState<ViewerCoords | null>(
    null
  );
  const [inspiratiePool, setInspiratiePool] = useState<InspirationItem[]>(
    initialInspiratieItems
  );
  /**
   * Eerste /api/feed: start op "loading" zodat we geen lege-staat + verkoop-CTA tonen vóór de eerste response
   * (voorkomt flits van oude/verwarrende UI bij startup en houdt client gelijk met neutrale skeleton).
   * Na de eerste fetch schakelt `feedInteractionStartedRef` en blijft gedrag bij filterwijzigingen zoals voorheen.
   */
  const [loading, setLoading] = useState(true);
  const feedInteractionStartedRef = useRef(false);
  const feedRestoredFromCacheRef = useRef(false);
  const [feedHydrated, setFeedHydrated] = useState(false);
  const itemsRef = useRef<FeedItem[]>([]);
  const inspiratiePoolRef = useRef<InspirationItem[]>(initialInspiratieItems);
  const apiViewerCoordsRef = useRef<ViewerCoords | null>(null);
  const nativeFeedRenderMoreRef = useRef(false);
  const [radius, setRadius] = useState(RADIUS_LOCAL_KM);
  const [q, setQ] = useState("");
  const [place, setPlace] = useState(
    () => initialFeedPlace?.trim().slice(0, 200) || ""
  );
  const [baseUrl, setBaseUrl] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationSource, setLocationSource] = useState<
    "gps" | "manual" | "profile" | null
  >(null);
  const [profileLocation, setProfileLocation] = useState<{
    place?: string;
    postcode?: string;
    lat?: number;
    lng?: number;
  } | null>(null);

  const [feedChip, setFeedChip] = useState<FeedChip>(
    initialFeedChip ?? "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "price" | "views" | "distance"
  >("newest");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showFilters, setShowFilters] = useState(false);
  /** Desktop sidebar: refinement collapsed by default. */
  const [sidebarRefineOpen, setSidebarRefineOpen] = useState(false);
  const [showGpsError, setShowGpsError] = useState(false);
  /** Applied filter state — drives API fetch and client-side ranking. */
  const [appliedRadius, setAppliedRadius] = useState(RADIUS_LOCAL_KM);
  const [appliedScope, setAppliedScope] = useState<FeedScope>(
    FEED_SCOPE_NATIONAL
  );
  const [appliedPlace, setAppliedPlace] = useState(
    () => initialFeedPlace?.trim().slice(0, 200) || ""
  );
  const [appliedQ, setAppliedQ] = useState("");
  const [appliedCategory, setAppliedCategory] = useState(() =>
    initialDorpspleinCategoryFromServer(initialFeedCategory)
  );
  const [appliedSortBy, setAppliedSortBy] = useState<
    "newest" | "price" | "views" | "distance"
  >("newest");
  const [appliedSortOrder, setAppliedSortOrder] = useState<"asc" | "desc">(
    "desc"
  );
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("");
  const [appliedPriceRange, setAppliedPriceRange] = useState({
    min: "",
    max: "",
  });
  /** Capacitor: standaard ingeklapt zodat chips + sorteren boven de vouw blijven. */
  const [nativeFeedExtraOpen, setNativeFeedExtraOpen] = useState(false);
  const [mobileFilterSheetOpen, setMobileFilterSheetOpen] = useState(false);
  const [category, setCategory] = useState(() =>
    initialDorpspleinCategoryFromServer(initialFeedCategory)
  );
  const profileLocationLoadedRef = useRef(false);
  const gpsRequestPendingRef = useRef(false);
  const nativeFeedPrefsBootRef = useRef(true);
  const nativeMounted = useIsNativeAppMounted();
  const narrowViewport = useNarrowViewport();
  const [feedLayoutMode, setFeedLayoutMode] = useFeedLayoutMode();
  /** Mobile web (<1024px) or Capacitor shell: compact toolbar + filter sheet. */
  const isMobileFeedUi = nativeMounted || narrowViewport;
  const isDesktopSplit = Boolean(homeComposedLayout && !isMobileFeedUi);
  const [desktopFeedColumns, setDesktopFeedColumns] = useHomeDesktopFeedColumns();
  const effectiveFeedLayoutMode = getEffectiveFeedLayoutMode(
    feedLayoutMode,
    isMobileFeedUi
  );
  /** Smalle browser + native: compacte filter-chips, sort bovenaan, geo onder uitklap. */
  const feedCompactChrome = isMobileFeedUi;
  const filterChrome = feedCompactChrome || isDesktopSplit;
  const showGeoFilters =
    !feedCompactChrome || nativeFeedExtraOpen || isDesktopSplit;
  const [nativeGpsLoading, setNativeGpsLoading] = useState(false);
  const [nativeGpsCoords, setNativeGpsCoords] =
    useState<NativeLocationCoords | null>(null);
  const [nativeGpsError, setNativeGpsError] = useState<string | null>(null);
  const [pushDebugLoading, setPushDebugLoading] = useState(false);
  const [pushDebugStatus, setPushDebugStatus] = useState<string>("—");
  const [pushMaskedToken, setPushMaskedToken] = useState<string | null>(null);
  const [pushDebugError, setPushDebugError] = useState<string | null>(null);
  const [pushLastEvent, setPushLastEvent] = useState<string | null>(null);

  const profileCoords = useMemo(() => {
    const rawLat = profileLocation?.lat ?? bootstrapProfile?.lat;
    const rawLng = profileLocation?.lng ?? bootstrapProfile?.lng;
    if (rawLat == null || rawLng == null) return null;
    const la = Number(rawLat);
    const ln = Number(rawLng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
    return { lat: la, lng: ln };
  }, [
    profileLocation?.lat,
    profileLocation?.lng,
    bootstrapProfile?.lat,
    bootstrapProfile?.lng,
  ]);

  /** Place text for national/international viewer geocoding (distance labels). */
  const viewerPlaceForApi = useMemo(() => {
    if (appliedScope === FEED_SCOPE_NEARBY) return appliedPlace;
    return (
      appliedPlace.trim() ||
      profileLocation?.place?.trim() ||
      bootstrapProfile?.place?.trim() ||
      ""
    );
  }, [
    appliedScope,
    appliedPlace,
    profileLocation?.place,
    bootstrapProfile?.place,
  ]);

  /** Coords sent as lat/lng query — only when scope is nearby (manual uses geocoded place). */
  const feedCoords = useMemo(() => {
    if (appliedScope !== FEED_SCOPE_NEARBY) return null;
    if (appliedPlace.trim()) return null;
    if (locationSource === "gps" && userLocation) return userLocation;
    if (locationSource === "profile" && profileCoords) return profileCoords;
    if (!locationSource && profileCoords && session?.user?.email) return profileCoords;
    return null;
  }, [
    appliedScope,
    appliedPlace,
    locationSource,
    userLocation,
    profileCoords,
    session?.user?.email,
  ]);

  /** Coords for API distance labels (national/international: no place geocode). */
  const coordsForApiLabels = useMemo((): ViewerCoords | null => {
    if (appliedScope === FEED_SCOPE_NEARBY) return feedCoords;
    if (locationSource === "gps" && userLocation) return userLocation;
    if (profileCoords) return profileCoords;
    return null;
  }, [appliedScope, feedCoords, locationSource, userLocation, profileCoords]);

  /** Viewer coords for client-side distance enrichment and sort. */
  const effectiveViewerForDistance = useMemo((): ViewerCoords | null => {
    if (appliedScope === FEED_SCOPE_NEARBY) {
      if (appliedPlace.trim() && apiViewerCoords) return apiViewerCoords;
      if (feedCoords) return feedCoords;
      return apiViewerCoords;
    }
    if (apiViewerCoords) return apiViewerCoords;
    if (locationSource === "gps" && userLocation) return userLocation;
    if (profileCoords) return profileCoords;
    return null;
  }, [
    appliedScope,
    appliedPlace,
    apiViewerCoords,
    feedCoords,
    locationSource,
    userLocation,
    profileCoords,
  ]);

  const itemsWithDistance = useMemo(
    () => enrichFeedItemsWithDistance(items, effectiveViewerForDistance),
    [items, effectiveViewerForDistance]
  );

  const apiLocationSource = useMemo((): "gps" | "manual" | "profile" | null => {
    if (appliedPlace.trim()) return "manual";
    if (locationSource === "gps" && userLocation) return "gps";
    if (profileCoords && session?.user?.email) {
      if (locationSource === "profile" || locationSource === null) return "profile";
    }
    return locationSource;
  }, [
    appliedPlace,
    locationSource,
    userLocation,
    profileCoords,
    session?.user?.email,
  ]);

  const profileHasCoords =
    bootstrapProfile?.lat != null &&
    bootstrapProfile?.lng != null &&
    Number.isFinite(Number(bootstrapProfile.lat)) &&
    Number.isFinite(Number(bootstrapProfile.lng));

  const profileNeedsCoords =
    !!session?.user &&
    bootstrapStatus === "ready" &&
    !profileHasCoords &&
    !userLocation &&
    !!(bootstrapProfile?.place?.trim() || bootstrapProfile?.postalCode?.trim());

  /** Wacht op sessie + profile-bootstrap zodat eerste fetch niet als anoniem/andere radius loopt. */
  const feedStartupBlocked =
    sessionStatus === "loading" ||
    (!!session?.user && bootstrapStatus === "loading");

  const { coords, loading: locationLoading, error: locationError, supported: locationSupported, getCurrentPosition } =
    useGeolocation({
      // Sneller eerste fix voor afstandssortering; hoge nauwkeurigheid houdt mobiel vaak seconden bezig.
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
      fallbackToManual: false,
      onFallback: () => {},
    });

  useEffect(() => {
    if (sessionStatus === "loading") return;

    type HomePersist = {
      feedChip?: FeedChip;
      radius?: number;
      scope?: string;
      nationalView?: boolean;
      category?: string;
      sortBy?: "newest" | "price" | "views" | "distance";
      sortOrder?: "asc" | "desc";
      searchQuery?: string;
      q?: string;
      place?: string;
      priceMin?: string;
      priceMax?: string;
      showFilters?: boolean;
    };

    const urlLocksChip = initialFeedChip != null;
    const urlLocksCategory =
      initialFeedCategory != null &&
      initialDorpspleinCategoryFromServer(initialFeedCategory) !== "all";
    const urlLocksPlace = Boolean(initialFeedPlace?.trim());

    const persisted = loadFeedSurfaceState<HomePersist>("home");
    if (persisted && typeof persisted === "object") {
      const migrated = migrateHomeFeedPersist(persisted);
      setAppliedScope(migrated.scope);
      if (!urlLocksChip) {
        const fc = migrated.feedChip;
        if (fc === "all" || fc === "sale" || fc === "inspiration") {
          setFeedChip(fc);
        }
      }
      const r = migrated.radius;
      if (typeof r === "number" && r >= 0 && r <= 500) {
        setRadius(r);
        setAppliedRadius(r);
      }
      if (!urlLocksCategory) {
        if (
          typeof migrated.category === "string" &&
          migrated.category.length < 80
        ) {
          setCategory(migrated.category);
          setAppliedCategory(migrated.category);
        }
      }
      const sb = migrated.sortBy;
      if (sb === "newest" || sb === "price" || sb === "views" || sb === "distance") {
        setSortBy(sb);
        setAppliedSortBy(sb);
      }
      const so = migrated.sortOrder;
      if (so === "asc" || so === "desc") {
        setSortOrder(so);
        setAppliedSortOrder(so);
      }
      if (typeof migrated.searchQuery === "string") {
        const sq = migrated.searchQuery.slice(0, 200);
        setSearchQuery(sq);
        setAppliedSearchQuery(sq);
      }
      if (typeof migrated.q === "string") {
        const qq = migrated.q.slice(0, 200);
        setQ(qq);
        setAppliedQ(qq);
      }
      if (!urlLocksPlace) {
        if (typeof migrated.place === "string") {
          const pl = migrated.place.slice(0, 200);
          setPlace(pl);
          setAppliedPlace(pl);
        }
      }
      if (
        typeof migrated.priceMin === "string" ||
        typeof migrated.priceMax === "string"
      ) {
        const nextPrice = {
          min:
            typeof migrated.priceMin === "string"
              ? migrated.priceMin.slice(0, 32)
              : "",
          max:
            typeof migrated.priceMax === "string"
              ? migrated.priceMax.slice(0, 32)
              : "",
        };
        setPriceRange(nextPrice);
        setAppliedPriceRange(nextPrice);
      }
      if (typeof migrated.showFilters === "boolean") {
        setShowFilters(migrated.showFilters);
      }
      trackOnboardingEvent("FEED_STATE_RESTORED", { surface: "home" });
      queueMicrotask(() => {
        nativeFeedPrefsBootRef.current = false;
      });
      return;
    }

    if (!nativeMounted) {
      queueMicrotask(() => {
        nativeFeedPrefsBootRef.current = false;
      });
      return;
    }

    const uid = (session?.user as { id?: string } | undefined)?.id ?? null;
    const p = readNativeFeedPrefs(uid);
    if (!urlLocksChip && p?.feedChip) setFeedChip(p.feedChip);
    if (p?.sortBy) setSortBy(p.sortBy);
    if (p?.sortOrder) setSortOrder(p.sortOrder);
    queueMicrotask(() => {
      nativeFeedPrefsBootRef.current = false;
    });
  }, [nativeMounted, sessionStatus, session?.user, initialFeedChip, initialFeedCategory, initialFeedPlace]);

  useEffect(() => {
    if (initialFeedPlace?.trim()) {
      setLocationSource("manual");
    }
  }, [initialFeedPlace]);

  useEffect(() => {
    if (!nativeMounted || nativeFeedPrefsBootRef.current) return;
    if (sessionStatus === "loading") return;
    const uid = (session?.user as { id?: string } | undefined)?.id ?? null;
    writeNativeFeedPrefs(uid, { feedChip, sortBy, sortOrder });
  }, [
    nativeMounted,
    sessionStatus,
    session?.user,
    feedChip,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    if (feedRestoredFromCacheRef.current) return;
    setInspiratiePool(initialInspiratieItems);
  }, [initialInspiratieItems]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    inspiratiePoolRef.current = inspiratiePool;
  }, [inspiratiePool]);

  useEffect(() => {
    apiViewerCoordsRef.current = apiViewerCoords;
  }, [apiViewerCoords]);

  // Alleen URL-/server-chip toepassen wanneer die expliciet is meegegeven (anders: client restore / persist).
  useEffect(() => {
    if (initialFeedChip != null) setFeedChip(initialFeedChip);
  }, [initialFeedChip]);

  useEffect(() => {
    if (!feedHydrated) return;
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => {
      saveFeedSurfaceState(
        "home",
        migrateHomeFeedPersist({
          feedChip,
          radius: appliedRadius,
          scope: appliedScope,
          category: appliedCategory,
          sortBy: appliedSortBy,
          sortOrder: appliedSortOrder,
          searchQuery: appliedSearchQuery,
          q: appliedQ.trim(),
          place: appliedPlace.trim().slice(0, 200),
          priceMin: appliedPriceRange.min,
          priceMax: appliedPriceRange.max,
          showFilters,
        })
      );
    }, 380);
    return () => window.clearTimeout(t);
  }, [
    feedHydrated,
    feedChip,
    appliedRadius,
    appliedScope,
    appliedCategory,
    appliedSortBy,
    appliedSortOrder,
    appliedSearchQuery,
    appliedQ,
    appliedPlace,
    appliedPriceRange.min,
    appliedPriceRange.max,
    showFilters,
  ]);

  const loadProfileLocation = useCallback(async () => {
    if (!session?.user || profileLocationLoadedRef.current) return;
    profileLocationLoadedRef.current = true;
    const profile = bootstrapProfile ?? (await ensureProfile());
    if (!profile?.lat || !profile?.lng) return;
    const { lat, lng, place: pl, postalCode, address } = profile;
    setProfileLocation({
      place: pl ?? undefined,
      postcode: postalCode ?? undefined,
      lat,
      lng,
    });
    if (locationSource === "gps" || locationSource === "manual") return;
    setLocationSource("profile");
    if (pl || postalCode || address) {
      setPlace((prev) => (prev.trim() ? prev : pl || postalCode || address || ""));
    }
  }, [session?.user, bootstrapProfile, ensureProfile, locationSource]);

  useEffect(() => {
    if (!session?.user) return;

    const run = () => {
      void loadProfileLocation();
    };
    let timer: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    if (typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(run, { timeout: 5000 });
    } else {
      timer = setTimeout(run, 1200);
    }

    return () => {
      if (idleId !== null && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (timer) clearTimeout(timer);
    };
  }, [session?.user, loadProfileLocation]);

  useEffect(() => {
    if (!session?.user || userLocation || locationSource) return;
    if (profileHasCoords) {
      setLocationSource("profile");
    }
  }, [session?.user, userLocation, locationSource, profileHasCoords]);

  const handleUseMyLocation = useCallback(() => {
    if (!locationSupported) return;
    gpsRequestPendingRef.current = true;
    setShowGpsError(false);
    setPlace("");
    getCurrentPosition();
  }, [locationSupported, getCurrentPosition]);

  useEffect(() => {
    if (!gpsRequestPendingRef.current || locationLoading || coords) return;
    if (locationError) {
      gpsRequestPendingRef.current = false;
      setShowGpsError(true);
    }
  }, [coords, locationLoading, locationError]);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    // Geen automatische GPS op homepage: voorkomt lange "Loading" (prompt/timeout) en concurreert niet met eerste feed.
    // Locatie alleen via knop of profiel (ingelogd) / handmatige plaats.
  }, []);

  useEffect(() => {
    if (!(SHOW_CAPACITOR_PUSH_DEBUG && nativeMounted)) return;
    let teardown: (() => Promise<void>) | undefined;
    void setupNativePushDebugListeners({
      onNotificationReceived: ({ title, body }) => {
        const bit = [title, body].filter(Boolean).join(" — ") || "melding";
        setPushLastEvent(`Ontvangen: ${bit.slice(0, 120)}`);
      },
      onActionPerformed: ({ summary }) => {
        setPushLastEvent(`Actie: ${summary.slice(0, 120)}`);
      },
    }).then((fn) => {
      teardown = fn;
    });
    return () => {
      void teardown?.();
    };
  }, [SHOW_CAPACITOR_PUSH_DEBUG, nativeMounted]);

  const runNativePushDebugRegister = useCallback(async () => {
    setPushDebugError(null);
    setPushDebugLoading(true);
    setPushDebugStatus("Bezig met registreren…");
    try {
      const token = await requestAndRegisterNativePush();
      setPushMaskedToken(maskPushTokenForDisplay(token));
      setPushDebugStatus("FCM-token ontvangen…");

      const { Capacitor } = await import("@capacitor/core");
      const platform =
        Capacitor.getPlatform() === "ios" ? "ios" : "android";
      const server = await registerFcmTokenWithServer(
        token,
        platform,
        getOrCreatePushDeviceId(),
        { force: true }
      );
      if (server === "ok") {
        setPushDebugStatus("Token + server geregistreerd");
      } else if (server === "unauthorized") {
        setPushDebugStatus("Token ok; server 401 (niet ingelogd?)");
      } else if (server === "bad_request") {
        setPushDebugStatus("Token ok; server weigerde body (400)");
      } else {
        setPushDebugStatus("Token ok; server-sync mislukt (netwerk?)");
      }
    } catch (e) {
      const msg =
        e instanceof NativePushError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Onbekende fout";
      setPushDebugError(msg);
      setPushDebugStatus(
        e instanceof NativePushError && e.code === "permission_denied"
          ? "Toestemming geweigerd"
          : e instanceof NativePushError && e.code === "unsupported"
            ? "Niet ondersteund"
            : "Registratiefout"
      );
      console.warn("[HomeCheff push] debug register failed", e);
    } finally {
      setPushDebugLoading(false);
    }
  }, []);

  const runNativeGpsTest = useCallback(async () => {
    setNativeGpsError(null);
    setNativeGpsLoading(true);
    try {
      const c = await requestAndGetNativeCurrentPosition({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });
      setNativeGpsCoords(c);
      console.log("[HomeCheff native GPS]", {
        latitude: c.latitude,
        longitude: c.longitude,
        accuracy: c.accuracy,
      });
    } catch (e) {
      const msg =
        e instanceof NativeLocationError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Onbekende fout";
      setNativeGpsError(msg);
      console.warn("[HomeCheff native GPS]", e);
    } finally {
      setNativeGpsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!coords || !gpsRequestPendingRef.current) return;
    gpsRequestPendingRef.current = false;
    setShowGpsError(false);
    setUserLocation(coords);
    setLocationSource("gps");
    setAppliedScope(FEED_SCOPE_NEARBY);
    setAppliedRadius(radius);
    setAppliedPlace("");
    setPlace("");
    setSortBy("distance");
    setSortOrder("asc");
    setAppliedSortBy("distance");
    setAppliedSortOrder("asc");
  }, [coords, radius]);

  useEffect(() => {
    if (locationError && !userLocation && !profileLocation && session?.user) {
      void loadProfileLocation();
    }
  }, [locationError, userLocation, profileLocation, session?.user, loadProfileLocation]);

  const handleScopeChange = useCallback((next: FeedScope) => {
    setAppliedScope(next);
    const defaults = scopeDefaultSort(next);
    setSortBy(defaults.sortBy);
    setSortOrder(defaults.sortOrder);
    setAppliedSortBy(defaults.sortBy);
    setAppliedSortOrder(defaults.sortOrder);
  }, []);

  const handlePlaceInput = (inputPlace: string) => {
    setPlace(inputPlace);
  };

  useEffect(() => {
    if (feedStartupBlocked) return;

    const params = buildGeoFeedApiParams({
      scope: appliedScope,
      radius: appliedRadius,
      q: appliedQ,
      category: appliedCategory,
      lat: coordsForApiLabels?.lat ?? null,
      lng: coordsForApiLabels?.lng ?? null,
      place: viewerPlaceForApi,
      locationSource:
        appliedScope === FEED_SCOPE_NEARBY ? apiLocationSource : null,
    });

    const requestKey = params.toString();

    const cached =
      !feedInteractionStartedRef.current
        ? peekFreshHomeFeedReturnCache() ??
          readHomeFeedReturnCache(requestKey)
        : readHomeFeedReturnCache(requestKey);
    if (cached) {
      feedRestoredFromCacheRef.current = true;
      setItems(cached.items as FeedItem[]);
      setInspiratiePool(cached.inspiratiePool);
      if (cached.apiViewerCoords) {
        setApiViewerCoords(cached.apiViewerCoords);
      }
      if (cached.nativeFeedRenderMore) {
        setNativeFeedRenderMore(true);
        nativeFeedRenderMoreRef.current = true;
      }
      setLoading(false);
      feedInteractionStartedRef.current = true;
      setFeedHydrated(true);
      return;
    }

    if (feedInteractionStartedRef.current) {
      setLoading(true);
    }

    const feedUrl = `/api/feed?${params.toString()}`;
    const startupInspParallel = !feedInteractionStartedRef.current;

    if (process.env.NODE_ENV === "development") {
      console.log("[GeoFeed feed-fetch]", {
        ts: new Date().toISOString(),
        startupInspParallel,
        requestKey,
        feedUrl,
      });
    }

    const ac = new AbortController();
    let cancelled = false;

    const run = async () => {
      try {
        const feedP = fetch(feedUrl, { signal: ac.signal, cache: "no-store" });
        const inspCategory = buildInspiratieCategoryParam(appliedCategory);
        const inspParams = new URLSearchParams({
          take: "48",
          sortBy: "newest",
          category: inspCategory,
        });
        if (appliedQ.trim()) {
          inspParams.set("q", appliedQ.trim());
        }
        const inspP = fetch(`/api/inspiratie?${inspParams.toString()}`, {
          signal: ac.signal,
          cache: "no-store",
        });

        const [feedRes, inspRes] = await Promise.all([feedP, inspP]);

        if (cancelled) return;

        if (feedRes.ok) {
          let data: { items?: unknown; statsPreview?: Record<string, unknown> };
          try {
            data = await feedRes.json();
          } catch {
            reportAppDiagnostic('feed_fetch_json_invalid', { surface: 'feed' });
            if (cancelled) return;
            setItems([]);
            return;
          }
          if (cancelled) return;
          const rawItems = (data.items || []) as Record<string, unknown>[];
          setApiRawItems(rawItems);
          const previewRaw = data.statsPreview as
            | Record<string, unknown>
            | undefined;
          if (previewRaw && typeof previewRaw === "object") {
            for (const [uid, row] of Object.entries(previewRaw)) {
              const payload = coerceUserStatsPayload(row);
              if (payload) seedCachedUserStats(uid, payload);
            }
          }
          if (process.env.NODE_ENV === "development") {
            console.log("[GeoFeed feed-fetch] response", {
              count: rawItems.length,
              statsPreviewKeys:
                previewRaw && typeof previewRaw === "object"
                  ? Object.keys(previewRaw).length
                  : 0,
              firstTitles: rawItems.slice(0, 10).map((r) => ({
                id: String(r.id ?? ""),
                title: String((r.title as string) ?? "").slice(0, 60),
              })),
            });
          }
          if (process.env.NODE_ENV === "development") {
            const debugRaw = data.debug as Record<string, unknown> | undefined;
            if (debugRaw) {
              setLastFeedApiDebug(debugRaw);
              console.log("[GeoFeed feed-fetch debug]", debugRaw);
            }
          } else {
            setLastFeedApiDebug(
              (data.debug as Record<string, unknown> | undefined) ?? null
            );
          }
          const filtersRaw = data.filters as
            | { lat?: number | null; lng?: number | null }
            | undefined;
          const viewerFromApi =
            filtersRaw?.lat != null &&
            filtersRaw?.lng != null &&
            Number.isFinite(Number(filtersRaw.lat)) &&
            Number.isFinite(Number(filtersRaw.lng))
              ? { lat: Number(filtersRaw.lat), lng: Number(filtersRaw.lng) }
              : null;
          if (viewerFromApi) {
            setApiViewerCoords(viewerFromApi);
          } else if (!appliedPlace.trim()) {
            setApiViewerCoords(null);
          }
          const viewerForDistance =
            appliedScope === FEED_SCOPE_NEARBY
              ? viewerFromApi ?? feedCoords ?? null
              : effectiveViewerForDistance;

          const normalized: FeedItem[] = [];
          rawItems.forEach((r, index) => {
            const item = safeNormalizeFeedItem(r, index);
            if (!item) return;
            normalized.push(enrichFeedItemDistance(item, viewerForDistance));
          });
          let dropped = 0;
          const valid = normalized.filter((row) => {
            if (row.id?.trim()) return true;
            dropped += 1;
            return false;
          });
          if (dropped > 0) {
            reportAppDiagnostic('feed_items_filtered', { dropped });
          }
          setItems(valid);
        }

        if (inspRes.ok) {
          let inspData: { items?: unknown };
          try {
            inspData = await inspRes.json();
          } catch {
            reportAppDiagnostic('feed_inspiration_json_invalid', {});
            if (cancelled) return;
            return;
          }
          if (cancelled) return;
          if (Array.isArray(inspData.items) && inspData.items.length > 0) {
            const pool = inspData.items as InspirationItem[];
            const withIds = pool.filter(
              (it) => it && typeof it.id === 'string' && it.id.trim() !== ''
            );
            if (withIds.length < pool.length) {
              reportAppDiagnostic('feed_items_filtered', {
                dropped: pool.length - withIds.length,
              });
            }
            setInspiratiePool(withIds);
          }
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        console.error("Error fetching items:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
          feedInteractionStartedRef.current = true;
          setFeedHydrated(true);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      ac.abort();
      const snapshot = itemsRef.current;
      if (snapshot.length > 0) {
        saveHomeFeedReturnCache({
          requestKey,
          items: snapshot,
          inspiratiePool: inspiratiePoolRef.current,
          apiViewerCoords: apiViewerCoordsRef.current,
          nativeFeedRenderMore: nativeFeedRenderMoreRef.current,
        });
      }
    };
  }, [
    feedStartupBlocked,
    appliedRadius,
    appliedScope,
    appliedQ,
    appliedPlace,
    coordsForApiLabels?.lat,
    coordsForApiLabels?.lng,
    viewerPlaceForApi,
    apiLocationSource,
    appliedCategory,
    effectiveViewerForDistance?.lat,
    effectiveViewerForDistance?.lng,
  ]);

  const activeFeedItems = useMemo(
    () => itemsWithDistance.filter(isVisible),
    [itemsWithDistance]
  );

  const apiInspirationIds = useMemo(
    () => new Set(inspiratiePool.map((i) => i.id)),
    [inspiratiePool]
  );

  const saleCandidates = useMemo(
    () => activeFeedItems.filter((item) => isMarketplaceSaleItem(item)),
    [activeFeedItems]
  );

  const feedOnlyInspiration = useMemo(
    () =>
      activeFeedItems.filter(
        (item) =>
          !isMarketplaceSaleItem(item) &&
          !apiInspirationIds.has(item.id)
      ),
    [activeFeedItems, apiInspirationIds]
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const saleN = countMarketplaceSaleItems(activeFeedItems);
    const inspN = activeFeedItems.length - saleN;
    console.log("[GeoFeed] classificatie", {
      total: activeFeedItems.length,
      sale: saleN,
      inspiration: inspN,
      sample: activeFeedItems.slice(0, 10).map((item) => ({
        id: item.id,
        title: item.title,
        priceCents: item.priceCents,
        orderMethod: item.orderMethod,
        feedSource: item.feedSource,
        classifiedAs: isMarketplaceSaleItem(item) ? "sale" : "inspiration",
        href: getFeedItemHref(item),
      })),
    });
  }, [activeFeedItems]);

  const saleAfterSearchCount = useMemo(
    () =>
      countSaleAfterSearch(
        saleCandidates,
        appliedSearchQuery,
        matchesSearch
      ),
    [saleCandidates, appliedSearchQuery]
  );

  const categoryEnum = useMemo(
    () =>
      appliedCategory !== "all"
        ? feedVerticalSlugToCategoryEnum(appliedCategory)
        : null,
    [appliedCategory]
  );

  const filteredSaleBase = useMemo(() => {
    const qn = appliedSearchQuery.trim();
    return saleCandidates.filter((item) => {
      if (!matchesSearch(item, qn)) return false;
      if (categoryEnum) {
        const itemCat = getDiscoveryLegacyVerticalCategory(item);
        if (itemCat !== categoryEnum) return false;
      }
      return matchesFeedClientPriceRange(
        item,
        appliedPriceRange.min,
        appliedPriceRange.max
      );
    });
  }, [saleCandidates, appliedSearchQuery, appliedPriceRange, categoryEnum]);

  const hasViewerCoordsForSort = effectiveViewerForDistance != null;

  const locationFilterActive =
    appliedScope === FEED_SCOPE_NEARBY && appliedRadius > 0;

  const { local: localSalePool, fallback: saleFallbackPool } = useMemo(
    () =>
      partitionSaleItemsByRadius(filteredSaleBase, appliedRadius, {
        scope: appliedScope,
      }),
    [filteredSaleBase, appliedRadius, appliedScope]
  );

  const salePoolForRanking = locationFilterActive
    ? localSalePool
    : filteredSaleBase;

  const useSmartRanking =
    feedChip !== "sale" &&
    appliedScope === FEED_SCOPE_NATIONAL &&
    appliedSortBy === "newest" &&
    appliedSortOrder === "desc" &&
    !locationFilterActive;

  /** Vaste tijd per dataset zodat score-ranking niet verschuift tussen re-renders. */
  const rankNowMs = useMemo(
    () => Date.now(),
    [salePoolForRanking]
  );

  const filteredApiInspiration = useMemo(() => {
    const qn = appliedSearchQuery.trim();
    return inspiratiePool.filter((item) => {
      if (categoryEnum) {
        const itemCat = getDiscoveryLegacyVerticalCategory(item);
        if (itemCat !== categoryEnum) return false;
      }
      return matchesSearchTextQuery(toSearchableListingRecord(item), qn);
    });
  }, [inspiratiePool, appliedSearchQuery, categoryEnum]);

  const filteredFeedInspiration = useMemo(() => {
    const qn = appliedSearchQuery.trim();
    return feedOnlyInspiration.filter((item) => {
      if (categoryEnum) {
        const itemCat = getDiscoveryLegacyVerticalCategory(item);
        if (itemCat !== categoryEnum) return false;
      }
      return matchesSearch(item, qn);
    });
  }, [feedOnlyInspiration, appliedSearchQuery, categoryEnum]);

  const inspirationSlots = useMemo(() => {
    const built = buildInspSlots(filteredApiInspiration, filteredFeedInspiration);
    if (appliedSortBy === "newest" && appliedSortOrder === "desc") return built;
    return sortInspirationSlots(built, appliedSortBy, appliedSortOrder);
  }, [
    filteredApiInspiration,
    filteredFeedInspiration,
    appliedSortBy,
    appliedSortOrder,
  ]);

  const rankingResult = useMemo(() => {
    if (!useSmartRanking) {
      const ordered = sortFeedSaleItems(
        salePoolForRanking,
        appliedSortBy,
        appliedSortOrder
      );
      return {
        orderedForMix: ordered,
        orderedSaleOnly: ordered,
        topForMix: null as TopThreeSalesResult<FeedItem> | null,
      };
    }

    const ranked = rankSalesByScore(salePoolForRanking, rankNowMs);
    const coldOrdered = applyColdStartScoreOrder(ranked);
    const scoreById = new Map(ranked.map((r) => [r.item.id, r.score]));

    const topForMix = pickTopThreeSales(coldOrdered, scoreById, {
      allowInspirationAtThird: true,
      hasInspiration: inspirationSlots.length > 0,
    });
    const topSaleOnly = pickTopThreeSales(coldOrdered, scoreById, {
      allowInspirationAtThird: false,
      hasInspiration: false,
    });

    return {
      orderedForMix: coldOrdered,
      orderedSaleOnly: orderedSaleOnlyFromTop(coldOrdered, topSaleOnly),
      topForMix,
    };
  }, [
    salePoolForRanking,
    rankNowMs,
    useSmartRanking,
    appliedSortBy,
    appliedSortOrder,
    inspirationSlots.length,
  ]);

  const sortedSales = rankingResult.orderedSaleOnly;

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (feedChip === "inspiration") return;
    console.table(
      sortedSales.slice(0, 12).map((item) => ({
        cardTitle: item.title?.slice(0, 40) ?? "",
        place: item.place,
        distanceKm: item.distanceKm ?? null,
        renderedLocationLine: feedLocationLine(item, t),
      }))
    );
  }, [sortedSales, feedChip, t]);

  const mixedRows = useMemo(() => {
    if (!useSmartRanking) {
      return interleaveSalesAndInspiration(
        rankingResult.orderedForMix,
        inspirationSlots
      );
    }
    return interleaveWithSmartPrefix(
      rankingResult.orderedForMix,
      inspirationSlots,
      rankingResult.topForMix
    );
  }, [
    useSmartRanking,
    rankingResult.orderedForMix,
    rankingResult.topForMix,
    inspirationSlots,
  ]);

  const displayRows = useMemo(() => {
    if (feedChip === "sale") {
      return sortedSales.map((item) => ({
        row: "sale" as const,
        item,
      }));
    }
    if (feedChip === "inspiration") {
      return inspirationSlots.map((slot) => ({
        row: "insp" as const,
        slot,
      }));
    }
    return mixedRows;
  }, [feedChip, sortedSales, inspirationSlots, mixedRows]);

  const displayCount = displayRows.length;

  useEffect(() => {
    logFeedSaleVisibilityAudit({
      apiItems: apiRawItems,
      normalizedItems: items,
      visibleItems: activeFeedItems,
      saleCandidates,
      saleAfterSearch: saleAfterSearchCount,
      saleAfterSearchAndPrice: filteredSaleBase.length,
      saleAfterScopeFilter: salePoolForRanking.length,
      finalVisibleSaleCards:
        feedChip === "sale"
          ? sortedSales.length
          : displayRows.filter((r) => r.row === "sale").length,
      feedChip,
      appliedScope,
      appliedRadius,
      appliedPlace,
      appliedCategory,
      appliedSearchQuery,
      appliedPriceRange,
      sortBy: appliedSortBy,
      sortOrder: appliedSortOrder,
      locationFilterActive,
      apiDebug: lastFeedApiDebug,
    });
  }, [
    apiRawItems,
    items,
    activeFeedItems,
    saleCandidates,
    saleAfterSearchCount,
    filteredSaleBase.length,
    salePoolForRanking.length,
    sortedSales.length,
    displayRows,
    feedChip,
    appliedScope,
    appliedRadius,
    appliedPlace,
    appliedCategory,
    appliedSearchQuery,
    appliedPriceRange,
    appliedSortBy,
    appliedSortOrder,
    locationFilterActive,
    lastFeedApiDebug,
  ]);

  /**
   * Native: false = toon eerst 2 kaarten; true = volledige lijst (na idle).
   * Web: nativeMounted is altijd false tot mount — slice wordt niet gebruikt.
   */
  const [nativeFeedRenderMore, setNativeFeedRenderMore] = useState(false);

  useEffect(() => {
    if (!nativeMounted) {
      setNativeFeedRenderMore(false);
      nativeFeedRenderMoreRef.current = false;
      return;
    }
    setNativeFeedRenderMore(false);
    nativeFeedRenderMoreRef.current = false;
    let cancelled = false;
    const finish = () => {
      if (!cancelled) {
        setNativeFeedRenderMore(true);
        nativeFeedRenderMoreRef.current = true;
      }
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(finish, { timeout: 450 }) as unknown as number;
    } else {
      timeoutId = window.setTimeout(finish, 100);
    }
    return () => {
      cancelled = true;
      if (idleId != null && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [nativeMounted, displayRows]);

  const feedRowsToRender = useMemo(() => {
    if (!nativeMounted) return displayRows;
    if (nativeFeedRenderMore) return displayRows;
    return displayRows.slice(0, 2);
  }, [nativeMounted, nativeFeedRenderMore, displayRows]);

  const applyFilters = useCallback(() => {
    const trimmedPlace = place.trim();
    setAppliedRadius(radius);
    setAppliedPlace(trimmedPlace);
    setAppliedQ(q);
    setAppliedCategory(category);
    setAppliedSortBy(sortBy);
    setAppliedSortOrder(sortOrder);
    setAppliedSearchQuery(searchQuery);
    setAppliedPriceRange({ ...priceRange });

    const hasNewLocation =
      trimmedPlace !== "" ||
      (userLocation != null && locationSource === "gps") ||
      (profileCoords != null && locationSource === "profile");

    if (appliedScope === FEED_SCOPE_NEARBY && hasNewLocation && radius > 0) {
      setSortBy("distance");
      setSortOrder("asc");
      setAppliedSortBy("distance");
      setAppliedSortOrder("asc");
    }

    if (trimmedPlace) {
      setLocationSource("manual");
      setUserLocation(null);
      setShowGpsError(false);
    } else if (userLocation && locationSource === "gps") {
      setLocationSource("gps");
    } else if (profileCoords) {
      setLocationSource("profile");
      setUserLocation(null);
    } else {
      setLocationSource(null);
      setUserLocation(null);
    }
  }, [
    appliedScope,
    radius,
    place,
    q,
    category,
    sortBy,
    sortOrder,
    searchQuery,
    priceRange,
    userLocation,
    locationSource,
    profileCoords,
  ]);

  const clearViewerLocation = useCallback(() => {
    const profilePlace =
      profileLocation?.place ?? profileLocation?.postcode ?? "";
    setUserLocation(null);
    setAppliedPlace("");
    setShowGpsError(false);
    if (profileCoords) {
      setLocationSource("profile");
      setPlace(profilePlace);
    } else {
      setLocationSource(null);
      setPlace("");
    }
  }, [profileCoords, profileLocation]);

  const resetDraftFilters = useCallback(() => {
    setRadius(appliedRadius);
    setPlace(appliedPlace);
    setQ(appliedQ);
    setCategory(appliedCategory);
    setSortBy(appliedSortBy);
    setSortOrder(appliedSortOrder);
    setSearchQuery(appliedSearchQuery);
    setPriceRange({ ...appliedPriceRange });
  }, [
    appliedScope,
    appliedRadius,
    appliedPlace,
    appliedQ,
    appliedCategory,
    appliedSortBy,
    appliedSortOrder,
    appliedSearchQuery,
    appliedPriceRange,
  ]);

  const filtersDirty = useMemo(
    () =>
      radius !== appliedRadius ||
      place !== appliedPlace ||
      q !== appliedQ ||
      category !== appliedCategory ||
      sortBy !== appliedSortBy ||
      sortOrder !== appliedSortOrder ||
      searchQuery !== appliedSearchQuery ||
      priceRange.min !== appliedPriceRange.min ||
      priceRange.max !== appliedPriceRange.max,
    [
      radius,
      appliedRadius,
      place,
      appliedPlace,
      q,
      appliedQ,
      category,
      appliedCategory,
      sortBy,
      appliedSortBy,
      sortOrder,
      appliedSortOrder,
      searchQuery,
      appliedSearchQuery,
      priceRange.min,
      priceRange.max,
      appliedPriceRange.min,
      appliedPriceRange.max,
    ]
  );

  const handleSort = (field: FeedClientSortField) => {
    const farthest = scopeUsesFarthestFirstSort(appliedScope);
    const nextOrder =
      sortBy === field
        ? sortOrder === "asc"
          ? "desc"
          : "asc"
        : field === "distance"
          ? farthest
            ? "desc"
            : "asc"
          : "desc";
    setSortBy(field);
    setSortOrder(nextOrder);
    setAppliedSortBy(field);
    setAppliedSortOrder(nextOrder);
  };

  const clearFilters = () => {
    resetDraftFilters();
  };

  const effectiveLocationSource = useMemo((): "manual" | "gps" | "profile" | null => {
    if (appliedPlace.trim()) return "manual";
    if (locationSource === "gps" && userLocation) return "gps";
    if (profileCoords && session?.user?.email) return "profile";
    return null;
  }, [appliedPlace, locationSource, userLocation, profileCoords, session?.user?.email]);

  const activeLocationChip = useMemo(() => {
    if (effectiveLocationSource === "manual" && appliedPlace.trim()) {
      return t("feed.searchingInPlace", { place: appliedPlace.trim() });
    }
    if (effectiveLocationSource === "gps") {
      return t("feed.activeLocationGps");
    }
    if (effectiveLocationSource === "profile") {
      const label =
        profileLocation?.place ??
        profileLocation?.postcode ??
        bootstrapProfile?.place ??
        bootstrapProfile?.postalCode ??
        null;
      return label
        ? t("feed.profileLocationChip", { place: String(label) })
        : t("feed.activeLocationProfile");
    }
    return null;
  }, [
    effectiveLocationSource,
    appliedPlace,
    profileLocation,
    bootstrapProfile?.place,
    bootstrapProfile?.postalCode,
    t,
  ]);

  const showViewerLocationHint =
    !activeLocationChip && !locationLoading && !profileNeedsCoords;

  const distanceSortEnabled =
    appliedScope === FEED_SCOPE_INTERNATIONAL || hasViewerCoordsForSort;

  const sortOptions = useMemo(
    () =>
      [
        { id: "newest" as const, label: t("filters.sortNewest") },
        { id: "price" as const, label: t("common.price") },
        { id: "views" as const, label: t("feed.sortViews") },
        ...(distanceSortEnabled
          ? [
              {
                id: "distance" as const,
                label: scopeUsesFarthestFirstSort(appliedScope)
                  ? t("feed.sortFarthestFirst")
                  : t("feed.sortDistanceFirst"),
              },
            ]
          : []),
      ] as const,
    [language, t, distanceSortEnabled, appliedScope]
  );

  useEffect(() => {
    if (!distanceSortEnabled && sortBy === "distance") {
      setSortBy("newest");
      setSortOrder("desc");
      setAppliedSortBy("newest");
      setAppliedSortOrder("desc");
    }
  }, [distanceSortEnabled, sortBy]);

  const nativeGeoFilterActive = useMemo(
    () =>
      appliedPlace.trim() !== "" ||
      appliedQ.trim() !== "" ||
      appliedCategory !== "all" ||
      appliedSearchQuery.trim() !== "" ||
      appliedPriceRange.min !== "" ||
      appliedPriceRange.max !== "" ||
      showFilters,
    [
      appliedPlace,
      appliedQ,
      appliedCategory,
      appliedSearchQuery,
      appliedPriceRange.min,
      appliedPriceRange.max,
      showFilters,
    ]
  );

  const mobileToolbarFilterActive = useMemo(
    () =>
      appliedPlace.trim() !== "" ||
      appliedQ.trim() !== "" ||
      appliedCategory !== "all" ||
      appliedSearchQuery.trim() !== "" ||
      appliedPriceRange.min !== "" ||
      appliedPriceRange.max !== "",
    [
      appliedPlace,
      appliedQ,
      appliedCategory,
      appliedSearchQuery,
      appliedPriceRange.min,
      appliedPriceRange.max,
    ]
  );

  const chipBtn = (active: boolean) =>
    `${filterChrome ? "px-3 py-1.5 rounded-lg text-xs shrink-0" : "px-4 py-2 rounded-lg text-sm"} font-semibold transition-colors ${
      active
        ? "bg-primary-brand text-white shadow-sm"
        : "bg-[#faf8f4] text-gray-700 hover:bg-primary-50 border border-gray-200/80"
    }`;

  const sortRowEl = (
    <div
      className={
        feedCompactChrome
          ? "flex items-center gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5"
          : "flex flex-wrap items-center gap-2 mb-4"
      }
    >
      <span className="text-sm font-medium text-gray-700 shrink-0">
        {t("common.sortBy")}:
      </span>
      {sortOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => handleSort(option.id)}
          className={`shrink-0 px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
            sortBy === option.id
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {option.label}
          {sortBy === option.id &&
            (sortOrder === "asc" ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            ))}
        </button>
      ))}
    </div>
  );

  const feedPanelPad = filterChrome
    ? "p-3 space-y-3"
    : "p-4 sm:p-5 space-y-5";
  const feedSectionBorder = filterChrome
    ? "border-t border-gray-200 pt-3"
    : "border-t border-gray-200 pt-5";
  const filterLabelClass = filterChrome
    ? "block text-sm font-semibold mb-1"
    : "block text-base font-semibold mb-1";
  const filterInputClass = filterChrome
    ? "w-full min-w-0 px-3 py-2 rounded-xl border border-primary/40 text-sm placeholder-gray-400"
    : "w-full min-w-0 px-4 py-3 rounded-xl border border-primary/40 text-lg placeholder-gray-400";

  const resultCountEl = (
    <div
      className={
        feedCompactChrome
          ? "text-xs text-gray-500 mt-1.5"
          : "text-sm text-gray-500 mt-2"
      }
    >
      {displayCount}{" "}
      {displayCount === 1
        ? t("feed.resultSingular")
        : t("feed.resultPlural")}
      {appliedSearchQuery
        ? t("feed.filteredByQuery", { query: appliedSearchQuery })
        : ""}
    </div>
  );

  const emptyRadiusNoLocal =
    feedChip === "sale" &&
    appliedScope === FEED_SCOPE_NEARBY &&
    locationFilterActive &&
    !loading &&
    feedHydrated &&
    sortedSales.length === 0 &&
    filteredSaleBase.length > 0;

  const emptySale =
    !emptyRadiusNoLocal &&
    feedChip === "sale" &&
    !loading &&
    feedHydrated &&
    filteredSaleBase.length === 0;
  const emptyInsp =
    feedChip === "inspiration" &&
    !loading &&
    feedHydrated &&
    inspirationSlots.length === 0;
  const emptyAll =
    !emptyRadiusNoLocal &&
    feedChip === "all" &&
    !loading &&
    feedHydrated &&
    displayCount === 0;

  const handleWidenRadius = () => {
    const next = Math.min(100, nextWiderFeedRadiusKm(appliedRadius));
    setRadius(next);
    setAppliedRadius(next);
  };

  const handleViewNationalScope = () => {
    handleScopeChange(FEED_SCOPE_NATIONAL);
  };

  const feedQuickCreateIntent = useMemo(
    () => resolvedVerticalModeIntent(category, feedChip),
    [category, feedChip]
  );

  const feedResultsContainerClass = useMemo(() => {
    if (!isMobileFeedUi) {
      if (isDesktopSplit) {
        return homeDesktopFeedGridClass(desktopFeedColumns);
      }
      if (feedColumnLayout === "home-main") {
        return "grid grid-cols-2 gap-4 xl:gap-5";
      }
      return "grid sm:grid-cols-2 md:grid-cols-3 gap-4";
    }
    if (effectiveFeedLayoutMode === "discover") {
      return "grid grid-cols-2 gap-2.5 sm:gap-3 hc-discover-feed-grid";
    }
    return `flex flex-col gap-4 hc-feed-cards-column${
      nativeMounted ? " hc-native-feed-cards-column" : ""
    }`;
  }, [
    isMobileFeedUi,
    isDesktopSplit,
    desktopFeedColumns,
    effectiveFeedLayoutMode,
    nativeMounted,
    feedColumnLayout,
  ]);

  const useDiscoverGridTiles =
    isMobileFeedUi && effectiveFeedLayoutMode === "discover";

  const viewModeChipsEl = (
    <>
      <p
        className={
          filterChrome
            ? "text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5"
            : "text-xs font-medium text-gray-500 uppercase tracking-wide mb-2"
        }
      >
        {t("feed.viewModeLabel")}
      </p>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <button
          type="button"
          className={chipBtn(feedChip === "all")}
          onClick={() => setFeedChip("all")}
        >
          {t("filters.all")}
        </button>
        <button
          type="button"
          className={chipBtn(feedChip === "sale")}
          onClick={() => setFeedChip("sale")}
        >
          {t("feed.chipSale")}
        </button>
        <button
          type="button"
          className={chipBtn(feedChip === "inspiration")}
          onClick={() => setFeedChip("inspiration")}
        >
          {t("feed.chipInspiration")}
        </button>
      </div>
    </>
  );

  const filterPanelBodyEl = showGeoFilters ? (
          <>
            <div className={feedSectionBorder}>
              <p
                className={
                  feedCompactChrome
                    ? "text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2"
                    : "text-xs font-medium text-gray-500 uppercase tracking-wide mb-3"
                }
              >
                {t("feed.scopeLabel")}
              </p>
              <div className="grid grid-cols-1 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 mb-4">
                {(
                  [
                    [FEED_SCOPE_NEARBY, "feed.scopeNearby"],
                    [FEED_SCOPE_NATIONAL, "feed.scopeNational"],
                    [FEED_SCOPE_INTERNATIONAL, "feed.scopeInternational"],
                  ] as const
                ).map(([id, labelKey]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleScopeChange(id)}
                    className={`rounded-lg px-2.5 py-2 text-xs font-semibold text-left transition-colors ${
                      appliedScope === id
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    aria-pressed={appliedScope === id}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
              {appliedScope === FEED_SCOPE_INTERNATIONAL ? (
                <p className="mb-3 text-[10px] text-gray-500 leading-snug">
                  {t("feed.scopeInternationalHint")}
                </p>
              ) : null}
            </div>
            <div className={feedSectionBorder}>
              <p
                className={
                  feedCompactChrome
                    ? "text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2"
                    : "text-xs font-medium text-gray-500 uppercase tracking-wide mb-3"
                }
              >
                {t("feed.locationSectionLabel")}
              </p>
              {!feedCoords && !appliedPlace.trim() && !locationLoading ? (
                <p className="mb-3 text-xs text-gray-600 leading-relaxed rounded-lg border border-primary-brand/10 bg-primary-50/40 px-3 py-2">
                  {t("feed.viewerLocationHint")}
                </p>
              ) : null}
              {profileNeedsCoords ? (
                <p className="mb-3 text-xs text-amber-800 leading-relaxed rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2">
                  {t("feed.completeProfileLocationHint")}
                </p>
              ) : null}
              <div className="space-y-4">
                <div>
                  <label className={filterLabelClass}>
                    {t("common.place")}
                  </label>
                  <div
                    className={
                      isDesktopSplit
                        ? "grid grid-cols-1 gap-2"
                        : "grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2 md:items-stretch"
                    }
                  >
                    <input
                      value={place}
                      onChange={(e) => handlePlaceInput(e.target.value)}
                      className={filterInputClass}
                      placeholder={t("common.typePlaceOrPostcode")}
                      autoComplete="postal-code"
                    />
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={locationLoading || !locationSupported}
                      aria-busy={locationLoading}
                      className="inline-flex w-full md:w-auto md:min-w-[11rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-primary-brand/30 bg-white px-4 py-3 text-sm font-semibold text-primary-brand hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2
                            className="h-4 w-4 shrink-0 animate-spin"
                            aria-hidden
                          />
                          <span>{t("common.loading")}</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                          <span>
                            {isDesktopSplit
                              ? t("feed.useMyLocationShort")
                              : t("feed.useMyLocation")}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                  {locationError && locationSource === "gps" ? (
                    <p className="mt-1.5 text-xs text-red-600">
                      {t("common.locationCouldNotBeDetermined")}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
                  <div className="min-w-[120px] sm:w-28">
                    <label className={filterLabelClass}>
                      {t("feed.radiusLabel")}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={radius}
                      disabled={appliedScope !== FEED_SCOPE_NEARBY}
                      onChange={(e) =>
                        setRadius(
                          Math.max(0, Math.min(100, Number(e.target.value)))
                        )
                      }
                      className={filterInputClass}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {appliedScope === FEED_SCOPE_NEARBY
                        ? t("feed.radiusFilterHint")
                        : t("feed.radiusNotUsedHint")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 min-w-0">
                    <label className={filterLabelClass}>
                      {t("common.search")}
                    </label>
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className={filterInputClass}
                      placeholder={t("common.searchPlaceholder")}
                    />
                  </div>
                  <div className="min-w-[140px] sm:w-48">
                    <label className={filterLabelClass}>
                      {t("common.category")}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={filterInputClass}
                    >
                      <option value="all">{t("common.allCategories")}</option>
                      <option value="cheff">
                        {t("feed.categoryVerticalCheff")}
                      </option>
                      <option value="garden">
                        {t("feed.categoryVerticalGarden")}
                      </option>
                      <option value="designer">
                        {t("feed.categoryVerticalDesigner")}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="w-full mt-2">
                {locationError && locationSource !== "profile" && (
                  <p className="text-xs text-red-600 mb-2">
                    ⚠️ {t("common.locationCouldNotBeDetermined")}
                  </p>
                )}
                {userLocation && (
                  <p className="text-xs text-green-600 mb-2">
                    {locationSource === "gps" &&
                      t("common.locationUsingGps")}
                    {locationSource === "profile" &&
                      t("common.locationUsingProfile")}
                    {locationSource === "manual" &&
                      t("common.locationUsingManual")}
                  </p>
                )}
                {!userLocation && !place && (
                  <p className="text-xs text-gray-500">
                    {t("feed.placeOrGpsHint")}
                  </p>
                )}
                {place && (
                  <p className="text-xs text-blue-600">
                    📍 {t("common.searchIn")}: {place}
                  </p>
                )}
                {SHOW_NATIVE_GPS_DEBUG_UI && nativeMounted && (
                  <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-700">
                    <p className="font-medium text-gray-800 mb-2">
                      Native app: Capacitor-GPS (test, wijzigt de feed nog niet)
                    </p>
                    <button
                      type="button"
                      onClick={() => void runNativeGpsTest()}
                      disabled={nativeGpsLoading}
                      className="px-3 py-2 rounded-lg border border-primary/40 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {nativeGpsLoading
                        ? t("common.loading")
                        : "Vraag native locatie op"}
                    </button>
                    {nativeGpsCoords && (
                      <p className="mt-2 text-green-700 font-mono break-all">
                        lat {nativeGpsCoords.latitude.toFixed(6)}, lng{" "}
                        {nativeGpsCoords.longitude.toFixed(6)}, accuracy{" "}
                        {nativeGpsCoords.accuracy != null
                          ? `${Math.round(nativeGpsCoords.accuracy)} m`
                          : "—"}
                      </p>
                    )}
                    {nativeGpsError && (
                      <p className="mt-2 text-red-600">{nativeGpsError}</p>
                    )}
                  </div>
                )}
                {SHOW_CAPACITOR_PUSH_DEBUG && nativeMounted && (
                  <div className="mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-xs text-gray-700">
                    <p className="font-medium text-gray-800 mb-2">
                      Native push test
                    </p>
                    <button
                      type="button"
                      onClick={() => void runNativePushDebugRegister()}
                      disabled={pushDebugLoading}
                      className="px-3 py-2 rounded-lg border border-primary/40 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {pushDebugLoading
                        ? t("common.loading")
                        : "Vraag push toestemming"}
                    </button>
                    <p className="mt-2 text-gray-600">
                      Status:{" "}
                      <span className="font-medium">{pushDebugStatus}</span>
                    </p>
                    {pushMaskedToken && (
                      <p className="mt-1 font-mono text-green-700 break-all">
                        Token: {pushMaskedToken}
                      </p>
                    )}
                    {pushDebugError && (
                      <p className="mt-2 text-red-600">{pushDebugError}</p>
                    )}
                    {pushLastEvent && (
                      <p className="mt-2 text-blue-700">{pushLastEvent}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {filtersDirty ? (
                <p className="text-xs text-amber-700 w-full sm:flex-1 sm:min-w-[12rem]">
                  {t("feed.filtersPendingHint")}
                </p>
              ) : null}
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors touch-manipulation"
              >
                {t("feed.applyFilters")}
              </button>
              <button
                type="button"
                onClick={resetDraftFilters}
                disabled={!filtersDirty}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
              >
                {t("feed.resetFiltersDraft")}
              </button>
            </div>

            <div className={feedSectionBorder}>
              <p
                className={
                  feedCompactChrome
                    ? "text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-2"
                    : "text-xs font-medium text-gray-500 uppercase tracking-wide mb-3"
                }
              >
                {t("feed.refineSectionLabel")}
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("common.searchInProductsSimple")}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {t("common.filters")}
                </button>
              </div>

              {!filterChrome && sortRowEl}

              {showFilters && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("common.priceEuro")}
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) =>
                            setPriceRange((prev) => ({
                              ...prev,
                              min: e.target.value,
                            }))
                          }
                          placeholder={t("common.min")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) =>
                            setPriceRange((prev) => ({
                              ...prev,
                              max: e.target.value,
                            }))
                          }
                          placeholder={t("filters.maxPricePlaceholder")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                      >
                        <Filter className="w-4 h-4" />
                        {t("filters.clearFilters")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : null;

  const mobileFilterSheetEl =
    feedCompactChrome && !isDesktopSplit ? (
      <FeedMobileFilterSheet
        open={mobileFilterSheetOpen}
        onClose={() => setMobileFilterSheetOpen(false)}
        t={t}
        place={place}
        onPlaceChange={handlePlaceInput}
        onUseMyLocation={handleUseMyLocation}
        locationLoading={locationLoading}
        locationSupported={locationSupported}
        locationError={showGpsError ? locationError : null}
        activeLocationChip={activeLocationChip}
        onClearLocation={clearViewerLocation}
        showLocationHint={showViewerLocationHint}
        profileNeedsCoords={profileNeedsCoords}
        appliedScope={appliedScope}
        radius={radius}
        onRadiusChange={(n) => setRadius(Math.max(0, Math.min(100, n)))}
        q={q}
        onQChange={setQ}
        category={category}
        onCategoryChange={setCategory}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        filtersDirty={filtersDirty}
        onApply={() => {
          applyFilters();
          setMobileFilterSheetOpen(false);
        }}
        onClear={() => {
          clearFilters();
          setMobileFilterSheetOpen(false);
        }}
      />
    ) : null;

  const filterCardEl = isDesktopSplit ? (
    <div
      className={`hc-dorpsplein-card bg-white/90 rounded-2xl border border-primary-brand/10 shadow-sm ${feedPanelPad}`}
    >
      <FeedSidebarFilters
        t={t}
        place={place}
        onPlaceChange={handlePlaceInput}
        onUseMyLocation={handleUseMyLocation}
        locationLoading={locationLoading}
        locationSupported={locationSupported}
        locationError={showGpsError ? locationError : null}
        activeLocationChip={activeLocationChip}
        onClearLocation={clearViewerLocation}
        showLocationHint={showViewerLocationHint}
        profileNeedsCoords={profileNeedsCoords}
        scope={appliedScope}
        onScopeChange={handleScopeChange}
        radius={radius}
        onRadiusChange={(n) => setRadius(Math.max(0, Math.min(100, n)))}
        distanceSortEnabled={distanceSortEnabled}
        q={q}
        onQChange={setQ}
        category={category}
        onCategoryChange={setCategory}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        sortOptions={sortOptions}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        refineOpen={sidebarRefineOpen}
        onRefineOpenChange={setSidebarRefineOpen}
        filtersDirty={filtersDirty}
        onApply={applyFilters}
        onResetDraft={resetDraftFilters}
      />
    </div>
  ) : feedCompactChrome ? (
    <>
      <FeedMobileToolbar
        t={t}
        feedChip={feedChip}
        onFeedChipChange={setFeedChip}
        appliedScope={appliedScope}
        onScopeChange={handleScopeChange}
        sortBy={sortBy}
        sortOrder={sortOrder}
        sortOptions={sortOptions}
        onSort={handleSort}
        onOpenFilters={() => setMobileFilterSheetOpen(true)}
        filterActive={mobileToolbarFilterActive}
        feedLayoutMode={feedLayoutMode}
        onFeedLayoutModeChange={setFeedLayoutMode}
      />
      {mobileFilterSheetEl}
      {resultCountEl}
    </>
  ) : (
    <div
      className={`hc-dorpsplein-card bg-white/90 rounded-2xl border border-primary-brand/10 shadow-sm ${feedPanelPad}`}
    >
      <>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            {t("feed.discoverFiltersHeading")}
          </h2>
          <p className="text-sm text-gray-600 mt-1 mb-3">{t("feed.chipSectionIntro")}</p>
          {viewModeChipsEl}
          {feedQuickCreateIntent ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  createFlow.openCreateFlowWithIntent(feedQuickCreateIntent)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 touch-manipulation"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                {t(quickCreateLabelKey(feedQuickCreateIntent))}
              </button>
            </div>
          ) : null}
        </div>
        {sortRowEl}
        {filterPanelBodyEl}
        {resultCountEl}
      </>
    </div>
  );

  const desktopFeedHeaderEl = isDesktopSplit ? (
    <div className="hc-dorpsplein-card bg-white/90 rounded-2xl border border-primary-brand/10 shadow-sm p-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{viewModeChipsEl}</div>
        <FeedDesktopColumnToggle
          columns={desktopFeedColumns}
          onChange={setDesktopFeedColumns}
        />
      </div>
      {feedQuickCreateIntent ? (
        <button
          type="button"
          onClick={() =>
            createFlow.openCreateFlowWithIntent(feedQuickCreateIntent)
          }
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 touch-manipulation"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {t(quickCreateLabelKey(feedQuickCreateIntent))}
        </button>
      ) : null}
      {resultCountEl}
    </div>
  ) : null;

  const feedResultsBlock = loading ? (
        <div className="space-y-4" aria-hidden>
          <div className="h-48 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
          <div className="h-32 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
        </div>
      ) : emptyRadiusNoLocal ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          <p className="text-base font-semibold text-gray-900">
            {t("feed.emptyRadiusTitle", { radius: appliedRadius })}
          </p>
          <p className="mt-1">
            {t("feed.emptyRadiusBody")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleWidenRadius}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t("feed.emptyRadiusWiden")}
            </button>
            <button
              type="button"
              onClick={handleViewNationalScope}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t("feed.emptyRadiusViewAll")}
            </button>
          </div>
        </div>
      ) : emptySale ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          <p className="text-base font-semibold text-gray-900">
            {appliedScope === FEED_SCOPE_NEARBY
              ? t("feed.emptySaleTitle")
              : t("feed.emptyNationalTitle")}
          </p>
          <p className="mt-1">
            {appliedScope === FEED_SCOPE_NEARBY
              ? t("feed.emptySaleBody")
              : t("feed.emptyNationalBody")}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {t("emptyState.noResultsHint")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                createFlow.openCreateFlowWithIntent(
                  createIntentForSaleOrInspiration(category, "sale")
                )
              }
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t(
                quickCreateLabelKey(
                  createIntentForSaleOrInspiration(category, "sale")
                )
              )}
            </button>
            <button
              type="button"
              onClick={() => setFeedChip("inspiration")}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t("feed.emptySaleViewInspiration")}
            </button>
          </div>
          {filteredApiInspiration.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                {t("feed.emptyInspirationForYou")}
              </p>
              <div className="space-y-1">
                {filteredApiInspiration.slice(0, 5).map((item) => (
                  <a
                    key={item.id}
                    href={inspirationDetailHrefApi(item)}
                    className="block text-sm text-emerald-700 hover:underline"
                  >
                    {item.title || t("feed.altInspiration")}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : emptyInsp ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          <p className="text-base font-semibold text-gray-900">
            {t("feed.emptyInspTitle")}
          </p>
          <p className="mt-1">{t("feed.emptyInspBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                createFlow.openCreateFlowWithIntent(
                  createIntentForSaleOrInspiration(category, "inspiration")
                )
              }
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t(
                quickCreateLabelKey(
                  createIntentForSaleOrInspiration(category, "inspiration")
                )
              )}
            </button>
          </div>
        </div>
      ) : emptyAll ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          <p className="text-base font-semibold text-gray-900">
            {t("feed.emptyAllTitle")}
          </p>
          <p className="mt-1">{t("feed.emptyAllBody")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setFeedChip("all");
              }}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t("filters.clearFilters")}
            </button>
            <button
              type="button"
              onClick={() =>
                createFlow.openCreateFlowWithIntent(
                  createIntentForSaleOrInspiration(category, "inspiration")
                )
              }
              className="inline-flex items-center rounded-lg border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              {t(
                quickCreateLabelKey(
                  createIntentForSaleOrInspiration(category, "inspiration")
                )
              )}
            </button>
          </div>
        </div>
      ) : (
        <div
          key={isMobileFeedUi ? effectiveFeedLayoutMode : "desktop"}
          className={feedResultsContainerClass}
        >
          {(() => {
            const nodes: ReactNode[] = [];
            let feedItemIndex = 0;
            const isLoggedIn = !!session?.user;
            const insertedPromoIds = new Set<HomePromotionId>();

            const pushInsertIfNeeded = () => {
              if (!enableMobileFeedInserts || !isMobileFeedUi) return;
              const insertId = resolveHomeMobileInsert(feedItemIndex, isLoggedIn);
              if (!insertId || !renderMobileFeedInsert) return;
              const insertEl = renderMobileFeedInsert(insertId);
              if (!insertEl) return;
              const promoId = parsePromoInsertId(insertId);
              if (promoId) insertedPromoIds.add(promoId);
              nodes.push(
                <div key={`feed-insert-${feedItemIndex}-${insertId}`} className="contents">
                  {insertEl}
                </div>
              );
            };

            feedRowsToRender.forEach((row, idx) => {
              if (row.row === "sale") {
                const card = toCardItem(row.item, effectiveViewerForDistance);
                if (useDiscoverGridTiles) {
                  nodes.push(
                    <DiscoverGridTile
                      key={`sale-${row.item.id}-${idx}`}
                      item={card}
                      href={feedMarketplaceItemHref(card)}
                      kind="sale"
                      t={t}
                    />
                  );
                } else {
                  nodes.push(
                    <FeedMarketplaceCard
                      key={`sale-${row.item.id}-${idx}`}
                      item={card}
                      baseUrl={baseUrl}
                      t={t}
                      variant="sale"
                    />
                  );
                }
                feedItemIndex += 1;
                pushInsertIfNeeded();
                return;
              }
              const slot = row.slot;
              if (slot.kind === "api") {
                if (useDiscoverGridTiles) {
                  const card = inspirationApiToCardItem(slot.item);
                  nodes.push(
                    <DiscoverGridTile
                      key={`insp-api-${slot.item.id}-${idx}`}
                      item={card}
                      href={inspirationDetailHrefApi(slot.item)}
                      kind="inspiration"
                      t={t}
                    />
                  );
                } else {
                  nodes.push(
                    <FeedMarketplaceCard
                      key={`insp-api-${slot.item.id}-${idx}`}
                      item={inspirationApiToCardItem(slot.item)}
                      baseUrl={baseUrl}
                      t={t}
                      variant="inspiration-api"
                      inspirationApiItem={slot.item}
                    />
                  );
                }
              } else {
                const card = toCardItem(slot.item, effectiveViewerForDistance);
                if (useDiscoverGridTiles) {
                  nodes.push(
                    <DiscoverGridTile
                      key={`insp-feed-${slot.item.id}-${idx}`}
                      item={card}
                      href={feedMarketplaceItemHref(card)}
                      kind="inspiration"
                      t={t}
                    />
                  );
                } else {
                  nodes.push(
                    <FeedMarketplaceCard
                      key={`insp-feed-${slot.item.id}-${idx}`}
                      item={card}
                      baseUrl={baseUrl}
                      t={t}
                      variant="inspiration-feed"
                    />
                  );
                }
              }
              feedItemIndex += 1;
              pushInsertIfNeeded();
            });

            const trailingInsertId = resolveHomeMobileTrailingPromo(
              feedItemIndex,
              insertedPromoIds,
              visibleHomePromotionIds
            );
            if (trailingInsertId && renderMobileFeedInsert) {
              const trailingEl = renderMobileFeedInsert(trailingInsertId);
              if (trailingEl) {
                nodes.push(
                  <div key={`feed-insert-trailing-${trailingInsertId}`} className="contents">
                    {trailingEl}
                  </div>
                );
              }
            }

            return nodes;
          })()}
        </div>
      );

  if (homeComposedLayout && isMobileFeedUi) {
    return null;
  }

  if (isDesktopSplit) {
    const feedContent = (
      <>
        {desktopFeedHeaderEl}
        {feedResultsBlock}
      </>
    );

    if (homeComposedLayout && children) {
      return (
        <GeoFeedHomeLayoutContext.Provider
          value={{ filtersPanel: filterCardEl, feedContent }}
        >
          {children}
        </GeoFeedHomeLayoutContext.Provider>
      );
    }

    return (
      <>
        <div id="homecheff-feed" className="lg:hidden space-y-4">
          {filterCardEl}
          {feedResultsBlock}
        </div>
        <aside className="hidden lg:block sticky top-20 z-[1] self-start max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden pb-3">
          {filterCardEl}
        </aside>
        <div
          id="homecheff-feed-desktop"
          className="hidden lg:block min-w-0 space-y-4 self-start hc-home-feed-grid"
        >
          {feedContent}
        </div>
      </>
    );
  }

  return (
    <div id="homecheff-feed" className="space-y-4">
      {filterCardEl}
      {feedResultsBlock}
    </div>
  );
}
