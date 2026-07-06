/**
 * Eligibility engine — pure selection from viewer snapshot.
 * No ranking, trust engine, or recommendation logic.
 */

import type { ActivityCardContract } from './activity-card-contract';
import {
  activityCardInstanceId,
  ACTIVITY_CARD_TYPES,
} from './activity-card-contract';
import type { ActivityCardEligibilityInput } from './activity-card-contract';
import { ACTIVITY_CARD_TYPE_REGISTRY } from './activity-card-type-registry';
import type { ActivityCardType } from './activity-card-contract';

export type ActivityCardCooldownState = Partial<
  Record<ActivityCardType, { dismissedAt: string | null; lastShownAt: string | null }>
>;

export type ResolveActivityCardsOptions = {
  input: ActivityCardEligibilityInput;
  /** Cards dismissed or recently shown (client or server persisted). */
  cooldownState?: ActivityCardCooldownState;
  now?: number;
  /** Max cards returned after eligibility + cooldown. */
  limit?: number;
  /** Never repeat same card within N days after show/dismiss. */
  repeatCooldownDays?: number;
};

const DEFAULT_REPEAT_COOLDOWN_DAYS = 7;

function isInRepeatCooldown(
  type: ActivityCardType,
  state: ActivityCardCooldownState | undefined,
  repeatDays: number,
  now: number,
): boolean {
  const entry = state?.[type];
  if (!entry) return false;
  const ts = Math.max(
    entry.dismissedAt ? Date.parse(entry.dismissedAt) : 0,
    entry.lastShownAt ? Date.parse(entry.lastShownAt) : 0,
  );
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return now - ts < repeatDays * 86_400_000;
}

export function evaluateActivityCardTypeEligibility(
  type: ActivityCardType,
  input: ActivityCardEligibilityInput,
): { eligible: boolean; reason: string } {
  if (!input.loggedIn) {
    return { eligible: false, reason: 'guest' };
  }
  const def = ACTIVITY_CARD_TYPE_REGISTRY[type];
  const eligible = def.isEligible(input);
  return {
    eligible,
    reason: eligible ? def.eligibilityReason(input) : `ineligible:${type}`,
  };
}

export function resolveActivityCardContracts(
  options: ResolveActivityCardsOptions,
): ActivityCardContract[] {
  const {
    input,
    cooldownState,
    now = Date.now(),
    limit = 8,
    repeatCooldownDays = DEFAULT_REPEAT_COOLDOWN_DAYS,
  } = options;

  if (!input.loggedIn) return [];

  const eligible: ActivityCardContract[] = [];

  for (const type of ACTIVITY_CARD_TYPES) {
    const def = ACTIVITY_CARD_TYPE_REGISTRY[type];
    const { eligible: pass, reason } = evaluateActivityCardTypeEligibility(
      type,
      input,
    );
    if (!pass) continue;

    if (isInRepeatCooldown(type, cooldownState, repeatCooldownDays, now)) {
      continue;
    }

    const cardCooldownDays = def.cooldownDays;
    const dismissedAt = cooldownState?.[type]?.dismissedAt ?? null;
    if (
      dismissedAt &&
      isInRepeatCooldown(type, cooldownState, cardCooldownDays, now)
    ) {
      continue;
    }

    eligible.push({
      id: activityCardInstanceId(type, input.userId),
      type: def.type,
      priority: def.priority,
      titleKey: def.titleKey,
      descriptionKey: def.descriptionKey,
      icon: def.icon,
      actionLabelKey: def.actionLabelKey,
      actionHref: def.actionHref,
      dismissible: def.dismissible,
      cooldownDays: def.cooldownDays,
      eligibility: { eligible: true, reason },
      ctaKind: def.ctaKind,
    });
  }

  return eligible
    .sort((a, b) => b.priority - a.priority || a.type.localeCompare(b.type))
    .slice(0, limit);
}

/** Session cap: max cards to show per feed session. */
export const ACTIVITY_CARD_SESSION_MAX = 2;

/** Only one card visible in the feed band at a time. */
export const ACTIVITY_CARD_VISIBLE_MAX = 1;
