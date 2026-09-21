/**
 * VerdienCheck food / KVK / NVWA decision-tree prerequisite order.
 *
 *   npx tsx scripts/test-verdiencheck-food-kvk-nvwa.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';
import { kvkSatisfiedForNvwaRegistration } from '../lib/verdiencheck/guidance/nl2026/food-registration';
import { buildPersonalVerdienRoute, findPersonalRouteContradictions } from '../lib/verdiencheck/personal-route';
import { PERSONAL_ROUTE_COPY } from '../lib/verdiencheck/personal-route/copy';
import {
  SRC_NVWA_REGISTRATIE,
  SRC_NVWA_STAPPENPLAN,
  SRC_KVK_INSCHRIJVEN,
} from '../lib/verdiencheck/rulesets/nl/2026/sources';
import { FOOD_GUIDANCE_PARAMETER_META } from '../lib/verdiencheck/rulesets/nl/2026/food-guidance-parameters';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applySituationGroup,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import {
  wizardStateToBenefitFacts,
  wizardStateToBusinessFacts,
  wizardStateToCalculatorInput,
  wizardStateToFoodFacts,
} from '../lib/verdiencheck/wizard/to-calculator-input';
import type { GuidanceContext } from '../lib/verdiencheck/guidance/types';

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
  });
}

function nowBlob(route: ReturnType<typeof routeFrom>): string {
  return route.now.map((c) => `${c.title} ${c.body}`).join('\n');
}

function hasSafety(route: ReturnType<typeof routeFrom>): boolean {
  return /veilig|hygiënisch|allergenen/i.test(nowBlob(route) + route.headline);
}

function nvwaNowAction(route: ReturnType<typeof routeFrom>): boolean {
  return route.now.some(
    (c) =>
      c.severity === 'ACTION' &&
      (c.id.includes('nvwa.registration_required') ||
        c.sourceRuleIds.some((id) => id.includes('nvwa.registration_required')) ||
        c.title.includes('Meld je nu bij de voedselautoriteit')),
  );
}

assert.equal(kvkSatisfiedForNvwaRegistration('YES'), true);
assert.equal(kvkSatisfiedForNvwaRegistration('NO'), false);
assert.equal(kvkSatisfiedForNvwaRegistration('UNKNOWN'), false);
assert.equal(kvkSatisfiedForNvwaRegistration(undefined), false);

assert.equal(FOOD_GUIDANCE_PARAMETER_META['nvwa.registration.requiresKvkInscription']?.value, true);
assert.equal(FOOD_GUIDANCE_PARAMETER_META['nvwa.registration.orderAfterKvk']?.value, 'KVK_THEN_NVWA');
assert.match(SRC_NVWA_REGISTRATIE.officialSourceUrl, /nvwa\.nl/);
assert.match(SRC_NVWA_STAPPENPLAN.officialSourceUrl, /nvwa\.nl/);
assert.match(SRC_KVK_INSCHRIJVEN.officialSourceUrl, /kvk\.nl/);

const registrationSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/guidance/nl2026/food-registration.ts'),
  'utf8',
);
assert.match(registrationSrc, /kvkSatisfiedForNvwaRegistration/);
assert.doesNotMatch(PERSONAL_ROUTE_COPY.foodRegistrationExtra, /Meld je dan ook bij de voedselautoriteit/);

const A = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'TRYING_OUT',
    foodUxFrequency: 'ONE_OFF',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
  }),
);
assert.equal(hasSafety(A), true);
assert.equal(nvwaNowAction(A), false);
assert.equal(A.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(findPersonalRouteContradictions(A).length, 0);

const B = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'REGULAR_EARNING',
    foodUxFrequency: 'REGULAR',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
    nvwaRegistered: false,
    foodSafetyPlanStatus: 'NOT_ARRANGED',
    alreadyKvkRegistered: false,
  }),
);
assert.equal(hasSafety(B), true);
assert.equal(nvwaNowAction(B), false);
assert.doesNotMatch(nowBlob(B), /Meld je nu bij de voedselautoriteit/);
assert.match(nowBlob(B), /KVK|Kamer van Koophandel/);
assert.equal(findPersonalRouteContradictions(B).length, 0);

const C = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'BUILDING_BUSINESS',
    foodUxFrequency: 'REGULAR',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
    nvwaRegistered: false,
    alreadyKvkRegistered: false,
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
    customerAcquisition: true,
  }),
);
assert.equal(nvwaNowAction(C), false);
assert.equal(
  C.now.some(
    (c) =>
      c.severity === 'ACTION' &&
      (c.id.includes('needs_kvk') || c.sourceRuleIds.some((id) => id.includes('needs_kvk'))),
  ),
  true,
);
assert.equal(C.proceedSemantics, 'PROCEED_AFTER_ACTION');
assert.equal(findPersonalRouteContradictions(C).length, 0);

const D = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'TRYING_OUT',
    foodUxFrequency: 'ONE_OFF',
    situationGroup: 'EXISTING_ENTREPRENEUR',
    alreadyKvkRegistered: true,
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
  }),
);
assert.equal(hasSafety(D), true);
assert.equal(nvwaNowAction(D), false);
assert.equal(findPersonalRouteContradictions(D).length, 0);

const E = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'REGULAR_EARNING',
    foodUxFrequency: 'REGULAR',
    situationGroup: 'EXISTING_ENTREPRENEUR',
    alreadyKvkRegistered: true,
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
    nvwaRegistered: false,
    foodSafetyPlanStatus: 'NOT_ARRANGED',
  }),
);
assert.equal(hasSafety(E), true);
assert.equal(nvwaNowAction(E), true);
assert.equal(E.proceedSemantics, 'PROCEED_AFTER_ACTION');
assert.equal(
  E.now.some((c) => c.id.includes('needs_kvk') || c.sourceRuleIds.some((id) => id.includes('needs_kvk'))),
  false,
);
assert.equal(findPersonalRouteContradictions(E).length, 0);

const F = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'BUILDING_BUSINESS',
    foodUxFrequency: 'REGULAR',
    situationGroup: 'EXISTING_ENTREPRENEUR',
    alreadyKvkRegistered: true,
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
    nvwaRegistered: false,
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
  }),
);
assert.equal(nvwaNowAction(F), true);
assert.equal(findPersonalRouteContradictions(F).length, 0);

const G = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'TRYING_OUT',
    foodUxFrequency: 'ONE_OFF',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
  }),
);
assert.equal(hasSafety(G), true);
assert.equal(nvwaNowAction(G), false);
assert.equal(findPersonalRouteContradictions(G).length, 0);

const H = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'REGULAR_EARNING',
    foodUxFrequency: 'REGULAR',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
    nvwaRegistered: false,
    alreadyKvkRegistered: false,
  }),
);
assert.equal(hasSafety(H), true);
assert.equal(nvwaNowAction(H), false);
assert.equal(findPersonalRouteContradictions(H).length, 0);

const I = routeFrom(
  state({
    activityChoice: 'FOOD',
    growthStart: 'OCCASIONAL_EARNING',
    foodUxFrequency: 'UNKNOWN',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
  }),
);
assert.equal(nvwaNowAction(I), false);
assert.equal(hasSafety(I), true);
assert.equal(kvkSatisfiedForNvwaRegistration('UNKNOWN'), false);

const J = routeFrom(
  state({
    activityChoice: 'MAKE',
    growthStart: 'REGULAR_EARNING',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
  }),
);
assert.equal(
  J.now.some(
    (c) =>
      c.family === 'food_registration' ||
      c.id.includes('nvwa') ||
      c.sourceRuleIds.some((id) => id.includes('nvwa')),
  ),
  false,
);
assert.doesNotMatch(nowBlob(J), /voedselautoriteit|levensmiddelenbedrijf/i);
assert.equal(findPersonalRouteContradictions(J).length, 0);

assert.equal(findPersonalRouteContradictions(B).some((c) => c.code === 'NVWA_BEFORE_KVK_PREREQUISITE'), false);

console.log(
  JSON.stringify(
    {
      PERSONA_A: { FOOD_SAFETY: 'NOW', NVWA: 'NOT_NOW', RESULT: A.proceedSemantics },
      PERSONA_B: { FOOD_SAFETY: 'NOW', NVWA: 'NOT_FIRST_NOW', FIRST: 'KVK_CHECK', RESULT: B.proceedSemantics },
      PERSONA_C: { FOOD_SAFETY: 'NOW', NVWA: 'SOON', FIRST: 'KVK_ACTION', RESULT: C.proceedSemantics },
      PERSONA_D: { FOOD_SAFETY: 'NOW', NVWA: 'NOT_NOW', RESULT: D.proceedSemantics },
      PERSONA_E: { FOOD_SAFETY: 'NOW', NVWA: 'NOW', RESULT: E.proceedSemantics },
      PERSONA_F: { FOOD_SAFETY: 'NOW', NVWA: 'NOW', RESULT: F.proceedSemantics },
      PERSONA_G: { FOOD_SAFETY: 'NOW', NVWA: 'NOT_NOW', RESULT: G.proceedSemantics },
      PERSONA_H: { FOOD_SAFETY: 'NOW', NVWA: 'NOT_FIRST_NOW', RESULT: H.proceedSemantics },
      PERSONA_I: { FOOD_SAFETY: 'NOW', NVWA: 'NOT_NOW_UNKNOWN', RESULT: I.proceedSemantics },
      PERSONA_J: { NVWA: 'NONE', RESULT: J.proceedSemantics },
      NO_KVK_FOOD_REPEATED_NVWA_FIRST: nvwaNowAction(B) ? 'FAIL' : 'PASS',
      KVK_PRESENT_NVWA_NOW: nvwaNowAction(E) ? 'PASS' : 'FAIL',
      CONTRADICTIONS: findPersonalRouteContradictions(B).length + findPersonalRouteContradictions(E).length,
    },
    null,
    2,
  ),
);
console.log('verdiencheck food kvk nvwa decision-tree tests: PASS');
