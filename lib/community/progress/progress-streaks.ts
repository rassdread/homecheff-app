/**
 * Community progress streaks — Phase 3L.
 * Real verified actions only; no passive screen time.
 */

import type {
  ProgressStreakKind,
  ProgressStreakContract,
  ProgressStreakState,
  ProgressEligibilityInput,
  ProgressMilestoneCategory,
} from './progress-contract';

const KEY = 'community.progress.streaks';

export const PROGRESS_STREAK_REGISTRY: Record<
  ProgressStreakKind,
  ProgressStreakContract
> = {
  weekly_helper: {
    kind: 'weekly_helper',
    titleKey: `${KEY}.weeklyHelper.title`,
    descriptionKey: `${KEY}.weeklyHelper.description`,
    weekTarget: 1,
    linkedCategories: ['HELPER'],
    maxInflationPerWeek: 1,
  },
  workshop: {
    kind: 'workshop',
    titleKey: `${KEY}.workshop.title`,
    descriptionKey: `${KEY}.workshop.description`,
    weekTarget: 1,
    linkedCategories: ['WORKSHOP'],
    maxInflationPerWeek: 1,
  },
  community: {
    kind: 'community',
    titleKey: `${KEY}.community.title`,
    descriptionKey: `${KEY}.community.description`,
    weekTarget: 1,
    linkedCategories: ['COMMUNITY', 'SUPPORT'],
    maxInflationPerWeek: 1,
  },
  local_discovery: {
    kind: 'local_discovery',
    titleKey: `${KEY}.localDiscovery.title`,
    descriptionKey: `${KEY}.localDiscovery.description`,
    weekTarget: 1,
    linkedCategories: ['LOCAL_DISCOVERY'],
    maxInflationPerWeek: 1,
  },
  support: {
    kind: 'support',
    titleKey: `${KEY}.support.title`,
    descriptionKey: `${KEY}.support.description`,
    weekTarget: 1,
    linkedCategories: ['SUPPORT', 'HELPER'],
    maxInflationPerWeek: 1,
  },
};

export function weekKeyUtc(now = Date.now()): string {
  const d = new Date(now);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function consecutiveWeeks(keys: string[]): number {
  if (keys.length === 0) return 0;
  const sorted = [...new Set(keys)].sort();
  let streak = 1;
  let max = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = Date.parse(sorted[i - 1]!);
    const curr = Date.parse(sorted[i]!);
    const diffDays = (curr - prev) / 86_400_000;
    if (diffDays >= 6 && diffDays <= 8) {
      streak += 1;
      max = Math.max(max, streak);
    } else if (diffDays > 8) {
      streak = 1;
    }
  }
  return max;
}

function hasVerifiedActionThisWeek(
  input: ProgressEligibilityInput,
  categories: ProgressMilestoneCategory[],
): boolean {
  return categories.some((cat) => (input.categoryCounts[cat] ?? 0) > 0);
}

export function resolveStreakState(
  kind: ProgressStreakKind,
  input: ProgressEligibilityInput,
): ProgressStreakState {
  const def = PROGRESS_STREAK_REGISTRY[kind];
  const weekKeys = input.streakWeekKeys[kind] ?? [];
  const currentWeeks = consecutiveWeeks(weekKeys);
  const capped = Math.min(currentWeeks, weekKeys.length * def.maxInflationPerWeek);
  const active =
    hasVerifiedActionThisWeek(input, def.linkedCategories) ||
    weekKeys.includes(weekKeyUtc(input.now));

  return {
    kind,
    currentWeeks: capped,
    longestWeeks: Math.max(capped, consecutiveWeeks(weekKeys)),
    lastVerifiedAt: weekKeys[weekKeys.length - 1] ?? null,
    active,
  };
}

export function resolveAllStreaks(
  input: ProgressEligibilityInput,
): ProgressStreakState[] {
  return (Object.keys(PROGRESS_STREAK_REGISTRY) as ProgressStreakKind[]).map(
    (kind) => resolveStreakState(kind, input),
  );
}

export function primaryStreak(
  streaks: ProgressStreakState[],
): ProgressStreakState | null {
  const active = streaks.filter((s) => s.active && s.currentWeeks > 0);
  if (active.length === 0) return null;
  return active.sort((a, b) => b.currentWeeks - a.currentWeeks)[0] ?? null;
}

export function passesStreakAntiInflation(
  kind: ProgressStreakKind,
  actionsThisWeek: number,
): boolean {
  const max = PROGRESS_STREAK_REGISTRY[kind].maxInflationPerWeek;
  return actionsThisWeek <= max;
}
