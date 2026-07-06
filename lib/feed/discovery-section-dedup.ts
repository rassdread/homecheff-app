/**
 * Discovery section deduplication — listing, seller, and cross-section rules.
 * @see docs/architecture/DISCOVERY_SECTION_REGISTRY.md
 */

import type { DiscoverySectionId } from '@/lib/discovery/sections';
import type { DiscoverySectionResult } from '@/lib/discovery/sections';
import type { DiscoveryFeedDedupSummary } from './discovery-feed-contract';

export type DiscoveryDedupConfig = {
  /** Max listings from the same seller within one section. */
  maxListingsPerSellerPerSection: number;
  /** Max listings from the same seller across all sections combined. */
  maxListingsPerSellerGlobal: number;
  /** Each listing may appear in at most N sections (1 = strict cross-section dedup). */
  maxListingAppearancesCrossSection: number;
  /** Prevent the same seller dominating consecutive sections. */
  preventAdjacentSellerOverlap: boolean;
};

export const DEFAULT_DISCOVERY_DEDUP_CONFIG: DiscoveryDedupConfig = {
  maxListingsPerSellerPerSection: 2,
  maxListingsPerSellerGlobal: 4,
  maxListingAppearancesCrossSection: 1,
  preventAdjacentSellerOverlap: true,
};

export type DedupedSectionSlice = {
  sectionId: DiscoverySectionId;
  titleKey: string;
  rankingProfileId: string;
  listingIds: string[];
  sellerIds: string[];
};

/**
 * Apply dedup across built sections. Mutates selection order only — does not re-rank.
 */
export function deduplicateDiscoverySections(
  sections: DiscoverySectionResult[],
  sellerIdByListingId: Map<string, string>,
  config: DiscoveryDedupConfig = DEFAULT_DISCOVERY_DEDUP_CONFIG,
): { sections: DedupedSectionSlice[]; summary: DiscoveryFeedDedupSummary } {
  const globalListingCounts = new Map<string, number>();
  const globalSellerCounts = new Map<string, number>();
  const sectionSellerCounts = new Map<string, Map<string, number>>();
  let listingsRemovedCrossSection = 0;
  let listingsRemovedPerSellerCap = 0;
  let sellersCapped = 0;

  const deduped: DedupedSectionSlice[] = [];
  let previousSectionSellers = new Set<string>();

  for (const section of sections) {
    const perSectionSeller = new Map<string, number>();
    const listingIds: string[] = [];
    const sellerIds: string[] = [];
    const sectionSellers = new Set<string>();

    for (const row of section.ranked) {
      const listingId = row.input.readModel.id;
      const sellerId =
        sellerIdByListingId.get(listingId) ?? listingId;

      const crossCount = globalListingCounts.get(listingId) ?? 0;
      if (crossCount >= config.maxListingAppearancesCrossSection) {
        listingsRemovedCrossSection += 1;
        continue;
      }

      const inSection = perSectionSeller.get(sellerId) ?? 0;
      if (inSection >= config.maxListingsPerSellerPerSection) {
        listingsRemovedPerSellerCap += 1;
        sellersCapped += 1;
        continue;
      }

      const globalSeller = globalSellerCounts.get(sellerId) ?? 0;
      if (globalSeller >= config.maxListingsPerSellerGlobal) {
        listingsRemovedPerSellerCap += 1;
        sellersCapped += 1;
        continue;
      }

      if (
        config.preventAdjacentSellerOverlap &&
        deduped.length > 0 &&
        previousSectionSellers.has(sellerId) &&
        listingIds.length === 0
      ) {
        listingsRemovedPerSellerCap += 1;
        continue;
      }

      listingIds.push(listingId);
      if (!sellerIds.includes(sellerId)) sellerIds.push(sellerId);
      sectionSellers.add(sellerId);
      perSectionSeller.set(sellerId, inSection + 1);
      globalSellerCounts.set(sellerId, globalSeller + 1);
      globalListingCounts.set(listingId, crossCount + 1);
    }

    sectionSellerCounts.set(section.sectionId, perSectionSeller);
    previousSectionSellers = sectionSellers;

    if (listingIds.length > 0) {
      deduped.push({
        sectionId: section.sectionId,
        titleKey: section.titleKey,
        rankingProfileId: section.rankingProfileId,
        listingIds,
        sellerIds,
      });
    }
  }

  return {
    sections: deduped,
    summary: {
      listingsRemovedCrossSection,
      listingsRemovedPerSellerCap,
      sellersCapped,
    },
  };
}