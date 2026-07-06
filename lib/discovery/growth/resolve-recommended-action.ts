/**
 * Unified recommended-action resolver — Phase 3M.
 * Combines activities, opportunities, and community progress.
 */

import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import type { EconomyOpportunitySurfaceContract } from '@/lib/discovery/surfaces/map-economy-opportunity-surface';
import type { ProgressRecommendation } from '@/lib/community/progress/progress-contract';
import type { HcpRecommendedAction } from '@/lib/hcp/economy/hcp-reward-contract';
import type {
  RecommendedActionPair,
  UnifiedRecommendedAction,
} from './growth-surface-contract';
import { GROWTH_ACTION_COOLDOWN_DAYS } from './growth-surface-contract';

const PRIORITY_MAP: Record<ActivityCardFeedItem['priority'], number> = {
  critical: 98,
  high: 85,
  normal: 70,
  low: 50,
};

function activityToAction(item: ActivityCardFeedItem): UnifiedRecommendedAction {
  return {
    id: `growth-action:activity:${item.id}`,
    source: 'activity',
    titleKey: item.titleKey,
    descriptionKey: item.descriptionKey,
    href: item.ctaHref,
    priority: PRIORITY_MAP[item.priority] ?? 70,
    cooldownDays: item.cooldownDays,
  };
}

function opportunityToAction(
  contract: EconomyOpportunitySurfaceContract,
): UnifiedRecommendedAction {
  return {
    id: `growth-action:opportunity:${contract.instanceId}`,
    source: 'opportunity',
    titleKey: contract.titleKey,
    descriptionKey: contract.descriptionKey,
    href: contract.actionHref,
    priority: contract.effectivePriority ?? 75,
    cooldownDays: contract.cooldownDays,
  };
}

function progressToAction(rec: ProgressRecommendation): UnifiedRecommendedAction {
  return {
    id: `growth-action:progress:${rec.action}`,
    source: 'community_progress',
    titleKey: rec.titleKey,
    descriptionKey: rec.descriptionKey,
    href: rec.href,
    priority: rec.priority,
    cooldownDays: GROWTH_ACTION_COOLDOWN_DAYS,
  };
}

function hcpToAction(rec: HcpRecommendedAction): UnifiedRecommendedAction {
  return {
    id: `growth-action:hcp:${rec.action}`,
    source: 'hcp',
    titleKey: rec.titleKey,
    descriptionKey: 'growth.surfaces.hcp.actionDescription',
    href: rec.href,
    priority: 58,
    cooldownDays: GROWTH_ACTION_COOLDOWN_DAYS,
  };
}

function dedupeActions(
  actions: UnifiedRecommendedAction[],
): UnifiedRecommendedAction[] {
  const seen = new Set<string>();
  const out: UnifiedRecommendedAction[] = [];
  for (const action of actions.sort((a, b) => b.priority - a.priority)) {
    const key = `${action.href}:${action.source}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(action);
  }
  return out;
}

export type ResolveRecommendedActionInput = {
  activityItems: ActivityCardFeedItem[];
  opportunity: EconomyOpportunitySurfaceContract | null;
  progressRecommendations: ProgressRecommendation[];
  hcpRecommended: HcpRecommendedAction | null;
};

export function resolveRecommendedActionPair(
  input: ResolveRecommendedActionInput,
): RecommendedActionPair {
  const candidates: UnifiedRecommendedAction[] = [];

  for (const item of input.activityItems.slice(0, 3)) {
    candidates.push(activityToAction(item));
  }

  if (input.opportunity) {
    candidates.push(opportunityToAction(input.opportunity));
  }

  for (const rec of input.progressRecommendations) {
    candidates.push(progressToAction(rec));
  }

  if (input.hcpRecommended) {
    candidates.push(hcpToAction(input.hcpRecommended));
  }

  const ranked = dedupeActions(candidates);

  return {
    primary: ranked[0] ?? null,
    secondary: ranked[1] ?? null,
  };
}

export function recommendedActionsForProfile(
  input: ResolveRecommendedActionInput,
  limit = 3,
): UnifiedRecommendedAction[] {
  const pair = resolveRecommendedActionPair(input);
  const out: UnifiedRecommendedAction[] = [];
  if (pair.primary) out.push(pair.primary);
  if (pair.secondary) out.push(pair.secondary);

  const candidates: UnifiedRecommendedAction[] = [];
  for (const item of input.activityItems.slice(0, 3)) {
    candidates.push(activityToAction(item));
  }
  if (input.opportunity) candidates.push(opportunityToAction(input.opportunity));
  for (const rec of input.progressRecommendations) {
    candidates.push(progressToAction(rec));
  }

  for (const action of dedupeActions(candidates)) {
    if (out.length >= limit) break;
    if (out.some((a) => a.id === action.id)) continue;
    out.push(action);
  }

  return out.slice(0, limit);
}
