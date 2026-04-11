"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Filter, ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import {
  FeedSaleCard,
  FeedInspirationCardFeed,
  FeedInspirationCardApi,
  inspirationDetailHrefApi,
} from "@/components/feed/GeoFeedCards";
import type { GeoFeedCardItem } from "@/components/feed/GeoFeedCards";
import {
  pickPrimaryImageUrl,
  pickPrimaryVideoUrl,
} from "@/components/feed/feedMedia";
import {
  classifyFeedItem,
  getFeedItemHref,
} from "@/components/feed/feedItemClassification";
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

type FeedItem = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
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
  ownerId?: string | null;
  category?: string | null;
  sellerUserId?: string | null;
  sellerName?: string | null;
  sellerUsername?: string | null;
  sellerAvatar?: string | null;
  sellerDisplayFullName?: boolean | null;
  sellerDisplayNameOption?: string | null;
};

type FeedChip = "all" | "sale" | "inspiration";

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
  const category =
    raw.category != null ? String(raw.category) : null;

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

  return {
    id: String(raw.id ?? ""),
    title: (raw.title as string) ?? null,
    description: (raw.description as string) ?? null,
    priceCents,
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
    lat: raw.lat != null ? Number(raw.lat) : null,
    lng: raw.lng != null ? Number(raw.lng) : null,
    photo,
    videoUrl,
    videoThumbnail,
    createdAt,
    distanceKm:
      raw.distanceKm != null ? Number(raw.distanceKm) : undefined,
    viewCount:
      raw.viewCount != null ? Number(raw.viewCount) : undefined,
    propsCount:
      raw.propsCount != null ? Number(raw.propsCount) : undefined,
  };
}

function isVisible(item: FeedItem) {
  return item.isActive !== false;
}

function matchesSearch(
  title: string | null,
  description: string | null,
  q: string
) {
  if (!q.trim()) return true;
  const n = q.toLowerCase();
  return (
    (title && title.toLowerCase().includes(n)) ||
    (description && description.toLowerCase().includes(n)) ||
    false
  );
}

