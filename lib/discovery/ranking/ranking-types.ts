/**
 * Discovery ranking engine types — Phase 2C.
 * @see docs/architecture/DISCOVERY_RANKING_SIGNAL_MATRIX.md
 */

import type { DiscoveryRankingInput } from '../contracts/discovery-ranking-contract';

/** Supported ranking profiles — one engine, many profiles. */
export type DiscoveryRankingProfileId =
  | 'baseline'
  | 'trusted_maker'
  | 'top_rated'
  | 'trending'
  | 'nearby'
  | 'new_creators';

export type RankingViewerContext = {
  distanceKm?: number | null;
  /** Max distance for nearby section (default 25 km). */
  radiusKm?: number;
  acceptedSpecializationOverlap?: string[];
};

export type RankDiscoveryOptions = {
  profileId: DiscoveryRankingProfileId;
  viewer?: RankingViewerContext;
  /** When true, ineligible items are included at the tail with score -Infinity. */
  includeIneligible?: boolean;
};

export type RankedDiscoveryItem = {
  input: DiscoveryRankingInput;
  score: number;
  profileId: DiscoveryRankingProfileId;
  eligible: boolean;
  ineligibleReason?: string;
};

export type DiscoveryRankingProfile = {
  id: DiscoveryRankingProfileId;
  description: string;
  /** Signals this profile may use — documentation + CI guard reference. */
  allowedSignals: readonly string[];
  /** Signals explicitly forbidden for this profile. */
  forbiddenSignals: readonly string[];
  isEligible: (
    input: DiscoveryRankingInput,
    viewer?: RankingViewerContext,
  ) => { eligible: boolean; reason?: string };
  computeScore: (
    input: DiscoveryRankingInput,
    viewer?: RankingViewerContext,
  ) => number;
};

/** Legacy field keys that must never influence ranking scores. */
export const LEGACY_FORBIDDEN_RANKING_KEYS = [
  'viewCount',
  'averageRating',
  'propsCount',
  'reviewCount',
  'followerCount',
  'hcpPoints',
  'workspacePropsCount',
  'fansCount',
  'blendedRating',
  'reputationScore',
] as const;

export type LegacyForbiddenRankingKey =
  (typeof LEGACY_FORBIDDEN_RANKING_KEYS)[number];
