/**
 * VerdienCheck Fase 5C — release candidate certification.
 *
 *   npx tsx scripts/test-verdiencheck-phase-5c.ts
 */
import assert from 'node:assert/strict';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { derivePersonSituation } from '../lib/verdiencheck/domain/person';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import {
  isVerdienCheckEnabled,
  isVerdienCheckPublicCtaEnabled,
  isVerdienCheckPublicEnabled,
  isVerdienCheckPersistenceEnabled,
  isVerdienCheckReceiptVaultEnabled,
  isVerdienWijzerEnabled,
} from '../lib/verdiencheck/flags';
import { kvkGuidanceRules } from '../lib/verdiencheck/guidance/nl2026/kvk';
import { foodLabellingRules } from '../lib/verdiencheck/guidance/nl2026/food-labelling';
import { emptyFoodActivity } from '../lib/verdiencheck/domain/food-activity';
import type { GuidanceContext } from '../lib/verdiencheck/guidance/types';
import {
  actionSemanticsOf,
  buildPersonalVerdienRoute,
  findPersonalRouteContradictions,
  MAX_PRIMARY_NOW_CARDS,
} from '../lib/verdiencheck/personal-route';
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

function nowText(route: ReturnType<typeof routeFrom>): string {
  return route.now.map((c) => `${c.title} ${c.body}`).join('\n');
}

function allText(route: ReturnType<typeof routeFrom>): string {
  return [
    route.headline,
    ...route.now.map((c) => `${c.title} ${c.body}`),
    ...route.soon.map((c) => `${c.title} ${c.body}`),
    ...route.later.map((c) => `${c.title} ${c.body}`),
  ].join('\n');
}

assert.equal(isVerdienCheckEnabled(), false);
assert.equal(isVerdienCheckPublicEnabled(), false);
assert.equal(isVerdienWijzerEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);
assert.equal(isVerdienCheckReceiptVaultEnabled(), false);
assert.equal(isVerdienCheckPublicCtaEnabled(), false);

const existingRegistered = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'BUILDING_BUSINESS',
    frequency: 'REGULAR',
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
    customerAcquisition: true,
    situationGroup: 'EXISTING_ENTREPRENEUR',
    alreadyKvkRegistered: true,
    vatRegistrationStatus: 'REGISTERED',
    korParticipating: true,
    estimatedTurnoverEuro: '18000',
    estimatedCostsEuro: '4000',
    estimatedAnnualTransactions: '80',
    allowances: ['NONE'],
  }),
);
assert.ok(existingRegistered.now.length <= MAX_PRIMARY_NOW_CARDS);
assert.doesNotMatch(nowText(existingRegistered), /Controleer je KVK-inschrijving/);
assert.equal(existingRegistered.proceedSemantics, 'READY_TO_PROCEED');
assert.match(existingRegistered.headline, /^Je kunt beginnen\.$/);
assert.match(allText(existingRegistered), /al bij (KVK|Kamer van Koophandel \(KVK\)) staat ingeschreven/);

const existingUnregistered = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'BUILDING_BUSINESS',
    frequency: 'REGULAR',
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
    customerAcquisition: true,
    situationGroup: 'EXISTING_ENTREPRENEUR',
    alreadyKvkRegistered: false,
    vatRegistrationStatus: 'NOT_REGISTERED',
    korParticipating: false,
    estimatedTurnoverEuro: '18000',
    estimatedAnnualTransactions: '80',
    allowances: ['NONE'],
  }),
);
assert.match(nowText(existingUnregistered), /Controleer je KVK-inschrijving|KVK/);
assert.match(existingUnregistered.headline, /Je kunt beginnen/);
assert.doesNotMatch(existingUnregistered.headline, /regel eerst/);

const alreadyYes = kvkGuidanceRules('CLEAR_REGISTRATION_INDICATION', 'YES');
assert.equal(alreadyYes[0]?.severity, 'INFO');
assert.equal(alreadyYes[0]?.id, 'nl2026.kvk.already_registered');
const alreadyNo = kvkGuidanceRules('CLEAR_REGISTRATION_INDICATION', 'NO');
assert.equal(alreadyNo[0]?.severity, 'ACTION');
assert.equal(alreadyNo[0]?.id, 'nl2026.kvk.registration_indication');
const reviewKept = kvkGuidanceRules('REVIEW_RECOMMENDED', 'YES');
assert.equal(reviewKept[0]?.id, 'nl2026.kvk.review');

