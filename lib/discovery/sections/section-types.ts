/**
 * Discovery section registry types — Phase 2D.
 * @see docs/architecture/DISCOVERY_SECTION_ELIGIBILITY.md
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { DiscoveryReadModel } from '../contracts/discovery-read-model';
import type {
  DiscoveryRankingProfileId,
  RankedDiscoveryItem,
  RankingViewerContext,
} from '../ranking';

/** Canonical discovery section identifiers. */
export type DiscoverySectionId =
  | 'nearby'
  | 'trusted_makers'
  | 'top_rated'
  | 'trending'
  | 'new_creators';

/** Human-readable eligibility summary for docs and audits. */
export type SectionEligibilitySpec = {
  minSellerTier?: number;
  maxSellerTier?: number;
  minCombinedReviews?: number;
  minChannelReviews?: number;
  maxDistanceKm?: number;
  maxListingAgeDays?: number;
  minFavorites?: number;
  recencyDays?: number;
  requireMedia?: boolean;
  requireDescriptionMinLength?: number;
  requireActive?: boolean;
  excludeListingKinds?: ListingKind[];
};

export type DiscoverySectionDefinition = {
  id: DiscoverySectionId;
  /** i18n key — UI not wired in Phase 2D. */
  titleKey: string;
  description: string;
  rankingProfileId: DiscoveryRankingProfileId;
  defaultLimit: number;
  allowedListingKinds: readonly ListingKind[];
  eligibility: SectionEligibilitySpec;
  /** Signals that must never influence this section. */
  forbiddenSignals: readonly string[];
};

export type BuildSectionOptions = {
  limit?: number;
  viewer?: RankingViewerContext;
  /** Include eligibility audit metadata (counts, distribution). */
  includeAudit?: boolean;
  /** When true, ineligible items appear at tail (debug only). */
  includeIneligible?: boolean;
};

export type SectionEligibilityCounts = {
  total: number;
  eligible: number;
  ineligible: number;
  byReason: Record<string, number>;
};

export type TrustedMakersAudit = {
  tierDistribution: Record<number, number>;
  reviewCountBuckets: {
    under3: number;
    from3to9: number;
    tenPlus: number;
  };
  eligibleSellerIds: string[];
};

export type DiscoverySectionAudit = {
  sectionId: DiscoverySectionId;
  counts: SectionEligibilityCounts;
  trustedMakers?: TrustedMakersAudit;
};

export type DiscoverySectionResult = {
  sectionId: DiscoverySectionId;
  titleKey: string;
  rankingProfileId: DiscoveryRankingProfileId;
  items: DiscoveryReadModel[];
  ranked: RankedDiscoveryItem[];
  limit: number;
  audit?: DiscoverySectionAudit;
};
