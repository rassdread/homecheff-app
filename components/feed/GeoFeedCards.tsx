"use client";

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
import {
  getInspirationFeedItemHref,
  getSaleItemHref,
} from "@/components/feed/feedItemClassification";
export type GeoFeedCardItem = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
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
  ownerId?: string | null;
  category?: string | null;
  sellerUserId?: string | null;
  sellerName?: string | null;
  sellerUsername?: string | null;
  sellerAvatar?: string | null;
  sellerDisplayFullName?: boolean | null;
  sellerDisplayNameOption?: string | null;
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
  const listingHref = getSaleItemHref(it);
  const hasPrice =
    it.priceCents != null && Number(it.priceCents) > 0;
  const priceLabel = hasPrice
    ? `€ ${(Number(it.priceCents) / 100).toFixed(2)}`
    : null;

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <FeedCardPrimaryMedia
        href={listingHref}
        alt={it.title ?? ""}
        videoUrl={it.videoUrl}
        videoPoster={it.videoThumbnail}
        imageUrl={it.photo}
        badgeOverlay={
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
              {t("feed.chipSale")}
            </span>
          </div>
        }
      />
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start gap-2">
          <Link href={listingHref} className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 line-clamp-2 leading-snug">
              {it.title ?? t("common.dish")}
            </p>
          </Link>
          <ShareButton
            url={`${baseUrl}${listingHref}`}
            title={it.title ?? t("common.dish")}
            description={it.description || ""}
            className="shrink-0 p-1 text-gray-400 hover:text-blue-600"
          />
        </div>
        {priceLabel ? (
          <p className="text-2xl font-bold text-emerald-700 tabular-nums">
            {priceLabel}
          </p>
        ) : (
          <p className="text-sm font-semibold text-emerald-800">{t("feed.saleSeeOffer")}</p>
        )}
        <p className="text-xs text-gray-600">
          {it.place ?? t("feed.unknownPlace")}
          {it.distanceKm != null && it.distanceKm !== Infinity
            ? ` · ${it.distanceKm.toFixed(1)} km`
            : ""}
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
        {it.sellerUserId ? (
          <div className="mt-2 min-h-[5.5rem]">
            <UserStatsTile
              userId={it.sellerUserId}
              userName={it.sellerName || null}
              userUsername={it.sellerUsername || null}
              userAvatar={it.sellerAvatar || null}
              displayFullName={it.sellerDisplayFullName}
              displayNameOption={it.sellerDisplayNameOption}
              className="!pt-3"
            />
          </div>
        ) : null}
        <div className="flex items-center justify-between text-xs mt-auto pt-1">
          <Link
            href={listingHref}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
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
  objectFit?: "cover" | "contain";
  alt: string;
  viewCount?: number;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    displayFullName?: boolean | null;
    displayNameOption?: string | null;
  } | null;
};

function fromGeoFeedItem(it: GeoFeedCardItem, t: TFn): NormalizedInspirationCard {
  return {
    id: it.id,
    title: it.title,
    description: it.description,
    detailHref: getInspirationFeedItemHref(it),
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
    objectFit: item.category === "GROWN" ? "contain" : "cover",
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
    <div className="rounded-xl border border-emerald-200/80 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <FeedCardPrimaryMedia
        href={data.detailHref}
        alt={data.alt}
        videoUrl={data.videoUrl}
        videoPoster={data.videoPoster}
        imageUrl={data.imageUrl}
        objectFit={data.objectFit}
        badgeOverlay={
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-stone-700 shadow-sm">
              {data.label}
            </span>
          </div>
        }
      />
      <div className="p-3 flex flex-col flex-1 gap-2">
        <div className="flex justify-between items-start gap-2">
          <Link href={data.detailHref} className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 line-clamp-2 leading-snug">
              {fallbackTitle}
            </p>
          </Link>
          <ShareButton
            url={`${baseUrl}${data.detailHref}`}
            title={fallbackTitle}
            description={data.description || ""}
            className="shrink-0 p-1 text-gray-400 hover:text-blue-600"
          />
        </div>
        <p className="text-2xl font-bold text-emerald-700 tabular-nums">
          {data.label}
        </p>
        <p className="text-xs text-gray-600">
          {data.place ?? t("feed.unknownPlace")}
          {data.distanceKm != null && data.distanceKm !== Infinity
            ? ` · ${data.distanceKm.toFixed(1)} km`
            : ""}
        </p>
        <p className="text-xs text-gray-500">&nbsp;</p>
        {data.user ? (
          <div className="mt-2 min-h-[5.5rem]">
            <UserStatsTile
              userId={data.user.id}
              userName={data.user.name}
              userUsername={data.user.username}
              userAvatar={data.user.avatar}
              displayFullName={data.user.displayFullName}
              displayNameOption={data.user.displayNameOption}
              className="!pt-3"
            />
          </div>
        ) : (
          <div className="mt-2 min-h-[5.5rem]" aria-hidden />
        )}
        <div className="flex items-center justify-between text-xs mt-auto pt-1">
          <Link
            href={data.detailHref}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
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
