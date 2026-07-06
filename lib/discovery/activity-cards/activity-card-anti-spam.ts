/**
 * Activity Card anti-spam rules — Phase 3A.
 * No repeated prompts; dismiss + cooldown persistence (client-first, no schema in 3A).
 */

import type { ActivityCardId, ActivityCardPriority } from './activity-card-types';

export type ActivityCardAntiSpamConfig = {
  /** Global max visible across all surfaces per session. */
  maxVisibleGlobal: number;
  /** Per-surface caps enforced in visibility matrix. */
  maxPerSurface: Record<string, number>;
  /** Cooldown after dismiss (days). */
  dismissCooldownDays: number;
  /** Cooldown after snooze (days). */
  snoozeCooldownDays: number;
  /** Cooldown after CTA completed (days) — card hidden once action detected. */
  completionCooldownDays: number;
  /** Same card max impressions per 7 days before forced cooldown. */
  maxImpressionsPerWeek: number;
  /** Never show two cards from same category in one feed band. */
  onePerCategoryPerBand: boolean;
};

export const DEFAULT_ACTIVITY_CARD_ANTI_SPAM: ActivityCardAntiSpamConfig = {
  maxVisibleGlobal: 4,
  maxPerSurface: {
    home_feed: 2,
    feed_mobile_insert: 1,
    desktop_sidebar: 3,
    profile_owner: 4,
    messages_inbox: 1,
    messages_thread: 1,
  },
  dismissCooldownDays: 14,
  snoozeCooldownDays: 3,
  completionCooldownDays: 90,
  maxImpressionsPerWeek: 5,
  onePerCategoryPerBand: true,
};

/** Priority boost does not bypass cooldowns. */
export const PRIORITY_COOLDOWN_OVERRIDES: Partial<
  Record<ActivityCardId, { dismissCooldownDays: number }>
> = {
  leave_review_after_deal: { dismissCooldownDays: 1 },
  complete_profile: { dismissCooldownDays: 7 },
  set_location: { dismissCooldownDays: 7 },
};

export type ActivityCardDismissStorage = {
  /** localStorage key prefix — Phase 3B */
  prefix: 'hc_activity_card';
  version: 1;
};

export const ACTIVITY_CARD_DISMISS_STORAGE: ActivityCardDismissStorage = {
  prefix: 'hc_activity_card',
  version: 1,
};

export function dismissStorageKey(cardId: ActivityCardId): string {
  return `${ACTIVITY_CARD_DISMISS_STORAGE.prefix}:dismiss:${cardId}`;
}

export function impressionStorageKey(cardId: ActivityCardId): string {
  return `${ACTIVITY_CARD_DISMISS_STORAGE.prefix}:impressions:${cardId}`;
}

/**
 * Phase 3C may add server-side UserPreference — explicitly out of 3A (no schema).
 * Client localStorage is source of truth until sync layer lands.
 */

export function isCardInCooldown(
  dismissedAt: string | null,
  cooldownDays: number,
  now = Date.now(),
): boolean {
  if (!dismissedAt) return false;
  const ts = Date.parse(dismissedAt);
  if (!Number.isFinite(ts)) return false;
  const ms = cooldownDays * 86_400_000;
  return now - ts < ms;
}

export function priorityAllowsBypass(_priority: ActivityCardPriority): boolean {
  return false;
}
