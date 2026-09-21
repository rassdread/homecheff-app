/**
 * VerdienCheck Fase 4C — NL-2026 food / NVWA + intent-first / fear-reduction.
 *
 *   npx tsx scripts/test-verdiencheck-nl-2026-food-guidance.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import type { ActivityContext } from '../lib/verdiencheck/domain/activity';
import {
  assessAnimalOriginRecognition,
  assessNvwaRegistration,
  emptyFoodActivity,
  isFoodRoute,
  mapSaleFrequencyToFoodSellingFrequency,
  mapUxFoodFrequency,
  prepackedLabelContext,
  type FoodActivityContext,
} from '../lib/verdiencheck/domain/food-activity';
import { declaredIntentIsNotLegalExemption, deriveDeclaredGrowthIntent } from '../lib/verdiencheck/domain/growth-intent';
import {
  ASSESSMENT_ORDER,
  HOMECHEFF_GUIDANCE_PRINCIPLE,
  LEGAL_GUIDANCE_PRINCIPLE,
} from '../lib/verdiencheck/guidance/principles';
import { evaluateFoodGuidance } from '../lib/verdiencheck/guidance/nl2026/food';
import { nvwaRegistrationRules } from '../lib/verdiencheck/guidance/nl2026/food-registration';
import { foodSafetyRules } from '../lib/verdiencheck/guidance/nl2026/food-safety';
import { foodLabellingRules } from '../lib/verdiencheck/guidance/nl2026/food-labelling';
import { evaluateGuidance } from '../lib/verdiencheck/guidance/engine';
import { defaultBlocking } from '../lib/verdiencheck/guidance/types';
import {
  EU_FOOD_ALLERGEN_IDS,
  EU14_COUNT,
  GLUTEN_CEREAL_SPECIES,
  NUT_SPECIES,
  allergenInfoMustBeAvailableBeforePurchase,
  glutenRequiresCerealSpecies,
  listingAllergenInfoIsNotPhysicalLabel,
  nutsRequireNutSpecies,
} from '../lib/verdiencheck/adapters/legal2-food';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import { NVWA_TEMPERATURE_EXAMPLES } from '../lib/verdiencheck/rulesets/nl/2026/food-guidance-parameters';
import { visibleSteps, EMPTY_WIZARD_STATE } from '../lib/verdiencheck/wizard/schema';

const ROOT = process.cwd();

function oneOffCake(): ActivityContext {
  return {
    kinds: ['FOOD'],
    frequency: 'ONE_OFF',
    customers: 'PUBLIC',
    commercialIntent: 'HOBBY_COST_RECOVERY',
    independence: true,
    continuity: false,
    timeOrMoneyInvested: false,
    listingCount: 1,
    transactionCount: 1,
    typicalTicketCents: 2_500,
    unitCount: 1,
  };
}

function regularFood(): ActivityContext {
  return {
    ...oneOffCake(),
    frequency: 'REGULAR',
    commercialIntent: 'BUILD_BUSINESS',
    continuity: true,
    transactionCount: 12,
  };
}

function textOf(rules: { shortTitle: string; shortText: string; expandedExplanation: string }[]): string {
  return rules.map((r) => `${r.shortTitle}\n${r.shortText}\n${r.expandedExplanation}`).join('\n');
}

const results: Record<string, 'PASS' | 'FAIL'> = {
  FOOD_HOME_SELLING: 'FAIL',
  NVWA_REGISTRATION_FREQUENCY: 'FAIL',
  NO_FOOD_REVENUE_THRESHOLD: 'FAIL',
  FOOD_SAFETY_ONE_OFF: 'FAIL',
  HACCP_PLAN_NOT_CERTIFICATE: 'FAIL',
  ALLERGEN_14: 'FAIL',
  ALLERGEN_BEFORE_PURCHASE: 'FAIL',
  LEGAL2_PRESERVED: 'FAIL',
  PACKAGING_MODE_ISOLATION: 'FAIL',
  PREPACKED_LABEL_GUIDANCE: 'FAIL',
  ANIMAL_ORIGIN_RECOGNITION_REVIEW: 'FAIL',
  NVWA_KVK_ISOLATION: 'FAIL',
  GUIDANCE_DEFAULT_NON_BLOCKING: 'FAIL',
  INTENT_FIRST_COPY: 'FAIL',
  NVWA_BOUNDARY_MATRIX: 'FAIL',
};

{
  assert.equal(HOMECHEFF_GUIDANCE_PRINCIPLE, 'BEGINNEN MOGELIJK MAKEN, GROEI BEGELEIDEN');
  assert.equal(LEGAL_GUIDANCE_PRINCIPLE, 'BEGELEIDEN, NIET BEWAKEN');
  assert.equal(ASSESSMENT_ORDER, 'INTENT → ACTIVITY → CONTEXT → APPLICABLE RULES → NEXT ACTION');
  const home = emptyFoodActivity('FOOD');
  home.preparationLocation = 'HOME';
  home.sellingFrequency = 'ONCE_PER_YEAR';
  const blob = textOf(foodSafetyRules(home));
  assert.match(blob, /vanuit huis/);
  assert.equal(isFoodRoute('FOOD'), true);
  assert.equal(isFoodRoute('BEVERAGE'), true);
  assert.equal(isFoodRoute('NOT_FOOD'), false);
  results.FOOD_HOME_SELLING = 'PASS';
}

{
  const once = emptyFoodActivity('FOOD');
  once.sellingFrequency = 'ONCE_PER_YEAR';
  assert.equal(assessNvwaRegistration(once), 'NOT_REQUIRED_BASED_ON_ONE_OFF_FREQUENCY');
  const many = emptyFoodActivity('FOOD');
  many.sellingFrequency = 'MULTIPLE_TIMES_PER_YEAR';
  assert.equal(assessNvwaRegistration(many), 'REGISTRATION_REQUIRED');
  const unknown = emptyFoodActivity('FOOD');
  unknown.sellingFrequency = 'UNKNOWN';
  assert.equal(assessNvwaRegistration(unknown), 'UNKNOWN');
  assert.equal(mapUxFoodFrequency('ONE_OFF'), 'ONCE_PER_YEAR');
  assert.equal(mapUxFoodFrequency('OCCASIONAL_RECURRING'), 'A_FEW_TIMES_PER_YEAR');
  assert.equal(mapUxFoodFrequency('REGULAR'), 'MULTIPLE_TIMES_PER_YEAR');
  assert.equal(mapSaleFrequencyToFoodSellingFrequency('OCCASIONAL'), 'A_FEW_TIMES_PER_YEAR');
  assert.equal(mapSaleFrequencyToFoodSellingFrequency('REGULAR'), 'MULTIPLE_TIMES_PER_YEAR');
  const few = emptyFoodActivity('FOOD');
  few.sellingFrequency = 'A_FEW_TIMES_PER_YEAR';
  assert.equal(assessNvwaRegistration(few), 'NOT_REQUIRED_OCCASIONAL_NON_BUSINESS');
  assert.equal(
    assessNvwaRegistration(few, { likelyEntrepreneur: true }),
    'REVIEW_REQUIRED',
  );
  results.NVWA_REGISTRATION_FREQUENCY = 'PASS';
}

{
  const cheap = emptyFoodActivity('FOOD');
  cheap.sellingFrequency = 'ONCE_PER_YEAR';
  const expensive = emptyFoodActivity('FOOD');
  expensive.sellingFrequency = 'ONCE_PER_YEAR';
  assert.equal(assessNvwaRegistration(cheap), assessNvwaRegistration(expensive));
  const blob = textOf(
    nvwaRegistrationRules({
      food: cheap,
      kvkAssessment: 'INSUFFICIENT_INFORMATION',
    }),
  );
  assert.doesNotMatch(blob, /1–5/);
  assert.doesNotMatch(blob, /omzetgrens/);
  results.NO_FOOD_REVENUE_THRESHOLD = 'PASS';
}

{
  const once = emptyFoodActivity('FOOD');
  once.sellingFrequency = 'ONCE_PER_YEAR';
  const blob = textOf(foodSafetyRules(once));
  assert.match(blob, /incidentele verkoop/);
  assert.doesNotMatch(blob, /voedselregels gelden niet/);
  results.FOOD_SAFETY_ONE_OFF = 'PASS';
}

{
  const many = emptyFoodActivity('FOOD');
  many.sellingFrequency = 'MULTIPLE_TIMES_PER_YEAR';
  many.foodSafetyPlanStatus = 'NOT_ARRANGED';
  const blob = textOf(foodSafetyRules(many));
  assert.match(blob, /voedselveiligheidsplan/);
  assert.match(blob, /hygiënecode/);
  assert.doesNotMatch(blob, /HACCP-certificaat verplicht/);
  assert.match(blob, /geen HACCP-certificaat/);
  results.HACCP_PLAN_NOT_CERTIFICATE = 'PASS';
}

{
  assert.equal(EU14_COUNT, 14);
  assert.equal(EU_FOOD_ALLERGEN_IDS.length, 14);
  assert.ok(glutenRequiresCerealSpecies(['GLUTEN']));
  assert.ok(GLUTEN_CEREAL_SPECIES.includes('WHEAT'));
  assert.ok(nutsRequireNutSpecies(['NUTS']));
  assert.ok(NUT_SPECIES.includes('HAZELNUT'));
  results.ALLERGEN_14 = 'PASS';
}

{
  assert.equal(allergenInfoMustBeAvailableBeforePurchase(), true);
  const unpack = emptyFoodActivity('FOOD');
  unpack.packagingMode = 'UNPACKAGED';
  const blob = textOf(foodLabellingRules(unpack));
  assert.match(blob, /vóór aankoop/);
  assert.doesNotMatch(blob, /na aankoop/);
  results.ALLERGEN_BEFORE_PURCHASE = 'PASS';
}

{
  const out = execSync(
    'git diff -- lib/legal/eu-food-allergens.ts lib/legal/food-allergen-applicability.ts lib/legal/food-allergen-context.ts lib/legal/assert-food-allergens-for-transaction.ts',
    { cwd: ROOT, encoding: 'utf8' },
  );
  assert.equal(out, '');
  results.LEGAL2_PRESERVED = 'PASS';
}

{
  const modes = ['UNPACKAGED', 'PREPACKED', 'PREPACKED_FOR_DIRECT_SALE', 'UNKNOWN'] as const;
  const ids = new Set<string>();
  for (const mode of modes) {
    const food = emptyFoodActivity('FOOD');
    food.packagingMode = mode;
    for (const r of foodLabellingRules(food)) ids.add(r.id);
  }
  assert.ok(ids.has('nl2026.food.label.unpackaged'));
  assert.ok(ids.has('nl2026.food.label.prepacked'));
  assert.ok(ids.has('nl2026.food.label.ppds'));
  results.PACKAGING_MODE_ISOLATION = 'PASS';
}

{
  const label = prepackedLabelContext('PREPACKED');
  assert.equal(label.listingAllergenInfoIsNotPhysicalLabel, true);
  assert.equal(listingAllergenInfoIsNotPhysicalLabel(), true);
  assert.equal(label.nutritionDeclarationRequirement, 'REVIEW_REQUIRED');
  assert.equal(label.palStatus, 'SUPPORTED_LATER');
  assert.equal(label.fields.qid, 'CONDITIONAL');
  const food = emptyFoodActivity('FOOD');
  food.packagingMode = 'PREPACKED';
  assert.match(textOf(foodLabellingRules(food)), /etiketregels/);
  results.PREPACKED_LABEL_GUIDANCE = 'PASS';
}

{
  const meat = emptyFoodActivity('FOOD');
  meat.handlesAnimalOriginProducts = 'YES';
  meat.sellsDirectToConsumers = 'YES';
  meat.sellsBusinessToBusiness = 'NO';
  assert.equal(assessAnimalOriginRecognition(meat), 'REGISTRATION_MAY_BE_SUFFICIENT');
  meat.sellsBusinessToBusiness = 'YES';
  assert.equal(assessAnimalOriginRecognition(meat), 'RECOGNITION_REVIEW_REQUIRED');
  assert.notEqual(assessAnimalOriginRecognition(meat), 'NOT_APPLICABLE');
  results.ANIMAL_ORIGIN_RECOGNITION_REVIEW = 'PASS';
}

{
  const many = emptyFoodActivity('FOOD');
  many.sellingFrequency = 'MULTIPLE_TIMES_PER_YEAR';
  const withKvk = nvwaRegistrationRules({
    food: many,
    kvkAssessment: 'INSUFFICIENT_INFORMATION',
  });
  assert.ok(withKvk.some((r) => r.id === 'nl2026.food.nvwa.needs_kvk_operational'));
  const kvkClear = nvwaRegistrationRules({
    food: many,
    kvkAssessment: 'CLEAR_REGISTRATION_INDICATION',
  });
  assert.ok(kvkClear.some((r) => r.id === 'nl2026.food.nvwa.needs_kvk_operational' && r.severity === 'ACTION'));
  assert.equal(
    kvkClear.find((r) => r.id === 'nl2026.food.nvwa.registration_required')?.timing,
    'SOON',
  );
  results.NVWA_KVK_ISOLATION = 'PASS';
}

{
  const hits = evaluateGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: 'EMPLOYEE',
    allowances: ['NONE'],
    activity: oneOffCake(),
    food: {
      ...emptyFoodActivity('FOOD'),
      preparationLocation: 'HOME',
      sellingFrequency: 'ONCE_PER_YEAR',
    },
  });
  const live = hits.filter((h) => !h.rule.developmentFixture);
  assert.ok(live.length <= 3);
  assert.ok(live.every((h) => h.rule.blocking === false));
  assert.equal(defaultBlocking({}), false);
  assert.equal(NVWA_TEMPERATURE_EXAMPLES.perishableStorageBelowC.universalForAllFood, false);
  results.GUIDANCE_DEFAULT_NON_BLOCKING = 'PASS';
}

{
  assert.equal(declaredIntentIsNotLegalExemption('TRYING_OUT'), true);
  assert.equal(
    deriveDeclaredGrowthIntent({
      commercialIntent: 'HOBBY_COST_RECOVERY',
      frequency: 'ONE_OFF',
    }),
    'TRYING_OUT',
  );
  const foodOnce: FoodActivityContext = {
    ...emptyFoodActivity('FOOD'),
    preparationLocation: 'HOME',
    sellingFrequency: 'ONCE_PER_YEAR',
  };
  const all = evaluateFoodGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: 'EMPLOYEE',
    allowances: ['NONE'],
    activity: oneOffCake(),
    food: foodOnce,
  });
  const nowBlob = textOf(all.filter((h) => h.timing === 'NOW').map((h) => h.rule));
  assert.match(nowBlob, /Je kunt beginnen/);
  assert.match(nowBlob, /Als er later iets verandert/);
  assert.doesNotMatch(nowBlob, /Je moet ondernemer worden/);
  assert.doesNotMatch(nowBlob, /Je moet je bedrijf registreren/);
  assert.doesNotMatch(nowBlob, /Pas op voor de Belastingdienst/);
  assert.doesNotMatch(nowBlob, /HomeCheff bepaalt dat je ondernemer bent/);
  assert.doesNotMatch(nowBlob, /Vanaf €/);
  const later = all.find((h) => h.rule.id === 'nl2026.food.intent.later_growth');
  assert.ok(later);
  assert.match(later!.rule.shortText, /KVK kan relevant worden als je activiteit structureler wordt/);
  assert.match(later!.rule.shortText, /vaker of bedrijfsmatig/);

  const manyHits = evaluateFoodGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: 'EMPLOYEE',
    allowances: ['NONE'],
    activity: regularFood(),
    food: { ...emptyFoodActivity('FOOD'), sellingFrequency: 'MULTIPLE_TIMES_PER_YEAR' },
  });
  const manyBlob = textOf(manyHits.map((h) => h.rule));
  assert.match(manyBlob, /KVK-inschrijving en daarna|NVWA-registratie kan nodig/);
  assert.doesNotMatch(
    manyHits
      .filter((h) => h.timing === 'NOW')
      .map((h) => h.rule.shortTitle)
      .join('\n'),
    /Meld je nu bij de voedselautoriteit|Registreer je levensmiddelenbedrijf/,
  );
  assert.ok(
    visibleSteps({
      ...EMPTY_WIZARD_STATE,
      taxResidence: 'NL',
      activityKinds: ['FOOD'],
    }).includes('foodSellingFrequency'),
  );
  results.INTENT_FIRST_COPY = 'PASS';
}

{
  function ruleIds(rules: { id: string }[]): string[] {
    return rules.map((r) => r.id);
  }
  function fewFood(): FoodActivityContext {
    return { ...emptyFoodActivity('FOOD'), sellingFrequency: 'A_FEW_TIMES_PER_YEAR' };
  }
  function multipleFood(): FoodActivityContext {
    return { ...emptyFoodActivity('FOOD'), sellingFrequency: 'MULTIPLE_TIMES_PER_YEAR' };
  }

  assert.equal(
    assessNvwaRegistration({ ...emptyFoodActivity('FOOD'), sellingFrequency: 'ONCE_PER_YEAR' }),
    'NOT_REQUIRED_BASED_ON_ONE_OFF_FREQUENCY',
  );
  assert.equal(assessNvwaRegistration(fewFood()), 'NOT_REQUIRED_OCCASIONAL_NON_BUSINESS');
  assert.equal(assessNvwaRegistration(multipleFood()), 'REGISTRATION_REQUIRED');

  const fewRules = nvwaRegistrationRules({
    food: fewFood(),
    kvkAssessment: 'INSUFFICIENT_INFORMATION',
  });
  assert.ok(fewRules.some((r) => r.id === 'nl2026.food.nvwa.few_times_non_business' && r.timing === 'LATER'));
  assert.equal(fewRules.some((r) => r.id === 'nl2026.food.nvwa.registration_required'), false);
  assert.equal(fewRules.some((r) => r.id === 'nl2026.food.nvwa.needs_kvk_operational'), false);
  assert.doesNotMatch(textOf(fewRules), /<=\s*\d|maximaal \d+ keer|omzetgrens/);

  const fewEntrepreneur = nvwaRegistrationRules({
    food: fewFood(),
    kvkAssessment: 'CLEAR_REGISTRATION_INDICATION',
    alreadyKvkRegistered: 'YES',
    personSituation: 'EXISTING_ENTREPRENEUR',
  });
  assert.ok(fewEntrepreneur.some((r) => r.id === 'nl2026.food.nvwa.review' && r.timing === 'SOON'));
  assert.equal(fewEntrepreneur.some((r) => r.id === 'nl2026.food.nvwa.registration_required'), false);

  const tryingOccasional = evaluateFoodGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: 'EMPLOYEE',
    allowances: ['NONE'],
    activity: { ...oneOffCake(), frequency: 'OCCASIONAL', commercialIntent: 'HOBBY_COST_RECOVERY' },
    food: fewFood(),
  });
  assert.equal(
    tryingOccasional.some((h) => h.rule.id === 'nl2026.food.nvwa.registration_required'),
    false,
  );
  assert.ok(tryingOccasional.some((h) => h.rule.id === 'nl2026.food.intent.you_can_start'));
  assert.ok(tryingOccasional.some((h) => h.rule.id.includes('safety.hygiene_always')));

  const tryingRecurring = evaluateFoodGuidance({
    jurisdiction: 'NL',
    year: 2026,
    personSituation: 'EMPLOYEE',
    allowances: ['NONE'],
    activity: { ...regularFood(), commercialIntent: 'HOBBY_COST_RECOVERY' },
    food: multipleFood(),
  });
  assert.equal(
    tryingRecurring.find((h) => h.rule.id === 'nl2026.food.nvwa.registration_required')?.timing,
    'SOON',
  );

  const publicOccasional = nvwaRegistrationRules({
    food: { ...fewFood(), sellsDirectToConsumers: 'YES' },
    kvkAssessment: 'INSUFFICIENT_INFORMATION',
  });
  assert.ok(ruleIds(publicOccasional).includes('nl2026.food.nvwa.few_times_non_business'));

  const noKvkRecurring = nvwaRegistrationRules({
    food: multipleFood(),
    kvkAssessment: 'INSUFFICIENT_INFORMATION',
    alreadyKvkRegistered: 'NO',
  });
  assert.ok(ruleIds(noKvkRecurring).includes('nl2026.food.nvwa.registration_required'));
  assert.ok(ruleIds(noKvkRecurring).includes('nl2026.food.nvwa.needs_kvk_operational'));
  assert.equal(
    noKvkRecurring.find((r) => r.id === 'nl2026.food.nvwa.registration_required')?.timing,
    'SOON',
  );
  assert.notEqual(
    noKvkRecurring.find((r) => r.id === 'nl2026.food.nvwa.registration_required')?.severity,
    'ACTION',
  );
  assert.equal(
    noKvkRecurring.find((r) => r.id === 'nl2026.food.nvwa.needs_kvk_operational')?.timing,
    'NOW',
  );

  const existingKvkFood = nvwaRegistrationRules({
    food: multipleFood(),
    kvkAssessment: 'CLEAR_REGISTRATION_INDICATION',
    alreadyKvkRegistered: 'YES',
    personSituation: 'EXISTING_ENTREPRENEUR',
  });
  assert.ok(ruleIds(existingKvkFood).includes('nl2026.food.nvwa.registration_required'));
  assert.equal(existingKvkFood.find((r) => r.id === 'nl2026.food.nvwa.registration_required')?.timing, 'NOW');
  assert.equal(existingKvkFood.find((r) => r.id === 'nl2026.food.nvwa.registration_required')?.severity, 'ACTION');
  assert.equal(ruleIds(existingKvkFood).includes('nl2026.food.nvwa.needs_kvk_operational'), false);

  const planFew = foodSafetyRules(fewFood());
  assert.ok(planFew.some((r) => r.id === 'nl2026.food.safety.plan_review' && r.timing === 'SOON'));
  assert.equal(planFew.some((r) => r.id === 'nl2026.food.safety.plan_required'), false);
  assert.ok(planFew.some((r) => r.id === 'nl2026.food.safety.hygiene_always'));

  const planRegular = foodSafetyRules({
    ...multipleFood(),
    foodSafetyPlanStatus: 'NOT_ARRANGED',
  });
  assert.ok(planRegular.some((r) => r.id === 'nl2026.food.safety.plan_required' && r.timing === 'NOW'));

  const prepacked = {
    ...fewFood(),
    packagingMode: 'PREPACKED' as const,
  };
  assert.equal(assessNvwaRegistration(prepacked), 'NOT_REQUIRED_OCCASIONAL_NON_BUSINESS');
  assert.match(textOf(foodLabellingRules(prepacked)), /etiketregels/);

  const unpack = { ...fewFood(), packagingMode: 'UNPACKAGED' as const };
  assert.match(textOf(foodLabellingRules(unpack)), /allergen/);

  const animal = {
    ...fewFood(),
    handlesAnimalOriginProducts: 'YES' as const,
    sellsDirectToConsumers: 'YES' as const,
    sellsBusinessToBusiness: 'NO' as const,
  };
  assert.equal(assessAnimalOriginRecognition(animal), 'REGISTRATION_MAY_BE_SUFFICIENT');
  assert.equal(assessNvwaRegistration(animal), 'NOT_REQUIRED_OCCASIONAL_NON_BUSINESS');

  results.NVWA_BOUNDARY_MATRIX = 'PASS';
}

assert.equal(NL_2026_MODULE_STATUS.foodHomeSellingGuidance, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.nvwaRegistrationGuidance, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.foodSafetyGuidance, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.allergenGuidance, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.prepackedLabelGuidance, 'PARTIAL');
assert.equal(NL_2026_MODULE_STATUS.animalOriginRecognitionGuidance, 'CERTIFIED_FOR_REVIEW_ONLY');
assert.equal(NL_2026_PACK.version, '2026.6-official-payroll-white-monthly');
assert.equal(NL_2026_PACK.status, 'DRAFT');

const faq = fs.readFileSync(
  path.join(ROOT, 'docs/verdiencheck/FAQ-COMPLIANCE-REPLACEMENTS-NL.md'),
  'utf8',
);
assert.match(faq, /1–5 porties/);
assert.match(faq, /CERTIFIED_REPLACEMENT_READY/);

const failed = Object.entries(results).filter(([, v]) => v !== 'PASS');
if (failed.length > 0) {
  console.error(results);
  throw new Error(`FAIL: ${failed.map(([k]) => k).join(', ')}`);
}
console.log('verdiencheck NL-2026 food guidance tests: PASS');
console.log(results);
