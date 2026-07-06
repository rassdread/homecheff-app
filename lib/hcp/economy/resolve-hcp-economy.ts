/**
 * HCP Economy resolver — Phase 3K.
 * Orchestrates activation + opportunity HCP rewards and sidebar plan.
 */

import type { RealWorldActivationCategory } from '@/lib/discovery/activations/activation-contract';
import type { RealWorldActivationId } from '@/lib/discovery/activations/activation-contract';
import type { OpportunityType } from '@/lib/discovery/opportunities/opportunity-contract';
import type {
  HcpRewardContract,
  HcpRewardCooldownState,
  HcpSidebarIntegrationPlan,
} from './hcp-reward-contract';
import {
  resolveActivationHcpReward,
  listActivationHcpRewards,
} from './hcp-activation-rewards';
import {
  resolveOpportunityHcpReward,
  listOpportunityHcpRewards,
} from './hcp-opportunity-rewards';
import {
  buildHcpSidebarIntegrationPlan,
  emptyHcpSidebarPlan,
  type BuildHcpSidebarPlanInput,
} from './hcp-sidebar-integration';
import { suppressDuplicateHcpRewards } from './hcp-reward-rules';

export type ResolveHcpEconomyInput = {
  userId: string;
  loggedIn: boolean;
  activation?: {
    id: RealWorldActivationId;
    category: RealWorldActivationCategory;
  };
  opportunityType?: OpportunityType;
  cooldownState?: HcpRewardCooldownState;
  sidebar?: Omit<BuildHcpSidebarPlanInput, 'userId'>;
  now?: number;
};

export type ResolvedHcpEconomy = {
  activationReward: ReturnType<typeof resolveActivationHcpReward>;
  opportunityReward: ReturnType<typeof resolveOpportunityHcpReward>;
  sidebarPlan: HcpSidebarIntegrationPlan;
  eligibleRewards: HcpRewardContract[];
};

export function resolveHcpEconomy(
  input: ResolveHcpEconomyInput,
): ResolvedHcpEconomy {
  if (!input.loggedIn) {
    return {
      activationReward: null,
      opportunityReward: null,
      sidebarPlan: emptyHcpSidebarPlan(),
      eligibleRewards: [],
    };
  }

  const activationReward = input.activation
    ? resolveActivationHcpReward({
        activationId: input.activation.id,
        category: input.activation.category,
        userId: input.userId,
        cooldownState: input.cooldownState,
        now: input.now,
      })
    : null;

  const opportunityReward = input.opportunityType
    ? resolveOpportunityHcpReward({
        opportunityType: input.opportunityType,
        userId: input.userId,
        cooldownState: input.cooldownState,
        now: input.now,
      })
    : null;

  const candidates = [
    ...(activationReward ? [activationReward] : []),
    ...(opportunityReward ? [opportunityReward] : []),
  ];

  const eligibleRewards = suppressDuplicateHcpRewards(candidates);

  const sidebarPlan = buildHcpSidebarIntegrationPlan({
    userId: input.userId,
    completedActivationCount: input.sidebar?.completedActivationCount ?? 0,
    completedOpportunityCount: input.sidebar?.completedOpportunityCount ?? 0,
    currentStreak: input.sidebar?.currentStreak ?? 0,
    cooldownState: input.cooldownState,
    pendingOpportunityType: input.opportunityType ?? null,
    pendingActivationCategory: input.activation?.category ?? null,
    earnedAchievements: input.sidebar?.earnedAchievements,
    dailyHcpEarned: input.sidebar?.dailyHcpEarned,
    now: input.now,
  });

  return {
    activationReward,
    opportunityReward,
    sidebarPlan,
    eligibleRewards,
  };
}

export function allHcpEconomyContracts(): HcpRewardContract[] {
  return [...listActivationHcpRewards(), ...listOpportunityHcpRewards()];
}
