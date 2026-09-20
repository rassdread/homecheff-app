/**
 * Combine KVK / VAT / KOR / DAC7 seller guidance with benefit pre-start.
 * Max ~3 user-facing messages. Default blocking = false.
 */

import {
  deriveKvkPrimaryFromActivity,
  deriveKvkSupportingFromActivity,
} from '../../domain/kvk';
import { deriveVatEntrepreneurshipContext } from '../../domain/vat';
import {
  activityKindsToDac7Category,
  type Dac7ReportingContext,
} from '../../domain/dac7';
import { UNKNOWN } from '../../domain/unknown';
import type { GuidanceContext, GuidanceHit, GuidanceRule } from '../types';
import { kvkGuidanceRules, evaluateKvkAssessment } from './kvk';
import { assessVatFromContext, evaluateVatRegistrationThreshold, vatGuidanceRules } from './vat';
import { evaluateKor, korGuidanceRules } from './kor';
import { dac7GuidanceRules, evaluateDac7SellerReporting } from './dac7';
import { wwGuidanceRules } from './ww';
import { bijstandGuidanceRules } from './bijstand';
import { uwvDisabilityGuidanceForScheme } from './uwv-disability';
import {
  emptyBijstandContext,
  emptyUwvDisabilityContext,
  emptyWwContext,
} from '../../domain/benefits';
import { benefitRouteFamily } from '../../domain/person';
import {
  NL_2026_EFFECTIVE,
  SRC_KVK_INSCHRIJVEN,
} from '../../rulesets/nl/2026/sources';

const USER_FACING_CAP = 3;
const TRACKING_ID = 'nl2026.tracking.keep_sales';
const THEN_KVK_VAT_ID = 'nl2026.benefit.then_kvk_vat';

const SEVERITY_RANK: Record<GuidanceRule['severity'], number> = {
  REQUIRED_BY_PLATFORM: 0,
  ACTION: 1,
  CHECK: 2,
  INFO: 3,
};

function trackingRule(): GuidanceRule {
  return {
    id: 'nl2026.tracking.keep_sales',
    jurisdiction: 'NL',
    year: 2026,
    conditions: {},
    severity: 'INFO',
    blocking: false,
    shortTitle: 'Je hoeft niet alles nu te weten',
    shortText:
      'De VerdienCheck laat zien wat nu belangrijk is. Als je situatie verandert, kun je dit later opnieuw bekijken.',
    expandedExplanation:
      'Opnieuw bekijken kan als je vaker gaat verdienen, of in een nieuw jaar. HomeCheff doet je aangifte niet voor je.',
    cta: { label: 'Later', kind: 'later' },
    officialSource: null,
    officialSourceUrl: null,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
    dismissible: true,
    recheckTrigger: 'TRANSACTION_COUNT_CHANGED',
  };
}

export function evaluateBusinessGuidanceAll(ctx: GuidanceContext): GuidanceHit[] {
  if (ctx.jurisdiction !== 'NL' || ctx.year !== 2026) return [];

  const activity = ctx.activity;
  const facts = ctx.business;
  const primary =
    facts?.kvk?.primary ?? deriveKvkPrimaryFromActivity(activity);
  const supporting =
    facts?.kvk?.supporting ?? deriveKvkSupportingFromActivity(activity);
  const kvk = evaluateKvkAssessment({ primary, supporting });

  const vatCtx =
    facts?.vatEntrepreneurship ?? deriveVatEntrepreneurshipContext(activity);
  const vatAssessment = assessVatFromContext(vatCtx);
  const vatTurnover = facts?.vatTurnover ?? {
    homeCheffVatTurnoverCents: null,
    otherRelevantVatTurnoverCents: UNKNOWN,
  };
  const vatThreshold = evaluateVatRegistrationThreshold({
    vatAssessment,
    kvkRegistrationObliged: kvk.registrationObliged,
    alreadyVatRegistered: facts?.alreadyVatRegistered ?? 'UNKNOWN',
    turnover: vatTurnover,
    calendarYear: facts?.calendarYear ?? ctx.year,
  });

  const kor = facts?.kor
    ? evaluateKor({ context: facts.kor, calendarYear: facts.calendarYear ?? ctx.year })
    : null;

  const dac7Ctx: Dac7ReportingContext = facts?.dac7 ?? {
    calendarYear: ctx.year,
    activityCategory: activityKindsToDac7Category(activity.kinds),
    transactionCount: activity.transactionCount,
    considerationCents:
      activity.typicalTicketCents != null && activity.transactionCount != null
        ? activity.typicalTicketCents * activity.transactionCount
        : null,
  };
  const dac7Status = evaluateDac7SellerReporting(dac7Ctx);

  const rules: GuidanceRule[] = [
    ...kvkGuidanceRules(kvk.assessment, facts?.kvk?.alreadyRegistered ?? 'UNKNOWN'),
    ...vatGuidanceRules({
      vatAssessment,
      eligibility: vatThreshold.eligibility,
      thresholdEvent: vatThreshold.thresholdEvent,
    }),
    ...(kor ? korGuidanceRules(kor) : []),
    ...dac7GuidanceRules({ status: dac7Status }),
    trackingRule(),
  ];

  const ranked = [...rules].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
  return ranked.map((rule) => ({
    rule: { ...rule, blocking: false },
    routeFamily: null,
  }));
}

export function evaluateBusinessGuidance(ctx: GuidanceContext): GuidanceHit[] {
  return evaluateBusinessGuidanceAll(ctx).slice(0, USER_FACING_CAP);
}

