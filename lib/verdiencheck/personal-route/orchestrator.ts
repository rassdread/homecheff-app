/**
 * Personal route: presentation on top of existing engines.
 * Assessment order: INTENT → ACTIVITY → CONTEXT → APPLICABLE RULES → NEXT ACTION
 */

import {
  ASSESSMENT_ORDER,
  HOMECHEFF_GUIDANCE_PRINCIPLE,
  LEGAL_GUIDANCE_PRINCIPLE,
} from '../guidance/principles';
import type { GuidanceContext, GuidanceHit } from '../guidance/types';
import type { CalculatorResult } from '../calculator/types';
import {
  deriveDeclaredGrowthIntent,
  type HomecheffGrowthIntent,
  type ObservedActivity,
} from '../domain/growth-intent';
import { benefitRouteFamily } from '../domain/person';
import { collectAllGuidanceHits } from '../guidance/engine';
import { headlineFor, PERSONAL_ROUTE_COPY } from './copy';
import { findPersonalRouteContradictions } from './contradiction';
import { deduplicateNowHits, hitsToTimedCards } from './deduplicate';
import { presentFinancialImpact } from './financial';
import {
  actionSemanticsOf,
  applyObservedActivityTiming,
  capPrimaryNow,
  cardFamilyOf,
  familyRank,
  hitTiming,
  sortHitsForPresentation,
} from './prioritize';
import type {
  BaselinePresentationFacts,
  PersonalRouteCard,
  PersonalVerdienRoute,
  ProceedSemantics,
} from './types';
import { MAX_PRIMARY_NOW_CARDS } from './types';

void HOMECHEFF_GUIDANCE_PRINCIPLE;
void LEGAL_GUIDANCE_PRINCIPLE;

function hasPreStartAction(cards: readonly PersonalRouteCard[]): boolean {
  return cards.some((c) => actionSemanticsOf(c) === 'PRE_START_REQUIRED');
}

function hasCurrentFoodRegistrationAction(cards: readonly PersonalRouteCard[]): boolean {
  return cards.some(
    (c) =>
      c.family === 'food_registration' &&
      actionSemanticsOf(c) === 'CURRENT_ACTION' &&
      !c.id.includes('needs_kvk') &&
      !c.sourceRuleIds.some((id) => id.includes('needs_kvk')),
  );
}

function hasKvkBeforeNvwaAction(cards: readonly PersonalRouteCard[]): boolean {
  return cards.some(
    (c) =>
      c.severity === 'ACTION' &&
      (c.id.includes('needs_kvk') ||
        c.sourceRuleIds.some((id) => id.includes('needs_kvk') || id.includes('kvk.registration_indication')) ||
        (c.family === 'business_registration' && c.id.includes('registration_indication'))),
  );
}

function hasPendingNvwaRegistration(cards: readonly PersonalRouteCard[]): boolean {
  return cards.some(
    (c) =>
      c.id.includes('nvwa.registration_required') ||
      c.sourceRuleIds.some((id) => id.includes('nvwa.registration_required')),
  );
}

function hasWaitForPermission(cards: readonly PersonalRouteCard[]): boolean {
  return cards.some((c) => c.sourceRuleIds.some((id) => id.includes('wait_permission')));
}

function resolveSemantics(input: {
  hasContext: boolean;
  now: readonly PersonalRouteCard[];
  laterCards?: readonly PersonalRouteCard[];
}): ProceedSemantics {
  if (!input.hasContext) return 'INSUFFICIENT_CONTEXT';
  if (hasPreStartAction(input.now)) return 'CHECK_FIRST';
  if (hasCurrentFoodRegistrationAction(input.now)) return 'PROCEED_AFTER_ACTION';
  const pendingNvwa = hasPendingNvwaRegistration([
    ...input.now,
    ...(input.laterCards ?? []),
  ]);
  if (pendingNvwa && hasKvkBeforeNvwaAction(input.now)) return 'PROCEED_AFTER_ACTION';
  return 'READY_TO_PROCEED';
}

function isExploringGrowth(growth: HomecheffGrowthIntent | null | undefined): boolean {
  return growth === 'TRYING_OUT' || growth === 'OCCASIONAL_EARNING';
}

