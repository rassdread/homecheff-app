/**
 * HCP rewards for real-world activations — Phase 3K.
 * Bridges 3G activation library to HCP economy contracts.
 */

import type { RealWorldActivationCategory } from '@/lib/discovery/activations/activation-contract';
import type { RealWorldActivationId } from '@/lib/discovery/activations/activation-contract';
import type {
  HcpRewardAction,
  HcpRewardCategory,
  HcpRewardContract,
  HcpRewardCooldownState,
  HcpRewardEligibilityResult,
} from './hcp-reward-contract';
import {
  CATEGORY_LIMIT_DEFAULTS,
  evaluateHcpRewardEligibility,
  type HcpAntiGamingInput,
} from './hcp-reward-rules';
import { hcpRewardInstanceId } from './hcp-reward-contract';

const KEY_PREFIX = 'hcp.economy.activation';

function contract(
  action: HcpRewardAction,
  category: HcpRewardCategory,
  suffix: string,
  hcpPoints: number | null,
  recognition: HcpRewardContract['recognition'],
): HcpRewardContract {
  return {
    id: `hcp-activation-${suffix}`,
    action,
    category,
    titleKey: `${KEY_PREFIX}.${suffix}.title`,
    descriptionKey: `${KEY_PREFIX}.${suffix}.description`,
    hcpPoints,
    recognition,
    limits: { ...CATEGORY_LIMIT_DEFAULTS[category] },
    sourceKind: 'activation',
    requiresVerification: category === 'HELPER' || category === 'COMMUNITY',
  };
}

/** Base activation completion reward. */
export const HCP_ACTIVATION_COMPLETE_REWARD = contract(
  'COMPLETE_ACTIVATION',
  'ACTIVATION',
  'complete',
  3,
  ['milestone', 'hcp_optional', 'achievement_history'],
);

/** Category → default HCP action mapping. */
const CATEGORY_ACTION_MAP: Record<
  RealWorldActivationCategory,
  HcpRewardAction
> = {
  PRACTICAL_NEIGHBORHOOD: 'HELP_NEIGHBOR',
  LOCAL_DISCOVERY: 'COMPLETE_ACTIVATION',
  COMMUNITY_SUPPORT: 'COMMUNITY_HELPER_COMPLETION',
};

const CATEGORY_HCP_CATEGORY: Record<
  RealWorldActivationCategory,
  HcpRewardCategory
> = {
  PRACTICAL_NEIGHBORHOOD: 'HELPER',
  LOCAL_DISCOVERY: 'ACTIVATION',
  COMMUNITY_SUPPORT: 'COMMUNITY',
};

export const ACTIVATION_CATEGORY_REWARDS: Record<
  RealWorldActivationCategory,
  HcpRewardContract
> = {
  PRACTICAL_NEIGHBORHOOD: contract(
    'HELP_NEIGHBOR',
    'HELPER',
    'helpNeighbor',
    5,
    ['badge', 'community_status', 'hcp_optional'],
  ),
  LOCAL_DISCOVERY: contract(
    'COMPLETE_ACTIVATION',
    'ACTIVATION',
    'localDiscovery',
    2,
    ['milestone', 'hcp_optional'],
  ),
  COMMUNITY_SUPPORT: contract(
    'COMMUNITY_HELPER_COMPLETION',
    'HELPER',
    'communityHelper',
    4,
    ['badge', 'streak', 'hcp_optional'],
  ),
};

export type ResolveActivationHcpRewardInput = {
  activationId: RealWorldActivationId;
  category: RealWorldActivationCategory;
  userId: string;
  cooldownState?: HcpRewardCooldownState;
  antiGaming?: Partial<HcpAntiGamingInput>;
  now?: number;
};

export type ResolvedActivationHcpReward = HcpRewardContract & {
  instanceId: string;
  eligibility: HcpRewardEligibilityResult;
  ledgerKey: string;
};

export function resolveActivationHcpReward(
  input: ResolveActivationHcpRewardInput,
): ResolvedActivationHcpReward | null {
  const base = ACTIVATION_CATEGORY_REWARDS[input.category];
  if (!base) return null;

  const action = CATEGORY_ACTION_MAP[input.category];
  const ledgerKey = `activation:${input.activationId}`;
  const antiGaming: HcpAntiGamingInput = {
    userId: input.userId,
    action,
    sourceId: input.activationId,
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
    instanceId: hcpRewardInstanceId(action, input.activationId, input.userId),
    eligibility,
    ledgerKey,
  };
}

export function listActivationHcpRewards(): HcpRewardContract[] {
  return [
    HCP_ACTIVATION_COMPLETE_REWARD,
    ...Object.values(ACTIVATION_CATEGORY_REWARDS),
  ];
}

export function activationActionForCategory(
  category: RealWorldActivationCategory,
): HcpRewardAction {
  return CATEGORY_ACTION_MAP[category];
}

export function activationHcpCategory(
  category: RealWorldActivationCategory,
): HcpRewardCategory {
  return CATEGORY_HCP_CATEGORY[category];
}
