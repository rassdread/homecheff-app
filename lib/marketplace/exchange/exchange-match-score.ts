/**
 * Exchange match score model — Phase 4D.
 * Allowed signals only — no views, HCP, followers, props, blended ratings.
 */

import type { DiscoveryTrustContract } from '@/lib/discovery/contracts/discovery-trust-contract';
import type { ExchangeListingProfile } from './exchange-contract';
import type { ExchangeOverlapResult } from './exchange-contract';
import { FORBIDDEN_EXCHANGE_SCORE_SIGNALS } from './exchange-contract';

export type ExchangeScoreSignals = {
  categoryOverlap: number;
  subcategoryOverlap: number;
  desiredExchangeOverlap: number;
  distanceKm: number | null;
  distanceScore: number;
  availabilityScore: number;
  trustEligibilityScore: number;
  recencyScore: number;
};

export type ExchangeScoreWeights = {
  categoryOverlap: number;
  subcategoryOverlap: number;
  desiredExchangeOverlap: number;
  distance: number;
  availability: number;
  trustEligibility: number;
  recency: number;
};

export const DEFAULT_EXCHANGE_SCORE_WEIGHTS: ExchangeScoreWeights = {
  categoryOverlap: 0.22,
  subcategoryOverlap: 0.28,
  desiredExchangeOverlap: 0.25,
  distance: 0.1,
  availability: 0.05,
  trustEligibility: 0.05,
  recency: 0.05,
};

const MAX_DISTANCE_KM = 25;

export function scoreCategoryOverlap(
  overlap: ExchangeOverlapResult,
): number {
  if (overlap.sharedMainCategories.length === 0) return 0;
  return Math.min(1, overlap.sharedMainCategories.length / 3);
}

export function scoreSubcategoryOverlap(
  overlap: ExchangeOverlapResult,
  a: ExchangeListingProfile,
  b: ExchangeListingProfile,
): number {
  if (overlap.sharedSubcategoryIds.length === 0) return 0;
  const union = new Set([
    ...a.offer.subcategoryIds,
    ...b.offer.subcategoryIds,
    ...(a.acceptance?.subcategoryIds ?? []),
    ...(b.acceptance?.subcategoryIds ?? []),
  ]);
  if (union.size === 0) return 0;
  return Math.min(1, overlap.sharedSubcategoryIds.length / union.size);
}

export function scoreDesiredExchangeOverlap(
  overlap: ExchangeOverlapResult,
): number {
  if (overlap.offerMatchesDesired.length === 0) return 0;
  return Math.min(1, overlap.offerMatchesDesired.length / 2);
}

export function scoreDistance(distanceKm: number | null): number {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return 0.5;
  if (distanceKm <= 0) return 1;
  if (distanceKm >= MAX_DISTANCE_KM) return 0;
  return 1 - distanceKm / MAX_DISTANCE_KM;
}

export function scoreAvailability(
  a: ExchangeListingProfile,
  b: ExchangeListingProfile,
  now = Date.now(),
): number {
  let score = 1;
  for (const p of [a, b]) {
    if (p.availabilityDate) {
      const ts = Date.parse(p.availabilityDate);
      if (Number.isFinite(ts) && ts < now) score *= 0.5;
    }
    if (!p.isActive) score = 0;
  }
  return score;
}

export function scoreTrustEligibility(
  trustA: DiscoveryTrustContract | null | undefined,
  trustB: DiscoveryTrustContract | null | undefined,
): number {
  const tierA = trustA?.sellerTier ?? 0;
  const tierB = trustB?.sellerTier ?? 0;
  const minTier = Math.min(tierA, tierB);
  if (minTier >= 3) return 1;
  if (minTier >= 2) return 0.7;
  if (minTier >= 1) return 0.4;
  return 0.2;
}

export function scoreRecency(
  a: ExchangeListingProfile,
  b: ExchangeListingProfile,
  now = Date.now(),
): number {
  const ages = [a, b].map((p) => {
    const ts = Date.parse(p.createdAt);
    if (!Number.isFinite(ts)) return 90;
    return Math.max(0, (now - ts) / 86_400_000);
  });
  const avgDays = ages.reduce((s, d) => s + d, 0) / ages.length;
  if (avgDays <= 7) return 1;
  if (avgDays <= 30) return 0.7;
  if (avgDays <= 90) return 0.4;
  return 0.2;
}

export function buildExchangeScoreSignals(input: {
  overlap: ExchangeOverlapResult;
  a: ExchangeListingProfile;
  b: ExchangeListingProfile;
  distanceKm?: number | null;
  trustA?: DiscoveryTrustContract | null;
  trustB?: DiscoveryTrustContract | null;
  now?: number;
}): ExchangeScoreSignals {
  const now = input.now ?? Date.now();
  const distanceKm =
    input.distanceKm ??
    input.a.distanceKm ??
    input.b.distanceKm ??
    null;

  return {
    categoryOverlap: scoreCategoryOverlap(input.overlap),
    subcategoryOverlap: scoreSubcategoryOverlap(
      input.overlap,
      input.a,
      input.b,
    ),
    desiredExchangeOverlap: scoreDesiredExchangeOverlap(input.overlap),
    distanceKm,
    distanceScore: scoreDistance(distanceKm),
    availabilityScore: scoreAvailability(input.a, input.b, now),
    trustEligibilityScore: scoreTrustEligibility(input.trustA, input.trustB),
    recencyScore: scoreRecency(input.a, input.b, now),
  };
}

export function computeExchangeMatchScore(
  signals: ExchangeScoreSignals,
  weights: ExchangeScoreWeights = DEFAULT_EXCHANGE_SCORE_WEIGHTS,
): number {
  const raw =
    signals.categoryOverlap * weights.categoryOverlap +
    signals.subcategoryOverlap * weights.subcategoryOverlap +
    signals.desiredExchangeOverlap * weights.desiredExchangeOverlap +
    signals.distanceScore * weights.distance +
    signals.availabilityScore * weights.availability +
    signals.trustEligibilityScore * weights.trustEligibility +
    signals.recencyScore * weights.recency;

  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

export function scorePayloadIsClean(
  payload: Record<string, unknown>,
): { clean: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const key of FORBIDDEN_EXCHANGE_SCORE_SIGNALS) {
    if (key in payload) violations.push(key);
  }
  return { clean: violations.length === 0, violations };
}
