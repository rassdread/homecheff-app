import { benefitRouteFamily, FORBIDDEN_OTHER_BENEFIT_ALIAS } from '../domain/person';
import { DEV_GUIDANCE_FIXTURES } from './fixtures/dev-fixtures';
import { applyIntentFirstTiming, evaluateBenefitGuidance, evaluateBusinessGuidance, evaluateBusinessGuidanceAll, prioritizeGuidanceHits } from './nl2026/orchestrator';
import { evaluateFoodGuidance } from './nl2026/food';
import {
  defaultBlocking,
  type GuidanceContext,
  type GuidanceHit,
  type GuidanceRule,
} from './types';

function matches(rule: GuidanceRule, ctx: GuidanceContext): boolean {
  if (rule.jurisdiction !== ctx.jurisdiction) return false;
  if (rule.year !== ctx.year) return false;
  if (
    rule.conditions.personSituation &&
    rule.conditions.personSituation !== ctx.personSituation
  ) {
    return false;
  }
  if (rule.conditions.benefitRoute) {
    if (benefitRouteFamily(ctx.personSituation) !== rule.conditions.benefitRoute) {
      return false;
    }
  }
  return true;
}

/**
 * Guidance is separate from the tax calculator.
 * DRAFT packs: only developmentFixture rules (never legal claims).
 * blocking defaults false.
 */
export function evaluateGuidance(
  ctx: GuidanceContext,
  rules: readonly GuidanceRule[] = DEV_GUIDANCE_FIXTURES,
  options?: { includeDevelopmentFixtures?: boolean },
): GuidanceHit[] {
  const includeDev = options?.includeDevelopmentFixtures !== false;
  const hits: GuidanceHit[] = [];
  for (const rule of rules) {
    if (rule.developmentFixture && !includeDev) continue;
    if (!matches(rule, ctx)) continue;
    const normalized: GuidanceRule = {
      ...rule,
      blocking: defaultBlocking(rule),
    };
    hits.push({
      rule: normalized,
      routeFamily: benefitRouteFamily(ctx.personSituation),
    });
  }
  const business = evaluateBusinessGuidance(ctx);
  const benefits = evaluateBenefitGuidance(ctx);
  const food = evaluateFoodGuidance(ctx);
  const layered = applyIntentFirstTiming({ benefits, food, business });
  return prioritizeGuidanceHits([...layered, ...hits]);
}

/**
 * Uncapped timed hits for personal-route presentation.
 * evaluateGuidance stays capped for certified 4A–4C suites.
 */
export function collectAllGuidanceHits(
  ctx: GuidanceContext,
  rules: readonly GuidanceRule[] = DEV_GUIDANCE_FIXTURES,
): GuidanceHit[] {
  const hits: GuidanceHit[] = [];
  for (const rule of rules) {
    if (rule.developmentFixture) continue;
    if (!matches(rule, ctx)) continue;
    hits.push({
      rule: { ...rule, blocking: defaultBlocking(rule) },
      routeFamily: benefitRouteFamily(ctx.personSituation),
    });
  }
  const layered = applyIntentFirstTiming({
    benefits: evaluateBenefitGuidance(ctx),
    food: evaluateFoodGuidance(ctx),
    business: evaluateBusinessGuidanceAll(ctx),
  });
  return [...layered, ...hits];
}

export function assertNoOtherBenefitAlias(source: string): boolean {
  return !source.includes(FORBIDDEN_OTHER_BENEFIT_ALIAS);
}
