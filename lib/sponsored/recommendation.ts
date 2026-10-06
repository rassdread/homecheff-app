/**
 * Relevant sponsored recommendations.
 * Subscription never changes organic rank and never enters the relevance score.
 * Distribution weight is applied only after a candidate is already eligible.
 */

export const SPONSORED_AFTER_ORGANIC_ITEMS = 15;
export const SPONSORED_RELEVANCE_THRESHOLD = 35;

/** Internal fair-distribution weights. Not prices, not view guarantees. */
export const SPONSORED_DISTRIBUTION_WEIGHT = {
  basic: 1,
  pro: 2,
  premium: 3,
} as const;

export type SponsoredPlan = keyof typeof SPONSORED_DISTRIBUTION_WEIGHT;

export type SponsoredFulfillment = 'local' | 'shipping' | 'online';

export type SponsoredWhy = 'query' | 'category' | 'place' | 'shipping';

export type SponsoredCandidateInput = {
  listingId: string;
  sellerUserId: string;
  title: string;
  businessName: string;
  category: string | null;
  marketplaceCategory: string | null;
  delivery: string | null;
  plan: SponsoredPlan;
  distanceKm: number | null;
  country: string | null;
  active: boolean;
  publicListing: boolean;
};

export type SponsoredContext = {
  query: string | null;
  category: string | null;
  radiusKm: number | null;
  country: string | null;
  viewerUserId: string | null;
  excludeListingIds: string[];
  seenSellerIds: string[];
};

export type EligibleSponsored = {
  candidate: SponsoredCandidateInput;
  relevanceScore: number;
  why: SponsoredWhy;
  weight: number;
};

const FOOD = ['eten', 'food', 'cheff', 'chef', 'maaltijd'];
const GARDEN = ['tuin', 'garden', 'grown', 'grow'];
const DESIGN = ['design', 'designer', 'creatie', 'creation'];
const SERVICE = ['dienst', 'service', 'practical_service', 'artistic_service', 'knowledge'];

/**
 * Server env only. Unset, 0, and false stay off.
 * NEXT_PUBLIC cannot turn the API on by itself.
 */
export function sponsoredRecommendationsEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const raw = (env.SPONSORED_RECOMMENDATIONS_ENABLED ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true';
}

export const SPONSORED_IMPRESSION_MIN_RATIO = 0.5;
export const SPONSORED_IMPRESSION_MIN_MS = 1000;

export function sponsoredImpressionQualified(ratio: number, visibleMs: number): boolean {
  return ratio >= SPONSORED_IMPRESSION_MIN_RATIO && visibleMs >= SPONSORED_IMPRESSION_MIN_MS;
}

export function sponsoredImpressionStorageKey(listingId: string, day: string): string {
  return `hc-sp-imp:${listingId}:${day}`;
}

/** A qualified view is counted once. Storage still requires analytics consent. */
export function shouldStoreSponsoredImpression(input: {
  ratio: number;
  visibleMs: number;
  alreadyStored: boolean;
  analyticsConsent: boolean;
}): { count: boolean; store: boolean } {
  if (!sponsoredImpressionQualified(input.ratio, input.visibleMs) || input.alreadyStored) {
    return { count: false, store: false };
  }
  return { count: true, store: input.analyticsConsent };
}

/** Inserting a card into the viewport after the user has scrolled moves the feed. */
export function shouldRevealSponsoredCard(input: {
  hasItem: boolean;
  scrollY: number;
  anchorTop: number;
  viewportHeight: number;
}): boolean {
  if (!input.hasItem) return false;
  const userScrolled = input.scrollY > 8;
  const anchorVisible = input.anchorTop < input.viewportHeight;
  if (userScrolled && anchorVisible) return false;
  return true;
}

export function sponsoredClickBlocksNavigation(): boolean {
  return false;
}

export function sponsoredFulfillment(input: {
  delivery: string | null;
  marketplaceCategory: string | null;
}): SponsoredFulfillment {
  const delivery = (input.delivery ?? '').toUpperCase();
  const category = (input.marketplaceCategory ?? '').toUpperCase();
  if (delivery === 'SHIPPING') return 'shipping';
  if (category === 'KNOWLEDGE') return 'online';
  return 'local';
}

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokens(value: string): string[] {
  return fold(value)
    .split(' ')
    .filter((token) => token.length >= 3);
}

