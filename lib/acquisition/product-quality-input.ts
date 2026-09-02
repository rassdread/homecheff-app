import type { ListingQualityInput } from "@/lib/acquisition/listing-quality";

/** Map a product (+ seller/user context) into listing quality input. */
export function productToListingQualityInput(product: {
  title?: string | null;
  description?: string | null;
  priceCents?: number | null;
  priceModel?: string | null;
  category?: string | null;
  marketplaceCategory?: string | null;
  placeName?: string | null;
  pickupAddress?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  useProfileLocation?: boolean | null;
  delivery?: string | null;
  sellerCanDeliver?: boolean | null;
  stock?: number | null;
  maxStock?: number | null;
  availabilityDate?: Date | string | null;
  isFutureProduct?: boolean | null;
  isActive?: boolean | null;
  Image?: Array<unknown> | null;
  Video?: unknown | null;
  seller?: {
    displayName?: string | null;
    bio?: string | null;
    lat?: number | null;
    lng?: number | null;
    User?: { city?: string | null } | null;
  } | null;
}): ListingQualityInput {
  return {
    title: product.title,
    description: product.description,
    priceCents: product.priceCents,
    priceModel: product.priceModel,
    category: product.category,
    marketplaceCategory: product.marketplaceCategory,
    placeName: product.placeName,
    pickupAddress: product.pickupAddress,
    pickupLat: product.pickupLat,
    pickupLng: product.pickupLng,
    useProfileLocation: product.useProfileLocation,
    delivery: product.delivery,
    sellerCanDeliver: product.sellerCanDeliver,
    stock: product.stock,
    maxStock: product.maxStock,
    availabilityDate: product.availabilityDate,
    isFutureProduct: product.isFutureProduct,
    isActive: product.isActive,
    imageCount: product.Image?.length ?? 0,
    hasVideo: Boolean(product.Video),
    sellerDisplayName: product.seller?.displayName,
    sellerBio: product.seller?.bio,
    sellerHasCoords:
      typeof product.seller?.lat === "number" && typeof product.seller?.lng === "number",
    userCity: product.seller?.User?.city ?? null,
  };
}
