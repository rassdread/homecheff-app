/**
 * Prijs-gedreven feed-classificatie en routes (zelfde basis als productdetail in de app).
 */

export type FeedClassifiable = {
  id: string;
  priceCents: number | null;
  type?: string | null;
  isRecipe?: boolean | null;
  isInspiration?: boolean | null;
  /** Aanwezig op nieuwe productregels uit /api/feed (= verkoper-user-id). */
  ownerId?: string | null;
  category?: string | null;
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

/** Verkoopitems: zelfde detailpad als elders in de app (`/product/[id]`, geen `/listings`). */
export function getSaleItemHref(id: string): string {
  return `/product/${id}`;
}

/**
 * Content zonder verkoopprijs: sluit aan bij API-inspiratie (CHEFF/GROWN/DESIGNER),
 * met `/product/[id]` voor productregels (ownerId) en HOMECHEFF/legacy listing.
 */
export function getInspirationFeedItemHref(item: FeedClassifiable): string {
  const id = item.id;
  if (item.ownerId != null && String(item.ownerId).trim() !== "") {
    return `/product/${id}`;
  }
  const cat = (item.category || "").toUpperCase();
  if (cat === "GROWN") return `/garden/${id}`;
  if (cat === "DESIGNER") return `/design/${id}`;
  if (item.type === "recipe" || item.isRecipe || cat === "CHEFF") {
    return `/recipe/${id}`;
  }
  if (cat === "HOMECHEFF" || !cat) {
    return `/product/${id}`;
  }
  return `/inspiratie/${id}`;
}

export function getFeedItemHref(item: FeedClassifiable): string {
  return classifyFeedItem(item) === "sale"
    ? getSaleItemHref(item.id)
    : getInspirationFeedItemHref(item);
}