function family(value: string | null | undefined): string | null {
  const text = fold(value ?? '');
  if (!text) return null;
  if (FOOD.some((item) => text.includes(item))) return 'food';
  if (GARDEN.some((item) => text.includes(item))) return 'garden';
  if (DESIGN.some((item) => text.includes(item))) return 'design';
  if (SERVICE.some((item) => text.includes(item))) return 'service';
  return text;
}

function queryMatches(query: string, candidate: SponsoredCandidateInput): boolean {
  const parts = tokens(query);
  if (parts.length === 0) return false;
  const haystack = fold(`${candidate.title} ${candidate.businessName} ${candidate.category ?? ''}`);
  return parts.some((token) => haystack.includes(token));
}

function sameFamily(left: string | null, right: string | null): boolean {
  if (!left || !right) return false;
  return family(left) === family(right);
}

export function isSponsoredCandidateEligible(
  candidate: SponsoredCandidateInput,
  context: SponsoredContext,
): EligibleSponsored | null {
  if (!candidate.active || !candidate.publicListing) return null;
  if (!candidate.plan) return null;
  if (context.viewerUserId && context.viewerUserId === candidate.sellerUserId) return null;
  if (context.excludeListingIds.includes(candidate.listingId)) return null;
  if (context.seenSellerIds.includes(candidate.sellerUserId)) return null;

  const query = context.query?.trim() ?? '';
  if (query.length < 3 && !context.category?.trim()) return null;
  let queryScore = 0;
  if (query.length >= 3) {
    if (!queryMatches(query, candidate)) return null;
    queryScore = 50;
  }

  let categoryScore = 15;
  if (context.category?.trim()) {
    const listingCategory = candidate.marketplaceCategory || candidate.category;
    if (!sameFamily(context.category, listingCategory) && !sameFamily(context.category, candidate.title)) {
      return null;
    }
    categoryScore = 30;
  }

  const mode = sponsoredFulfillment(candidate);
  let geoScore = 0;
  let why: SponsoredWhy = queryScore > 0 ? 'query' : context.category ? 'category' : 'place';
  if (context.country && candidate.country && fold(context.country) !== fold(candidate.country)) {
    return null;
  }
  if (mode === 'local') {
    const radius = context.radiusKm;
    if (radius != null && radius > 0) {
      if (candidate.distanceKm == null || candidate.distanceKm > radius) return null;
    }
    if (candidate.distanceKm == null && radius != null && radius > 0) return null;
    geoScore = candidate.distanceKm != null ? 20 : 10;
    if (queryScore === 0) why = 'place';
  } else {
    geoScore = 12;
    if (queryScore === 0 && !context.category) why = 'shipping';
  }

  const relevanceScore = queryScore + categoryScore + geoScore;
  if (relevanceScore < SPONSORED_RELEVANCE_THRESHOLD) return null;
  return {
    candidate,
    relevanceScore,
    why,
    weight: SPONSORED_DISTRIBUTION_WEIGHT[candidate.plan],
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function bestListingForSeller(rows: EligibleSponsored[], seed: string): EligibleSponsored {
  return [...rows].sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    return (
      hashString(`${seed}:${a.candidate.listingId}`) - hashString(`${seed}:${b.candidate.listingId}`)
    );
  })[0];
}

/**
 * One ticket per business. Extra listings can change which offer is shown,
 * not how often the business is chosen.
 */
export function selectSponsoredRecommendation(
  candidates: SponsoredCandidateInput[],
  context: SponsoredContext,
  seed: string,
): EligibleSponsored | null {
  const eligible = candidates
    .map((candidate) => isSponsoredCandidateEligible(candidate, context))
    .filter((row): row is EligibleSponsored => row != null);
  if (eligible.length === 0) return null;
  const bySeller = new Map<string, EligibleSponsored[]>();
  for (const row of eligible) {
    const list = bySeller.get(row.candidate.sellerUserId) ?? [];
    list.push(row);
    bySeller.set(row.candidate.sellerUserId, list);
  }
  const tickets = [...bySeller.values()].map((rows) => bestListingForSeller(rows, seed));
  const scale = 1000;
  const weighted = tickets
    .map((row) => ({ row, units: Math.max(1, Math.round(row.weight * scale)) }))
    .sort((a, b) => a.row.candidate.sellerUserId.localeCompare(b.row.candidate.sellerUserId));
  const total = weighted.reduce((sum, entry) => sum + entry.units, 0);
  let cursor = hashString(`${seed}:pick`) % total;
  for (const entry of weighted) {
    if (cursor < entry.units) return entry.row;
    cursor -= entry.units;
  }
  return weighted[0]?.row ?? null;
}