/**
 * A rule can apply without being a start action.
 * INFO/CHECK KVK, “you can start”, and growth reviews are not NOW tasks.
 */
function demoteFutureBusinessHits(
  hits: readonly GuidanceHit[],
  growth: HomecheffGrowthIntent | null | undefined,
): GuidanceHit[] {
  const exploring = isExploringGrowth(growth);
  return hits.map((hit) => {
    const family = cardFamilyOf(hit.rule.id);
    if (family === 'start') {
      return { ...hit, timing: 'LATER' as const };
    }
    if (family !== 'business_registration') return hit;
    if (hit.rule.severity === 'ACTION' || hit.rule.severity === 'REQUIRED_BY_PLATFORM') {
      return hit;
    }
    if (
      hit.rule.severity === 'INFO' ||
      hit.rule.id.includes('kvk.incidental') ||
      hit.rule.id.includes('kvk.insufficient') ||
      hit.rule.id.includes('kvk.already_registered')
    ) {
      return { ...hit, timing: 'LATER' as const };
    }
    if (hitTiming(hit) !== 'NOW') return hit;
    return {
      ...hit,
      timing: exploring ? ('LATER' as const) : ('SOON' as const),
    };
  });
}

const FOOD_NOW_FAMILIES = new Set(['food_safety', 'food_allergen', 'food_registration']);

function pickPrimaryBenefitCard(cards: readonly PersonalRouteCard[]): PersonalRouteCard | null {
  const benefit = cards.filter((c) => c.family === 'benefit_prestart');
  if (benefit.length === 0) return null;
  return (
    benefit.find((c) => c.id === 'ux.uwv.scheme_unknown') ??
    benefit.find((c) => c.sourceRuleIds.some((id) => id.includes('wait_permission'))) ??
    benefit[0] ??
    null
  );
}

function demoteDac7UnlessNeeded(hits: readonly GuidanceHit[]): GuidanceHit[] {
  const nowUseful = hits.filter((h) => {
    if (hitTiming(h) !== 'NOW') return false;
    const f = cardFamilyOf(h.rule.id);
    return f !== 'reporting' && f !== 'tracking' && f !== 'start' && f !== 'optimization';
  });
  return hits.map((hit) => {
    if (cardFamilyOf(hit.rule.id) !== 'reporting') return hit;
    if (hitTiming(hit) !== 'NOW') return hit;
    if (nowUseful.length > 0) return { ...hit, timing: 'SOON' as const };
    return { ...hit, timing: 'LATER' as const };
  });
}

function demoteAlreadyRegisteredKvk(hits: readonly GuidanceHit[]): GuidanceHit[] {
  return hits.map((hit) => {
    if (hit.rule.id !== 'nl2026.kvk.already_registered') return hit;
    return { ...hit, timing: 'LATER' as const };
  });
}

function demoteKor(hits: readonly GuidanceHit[]): GuidanceHit[] {
  return hits.map((hit) => {
    if (cardFamilyOf(hit.rule.id) !== 'optimization') return hit;
    if (hit.rule.severity === 'ACTION') {
      return { ...hit, timing: hitTiming(hit) === 'NOW' ? 'SOON' : hitTiming(hit) };
    }
    return { ...hit, timing: 'LATER' };
  });
}

function officialActionsFrom(cards: readonly PersonalRouteCard[]): PersonalVerdienRoute['officialActions'] {
  const out: PersonalVerdienRoute['officialActions'] = [];
  const seen = new Set<string>();
  for (const card of cards) {
    const href = card.cta?.href;
    if (!href || !card.cta) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push(card.cta);
  }
  return out;
}

export function buildObservedActivity(ctx: GuidanceContext): ObservedActivity {
  return {
    layer: 'OBSERVED_ACTIVITY',
    transactionCount: ctx.activity.transactionCount,
    frequencyObserved: ctx.activity.frequency === 'UNKNOWN' ? null : ctx.activity.frequency,
    publicCustomers:
      ctx.activity.customers === 'UNKNOWN' ? null : ctx.activity.customers !== 'PRIVATE_CIRCLE',
    activeAcquisition:
      ctx.activity.independence === 'UNKNOWN' ? null : ctx.activity.independence === true,
    foodSoldMultipleTimesPerYear:
      ctx.food?.sellingFrequency === 'MULTIPLE_TIMES_PER_YEAR'
        ? true
        : ctx.food?.sellingFrequency === 'ONCE_PER_YEAR'
          ? false
          : null,
  };
}

