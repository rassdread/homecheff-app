/**
 * Recognition framework — Phase 3K.
 * Allowed: badges, milestones, streaks, community status, achievement history, optional HCP.
 * Forbidden: trust boosts, ranking boosts, visibility boosts.
 */

import type {
  HcpRecognitionType,
  HcpMilestone,
  HcpCommunityAchievement,
} from './hcp-reward-contract';
import { FORBIDDEN_HCP_EFFECTS, HCP_RECOGNITION_TYPES } from './hcp-reward-contract';

export const FORBIDDEN_RECOGNITION_EFFECTS = [
  'trust_boost',
  'ranking_boost',
  'visibility_boost',
  'feed_rank_boost',
] as const;

export function validateRecognitionTypes(
  types: HcpRecognitionType[],
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const t of types) {
    if ((FORBIDDEN_RECOGNITION_EFFECTS as readonly string[]).includes(t)) {
      violations.push(t);
    }
  }
  if (types.length === 0) {
    violations.push('empty_recognition');
  }
  return { valid: violations.length === 0, violations };
}

export function recognitionAllowsOptionalHcp(
  types: HcpRecognitionType[],
): boolean {
  return types.includes('hcp_optional') || types.includes('milestone');
}

export function buildDefaultMilestones(
  completedCount: number,
  streak: number,
): HcpMilestone[] {
  return [
    {
      id: 'milestone-activations-3',
      labelKey: 'hcp.economy.milestones.activations3',
      target: 3,
      current: Math.min(completedCount, 3),
      completed: completedCount >= 3,
      hcpBonus: 5,
    },
    {
      id: 'milestone-helper-1',
      labelKey: 'hcp.economy.milestones.helper1',
      target: 1,
      current: completedCount >= 1 ? 1 : 0,
      completed: completedCount >= 1,
      hcpBonus: 3,
    },
    {
      id: 'milestone-streak-7',
      labelKey: 'hcp.economy.milestones.streak7',
      target: 7,
      current: Math.min(streak, 7),
      completed: streak >= 7,
      hcpBonus: 10,
    },
  ];
}

export function buildAchievementHistory(
  earned: Array<{ id: string; labelKey: string; earnedAt: string }>,
): HcpCommunityAchievement[] {
  return earned.map((e) => ({
    id: e.id,
    labelKey: e.labelKey,
    earnedAt: e.earnedAt,
    recognition: 'achievement_history',
  }));
}

export function hcpRecognitionDoesNotAffectTrust(): boolean {
  const forbiddenInRecognition = ['trust_boost', 'trust_tier_boost', 'ranking_boost'];
  return !HCP_RECOGNITION_TYPES.some((t) =>
    forbiddenInRecognition.includes(t),
  );
}
