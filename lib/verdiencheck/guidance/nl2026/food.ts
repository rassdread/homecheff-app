/**
 * Food guidance combiner. Intent-first: trying out does not dump NVWA/KVK/KOR/DAC7 as NOW.
 */

import type { GuidanceContext, GuidanceHit, GuidanceRule } from '../types';
import type { GuidanceTiming } from '../principles';
import {
  classifyFoodActivityType,
  emptyFoodActivity,
  isFoodRoute,
  mapSaleFrequencyToFoodSellingFrequency,
  type FoodActivityContext,
} from '../../domain/food-activity';
import {
  deriveDeclaredGrowthIntent,
  isLowFearDefaultIntent,
} from '../../domain/growth-intent';
import { deriveKvkPrimaryFromActivity, deriveKvkSupportingFromActivity, assessKvkEntrepreneurship } from '../../domain/kvk';
import { nvwaRegistrationRules } from './food-registration';
import { foodSafetyRules } from './food-safety';
import { foodLabellingRules } from './food-labelling';
import { NL_2026_EFFECTIVE, SRC_NVWA_THUIS } from '../../rulesets/nl/2026/sources';

export type TimedGuidanceHit = GuidanceHit & { timing: GuidanceTiming };

function withTiming(rule: GuidanceRule, timing: GuidanceTiming): TimedGuidanceHit {
  return {
    rule: { ...rule, blocking: false },
    routeFamily: null,
    timing,
  };
}

function positiveStartRule(): GuidanceRule {
  return {
    id: 'nl2026.food.intent.you_can_start',
    jurisdiction: 'NL',
    year: 2026,
    conditions: {},
    severity: 'INFO',
    blocking: false,
    shortTitle: 'Je kunt beginnen',
    shortText:
      'Je kunt klein beginnen. Voor wat je nu wilt doen hoef je niet eerst alles over ondernemen te weten. HomeCheff helpt je als er later iets verandert.',
    expandedExplanation:
      'Je kunt beginnen. Wij laten het weten als er later iets verandert. Intentie is geen wettelijke vrijstelling; als je vaker gaat verkopen kijken we opnieuw.',
    cta: { label: 'Later', kind: 'later' },
    officialSource: SRC_NVWA_THUIS.officialSource,
    officialSourceUrl: SRC_NVWA_THUIS.officialSourceUrl,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
    dismissible: true,
    recheckTrigger: 'FOOD_SELLING_FREQUENCY_CHANGED',
  };
}

function laterGrowthRule(): GuidanceRule {
  return {
    id: 'nl2026.food.intent.later_growth',
    jurisdiction: 'NL',
    year: 2026,
    conditions: {},
    severity: 'INFO',
    blocking: false,
    shortTitle: 'Wat kan later belangrijk worden?',
    shortText:
      'KVK kan relevant worden als je activiteit structureler wordt. Ga je vaker of bedrijfsmatig eten verkopen, controleer dan of je je bij de voedselautoriteit moet registreren.',
    expandedExplanation:
      'We tonen dit niet als eerste waarschuwing bij een eenmalige poging. Observed activity overschrijft later je oorspronkelijke intentie voor de timing, niet voor de juridische engines.',
    cta: { label: 'Bekijk alles wat voor mij geldt', kind: 'later' },
    officialSource: null,
    officialSourceUrl: null,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
    dismissible: true,
    recheckTrigger: 'FOOD_SELLING_FREQUENCY_CHANGED',
  };
}

export function resolveFoodActivity(ctx: GuidanceContext): FoodActivityContext {
  const provided = ctx.food;
  if (provided) return provided;
  const type = classifyFoodActivityType(ctx.activity.kinds);
  const base = emptyFoodActivity(type);
  return {
    ...base,
    sellingFrequency: mapSaleFrequencyToFoodSellingFrequency(ctx.activity.frequency),
  };
}

export function evaluateFoodGuidance(ctx: GuidanceContext): TimedGuidanceHit[] {
  if (ctx.jurisdiction !== 'NL' || ctx.year !== 2026) return [];
  const food = resolveFoodActivity(ctx);
  if (!isFoodRoute(food.activityType)) return [];

  const kvk = assessKvkEntrepreneurship({
    primary:
      ctx.business?.kvk?.primary ??
      deriveKvkPrimaryFromActivity(ctx.activity),
    supporting:
      ctx.business?.kvk?.supporting ??
      deriveKvkSupportingFromActivity(ctx.activity),
  });

  const intent = deriveDeclaredGrowthIntent({
    commercialIntent: ctx.activity.commercialIntent,
    frequency: ctx.activity.frequency,
  });
  const trying = isLowFearDefaultIntent(intent) && food.sellingFrequency !== 'MULTIPLE_TIMES_PER_YEAR';

  const timedRules = [
    ...foodSafetyRules(food),
    ...foodLabellingRules(food),
    ...nvwaRegistrationRules({
      food,
      kvkAssessment: kvk,
      alreadyKvkRegistered: ctx.business?.kvk?.alreadyRegistered,
      personSituation: ctx.personSituation,
    }),
  ];

  const hits: TimedGuidanceHit[] = timedRules.map((r) => {
    let timing = r.timing;
    if (trying && (r.id.includes('nvwa.registration_required') || r.id.includes('needs_kvk'))) {
      timing = 'LATER';
    }
    if (trying && r.id.includes('plan_required')) timing = 'LATER';
    return withTiming(r, timing);
  });

  if (trying) {
    hits.unshift(withTiming(positiveStartRule(), 'NOW'));
    hits.push(withTiming(laterGrowthRule(), 'LATER'));
  }

  return hits;
}