function sortSales(
  list: FeedItem[],
  sortBy: "newest" | "price" | "views" | "distance",
  sortOrder: "asc" | "desc"
) {
  return [...list].sort((a, b) => {
    let aValue: number;
    let bValue: number;
    switch (sortBy) {
      case "newest":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case "price":
        aValue = a.priceCents || 0;
        bValue = b.priceCents || 0;
        break;
      case "views":
        aValue = a.viewCount || 0;
        bValue = b.viewCount || 0;
        break;
      case "distance":
        aValue = a.distanceKm ?? Infinity;
        bValue = b.distanceKm ?? Infinity;
        break;
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
    }
    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });
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
    return tb - ta;
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

function toCardItem(it: FeedItem): GeoFeedCardItem {
  return {
    id: it.id,
    title: it.title,
    description: it.description,
    priceCents: it.priceCents,
    type: it.type,
    isRecipe: it.isRecipe,
    isInspiration: it.isInspiration,
    deliveryMode: it.deliveryMode,
    place: it.place,
    photo: it.photo,
    videoUrl: it.videoUrl,
    videoThumbnail: it.videoThumbnail,
    distanceKm: it.distanceKm,
    viewCount: it.viewCount,
    propsCount: it.propsCount,
    ownerId: it.ownerId,
    category: it.category,
    sellerUserId: it.sellerUserId,
    sellerName: it.sellerName,
    sellerUsername: it.sellerUsername,
    sellerAvatar: it.sellerAvatar,
    sellerDisplayFullName: it.sellerDisplayFullName,
    sellerDisplayNameOption: it.sellerDisplayNameOption,
  };
}

type GeoFeedProps = {
  initialInspiratieItems?: InspirationItem[];
  /** Optioneel: startfilter vanuit URL (bv. `/?feed=inspiration`) of server searchParams. */
  initialFeedChip?: FeedChip;
};

export default function GeoFeed({
  initialInspiratieItems = [],
  initialFeedChip,
}: GeoFeedProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [inspiratiePool, setInspiratiePool] = useState<InspirationItem[]>(
    initialInspiratieItems
  );
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(25);
  const [q, setQ] = useState("");
  const [place, setPlace] = useState("");
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
  const [category, setCategory] = useState("all");

  const { coords, loading: locationLoading, error: locationError, supported: locationSupported, getCurrentPosition } =
    useGeolocation({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000,
      fallbackToManual: false,
      onFallback: () => {},
    });

  useEffect(() => {
    setInspiratiePool(initialInspiratieItems);
  }, [initialInspiratieItems]);

  useEffect(() => {
    if (initialFeedChip != null) setFeedChip(initialFeedChip);
  }, [initialFeedChip]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch("/api/inspiratie?take=48&sortBy=newest");
        if (!res.ok || cancel) return;
        const data = await res.json();
        if (data.items?.length && !cancel) {
          setInspiratiePool(data.items);
        }
      } catch {
        /* keep initial/server items */
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    const loadProfileLocation = async () => {
      if (!session?.user) return;
      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const userData = await response.json();
          if (userData.lat && userData.lng) {
            const { lat, lng, place: pl, postcode, address } = userData;
            setProfileLocation({
              place: pl,
              postcode,
              lat,
              lng,
            });
            setUserLocation({ lat, lng });
            setLocationSource("profile");
            if (pl || postcode || address) {
              setPlace(pl || postcode || address || "");
            }
          }
        }
      } catch (error) {
        console.error("Failed to load profile location:", error);
      }
    };
    loadProfileLocation();
  }, [session?.user]);

  useEffect(() => {
    setBaseUrl(window.location.origin);
    if (locationSupported && !coords && !locationLoading) {
      getCurrentPosition();
    }
  }, [locationSupported, coords, locationLoading, getCurrentPosition]);

  useEffect(() => {
    if (coords) {
      setUserLocation(coords);
      setLocationSource("gps");
    }
  }, [coords]);

  useEffect(() => {
    const fetchUserProfileLocation = async () => {
      if (
        locationError &&
        !userLocation &&
        !profileLocation &&
        session?.user
      ) {
        try {
          const response = await fetch("/api/user/me");
          if (response.ok) {
            const userData = await response.json();
            if (userData.lat && userData.lng) {
              const { lat, lng, place: userPlace, postcode, address } =
                userData;
              setProfileLocation({
                place: userPlace,
                postcode,
                lat,
                lng,
              });
              setUserLocation({ lat, lng });
              setLocationSource("profile");
              if (userPlace || postcode || address) {
                setPlace(userPlace || postcode || address || "");
              }
            }
          }
        } catch (error) {
          console.error("Failed to load profile location as fallback:", error);
        }
      }
    };
    fetchUserProfileLocation();
  }, [locationError, userLocation, profileLocation, session?.user]);

  const handlePlaceInput = async (inputPlace: string) => {
    if (!inputPlace.trim()) {
      setPlace("");
      return;
    }
    setPlace(inputPlace);
    setLocationSource("manual");
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (place.trim()) {
        params.set("place", place.trim());
      } else if (userLocation) {
        params.set("lat", String(userLocation.lat));
        params.set("lng", String(userLocation.lng));
        params.set("radius", String(radius));
      }
      if (q.trim()) params.set("q", q.trim());
      if (category && category !== "all") params.set("vertical", category);
      try {
        const res = await fetch(`/api/feed?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const rawItems = (data.items || []) as Record<string, unknown>[];
          setItems(rawItems.map((r) => normalizeFeedItem(r)));
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [radius, q, place, userLocation, locationSource, category]);

  const activeFeedItems = useMemo(
    () => items.filter(isVisible),
    [items]
  );

  const apiInspirationIds = useMemo(
    () => new Set(inspiratiePool.map((i) => i.id)),
    [inspiratiePool]
  );

  const saleCandidates = useMemo(
    () => activeFeedItems.filter((item) => classifyFeedItem(item) === "sale"),
    [activeFeedItems]
  );

  const feedOnlyInspiration = useMemo(
    () =>
      activeFeedItems.filter(
        (item) =>
          classifyFeedItem(item) === "inspiration" &&
          !apiInspirationIds.has(item.id)
      ),
    [activeFeedItems, apiInspirationIds]
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const saleN = activeFeedItems.filter((i) => classifyFeedItem(i) === "sale")
      .length;
    const inspN = activeFeedItems.filter(
      (i) => classifyFeedItem(i) === "inspiration"
    ).length;
    console.log("[GeoFeed] classificatie", {
      total: activeFeedItems.length,
      sale: saleN,
      inspiration: inspN,
      sample: activeFeedItems.slice(0, 10).map((item) => ({
        id: item.id,
        title: item.title,
        priceCents: item.priceCents,
        type: item.type,
        classifiedAs: classifyFeedItem(item),
        href: getFeedItemHref(item),
      })),
    });
  }, [activeFeedItems]);

  const filteredSaleBase = useMemo(() => {
    const qn = searchQuery.trim();
    return saleCandidates.filter((item) => {
      if (!matchesSearch(item.title, item.description, qn)) return false;
      const minOk =
        !priceRange.min ||
        (item.priceCents || 0) >= parseFloat(priceRange.min) * 100;
      const maxOk =
        !priceRange.max ||
        (item.priceCents || 0) <= parseFloat(priceRange.max) * 100;
      return minOk && maxOk;
    });
  }, [saleCandidates, searchQuery, priceRange]);

  const useSmartRanking = sortBy === "newest" && sortOrder === "desc";

  const filteredApiInspiration = useMemo(() => {
    const qn = searchQuery.trim();
    return inspiratiePool.filter((item) =>
      matchesSearch(item.title, item.description, qn)
    );
  }, [inspiratiePool, searchQuery]);

  const filteredFeedInspiration = useMemo(() => {
    const qn = searchQuery.trim();
    return feedOnlyInspiration.filter((item) =>
      matchesSearch(item.title, item.description, qn)
    );
  }, [feedOnlyInspiration, searchQuery]);

  const inspirationSlots = useMemo(
    () => buildInspSlots(filteredApiInspiration, filteredFeedInspiration),
    [filteredApiInspiration, filteredFeedInspiration]
  );

  const rankingResult = useMemo(() => {
    if (!useSmartRanking) {
      const ordered = sortSales(filteredSaleBase, sortBy, sortOrder);
      return {
        orderedForMix: ordered,
        orderedSaleOnly: ordered,
        topForMix: null as TopThreeSalesResult<FeedItem> | null,
      };
    }

    const nowMs = Date.now();
    const ranked = rankSalesByScore(filteredSaleBase, nowMs);
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
    filteredSaleBase,
    useSmartRanking,
    sortBy,
    sortOrder,
    inspirationSlots.length,
  ]);

  const sortedSales = rankingResult.orderedSaleOnly;

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

  const handleSort = (field: "newest" | "price" | "views" | "distance") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPriceRange({ min: "", max: "" });
    setSortBy("newest");
    setSortOrder("desc");
    setCategory("all");
  };

  const chipBtn = (active: boolean) =>
    `px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active
        ? "bg-emerald-600 text-white shadow-sm"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`;

  const emptySale =
    feedChip === "sale" && !loading && sortedSales.length === 0;
  const emptyInsp =
    feedChip === "inspiration" && !loading && inspirationSlots.length === 0;
  const emptyAll = feedChip === "all" && !loading && displayCount === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end bg-white/60 rounded-xl p-4 border border-gray-200">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-base font-semibold mb-1">
            {t("common.place")}
          </label>
          <input
            value={place}
            onChange={(e) => handlePlaceInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg placeholder-gray-400"
            placeholder={t("common.typePlaceOrPostcode")}
          />
        </div>
        <div className="min-w-[120px]">
          <label className="block text-base font-semibold mb-1">
            {t("common.radius")} (km)
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={radius}
            onChange={(e) =>
              setRadius(
                Math.max(1, Math.min(100, Number(e.target.value)))
              )
            }
            className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block text-base font-semibold mb-1">
            {t("common.search")}
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg placeholder-gray-400"
            placeholder={t("common.searchPlaceholder")}
          />
        </div>
        <div className="min-w-[140px]">
          <label className="block text-base font-semibold mb-1">
            {t("common.category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg"
          >
            <option value="all">{t("common.allCategories")}</option>
            <option value="cheff">🍳 Chef</option>
            <option value="garden">🌱 Garden</option>
            <option value="designer">🎨 Designer</option>
          </select>
        </div>
        <div className="min-w-[120px]">
          <label className="block text-base font-semibold mb-1">
            {t("common.location")}
          </label>
          <button
            onClick={getCurrentPosition}
            disabled={locationLoading || !locationSupported}
            className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {locationLoading ? "⏳" : coords ? "📍" : "🌍"}
            {locationLoading
              ? t("common.loading")
              : coords
                ? t("common.gps")
                : t("common.location")}
          </button>
        </div>
        <div className="w-full">
          {locationError && locationSource !== "profile" && (
            <p className="text-xs text-red-600 mb-2">
              ⚠️ Locatie kon niet worden bepaald
            </p>
          )}
          {userLocation && (
            <p className="text-xs text-green-600 mb-2">
              {locationSource === "gps" && "✅ Jouw locatie wordt gebruikt"}
              {locationSource === "profile" &&
                "📍 Profiel locatie wordt gebruikt"}
              {locationSource === "manual" &&
                "📍 Handmatige locatie wordt gebruikt"}
            </p>
          )}
          {!userLocation && !place && (
            <p className="text-xs text-gray-500">
              {locationSupported
                ? t("common.getLocation")
                : t("common.typePlaceOrPostcode")}
            </p>
          )}
          {place && (
            <p className="text-xs text-blue-600">
              📍 {t("common.searchIn")}: {place}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white/60 rounded-xl p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-3">
          Ontdek wat mensen aanbieden en wat anderen inspireert.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={chipBtn(feedChip === "all")}
            onClick={() => setFeedChip("all")}
          >
            Alles
          </button>
          <button
            type="button"
            className={chipBtn(feedChip === "sale")}
            onClick={() => setFeedChip("sale")}
          >
            Te koop
          </button>
          <button
            type="button"
            className={chipBtn(feedChip === "inspiration")}
            onClick={() => setFeedChip("inspiration")}
          >
            Inspiratie
          </button>
        </div>
      </div>

      <div className="bg-white/60 rounded-xl p-4 border border-gray-200">
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
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t("common.filters")}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">
            {t("common.sortBy")}:
          </span>
          {(
            [
              { id: "newest", label: "Nieuwste" },
              { id: "price", label: t("common.price") },
              { id: "views", label: "Weergaven" },
              { id: "distance", label: "Afstand" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              onClick={() => handleSort(option.id)}
              className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition-colors ${
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
                    placeholder={t("product.maxStock")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Filter className="w-4 h-4" />
                  Wis alle filters
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500 mt-2">
          {displayCount}{" "}
          {displayCount === 1 ? "resultaat" : "resultaten"}
          {searchQuery && ` · Gefilterd op: "${searchQuery}"`}
        </div>
      </div>

      {loading ? (
        <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
      ) : emptySale ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          <p className="text-base font-semibold text-gray-900">
            Nog geen aanbod gevonden in jouw buurt
          </p>
          <p className="mt-1">
            Wees de eerste die iets aanbiedt of bekijk inspiratie.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {t("emptyState.noResultsHint")}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateFlow}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Start met verkopen
            </button>
            <button
              type="button"
              onClick={() => setFeedChip("inspiration")}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Bekijk inspiratie
            </button>
          </div>
          {filteredApiInspiration.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Inspiratie voor jou
              </p>
              <div className="space-y-1">
                {filteredApiInspiration.slice(0, 5).map((item) => (
                  <a
                    key={item.id}
                    href={inspirationDetailHrefApi(item)}
                    className="block text-sm text-emerald-700 hover:underline"
                  >
                    {item.title || "Inspiratie"}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : emptyInsp ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          <p className="text-base font-semibold text-gray-900">
            Nog geen inspiratie gevonden
          </p>
          <p className="mt-1">
            Deel een recept, idee of voorbeeld en inspireer anderen.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openCreateFlow}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Deel inspiratie
            </button>
          </div>
        </div>
      ) : emptyAll ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          <p className="text-base font-semibold text-gray-900">
            Niets gevonden met deze filters
          </p>
          <p className="mt-1">
            Probeer andere zoektermen of bekijk alles zonder filter.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setFeedChip("all");
              }}
              className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Filters wissen
            </button>
            <button
              type="button"
              onClick={openCreateFlow}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Start met verkopen
            </button>
            <button
              type="button"
              onClick={openCreateFlow}
              className="inline-flex items-center rounded-lg border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Deel inspiratie
            </button>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {displayRows.map((row, idx) => {
            if (row.row === "sale") {
              return (
                <FeedSaleCard
                  key={`sale-${row.item.id}-${idx}`}
                  item={toCardItem(row.item)}
                  baseUrl={baseUrl}
                  t={t}
                />
              );
            }
            const slot = row.slot;
            if (slot.kind === "api") {
              return (
                <FeedInspirationCardApi
                  key={`insp-api-${slot.item.id}-${idx}`}
                  item={slot.item}
                  t={t}
                />
              );
            }
            return (
              <FeedInspirationCardFeed
                key={`insp-feed-${slot.item.id}-${idx}`}
                item={toCardItem(slot.item)}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
