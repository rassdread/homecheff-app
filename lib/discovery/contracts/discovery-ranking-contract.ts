/**
 * Discovery Ranking Contract — allowed inputs for Phase 2B ranking (spec only).
 * @see docs/architecture/DISCOVERY_RANKING_SIGNAL_MATRIX.md
 *
 * No scoring functions. No sort implementation. Defines what ranking MAY consume.
 */

import type { DiscoveryReadModel } from './discovery-read-model';
import type { DiscoveryTrustContract } from './discovery-trust-contract';

/** Ranking-eligible signal identifiers — matrix in DISCOVERY_RANKING_SIGNAL_MATRIX.md */
export type DiscoveryRankingSignalId =
  | 'product_review_count'
  | 'deal_review_count'
  | 'courier_review_count'
  | 'completed_deals'
  | 'completed_deliveries'
  | 'repeat_customers'
  | 'trust_tier_seller'
  | 'trust_tier_courier'
  | 'trust_badges'
  | 'distance_km'
  | 'recency'
  | 'listing_kind'
  | 'marketplace_category'
  | 'specializations'
  | 'accepted_specializations'
  | 'barter_openness'
  | 'favorite_count_limited'
  | 'response_time_median';

/** Signals explicitly forbidden for ranking sort keys. */
export type DiscoveryRankingForbiddenSignalId =
  | 'follower_count'
  | 'hcp_points'
  | 'view_count'
  | 'workspace_props'
  | 'dish_reviews'
  | 'blended_rating'
  | 'reputation_score'
  | 'account_age_sort'
  | 'kvk_presence';

export const DISCOVERY_RANKING_FORBIDDEN_SIGNALS: readonly DiscoveryRankingForbiddenSignalId[] =
  [
    'follower_count',
    'hcp_points',
    'view_count',
    'workspace_props',
    'dish_reviews',
    'blended_rating',
    'reputation_score',
    'account_age_sort',
    'kvk_presence',
  ] as const;

/**
 * Minimum input for any discovery ranking pass — built from DiscoveryReadModel + trust enrichment.
 * Phase 2B implementers must not read legacy feed/profile payloads alongside this.
 */
export type DiscoveryRankingInput = {
  readModel: DiscoveryReadModel;
  trust: DiscoveryTrustContract;
  /** Optional viewer context — personalization only, not global sort without explicit section. */
  viewer?: {
    distanceKm?: number | null;
    acceptedSpecializationOverlap?: string[];
  };
};

/** Ranking use modes — gate vs sort vs personalize vs display-only */
export type RankingSignalUse = 'rank' | 'gate' | 'personalize' | 'display' | 'forbidden';

export type DiscoveryRankingSignalRule = {
  signal: DiscoveryRankingSignalId | DiscoveryRankingForbiddenSignalId;
  rank: RankingSignalUse;
  gate: RankingSignalUse;
  personalize: RankingSignalUse;
  display: RankingSignalUse;
  notes?: string;
};
