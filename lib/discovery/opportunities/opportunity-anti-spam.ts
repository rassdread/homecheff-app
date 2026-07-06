/**
 * Opportunity anti-spam — cooldowns and duplicate suppression (Phase 3I).
 */

import type { OpportunityType } from './opportunity-contract';
import type { OpportunityCooldownState } from './opportunity-eligibility';
import type { OpportunityCooldownSpec } from './opportunity-contract';

export const OPPORTUNITY_MAX_DESKTOP_SIDEBAR = 1;
export const OPPORTUNITY_MAX_MOBILE_INSERT = 1;
export const OPPORTUNITY_MAX_PROFILE_MODULE = 3;
export const OPPORTUNITY_MAX_PER_CATEGORY = 1;
export const OPPORTUNITY_DEFAULT_SHOW_COOLDOWN_DAYS = 14;

export function isOpportunityInCooldown(
  type: OpportunityType,
  state: OpportunityCooldownState | undefined,
  cooldowns: OpportunityCooldownSpec,
  now: number,
): boolean {
  const entry = state?.[type];
  if (!entry) return false;

  const dismissedTs = entry.dismissedAt ? Date.parse(entry.dismissedAt) : 0;
  if (
    Number.isFinite(dismissedTs) &&
    dismissedTs > 0 &&
    now - dismissedTs < cooldowns.dismissCooldownDays * 86_400_000
  ) {
    return true;
  }

  const shownTs = entry.lastShownAt ? Date.parse(entry.lastShownAt) : 0;
  if (
    Number.isFinite(shownTs) &&
    shownTs > 0 &&
    now - shownTs < cooldowns.showCooldownDays * 86_400_000
  ) {
    return true;
  }

  return false;
}

export function suppressDuplicateOpportunities<
  T extends { type: OpportunityType; category: string },
>(candidates: T[]): T[] {
  const seenTypes = new Set<OpportunityType>();
  const categoryCounts = new Map<string, number>();
  const out: T[] = [];

  for (const c of candidates) {
    if (seenTypes.has(c.type)) continue;
    const catCount = categoryCounts.get(c.category) ?? 0;
    if (catCount >= OPPORTUNITY_MAX_PER_CATEGORY) continue;
    seenTypes.add(c.type);
    categoryCounts.set(c.category, catCount + 1);
    out.push(c);
  }

  return out;
}
