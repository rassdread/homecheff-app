"use client";

import Link from "next/link";
import { Eye, MapPin } from "lucide-react";
import { FeedCardPrimaryMedia } from "@/components/feed/feedMedia";
import type { GeoFeedCardItem } from "@/components/feed/GeoFeedCards";
import { inspirationContentLabel } from "@/components/inspiratie/InspirationCard";
import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import { getDisplayName } from "@/lib/displayName";

type TFn = (key: string, params?: Record<string, string | number>) => string;

function formatDistance(km: number | undefined): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

function creatorLabel(it: GeoFeedCardItem): string {
  return getDisplayName({
    name: it.sellerName,
    username: it.sellerUsername,
    displayFullName: it.sellerDisplayFullName,
    displayNameOption: it.sellerDisplayNameOption,
  });
}

function categoryBadgeLabel(
  it: GeoFeedCardItem,
  kind: "sale" | "inspiration",
  t: TFn
): string {
  if (kind === "sale") return t("feed.chipSale");
  const cat = (it.category || "CHEFF").toUpperCase() as InspirationItem["category"];
  return inspirationContentLabel({ category: cat } as InspirationItem, t);
}

export function inspirationApiToCardItem(item: InspirationItem): GeoFeedCardItem {
  const mainPhoto = item.photos.find((p) => p.isMain) ?? item.photos[0];
  const mainVideo = item.videos?.[0];
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    priceCents: null,
    type: "inspiration",
    isInspiration: true,
    deliveryMode: null,
    place: item.location?.place ?? null,
    photo: mainPhoto?.url ?? null,
    videoUrl: mainVideo?.url ?? null,
    videoThumbnail: mainVideo?.thumbnail ?? null,
    distanceKm: item.location?.distanceKm ?? undefined,
    viewCount: item.viewCount,
    propsCount: item.propsCount,
    category: item.category,
    sellerUserId: item.user.id,
    sellerName: item.user.name,
    sellerUsername: item.user.username,
    sellerAvatar: item.user.profileImage,
    sellerDisplayFullName: item.user.displayFullName,
    sellerDisplayNameOption: item.user.displayNameOption,
    sellerBadges: item.user.badges,
  };
}

export default function DiscoverGridTile({
  item: it,
  href,
  kind,
  t,
}: {
  item: GeoFeedCardItem;
  href: string;
  kind: "sale" | "inspiration";
  t: TFn;
}) {
  const hasPrice =
    it.priceCents != null && Number(it.priceCents) > 0;
  const priceLabel = hasPrice
    ? `€ ${(Number(it.priceCents) / 100).toFixed(2)}`
    : null;
  const distance = formatDistance(it.distanceKm);
  const placeLine = [it.place?.trim() || t("feed.unknownPlace"), distance]
    .filter(Boolean)
    .join(" · ");
  const creator = creatorLabel(it);
  const badge = categoryBadgeLabel(it, kind, t);

  return (
    <article className="feed-discover-tile group flex flex-col overflow-hidden rounded-xl border border-emerald-200/70 bg-white shadow-sm transition-shadow hover:shadow-md">
      <FeedCardPrimaryMedia
        href={href}
        alt={it.title ?? ""}
        videoUrl={it.videoUrl}
        videoPoster={it.videoThumbnail}
        imageUrl={it.photo}
        className="feed-discover-tile-media feed-card-primary-media"
        badgeOverlay={
          <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-start pointer-events-none">
            <span
              className={`inline-flex max-w-full items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm line-clamp-1 ${
                kind === "sale"
                  ? "bg-[#006D52] text-white"
                  : "bg-white/95 text-gray-800 ring-1 ring-gray-200/80"
              }`}
            >
              {badge}
            </span>
          </div>
        }
      />
      <div className="flex flex-1 flex-col gap-1 p-2">
        <Link href={href} className="min-w-0">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900 group-hover:text-[#0067B1]">
            {it.title?.trim() || t("common.dish")}
          </h3>
        </Link>
        {creator ? (
          <p className="line-clamp-1 text-[11px] font-medium text-gray-600">
            {creator}
          </p>
        ) : null}
        <p className="line-clamp-1 flex items-center gap-0.5 text-[10px] text-gray-500">
          <MapPin className="h-3 w-3 shrink-0 text-[#0067B1]/80" aria-hidden />
          <span>{placeLine}</span>
        </p>
        <div className="mt-auto flex items-end justify-between gap-1 pt-0.5">
          {priceLabel ? (
            <span className="text-sm font-bold tabular-nums text-[#006D52]">
              {priceLabel}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#0067B1]">
              {t("feed.inspirationViewCta")}
            </span>
          )}
          <div className="flex items-center gap-2 text-[10px] text-gray-500 tabular-nums">
            {(it.viewCount ?? 0) > 0 ? (
              <span className="inline-flex items-center gap-0.5">
                <Eye className="h-3 w-3" aria-hidden />
                {it.viewCount}
              </span>
            ) : null}
            {(it.propsCount ?? 0) > 0 ? (
              <span>👏 {it.propsCount}</span>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
