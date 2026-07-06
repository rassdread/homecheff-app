/**
 * Opportunity progress model — Phase 3J.
 * Tracks participation state without payments or ranking.
 */

import type {
  OpportunityContract,
  OpportunityRequirement,
  OpportunityType,
} from './opportunity-contract';
import type { OpportunityLifecycleState } from './opportunity-contract';
import type { OpportunityCooldownState } from './opportunity-eligibility';
import { resolveOpportunityLifecycleState } from './opportunity-lifecycle';

export type OpportunityMilestone = {
  id: string;
  labelKey: string;
  completed: boolean;
};

export type OpportunityProgressContract = {
  opportunityType: OpportunityType;
  accepted: boolean;
  active: boolean;
  completed: boolean;
  milestones: OpportunityMilestone[];
  nextAction: {
    labelKey: string;
    href: string;
  } | null;
};

function milestonesFromRequirements(
  requirements: OpportunityRequirement[],
  lifecycle: OpportunityLifecycleState,
): OpportunityMilestone[] {
  const completedStates = new Set<OpportunityLifecycleState>([
    'accepted',
    'active',
    'completed',
    'archived',
  ]);
  const activeStates = new Set<OpportunityLifecycleState>([
    'active',
    'completed',
    'archived',
  ]);

  return requirements.map((req, index) => ({
    id: `milestone-${index}`,
    labelKey: req.requirementKey,
    completed:
      lifecycle === 'completed' ||
      lifecycle === 'archived' ||
      (completedStates.has(lifecycle) && index === 0) ||
      (activeStates.has(lifecycle) && index <= 1),
  }));
}

export function buildOpportunityProgress(
  contract: Pick<
    OpportunityContract,
    'type' | 'actionLabelKey' | 'actionHref' | 'requirements'
  >,
  cooldownState: OpportunityCooldownState | undefined,
): OpportunityProgressContract {
  const lifecycle = resolveOpportunityLifecycleState(
    contract.type,
    cooldownState,
  );

  const accepted = lifecycle === 'accepted' || lifecycle === 'active' || lifecycle === 'completed';
  const active = lifecycle === 'active';
  const completed = lifecycle === 'completed' || lifecycle === 'archived';

  const milestones = milestonesFromRequirements(contract.requirements, lifecycle);

  const nextAction =
    completed
      ? null
      : {
          labelKey: contract.actionLabelKey,
          href: contract.actionHref,
        };

  return {
    opportunityType: contract.type,
    accepted,
    active,
    completed,
    milestones,
    nextAction,
  };
}
