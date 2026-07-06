/**
 * Exchange signals — Phase 4D.
 * Human-readable match signals for future UI and recommendations.
 */

import type { ExchangeListingProfile, ExchangeOverlapResult } from './exchange-contract';
import type { ExchangeScoreSignals } from './exchange-match-score';

export const EXCHANGE_SIGNAL_KINDS = [
  'EXACT_DESIRED_MATCH',
  'STRONG_CATEGORY_OVERLAP',
  'POTENTIAL_BARTER_OPPORTUNITY',
  'MUTUAL_EXCHANGE_READINESS',
  'FUTURE_RECOMMENDATION_READY',
] as const;

export type ExchangeSignalKind = (typeof EXCHANGE_SIGNAL_KINDS)[number];

export type ExchangeSignal = {
  kind: ExchangeSignalKind;
  labelKey: string;
  strength: 'low' | 'medium' | 'high';
  listingIds: string[];
};

const KEY = 'marketplace.exchange.signals';

export function deriveExchangeSignals(input: {
  a: ExchangeListingProfile;
  b: ExchangeListingProfile;
  overlap: ExchangeOverlapResult;
  signals: ExchangeScoreSignals;
  matchScore: number;
}): ExchangeSignal[] {
  const out: ExchangeSignal[] = [];
  const ids = [input.a.listingId, input.b.listingId];

  if (input.overlap.offerMatchesDesired.length > 0) {
    out.push({
      kind: 'EXACT_DESIRED_MATCH',
      labelKey: `${KEY}.exactDesiredMatch`,
      strength: 'high',
      listingIds: ids,
    });
  }

  if (
    input.overlap.sharedMainCategories.length >= 2 ||
    input.signals.categoryOverlap >= 0.66
  ) {
    out.push({
      kind: 'STRONG_CATEGORY_OVERLAP',
      labelKey: `${KEY}.strongCategoryOverlap`,
      strength: input.signals.categoryOverlap >= 0.8 ? 'high' : 'medium',
      listingIds: ids,
    });
  }

  const aBarter =
    input.a.acceptance?.barterOpenness === 'BARTER_ONLY' ||
    input.a.acceptance?.barterOpenness === 'MONEY_AND_BARTER';
  const bBarter =
    input.b.acceptance?.barterOpenness === 'BARTER_ONLY' ||
    input.b.acceptance?.barterOpenness === 'MONEY_AND_BARTER';

  if (
    aBarter &&
    bBarter &&
    (input.overlap.sharedSubcategoryIds.length > 0 ||
      input.overlap.sharedMainCategories.length > 0)
  ) {
    out.push({
      kind: 'POTENTIAL_BARTER_OPPORTUNITY',
      labelKey: `${KEY}.potentialBarter`,
      strength: 'medium',
      listingIds: ids,
    });
  }

  if (input.overlap.mutualBarterReady) {
    out.push({
      kind: 'MUTUAL_EXCHANGE_READINESS',
      labelKey: `${KEY}.mutualReadiness`,
      strength: 'high',
      listingIds: ids,
    });
  }

  if (
    input.matchScore >= 60 &&
    input.signals.trustEligibilityScore >= 0.4 &&
    !input.a.isBlocked &&
    !input.b.isBlocked
  ) {
    out.push({
      kind: 'FUTURE_RECOMMENDATION_READY',
      labelKey: `${KEY}.futureRecommendationReady`,
      strength: input.matchScore >= 75 ? 'high' : 'medium',
      listingIds: ids,
    });
  }

  return dedupeSignals(out);
}

function dedupeSignals(signals: ExchangeSignal[]): ExchangeSignal[] {
  const seen = new Set<ExchangeSignalKind>();
  return signals.filter((s) => {
    if (seen.has(s.kind)) return false;
    seen.add(s.kind);
    return true;
  });
}

export function listExchangeSignalKinds(): ExchangeSignalKind[] {
  return [...EXCHANGE_SIGNAL_KINDS];
}
