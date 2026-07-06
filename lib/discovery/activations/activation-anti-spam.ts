/**
 * Activation anti-spam — cooldowns and duplicate suppression (Phase 3G).
 */

import type { ActivationCooldownState } from './activation-signals';
import type { RealWorldActivationContract } from './activation-contract';

export const ACTIVATION_DEFAULT_COOLDOWN_DAYS = 7;
export const ACTIVATION_MAX_PER_SESSION = 2;
export const ACTIVATION_MAX_PER_CATEGORY_SESSION = 1;

export function isActivationInCooldown(
  activationId: string,
  state: ActivationCooldownState | undefined,
  cooldownDays: number,
  now: number,
): boolean {
  const entry = state?.[activationId];
  if (!entry) return false;
  const ts = Math.max(
    entry.dismissedAt ? Date.parse(entry.dismissedAt) : 0,
    entry.lastShownAt ? Date.parse(entry.lastShownAt) : 0,
  );
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return now - ts < cooldownDays * 86_400_000;
}

export function suppressDuplicateActivations<
  T extends { id: string; category: string; libraryRef?: string },
>(candidates: T[]): T[] {
  const seenRefs = new Set<string>();
  const categoryCounts = new Map<string, number>();
  const out: T[] = [];

  for (const c of candidates) {
    const refKey = c.libraryRef ?? c.id;
    if (seenRefs.has(refKey)) continue;
    const catCount = categoryCounts.get(c.category) ?? 0;
    if (catCount >= ACTIVATION_MAX_PER_CATEGORY_SESSION) continue;
    seenRefs.add(refKey);
    categoryCounts.set(c.category, catCount + 1);
    out.push(c);
  }

  return out;
}

export function toResolvedContract(
  def: import('./activation-contract').RealWorldActivationDefinition,
  userId: string,
  reason: string,
): RealWorldActivationContract & {
  eligibility: { eligible: boolean; reason: string };
} {
  return {
    id: def.id,
    category: def.category,
    priority: def.priority,
    titleKey: def.titleKey,
    descriptionKey: def.descriptionKey,
    icon: def.icon,
    actionLabelKey: def.actionLabelKey,
    actionHref: def.actionHref,
    dismissible: def.dismissible,
    cooldownDays: def.cooldownDays,
    ctaKind: def.ctaKind,
    viralityTier: def.viralityTier,
    allowedRewards: def.allowedRewards,
    safetyTags: def.safetyTags,
    eligibility: { eligible: true, reason },
  };
}
