/**
 * Section eligibility audits — counts and distribution for Phase 2D reporting.
 */

import type { DiscoveryReadModel } from '../contracts/discovery-read-model';
import {
  rankDiscoveryReadModels,
  combinedReviewCount,
  type RankedDiscoveryItem,
  type RankingViewerContext,
} from '../ranking';
import type {
  DiscoverySectionAudit,
  DiscoverySectionId,
  SectionEligibilityCounts,
  TrustedMakersAudit,
} from './section-types';
import { getDiscoverySectionDefinition } from './section-registry';

function countByReason(
  ranked: RankedDiscoveryItem[],
): SectionEligibilityCounts {
  const byReason: Record<string, number> = {};
  let eligible = 0;
  for (const row of ranked) {
    if (row.eligible) {
      eligible += 1;
    } else {
      const reason = row.ineligibleReason ?? 'unknown';
      byReason[reason] = (byReason[reason] ?? 0) + 1;
    }
  }
  return {
    total: ranked.length,
    eligible,
    ineligible: ranked.length - eligible,
    byReason,
  };
}

function auditTrustedMakers(
  readModels: DiscoveryReadModel[],
  ranked: RankedDiscoveryItem[],
): TrustedMakersAudit {
  const tierDistribution: Record<number, number> = {};
  const reviewCountBuckets = {
    under3: 0,
    from3to9: 0,
    tenPlus: 0,
  };
  const eligibleSellerIds: string[] = [];

  for (const rm of readModels) {
    const tier = rm.trust.sellerTier;
    tierDistribution[tier] = (tierDistribution[tier] ?? 0) + 1;
    const reviews = combinedReviewCount({ readModel: rm, trust: rm.trust });
    if (reviews < 3) reviewCountBuckets.under3 += 1;
    else if (reviews < 10) reviewCountBuckets.from3to9 += 1;
    else reviewCountBuckets.tenPlus += 1;
  }

  for (const row of ranked) {
    if (!row.eligible) continue;
    const sellerId = row.input.readModel.id;
    if (!eligibleSellerIds.includes(sellerId)) {
      eligibleSellerIds.push(sellerId);
    }
  }

  return {
    tierDistribution,
    reviewCountBuckets,
    eligibleSellerIds,
  };
}

export function auditDiscoverySection(
  sectionId: DiscoverySectionId,
  readModels: DiscoveryReadModel[],
  viewer?: RankingViewerContext,
): DiscoverySectionAudit {
  const def = getDiscoverySectionDefinition(sectionId);
  const ranked = rankDiscoveryReadModels(readModels, {
    profileId: def.rankingProfileId,
    viewer,
    includeIneligible: true,
  });

  const audit: DiscoverySectionAudit = {
    sectionId,
    counts: countByReason(ranked),
  };

  if (sectionId === 'trusted_makers') {
    audit.trustedMakers = auditTrustedMakers(readModels, ranked);
  }

  return audit;
}

export function auditAllDiscoverySections(
  readModels: DiscoveryReadModel[],
  viewer?: RankingViewerContext,
): DiscoverySectionAudit[] {
  return (
    ['nearby', 'trusted_makers', 'top_rated', 'trending', 'new_creators'] as const
  ).map((id) => auditDiscoverySection(id, readModels, viewer));
}
