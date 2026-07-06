/**
 * Discovery section builder — registry → ranking engine → limited results.
 * Phase 2D: no personalization, no API rollout.
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { DiscoveryReadModel } from '../contracts/discovery-read-model';
import { rankDiscoveryReadModels } from '../ranking';
import {
  auditDiscoverySection,
  auditAllDiscoverySections,
} from './section-audit';
import { getDiscoverySectionDefinition } from './section-registry';
import type {
  BuildSectionOptions,
  DiscoverySectionAudit,
  DiscoverySectionId,
  DiscoverySectionResult,
} from './section-types';

function isAllowedListingKind(
  kind: ListingKind,
  allowed: readonly ListingKind[],
): boolean {
  return allowed.includes(kind);
}

/** Pre-filter by registry allowed listing kinds before ranking. */
export function filterSectionCandidates(
  sectionId: DiscoverySectionId,
  readModels: DiscoveryReadModel[],
): DiscoveryReadModel[] {
  const def = getDiscoverySectionDefinition(sectionId);
  return readModels.filter((rm) =>
    isAllowedListingKind(rm.listingKind, def.allowedListingKinds),
  );
}

/**
 * Build one discovery section using the canonical ranking engine.
 */
export function buildDiscoverySection(
  sectionId: DiscoverySectionId,
  readModels: DiscoveryReadModel[],
  options: BuildSectionOptions = {},
): DiscoverySectionResult {
  const def = getDiscoverySectionDefinition(sectionId);
  const limit = options.limit ?? def.defaultLimit;
  const candidates = filterSectionCandidates(sectionId, readModels);

  const ranked = rankDiscoveryReadModels(candidates, {
    profileId: def.rankingProfileId,
    viewer: options.viewer,
    includeIneligible: options.includeIneligible ?? false,
  });

  const eligibleRanked = ranked.filter((r) => r.eligible);
  const selected = eligibleRanked.slice(0, limit);
  const items = selected.map((r) => r.input.readModel);

  let audit: DiscoverySectionAudit | undefined;
  if (options.includeAudit) {
    audit = auditDiscoverySection(sectionId, candidates, options.viewer);
  }

  return {
    sectionId,
    titleKey: def.titleKey,
    rankingProfileId: def.rankingProfileId,
    items,
    ranked: selected,
    limit,
    audit,
  };
}

export type BuildAllSectionsOptions = BuildSectionOptions & {
  sectionIds?: DiscoverySectionId[];
};

/**
 * Build multiple sections from the same candidate pool.
 */
export function buildAllDiscoverySections(
  readModels: DiscoveryReadModel[],
  options: BuildAllSectionsOptions = {},
): DiscoverySectionResult[] {
  const ids =
    options.sectionIds ??
    ([
      'nearby',
      'trusted_makers',
      'top_rated',
      'trending',
      'new_creators',
    ] as const);

  return ids.map((sectionId) =>
    buildDiscoverySection(sectionId, readModels, options),
  );
}

export { auditDiscoverySection, auditAllDiscoverySections };
