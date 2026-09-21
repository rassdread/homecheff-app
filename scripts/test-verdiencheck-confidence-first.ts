/**
 * VerdienCheck confidence-first result UX.
 * Presentation/prioritization only — engines stay untouched.
 *
 *   npx tsx scripts/test-verdiencheck-confidence-first.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';
import {
  isVerdienCheckPersistenceEnabled,
  isVerdienCheckReceiptVaultEnabled,
  isVerdienWijzerEnabled,
} from '../lib/verdiencheck/flags';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { collectAllGuidanceHits } from '../lib/verdiencheck/guidance/engine';
import {
  actionSemanticsOf,
  buildPersonalVerdienRoute,
} from '../lib/verdiencheck/personal-route';
import { headlineFor, PERSONAL_ROUTE_COPY } from '../lib/verdiencheck/personal-route/copy';
import type { GuidanceContext } from '../lib/verdiencheck/guidance/types';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applySituationGroup,
  applyUwvBenefitUnknown,
  questionsBeforeFirstResult,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import {
  wizardStateToBenefitFacts,
  wizardStateToBusinessFacts,
  wizardStateToCalculatorInput,
  wizardStateToFoodFacts,
} from '../lib/verdiencheck/wizard/to-calculator-input';
import { persistenceUsesDatabase } from '../lib/verdiencheck/privacy/session-client';
import { FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS } from '../lib/verdiencheck/privacy/analytics-guard';

const ROOT = process.cwd();

function state(partial: Partial<WizardState>): WizardState {
  let next: WizardState = { ...EMPTY_WIZARD_STATE, taxResidence: 'NL', ...partial };
  if (partial.activityChoice) {
    next = {
      ...next,
      activityChoice: partial.activityChoice,
      activityKinds: applyActivityChoice(partial.activityChoice),
    };
  }
  if (partial.growthStart) next = applyGrowthStartChoice(next, partial.growthStart);
  if (partial.situationGroup) next = applySituationGroup(next, partial.situationGroup);
  return { ...next, ...partial, taxResidence: 'NL', activityKinds: next.activityKinds };
}

function ctxFrom(s: WizardState): GuidanceContext | null {
  const personSituation =
    derivePersonSituation({
      group: s.situationGroup,
      uwvBenefit: s.uwvBenefit,
    }) ?? (s.uwvBenefitUnknown ? 'OTHER' : null);
  const input = wizardStateToCalculatorInput(s);
  if (!personSituation) return null;
  return {
    jurisdiction: 'NL',
    year: 2026,
    personSituation,
    allowances: s.allowances.length > 0 ? s.allowances : ['NONE'],
    activity: input
      ? input.activity
      : {
          kinds: s.activityKinds,
          frequency: s.frequency ?? 'UNKNOWN',
          customers: s.customers ?? 'UNKNOWN',
          commercialIntent: s.intent ?? 'UNKNOWN',
          independence: 'UNKNOWN',
          continuity: 'UNKNOWN',
          timeOrMoneyInvested: 'UNKNOWN',
          listingCount: null,
          transactionCount: null,
          typicalTicketCents: null,
          unitCount: null,
        },
    business: wizardStateToBusinessFacts(s),
    benefits: wizardStateToBenefitFacts(s),
    food: wizardStateToFoodFacts(s),
  };
}

function routeFrom(s: WizardState) {
  const input = wizardStateToCalculatorInput(s);
  return buildPersonalVerdienRoute({
    ctx: ctxFrom(s),
    calculator: input ? runCalculator(input) : null,
    declaredGrowth: s.growthStart,
    forceCheckFirstReason: s.uwvBenefitUnknown ? 'UWV_SCHEME_UNKNOWN' : null,
  });
}

const GOV_NAME =
  /Kamer van Koophandel|\bKVK\b|Belastingdienst|\bUWV\b|gemeente|\bNVWA\b|\bDAC7\b|\bKOR\b/gi;

function govNamesAboveCta(route: ReturnType<typeof routeFrom>): string[] {
  const blob = [
    route.headline,
    route.summary,
    ...route.now.map((c) => `${c.title} ${c.body} ${c.cta?.label ?? ''}`),
  ].join('\n');
  const found = blob.match(GOV_NAME) ?? [];
  return [...new Set(found.map((name) => name.toLowerCase()))];
}

function nowIds(route: ReturnType<typeof routeFrom>): string[] {
  return route.now.map((c) => c.id);
}

assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);
assert.equal(persistenceUsesDatabase(), false);

const starter = routeFrom(
  state({
    activityChoice: 'MAKE',
    growthStart: 'TRYING_OUT',
    situationGroup: 'NONE',
    frequency: 'ONE_OFF',
    intent: 'HOBBY_COST_RECOVERY',
    customers: 'PRIVATE_CIRCLE',
    allowances: ['NONE'],
  }),
);
assert.equal(starter.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(starter.headline, 'Je kunt het eerst proberen.');
assert.doesNotMatch(starter.headline, /KVK|KOR|DAC7|NVWA/);
assert.equal(starter.now.some((c) => c.family === 'business_registration'), false);
assert.equal(starter.now.some((c) => c.family === 'reporting'), false);
assert.equal(starter.now.some((c) => c.family === 'optimization'), false);
assert.ok(starter.later.some((c) => c.id.includes('kvk.incidental') || c.title.includes('vaker gaat verkopen')));
assert.equal(govNamesAboveCta(starter).length, 0);
assert.ok(starter.now.length <= 1);

const employee = routeFrom(
  state({
    activityChoice: 'MAKE',
    growthStart: 'OCCASIONAL_EARNING',
    situationGroup: 'EMPLOYEE',
    frequency: 'OCCASIONAL',
    intent: 'SIDE_INCOME',
    allowances: ['NONE'],
  }),
);
assert.equal(employee.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(employee.headline, 'Je kunt beginnen.');
assert.equal(employee.now.some((c) => c.family === 'business_registration'), false);
assert.equal(govNamesAboveCta(employee).length, 0);

const oneOffFood = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'TRYING_OUT',
    foodUxFrequency: 'ONE_OFF',
    frequency: 'ONE_OFF',
    intent: 'HOBBY_COST_RECOVERY',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
  }),
);
assert.equal(oneOffFood.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(oneOffFood.headline, 'Je kunt beginnen.');
assert.match(oneOffFood.summary, /twee dingen|veilig bereiden|allergenen/i);
assert.match(oneOffFood.now.map((c) => `${c.title} ${c.body}`).join('\n'), /veilig|allergenen/i);
assert.doesNotMatch(oneOffFood.now.map((c) => `${c.title} ${c.body}`).join('\n'), /\bNVWA\b|DAC7|KOR|KVK/);
assert.doesNotMatch(oneOffFood.headline, /\bNVWA\b|HACCP|registreren/);

const fewTimesFood = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'TRYING_OUT',
    foodUxFrequency: 'OCCASIONAL_RECURRING',
    frequency: 'OCCASIONAL',
    intent: 'HOBBY_COST_RECOVERY',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
    customers: 'PUBLIC',
  }),
);
assert.equal(fewTimesFood.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(fewTimesFood.headline, 'Je kunt beginnen.');
assert.match(fewTimesFood.now.map((c) => `${c.title} ${c.body}`).join('\n'), /veilig|allergenen/i);
assert.equal(
  fewTimesFood.now.some((c) => c.family === 'food_registration' && c.severity === 'ACTION'),
  false,
);
assert.doesNotMatch(
  fewTimesFood.now.map((c) => `${c.title} ${c.body}`).join('\n'),
  /Meld je nu bij de voedselautoriteit|registration_required/,
);
assert.ok(
  fewTimesFood.later.some(
    (c) =>
      c.id.includes('few_times_non_business') ||
      c.title.includes('paar keer per jaar') ||
      c.body.includes('vaker of bedrijfsmatig'),
  ),
);

const regularFood = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'REGULAR_EARNING',
    foodUxFrequency: 'REGULAR',
    frequency: 'REGULAR',
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
    nvwaRegistered: false,
    foodSafetyPlanStatus: 'NOT_ARRANGED',
  }),
);
assert.equal(regularFood.proceedSemantics, 'PROCEED_AFTER_ACTION');
assert.match(regularFood.headline, /regel nu deze praktische stap/);
assert.equal(
  regularFood.now.some(
    (c) =>
      c.severity === 'ACTION' &&
      (c.id.includes('needs_kvk') || c.sourceRuleIds.some((id) => id.includes('needs_kvk'))),
  ),
  true,
);
assert.equal(
  regularFood.now.some(
    (c) =>
      c.severity === 'ACTION' &&
      (c.id.includes('nvwa.registration_required') ||
        c.sourceRuleIds.some((id) => id.includes('nvwa.registration_required'))),
  ),
  false,
);
assert.doesNotMatch(regularFood.now.map((c) => c.title).join('\n'), /Meld je nu bij de voedselautoriteit/);
assert.match(regularFood.now.map((c) => `${c.title} ${c.body}`).join('\n'), /Kamer van Koophandel|KVK/);
assert.equal(regularFood.now.some((c) => c.family === 'reporting'), false);
assert.equal(regularFood.now.some((c) => c.family === 'optimization'), false);

const ww = routeFrom(
  state({
    activityChoice: 'MAKE',
    growthStart: 'TRYING_OUT',
    situationGroup: 'WW',
    discussedWithUwv: false,
  }),
);
assert.equal(ww.proceedSemantics, 'CHECK_FIRST');
assert.equal(ww.headline, 'Controleer dit eerst met UWV.');
assert.equal(ww.now.length, 1);
assert.equal(ww.now[0]?.family, 'benefit_prestart');
assert.doesNotMatch(ww.now.map((c) => `${c.title} ${c.body}`).join('\n'), /KVK|DAC7|KOR|NVWA/);

const bijstand = routeFrom(
  state({
    activityChoice: 'MAKE',
    growthStart: 'TRYING_OUT',
    situationGroup: 'BIJSTAND',
  }),
);
assert.equal(bijstand.proceedSemantics, 'CHECK_FIRST');
assert.match(bijstand.headline, /gemeente/i);
assert.equal(bijstand.now.length, 1);
assert.equal(bijstand.now[0]?.family, 'benefit_prestart');
assert.doesNotMatch(bijstand.now.map((c) => `${c.title} ${c.body}`).join('\n'), /KVK|DAC7|KOR|NVWA/);

const existing = routeFrom(
  state({
    activityChoice: 'MAKE',
    growthStart: 'BUILDING_BUSINESS',
    situationGroup: 'EXISTING_ENTREPRENEUR',
    alreadyKvkRegistered: true,
    frequency: 'REGULAR',
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
    customerAcquisition: true,
  }),
);
assert.equal(existing.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(existing.headline, 'Je kunt beginnen.');
assert.doesNotMatch(existing.now.map((c) => c.title).join('\n'), /Controleer je KVK-inschrijving/);

const unknownUwv = routeFrom(
  applyUwvBenefitUnknown(
    state({
      activityChoice: 'MAKE',
      growthStart: 'TRYING_OUT',
      situationGroup: 'OTHER_UWV',
    }),
  ),
);
assert.equal(unknownUwv.proceedSemantics, 'CHECK_FIRST');
assert.equal(unknownUwv.headline, 'Controleer welke uitkering je hebt.');
assert.doesNotMatch(`${unknownUwv.headline}\n${unknownUwv.summary}\n${unknownUwv.now.map((c) => `${c.title} ${c.body}`).join('\n')}`, /WIA|Wajong|WAO|WAZ/);

const tryingHeadline = headlineFor({
  semantics: 'READY_TO_PROCEED',
  benefitFamily: null,
  growth: 'TRYING_OUT',
  foodMultiple: false,
});
assert.equal(tryingHeadline.headline, 'Je kunt het eerst proberen.');

const nl = getVerdienCheckCopy('nl');
assert.equal(nl.startSelling, 'Maak je eerste aanbod');
assert.doesNotMatch(nl.moneyPrompt, /verlies|terugbetalen|boete/);
assert.match(nl.moneyPrompt, /voor je geld/);
assert.match(PERSONAL_ROUTE_COPY.growthReassurance, /later belangrijk/);
assert.match(PERSONAL_ROUTE_COPY.dac7Title, /Als je verkoop groeit/);
assert.match(PERSONAL_ROUTE_COPY.kvkLaterTitle, /Als je vaker gaat verkopen/);
assert.doesNotMatch(PERSONAL_ROUTE_COPY.kvkLaterTitle, /^KVK/);

const wizardSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'), 'utf8');
assert.match(wizardSrc, /variant="sell"/);
assert.match(wizardSrc, /variant="nav"/);
assert.match(wizardSrc, /copy\.restNotToday|personalRoute\.trackingMessage/);
const sellIdx = wizardSrc.indexOf('variant="sell"');
const moneyIdx = wizardSrc.indexOf('copy.moneyPrompt');
const laterIdx = wizardSrc.indexOf('copy.laterHeading');
assert.ok(moneyIdx > 0 && sellIdx > moneyIdx, 'optional money before HomeCheff CTA');
assert.ok(laterIdx > 0 && laterIdx < moneyIdx, 'later guidance before optional money');

const actionSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckActionCard.tsx'), 'utf8');
assert.match(actionSrc, /benefit_prestart/);
assert.match(actionSrc, /food_registration/);

const orchestratorSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/personal-route/orchestrator.ts'),
  'utf8',
);
assert.match(orchestratorSrc, /collectAllGuidanceHits/);
assert.match(orchestratorSrc, /demoteFutureBusinessHits/);
assert.doesNotMatch(orchestratorSrc, /canLegallyStart/);

const kvkEngine = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/guidance/nl2026/kvk.ts'), 'utf8');
assert.match(kvkEngine, /nl2026\.kvk\.incidental/);
assert.match(kvkEngine, /Bekijk de KVK-criteria/);

const starterState = state({
  activityChoice: 'MAKE',
  growthStart: 'TRYING_OUT',
  situationGroup: 'NONE',
});
assert.equal(questionsBeforeFirstResult(starterState).length, 4);
assert.equal(
  questionsBeforeFirstResult(
    state({ activityChoice: 'MAKE', growthStart: 'OCCASIONAL_EARNING', situationGroup: 'EMPLOYEE' }),
  ).length,
  4,
);
assert.equal(
  questionsBeforeFirstResult(
    state({
      activityChoice: 'FOOD',
      growthStart: 'TRYING_OUT',
      foodUxFrequency: 'ONE_OFF',
      situationGroup: 'NONE',
    }),
  ).length,
  5,
);
assert.equal(
  questionsBeforeFirstResult(
    state({
      activityChoice: 'FOOD',
      growthStart: 'TRYING_OUT',
      foodUxFrequency: 'OCCASIONAL_RECURRING',
      situationGroup: 'NONE',
    }),
  ).length,
  5,
);
assert.equal(
  questionsBeforeFirstResult(
    state({
      activityChoice: 'FOOD',
      growthStart: 'REGULAR_EARNING',
      foodUxFrequency: 'REGULAR',
      situationGroup: 'NONE',
    }),
  ).length,
  5,
);
assert.equal(
  questionsBeforeFirstResult(state({ activityChoice: 'MAKE', growthStart: 'TRYING_OUT', situationGroup: 'WW' })).length,
  4,
);
assert.equal(
  questionsBeforeFirstResult(
    state({ activityChoice: 'MAKE', growthStart: 'TRYING_OUT', situationGroup: 'BIJSTAND' }),
  ).length,
  4,
);
assert.equal(
  questionsBeforeFirstResult(
    state({ activityChoice: 'MAKE', growthStart: 'BUILDING_BUSINESS', situationGroup: 'EXISTING_ENTREPRENEUR' }),
  ).length,
  4,
);

const starterCtx = ctxFrom(starterState);
assert.ok(starterCtx);
const rawHits = collectAllGuidanceHits(starterCtx);
assert.ok(rawHits.some((h) => h.rule.id.includes('kvk.incidental')));
assert.equal(
  starter.now.some((c) => c.sourceRuleIds.some((id) => id.includes('kvk.incidental'))),
  false,
);

assert.ok(FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS.includes('benefittype'));
const funnelSrc = fs.readFileSync(path.join(ROOT, 'lib/analytics/verdiencheck-funnel.ts'), 'utf8');
assert.doesNotMatch(funnelSrc, /persona|benefit_type|leeftijd/);

assert.ok(employee.now.every((c) => actionSemanticsOf(c) !== 'PRE_START_REQUIRED'));

const report = {
  SIMPLE_STARTER_GOV_NAMES_ABOVE_CTA: govNamesAboveCta(starter).length,
  EMPLOYEE_GOV_NAMES_ABOVE_CTA: govNamesAboveCta(employee).length,
  ONEOFF_FOOD_GOV_NAMES_ABOVE_CTA: govNamesAboveCta(oneOffFood).length,
  REGULAR_FOOD_GOV_NAMES_ABOVE_CTA: govNamesAboveCta(regularFood).length,
  WW_GOV_NAMES_ABOVE_CTA: govNamesAboveCta(ww).length,
  BIJSTAND_GOV_NAMES_ABOVE_CTA: govNamesAboveCta(bijstand).length,
  STARTER_HEADLINE: starter.headline,
  STARTER_NOW: nowIds(starter),
  FOOD_HEADLINE: oneOffFood.headline,
  REGULAR_FOOD_HEADLINE: regularFood.headline,
  WW_HEADLINE: ww.headline,
  READY_PRIMARY_CTA: nl.startSelling,
};

assert.equal(report.SIMPLE_STARTER_GOV_NAMES_ABOVE_CTA, 0);
assert.equal(report.EMPLOYEE_GOV_NAMES_ABOVE_CTA, 0);
assert.ok(report.ONEOFF_FOOD_GOV_NAMES_ABOVE_CTA <= 1);
assert.ok(report.WW_GOV_NAMES_ABOVE_CTA >= 1);

console.log(JSON.stringify(report, null, 2));
console.log('verdiencheck confidence-first tests: PASS');
