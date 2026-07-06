/**
 * HCP sidebar integration model — Phase 3K.
 * Contract for /mijn-hcp and home sidebar: progress, milestones, streaks, recommendations.
 */

import type {
  HcpSidebarIntegrationPlan,
  HcpRewardCooldownState,
  HcpRecommendedAction,
} from './hcp-reward-contract';
import type { OpportunityType } from '@/lib/discovery/opportunities/opportunity-contract';
import type { RealWorldActivationCategory } from '@/lib/discovery/activations/activation-contract';
import { buildDefaultMilestones, buildAchievementHistory } from './hcp-recognition';
import { OPPORTUNITY_HCP_REWARD_REGISTRY } from './hcp-opportunity-rewards';
import { ACTIVATION_CATEGORY_REWARDS } from './hcp-activation-rewards';
import { CATEGORY_LIMIT_DEFAULTS, dayKeyUtc, weekKeyUtc } from './hcp-reward-rules';

export type BuildHcpSidebarPlanInput = {
  userId: string;
  completedActivationCount: number;
  completedOpportunityCount: number;
  currentStreak: number;
  cooldownState?: HcpRewardCooldownState;
  pendingOpportunityType?: OpportunityType | null;
  pendingActivationCategory?: RealWorldActivationCategory | null;
  earnedAchievements?: Array<{ id: string; labelKey: string; earnedAt: string }>;
  dailyHcpEarned?: number;
  now?: number;
};

function sumDailyEarned(
  state: HcpRewardCooldownState | undefined,
  now: number,
): number {
  const day = dayKeyUtc(now);
  let total = 0;
  for (const entry of Object.values(state ?? {})) {
    if (entry?.dayKey === day) {
      total += entry.dailyCount;
    }
  }
  return total;
}

function sumWeeklyEarned(
  state: HcpRewardCooldownState | undefined,
  now: number,
): number {
  const week = weekKeyUtc(now);
  let total = 0;
  for (const entry of Object.values(state ?? {})) {
    if (entry?.weekKey === week) {
      total += entry.weeklyCount;
    }
  }
  return total;
}

function maxDailyCapRemaining(now: number): number {
  let cap = 0;
  for (const limits of Object.values(CATEGORY_LIMIT_DEFAULTS)) {
    cap += limits.dailyCap;
  }
  return cap;
}

function buildRecommendedAction(
  input: BuildHcpSidebarPlanInput,
): HcpRecommendedAction | null {
  if (input.pendingOpportunityType) {
    const reward = OPPORTUNITY_HCP_REWARD_REGISTRY[input.pendingOpportunityType];
    return {
      action: reward.action,
      titleKey: reward.titleKey,
      href: '/?chip=sale#homecheff-feed',
      hcpPoints: reward.hcpPoints,
    };
  }
  if (input.pendingActivationCategory) {
    const reward = ACTIVATION_CATEGORY_REWARDS[input.pendingActivationCategory];
    return {
      action: reward.action,
      titleKey: reward.titleKey,
      href: '/?chip=sale#homecheff-feed',
      hcpPoints: reward.hcpPoints,
    };
  }
  return {
    action: 'COMPLETE_ACTIVATION',
    titleKey: 'hcp.economy.recommended.exploreActivations',
    href: '/?chip=sale#homecheff-feed',
    hcpPoints: 3,
  };
}

export function buildHcpSidebarIntegrationPlan(
  input: BuildHcpSidebarPlanInput,
): HcpSidebarIntegrationPlan {
  const now = input.now ?? Date.now();
  const totalCompleted =
    input.completedActivationCount + input.completedOpportunityCount;
  const milestones = buildDefaultMilestones(
    totalCompleted,
    input.currentStreak,
  );
  const nextMilestone =
    milestones.find((m) => !m.completed) ?? milestones[milestones.length - 1] ?? null;

  const progressTarget = 10;
  const progressPercent = Math.min(
    100,
    Math.round((totalCompleted / progressTarget) * 100),
  );

  const dailyHcpEarned = input.dailyHcpEarned ?? sumDailyEarned(input.cooldownState, now);
  const weeklyHcpEarned = sumWeeklyEarned(input.cooldownState, now);
  const dailyCapRemaining = Math.max(0, maxDailyCapRemaining(now) - dailyHcpEarned);

  return {
    progressPercent,
    nextMilestone,
    currentStreak: input.currentStreak,
    recommendedAction: buildRecommendedAction(input),
    communityAchievements: buildAchievementHistory(
      input.earnedAchievements ?? [],
    ),
    dailyHcpEarned,
    weeklyHcpEarned,
    dailyCapRemaining,
  };
}

export function emptyHcpSidebarPlan(): HcpSidebarIntegrationPlan {
  return {
    progressPercent: 0,
    nextMilestone: null,
    currentStreak: 0,
    recommendedAction: null,
    communityAchievements: [],
    dailyHcpEarned: 0,
    weeklyHcpEarned: 0,
    dailyCapRemaining: maxDailyCapRemaining(Date.now()),
  };
}