const employeeAllowances = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'OCCASIONAL_EARNING',
    frequency: 'OCCASIONAL',
    intent: 'SIDE_INCOME',
    ageTaxRegime: 'BELOW_AOW_2026',
    situationGroup: 'EMPLOYEE',
    allowances: ['HEALTHCARE'],
    hasPartner: false,
    customers: 'PUBLIC',
    estimatedTurnoverEuro: '2000',
    estimatedCostsEuro: '400',
    estimatedAnnualTransactions: '12',
    assetsEligibility: 'ELIGIBLE',
    scenarioPreset: 500,
    assumeEstimatedCostsTaxDeductible: true,
    acceptRowAssumption: true,
    baselineGrossEmploymentEuro: '28000',
    baselineBox1Euro: '28000',
    baselineAggregateEuro: '28000',
    baselineArbeidsinkomenEuro: '28000',
    baselineAssessmentEuro: '28000',
    baselineZvwUsedEuro: '28000',
  }),
);
assert.equal(employeeAllowances.proceedSemantics, 'READY_TO_PROCEED');
assert.match(employeeAllowances.headline, /^Je kunt beginnen\.$/);
assert.doesNotMatch(employeeAllowances.headline, /regel eerst/);
assert.doesNotMatch(nowText(employeeAllowances), /Je verkoop is gegroeid/);
assert.doesNotMatch(nowText(employeeAllowances), /btw beoordeelt de Belastingdienst|Btw-ondernemerschap/);
assert.ok(
  employeeAllowances.now.every((c) => actionSemanticsOf(c) !== 'PRE_START_REQUIRED'),
);
assert.ok(
  employeeAllowances.now.every((c) => actionSemanticsOf(c) !== 'CURRENT_ACTION'),
);

const starter = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    frequency: 'ONE_OFF',
    intent: 'HOBBY_COST_RECOVERY',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    customers: 'PRIVATE_CIRCLE',
  }),
);
assert.match(starter.headline, /Je kunt (beginnen|het eerst proberen)/);
assert.doesNotMatch(nowText(starter), /NVWA|DAC7|KOR|Belastingdienst/);
assert.equal(starter.proceedSemantics, 'READY_TO_PROCEED');
const starterQs = questionSteps(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'NONE',
    allowances: ['NONE'],
  }),
);
assert.ok(starterQs.length <= 8, `starter questions ${starterQs.length}`);

const bakerState = state({
    activityChoice: 'FOOD',
    activityKinds: ['FOOD'],
    growthStart: 'TRYING_OUT',
    foodUxFrequency: 'ONE_OFF',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
  });
const bakerQs = questionSteps(bakerState);
assert.equal(visibleSteps(bakerState).filter((id) => id !== 'result').length, 5);
assert.ok(bakerQs.length >= 3 && bakerQs.length <= 6);

const baker = routeFrom(
  state({
    activityChoice: 'FOOD',
    activityKinds: ['FOOD'],
    growthStart: 'TRYING_OUT',
    foodUxFrequency: 'ONE_OFF',
    frequency: 'ONE_OFF',
    intent: 'HOBBY_COST_RECOVERY',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    packagingMode: 'UNPACKAGED',
  }),
);
assert.match(baker.headline, /^Je kunt beginnen\.$/);
assert.ok(baker.now.length <= 3);
assert.doesNotMatch(nowText(baker), /NVWA-registratie te controleren|MijnNVWA/);

const cook = routeFrom(
  state({
    activityChoice: 'FOOD',
    activityKinds: ['FOOD'],
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
assert.ok(cook.now.length <= 3);
assert.match(nowText(cook), /NVWA|allergenen|hygiënisch|voedselveilig|eten/i);
assert.equal(cook.proceedSemantics, 'PROCEED_AFTER_ACTION');

const wwWait = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'WW',
    discussedWithUwv: false,
    wantsStartPeriod: true,
    uwvPermission: false,
    formerEmployerWorkPlanned: false,
    receivesUwvSupplement: false,
    customers: 'PUBLIC',
  }),
);
assert.equal(wwWait.proceedSemantics, 'CHECK_FIRST');
assert.doesNotMatch(wwWait.headline, /^Je kunt beginnen/);
assert.match(nowText(wwWait), /toestemming/i);
assert.doesNotMatch(nowText(wwWait), /1 week|70%/);
assert.equal(findPersonalRouteContradictions(wwWait).length, 0);

const wwUndecided = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'WW',
    wantsStartPeriod: 'UNKNOWN',
    discussedWithUwv: false,
  }),
);
assert.doesNotMatch(allText(wwUndecided), /29%/);
assert.doesNotMatch(allText(wwUndecided), /binnen 1 week/);

