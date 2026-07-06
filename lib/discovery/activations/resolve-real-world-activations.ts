/**
 * Real-world activation resolver — Phase 3G.
 * No ranking, recommendations, views, followers, or HCP gates.
 */

import type { RealWorldActivationContract } from './activation-contract';
import { activationInstanceId } from './activation-contract';
import { ALL_REAL_WORLD_ACTIVATIONS } from './activation-registry';
import { passesActivationSafety } from './activation-safety';
import {
  isActivationInCooldown,
  suppressDuplicateActivations,
  toResolvedContract,
  ACTIVATION_MAX_PER_SESSION,
} from './activation-anti-spam';
import {
  deriveActivationRole,
  localScopeBoost,
  type ActivationCooldownState,
  type ActivationEligibilityInput,
} from './activation-signals';
import { viralityPriorityBoost } from './activation-virality';
import type { RealWorldActivationCategory } from './activation-contract';

export type ResolveRealWorldActivationsOptions = {
  input: ActivationEligibilityInput;
  cooldownState?: ActivationCooldownState;
  now?: number;
  limit?: number;
  /** Restrict to specific categories. */
  categories?: RealWorldActivationCategory[];
  /** Exclude activation IDs already shown this session. */
  sessionShownIds?: string[];
};

export type ResolvedRealWorldActivation = RealWorldActivationContract & {
  instanceId: string;
  eligibility: { eligible: boolean; reason: string };
  effectivePriority: number;
};

function roleBoost(
  input: ActivationEligibilityInput,
  category: RealWorldActivationCategory,
): number {
  const role = deriveActivationRole(input);
  if (category === 'PRACTICAL_NEIGHBORHOOD' || category === 'COMMUNITY_SUPPORT') {
    return role === 'buyer' ? 5 : 0;
  }
  if (category === 'LOCAL_DISCOVERY') {
    return role === 'buyer' || role === 'mixed' ? 5 : 0;
  }
  return 0;
}

export function resolveRealWorldActivations(
  options: ResolveRealWorldActivationsOptions,
): ResolvedRealWorldActivation[] {
  const {
    input,
    cooldownState,
    now = Date.now(),
    limit = ACTIVATION_MAX_PER_SESSION,
    categories,
    sessionShownIds = [],
  } = options;

  if (!input.loggedIn) return [];

  const pool = categories
    ? ALL_REAL_WORLD_ACTIVATIONS.filter((a) => categories.includes(a.category))
    : ALL_REAL_WORLD_ACTIVATIONS;

  const eligible: ResolvedRealWorldActivation[] = [];

  for (const def of pool) {
    if (!def.isEligible(input)) continue;

    const safety = passesActivationSafety(def);
    if (!safety.safe) continue;

    if (isActivationInCooldown(def.id, cooldownState, def.cooldownDays, now)) {
      continue;
    }

    const instanceId = activationInstanceId(def.id, input.userId);
    if (sessionShownIds.includes(def.id) || sessionShownIds.includes(instanceId)) {
      continue;
    }

    const effectivePriority =
      def.priority +
      localScopeBoost(input) +
      roleBoost(input, def.category) +
      viralityPriorityBoost(def.viralityTier);

    eligible.push({
      ...toResolvedContract(def, input.userId, def.eligibilityReason(input)),
      instanceId,
      effectivePriority,
    });
  }

  const deduped = suppressDuplicateActivations(eligible);

  return deduped
    .sort(
      (a, b) =>
        b.effectivePriority - a.effectivePriority ||
        a.id.localeCompare(b.id),
    )
    .slice(0, limit);
}

export function buildActivationEligibilityFromSurface(
  base: import('@/lib/discovery/activity-cards/activity-card-contract').ActivityCardEligibilityInput,
  extras: Partial<ActivationEligibilityInput> = {},
): ActivationEligibilityInput {
  return {
    ...base,
    accountAgeDays: 30,
    feedScope: 'nearby',
    sellerTier: 0,
    buyerTier: 0,
    completedDeals: 0,
    favoriteCount: 0,
    favoritesWithoutConversations: 0,
    repeatSellerIds: [],
    nearbyWorkshopCount: 0,
    upcomingWorkshopCount: 0,
    newMakersNearbyCount: 0,
    activeNeighboursCount: 0,
    pickupAvailableNearby: false,
    hasOpenPickupOrder: false,
    newUsersNearby7d: 0,
    practicalServiceRequestCount: 0,
    ...extras,
  };
}
