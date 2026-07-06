/**
 * Opportunity Economy resolver — Phase 3I.
 * Returns opportunities for desktop sidebar, mobile inserts, and profile modules.
 * No payments, commissions, affiliate logic, or ranking changes.
 */

import type {
  OpportunityContract,
  OpportunitySurfaceTarget,
  OpportunityType,
} from './opportunity-contract';
import { opportunityInstanceId } from './opportunity-contract';
import {
  ALL_OPPORTUNITY_DEFINITIONS,
  type OpportunityDefinition,
} from './opportunity-registry';
import type {
  OpportunityCooldownState,
  OpportunityEligibilityInput,
} from './opportunity-eligibility';
import { isOpportunityEligible } from './opportunity-eligibility';
import {
  isOpportunityInCooldown,
  suppressDuplicateOpportunities,
  OPPORTUNITY_MAX_DESKTOP_SIDEBAR,
  OPPORTUNITY_MAX_MOBILE_INSERT,
  OPPORTUNITY_MAX_PROFILE_MODULE,
} from './opportunity-anti-spam';
import {
  lifecycleAllowsSurface,
  resolveOpportunityLifecycleState,
} from './opportunity-lifecycle';

export type ResolveOpportunityContractsOptions = {
  input: OpportunityEligibilityInput;
  cooldownState?: OpportunityCooldownState;
  now?: number;
  /** Restrict to specific surface targets. */
  targets?: OpportunitySurfaceTarget[];
  /** Exclude types already shown this session. */
  sessionShownTypes?: OpportunityType[];
};

export type ResolvedOpportunityContract = OpportunityContract & {
  instanceId: string;
  lifecycle: import('./opportunity-contract').OpportunityLifecycleState;
  eligibility: { eligible: boolean; reason: string };
  effectivePriority: number;
  surfaceTargets: OpportunitySurfaceTarget[];
};

function localScopeBoost(input: OpportunityEligibilityInput): number {
  return input.feedScope === 'nearby' && input.hasLocation ? 8 : 0;
}

function toResolved(
  def: OpportunityDefinition,
  input: OpportunityEligibilityInput,
  lifecycle: import('./opportunity-contract').OpportunityLifecycleState,
  reason: string,
): ResolvedOpportunityContract {
  return {
    id: def.id,
    type: def.type,
    category: def.category,
    titleKey: def.titleKey,
    descriptionKey: def.descriptionKey,
    eligibility: { eligible: true, reason },
    benefits: def.benefits,
    requirements: def.requirements,
    rewardTypes: def.rewardTypes,
    status: lifecycle,
    cooldowns: def.cooldowns,
    priority: def.priority,
    icon: def.icon,
    actionLabelKey: def.actionLabelKey,
    actionHref: def.actionHref,
    dismissible: def.dismissible,
    ctaKind: def.ctaKind,
    surfaceTargets: def.surfaceTargets,
    instanceId: opportunityInstanceId(def.type, input.userId),
    lifecycle,
    effectivePriority: def.priority + localScopeBoost(input),
  };
}

export function resolveOpportunityContracts(
  options: ResolveOpportunityContractsOptions,
): ResolvedOpportunityContract[] {
  const {
    input,
    cooldownState,
    now = Date.now(),
    targets,
    sessionShownTypes = [],
  } = options;

  if (!input.loggedIn) return [];

  const eligible: ResolvedOpportunityContract[] = [];

  for (const def of ALL_OPPORTUNITY_DEFINITIONS) {
    const eligibility = isOpportunityEligible(
      def.type,
      def.eligibility,
      input,
    );
    if (!eligibility.eligible) continue;

    const lifecycle = resolveOpportunityLifecycleState(def.type, cooldownState);
    if (!lifecycleAllowsSurface(lifecycle)) continue;

    if (sessionShownTypes.includes(def.type)) continue;

    if (isOpportunityInCooldown(def.type, cooldownState, def.cooldowns, now)) {
      continue;
    }

    if (targets && !def.surfaceTargets.some((t) => targets.includes(t))) {
      continue;
    }

    eligible.push(toResolved(def, input, lifecycle, eligibility.reason));
  }

  const deduped = suppressDuplicateOpportunities(eligible);

  return deduped.sort(
    (a, b) =>
      b.effectivePriority - a.effectivePriority ||
      a.type.localeCompare(b.type),
  );
}

export function resolveDesktopSidebarOpportunities(
  options: ResolveOpportunityContractsOptions,
): ResolvedOpportunityContract[] {
  return resolveOpportunityContracts({
    ...options,
    targets: ['desktop_sidebar'],
  }).slice(0, OPPORTUNITY_MAX_DESKTOP_SIDEBAR);
}

export function resolveMobileInsertOpportunities(
  options: ResolveOpportunityContractsOptions,
): ResolvedOpportunityContract[] {
  return resolveOpportunityContracts({
    ...options,
    targets: ['mobile_insert'],
  }).slice(0, OPPORTUNITY_MAX_MOBILE_INSERT);
}

export function resolveProfileModuleOpportunities(
  options: ResolveOpportunityContractsOptions,
): ResolvedOpportunityContract[] {
  return resolveOpportunityContracts({
    ...options,
    targets: ['profile_module'],
  }).slice(0, OPPORTUNITY_MAX_PROFILE_MODULE);
}

export type OpportunitySurfaceBundle = {
  desktopSidebar: ResolvedOpportunityContract[];
  mobileInserts: ResolvedOpportunityContract[];
  profileModules: ResolvedOpportunityContract[];
};

export function resolveOpportunitySurfaceBundle(
  options: ResolveOpportunityContractsOptions,
): OpportunitySurfaceBundle {
  return {
    desktopSidebar: resolveDesktopSidebarOpportunities(options),
    mobileInserts: resolveMobileInsertOpportunities(options),
    profileModules: resolveProfileModuleOpportunities(options),
  };
}
