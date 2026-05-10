"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Filter,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";
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
  sellerBadges?: AuthorBadgeChip[];
};

type FeedChip = "all" | "sale" | "inspiration";

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
  feedChip: FeedChip
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

  const sellerBadgesRaw = raw.sellerBadges;
  const sellerBadges = Array.isArray(sellerBadgesRaw)
    ? (sellerBadgesRaw as AuthorBadgeChip[]).filter(
        (b) => b && typeof b.key === 'string' && typeof b.name === 'string' && typeof b.icon === 'string'
      )
    : undefined;

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
    sellerBadges: sellerBadges?.length ? sellerBadges : undefined,
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
    if (aValue !== bValue) {
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    }
    return sortOrder === "asc"
      ? a.id.localeCompare(b.id)
      : b.id.localeCompare(a.id);
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
    sellerBadges: it.sellerBadges,
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
  const { t, language } = useTranslation();
  const { data: session, status: sessionStatus } = useSession();
  const createFlow = useCreateFlow();
  const { profile: bootstrapProfile, ensureProfile, status: bootstrapStatus } =
    useUserBootstrap();
  const [items, setItems] = useState<FeedItem[]>([]);
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
  const [feedHydrated, setFeedHydrated] = useState(false);
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
  /** Capacitor: standaard ingeklapt zodat chips + sorteren boven de vouw blijven. */
  const [nativeFeedExtraOpen, setNativeFeedExtraOpen] = useState(false);
  const [category, setCategory] = useState("all");
  const profileLocationLoadedRef = useRef(false);
  const nativeFeedPrefsBootRef = useRef(true);
  const nativeMounted = useIsNativeAppMounted();
  const narrowViewport = useNarrowViewport();
  /** Smalle browser + native: compacte filter-chips, sort bovenaan, geo onder uitklap. */
  const feedCompactChrome = nativeMounted || narrowViewport;
  const [nativeGpsLoading, setNativeGpsLoading] = useState(false);
  const [nativeGpsCoords, setNativeGpsCoords] =
    useState<NativeLocationCoords | null>(null);
  const [nativeGpsError, setNativeGpsError] = useState<string | null>(null);
  const [pushDebugLoading, setPushDebugLoading] = useState(false);
  const [pushDebugStatus, setPushDebugStatus] = useState<string>("—");
  const [pushMaskedToken, setPushMaskedToken] = useState<string | null>(null);
  const [pushDebugError, setPushDebugError] = useState<string | null>(null);
  const [pushLastEvent, setPushLastEvent] = useState<string | null>(null);

  /** Coördinaten voor /api/feed: state (GPS/profiel) óf bootstrap-profiel vóór state-update — één query i.p.v. fetch→fetch. */
  const feedCoords = useMemo(() => {
    if (userLocation) return userLocation;
    if (
      session?.user?.email &&
      bootstrapProfile?.lat != null &&
      bootstrapProfile?.lng != null
    ) {
      const la = Number(bootstrapProfile.lat);
      const ln = Number(bootstrapProfile.lng);
      if (Number.isFinite(la) && Number.isFinite(ln)) {
        return { lat: la, lng: ln };
      }
    }
    return null;
  }, [
    userLocation,
    session?.user?.email,
    bootstrapProfile?.lat,
    bootstrapProfile?.lng,
  ]);

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
    if (!nativeMounted || sessionStatus === "loading") return;
    if (initialFeedChip) {
      queueMicrotask(() => {
        nativeFeedPrefsBootRef.current = false;
      });
      return;
    }
    const uid = (session?.user as { id?: string } | undefined)?.id ?? null;
    const p = readNativeFeedPrefs(uid);
    if (p?.feedChip) setFeedChip(p.feedChip);
    if (p?.sortBy) setSortBy(p.sortBy);
    if (p?.sortOrder) setSortOrder(p.sortOrder);
    queueMicrotask(() => {
      nativeFeedPrefsBootRef.current = false;
    });
  }, [nativeMounted, sessionStatus, session?.user, initialFeedChip]);

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
    setInspiratiePool(initialInspiratieItems);
  }, [initialInspiratieItems]);

  // Altijd server/URL-chip volgen: bij terug naar `/` zonder chip moet weer "all" (was: oude chip bleef hangen).
  useEffect(() => {
    setFeedChip(initialFeedChip ?? "all");
  }, [initialFeedChip]);

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
    setUserLocation({ lat, lng });
    setLocationSource("profile");
    if (pl || postalCode || address) {
      setPlace(pl || postalCode || address || "");
    }
  }, [session?.user, bootstrapProfile, ensureProfile]);

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
    if (coords) {
      setUserLocation(coords);
      setLocationSource("gps");
    }
  }, [coords]);

  useEffect(() => {
    if (locationError && !userLocation && !profileLocation && session?.user) {
      void loadProfileLocation();
    }
  }, [locationError, userLocation, profileLocation, session?.user, loadProfileLocation]);

  const handlePlaceInput = async (inputPlace: string) => {
    if (!inputPlace.trim()) {
      setPlace("");
      return;
    }
    setPlace(inputPlace);
    setLocationSource("manual");
  };

  useEffect(() => {
    if (feedStartupBlocked) return;

    const params = new URLSearchParams();
    // Altijd radius meesturen (server default 10 vs client 25 gaf eerder verschillende filters)
    params.set("radius", String(radius));
    // Bij coördinaten: die gebruiken i.p.v. place-tekst (voorkomt tweede fetch na profiel-place + geocode)
    if (locationSource === "manual" && place.trim()) {
      params.set("place", place.trim());
    } else if (feedCoords) {
      params.set("lat", String(feedCoords.lat));
      params.set("lng", String(feedCoords.lng));
    } else if (place.trim()) {
      params.set("place", place.trim());
    }
    if (q.trim()) params.set("q", q.trim());
    if (category && category !== "all") params.set("vertical", category);

    const requestKey = params.toString();

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
        const inspP = startupInspParallel
          ? fetch("/api/inspiratie?take=48&sortBy=newest", {
              signal: ac.signal,
              cache: "no-store",
            })
          : Promise.resolve(null as Response | null);

        const [feedRes, inspRes] = await Promise.all([feedP, inspP]);

        if (cancelled) return;

        if (feedRes.ok) {
          const data = await feedRes.json();
          if (cancelled) return;
          const rawItems = (data.items || []) as Record<string, unknown>[];
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
          setItems(rawItems.map((r) => normalizeFeedItem(r)));
        }

        if (inspRes?.ok) {
          const inspData = await inspRes.json();
          if (cancelled) return;
          if (Array.isArray(inspData.items) && inspData.items.length > 0) {
            setInspiratiePool(inspData.items);
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
    };
  }, [
    feedStartupBlocked,
    radius,
    q,
    place,
    feedCoords?.lat,
    feedCoords?.lng,
    locationSource,
    category,
  ]);

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

  /** Vaste tijd per dataset zodat score-ranking niet verschuift tussen re-renders. */
  const rankNowMs = useMemo(
    () => Date.now(),
    [filteredSaleBase]
  );

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

    const ranked = rankSalesByScore(filteredSaleBase, rankNowMs);
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
    rankNowMs,
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

  /**
   * Native: false = toon eerst 2 kaarten; true = volledige lijst (na idle).
   * Web: nativeMounted is altijd false tot mount — slice wordt niet gebruikt.
   */
  const [nativeFeedRenderMore, setNativeFeedRenderMore] = useState(false);

  useEffect(() => {
    if (!nativeMounted) {
      setNativeFeedRenderMore(false);
      return;
    }
    setNativeFeedRenderMore(false);
    let cancelled = false;
    const finish = () => {
      if (!cancelled) setNativeFeedRenderMore(true);
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

  const sortOptions = useMemo(
    () =>
      [
        { id: "newest" as const, label: t("filters.sortNewest") },
        { id: "price" as const, label: t("common.price") },
        { id: "views" as const, label: t("feed.sortViews") },
        { id: "distance" as const, label: t("feed.sortDistance") },
      ] as const,
    [language, t]
  );

  const nativeGeoFilterActive = useMemo(
    () =>
      place.trim() !== "" ||
      q.trim() !== "" ||
      category !== "all" ||
      searchQuery.trim() !== "" ||
      priceRange.min !== "" ||
      priceRange.max !== "" ||
      showFilters,
    [
      place,
      q,
      category,
      searchQuery,
      priceRange.min,
      priceRange.max,
      showFilters,
    ]
  );

  const chipBtn = (active: boolean) =>
    `${feedCompactChrome ? "px-3 py-1.5 rounded-lg text-xs shrink-0" : "px-4 py-2 rounded-lg text-sm"} font-semibold transition-colors ${
      active
        ? "bg-emerald-600 text-white shadow-sm"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

  const feedPanelPad = feedCompactChrome ? "p-3 space-y-3" : "p-4 sm:p-5 space-y-5";
  const feedSectionBorder = feedCompactChrome
    ? "border-t border-gray-200 pt-3"
    : "border-t border-gray-200 pt-5";

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
      {searchQuery
        ? t("feed.filteredByQuery", { query: searchQuery })
        : ""}
    </div>
  );

  const emptySale =
    feedChip === "sale" &&
    !loading &&
    feedHydrated &&
    sortedSales.length === 0;
  const emptyInsp =
    feedChip === "inspiration" &&
    !loading &&
    feedHydrated &&
    inspirationSlots.length === 0;
  const emptyAll =
    feedChip === "all" && !loading && feedHydrated && displayCount === 0;

  const feedQuickCreateIntent = useMemo(
    () => resolvedVerticalModeIntent(category, feedChip),
    [category, feedChip]
  );

  return (
    <div id="homecheff-feed" className="space-y-4">
      <div
        className={`bg-white/70 rounded-xl border border-gray-200 shadow-sm ${feedPanelPad}`}
      >
        <div>
          <h2
            className={
              feedCompactChrome
                ? "text-sm font-semibold text-gray-900"
                : "text-base font-semibold text-gray-900"
            }
          >
            {t("feed.discoverFiltersHeading")}
          </h2>
          {!feedCompactChrome && (
            <p className="text-sm text-gray-600 mt-1 mb-3">
              {t("feed.chipSectionIntro")}
            </p>
          )}
          <p
            className={
              feedCompactChrome
                ? "text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1.5"
                : "text-xs font-medium text-gray-500 uppercase tracking-wide mb-2"
            }
          >
            {t("feed.viewModeLabel")}
          </p>
          <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-0.5 px-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
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

        {feedCompactChrome && sortRowEl}

        {feedCompactChrome && (
          <button
            type="button"
            aria-expanded={nativeFeedExtraOpen}
            onClick={() => setNativeFeedExtraOpen((o) => !o)}
            className="inline-flex w-full items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
          >
            {nativeFeedExtraOpen ? (
              <ChevronUp className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 shrink-0" />
            )}
            {nativeFeedExtraOpen
              ? t("feed.nativeCollapseGeoFilters")
              : t("feed.nativeExpandGeoFilters")}
            {nativeGeoFilterActive && !nativeFeedExtraOpen ? (
              <span
                className="h-2 w-2 rounded-full bg-emerald-500"
                aria-hidden
              />
            ) : null}
          </button>
        )}

        {(!feedCompactChrome || nativeFeedExtraOpen) && (
          <>
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
              <div className="flex flex-wrap gap-3 items-end max-md:flex-col max-md:items-stretch">
                <div className="flex-1 min-w-[180px] max-md:min-w-0 max-md:w-full">
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
                <div className="min-w-[120px] max-md:w-full">
                  <label className="block text-base font-semibold mb-1">
                    {t("feed.radiusLabel")}
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
                <div className="flex-1 min-w-[180px] max-md:min-w-0 max-md:w-full">
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
                <div className="min-w-[140px] max-md:w-full">
                  <label className="block text-base font-semibold mb-1">
                    {t("common.category")}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-primary/40 text-lg"
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
                <div className="min-w-[120px] max-md:w-full">
                  <label className="block text-base font-semibold mb-1">
                    {t("common.location")}
                  </label>
                  <button
                    type="button"
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

              {!feedCompactChrome && sortRowEl}

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
                          placeholder={t("filterBar.maxPrice")}
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
        )}

        {resultCountEl}
      </div>

      {loading ? (
        <div className="space-y-4" aria-hidden>
          <div className="h-48 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
          <div className="h-32 rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
        </div>
      ) : emptySale ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          <p className="text-base font-semibold text-gray-900">
            {t("feed.emptySaleTitle")}
          </p>
          <p className="mt-1">{t("feed.emptySaleBody")}</p>
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
          className={
            nativeMounted
              ? "grid sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 hc-native-feed-grid"
              : "grid sm:grid-cols-2 md:grid-cols-3 gap-4"
          }
        >
          {feedRowsToRender.map((row, idx) => {
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
                  baseUrl={baseUrl}
                  t={t}
                />
              );
            }
            return (
              <FeedInspirationCardFeed
                key={`insp-feed-${slot.item.id}-${idx}`}
                item={toCardItem(slot.item)}
                baseUrl={baseUrl}
                t={t}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
