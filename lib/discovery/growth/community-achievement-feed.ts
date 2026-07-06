/**
 * Community achievement feed — Phase 3M.
 * Surfaces verified real-world milestones; no ranking effects.
 */

import type { ProgressEligibilityInput } from '@/lib/community/progress/progress-contract';
import {
  resolveMilestoneStates,
  completedMilestoneCount,
} from '@/lib/community/progress/progress-milestones';
import type {
  CommunityAchievementFeedItem,
  CommunityAchievementFeedKind,
} from './growth-surface-contract';

const KEY = 'growth.surfaces.achievements';

type AchievementDef = {
  kind: CommunityAchievementFeedKind;
  milestoneId: string;
  labelKey: string;
  descriptionKey: string;
  isEarned: (
    milestones: ReturnType<typeof resolveMilestoneStates>,
    input: ProgressEligibilityInput,
  ) => boolean;
};

const ACHIEVEMENT_REGISTRY: AchievementDef[] = [
  {
    kind: 'FIRST_WORKSHOP',
    milestoneId: 'ms-workshop-first',
    labelKey: `${KEY}.firstWorkshop.label`,
    descriptionKey: `${KEY}.firstWorkshop.description`,
    isEarned: (ms) => ms.find((m) => m.milestoneId === 'ms-workshop-first')?.completed === true,
  },
  {
    kind: 'FIRST_HELPER_ACTION',
    milestoneId: 'ms-helper-first',
    labelKey: `${KEY}.firstHelper.label`,
    descriptionKey: `${KEY}.firstHelper.description`,
    isEarned: (ms) => ms.find((m) => m.milestoneId === 'ms-helper-first')?.completed === true,
  },
  {
    kind: 'FIRST_PARTNER_INVITE',
    milestoneId: 'ms-partner-first',
    labelKey: `${KEY}.firstPartner.label`,
    descriptionKey: `${KEY}.firstPartner.description`,
    isEarned: (ms) => ms.find((m) => m.milestoneId === 'ms-partner-first')?.completed === true,
  },
  {
    kind: 'COMMUNITY_CONTRIBUTOR',
    milestoneId: 'ms-community-five',
    labelKey: `${KEY}.communityContributor.label`,
    descriptionKey: `${KEY}.communityContributor.description`,
    isEarned: (ms, input) =>
      completedMilestoneCount(ms) >= 3 || input.completedSupports >= 3,
  },
  {
    kind: 'LOCAL_CONNECTOR',
    milestoneId: 'ms-discovery-five',
    labelKey: `${KEY}.localConnector.label`,
    descriptionKey: `${KEY}.localConnector.description`,
    isEarned: (ms, input) =>
      (ms.find((m) => m.milestoneId === 'ms-discovery-five')?.completed === true) ||
      input.completedDiscoveries >= 5,
  },
];

export function buildCommunityAchievementFeed(
  input: ProgressEligibilityInput,
): CommunityAchievementFeedItem[] {
  if (!input.loggedIn) return [];

  const milestones = resolveMilestoneStates(input);
  const now = new Date(input.now ?? Date.now()).toISOString();

  return ACHIEVEMENT_REGISTRY.filter((def) => def.isEarned(milestones, input)).map(
    (def) => ({
      id: `achievement:${def.kind}:${input.userId}`,
      kind: def.kind,
      labelKey: def.labelKey,
      descriptionKey: def.descriptionKey,
      earnedAt: now,
      recognitionOnly: true as const,
    }),
  );
}

export function latestCommunityAchievement(
  feed: CommunityAchievementFeedItem[],
): CommunityAchievementFeedItem | null {
  if (feed.length === 0) return null;
  return feed[feed.length - 1] ?? null;
}

export function listAchievementKinds(): CommunityAchievementFeedKind[] {
  return ACHIEVEMENT_REGISTRY.map((a) => a.kind);
}
