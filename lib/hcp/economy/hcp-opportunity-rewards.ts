/**
 * HCP rewards for opportunity economy — Phase 3K.
 * Bridges 3I opportunity types to HCP economy contracts.
 */

import type { OpportunityType } from '@/lib/discovery/opportunities/opportunity-contract';
import type {
  HcpRewardAction,
  HcpRewardCategory,
  HcpRewardContract,
  HcpRewardCooldownState,
  HcpRewardEligibilityResult,
} from './hcp-reward-contract';
import { hcpRewardInstanceId } from './hcp-reward-contract';
import {
  CATEGORY_LIMIT_DEFAULTS,
  evaluateHcpRewardEligibility,
  type HcpAntiGamingInput,
} from './hcp-reward-rules';

const KEY_PREFIX = 'hcp.economy.opportunity';

function oppContract(
  type: OpportunityType,
  action: HcpRewardAction,
  category: HcpRewardCategory,
  hcpPoints: number | null,
  recognition: HcpRewardContract['recognition'],
  requiresVerification = true,
): HcpRewardContract {
  const suffix = type.toLowerCase();
  return {
    id: `hcp-opportunity-${suffix}`,
    action,
    category,
    titleKey: `${KEY_PREFIX}.${suffix}.title`,
    descriptionKey: `${KEY_PREFIX}.${suffix}.description`,
    hcpPoints,
    recognition,
    limits: { ...CATEGORY_LIMIT_DEFAULTS[category] },
    sourceKind: 'opportunity',
    requiresVerification,
  };
}

export const OPPORTUNITY_HCP_REWARD_REGISTRY: Record<
  OpportunityType,
  HcpRewardContract
> = {
  PARTNER: oppContract(
    'PARTNER',
    'BECOME_PARTNER',
    'PARTNER',
    15,
    ['badge', 'milestone', 'hcp_optional'],
  ),
  AMBASSADOR: oppContract(
    'AMBASSADOR',
    'BECOME_AMBASSADOR',
    'PARTNER',
    10,
    ['badge', 'community_status', 'hcp_optional'],
  ),
  COURIER: oppContract(
    'COURIER',
    'BECOME_COURIER',
    'COURIER',
    8,
    ['milestone', 'hcp_optional'],
  ),
  WORKSHOP_HOST: oppContract(
    'WORKSHOP_HOST',
    'HOST_WORKSHOP',
    'WORKSHOP',
    12,
    ['badge', 'achievement_history', 'hcp_optional'],
  ),
  COMMUNITY_HELPER: oppContract(
    'COMMUNITY_HELPER',
    'COMMUNITY_HELPER_COMPLETION',
    'HELPER',
    5,
    ['badge', 'streak', 'hcp_optional'],
  ),
  LOCAL_BUSINESS_INVITER: oppContract(
    'LOCAL_BUSINESS_INVITER',
    'INVITE_BUSINESS',
    'PARTNER',
    8,
    ['community_status', 'hcp_optional'],
  ),
  SPORTS_CLUB_INVITER: oppContract(
    'SPORTS_CLUB_INVITER',
    'INVITE_SPORTS_CLUB',
    'COMMUNITY',
    6,
    ['badge', 'hcp_optional'],
  ),
  SCHOOL_INVITER: oppContract(
    'SCHOOL_INVITER',
    'INVITE_SCHOOL',
    'COMMUNITY',
    6,
    ['community_status', 'hcp_optional'],
  ),
  MUNICIPALITY_INVITER: oppContract(
    'MUNICIPALITY_INVITER',
    'INVITE_MUNICIPALITY',
    'PARTNER',
    10,
    ['milestone', 'achievement_history', 'hcp_optional'],
  ),
  EVENT_ORGANIZER: oppContract(
    'EVENT_ORGANIZER',
    'ORGANIZE_EVENT',
    'EVENT',
    10,
    ['badge', 'community_status', 'hcp_optional'],
  ),
};

export type ResolveOpportunityHcpRewardInput = {
  opportunityType: OpportunityType;
  userId: string;
  cooldownState?: HcpRewardCooldownState;
  antiGaming?: Partial<HcpAntiGamingInput>;
  now?: number;
};

export type ResolvedOpportunityHcpReward = HcpRewardContract & {
  instanceId: string;
  eligibility: HcpRewardEligibilityResult;
  ledgerKey: string;
};

export function resolveOpportunityHcpReward(
  input: ResolveOpportunityHcpRewardInput,
): ResolvedOpportunityHcpReward | null {
  const base = OPPORTUNITY_HCP_REWARD_REGISTRY[input.opportunityType];
  if (!base) return null;

  const ledgerKey = `opportunity:${input.opportunityType}`;
  const antiGaming: HcpAntiGamingInput = {
    userId: input.userId,
    action: base.action,
    sourceId: input.opportunityType,
    isVerifiedCompletion: true,
    ...input.antiGaming,
  };

  const eligibility = evaluateHcpRewardEligibility(
    base,
    ledgerKey,
    input.cooldownState,
    antiGaming,
    input.now,
  );

  if (!eligibility.eligible) return null;

  return {
    ...base,
    instanceId: hcpRewardInstanceId(
      base.action,
      input.opportunityType,
      input.userId,
    ),
    eligibility,
    ledgerKey,
  };
}

export function listOpportunityHcpRewards(): HcpRewardContract[] {
  return Object.values(OPPORTUNITY_HCP_REWARD_REGISTRY);
}

export function opportunityHcpAction(
  type: OpportunityType,
): HcpRewardAction {
  return OPPORTUNITY_HCP_REWARD_REGISTRY[type].action;
}
