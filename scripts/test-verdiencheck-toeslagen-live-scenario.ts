/**
 * Founder regression: toeslagen questions are part of the baseline, and a
 * HomeCheff extra result recalculates tax, Zvw, allowances and net retained.
 *
 * The pre-fix path filled only toetsingsinkomen on the jaaropgave step. That
 * wiped the salary-derived Box 1 bases, so tax and zorgtoeslag stayed
 * "Nog niet te berekenen" when the extra result changed.
 *
 *   npx tsx scripts/test-verdiencheck-toeslagen-live-scenario.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorReadyResult } from '../lib/verdiencheck/calculator/types';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { presentFinancialImpact } from '../lib/verdiencheck/personal-route/financial';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  visibleSteps,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { deriveIncomeBasesFromUserFacts } from '../lib/verdiencheck/wizard/derive-income-bases';
import { resolveVerdienCheckMissingStep } from '../lib/verdiencheck/wizard/missing-input-target';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';

const nl = getVerdienCheckCopy('nl');
const wizardSrc = fs.readFileSync(
  path.join(process.cwd(), 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);

function employee(partial: Partial<WizardState> = {}): WizardState {
  let next: WizardState = {
    ...EMPTY_WIZARD_STATE,
    taxResidence: 'NL',
    activityChoice: 'MAKE',
    activityKinds: applyActivityChoice('MAKE'),
    ageTaxRegime: 'BELOW_AOW_2026',
    allowances: [],
    currentIncomeEuro: '2200',
    currentIncomePeriod: 'MONTH',
    currentIncomeBasis: 'GROSS',
    holidayPayIncluded: 'YES',
    hasOtherIncome: false,
    dutchHealthInsurance: true,
    hasPartner: false,
    housingTenure: 'OTHER',
    rentsHome: false,
    hasChildren: false,
    usesChildcare: false,
    assetsEligibility: 'ELIGIBLE',
    scenarioInputMode: 'RESULT',
    scenarioPreset: 1000,
    ...partial,
  };
  next = applyGrowthStartChoice(next, partial.growthStart ?? 'OCCASIONAL_EARNING');
  next = applySituationGroup(next, partial.situationGroup ?? 'EMPLOYEE');
  return applyMoneyDepthChoice({ ...next, ...partial, taxResidence: 'NL' }, 'YES');
}

function ready(state: WizardState): CalculatorReadyResult {
  const input = wizardStateToCalculatorInput(state);
  assert.ok(input);
  const result = runCalculator(input);
  assert.equal(result.status, 'READY');
  if (result.status !== 'READY') throw new Error('not ready');
  return result;
}

function num(value: unknown): number {
  assert.equal(typeof value, 'number');
  assert.equal(isUnknown(value as number), false);
  return value as number;
}

const moneySteps = visibleSteps(employee());
const incomeAt = moneySteps.indexOf('currentIncome');
const toeslagenAt = moneySteps.indexOf('toeslagen');
const housingAt = moneySteps.indexOf('rentsHome');
assert.ok(incomeAt >= 0 && toeslagenAt > incomeAt, 'toeslagen follows current income');
assert.ok(housingAt > toeslagenAt, 'housing follows the toeslagen step');
assert.match(nl.steps.toeslagen?.title ?? '', /Toeslagen/);
assert.match(nl.steps.toeslagen?.help ?? '', /extra inkomen/);
assert.equal(nl.completeMissingData, 'Gegevens aanvullen');
assert.match(wizardSrc, /completeMissingData/);
assert.doesNotMatch(nl.steps.toeslagen?.title ?? '', /Ontvang je toeslagen/);

const founder = employee({
  currentIncomeEuro: '2646',
  holidayPayIncluded: 'NO',
  holidayPayPercentMode: 'STATUTORY_8',
  advancedAccuracyRequested: true,
  baselineAssessmentEuro: '35000',
  housingTenure: 'OWNER_OCCUPIED',
  wozValueEuro: '400000',
  mortgageInterestStatus: 'KNOWN',
  deductibleMortgageInterestEuro: '8000',
});
const founderBases = deriveIncomeBasesFromUserFacts(founder);
assert.equal(founderBases.baselineAssessmentIncomeCents, 3_500_000);
assert.notEqual(founderBases.baselineBox1TaxableIncomeCents, null);
assert.notEqual(founderBases.baselineBox1TaxableIncomeCents, founderBases.baselineAssessmentIncomeCents);
assert.notEqual(founderBases.baselineAggregateIncomeCents, null);
assert.notEqual(founderBases.baselineZvwContributionIncomeAlreadyUsedCents, null);

function scenario(extra: number | '7321') {
  const state =
    extra === '7321'
      ? employee({
          ...founder,
          scenarioPreset: 'custom',
          customScenarioEuro: '7321',
          scenarioInputMode: 'RESULT',
        })
      : employee({ ...founder, scenarioPreset: extra, customScenarioEuro: '', scenarioInputMode: 'RESULT' });
  const result = ready(state);
  const view = presentFinancialImpact(result, {
    allowances: wizardStateToCalculatorInput(state)?.allowances ?? ['HEALTHCARE'],
    baselineFacts: {
      allowancesNone: false,
      housingTenure: 'OWNER_OCCUPIED',
      hasChildren: false,
      usesChildcare: false,
      assessmentIncomeCents: founderBases.baselineAssessmentIncomeCents,
      employeeLikeZvw: true,
    },
  });
  const zt = view.simulator.allowances.find((line) => line.id === 'HEALTHCARE');
  assert.ok(zt);
  assert.equal(zt.unknown, false, `ZT unknown at extra ${extra}`);
  assert.equal(zt.included, true);
  return {
    extraResult: num(result.commercialAdditionalResultCents),
    baselineTax: num(result.baseline.incomeTax),
    scenarioTax: num(result.scenario.incomeTax),
    taxDelta: num(result.deltas.incomeTax),
    zvwDelta: num(result.deltas.zvw),
    baselineZt: num(result.baseline.healthcareAllowance),
    scenarioZt: num(result.scenario.healthcareAllowance),
    ztDelta: num(result.deltas.healthcareAllowance),
    net: num(result.netExtraCents),
    definitive: result.netExtraIsDefinitive,
    renderedNet: view.simulator.netExtraCents,
    renderedZtNow: zt.currentCents,
    renderedZtExtra: zt.scenarioCents,
  };
}

const extra0 = scenario(0);
const extra500 = scenario(500);
const extra1000 = scenario(1000);
const extra2500 = scenario(2500);
const extra5000 = scenario(5000);
const extra10000 = scenario(10000);
const extra7321 = scenario('7321');

assert.equal(extra0.extraResult, 0);
assert.equal(extra500.extraResult, 50_000);
assert.equal(extra1000.extraResult, 100_000);
assert.equal(extra2500.extraResult, 250_000);
assert.equal(extra5000.extraResult, 500_000);
assert.equal(extra10000.extraResult, 1_000_000);
assert.equal(extra7321.extraResult, 732_100);
assert.notEqual(extra7321.extraResult, 732_100 * 12);

for (const row of [extra0, extra500, extra1000, extra2500, extra5000, extra10000, extra7321]) {
  assert.equal(row.baselineTax, extra0.baselineTax);
  assert.equal(row.baselineZt, extra0.baselineZt);
  assert.equal(row.definitive, true);
  assert.equal(row.renderedNet, row.net);
}

assert.equal(extra1000.baselineTax, 132_023);
assert.equal(extra1000.scenarioTax, 165_823);
assert.equal(extra1000.taxDelta, 33_800);
assert.equal(extra1000.zvwDelta, 4_850);
assert.equal(extra1000.baselineZt, 82_770);
assert.equal(extra1000.scenarioZt, 69_040);
assert.equal(extra1000.ztDelta, -13_730);
assert.equal(extra1000.net, 47_620);
assert.equal(extra5000.net, 219_186);
assert.equal(extra5000.scenarioZt, 14_120);
assert.equal(extra7321.net, 332_611);
assert.equal(extra7321.extraResult, 732_100);
assert.notEqual(extra1000.scenarioTax, extra0.scenarioTax);
assert.notEqual(extra5000.scenarioTax, extra1000.scenarioTax);
assert.notEqual(extra7321.net, extra5000.net);
assert.notEqual(extra1000.scenarioZt, extra5000.scenarioZt);
assert.ok(extra5000.scenarioZt < extra1000.scenarioZt);
assert.ok(extra1000.taxDelta > 0);
assert.ok(extra1000.zvwDelta > extra0.zvwDelta || extra1000.zvwDelta >= 0);

const rent = employee({
  currentIncomeEuro: '1800',
  holidayPayIncluded: 'YES',
  housingTenure: 'RENT',
  rentsHome: true,
  bareRentEuro: '700',
  housingHouseholdType: 'SINGLE',
  oldestHouseholdResidentAge: '35',
  housingAssetsEligibility: 'ELIGIBLE',
  assetsEligibility: 'ELIGIBLE',
});
const rent1000 = ready(employee({ ...rent, scenarioPreset: 1000 }));
const rent5000 = ready(employee({ ...rent, scenarioPreset: 5000 }));
assert.equal(typeof rent1000.baseline.rentAllowance, 'number');
assert.ok(num(rent1000.baseline.rentAllowance) > 0);
assert.equal(rent1000.baseline.rentAllowance, rent5000.baseline.rentAllowance);
assert.notEqual(rent1000.scenario.rentAllowance, rent5000.scenario.rentAllowance);
assert.ok(num(rent5000.deltas.rentAllowance) < num(rent1000.deltas.rentAllowance));
assert.notEqual(rent1000.netExtraCents, rent5000.netExtraCents);

const kgb = employee({
  currentIncomeEuro: '2200',
  hasChildren: true,
  childrenAges: '8',
  childBudgetAssetsEligibility: 'ELIGIBLE',
  usesChildcare: false,
});
const kgb1000 = ready(employee({ ...kgb, scenarioPreset: 1000 }));
const kgb5000 = ready(employee({ ...kgb, scenarioPreset: 5000 }));
assert.ok(num(kgb1000.baseline.childBudget) > 0);
assert.equal(kgb1000.baseline.childBudget, kgb5000.baseline.childBudget);
assert.notEqual(kgb1000.scenario.childBudget, kgb5000.scenario.childBudget);

const kot = employee({
  currentIncomeEuro: '5000',
  hasChildren: true,
  childrenAges: '4',
  childBudgetAssetsEligibility: 'ELIGIBLE',
  usesChildcare: true,
  childcareCareType: 'DAYCARE_CENTER',
  childcareHoursPerMonth: '80',
  childcareHourlyRateEuro: '10',
  childcareProviderStatus: 'REGISTERED_ELIGIBLE',
  parentWorkStudyStatus: 'ELIGIBLE',
  workedMonthsInYear: '12',
});
const kot1000 = ready(employee({ ...kot, scenarioPreset: 1000 }));
const kot5000 = ready(employee({ ...kot, scenarioPreset: 5000 }));
assert.ok(num(kot1000.baseline.childcareAllowance) > 0);
assert.equal(kot1000.baseline.childcareAllowance, kot5000.baseline.childcareAllowance);
assert.notEqual(kot1000.scenario.childcareAllowance, kot5000.scenario.childcareAllowance);

const none = employee({
  dutchHealthInsurance: false,
  housingTenure: 'OWNER_OCCUPIED',
  rentsHome: false,
  hasChildren: false,
  usesChildcare: false,
  assetsEligibility: 'NOT_ELIGIBLE',
  wozValueEuro: '400000',
  mortgageInterestStatus: 'NONE',
});
const noneResult = ready(employee({ ...none, scenarioPreset: 2500 }));
const noneView = presentFinancialImpact(noneResult, {
  allowances: wizardStateToCalculatorInput(none)?.allowances ?? ['HEALTHCARE'],
  baselineFacts: {
    allowancesNone: false,
    housingTenure: 'OWNER_OCCUPIED',
    hasChildren: false,
    usesChildcare: false,
    employeeLikeZvw: true,
  },
});
for (const line of noneView.simulator.allowances) {
  assert.equal(line.unknown, false, `${line.id} must not be an unasked unknown`);
  assert.notEqual(line.excludedReason, nl.notYetCalculable);
}
assert.equal(num(noneResult.baseline.healthcareAllowance), 0);
assert.equal(num(noneResult.baseline.rentAllowance), 0);
assert.equal(num(noneResult.baseline.childBudget), 0);
assert.equal(num(noneResult.baseline.childcareAllowance), 0);

const missingAssets = employee({ assetsEligibility: 'UNKNOWN' });
const missingResult = ready(missingAssets);
assert.equal(isUnknown(missingResult.baseline.healthcareAllowance), true);
assert.equal(missingResult.netExtraIsDefinitive, false);
const missingStep = resolveVerdienCheckMissingStep(
  {
    advancedAccuracyRequested: false,
    currentIncomeUnknown: false,
  },
  missingResult.missingInputs,
);
assert.equal(missingStep, 'assets');

console.log(
  JSON.stringify(
    {
      TOESLAGEN_STEP: true,
      EXTRA_0: extra0,
      EXTRA_500: extra500,
      EXTRA_1000: extra1000,
      EXTRA_2500: extra2500,
      EXTRA_5000: extra5000,
      EXTRA_10000: extra10000,
      EXTRA_7321: extra7321,
      HT_1000: num(rent1000.baseline.rentAllowance),
      HT_5000_SCENARIO: num(rent5000.scenario.rentAllowance),
      KGB_1000: num(kgb1000.baseline.childBudget),
      KOT_1000: num(kot1000.baseline.childcareAllowance),
      NO_TOESLAGEN_FALSE_UNKNOWN: true,
      MISSING_INPUT_CTA_TARGET: missingStep,
    },
    null,
    2,
  ),
);