function thenKvkVatRule(): GuidanceRule {
  return {
    id: THEN_KVK_VAT_ID,
    jurisdiction: 'NL',
    year: 2026,
    conditions: {},
    severity: 'INFO',
    blocking: false,
    shortTitle: 'Daarna kijken we naar KVK en btw',
    shortText: 'Daarna kijken we samen naar KVK en btw.',
    expandedExplanation:
      'Eerst je uitkering. Daarna kijken we of KVK of btw-regels spelen. HomeCheff blokkeert verkopen niet namens UWV of gemeente.',
    cta: {
      label: 'Bekijk KVK',
      href: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
      kind: 'official',
    },
    officialSource: SRC_KVK_INSCHRIJVEN.officialSource,
    officialSourceUrl: SRC_KVK_INSCHRIJVEN.officialSourceUrl,
    verifiedAt: NL_2026_EFFECTIVE.verifiedAt,
    dismissible: true,
    recheckTrigger: 'CONTEXT_CHANGE',
  };
}

export function evaluateBenefitGuidance(ctx: GuidanceContext): GuidanceHit[] {
  if (ctx.jurisdiction !== 'NL' || ctx.year !== 2026) return [];
  const family = benefitRouteFamily(ctx.personSituation);
  if (!family) return [];
  const facts = ctx.benefits;
  let rules: GuidanceRule[] = [];
  if (family === 'WW') {
    rules = wwGuidanceRules(facts?.ww ?? emptyWwContext());
  } else if (family === 'BIJSTAND') {
    rules = bijstandGuidanceRules(facts?.bijstand ?? emptyBijstandContext());
  } else {
    const disability =
      facts?.uwvDisability?.scheme === family
        ? facts.uwvDisability
        : emptyUwvDisabilityContext(family);
    rules = uwvDisabilityGuidanceForScheme(family, disability);
  }
  return [...rules, thenKvkVatRule()].map((rule) => ({
    rule: { ...rule, blocking: false },
    routeFamily: family,
  }));
}

function benefitActionRank(hit: GuidanceHit): number {
  const id = hit.rule.id;
  if (id.includes('former_employer')) return 0;
  if (id.includes('wait_permission')) return 1;
  if (id.includes('discuss')) return 2;
  if (id.includes('income_report')) return 3;
  if (id.includes('without_start_period') || id.includes('start_period')) return 4;
  return 5;
}

export function applyIntentFirstTiming(input: {
  benefits: GuidanceHit[];
  food: GuidanceHit[];
  business: GuidanceHit[];
}): GuidanceHit[] {
  const trying = input.food.some((h) => h.rule.id === 'nl2026.food.intent.you_can_start');
  const business = input.business.map((h) => ({
    ...h,
    timing:
      h.timing ??
      (trying && h.rule.id !== TRACKING_ID ? ('LATER' as const) : ('NOW' as const)),
  }));
  const benefits = input.benefits.map((h) => ({
    ...h,
    timing: h.timing ?? ('NOW' as const),
  }));
  return [...benefits, ...input.food, ...business];
}

export function prioritizeGuidanceHits(
  hits: readonly GuidanceHit[],
  cap = USER_FACING_CAP,
): GuidanceHit[] {
  const live = hits.filter((h) => !h.rule.developmentFixture);
  const dev = hits.filter((h) => h.rule.developmentFixture);
  const now = live.filter((h) => (h.timing ?? 'NOW') === 'NOW');
  const benefit = now.filter((h) => h.routeFamily != null);
  const foodNow = now.filter((h) => h.rule.id.startsWith('nl2026.food'));
  const tracking = now.find((h) => h.rule.id === TRACKING_ID);
  const thenKvk = now.find((h) => h.rule.id === THEN_KVK_VAT_ID);

  if (benefit.length > 0) {
    const actions = benefit
      .filter((h) => h.rule.severity === 'ACTION')
      .sort((a, b) => benefitActionRank(a) - benefitActionRank(b));
    const selected: GuidanceHit[] = [];
    const first = actions[0] ?? benefit[0];
    if (first) selected.push(first);
    const foodAction = foodNow.find((h) => h.rule.severity === 'ACTION');
    if (foodAction && !selected.includes(foodAction)) selected.push(foodAction);
    else if (thenKvk && !selected.includes(thenKvk)) selected.push(thenKvk);
    else if (actions[1]) selected.push(actions[1]);
    if (tracking && !selected.includes(tracking)) selected.push(tracking);
    return [...selected.slice(0, cap), ...dev];
  }

  if (foodNow.length > 0) {
    const selected: GuidanceHit[] = [];
    const start = foodNow.find((h) => h.rule.id === 'nl2026.food.intent.you_can_start');
    if (start) selected.push(start);
    const ranked = [...foodNow].sort(
      (a, b) => SEVERITY_RANK[a.rule.severity] - SEVERITY_RANK[b.rule.severity],
    );
    for (const hit of ranked) {
      if (selected.length >= 2) break;
      if (!selected.includes(hit)) selected.push(hit);
    }
    if (tracking && !selected.includes(tracking) && selected.length < cap) {
      selected.push(tracking);
    } else {
      const kvk = now.find((h) => h.rule.id.includes('.kvk.'));
      if (kvk && !selected.includes(kvk) && selected.length < cap) selected.push(kvk);
    }
    return [...selected.slice(0, cap), ...dev];
  }

  const ranked = [...now].sort(
    (a, b) => SEVERITY_RANK[a.rule.severity] - SEVERITY_RANK[b.rule.severity],
  );
  return [...ranked.slice(0, cap), ...dev];
}
