"use client";

import { useEffect, useState } from "react";
import ShareButton from "@/components/ui/ShareButton";
import PropsButton from "@/components/props/PropsButton";
import { Eye } from "lucide-react";
import Link from "next/link";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import UserStatsTile from "@/components/ui/UserStatsTile";
import {
  FeedCardPrimaryMedia,
  pickPrimaryPhotoUrlFromPhotos,
  resolvePrimaryMediaForInspirationApi,
} from "@/components/feed/feedMedia";
import { inspirationContentLabel } from "@/components/inspiratie/InspirationCard";
import { resolveFeedItemHref } from "@/lib/feed/feed-item-href";
import UserBadgeChips from "@/components/gamification/UserBadgeChips";
import {
  formatProductPriceLabel,
  isContactOnlyProduct,
  type ProductOrderMethodValue,
} from "@/lib/product/order-method";
import type { FeedTaxonomy } from "@/lib/feed/feed-taxonomy";
import { formatItemPlaceDistanceLine } from "@/lib/geo/item-location";
import { getDisplayName } from "@/lib/displayName";
import {
  EMPTY_USER_STATS,
  fetchUserStatsDeduped,
  getCachedUserStats,
} from "@/lib/userStatsClientCache";
import type { UserBadgeChipItem } from "@/components/gamification/UserBadgeChips";
import MarketplaceBadgeList from "@/components/marketplace/MarketplaceBadgeList";
import type { MarketplaceCategory } from "@prisma/client";