const wwStart = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'WW',
    wantsStartPeriod: true,
    uwvPermission: true,
    receivesUwvSupplement: false,
  }),
);
assert.match(allText(wwStart), /29%/);

const bijstand = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'TRYING_OUT',
    situationGroup: 'BIJSTAND',
    municipalityKnown: true,
    preparationPeriod: 'AVAILABLE',
  }),
);
assert.match(bijstand.headline, /gemeente/i);
assert.doesNotMatch(allText(bijstand), /48\.060|veilige bijverdien/);

for (const benefit of ['WIA', 'WAJONG', 'ZW', 'WAO', 'WAZ'] as const) {
  const r = routeFrom(
    state({
      activityChoice: 'MAKE',
      activityKinds: ['PRODUCT'],
      growthStart: 'TRYING_OUT',
      situationGroup: 'OTHER_UWV',
      uwvBenefit: benefit,
      discussedWithUwv: false,
    }),
  );
  assert.ok(r.now.length <= 3, benefit);
  assert.doesNotMatch(allText(r), /Wajong: 70%|70% van je inkomsten/);
  assert.notEqual(r.proceedSemantics, 'READY_TO_PROCEED');
}

const artwork = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'OCCASIONAL_EARNING',
    frequency: 'ONE_OFF',
    customers: 'PUBLIC',
    situationGroup: 'NONE',
    allowances: ['NONE'],
    estimatedTurnoverEuro: '5000',
    estimatedCostsEuro: '800',
    estimatedAnnualTransactions: '1',
  }),
);
const regularSameTurnover = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'REGULAR_EARNING',
    frequency: 'REGULAR',
    customers: 'PUBLIC',
    independentlyDeterminesWork: true,
    customerAcquisition: true,
    situationGroup: 'NONE',
    allowances: ['NONE'],
    estimatedTurnoverEuro: '5000',
    estimatedAnnualTransactions: '100',
  }),
);
assert.notEqual(nowText(artwork), nowText(regularSameTurnover));
assert.doesNotMatch(allText(artwork), /vanaf €20\.000|belastingvrij/);
assert.doesNotMatch(allText(regularSameTurnover), /vanaf €20\.000|belastingvrij/);

const zero = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'OCCASIONAL_EARNING',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
    estimatedTurnoverEuro: '0',
    estimatedCostsEuro: '0',
    estimatedAnnualTransactions: '0',
  }),
);
assert.notEqual(zero.financialImpact.netExtraCents, Number.NaN);
if (zero.financialImpact.extraResultCents != null) {
  assert.equal(Number.isFinite(zero.financialImpact.extraResultCents), true);
}

const unknownAow = routeFrom(
  state({
    activityChoice: 'MAKE',
    activityKinds: ['PRODUCT'],
    growthStart: 'OCCASIONAL_EARNING',
    situationGroup: 'NONE',
    ageTaxRegime: 'REACHES_AOW_IN_2026',
    allowances: ['NONE'],
  }),
);
assert.ok(
  isUnknown(unknownAow.financialImpact.netExtraCents) ||
    unknownAow.financialImpact.status !== 'EXACT',
);
assert.notEqual(unknownAow.financialImpact.netExtraCents, 0);

const prepacked = emptyFoodActivity('FOOD');
prepacked.packagingMode = 'PREPACKED';
const prepackedRules = foodLabellingRules(prepacked);
const prepackedBlob = prepackedRules.map((r) => `${r.shortTitle} ${r.shortText}`).join('\n');
assert.match(prepackedBlob, /Voor voorverpakt eten gelden extra etiketregels/);
assert.match(prepackedBlob, /niet volledig gecontroleerd|nog geen compleet etiket/);
assert.doesNotMatch(prepackedBlob, /je etiket is volledig gecontroleerd/i);

const animal = emptyFoodActivity('FOOD');
animal.handlesAnimalOriginProducts = 'YES';
animal.packagingMode = 'UNPACKAGED';
const animalBlob = foodLabellingRules(animal)
  .map((r) => `${r.shortTitle} ${r.shortText}`)
  .join('\n');
assert.doesNotMatch(animalBlob, /Je hebt een erkenning nodig/);
assert.match(animalBlob, /niet automatisch/i);

console.log('verdiencheck phase 5C tests: PASS');
console.log(
  JSON.stringify(
    {
      EXISTING_ENTREPRENEUR_FALSE_KVK_NOW: 'NO',
      EMPLOYEE_FALSE_PRESTART_ACTION: 'NO',
      STARTER_HEADLINE: starter.headline,
      BAKER_QUESTION_COUNT: bakerQs.length,
      FLAGS_OFF: true,
    },
    null,
    2,
  ),
);