export function buildPersonalVerdienRoute(input: {
  ctx: GuidanceContext | null;
  calculator: CalculatorResult | null;
  declaredGrowth?: HomecheffGrowthIntent | null;
  hits?: readonly GuidanceHit[];
  forceCheckFirstReason?: 'UWV_SCHEME_UNKNOWN' | null;
  holidayPayUnresolved?: boolean;
  baselineFacts?: BaselinePresentationFacts;
}): PersonalVerdienRoute {
  const ctx = input.ctx;
  const observed: ObservedActivity = ctx
    ? buildObservedActivity(ctx)
    : {
        layer: 'OBSERVED_ACTIVITY',
        transactionCount: null,
        frequencyObserved: null,
        publicCustomers: null,
        activeAcquisition: null,
        foodSoldMultipleTimesPerYear: null,
      };

  const rawHits = ctx ? (input.hits ? [...input.hits] : collectAllGuidanceHits(ctx)) : [];
  const benefitFamily = ctx ? benefitRouteFamily(ctx.personSituation) : null;
  const foodMultiple = ctx?.food?.sellingFrequency === 'MULTIPLE_TIMES_PER_YEAR';
  const declared =
    input.declaredGrowth ??
    (ctx
      ? deriveDeclaredGrowthIntent({
          commercialIntent: ctx.activity.commercialIntent,
          frequency: ctx.activity.frequency,
        })
      : null);
  const timed = demoteFutureBusinessHits(
    demoteAlreadyRegisteredKvk(
      demoteKor(demoteDac7UnlessNeeded(applyObservedActivityTiming(rawHits, observed))),
    ),
    declared,
  );
  const sorted = sortHitsForPresentation(timed);

  const nowCardsAll = deduplicateNowHits(sorted).sort(
    (a, b) => familyRank(a.family) - familyRank(b.family),
  );
  let { primary: now, rest: restDetails } = capPrimaryNow(nowCardsAll);
  let soon = hitsToTimedCards(sorted, 'SOON');
  let later = hitsToTimedCards(sorted, 'LATER');

  const hasContext = Boolean(
    ctx &&
      ctx.activity.kinds.length > 0 &&
      ctx.personSituation,
  );
  let semantics = resolveSemantics({ hasContext, now, laterCards: [...soon, ...later] });

  if (benefitFamily && hasPreStartAction(now)) {
    semantics = 'CHECK_FIRST';
  }

  if (input.forceCheckFirstReason === 'UWV_SCHEME_UNKNOWN') {
    semantics = 'CHECK_FIRST';
    const unknownCard: PersonalRouteCard = {
      id: 'ux.uwv.scheme_unknown',
      family: 'benefit_prestart',
      timing: 'NOW',
      severity: 'CHECK',
      title: 'Controleer welke uitkering je hebt.',
      body: 'Dat bepaalt welke regels voor bijverdienen gelden. Kijk op een recente brief of in Mijn UWV. Gok de naam niet.',
      sourceRuleIds: [],
      cta: {
        label: 'Naar Mijn UWV',
        href: 'https://www.uwv.nl/particulieren',
        kind: 'official',
      },
      officialSource: 'UWV',
      officialSourceUrl: 'https://www.uwv.nl/particulieren',
      primary: true,
    };
    now = [unknownCard, ...now.filter((c) => c.id !== unknownCard.id)].slice(0, MAX_PRIMARY_NOW_CARDS);
  }

  if (semantics === 'CHECK_FIRST') {
    const benefit = now.filter((c) => c.family === 'benefit_prestart');
    const other = now.filter((c) => c.family !== 'benefit_prestart');
    const primary = pickPrimaryBenefitCard(benefit);
    now = primary ? [primary] : benefit.slice(0, 1);
    later = [...benefit.filter((c) => c !== primary), ...other, ...later];
  }

  if (semantics === 'PROCEED_AFTER_ACTION') {
    const pendingNvwa = hasPendingNvwaRegistration([...now, ...soon, ...later]);
    const hasNeedsKvk = now.some(
      (c) => c.id.includes('needs_kvk') || c.sourceRuleIds.some((id) => id.includes('needs_kvk')),
    );
    const keep = now.filter((c) => {
      if (FOOD_NOW_FAMILIES.has(c.family)) return true;
      if (
        pendingNvwa &&
        !hasNeedsKvk &&
        c.family === 'business_registration' &&
        c.severity === 'ACTION'
      ) {
        return true;
      }
      return false;
    });
    const moved = now.filter((c) => !keep.includes(c));
    now = keep;
    const soonMoved = moved.filter((c) => c.severity === 'ACTION' || c.severity === 'CHECK');
    const laterMoved = moved.filter((c) => c.severity !== 'ACTION' && c.severity !== 'CHECK');
    soon = [...soonMoved, ...soon];
    later = [...laterMoved, ...later];
  }

  if (semantics === 'READY_TO_PROCEED') {
    const business = now.filter((c) => c.family === 'business_registration');
    now = now.filter((c) => c.family !== 'business_registration');
    const soonMoved = business.filter((c) => c.severity === 'ACTION' || c.severity === 'CHECK');
    const laterMoved = business.filter((c) => c.severity !== 'ACTION' && c.severity !== 'CHECK');
    soon = [...soonMoved, ...soon];
    later = [...laterMoved, ...later];
  }

  const foodSold = Boolean(ctx?.food || ctx?.activity?.kinds.includes('FOOD'));
  const copy = headlineFor({
    semantics,
    benefitFamily,
    growth: declared,
    foodMultiple: foodMultiple === true,
    foodSold,
    waitForPermission: hasWaitForPermission(now),
  });
  const uwvUnknown = input.forceCheckFirstReason === 'UWV_SCHEME_UNKNOWN';

  const route: PersonalVerdienRoute = {
    headline: uwvUnknown
      ? 'Controleer welke uitkering je hebt.'
      : copy.headline,
    summary: uwvUnknown
      ? 'Dat bepaalt welke regels voor bijverdienen gelden. Kijk op een recente brief of in Mijn UWV.'
      : copy.summary,
    canStartMessage: uwvUnknown
      ? 'Je bent bijna klaar. Controleer eerst dit.'
      : copy.canStartMessage,
    proceedSemantics: semantics,
    now,
    soon,
    later,
    restDetails,
    financialImpact: presentFinancialImpact(input.calculator, {
      allowances: ctx?.allowances ?? null,
      holidayPayUnresolved: input.holidayPayUnresolved === true,
      baselineFacts: input.baselineFacts,
    }),
    trackingMessage: PERSONAL_ROUTE_COPY.tracking,
    officialActions: officialActionsFrom([...now, ...soon, ...later, ...restDetails]),
    unknowns: ctx && input.calculator?.status === 'READY' ? input.calculator.missingInputs : [],
    contextCompleteness: hasContext
      ? input.calculator?.status === 'READY' && input.calculator.netExtraIsDefinitive
        ? 'COMPLETE'
        : 'PARTIAL'
      : 'INSUFFICIENT',
    declaredIntent: declared,
    observedActivity: observed,
    assessmentOrder: ASSESSMENT_ORDER,
    laterCollapsedByDefault: true,
    soonCompactByDefault: true,
    layers: {
      declared: 'DECLARED_INTENT',
      observed: 'OBSERVED_ACTIVITY',
      legal: 'LEGAL_ASSESSMENT',
    },
  };

  const contradictions = findPersonalRouteContradictions(route);
  if (contradictions.length > 0) {
    return {
      ...route,
      proceedSemantics: 'CHECK_FIRST',
      headline: 'Controleer eerst één stap.',
      canStartMessage: 'Je bent bijna klaar. Controleer eerst dit.',
    };
  }

  return route;
}

export { MAX_PRIMARY_NOW_CARDS };
