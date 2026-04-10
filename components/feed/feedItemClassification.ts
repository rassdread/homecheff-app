/**
 * Prijs-gedreven feed-classificatie en routes (zelfde basis als productdetail in de app).
 */

import { buildProductSlugPath } from "@/lib/seo/productSlug";

export type FeedClassifiable = {
  id: string;
  priceCents: number | null;
  type?: string | null;
  isRecipe?: boolean | null;
  isInspiration?: boolean | null;
  /** Aanwezig op nieuwe productregels uit /api/feed (= verkoper-user-id). */
  ownerId?: string | null;
  category?: string | null;
  /** Voor SEO-vriendelijke product-URL's */
  title?: string | null;
  place?: string | null;
};

/** Verkoopbaar: strikt priceCents > 0 (null/0/NaN = geen verkoopprijs). */
export function hasValidSalePrice(item: FeedClassifiable): boolean {
  const p = item.priceCents;
  return p != null && Number.isFinite(Number(p)) && Number(p) > 0;
}

export type FeedItemKind = "sale" | "inspiration";

export function classifyFeedItem(item: FeedClassifiable): FeedItemKind {
  return hasValidSalePrice(item) ? "sale" : "inspiration";
}

function productHrefFromFeedItem(item: Pick<FeedClassifiable, "id" | "title" | "place">): string {
  const t = item.title?.trim();
  if (t) {
    return `/product/${buildProductSlugPath(t, item.place, item.id)}`;
  }
  return `/product/${item.id}`;
}

/** Verkoopitems: detailpad met slug indien titel bekend. */
export function getSaleItemHref(item: FeedClassifiable): string {
  return productHrefFromFeedItem(item);
}

/**
 * Content zonder verkoopprijs: sluit aan bij API-inspiratie (CHEFF/GROWN/DESIGNER),
 * met `/product/[slug]` voor productregels (ownerId) en HOMECHEFF/legacy listing.
 */
export function getInspirationFeedItemHref(item: FeedClassifiable): string {
  const id = item.id;
  if (item.ownerId != null && String(item.ownerId).trim() !== "") {
    return productHrefFromFeedItem(item);
  }
  const cat = (item.category || "").toUpperCase();
  if (cat === "GROWN") return `/garden/${id}`;
  if (cat === "DESIGNER") return `/design/${id}`;
  if (item.type === "recipe" || item.isRecipe || cat === "CHEFF") {
    return `/recipe/${id}`;
  }
  if (cat === "HOMECHEFF" || !cat) {
    return productHrefFromFeedItem(item);
  }
  return `/inspiratie/${id}`;
}

export function getFeedItemHref(item: FeedClassifiable): string {
  return classifyFeedItem(item) === "sale"
    ? getSaleItemHref(item)
    : getInspirationFeedItemHref(item);
}
