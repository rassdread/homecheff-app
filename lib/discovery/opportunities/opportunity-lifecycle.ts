/**
 * Opportunity lifecycle — Phase 3I.
 * eligible → shown → accepted → active → completed → archived
 */

import type {
  OpportunityLifecycleState,
  OpportunityType,
} from './opportunity-contract';
import type { OpportunityCooldownState } from './opportunity-eligibility';

const LIFECYCLE_TRANSITIONS: Record<
  OpportunityLifecycleState,
  OpportunityLifecycleState[]
> = {
  eligible: ['shown', 'archived'],
  shown: ['accepted', 'archived'],
  accepted: ['active', 'archived'],
  active: ['completed', 'archived'],
  completed: ['archived'],
  archived: [],
};

export function canTransitionOpportunityLifecycle(
  from: OpportunityLifecycleState,
  to: OpportunityLifecycleState,
): boolean {
  return LIFECYCLE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function initialOpportunityLifecycle(): OpportunityLifecycleState {
  return 'eligible';
}

export function resolveOpportunityLifecycleState(
  type: OpportunityType,
  cooldownState: OpportunityCooldownState | undefined,
): OpportunityLifecycleState {
  const entry = cooldownState?.[type];
  if (!entry) return 'eligible';

  if (entry.lifecycle && isValidLifecycleState(entry.lifecycle)) {
    return entry.lifecycle;
  }

  if (entry.completedAt) return 'completed';
  if (entry.acceptedAt) return 'active';
  if (entry.lastShownAt) return 'shown';
  return 'eligible';
}

function isValidLifecycleState(
  value: string,
): value is OpportunityLifecycleState {
  return (
    value === 'eligible' ||
    value === 'shown' ||
    value === 'accepted' ||
    value === 'active' ||
    value === 'completed' ||
    value === 'archived'
  );
}

export function transitionOpportunityLifecycle(
  current: OpportunityLifecycleState,
  next: OpportunityLifecycleState,
): { ok: boolean; state: OpportunityLifecycleState; reason?: string } {
  if (current === next) {
    return { ok: true, state: current };
  }
  if (!canTransitionOpportunityLifecycle(current, next)) {
    return {
      ok: false,
      state: current,
      reason: `invalid_transition_${current}_to_${next}`,
    };
  }
  return { ok: true, state: next };
}

export function lifecycleAllowsSurface(
  state: OpportunityLifecycleState,
): boolean {
  return state === 'eligible' || state === 'shown';
}
