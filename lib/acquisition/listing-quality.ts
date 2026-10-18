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

const HINTS: Record<ListingQualityDimension, { nl: string; en: string }> = {
  photo: {
    nl: "Voeg meer foto's toe. Drie foto's, of één foto met een video, geven de hoogste fotopunten.",
    en: "Add more photos. Three photos, or one photo plus a video, earn the full photo score.",
  },
  title: {
    nl: "Maak de titel specifieker. Een titel van 12 tot 80 tekens scoort het hoogst.",
    en: "Make the title more specific. A title of 12 to 80 characters scores highest.",
  },
  description: {
    nl: "Schrijf een duidelijkere beschrijving van minstens 80 tekens.",
    en: "Write a clearer description of at least 80 characters.",
  },
  priceClarity: {
    nl: "Zet een duidelijke prijs. Een prijs op aanvraag scoort lager dan een vaste prijs.",
    en: "Set a clear price. A price on request scores lower than a fixed price.",
  },
  category: {
    nl: "Kies een categorie die bij een zelfgemaakt product of een persoonlijke dienst hoort.",
    en: "Choose a category for a homemade product or a personal service.",
  },
  location: {
    nl: "Vul een herkenbare plaats in, zodat de afstand berekend kan worden.",
    en: "Add a recognizable place so distance can be calculated.",
  },
  profile: {
    nl: "Vul je profielnaam en een korte bio in.",
    en: "Add your profile name and a short bio.",
  },
  availability: {
    nl: "Geef aan dat de listing beschikbaar is, bijvoorbeeld met voorraad.",
    en: "Show that the listing is available, for example with stock.",
  },
  pickupDelivery: {
    nl: "Zeg hoe de koper het aanbod krijgt: ophalen, bezorgen of verzenden.",
    en: "Say how the buyer receives it: pickup, delivery, or shipping.",
  },
};

/** Improvement hints for dimensions that are not at their full weight. */
export function listingQualityHints(
  result: ListingQualityResult,
): Array<{ dimension: ListingQualityDimension; nl: string; en: string }> {
  return (Object.keys(WEIGHTS) as ListingQualityDimension[])
    .filter((dimension) => result.dimensions[dimension] < WEIGHTS[dimension])
    .map((dimension) => ({ dimension, ...HINTS[dimension] }));
}

export function listingQualityBand(score: number): { nl: string; en: string } {
  if (score >= 80) return { nl: "Goed", en: "Good" };
  if (score >= LISTING_QUALITY_THRESHOLD) return { nl: "Voldoende", en: "Enough" };
  return { nl: "Kan beter", en: "Can be improved" };
}

/**
 * Quality and a campaign reward are different. This text never says HC was granted.
 */
export function explainListingReward(input: {
  score: number;
  linkedToCampaign: boolean;
  isFirstQualifiedListing: boolean;
  grantPending: boolean;
}): { nl: string; en: string; promised: false; granted: false } {
  if (input.linkedToCampaign && input.isFirstQualifiedListing && input.grantPending) {
    return {
      nl: "Deze listing is vastgelegd als eerste geldige listing. Er is nog geen HC toegekend.",
      en: "This listing is recorded as the first valid listing. No HC has been granted.",
      promised: false,
      granted: false,
    };
  }
  if (input.linkedToCampaign && !input.isFirstQualifiedListing) {
    return {
      nl: "Een eenmalige campagne geldt voor de eerste geldige listing. Voor deze listing is geen extra beloning vastgelegd.",
      en: "A one-time campaign applies to the first valid listing. No extra reward is recorded for this listing.",
      promised: false,
      granted: false,
    };
  }
  if (input.score >= LISTING_QUALITY_THRESHOLD) {
    return {
      nl: "Deze listing haalt de minimale kwaliteitsscore van 60. Dat is een kwaliteitsbeoordeling, geen HC-toekenning.",
      en: "This listing meets the minimum quality score of 60. That is a quality check, not an HC grant.",
      promised: false,
      granted: false,
    };
  }
  return {
    nl: "Deze listing haalt de minimale kwaliteitsscore van 60 nog niet. Er is geen HC toegekend.",
    en: "This listing does not yet meet the minimum quality score of 60. No HC has been granted.",
    promised: false,
    granted: false,
  };
}
