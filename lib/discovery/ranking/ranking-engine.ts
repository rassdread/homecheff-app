/**
 * Discovery ranking engine — single entry point for all discovery surfaces.
 * Phase 2C: first ranking implementation. No API rollout in this phase.
 *
 * Consumes ONLY DiscoveryRankingInput (readModel + trust + optional viewer).
 * @see docs/architecture/DISCOVERY_ANTI_GAMING.md
 */

import type { DiscoveryReadModel } from '../contracts/discovery-read-model';
import type { DiscoveryRankingInput } from '../contracts/discovery-ranking-contract';
import { getRankingProfile } from './ranking-profiles';
import type {
  DiscoveryRankingProfileId,
  RankDiscoveryOptions,
  RankedDiscoveryItem,
  RankingViewerContext,
} from './ranking-types';
import {
  assertRankingInputPurity,
  toDiscoveryRankingInput,
} from './ranking-utils';

export type RankDiscoveryReadModelsOptions = RankDiscoveryOptions;

/**
 * Rank discovery items using the specified profile.
 * Returns eligible items sorted by score descending; ineligible items excluded
 * unless `includeIneligible` is true (appended at tail).
 */
export function rankDiscoveryItems(
  items: DiscoveryRankingInput[],
  options: RankDiscoveryOptions,
): RankedDiscoveryItem[] {
  const profile = getRankingProfile(options.profileId);
  const viewer = options.viewer;

  const ranked: RankedDiscoveryItem[] = items.map((input) => {
    assertRankingInputPurity(input);
    const { eligible, reason } = profile.isEligible(input, viewer);
    const score = eligible
      ? profile.computeScore(input, viewer)
      : Number.NEGATIVE_INFINITY;
    return {
      input,
      score,
      profileId: options.profileId,
      eligible,
      ineligibleReason: reason,
    };
  });

  const eligible = ranked.filter((r) => r.eligible);
  const ineligible = ranked.filter((r) => !r.eligible);

  eligible.sort(compareRankedItems);

  if (options.includeIneligible) {
    ineligible.sort((a, b) =>
      a.input.readModel.id.localeCompare(b.input.readModel.id),
    );
    return [...eligible, ...ineligible];
  }

  return eligible;
}

/** Convenience — rank DiscoveryReadModel[] directly. */
export function rankDiscoveryReadModels(
  readModels: DiscoveryReadModel[],
  options: RankDiscoveryReadModelsOptions,
): RankedDiscoveryItem[] {
  const inputs = readModels.map((rm) =>
    toDiscoveryRankingInput(rm, options.viewer),
  );
  return rankDiscoveryItems(inputs, options);
}

/** Return sorted read models only (common consumer shape). */
export function sortDiscoveryReadModels(
  readModels: DiscoveryReadModel[],
  options: RankDiscoveryReadModelsOptions,
): DiscoveryReadModel[] {
  return rankDiscoveryReadModels(readModels, options).map(
    (r) => r.input.readModel,
  );
}

/** Score a single item without sorting. */
export function scoreDiscoveryItem(
  input: DiscoveryRankingInput,
  profileId: DiscoveryRankingProfileId,
  viewer?: RankingViewerContext,
): RankedDiscoveryItem {
  const [result] = rankDiscoveryItems([input], {
    profileId,
    viewer,
    includeIneligible: true,
  });
  return result;
}

function compareRankedItems(a: RankedDiscoveryItem, b: RankedDiscoveryItem): number {
  if (b.score !== a.score) return b.score - a.score;
  const aDist = a.input.readModel.distanceKm ?? Infinity;
  const bDist = b.input.readModel.distanceKm ?? Infinity;
  if (aDist !== bDist) return aDist - bDist;
  const aTime = Date.parse(a.input.readModel.createdAt) || 0;
  const bTime = Date.parse(b.input.readModel.createdAt) || 0;
  if (bTime !== aTime) return bTime - aTime;
  return b.input.readModel.id.localeCompare(a.input.readModel.id);
}

export {
  getRankingProfile,
  listRankingProfiles,
} from './ranking-profiles';

export type {
  DiscoveryRankingProfileId,
  RankDiscoveryOptions,
  RankedDiscoveryItem,
  RankingViewerContext,
} from './ranking-types';

export {
  toDiscoveryRankingInput,
  assertRankingInputPurity,
  FAVORITE_RANK_CAP,
  forbiddenRankingSignals,
} from './ranking-utils';
