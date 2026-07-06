/**
 * Exchange matching resolver — Phase 4D foundation.
 */

import type { BarterOpenness, MarketplaceCategory } from '@prisma/client';
import type { DiscoveryTrustContract } from '@/lib/discovery/contracts/discovery-trust-contract';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { DesiredExchangeDetail } from '@/lib/marketplace/value-exchange/value-exchange-contract';
import {
  buildBarterAcceptanceModel,
  marketplaceCategoryToMainCategory,
  resolvePaymentMethod,
} from '@/lib/marketplace/value-exchange';
import { getMarketplaceTaxonomyItem } from '@/lib/marketplace/taxonomy-resolve';
import type {
  ExchangeAcceptanceModel,
  ExchangeListingProfile,
  ExchangeOfferModel,
} from './exchange-contract';
import { exchangeMatchId, exchangeProfileId } from './exchange-contract';
import {
  bothProfilesEligibleForMatching,
  profileIsExchangeEligible,
} from './exchange-eligibility';
import { computeExchangeOverlap } from './exchange-overlap';
import {
  buildExchangeScoreSignals,
  computeExchangeMatchScore,
} from './exchange-match-score';
import type { ExchangeMatchDimension } from './exchange-match-types';
import {
  resolvePrimaryMatchType,
  type ExchangeMatchResult,
} from './exchange-match-types';
import { deriveExchangeSignals } from './exchange-signals';
import {
  buildExchangeGraph,
  graphEdgeId,
  graphNodeId,
  type ExchangeGraph,
  type ExchangeGraphEdge,
} from './exchange-graph';

export type BuildExchangeProfileInput = {
  listingId: string;
  userId: string;
  listingKind: ListingKind;
  listingIntent: 'OFFER' | 'REQUEST';
  marketplaceCategory: MarketplaceCategory | null;
  specializationIds: string[];
  acceptedTaxonomyIds: string[];
  barterOpenness?: string | null;
  priceModel?: string | null;
  desiredExchanges?: DesiredExchangeDetail[];
  distanceKm?: number | null;
  createdAt: string;
  expiresAt?: string | null;
  availabilityDate?: string | null;
  isActive?: boolean;
  isDiscoverable?: boolean;
  isBlocked?: boolean;
};

export type ResolveExchangeMatchInput = {
  a: ExchangeListingProfile;
  b: ExchangeListingProfile;
  distanceKm?: number | null;
  trustA?: DiscoveryTrustContract | null;
  trustB?: DiscoveryTrustContract | null;
  now?: number;
};

export type ResolvedExchangeMatch = {
  match: ExchangeMatchResult;
  overlap: ReturnType<typeof computeExchangeOverlap>;
  scoreSignals: ReturnType<typeof buildExchangeScoreSignals>;
  signals: ReturnType<typeof deriveExchangeSignals>;
};

export function buildExchangeOfferModel(input: {
  listingKind: ListingKind;
  marketplaceCategory: MarketplaceCategory | null;
  specializationIds: string[];
}): ExchangeOfferModel {
  const primary = input.specializationIds[0] ?? null;
  const item = primary ? getMarketplaceTaxonomyItem(primary) : null;
  const mainCategory = marketplaceCategoryToMainCategory(
    input.marketplaceCategory ?? 'CREATE',
    primary,
    input.listingKind,
  );

  return {
    mainCategory,
    subcategoryIds: input.specializationIds,
    primarySubcategoryId: primary,
    labelKey: item?.labelKey ?? null,
    listingKind: input.listingKind,
    marketplaceCategory: input.marketplaceCategory,
  };
}

export function buildExchangeAcceptanceModel(input: {
  acceptedTaxonomyIds: string[];
  barterOpenness?: string | null;
  priceModel?: string | null;
}): ExchangeAcceptanceModel | null {
  const openness = String(input.barterOpenness ?? 'MONEY').toUpperCase() as BarterOpenness;
  if (openness === 'MONEY') return null;

  const barter = buildBarterAcceptanceModel({
    barterOpenness: openness,
    acceptedTaxonomyIds: input.acceptedTaxonomyIds,
  });
  if (!barter) return null;

  return {
    mainCategories: barter.acceptedMainCategories,
    subcategoryIds: barter.acceptedTaxonomyIds,
    barterOpenness: openness,
    paymentMethod: resolvePaymentMethod({
      barterOpenness: openness,
      priceModel: input.priceModel,
    }),
  };
}

export function buildExchangeListingProfile(
  input: BuildExchangeProfileInput,
): ExchangeListingProfile {
  return {
    listingId: input.listingId,
    userId: input.userId,
    listingIntent: input.listingIntent,
    offer: buildExchangeOfferModel({
      listingKind: input.listingKind,
      marketplaceCategory: input.marketplaceCategory,
      specializationIds: input.specializationIds,
    }),
    acceptance: buildExchangeAcceptanceModel({
      acceptedTaxonomyIds: input.acceptedTaxonomyIds,
      barterOpenness: input.barterOpenness,
      priceModel: input.priceModel,
    }),
    desiredExchanges: input.desiredExchanges ?? [],
    distanceKm: input.distanceKm ?? null,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt ?? null,
    availabilityDate: input.availabilityDate ?? null,
    isActive: input.isActive ?? true,
    isDiscoverable: input.isDiscoverable ?? true,
    isBlocked: input.isBlocked ?? false,
  };
}

