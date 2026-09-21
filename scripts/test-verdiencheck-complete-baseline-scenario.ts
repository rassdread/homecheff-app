/**
 * VerdienCheck complete personal baseline + scenario financial correctness.
 *
 *   npx tsx scripts/test-verdiencheck-complete-baseline-scenario.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorInput, CalculatorReadyResult } from '../lib/verdiencheck/calculator/types';
import { paintingOnceFiveThousand } from '../lib/verdiencheck/domain/activity';
import { V1_COST_SOURCE } from '../lib/verdiencheck/domain/costs';
import { deriveAllowancesFromFacts } from '../lib/verdiencheck/domain/allowances';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { parseEuroInputToCents } from '../lib/verdiencheck/domain/money';
import { estimateGrossFromNetSalary2026 } from '../lib/verdiencheck/nl2026/net-to-gross';
import { presentFinancialImpact } from '../lib/verdiencheck/personal-route/financial';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  derivedWizardAllowances,
  moneyQuestionIds,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';
import { deriveIncomeBasesFromUserFacts } from '../lib/verdiencheck/wizard/derive-income-bases';

const ROOT = process.cwd();
const wizardSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'), 'utf8');
const impactSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckFinancialImpact.tsx'),
  'utf8',
);
const engineSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/calculator/engine.ts'), 'utf8');

function euro(euros: number): number {
  return euros * 100;
}

function employee(input: {
  baselineEuro: number;
  extraEuro: number;
  allowances?: CalculatorInput['allowances'];
} & Partial<CalculatorInput>): CalculatorInput {
  const base = euro(input.baselineEuro);
  const extra = euro(input.extraEuro);
  const { baselineEuro: _b, extraEuro: _e, ...over } = input;
  return {
    jurisdiction: 'NL',
    calendarYear: 2026,
    personContext: { situation: 'EMPLOYEE' },
    currentAnnualIncomeCents: null,
    ageTaxRegime: 'BELOW_AOW_2026',
    additionalIncomeClassification: 'RESULT_FROM_OTHER_WORK',
    assumeEstimatedCostsTaxDeductible: true,
    baselineGrossEmploymentIncomeCents: base,
    baselineBox1TaxableIncomeCents: base,
    baselineAggregateIncomeCents: base,
    baselineArbeidsinkomenCents: base,
    baselineAssessmentIncomeCents: base,
    baselineZvwContributionIncomeAlreadyUsedCents: base,
    assetsEligibility: 'ELIGIBLE',
    partnerContext: { hasPartner: false, partnerHealthcareInsuranceStatus: 'INSURED' },
    allowances: input.allowances ?? ['HEALTHCARE'],
    activity: paintingOnceFiveThousand(),
    incomeSource: 'MARKETPLACE_SELLER',
    estimatedTurnoverCents: extra,
    estimatedCosts: { amountCents: 0, source: V1_COST_SOURCE },
    commercialResultCents: extra,
    scenarioAdditionalResultCents: extra,
    ...over,
  };
}

function ready(input: CalculatorInput): CalculatorReadyResult {
  const result = runCalculator(input);
  assert.equal(result.status, 'READY');
  if (result.status !== 'READY') throw new Error('not ready');
  return result;
}

function netFromParts(result: CalculatorReadyResult): number {
  assert.equal(typeof result.taxableAdditionalIncomeCents, 'number');
  assert.equal(typeof result.deltas.incomeTax, 'number');
  assert.equal(typeof result.deltas.zvw, 'number');
  assert.equal(typeof result.deltas.healthcareAllowance, 'number');
  assert.equal(typeof result.deltas.rentAllowance, 'number');
  assert.equal(typeof result.deltas.childBudget, 'number');
  assert.equal(typeof result.deltas.childcareAllowance, 'number');
  return (
    (result.taxableAdditionalIncomeCents as number) -
    (result.deltas.incomeTax as number) -
    (result.deltas.zvw as number) +
    (result.deltas.healthcareAllowance as number) +
    (result.deltas.rentAllowance as number) +
    (result.deltas.childBudget as number) +
    (result.deltas.childcareAllowance as number)
  );
}

const CUSTOM_AMOUNTS = [100, 500, 750, 1000, 1250, 2500, 3333, 5000, 7500, 10000, 15000];
assert.equal(parseEuroInputToCents('1.000'), 100_000);
assert.equal(parseEuroInputToCents('1.250'), 125_000);
assert.equal(parseEuroInputToCents('2.500'), 250_000);
assert.equal(parseEuroInputToCents('3.333'), 333_300);
assert.equal(parseEuroInputToCents('7.500'), 750_000);
assert.equal(parseEuroInputToCents('10.000'), 1_000_000);
assert.equal(parseEuroInputToCents('15.000'), 1_500_000);
for (const amount of CUSTOM_AMOUNTS) {
  assert.equal(parseEuroInputToCents(String(amount)), euro(amount));
}

const zero = ready(employee({ baselineEuro: 32_000, extraEuro: 0, allowances: ['HEALTHCARE'] }));
assert.equal(zero.baseline.healthcareAllowance, zero.scenario.healthcareAllowance);
assert.equal(zero.deltas.healthcareAllowance, 0);
assert.equal(zero.deltas.incomeTax, 0);
assert.equal(zero.deltas.zvw, 0);
assert.equal(zero.netExtraCents, 0);

for (const extra of [500, 1000, 2500, 5000, 10000] as const) {
  const row = ready(employee({ baselineEuro: 32_000, extraEuro: extra, allowances: ['HEALTHCARE'] }));
  assert.equal(row.netExtraCents, netFromParts(row));
  assert.notEqual(row.netExtraCents, euro(extra));
  const view = presentFinancialImpact(row, { allowances: ['HEALTHCARE'] });
  assert.equal(view.simulator.netExtraCents, row.netExtraCents);
  assert.ok(view.baseline);
  assert.equal(view.baseline?.allowances.some((line) => line.id === 'HEALTHCARE'), true);
}

const unknownAssets = ready(
  employee({
    baselineEuro: 20_000,
    extraEuro: 1000,
    allowances: ['HEALTHCARE'],
    assetsEligibility: 'UNKNOWN',
  }),
);
assert.equal(isUnknown(unknownAssets.deltas.healthcareAllowance), true);
assert.notEqual(unknownAssets.deltas.healthcareAllowance, 0);
assert.equal(isUnknown(unknownAssets.netExtraCents), true);

const netInvert = estimateGrossFromNetSalary2026({
  netAnnualCents: euro(28_000),
  regime: 'BELOW_AOW_2026',
});
assert.equal(netInvert.status, 'OK');
if (netInvert.status === 'OK') {
  assert.ok(netInvert.grossCents > euro(28_000));
  assert.equal(netInvert.confidence, 'ESTIMATE');
}

function moneyState(partial: Partial<WizardState>): WizardState {
  let next: WizardState = {
    ...EMPTY_WIZARD_STATE,
    taxResidence: 'NL',
    activityChoice: 'MAKE',
    activityKinds: applyActivityChoice('MAKE'),
    ...partial,
  };
  next = applyGrowthStartChoice(next, partial.growthStart ?? 'REGULAR_EARNING');
  next = applySituationGroup(next, partial.situationGroup ?? 'EMPLOYEE');
  return applyMoneyDepthChoice({ ...next, ...partial, taxResidence: 'NL' }, 'YES');
}

const netWizard = moneyState({
  ageTaxRegime: 'BELOW_AOW_2026',
  currentIncomeEuro: '2000',
  currentIncomePeriod: 'MONTH',
  currentIncomeBasis: 'NET',
  hasOtherIncome: false,
  dutchHealthInsurance: true,
  hasPartner: false,
  rentsHome: false,
  hasChildren: false,
  assetsEligibility: 'ELIGIBLE',
});
const netBases = deriveIncomeBasesFromUserFacts(netWizard);
assert.equal(netBases.derivation, 'NET_EMPLOYMENT_ESTIMATE');
assert.ok((netBases.baselineBox1TaxableIncomeCents ?? 0) > euro(24_000));
assert.notEqual(netBases.baselineBox1TaxableIncomeCents, euro(24_000));

const unresolvedNet = deriveIncomeBasesFromUserFacts(
  moneyState({
    currentIncomeEuro: '2000',
    currentIncomeBasis: 'NET',
    hasOtherIncome: true,
  }),
);
assert.equal(unresolvedNet.derivation, 'NET_UNRESOLVED');
assert.equal(unresolvedNet.baselineBox1TaxableIncomeCents, null);

assert.deepEqual(
  deriveAllowancesFromFacts({
    allowances: [],
    rentsHome: false,
    hasChildren: false,
    usesChildcare: false,
  }),
  ['HEALTHCARE'],
);
assert.ok(derivedWizardAllowances(moneyState({ rentsHome: true })).includes('RENT'));
assert.ok(derivedWizardAllowances(moneyState({ hasChildren: true })).includes('CHILD_BUDGET'));
assert.equal(derivedWizardAllowances(moneyState({ growthStart: 'TRYING_OUT' }))[0], 'NONE');

const ids = moneyQuestionIds(moneyState({ hasPartner: false }));
assert.equal(ids.includes('allowances'), false);
assert.equal(ids.includes('scenario'), false);
assert.equal(ids.includes('partner'), true);
assert.equal(ids.includes('rentsHome'), true);
assert.equal(ids.includes('hasChildren'), true);
assert.equal(ids.includes('dutchHealthInsurance'), true);

const mapped = wizardStateToCalculatorInput(
  moneyState({
    ageTaxRegime: 'BELOW_AOW_2026',
    currentIncomeEuro: '3200',
    currentIncomePeriod: 'MONTH',
    currentIncomeBasis: 'GROSS',
    hasOtherIncome: false,
    dutchHealthInsurance: true,
    hasPartner: false,
    rentsHome: false,
    hasChildren: false,
    assetsEligibility: 'ELIGIBLE',
    scenarioPreset: 'custom',
    customScenarioEuro: '1.000',
  }),
);
assert.ok(mapped);
assert.equal(mapped?.scenarioAdditionalResultCents, 100_000);
assert.ok(mapped?.allowances.includes('HEALTHCARE'));
assert.equal(mapped?.housingTenure, 'DOES_NOT_RENT');

assert.match(wizardSrc, /VerdienCheckBaselineCard/);
assert.match(wizardSrc, /showHeading=\{extraResultChosen\}/);
assert.match(wizardSrc, /viewExtraScenarioCta/);
assert.match(wizardSrc, /scenarioLayerRequested/);
assert.match(wizardSrc, /currentIncomeBasis/);
assert.match(impactSrc, /onApplyCustom/);
assert.match(impactSrc, /Enter/);
assert.match(impactSrc, /extraTaxReserveTitle/);
assert.doesNotMatch(engineSrc, /UNKNOWN.*\?\? 0/);
assert.doesNotMatch(impactSrc, /€1.000 voordeel|€1000 voordeel/);

console.log(
  JSON.stringify(
    {
      ZERO_DELTA_ORACLE: true,
      CUSTOM_PARSE: true,
      NET_NEVER_GROSS: true,
      BASELINE_BEFORE_SCENARIO: true,
      ENGINE_NET_EQUALS_DISPLAY: true,
    },
    null,
    2,
  ),
);
console.log('verdiencheck complete baseline scenario tests: PASS');
