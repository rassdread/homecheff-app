import {
  getFeedItemHref,
  type FeedClassifiable,
} from "@/components/feed/feedItemClassification";

type ProfileGridItem = {
  id: string;
  title?: string | null;
  priceCents?: number | null;
  category?: string | null;
  /** dish = Dish-model (recipe/garden/design inspiratie); product = SellerProfile Product */
  type?: string | null;
};

/**
 * Zelfde route-logica als de feed (verkoop vs inspiratie, CHEFF/GROWN/DESIGNER).
 */
export function hrefForProfileGridItem(
  product: ProfileGridItem,
  profileOwnerId: string,
  profileOwnerPlace?: string | null
): string | null {
  if (!product.id || !String(product.id).trim()) return null;
  const cat = (product.category || "").toUpperCase();
  const item: FeedClassifiable = {
    id: product.id,
    title: product.title ?? null,
    place: profileOwnerPlace ?? null,
    priceCents:
      product.priceCents != null && Number.isFinite(Number(product.priceCents))
        ? Math.round(Number(product.priceCents))
        : null,
    category: product.category ?? null,
    ownerId: profileOwnerId,
    /** Belangrijk voor inspiratie: Dish-id mag niet naar /product. */
    type: product.type ?? null,
    isRecipe: product.type === "dish" && cat === "CHEFF",
  };
  return getFeedItemHref(item);
}
