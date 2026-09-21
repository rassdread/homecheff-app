/**
 * VerdienCheck legal selling / cost-advantage helper.
 *
 *   npx tsx scripts/test-verdiencheck-cost-advantage.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorInput, CalculatorReadyResult } from '../lib/verdiencheck/calculator/types';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import {
  helperFeedsCertifiedEngine,
  mapRevenueAndAllowableCosts,
} from '../lib/verdiencheck/domain/revenue-cost-helper';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { PERSONAL_ROUTE_COPY } from '../lib/verdiencheck/personal-route/copy';
import {
  SRC_ROW,
  SRC_ZAKELIJKE_KOSTEN,
  SRC_AFSCHRIJVING,
  SRC_BEDRIJFSMIDDELEN,
  SRC_ZAKELIJK_OF_PRIVE,
  SRC_AFTREKBARE_KOSTEN_OVERZICHT,
  SRC_BEPERKT_AFTREKBARE_2026,
} from '../lib/verdiencheck/rulesets/nl/2026/sources';
import { NL_2026_PARAMETERS } from '../lib/verdiencheck/rulesets/nl/2026/parameters';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyDirectResultMode,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applyRevenueCostHelperFields,
  applySituationGroup,
  clearFinancialDepth,
  questionsBeforeFirstResult,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';

const ROOT = process.cwd();
const impactSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckFinancialImpact.tsx'),
  'utf8',
);
const wizardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);
const helperSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/domain/revenue-cost-helper.ts'),
  'utf8',
);
const engineSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/calculator/engine.ts'),
  'utf8',
);
const rowSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/nl2026/row.ts'), 'utf8');
const ztSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/nl2026/healthcare-allowance.ts'), 'utf8');
const rentSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/nl2026/housing-allowance.ts'), 'utf8');
const kgbSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/nl2026/child-budget.ts'), 'utf8');
const kotSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/nl2026/childcare-allowance.ts'), 'utf8');
const mapSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/wizard/to-calculator-input.ts'),
  'utf8',
);
const nl = getVerdienCheckCopy('nl');
const en = getVerdienCheckCopy('en');

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

function money(partial: Partial<WizardState>): WizardState {
  return applyMoneyDepthChoice(state(partial), 'YES');
}

function employeeBaseline(partial: Partial<WizardState> = {}): WizardState {
  return money({
    activityChoice: 'MAKE',
    growthStart: 'OCCASIONAL_EARNING',
    situationGroup: 'EMPLOYEE',
    ageTaxRegime: 'BELOW_AOW_2026',
    allowances: ['NONE'],
    currentIncomeEuro: '3200',
    amountEntryPeriod: 'MONTH',
    hasOtherIncome: false,
    scenarioPreset: 5000,
    ...partial,
  });
}

function ready(input: CalculatorInput): CalculatorReadyResult {
  const result = runCalculator(input);
  assert.equal(result.status, 'READY');
  if (result.status !== 'READY') throw new Error('not ready');
  return result;
}

function comparableSnapshot(result: CalculatorReadyResult) {
  return {
    status: result.status,
    commercial: result.commercialAdditionalResultCents,
    taxable: result.taxableAdditionalIncomeCents,
    net: result.netExtraCents,
    tax: result.deltas.incomeTax,
    zvw: result.deltas.zvw,
    healthcare: result.deltas.healthcareAllowance,
    rent: result.deltas.rentAllowance,
    kgb: result.deltas.childBudget,
    kot: result.deltas.childcareAllowance,
  };
}

for (const src of [
  SRC_ROW,
  SRC_ZAKELIJKE_KOSTEN,
  SRC_AFSCHRIJVING,
  SRC_BEDRIJFSMIDDELEN,
  SRC_ZAKELIJK_OF_PRIVE,
  SRC_AFTREKBARE_KOSTEN_OVERZICHT,
  SRC_BEPERKT_AFTREKBARE_2026,
]) {
  assert.match(src.officialSourceUrl, /^https:\/\/www\.belastingdienst\.nl\//);
  assert.match(src.officialSource, /Belastingdienst/);
}

assert.equal(NL_2026_PARAMETERS['row.costs.userEstimatedAllowableOnly']?.value, 'NO_AUTOMATIC_ALL_COSTS_DEDUCTIBLE');
assert.equal(NL_2026_PARAMETERS['row.costs.depreciationBoundary']?.value, 'NO_FULL_INVESTMENT_DEDUCTION_IN_HELPER');
assert.equal(NL_2026_PARAMETERS['row.costs.limitedDeductible2026']?.value, 'NO_AUTOMATIC_LIMITED_COST_FORMULA_IN_HELPER');

const mappedA = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '4000',
  costsUnknown: false,
});
assert.equal(mappedA.status, 'OK');
assert.equal(mappedA.resultCents, 600_000);
assert.equal(helperFeedsCertifiedEngine(mappedA), true);

const mappedB = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '0',
  costsUnknown: false,
});
assert.equal(mappedB.status, 'OK');
assert.equal(mappedB.resultCents, 1_000_000);

const mappedC = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '',
  costsUnknown: true,
});
assert.equal(mappedC.status, 'UNKNOWN_COSTS');
assert.equal(isUnknown(mappedC.resultCents), true);
assert.equal(helperFeedsCertifiedEngine(mappedC), false);

const mappedIncomplete = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '',
  costsUnknown: false,
});
assert.equal(mappedIncomplete.status, 'INCOMPLETE');
assert.equal(mappedIncomplete.resultCents, null);

const mappedNegative = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '14000',
  costsUnknown: false,
});
assert.equal(mappedNegative.status, 'NEGATIVE');
assert.equal(helperFeedsCertifiedEngine(mappedNegative), false);

const helperA = applyRevenueCostHelperFields(employeeBaseline(), {
  helperRevenueEuro: '10000',
  helperCostsEuro: '4000',
  helperCostsUnknown: false,
});
assert.equal(helperA.scenarioInputMode, 'REVENUE_COST');
assert.equal(helperA.scenarioPreset, 'custom');
assert.equal(helperA.customScenarioEuro, '6000');
const inputHelperA = wizardStateToCalculatorInput(helperA);
const inputDirectA = wizardStateToCalculatorInput(
  employeeBaseline({
    scenarioInputMode: 'RESULT',
    scenarioPreset: 'custom',
    customScenarioEuro: '6000',
  }),
);
assert.ok(inputHelperA && inputDirectA);
assert.equal(inputHelperA.scenarioAdditionalResultCents, 600_000);
assert.equal(inputDirectA.scenarioAdditionalResultCents, 600_000);
assert.equal(inputHelperA.estimatedCosts.amountCents, 0);
const readyHelperA = ready(inputHelperA);
const readyDirectA = ready(inputDirectA);
assert.deepEqual(comparableSnapshot(readyHelperA), comparableSnapshot(readyDirectA));

const helperB = applyRevenueCostHelperFields(employeeBaseline(), {
  helperRevenueEuro: '10000',
  helperCostsEuro: '0',
  helperCostsUnknown: false,
});
const inputHelperB = wizardStateToCalculatorInput(helperB);
assert.ok(inputHelperB);
assert.equal(inputHelperB.scenarioAdditionalResultCents, 1_000_000);

const helperC = applyRevenueCostHelperFields(employeeBaseline(), {
  helperRevenueEuro: '10000',
  helperCostsEuro: '',
  helperCostsUnknown: true,
});
const inputHelperC = wizardStateToCalculatorInput(helperC);
assert.ok(inputHelperC);
assert.equal(inputHelperC.scenarioAdditionalResultCents, 0);
assert.notEqual(inputHelperC.scenarioAdditionalResultCents, 1_000_000);

const helperDouble = applyRevenueCostHelperFields(
  employeeBaseline({ estimatedTurnoverEuro: '10000', estimatedCostsEuro: '4000', amountEntryPeriod: 'YEAR' }),
  {
    helperRevenueEuro: '10000',
    helperCostsEuro: '4000',
    helperCostsUnknown: false,
  },
);
const inputDouble = wizardStateToCalculatorInput(helperDouble);
assert.ok(inputDouble);
assert.equal(inputDouble.scenarioAdditionalResultCents, 600_000);
assert.equal(inputDouble.estimatedCosts.amountCents, 400_000);
assert.equal(inputDouble.commercialResultCents, 600_000);
assert.match(engineSrc, /const commercialAdditional = input\.scenarioAdditionalResultCents/);
assert.doesNotMatch(engineSrc, /commercialAdditional\s*-\s*input\.estimatedCosts/);
assert.doesNotMatch(mapSrc, /scenarioCents[\s\S]{0,80}estimatedCosts/);

const helperNeg = applyRevenueCostHelperFields(employeeBaseline(), {
  helperRevenueEuro: '10000',
  helperCostsEuro: '14000',
  helperCostsUnknown: false,
});
assert.equal(helperNeg.customScenarioEuro, '');
const inputNeg = wizardStateToCalculatorInput(helperNeg);
assert.ok(inputNeg);
assert.equal(inputNeg.scenarioAdditionalResultCents, 0);
const negCalc = runCalculator(inputNeg);
assert.equal(negCalc.status, 'READY');
if (negCalc.status === 'READY') {
  assert.equal(negCalc.netExtraCents, 0);
}

const healthcareHelper = applyRevenueCostHelperFields(
  employeeBaseline({
    currentIncomeEuro: '2500',
    allowances: ['HEALTHCARE'],
    assetsEligibility: 'ELIGIBLE',
    hasPartner: false,
    partnerHealthcareInsuranceStatus: 'INSURED',
  }),
  { helperRevenueEuro: '10000', helperCostsEuro: '4000', helperCostsUnknown: false },
);
const healthcareDirect = employeeBaseline({
  currentIncomeEuro: '2500',
  allowances: ['HEALTHCARE'],
  assetsEligibility: 'ELIGIBLE',
  hasPartner: false,
  partnerHealthcareInsuranceStatus: 'INSURED',
  scenarioInputMode: 'RESULT',
  scenarioPreset: 'custom',
  customScenarioEuro: '6000',
});
const hcH = wizardStateToCalculatorInput(healthcareHelper);
const hcD = wizardStateToCalculatorInput(healthcareDirect);
assert.ok(hcH && hcD);
assert.deepEqual(comparableSnapshot(ready(hcH)), comparableSnapshot(ready(hcD)));
assert.equal(typeof ready(hcH).deltas.healthcareAllowance, 'number');
assert.notEqual(ready(hcH).deltas.healthcareAllowance, 0);

const multiHelper = applyRevenueCostHelperFields(
  employeeBaseline({
    currentIncomeEuro: '2500',
    allowances: ['HEALTHCARE', 'RENT'],
    assetsEligibility: 'ELIGIBLE',
    housingAssetsEligibility: 'ELIGIBLE',
    housingHouseholdType: 'SINGLE',
    oldestHouseholdResidentAge: '40',
    bareRentEuro: '700',
    hasPartner: false,
    partnerHealthcareInsuranceStatus: 'INSURED',
  }),
  { helperRevenueEuro: '10000', helperCostsEuro: '4000', helperCostsUnknown: false },
);
const multiDirect = employeeBaseline({
  currentIncomeEuro: '2500',
  allowances: ['HEALTHCARE', 'RENT'],
  assetsEligibility: 'ELIGIBLE',
  housingAssetsEligibility: 'ELIGIBLE',
  housingHouseholdType: 'SINGLE',
  oldestHouseholdResidentAge: '40',
  bareRentEuro: '700',
  hasPartner: false,
  partnerHealthcareInsuranceStatus: 'INSURED',
  scenarioInputMode: 'RESULT',
  scenarioPreset: 'custom',
  customScenarioEuro: '6000',
});
const mH = wizardStateToCalculatorInput(multiHelper);
const mD = wizardStateToCalculatorInput(multiDirect);
assert.ok(mH && mD);
assert.deepEqual(comparableSnapshot(ready(mH)), comparableSnapshot(ready(mD)));

const restarted = EMPTY_WIZARD_STATE;
assert.equal(restarted.helperRevenueEuro, '');
assert.equal(restarted.helperCostsEuro, '');
assert.equal(restarted.helperCostsUnknown, false);
assert.equal(restarted.scenarioInputMode, 'RESULT');
const cleared = clearFinancialDepth(helperA);
assert.equal(cleared.helperRevenueEuro, '');
assert.equal(cleared.helperCostsEuro, '');
assert.equal(cleared.helperCostsUnknown, false);
assert.equal(cleared.scenarioInputMode, 'RESULT');
assert.equal(cleared.customScenarioEuro, '');

const backToResult = applyDirectResultMode(helperA);
assert.equal(backToResult.scenarioInputMode, 'RESULT');
assert.equal(backToResult.customScenarioEuro, '6000');

assert.match(nl.costsCountTitle, /kosten tellen/i);
assert.match(nl.costsCountBody, /niet automatisch/);
assert.match(nl.scenarioResultHint, /extra resultaat nadat relevante kosten/i);
assert.match(nl.receiptsNote, /bonnetjes en facturen/);
assert.match(nl.costsAreRealExpenses, /daadwerkelijk hebt gemaakt/);
assert.match(nl.helperInvestmentNote, /afschrijving/);
assert.match(nl.helperPartialCostsNote, /Niet alle kosten zijn aftrekbaar/);
assert.match(nl.helperUnknownCostsNote, /niet als €0/);
assert.match(nl.moneyResultTitle, /vooruit/);
assert.doesNotMatch(`${nl.costsCountBody}\n${nl.officialSellingThought}\n${en.costsCountBody}`, /zwart/i);
assert.doesNotMatch(nl.helperCostExamples, /alle kosten zijn aftrekbaar/i);
assert.match(PERSONAL_ROUTE_COPY.progressHeadline, /vooruit/);
assert.match(PERSONAL_ROUTE_COPY.taxAndAllowancesIncluded, /toeslagen/);
assert.match(impactSrc, /moneyResultTitle/);
assert.match(impactSrc, /fromSaleToKeptTitle/);
assert.match(impactSrc, /helperProgressMid/);
assert.match(impactSrc, /taxAndAllowancesIncluded/);
assert.match(wizardSrc, /VerdienCheckCostAdvantage/);
assert.match(wizardSrc, /applyRevenueCostHelperFields/);
assert.match(wizardSrc, /EMPTY_WIZARD_STATE/);
assert.match(helperSrc, /UNKNOWN_COSTS/);
assert.doesNotMatch(helperSrc, /costsUnknown[\s\S]{0,80}0/);
assert.doesNotMatch(impactSrc, /investering(en)? mag je aftrekken/i);
assert.doesNotMatch(nl.helperInvestmentNote, /Investeringen mag je aftrekken/);
assert.match(nl.whatIsResultBody, /niet automatisch belasting over alles/);
assert.match(wizardSrc, /questionsBeforeFirstResult/);
assert.equal(questionsBeforeFirstResult(state({ activityChoice: 'MAKE', growthStart: 'TRYING_OUT', situationGroup: 'NONE' })).length, 4);
assert.match(engineSrc, /commercialAdditional = input\.scenarioAdditionalResultCents/);
assert.equal(rowSrc.includes('commercialResultCents < 0'), true);
assert.ok(ztSrc.length > 0 && rentSrc.length > 0 && kgbSrc.length > 0 && kotSrc.length > 0);

const fiveSecondCopy = [
  nl.officialSellingThought,
  nl.costsCountBody,
  nl.costsCountEngine,
  nl.extraResultExplain,
  nl.scenarioResultHint,
  nl.moneyResultTitle,
  nl.whatIsResultTitle,
].join('\n');
assert.match(fiveSecondCopy, /omzet/);
assert.match(fiveSecondCopy, /resultaat/);
assert.match(fiveSecondCopy, /kosten/);
assert.match(fiveSecondCopy, /vooruit/);
assert.match(nl.costsCountEngine, /resultaat na kosten/);
assert.match(PERSONAL_ROUTE_COPY.taxAndAllowancesIncluded, /Belasting en veranderingen in je toeslagen/);

console.log(
  JSON.stringify(
    {
      REVENUE_MINUS_COSTS_MAPPING: 'PASS',
      DIRECT_RESULT_VS_HELPER_PARITY: 'PASS',
      UNKNOWN_COST_NOT_ZERO: 'PASS',
      NO_DOUBLE_COUNTING_COSTS: 'PASS',
      FIVE_SECOND_REVENUE_RESULT_TEST: 'PASS',
      HELPER_A_NET: readyHelperA.netExtraCents,
      HEALTHCARE_DELTA: ready(hcH).deltas.healthcareAllowance,
    },
    null,
    2,
  ),
);
console.log('verdiencheck cost advantage tests: PASS');
