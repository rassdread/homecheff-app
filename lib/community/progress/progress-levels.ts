/**
 * Community levels — Phase 3L.
 * Recognition only; no ranking or trust benefits.
 */

import type {
  CommunityLevelContract,
  CommunityLevelId,
  CommunityLevelState,
} from './progress-contract';
import { COMMUNITY_LEVEL_IDS } from './progress-contract';

const KEY = 'community.progress.levels';

export const COMMUNITY_LEVEL_REGISTRY: Record<
  CommunityLevelId,
  CommunityLevelContract
> = {
  NEIGHBOR: {
    id: 'NEIGHBOR',
    titleKey: `${KEY}.neighbor.title`,
    descriptionKey: `${KEY}.neighbor.description`,
    minMilestones: 0,
    recognitionOnly: true,
  },
  CONTRIBUTOR: {
    id: 'CONTRIBUTOR',
    titleKey: `${KEY}.contributor.title`,
    descriptionKey: `${KEY}.contributor.description`,
    minMilestones: 1,
    recognitionOnly: true,
  },
  COMMUNITY_BUILDER: {
    id: 'COMMUNITY_BUILDER',
    titleKey: `${KEY}.communityBuilder.title`,
    descriptionKey: `${KEY}.communityBuilder.description`,
    minMilestones: 3,
    recognitionOnly: true,
  },
  CONNECTOR: {
    id: 'CONNECTOR',
    titleKey: `${KEY}.connector.title`,
    descriptionKey: `${KEY}.connector.description`,
    minMilestones: 5,
    recognitionOnly: true,
  },
  AMBASSADOR: {
    id: 'AMBASSADOR',
    titleKey: `${KEY}.ambassador.title`,
    descriptionKey: `${KEY}.ambassador.description`,
    minMilestones: 8,
    recognitionOnly: true,
  },
  COMMUNITY_LEADER: {
    id: 'COMMUNITY_LEADER',
    titleKey: `${KEY}.communityLeader.title`,
    descriptionKey: `${KEY}.communityLeader.description`,
    minMilestones: 12,
    recognitionOnly: true,
  },
};

export function resolveCommunityLevel(
  milestonesCompleted: number,
): CommunityLevelState {
  let current: CommunityLevelContract = COMMUNITY_LEVEL_REGISTRY.NEIGHBOR;
  for (const id of COMMUNITY_LEVEL_IDS) {
    const level = COMMUNITY_LEVEL_REGISTRY[id];
    if (milestonesCompleted >= level.minMilestones) {
      current = level;
    }
  }

  const currentIndex = COMMUNITY_LEVEL_IDS.indexOf(current.id);
  const next =
    currentIndex < COMMUNITY_LEVEL_IDS.length - 1
      ? COMMUNITY_LEVEL_REGISTRY[COMMUNITY_LEVEL_IDS[currentIndex + 1]!]
      : null;

  const progressToNext = next
    ? Math.min(
        100,
        Math.round(
          ((milestonesCompleted - current.minMilestones) /
            Math.max(1, next.minMilestones - current.minMilestones)) *
            100,
        ),
      )
    : 100;

  return {
    levelId: current.id,
    titleKey: current.titleKey,
    progressToNext,
    milestonesCompleted,
  };
}

export function levelsNeverAffectRanking(): boolean {
  return COMMUNITY_LEVEL_IDS.every(
    (id) => COMMUNITY_LEVEL_REGISTRY[id].recognitionOnly === true,
  );
}

export function levelsNeverAffectTrust(): boolean {
  return true;
}
