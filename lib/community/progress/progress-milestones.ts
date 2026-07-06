/**
 * Community progress milestones — Phase 3L.
 */

import type {
  ProgressMilestoneCategory,
  ProgressMilestoneContract,
  ProgressMilestoneState,
  ProgressEligibilityInput,
} from './progress-contract';

const KEY = 'community.progress.milestones';

export const PROGRESS_MILESTONE_REGISTRY: ProgressMilestoneContract[] = [
  {
    id: 'ms-community-first',
    category: 'COMMUNITY',
    titleKey: `${KEY}.community.first.title`,
    descriptionKey: `${KEY}.community.first.description`,
    target: 1,
    requiresVerification: true,
    cooldownDays: 0,
  },
  {
    id: 'ms-community-five',
    category: 'COMMUNITY',
    titleKey: `${KEY}.community.five.title`,
    descriptionKey: `${KEY}.community.five.description`,
    target: 5,
    requiresVerification: true,
    cooldownDays: 1,
  },
  {
    id: 'ms-helper-first',
    category: 'HELPER',
    titleKey: `${KEY}.helper.first.title`,
    descriptionKey: `${KEY}.helper.first.description`,
    target: 1,
    requiresVerification: true,
    cooldownDays: 0,
  },
  {
    id: 'ms-helper-three',
    category: 'HELPER',
    titleKey: `${KEY}.helper.three.title`,
    descriptionKey: `${KEY}.helper.three.description`,
    target: 3,
    requiresVerification: true,
    cooldownDays: 1,
  },
  {
    id: 'ms-partner-first',
    category: 'PARTNER',
    titleKey: `${KEY}.partner.first.title`,
    descriptionKey: `${KEY}.partner.first.description`,
    target: 1,
    requiresVerification: true,
    cooldownDays: 7,
  },
  {
    id: 'ms-ambassador-first',
    category: 'AMBASSADOR',
    titleKey: `${KEY}.ambassador.first.title`,
    descriptionKey: `${KEY}.ambassador.first.description`,
    target: 1,
    requiresVerification: true,
    cooldownDays: 7,
  },
  {
    id: 'ms-workshop-first',
    category: 'WORKSHOP',
    titleKey: `${KEY}.workshop.first.title`,
    descriptionKey: `${KEY}.workshop.first.description`,
    target: 1,
    requiresVerification: true,
    cooldownDays: 3,
  },
  {
    id: 'ms-workshop-three',
    category: 'WORKSHOP',
    titleKey: `${KEY}.workshop.three.title`,
    descriptionKey: `${KEY}.workshop.three.description`,
    target: 3,
    requiresVerification: true,
    cooldownDays: 3,
  },
  {
    id: 'ms-courier-first',
    category: 'COURIER',
    titleKey: `${KEY}.courier.first.title`,
    descriptionKey: `${KEY}.courier.first.description`,
    target: 1,
    requiresVerification: true,
    cooldownDays: 3,
  },
  {
    id: 'ms-discovery-first',
    category: 'LOCAL_DISCOVERY',
    titleKey: `${KEY}.discovery.first.title`,
    descriptionKey: `${KEY}.discovery.first.description`,
    target: 1,
    requiresVerification: true,
    cooldownDays: 1,
  },
  {
    id: 'ms-discovery-five',
    category: 'LOCAL_DISCOVERY',
    titleKey: `${KEY}.discovery.five.title`,
    descriptionKey: `${KEY}.discovery.five.description`,
    target: 5,
    requiresVerification: true,
    cooldownDays: 1,
  },
  {
    id: 'ms-support-first',
    category: 'SUPPORT',
    titleKey: `${KEY}.support.first.title`,
    descriptionKey: `${KEY}.support.first.description`,
    target: 1,
    requiresVerification: true,
    cooldownDays: 1,
  },
  {
    id: 'ms-support-three',
    category: 'SUPPORT',
    titleKey: `${KEY}.support.three.title`,
    descriptionKey: `${KEY}.support.three.description`,
    target: 3,
    requiresVerification: true,
    cooldownDays: 1,
  },
];

function countForCategory(
  input: ProgressEligibilityInput,
  category: ProgressMilestoneCategory,
): number {
  if (input.categoryCounts[category] !== undefined) {
    return input.categoryCounts[category] ?? 0;
  }
  switch (category) {
    case 'HELPER':
      return input.completedHelps;
    case 'WORKSHOP':
      return input.completedWorkshops;
    case 'PARTNER':
    case 'AMBASSADOR':
      return input.completedInvites;
    case 'LOCAL_DISCOVERY':
      return input.completedDiscoveries;
    case 'SUPPORT':
    case 'COMMUNITY':
      return input.completedSupports;
    case 'COURIER':
      return input.categoryCounts.COURIER ?? 0;
    default:
      return 0;
  }
}

export function resolveMilestoneStates(
  input: ProgressEligibilityInput,
): ProgressMilestoneState[] {
  return PROGRESS_MILESTONE_REGISTRY.map((m) => {
    const current = Math.min(countForCategory(input, m.category), m.target);
    const completed = current >= m.target;
    return {
      milestoneId: m.id,
      category: m.category,
      current,
      target: m.target,
      completed,
      completedAt: completed ? new Date(input.now ?? Date.now()).toISOString() : null,
    };
  });
}

export function nextIncompleteMilestone(
  states: ProgressMilestoneState[],
): ProgressMilestoneState | null {
  const incomplete = states.filter((s) => !s.completed);
  if (incomplete.length === 0) return null;
  return incomplete.sort((a, b) => a.target - b.target || a.current - b.current)[0] ?? null;
}

export function completedMilestoneCount(states: ProgressMilestoneState[]): number {
  return states.filter((s) => s.completed).length;
}

export function milestonesByCategory(
  category: ProgressMilestoneCategory,
): ProgressMilestoneContract[] {
  return PROGRESS_MILESTONE_REGISTRY.filter((m) => m.category === category);
}

export function isMilestoneInCooldown(
  milestoneId: string,
  cooldownDays: number,
  state: ProgressEligibilityInput['cooldownState'],
  now: number,
): boolean {
  if (cooldownDays <= 0) return false;
  const entry = state?.[milestoneId];
  if (!entry?.lastCountedAt) return false;
  const ts = Date.parse(entry.lastCountedAt);
  if (!Number.isFinite(ts)) return false;
  return now - ts < cooldownDays * 86_400_000;
}