/** Desktop homepage feed: one-line seller stats instead of UserStatsTile grid. */
function FeedCardCompactStats({
  userId,
  badges,
}: {
  userId: string;
  badges?: UserBadgeChipItem[] | null;
}) {
  const [stats, setStats] = useState(() => getCachedUserStats(userId));

  useEffect(() => {
    const cached = getCachedUserStats(userId);
    if (cached) setStats(cached);
    let cancelled = false;
    void fetchUserStatsDeduped(userId).then((data) => {
      if (!cancelled) setStats(data);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const s = stats ?? EMPTY_USER_STATS;
  const parts: string[] = [];
  if (s.fansCount > 0) parts.push(`${s.fansCount} fans`);
  if (s.totalProps > 0) parts.push(`${s.totalProps} props`);
  if (s.totalReviews > 0) parts.push(`${s.totalReviews} reviews`);
  if (s.averageRating > 0) parts.push(`${s.averageRating.toFixed(1)}★`);
  if (s.totalViews > 0) parts.push(`${s.totalViews} views`);

  if (parts.length === 0 && (!badges || badges.length === 0)) {
    return null;
  }

  return (
    <div className="feed-card-stats-compact hidden lg:flex lg:flex-wrap lg:items-center lg:gap-x-2 lg:gap-y-0.5">
      {parts.length > 0 ? (
        <span className="text-[11px] font-medium text-gray-500">{parts.join(" · ")}</span>
      ) : null}
      {badges && badges.length > 0 ? (
        <UserBadgeChips badges={badges} max={2} size="sm" />
      ) : null}
    </div>
  );
}

function FeedSellerMediaChip({
  avatar,
  name,
  username,
  displayFullName,
  displayNameOption,
}: {
  avatar?: string | null;
  name?: string | null;
  username?: string | null;
  displayFullName?: boolean | null;
  displayNameOption?: string | null;
}) {
  const label = getDisplayName({
    name,
    username,
    displayFullName,
    displayNameOption,
  });
  if (!label && !avatar) return null;
  return (
    <div className="absolute bottom-2 left-2 z-10 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-white/95 pl-0.5 pr-2.5 py-0.5 shadow-md ring-1 ring-white/90">
      {avatar ? (
        <img src={avatar} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-brand">
          {label?.[0]?.toUpperCase() ?? "?"}
        </span>
      )}
      {label ? (
        <span className="truncate text-[11px] font-semibold text-gray-800">{label}</span>
      ) : null}
    </div>
  );
}

export type GeoFeedCardItem = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  orderMethod?: ProductOrderMethodValue | string | null;
  listingIntent?: string | null;
  priceModel?: string | null;
  type?: string | null;
  isRecipe?: boolean | null;
  isInspiration?: boolean | null;
  deliveryMode: "PICKUP" | "DELIVERY" | "BOTH" | string | null;
  place: string | null;
  photo: string | null;
  videoUrl?: string | null;
  videoThumbnail?: string | null;
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
  sellerBadges?: Array<{ key: string; name: string; icon: string }>;
  /** Afgeleide V3 taxonomy (Fase 5D, optioneel). */
  taxonomy?: FeedTaxonomy;
  marketplaceCategory?: string | null;
  specializations?: string[];
};

type TFn = (key: string, params?: Record<string, string | number>) => string;

export function inspirationDetailHrefApi(item: Pick<InspirationItem, "id" | "category">): string {
  switch (item.category) {
    case "CHEFF":
      return `/recipe/${item.id}`;
    case "GROWN":
      return `/garden/${item.id}`;
    case "DESIGNER":
      return `/design/${item.id}`;
    default:
      return `/inspiratie/${item.id}`;
  }
}

function feedInspirationSoftLabel(it: GeoFeedCardItem, t: TFn): string {
  if (it.type === "recipe" || it.isRecipe) return t("feed.badgeRecipe");
  if (it.type === "inspiration" || it.isInspiration)
    return t("feed.badgeInspiration");
  return t("feed.badgeInspiration");
}

/** Shared sale/inspiration card location line — place · distance with safe fallbacks. */
export function feedLocationLine(
  it: { place?: string | null; distanceKm?: number | null },
  t: TFn
): string {
  return formatItemPlaceDistanceLine({
    place: it.place,
    distanceKm: it.distanceKm,
    unknownPlaceLabel: t("feed.unknownPlace"),
    unknownDistanceLabel: t("feed.unknownDistance"),
  });
}

/** Verkoop: duidelijk koopbaar, badge, prijs, CTA. */
export function FeedSaleCard({
  item: it,
  baseUrl,
  t,
}: {
  item: GeoFeedCardItem;
  baseUrl: string;
  t: TFn;
}) {
  const listingHref = resolveFeedItemHref(it, it.taxonomy);
  const contactOnly = isContactOnlyProduct(it);
  const priceLabel = formatProductPriceLabel(
    {
      priceCents: it.priceCents,
      orderMethod: it.orderMethod,
      priceModel: it.priceModel,
    },
    t,
  );

  return (
    <div className="feed-card-geo hc-dorpsplein-card hc-feed-card hc-card-lift overflow-hidden flex flex-col border-primary-brand/15">
      <FeedCardPrimaryMedia
        href={listingHref}
        alt={it.title ?? ""}
        videoUrl={it.videoUrl}
        videoPoster={it.videoThumbnail}
        imageUrl={it.photo}
        className="hc-feed-media-tall feed-card-primary-media"
        badgeOverlay={
          <>
            <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
              <span className="inline-flex items-center rounded-lg bg-primary-brand px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                {t("feed.chipSale")}
              </span>
              {contactOnly ? (
                <span className="inline-flex items-center rounded-lg bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-primary-brand border border-primary-200 shadow-sm">
                  {t("productOrder.badgeViaContact")}
                </span>
              ) : null}
            </div>
            <FeedSellerMediaChip
              avatar={it.sellerAvatar}
              name={it.sellerName}
              username={it.sellerUsername}
              displayFullName={it.sellerDisplayFullName}
              displayNameOption={it.sellerDisplayNameOption}
            />
          </>
        }
      />
      <div className="feed-card-body p-3.5 sm:p-4 flex flex-col flex-1 gap-2">
        <MarketplaceBadgeList
          specializations={it.specializations}
          marketplaceCategory={
            (it.marketplaceCategory as MarketplaceCategory | null) ?? null
          }
          legacyCategory={it.category}
          maxVisible={2}
          size="sm"
          className="min-h-0"
        />
        <div className="flex justify-between items-start gap-2">
          <Link href={listingHref} prefetch className="flex-1 min-w-0">
            <p className="feed-card-title font-bold text-gray-900 line-clamp-2 leading-snug text-[15px] sm:text-base">
              {it.title ?? t("common.dish")}
            </p>
          </Link>
          <ShareButton
            url={`${baseUrl}${listingHref}`}
            title={it.title ?? t("common.dish")}
            description={it.description || ""}
            className="shrink-0 p-1 text-gray-400 hover:text-secondary-brand"
          />
        </div>
        {priceLabel ? (
          <p className="text-xl sm:text-2xl font-extrabold text-primary-brand tabular-nums">
            {priceLabel}
          </p>
        ) : (
          <p className="text-sm font-semibold text-primary-brand">{t("feed.saleSeeOffer")}</p>
        )}
        <div className="feed-card-meta-cluster">
          <p className="text-xs font-medium text-gray-600">
            {feedLocationLine(it, t)}
          </p>
          <p className="text-xs text-gray-500">
            {it.deliveryMode === "PICKUP"
              ? t("common.pickup")
              : it.deliveryMode === "DELIVERY"
                ? t("common.delivery")
                : it.deliveryMode === "BOTH"
                  ? t("common.pickupOrDelivery")
                  : ""}
          </p>
          {(it.favoriteCount ?? 0) >= 2 ? (
            <p className="text-[11px] font-medium text-secondary-brand/90 mt-0.5">
              {t("feed.density.savedByCommunity", { count: it.favoriteCount ?? 0 })}
            </p>
          ) : null}
        </div>
        {it.sellerUserId ? (
          <>
            <div className="feed-card-stats-wrap mt-1 min-h-[4.5rem] lg:hidden">
              <UserStatsTile
                userId={it.sellerUserId}
                userName={it.sellerName || null}
                userUsername={it.sellerUsername || null}
                userAvatar={it.sellerAvatar || null}
                displayFullName={it.sellerDisplayFullName}
                displayNameOption={it.sellerDisplayNameOption}
                className="!pt-2"
              />
              <UserBadgeChips badges={it.sellerBadges} max={2} size="sm" className="mt-1" />
            </div>
            <FeedCardCompactStats userId={it.sellerUserId} badges={it.sellerBadges} />
          </>
        ) : null}
        <div className="feed-card-cta-row flex items-center justify-between text-xs mt-auto pt-2 lg:pt-1">
          <Link href={listingHref} prefetch className="hc-btn-primary rounded-xl px-4 py-2">
            {t("feed.saleViewOffer")}
          </Link>
          <div className="flex items-center gap-2">
            {it.viewCount !== undefined && (
              <div className="flex items-center gap-1 text-gray-500">
                <Eye className="w-3 h-3" />
                <span>{it.viewCount}</span>
              </div>
            )}
            <PropsButton
              productId={it.id}
              productTitle={it.title ?? t("common.dish")}
              size="sm"
              variant="thumbs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Genormaliseerde shape voor inspiratie-tegels in de gemengde GeoFeed.
 *  De twee databronnen (/api/feed en /api/inspiratie) leveren verschillende
 *  shapes; we projecteren ze hier op één gemeenschappelijke vorm zodat er
 *  maar één tegel-component is om te onderhouden. */
type NormalizedInspirationCard = {
  id: string;
  title: string | null;
  description: string | null;
  detailHref: string;
  label: string;
  place: string | null;
  distanceKm: number | null;
  videoUrl: string | null;
  videoPoster: string | null;
  imageUrl: string | null;
  alt: string;
  viewCount?: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
    badges?: Array<{ key: string; name: string; icon: string }>;
  } | null;
};

function fromGeoFeedItem(it: GeoFeedCardItem, t: TFn): NormalizedInspirationCard {
  return {
    id: it.id,
    title: it.title,
    description: it.description,
    detailHref: resolveFeedItemHref(it, it.taxonomy),
    label: feedInspirationSoftLabel(it, t),
    place: it.place ?? null,
    distanceKm: it.distanceKm ?? null,
    videoUrl: it.videoUrl ?? null,
    videoPoster: it.videoThumbnail ?? null,
    imageUrl: it.photo ?? null,
    alt: it.title ?? "",
    viewCount: it.viewCount,
    user: it.sellerUserId
      ? {
          id: it.sellerUserId,
          name: it.sellerName ?? null,
          username: it.sellerUsername ?? null,
          avatar: it.sellerAvatar ?? null,
          displayFullName: it.sellerDisplayFullName,
          displayNameOption: it.sellerDisplayNameOption,
          badges: it.sellerBadges,
        }
      : null,
  };
}

function fromInspirationApiItem(item: InspirationItem, t: TFn): NormalizedInspirationCard {
  const resolved = resolvePrimaryMediaForInspirationApi(item);
  const photoFallback = pickPrimaryPhotoUrlFromPhotos(item.photos);
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    detailHref: inspirationDetailHrefApi(item),
    label: inspirationContentLabel(item, t),
    place: item.location?.place ?? null,
    distanceKm: item.location?.distanceKm ?? null,
    videoUrl: resolved.type === "video" ? resolved.src : null,
    videoPoster: resolved.type === "video" ? resolved.poster : null,
    imageUrl:
      resolved.type === "video"
        ? photoFallback
        : resolved.type === "image"
          ? resolved.src
          : null,
    alt: item.title || t("feed.altInspiration"),
    viewCount: item.viewCount,
    user: item.user?.id
      ? {
          id: item.user.id,
          name: item.user.name ?? null,
          username: item.user.username ?? null,
          avatar: item.user.profileImage ?? null,
          displayFullName: item.user.displayFullName,
          displayNameOption: item.user.displayNameOption,
          badges: item.user.badges,
        }
      : null,
  };
}

/** Eén inspiratie-tegelimplementatie voor beide bronnen. Visueel gelijk aan
 *  FeedSaleCard zodat de gemengde feed één consistente structuur heeft. */
function FeedInspirationCard({
  data,
  baseUrl,
  t,
}: {
  data: NormalizedInspirationCard;
  baseUrl: string;
  t: TFn;
}) {
  const fallbackTitle = data.title ?? t("common.dish");

  return (
    <div className="feed-card-geo hc-dorpsplein-card hc-feed-card hc-card-lift overflow-hidden flex flex-col border-primary-brand/10">
      <FeedCardPrimaryMedia
        href={data.detailHref}
        alt={data.alt}
        videoUrl={data.videoUrl}
        videoPoster={data.videoPoster}
        imageUrl={data.imageUrl}
        className="hc-feed-media-tall feed-card-primary-media"
        badgeOverlay={
          <>
            <div className="absolute top-2 left-2 z-10">
              <span className="inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary-brand shadow-md ring-1 ring-primary-brand/15">
                {data.label}
              </span>
            </div>
            {data.user ? (
              <FeedSellerMediaChip
                avatar={data.user.avatar}
                name={data.user.name}
                username={data.user.username}
                displayFullName={data.user.displayFullName}
                displayNameOption={data.user.displayNameOption}
              />
            ) : null}
          </>
        }
      />
      <div className="feed-card-body p-3.5 sm:p-4 flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start gap-2">
          <Link href={data.detailHref} prefetch className="flex-1 min-w-0">
            <p className="feed-card-title font-bold text-gray-900 line-clamp-2 leading-snug text-[15px] sm:text-base">
              {fallbackTitle}
            </p>
          </Link>
          <ShareButton
            url={`${baseUrl}${data.detailHref}`}
            title={fallbackTitle}
            description={data.description || ""}
            className="shrink-0 p-1 text-gray-400 hover:text-secondary-brand"
          />
        </div>
        <p className="feed-card-insp-secondary-label text-sm font-semibold text-secondary-brand uppercase tracking-wide lg:hidden">
          {data.label}
        </p>
        <div className="feed-card-meta-cluster">
          <p className="text-xs font-medium text-gray-600">
            {feedLocationLine(data, t)}
          </p>
        </div>
        {data.user ? (
          <>
            <div className="feed-card-stats-wrap mt-1 min-h-[4.5rem] lg:hidden">
              <UserStatsTile
                userId={data.user.id}
                userName={data.user.name}
                userUsername={data.user.username}
                userAvatar={data.user.avatar}
                displayFullName={data.user.displayFullName}
                displayNameOption={data.user.displayNameOption}
                className="!pt-2"
              />
              <UserBadgeChips badges={data.user.badges} max={2} size="sm" className="mt-1" />
            </div>
            <FeedCardCompactStats userId={data.user.id} badges={data.user.badges} />
          </>
        ) : (
          <div className="feed-card-stats-wrap mt-1 min-h-[4.5rem] lg:hidden" aria-hidden />
        )}
        <div className="feed-card-cta-row flex items-center justify-between text-xs mt-auto pt-2 lg:pt-1">
          <Link href={data.detailHref} prefetch className="hc-btn-primary rounded-xl px-4 py-2">
            {t("feed.inspirationViewCta")}
          </Link>
          <div className="flex items-center gap-2">
            {data.viewCount !== undefined && (
              <div className="flex items-center gap-1 text-gray-500">
                <Eye className="w-3 h-3" />
                <span>{data.viewCount}</span>
              </div>
            )}
            <PropsButton
              dishId={data.id}
              productTitle={fallbackTitle}
              size="sm"
              variant="thumbs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Inspiratie uit /api/feed (beperkte velden): thin wrapper rond FeedInspirationCard. */
export function FeedInspirationCardFeed({
  item,
  baseUrl,
  t,
}: {
  item: GeoFeedCardItem;
  baseUrl: string;
  t: TFn;
}) {
  return <FeedInspirationCard data={fromGeoFeedItem(item, t)} baseUrl={baseUrl} t={t} />;
}

/** Inspiratie uit /api/inspiratie: thin wrapper rond FeedInspirationCard. */
export function FeedInspirationCardApi({
  item,
  baseUrl,
  t,
}: {
  item: InspirationItem;
  baseUrl: string;
  t: TFn;
}) {
  return <FeedInspirationCard data={fromInspirationApiItem(item, t)} baseUrl={baseUrl} t={t} />;
}
