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
  classifyFeedItem,
  getInspirationFeedItemHref,
  getSaleItemHref,
} from "@/components/feed/feedItemClassification";
import { useCreateFlow } from "@/components/create/CreateFlowContext";

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

export function isGeoFeedInspiration(item: GeoFeedCardItem) {
  return classifyFeedItem(item) === "inspiration";
}

export function inspirationDetailHrefFromFeedItem(it: GeoFeedCardItem): string {
  return getInspirationFeedItemHref(it);
}

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

function snippet(text: string | null, max = 140) {
  if (!text) return "";
  const s = text.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max).trim()}…`;
}

function feedInspirationSoftLabel(it: GeoFeedCardItem): string {
  if (it.type === "recipe" || it.isRecipe) return "Recept";
  if (it.type === "inspiration" || it.isInspiration) return "Inspiratie";
  return "Inspiratie";
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
              Te koop
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
          <p className="text-sm font-semibold text-emerald-800">Zie aanbod</p>
        )}
        <p className="text-xs text-gray-600">
          {it.place ?? "Onbekende locatie"}
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
            Bekijk aanbod
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

/** Inspiratie uit /api/feed (beperkte velden): content-kaart. */
export function FeedInspirationCardFeed({
  item: it,
  t,
}: {
  item: GeoFeedCardItem;
  t: TFn;
}) {
  const { openCreateFlow } = useCreateFlow();
  const detailHref = getInspirationFeedItemHref(it);
  const desc = snippet(it.description);

  return (
    <article className="rounded-xl border border-stone-200/90 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <FeedCardPrimaryMedia
        href={detailHref}
        alt={it.title ?? ""}
        videoUrl={it.videoUrl}
        videoPoster={it.videoThumbnail}
        imageUrl={it.photo}
        badgeOverlay={
          <div className="absolute top-2 left-2">
            <span className="inline-flex rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-medium text-stone-700 shadow-sm">
              {feedInspirationSoftLabel(it)}
            </span>
          </div>
        }
      />
      <div className="p-4 flex flex-col flex-1">
        <Link href={detailHref}>
          <h3 className="font-semibold text-stone-900 text-base leading-snug line-clamp-2 hover:text-emerald-800 transition-colors">
            {it.title ?? t("common.dish")}
          </h3>
        </Link>
        {desc ? (
          <p className="mt-2 text-sm text-stone-600 line-clamp-3 leading-relaxed">
            {desc}
          </p>
        ) : null}
        {it.place ? (
          <p className="mt-2 text-xs text-stone-500">{it.place}</p>
        ) : null}
        <div
          className="mt-4 rounded-xl border border-stone-200 bg-stone-50/90 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-stone-800 mb-2">
            Wil je dit ook maken?
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={detailHref}
              className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
            >
              Bekijk
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCreateFlow();
              }}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Start met verkopen
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Inspiratie uit /api/inspiratie: zelfde mediaregels als sale/feed (FeedCardPrimaryMedia). */
export function FeedInspirationCardApi({
  item,
  t,
}: {
  item: InspirationItem;
  t: TFn;
}) {
  const { openCreateFlow } = useCreateFlow();
  const detailHref = inspirationDetailHrefApi(item);
  const desc = snippet(item.description);
  const label = inspirationContentLabel(item);
  const resolved = resolvePrimaryMediaForInspirationApi(item);
  const photoFallback = pickPrimaryPhotoUrlFromPhotos(item.photos);
  const videoUrl = resolved.type === "video" ? resolved.src : null;
  const videoPoster =
    resolved.type === "video" ? resolved.poster : null;
  const imageUrl =
    resolved.type === "video"
      ? photoFallback
      : resolved.type === "image"
        ? resolved.src
        : null;

  return (
    <article className="rounded-xl border border-stone-200/90 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <FeedCardPrimaryMedia
        href={detailHref}
        alt={item.title || "Inspiratie"}
        videoUrl={videoUrl}
        videoPoster={videoPoster}
        imageUrl={imageUrl}
        objectFit={item.category === "GROWN" ? "contain" : "cover"}
        badgeOverlay={
          <div className="absolute top-2 left-2">
            <span className="inline-flex rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-medium text-stone-700 shadow-sm">
              {label}
            </span>
          </div>
        }
      />
      <div className="p-4 flex flex-col flex-1">
        <Link href={detailHref}>
          <h3 className="font-semibold text-stone-900 text-base leading-snug line-clamp-2 hover:text-emerald-800 transition-colors">
            {item.title ?? t("common.dish")}
          </h3>
        </Link>
        {desc ? (
          <p className="mt-2 text-sm text-stone-600 line-clamp-3 leading-relaxed">
            {desc}
          </p>
        ) : null}
        {item.user?.id ? (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <UserStatsTile
              userId={item.user.id}
              userName={item.user.name || null}
              userUsername={item.user.username || null}
              userAvatar={item.user.profileImage || null}
              displayFullName={item.user.displayFullName}
              displayNameOption={item.user.displayNameOption}
            />
          </div>
        ) : null}
        <div
          className="mt-4 rounded-xl border border-stone-200 bg-stone-50/90 p-3"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-stone-800 mb-2">
            Wil je dit ook maken?
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={detailHref}
              className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 transition-colors"
            >
              Bekijk
            </Link>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCreateFlow();
              }}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Start met verkopen
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
