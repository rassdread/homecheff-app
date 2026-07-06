"use client";

import type { GeoFeedCardItem } from "@/components/feed/GeoFeedCards";
import { MarketplaceTileRouter } from "@/components/marketplace/tiles";

type TFn = (key: string, params?: Record<string, string | number>) => string;

/**
 * @deprecated T1 — use FeedMarketplaceCard / MarketplaceTileRouter.
 */
export default function DiscoverGridTile({
  item,
  href,
  kind,
  t,
  baseUrl = "",
}: {
  item: GeoFeedCardItem;
  href: string;
  kind: "sale" | "inspiration";
  t: TFn;
  baseUrl?: string;
}) {
  return (
    <MarketplaceTileRouter
      item={item}
      baseUrl={baseUrl}
      t={t}
      mode={kind === "inspiration" ? "inspiration" : "sale"}
      mediaRatio="1:1"
      href={href}
    />
  );
}

export { inspirationApiToCardItem } from "@/lib/marketplace/tiles/map-inspiration-api";