function deriveMatchDimensions(
  overlap: ReturnType<typeof computeExchangeOverlap>,
): ExchangeMatchDimension[] {
  const dims: ExchangeMatchDimension[] = [];
  if (overlap.offerMatchesDesired.length > 0) dims.push('direct_offer_wants');
  if (overlap.sharedMainCategories.length > 0) dims.push('category_overlap');
  if (overlap.sharedSubcategoryIds.length > 0) dims.push('subcategory_overlap');
  if (overlap.offerMatchesDesired.length > 0) dims.push('desired_exchange_overlap');
  if (overlap.mutualBarterReady) dims.push('mutual_acceptance');
  return dims;
}

export function shouldSuppressMatchPair(
  a: ExchangeListingProfile,
  b: ExchangeListingProfile,
): { suppress: boolean; reason: string | null } {
  if (a.listingId === b.listingId) {
    return { suppress: true, reason: 'same_listing' };
  }
  if (a.userId === b.userId) {
    return { suppress: true, reason: 'same_user' };
  }
  return { suppress: false, reason: null };
}

export function resolveExchangeMatch(
  input: ResolveExchangeMatchInput,
): ResolvedExchangeMatch | null {
  const suppression = shouldSuppressMatchPair(input.a, input.b);
  const eligible = bothProfilesEligibleForMatching(
    input.a,
    input.b,
    input.now,
  );

  const overlap = computeExchangeOverlap(input.a, input.b);
  const dimensions = deriveMatchDimensions(overlap);

  if (dimensions.length === 0 && !suppression.suppress) {
    return null;
  }

  const scoreSignals = buildExchangeScoreSignals({
    overlap,
    a: input.a,
    b: input.b,
    distanceKm: input.distanceKm,
    trustA: input.trustA,
    trustB: input.trustB,
    now: input.now,
  });

  const score = computeExchangeMatchScore(scoreSignals);
  const type = resolvePrimaryMatchType(dimensions);

  const match: ExchangeMatchResult = {
    id: exchangeMatchId(input.a.listingId, input.b.listingId),
    type,
    listingAId: input.a.listingId,
    listingBId: input.b.listingId,
    userAId: input.a.userId,
    userBId: input.b.userId,
    score: suppression.suppress || !eligible ? 0 : score,
    dimensions,
    suppressed: suppression.suppress || !eligible,
    suppressionReason: suppression.reason ?? (!eligible ? 'ineligible' : null),
  };

  const signals = deriveExchangeSignals({
    a: input.a,
    b: input.b,
    overlap,
    signals: scoreSignals,
    matchScore: match.score,
  });

  return { match, overlap, scoreSignals, signals };
}

export function findExchangeMatchesForListing(
  source: ExchangeListingProfile,
  candidates: ExchangeListingProfile[],
  options: {
    trustByUserId?: Record<string, DiscoveryTrustContract>;
    minScore?: number;
    limit?: number;
    now?: number;
  } = {},
): ResolvedExchangeMatch[] {
  if (!profileIsExchangeEligible(source, options.now).eligible) return [];

  const minScore = options.minScore ?? 1;
  const limit = options.limit ?? 20;
  const results: ResolvedExchangeMatch[] = [];

  for (const candidate of candidates) {
    if (candidate.listingId === source.listingId) continue;

    const resolved = resolveExchangeMatch({
      a: source,
      b: candidate,
      distanceKm: candidate.distanceKm,
      trustA: options.trustByUserId?.[source.userId],
      trustB: options.trustByUserId?.[candidate.userId],
      now: options.now,
    });

    if (!resolved || resolved.match.suppressed) continue;
    if (resolved.match.score < minScore) continue;
    results.push(resolved);
  }

  return results
    .sort((x, y) => y.match.score - x.match.score)
    .slice(0, limit);
}

export function buildExchangeGraphFromMatches(
  profiles: ExchangeListingProfile[],
  matches: ResolvedExchangeMatch[],
): ExchangeGraph {
  const edges: Omit<ExchangeGraphEdge, 'id'>[] = [];

  for (const m of matches) {
    if (m.match.suppressed) continue;
    edges.push({
      fromNodeId: graphNodeId(m.match.listingAId),
      toNodeId: graphNodeId(m.match.listingBId),
      fromListingId: m.match.listingAId,
      toListingId: m.match.listingBId,
      matchType: m.match.type,
      score: m.match.score,
      direction:
        m.overlap.offerMatchesDesired.length > 0
          ? 'offer_to_want'
          : 'bidirectional',
    });
  }

  return buildExchangeGraph({ profiles, edges });
}

export function exchangeProfileSummary(profile: ExchangeListingProfile): {
  profileId: string;
  offerMainCategory: string;
  acceptsCount: number;
  wantsCount: number;
} {
  return {
    profileId: exchangeProfileId(profile.listingId),
    offerMainCategory: profile.offer.mainCategory,
    acceptsCount: profile.acceptance?.mainCategories.length ?? 0,
    wantsCount: profile.desiredExchanges.length,
  };
}
