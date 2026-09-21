/**
 * VerdienCheck omzet → kosten → resultaat UX, without a second tax engine.
 *
 *   npx tsx scripts/test-verdiencheck-revenue-cost-quick-insight.ts
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorInput, CalculatorReadyResult } from '../lib/verdiencheck/calculator/types';
import {
  emptyCostLines,
  mapCostBreakdown,
} from '../lib/verdiencheck/domain/cost-categories';
import {
  EXAMPLE_COSTS_CENTS,
  EXAMPLE_RESULT_CENTS,
  EXAMPLE_REVENUE_CENTS,
  helperFeedsCertifiedEngine,
  mapRevenueAndAllowableCosts,
} from '../lib/verdiencheck/domain/revenue-cost-helper';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applyRevenueCostHelperFields,
  applySituationGroup,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';

const ROOT = process.cwd();
const nl = getVerdienCheckCopy('nl');

function sha(rel: string): string {
  return createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
}

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

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

function employee(partial: Partial<WizardState> = {}): WizardState {
  return applyMoneyDepthChoice(
    state({
      activityChoice: 'MAKE',
      growthStart: 'OCCASIONAL_EARNING',
      situationGroup: 'EMPLOYEE',
      ageTaxRegime: 'BELOW_AOW_2026',
      allowances: ['NONE'],
      currentIncomeEuro: '3200',
      amountEntryPeriod: 'MONTH',
      holidayPayIncluded: 'YES',
      hasOtherIncome: false,
      scenarioPreset: 5000,
      ...partial,
    }),
    'YES',
  );
}

function ready(input: CalculatorInput): CalculatorReadyResult {
  const result = runCalculator(input);
  assert.equal(result.status, 'READY');
  if (result.status !== 'READY') throw new Error('not ready');
  return result;
}

assert.equal(EXAMPLE_REVENUE_CENTS, 1_000_000);
assert.equal(EXAMPLE_COSTS_CENTS, 400_000);
assert.equal(EXAMPLE_RESULT_CENTS, 600_000);

const caseA = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '4000',
  costsUnknown: false,
});
assert.equal(caseA.status, 'OK');
assert.equal(caseA.resultCents, 600_000);

const caseB = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '0',
  costsUnknown: false,
});
assert.equal(caseB.resultCents, 1_000_000);

const caseC = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '10000',
  costsUnknown: false,
});
assert.equal(caseC.status, 'ZERO');
assert.equal(caseC.resultCents, 0);
assert.equal(helperFeedsCertifiedEngine(caseC), false);

const caseD = mapRevenueAndAllowableCosts({
  revenueEuro: '10000',
  costsEuro: '14000',
  costsUnknown: false,
});
assert.equal(caseD.status, 'NEGATIVE');
assert.equal(helperFeedsCertifiedEngine(caseD), false);

const helper = applyRevenueCostHelperFields(employee(), {
  helperRevenueEuro: '10000',
  helperCostsEuro: '4000',
  helperCostsUnknown: false,
});
const direct = employee({
  scenarioInputMode: 'RESULT',
  scenarioPreset: 'custom',
  customScenarioEuro: '6000',
});
const helperInput = wizardStateToCalculatorInput(helper);
const directInput = wizardStateToCalculatorInput(direct);
assert.ok(helperInput && directInput);
assert.equal(helperInput.scenarioAdditionalResultCents, 600_000);
assert.equal(directInput.scenarioAdditionalResultCents, 600_000);
const helperReady = ready(helperInput);
const directReady = ready(directInput);
assert.equal(helperReady.commercialAdditionalResultCents, 600_000);
assert.equal(directReady.commercialAdditionalResultCents, 600_000);
assert.deepEqual(
  {
    tax: helperReady.deltas.incomeTax,
    zvw: helperReady.deltas.zvw,
    net: helperReady.netExtraCents,
  },
  {
    tax: directReady.deltas.incomeTax,
    zvw: directReady.deltas.zvw,
    net: directReady.netExtraCents,
  },
);

const spendAsDeduction = mapCostBreakdown(
  emptyCostLines().map((line) =>
    line.id === 'MATERIALS' ? { ...line, spendEuro: '4000', deductibleEuro: '' } : line,
  ),
);
assert.equal(spendAsDeduction.status, 'INCOMPLETE');
assert.equal(spendAsDeduction.deductibleCents, null);

const deductibleOnly = mapCostBreakdown(
  emptyCostLines().map((line) =>
    line.id === 'MATERIALS'
      ? { ...line, spendEuro: '5000', deductibleEuro: '4000', kind: 'ORDINARY' }
      : line,
  ),
);
assert.equal(deductibleOnly.status, 'OK');
assert.equal(deductibleOnly.spendCents, 500_000);
assert.equal(deductibleOnly.deductibleCents, 400_000);

const investmentUnknown = mapCostBreakdown(
  emptyCostLines().map((line) =>
    line.id === 'EQUIPMENT'
      ? { ...line, spendEuro: '2500', deductibleEuro: '', kind: 'INVESTMENT' }
      : line,
  ),
);
assert.equal(investmentUnknown.status, 'INVESTMENT_UNKNOWN');
assert.equal(investmentUnknown.deductibleCents, null);

const investmentYear = mapCostBreakdown(
  emptyCostLines().map((line) =>
    line.id === 'EQUIPMENT'
      ? { ...line, spendEuro: '2500', deductibleEuro: '500', kind: 'INVESTMENT' }
      : line,
  ),
);
assert.equal(investmentYear.status, 'OK');
assert.equal(investmentYear.deductibleCents, 50_000);
assert.notEqual(investmentYear.deductibleCents, investmentYear.spendCents);

const catSrc = read('lib/verdiencheck/domain/cost-categories.ts');
assert.doesNotMatch(catSrc, /from ['\"]\.\.\/calculator\/engine/);
assert.doesNotMatch(catSrc, /runCalculator/);
assert.doesNotMatch(catSrc, /healthcare-allowance|housing-allowance|child-budget|childcare-allowance/);

const insightSrc = read('components/verdiencheck/VerdienCheckQuickInsight.tsx');
assert.match(insightSrc, /quickInsightTitle/);
assert.match(insightSrc, /variant="example"/);
assert.doesNotMatch(insightSrc, /netExtra|netKeep|€X|echt extra over/i);
assert.match(insightSrc, /startForMySituation/);

const equationSrc = read('components/verdiencheck/VerdienCheckOmzetKostenResult.tsx');
assert.match(equationSrc, /EXAMPLE_REVENUE_CENTS/);
assert.match(equationSrc, /EXAMPLE_RESULT_CENTS/);
assert.doesNotMatch(equationSrc, /runCalculator/);

const infoSrc = read('components/verdiencheck/VerdienCheckKostenInfo.tsx');
assert.match(infoSrc, /aria-label=\{props\.copy\.kostenInfoLabel\}/);
assert.match(infoSrc, /<details/);

const wizardSrc = read('components/verdiencheck/VerdienCheckWizard.tsx');
assert.match(wizardSrc, /VerdienCheckQuickInsight/);
assert.match(wizardSrc, /startForMySituation|onStart/);

const helperUi = read('components/verdiencheck/VerdienCheckCostAdvantage.tsx');
assert.match(helperUi, /knowMyResult/);
assert.match(helperUi, /calculateFromRevenueCosts/);
assert.match(helperUi, /splitCostsCta/);
assert.match(helperUi, /receiptsCalloutTitle/);
assert.match(helperUi, /vatSeparationNote/);
assert.match(helperUi, /investmentUnknownNote/);

const impactSrc = read('components/verdiencheck/VerdienCheckFinancialImpact.tsx');
assert.match(impactSrc, /data-verdiencheck-result-chain/);
assert.match(impactSrc, /VerdienCheckOmzetKostenResult/);
assert.match(impactSrc, /growthSellingMessage/);

const ctaSrc = read('components/verdiencheck/VerdienCheckResultCta.tsx');
assert.match(ctaSrc, /keepOverviewPrompt/);
assert.match(ctaSrc, /placeFirstOffer/);
assert.doesNotMatch(ctaSrc, /via HomeCheff mag je kosten|HomeCheff maakt kosten aftrekbaar/);

assert.match(nl.quickInsightTitle, /Wat houd je écht over/);
assert.match(nl.kostenInfoBody, /Omzet is wat je van klanten ontvangt/);
assert.match(nl.notWholeTurnover, /niet dat alles wat binnenkomt automatisch je resultaat is/);
assert.match(nl.keepRecordsEarn, /relevante kosten tellen mee/);
assert.doesNotMatch(nl.quickInsightAfterResult, /€[0-9]/);
assert.doesNotMatch(`${nl.quickInsightThenNet}\n${nl.quickInsightAfterResult}`, /€6\.000 extra over|netto €/);
assert.doesNotMatch(
  [nl.costsCountBody, nl.officialSellingThought, nl.keepOverviewPrompt, nl.sellViaHomecheff, nl.growthSellingMessage].join(
    '\n',
  ),
  /zwart verkopen|illegaal verkopen|via HomeCheff betaal je minder|via HomeCheff mag je kosten/i,
);

const engineHash = sha('lib/verdiencheck/calculator/engine.ts');
const ztHash = sha('lib/verdiencheck/nl2026/healthcare-allowance.ts');
const htHash = sha('lib/verdiencheck/nl2026/housing-allowance.ts');
const kgbHash = sha('lib/verdiencheck/nl2026/child-budget.ts');
const kotHash = sha('lib/verdiencheck/nl2026/childcare-allowance.ts');
const zvwHash = sha('lib/verdiencheck/nl2026/zvw.ts');
const netHash = sha('lib/verdiencheck/nl2026/net-to-gross.ts');
assert.match(read('lib/verdiencheck/calculator/engine.ts'), /commercialAdditional = input\.scenarioAdditionalResultCents/);

console.log(
  JSON.stringify(
    {
      CASE_A_RESULT: caseA.resultCents,
      CASE_B_RESULT: caseB.resultCents,
      CASE_C_RESULT: caseC.resultCents,
      CASE_D_FEEDS_ENGINE: helperFeedsCertifiedEngine(caseD),
      DIRECT_VS_HELPER_NET: helperReady.netExtraCents,
      INVESTMENT_FULL_PRICE_NOT_USED: investmentUnknown.status,
      TAX_ENGINE_SHA256: engineHash,
      ZT_SHA256: ztHash,
      HT_SHA256: htHash,
      KGB_SHA256: kgbHash,
      KOT_SHA256: kotHash,
      ZVW_SHA256: zvwHash,
      NET_TO_GROSS_SHA256: netHash,
    },
    null,
    2,
  ),
);
console.log('verdiencheck revenue-cost quick insight tests: PASS');
