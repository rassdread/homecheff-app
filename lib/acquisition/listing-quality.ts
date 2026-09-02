/**
 * Simple 0–100 quality score for marketplace listings (Product).
 * Dimensions: photo, title, description, price clarity, category, location,
 * profile, availability, pickup/delivery.
 */

export const LISTING_QUALITY_THRESHOLD = 60;

export type ListingQualityInput = {
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
  imageCount?: number | null;
  hasVideo?: boolean | null;
  sellerDisplayName?: string | null;
  sellerBio?: string | null;
  sellerHasCoords?: boolean | null;
  userCity?: string | null;
};

export type ListingQualityDimension =
  | "photo"
  | "title"
  | "description"
  | "priceClarity"
  | "category"
  | "location"
  | "profile"
  | "availability"
  | "pickupDelivery";

export type ListingQualityResult = {
  score: number;
  isQuality: boolean;
  dimensions: Record<ListingQualityDimension, number>;
};

const WEIGHTS: Record<ListingQualityDimension, number> = {
  photo: 18,
  title: 12,
  description: 14,
  priceClarity: 12,
  category: 8,
  location: 10,
  profile: 10,
  availability: 8,
  pickupDelivery: 8,
};

function clamp01(n: number): number {
  if (n <= 0) return 0;
  if (n >= 1) return 1;
  return n;
}

function nonEmpty(s: string | null | undefined, min = 1): boolean {
  return typeof s === "string" && s.trim().length >= min;
}

function scorePhoto(input: ListingQualityInput): number {
  const images = Math.max(0, input.imageCount ?? 0);
  if (images >= 3 || (images >= 1 && input.hasVideo)) return 1;
  if (images >= 1) return 0.7;
  if (input.hasVideo) return 0.4;
  return 0;
}

function scoreTitle(input: ListingQualityInput): number {
  const t = (input.title ?? "").trim();
  if (t.length >= 12 && t.length <= 80) return 1;
  if (t.length >= 5) return 0.6;
  if (t.length > 0) return 0.25;
  return 0;
}

function scoreDescription(input: ListingQualityInput): number {
  const d = (input.description ?? "").trim();
  if (d.length >= 80) return 1;
  if (d.length >= 30) return 0.65;
  if (d.length >= 10) return 0.35;
  return 0;
}

function scorePriceClarity(input: ListingQualityInput): number {
  const model = (input.priceModel ?? "FIXED").toUpperCase();
  if (model === "ON_REQUEST" || model === "VOLUNTARY") return 0.85;
  const cents = input.priceCents;
  if (typeof cents === "number" && Number.isFinite(cents) && cents > 0) return 1;
  if (typeof cents === "number" && cents === 0 && (model === "FROM_PRICE" || model === "HOURLY")) {
    return 0.4;
  }
  return 0;
}

function scoreCategory(input: ListingQualityInput): number {
  const cat = (input.category ?? "").toUpperCase();
  const mcat = (input.marketplaceCategory ?? "").toUpperCase();
  const productOk = cat === "CHEFF" || cat === "GROWN" || cat === "DESIGNER";
  const serviceOk =
    mcat === "ARTISTIC_SERVICE" ||
    mcat === "PRACTICAL_SERVICE" ||
    mcat === "KNOWLEDGE" ||
    mcat === "CREATE" ||
    mcat === "GROW" ||
    mcat === "DESIGN";
  if (productOk || serviceOk) return 1;
  return 0;
}

function scoreLocation(input: ListingQualityInput): number {
  if (
    typeof input.pickupLat === "number" &&
    typeof input.pickupLng === "number" &&
    Number.isFinite(input.pickupLat) &&
    Number.isFinite(input.pickupLng)
  ) {
    return 1;
  }
  if (nonEmpty(input.pickupAddress, 5) || nonEmpty(input.placeName, 2)) return 0.75;
  if (input.useProfileLocation && (input.sellerHasCoords || nonEmpty(input.userCity, 2))) {
    return 0.7;
  }
  if (nonEmpty(input.userCity, 2)) return 0.4;
  return 0;
}

function scoreProfile(input: ListingQualityInput): number {
  let s = 0;
  if (nonEmpty(input.sellerDisplayName, 2)) s += 0.5;
  if (nonEmpty(input.sellerBio, 20)) s += 0.5;
  else if (nonEmpty(input.sellerBio, 5)) s += 0.25;
  return clamp01(s);
}

function scoreAvailability(input: ListingQualityInput): number {
  if (input.isActive === false) return 0.2;
  if (input.isFutureProduct && input.availabilityDate) return 0.9;
  const stock = input.stock;
  const maxStock = input.maxStock;
  if (typeof stock === "number" && stock > 0) return 1;
  if (typeof maxStock === "number" && maxStock > 0) return 0.8;
  // Services / on-request often have stock 0 — still available if active
  if (input.isActive !== false) return 0.65;
  return 0;
}

function scorePickupDelivery(input: ListingQualityInput): number {
  const mode = (input.delivery ?? "").toUpperCase();
  if (mode === "BOTH" || mode === "SHIPPING") return 1;
  if (mode === "DELIVERY" || input.sellerCanDeliver) return 0.9;
  if (mode === "PICKUP") {
    if (nonEmpty(input.pickupAddress, 5) || (input.pickupLat != null && input.pickupLng != null)) {
      return 0.85;
    }
    return 0.55;
  }
  if (input.sellerCanDeliver) return 0.7;
  return 0.3;
}

/** Score a listing 0–100. Quality threshold defaults to LISTING_QUALITY_THRESHOLD (60). */
export function scoreListingQuality(input: ListingQualityInput): ListingQualityResult {
  const dimensions: Record<ListingQualityDimension, number> = {
    photo: Math.round(scorePhoto(input) * WEIGHTS.photo),
    title: Math.round(scoreTitle(input) * WEIGHTS.title),
    description: Math.round(scoreDescription(input) * WEIGHTS.description),
    priceClarity: Math.round(scorePriceClarity(input) * WEIGHTS.priceClarity),
    category: Math.round(scoreCategory(input) * WEIGHTS.category),
    location: Math.round(scoreLocation(input) * WEIGHTS.location),
    profile: Math.round(scoreProfile(input) * WEIGHTS.profile),
    availability: Math.round(scoreAvailability(input) * WEIGHTS.availability),
    pickupDelivery: Math.round(scorePickupDelivery(input) * WEIGHTS.pickupDelivery),
  };

  const score = Object.values(dimensions).reduce((a, b) => a + b, 0);
  return {
    score,
    isQuality: score >= LISTING_QUALITY_THRESHOLD,
    dimensions,
  };
}

export function isQualityListing(input: ListingQualityInput): boolean {
  return scoreListingQuality(input).isQuality;
}
