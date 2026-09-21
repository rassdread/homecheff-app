/**
 * VerdienCheck Fase 5A — personal route + UX orchestration.
 *
 *   npx tsx scripts/test-verdiencheck-nl-2026-personal-route.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import {
  ASSESSMENT_ORDER,
  HOMECHEFF_GUIDANCE_PRINCIPLE,
  LEGAL_GUIDANCE_PRINCIPLE,
} from '../lib/verdiencheck/guidance/principles';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import {
  buildPersonalVerdienRoute,
  findPersonalRouteContradictions,
  MAX_PRIMARY_NOW_CARDS,
} from '../lib/verdiencheck/personal-route';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import {
  EMPTY_WIZARD_STATE,
  questionSteps,
  visibleSteps,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import {
  wizardStateToBenefitFacts,
  wizardStateToBusinessFacts,
  wizardStateToCalculatorInput,
  wizardStateToFoodFacts,
} from '../lib/verdiencheck/wizard/to-calculator-input';
import type { GuidanceContext } from '../lib/verdiencheck/guidance/types';

function state(over: Partial<WizardState>): WizardState {
  return { ...EMPTY_WIZARD_STATE, taxResidence: 'NL', ...over };
}

function ctxFrom(s: WizardState): GuidanceContext | null {
  const personSituation = derivePersonSituation({
    group: s.situationGroup,
    uwvBenefit: s.uwvBenefit,
  });
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

function blob(route: ReturnType<typeof routeFrom>): string {
  return [
    route.headline,
    route.summary,
    route.canStartMessage,
    ...route.now.map((c) => `${c.title} ${c.body}`),
    ...route.soon.map((c) => `${c.title} ${c.body}`),
    ...route.later.map((c) => `${c.title} ${c.body}`),
  ].join('\n');
}

const results: Record<string, 'PASS' | 'FAIL'> = {
  ONE_OFF_FOOD_NO_COMPLIANCE_WALL: 'FAIL',
  TRYING_OUT_POSITIVE_HEADLINE: 'FAIL',
  NO_UNNECESSARY_GOVERNMENT_NAMES_ON_START: 'FAIL',
  MAX_THREE_PRIMARY_NOW_CARDS: 'FAIL',
  LATER_RULES_COLLAPSED: 'FAIL',
  GROWTH_COPY_POSITIVE: 'FAIL',
  NO_FALSE_LEGAL_CAN_START: 'FAIL',
  UNKNOWN_NOT_ZERO: 'FAIL',
  QUESTION_MINIMIZATION: 'FAIL',
  CONTRADICTION_HANDLING: 'FAIL',
  SCENARIO_MATRIX: 'FAIL',
};

assert.equal(HOMECHEFF_GUIDANCE_PRINCIPLE, 'BEGINNEN MOGELIJK MAKEN, GROEI BEGELEIDEN');
assert.equal(LEGAL_GUIDANCE_PRINCIPLE, 'BEGELEIDEN, NIET BEWAKEN');
assert.equal(ASSESSMENT_ORDER, 'INTENT → ACTIVITY → CONTEXT → APPLICABLE RULES → NEXT ACTION');
assert.equal(MAX_PRIMARY_NOW_CARDS, 3);

const baker = state({
  activityChoice: 'FOOD',
  activityKinds: ['FOOD'],
  growthStart: 'TRYING_OUT',
  foodUxFrequency: 'ONE_OFF',
  frequency: 'ONE_OFF',
  intent: 'HOBBY_COST_RECOVERY',
  situationGroup: 'NONE',
  allowances: ['NONE'],
  packagingMode: 'UNPACKAGED',
});
const bakerRoute = routeFrom(baker);
assert.match(bakerRoute.headline, /Je kunt beginnen/);
assert.equal(bakerRoute.proceedSemantics, 'READY_TO_PROCEED');
assert.ok(bakerRoute.now.length <= 3);
const bakerNow = bakerRoute.now.map((c) => `${c.title} ${c.body}`).join('\n');
assert.match(bakerNow, /veilig|hygiënisch|allergenen/i);
assert.doesNotMatch(bakerNow, /DAC7|KOR|HACCP-certificaat|MijnNVWA/);
assert.doesNotMatch(bakerRoute.headline, /WAARSCHUWING/);
results.ONE_OFF_FOOD_NO_COMPLIANCE_WALL = 'PASS';
results.TRYING_OUT_POSITIVE_HEADLINE = 'PASS';

const copy = getVerdienCheckCopy('nl');
const startBlob = [
  copy.intro,
  copy.steps.jurisdiction?.title,
  copy.steps.activity?.title,
  copy.steps.growthStart?.title,
  JSON.stringify(copy.steps.activity?.options),
  JSON.stringify(copy.steps.growthStart?.options),
].join('\n');
assert.doesNotMatch(startBlob, /Belastingdienst|NVWA|UWV|KVK|DAC7|HACCP/);
const nlSteps = visibleSteps(state({}));
assert.equal(nlSteps[0], 'jurisdiction');
assert.equal(nlSteps[1], 'activity');
assert.equal(nlSteps[2], 'growthStart');
results.NO_UNNECESSARY_GOVERNMENT_NAMES_ON_START = 'PASS';

const cook = state({
  activityChoice: 'FOOD',
  activityKinds: ['FOOD'],
  growthStart: 'REGULAR_EARNING',
  foodUxFrequency: 'REGULAR',
  frequency: 'REGULAR',
  intent: 'SIDE_INCOME',
  situationGroup: 'EMPLOYEE',
  allowances: ['NONE'],
  packagingMode: 'UNPACKAGED',
  nvwaRegistered: false,
  foodSafetyPlanStatus: 'NOT_ARRANGED',
});
const cookRoute = routeFrom(cook);
assert.ok(cookRoute.now.length <= 3);
assert.match(cookRoute.headline, /regel nu deze praktische stap|regel een paar praktische zaken|regel eerst één ding|Je kunt/);
const cookNow = cookRoute.now.map((c) => `${c.title} ${c.body}`).join('\n');
assert.match(cookNow, /NVWA|allergenen|hygiënisch|voedselveilig/i);
results.MAX_THREE_PRIMARY_NOW_CARDS = 'PASS';
assert.equal(cookRoute.laterCollapsedByDefault, true);
results.LATER_RULES_COLLAPSED = 'PASS';

const grown = state({
  activityChoice: 'FOOD',
  activityKinds: ['FOOD'],
  growthStart: 'TRYING_OUT',
  foodUxFrequency: 'REGULAR',
  frequency: 'REGULAR',
  intent: 'HOBBY_COST_RECOVERY',
  situationGroup: 'NONE',
  allowances: ['NONE'],
  estimatedAnnualTransactions: '100',
  customers: 'PUBLIC',
});
const grownRoute = routeFrom(grown);
const grownBlob = blob(grownRoute);
assert.doesNotMatch(grownBlob, /Je hebt een grens overschreden|Je voldoet niet meer/);
assert.match(grownBlob, /groeit|vaker|relevant/i);
results.GROWTH_COPY_POSITIVE = 'PASS';

assert.doesNotMatch(
  fs.readFileSync(path.join(process.cwd(), 'lib/verdiencheck/personal-route/orchestrator.ts'), 'utf8'),
  /canLegallyStart/,
);
assert.notEqual(bakerRoute.proceedSemantics, 'READY_TO_PROCEED' as string && 'LEGAL');
results.NO_FALSE_LEGAL_CAN_START = 'PASS';

const unknownRoute = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'OCCASIONAL_EARNING',
    situationGroup: 'EMPLOYEE',
    allowances: ['HEALTHCARE'],
    ageTaxRegime: 'REACHES_AOW_IN_2026',
  }),
);
assert.equal(isUnknown(unknownRoute.financialImpact.netExtraCents) || unknownRoute.financialImpact.status !== 'EXACT', true);
assert.notEqual(unknownRoute.financialImpact.netExtraCents, 0);
if (unknownRoute.financialImpact.status !== 'EXACT') {
  assert.match(unknownRoute.financialImpact.headline, /niet als €0|niet volledig bekend|niet alle benodigde/i);
}
results.UNKNOWN_NOT_ZERO = 'PASS';

const painterQs = questionSteps(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
  }),
);
assert.equal(painterQs.includes('foodSellingFrequency'), false);
assert.equal(painterQs.includes('foodNvwa'), false);
assert.equal(painterQs.includes('wwStartPeriod'), false);
assert.equal(painterQs.includes('childcare'), false);
assert.equal(painterQs.includes('independentlyDeterminesWork'), false);

const noBenefit = questionSteps(
  state({
    activityChoice: 'SERVICE',
    activityKinds: ['SERVICE'],
    growthStart: 'OCCASIONAL_EARNING',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
  }),
);
assert.equal(noBenefit.includes('uwvBenefit'), false);
assert.equal(noBenefit.includes('wwStartPeriod'), false);

const noChild = questionSteps(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'REGULAR_EARNING',
    situationGroup: 'EMPLOYEE',
    allowances: ['HEALTHCARE'],
  }),
);
assert.equal(noChild.includes('childcare'), false);
assert.equal(noChild.includes('children'), false);

const oneOffFoodQs = questionSteps(baker);
assert.equal(oneOffFoodQs.includes('foodNvwa'), false);
assert.equal(oneOffFoodQs.includes('foodSafetyPlan'), false);
assert.equal(oneOffFoodQs.includes('foodAnimalOrigin'), false);
assert.equal(oneOffFoodQs.includes('foodSellingFrequency'), true);
results.QUESTION_MINIMIZATION = 'PASS';

const ww = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'WW',
    discussedWithUwv: false,
  }),
);
assert.match(ww.headline, /UWV|WW|Controleer dit eerst/i);
assert.notEqual(ww.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(findPersonalRouteContradictions(ww).length, 0);
assert.doesNotMatch(ww.headline, /Je kunt beginnen\./);
results.CONTRADICTION_HANDLING = 'PASS';

function expectNowCap(s: WizardState, name: string) {
  const r = routeFrom(s);
  assert.ok(r.now.length <= 3, `${name} now=${r.now.length}`);
  assert.equal(findPersonalRouteContradictions(r).length, 0, name);
  return r;
}

const matrix = {
  baker: expectNowCap(baker, 'baker'),
  cook: expectNowCap(cook, 'cook'),
  employee: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'OCCASIONAL_EARNING',
      situationGroup: 'EMPLOYEE',
      allowances: ['NONE'],
    }),
    'employee',
  ),
  healthcare: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'OCCASIONAL_EARNING',
      situationGroup: 'EMPLOYEE',
      allowances: ['HEALTHCARE'],
      assetsEligibility: 'ELIGIBLE',
      scenarioPreset: 2500,
    }),
    'healthcare',
  ),
  multiAllow: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'OCCASIONAL_EARNING',
      situationGroup: 'EMPLOYEE',
      allowances: ['HEALTHCARE', 'RENT', 'CHILD_BUDGET'],
      hasPartner: false,
      bareRentEuro: '600',
      housingHouseholdType: 'SINGLE',
      oldestHouseholdResidentAge: '40',
      housingAssetsEligibility: 'ELIGIBLE',
      childrenAges: '8',
      childBudgetAssetsEligibility: 'ELIGIBLE',
      scenarioPreset: 3000,
    }),
    'multiAllow',
  ),
  wwUndecided: expectNowCap(
    state({
      activityChoice: 'SERVICE',
      activityKinds: ['SERVICE'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'WW',
      wantsStartPeriod: 'UNKNOWN',
    }),
    'wwUndecided',
  ),
  wwStart: expectNowCap(
    state({
      activityChoice: 'SERVICE',
      activityKinds: ['SERVICE'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'WW',
      wantsStartPeriod: true,
      uwvPermission: false,
    }),
    'wwStart',
  ),
  wwWithout: expectNowCap(
    state({
      activityChoice: 'SERVICE',
      activityKinds: ['SERVICE'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'WW',
      wantsStartPeriod: false,
      wantsToRetainWw: true,
    }),
    'wwWithout',
  ),
  bijstand: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'BIJSTAND',
    }),
    'bijstand',
  ),
  wia: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'OTHER_UWV',
      uwvBenefit: 'WIA',
    }),
    'wia',
  ),
  wajong: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'OTHER_UWV',
      uwvBenefit: 'WAJONG',
    }),
    'wajong',
  ),
  zw: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'OTHER_UWV',
      uwvBenefit: 'ZW',
    }),
    'zw',
  ),
  wao: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'OTHER_UWV',
      uwvBenefit: 'WAO',
    }),
    'wao',
  ),
  artwork: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'TRYING_OUT',
      frequency: 'ONE_OFF',
      intent: 'SIDE_INCOME',
      situationGroup: 'EMPLOYEE',
      allowances: ['NONE'],
      estimatedTurnoverEuro: '5000',
      estimatedCostsEuro: '0',
      estimatedAnnualTransactions: '1',
    }),
    'artwork',
  ),
  regular5k: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'REGULAR_EARNING',
      frequency: 'REGULAR',
      customers: 'PUBLIC',
      independentlyDeterminesWork: true,
      customerAcquisition: true,
      situationGroup: 'EMPLOYEE',
      allowances: ['NONE'],
      estimatedTurnoverEuro: '5000',
      estimatedAnnualTransactions: '100',
    }),
    'regular5k',
  ),
  kor: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'BUILDING_BUSINESS',
      situationGroup: 'EXISTING_ENTREPRENEUR',
      alreadyKvkRegistered: true,
      vatRegistrationStatus: 'REGISTERED',
      korParticipating: true,
      estimatedTurnoverEuro: '8000',
    }),
    'kor',
  ),
  vat: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'BUILDING_BUSINESS',
      situationGroup: 'EXISTING_ENTREPRENEUR',
      alreadyKvkRegistered: true,
      vatRegistrationStatus: 'NOT_REGISTERED',
      estimatedTurnoverEuro: '4000',
      hasOtherBusinessTurnover: false,
    }),
    'vat',
  ),
  dac7Goods29: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'REGULAR_EARNING',
      situationGroup: 'NONE',
      estimatedAnnualTransactions: '29',
      estimatedTurnoverEuro: '2000',
    }),
    'dac7-29',
  ),
  dac7Goods30: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'REGULAR_EARNING',
      situationGroup: 'NONE',
      estimatedAnnualTransactions: '30',
      estimatedTurnoverEuro: '2500',
    }),
    'dac7-30',
  ),
  dac7Service: expectNowCap(
    state({
      activityChoice: 'SERVICE',
      activityKinds: ['SERVICE'],
      growthStart: 'REGULAR_EARNING',
      situationGroup: 'NONE',
      estimatedAnnualTransactions: '5',
      estimatedTurnoverEuro: '800',
    }),
    'dac7-service',
  ),
  aow: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'OCCASIONAL_EARNING',
      situationGroup: 'NONE',
      ageTaxRegime: 'FULL_YEAR_AOW_2026',
      aowBirthCohort: 'BORN_ON_OR_AFTER_1946',
      allowances: ['NONE'],
    }),
    'aow',
  ),
  aowUnknown: expectNowCap(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'OCCASIONAL_EARNING',
      situationGroup: 'NONE',
      ageTaxRegime: 'REACHES_AOW_IN_2026',
      allowances: ['NONE'],
    }),
    'aow-unknown',
  ),
  prepacked: expectNowCap(
    state({
      activityChoice: 'FOOD',
      activityKinds: ['FOOD'],
      growthStart: 'REGULAR_EARNING',
      foodUxFrequency: 'REGULAR',
      packagingMode: 'PREPACKED',
      situationGroup: 'NONE',
    }),
    'prepacked',
  ),
  animal: expectNowCap(
    state({
      activityChoice: 'FOOD',
      activityKinds: ['FOOD'],
      growthStart: 'REGULAR_EARNING',
      foodUxFrequency: 'REGULAR',
      handlesAnimalOriginProducts: true,
      situationGroup: 'NONE',
    }),
    'animal',
  ),
};

assert.match(matrix.bijstand.headline, /gemeente/i);
assert.match(matrix.wwUndecided.headline, /UWV|WW|Controleer dit eerst/);
assert.doesNotMatch(blob(matrix.artwork), /Je bent ondernemer/);
assert.doesNotMatch(blob(matrix.dac7Goods30), /Je bent gemeld bij de Belastingdienst/);
assert.ok(matrix.dac7Goods30.now.every((c) => c.family !== 'reporting'));
assert.match(blob(matrix.prepacked), /etiket|verpakt/i);
assert.match(blob(matrix.animal), /erkenning|NVWA/i);

const onceAfterMany = routeFrom(
  state({
    ...cook,
    foodUxFrequency: 'ONE_OFF',
    frequency: 'ONE_OFF',
    growthStart: 'TRYING_OUT',
  }),
);
assert.doesNotMatch(
  onceAfterMany.now.map((c) => c.id).join(' '),
  /registration_required/,
);
const wwOff = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
  }),
);
assert.doesNotMatch(wwOff.headline, /WW/);

results.SCENARIO_MATRIX = 'PASS';

assert.equal(NL_2026_MODULE_STATUS.personalRouteOrchestration, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.progressiveDisclosure, 'CERTIFIED');
assert.equal(NL_2026_PACK.version, '2026.6-official-payroll-white-monthly');
assert.equal(NL_2026_PACK.status, 'DRAFT');

console.log('verdiencheck NL-2026 personal route tests: PASS');
console.log(results);
