import type { InspirationItem } from "@/components/inspiratie/InspiratieContent";
import type { FeedTaxonomy } from "@/lib/feed/feed-taxonomy";
import type { ListingKind } from "@/lib/marketplace/contracts/listing-kind-contract";
import type { DiscoveryReadModel } from "@/lib/discovery/contracts/discovery-read-model";
import type { ProductOrderMethodValue } from "@/lib/product/order-method";
import { formatItemPlaceDistanceLine } from "@/lib/geo/item-location";

export type GeoFeedCardItem = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  orderMethod?: ProductOrderMethodValue | string | null;
  acceptHomeCheffPayment?: boolean | null;
  acceptDirectContact?: boolean | null;
  sellerStripeConnectReady?: boolean | null;
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
  taxonomy?: FeedTaxonomy;
  listingKind?: ListingKind;
  discovery?: DiscoveryReadModel;
  marketplaceCategory?: string | null;
  specializations?: string[];
  acceptedSpecializations?: string[];
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

/** @deprecated T1 — use MarketplaceTileRouter. Kept for legacy imports. */
export function FeedSaleCard() {
  return null;
}

/** @deprecated T1 — use MarketplaceTileRouter. */
export function FeedInspirationCardFeed() {
  return null;
}

/** @deprecated T1 — use MarketplaceTileRouter. */
export function FeedInspirationCardApi() {
  return null;
}

export { feedInspirationSoftLabel };
