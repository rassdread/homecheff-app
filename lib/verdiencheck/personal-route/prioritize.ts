import type { GuidanceHit } from '../guidance/types';
import type { CardFamily, ActionSemantics } from './types';
import { MAX_PRIMARY_NOW_CARDS } from './types';
import type { GuidanceTiming } from '../guidance/principles';
import type { ObservedActivity } from '../domain/growth-intent';

export function cardFamilyOf(ruleId: string): CardFamily {
  const id = ruleId.toLowerCase();
  if (
    id.includes('.ww.') ||
    id.includes('.bijstand.') ||
    id.includes('.wia.') ||
    id.includes('.wajong.') ||
    id.includes('.zw.') ||
    id.includes('.wao.') ||
    id.includes('.waz.')
  ) {
    return 'benefit_prestart';
  }
  if (id.includes('you_can_start')) return 'start';
  if (id.includes('allergens') || id.includes('food.label')) return 'food_allergen';
  if (id.includes('food.safety') || id.includes('thermometer') || id.includes('plan_')) {
    return 'food_safety';
  }
  if (id.includes('nvwa')) return 'food_registration';
  if (id.includes('.kvk.') || id.includes('.vat.') || id.includes('needs_kvk')) {
    return 'business_registration';
  }
  if (id.includes('.dac7.')) return 'reporting';
  if (id.includes('.kor.')) return 'optimization';
  if (id.includes('tracking')) return 'tracking';
  return 'other';
}

const FAMILY_RANK: Record<CardFamily, number> = {
  benefit_prestart: 0,
  food_safety: 1,
  food_allergen: 2,
  food_registration: 3,
  business_registration: 4,
  reporting: 5,
  optimization: 6,
  start: 7,
  tracking: 8,
  other: 9,
};

const SEVERITY_RANK = {
  REQUIRED_BY_PLATFORM: 0,
  ACTION: 1,
  CHECK: 2,
  INFO: 3,
} as const;

export function familyRank(family: CardFamily): number {
  return FAMILY_RANK[family];
}

export function actionSemanticsOf(card: {
  family: CardFamily;
  severity: GuidanceHit['rule']['severity'];
  timing: GuidanceTiming;
  sourceRuleIds?: readonly string[];
  id?: string;
}): ActionSemantics {
  if (card.family === 'benefit_prestart' && (card.severity === 'ACTION' || card.severity === 'CHECK')) {
    return 'PRE_START_REQUIRED';
  }
  if (card.family === 'food_registration' && card.severity === 'ACTION') {
    return 'CURRENT_ACTION';
  }
  if (
    (card.family === 'food_safety' || card.family === 'food_allergen' || card.family === 'business_registration') &&
    card.severity === 'ACTION'
  ) {
    return 'CURRENT_ACTION';
  }
  if (card.severity === 'CHECK') return 'RECOMMENDED_CHECK';
  if (card.family === 'reporting' || card.family === 'tracking') return 'TRACKING';
  if (card.family === 'optimization' || card.timing === 'LATER') return 'FUTURE_ACTION';
  return 'RECOMMENDED_CHECK';
}

export function hitTiming(hit: GuidanceHit): GuidanceTiming {
  return hit.timing ?? 'NOW';
}

/**
 * Observed activity may promote LATER/SOON business or food-registration
 * into NOW. It never changes legal engine output.
 */
export function applyObservedActivityTiming(
  hits: readonly GuidanceHit[],
  observed: ObservedActivity,
): GuidanceHit[] {
  const grown =
    observed.frequencyObserved === 'REGULAR' ||
    observed.foodSoldMultipleTimesPerYear === true;
  if (!grown) return [...hits];

  return hits.map((hit) => {
    const family = cardFamilyOf(hit.rule.id);
    if (
      family === 'food_registration' ||
      family === 'business_registration' ||
      family === 'reporting'
    ) {
      if (hitTiming(hit) === 'LATER') {
        return { ...hit, timing: 'SOON' };
      }
    }
    return hit;
  });
}

export function sortHitsForPresentation(hits: readonly GuidanceHit[]): GuidanceHit[] {
  return [...hits].sort((a, b) => {
    const fa = FAMILY_RANK[cardFamilyOf(a.rule.id)];
    const fb = FAMILY_RANK[cardFamilyOf(b.rule.id)];
    if (fa !== fb) return fa - fb;
    return SEVERITY_RANK[a.rule.severity] - SEVERITY_RANK[b.rule.severity];
  });
}

export function capPrimaryNow<T>(items: readonly T[]): {
  primary: T[];
  rest: T[];
} {
  return {
    primary: items.slice(0, MAX_PRIMARY_NOW_CARDS),
    rest: items.slice(MAX_PRIMARY_NOW_CARDS),
  };
}
