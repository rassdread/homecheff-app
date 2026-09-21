/**
 * VerdienCheck final UX reconstruction guards.
 *
 *   npx tsx scripts/test-verdiencheck-final-ux.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { SCENARIO_PRESET_EUROS } from '../lib/verdiencheck/domain/money';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { buildPersonalVerdienRoute } from '../lib/verdiencheck/personal-route';
import { persistenceUsesDatabase } from '../lib/verdiencheck/privacy/session-client';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  clearFinancialDepth,
  firstMoneyStep,
  markMoneyDepthCompleted,
  nextStep,
  questionsBeforeFirstResult,
  visibleSteps,
  wizardHasInProgressAnswers,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { deriveIncomeBasesFromUserFacts } from '../lib/verdiencheck/wizard/derive-income-bases';
import { compareScenarioPresets } from '../lib/verdiencheck/wizard/scenario-comparison';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';
import { VERDIENCHECK_SESSION_KEY } from '../lib/verdiencheck/privacy/session-client';

const ROOT = process.cwd();
const wizardSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'), 'utf8');
const ctaSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckResultCta.tsx'), 'utf8');
const impactSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckFinancialImpact.tsx'),
  'utf8',
);
const focusSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/wizard/active-step-focus.ts'),
  'utf8',
);
const nl = getVerdienCheckCopy('nl');

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

assert.equal(persistenceUsesDatabase(), false);
assert.equal(VERDIENCHECK_SESSION_KEY, 'hc_verdiencheck_v1');

assert.equal(questionsBeforeFirstResult(state({ activityChoice: 'MAKE', growthStart: 'TRYING_OUT', situationGroup: 'NONE' })).length, 4);
assert.equal(questionsBeforeFirstResult(state({ activityChoice: 'FOOD', growthStart: 'TRYING_OUT', foodUxFrequency: 'ONE_OFF', situationGroup: 'NONE' })).length, 5);
assert.equal(questionsBeforeFirstResult(state({ activityChoice: 'AFFILIATE', growthStart: 'OCCASIONAL_EARNING', situationGroup: 'NONE' })).length, 4);
assert.equal(questionsBeforeFirstResult(state({ activityChoice: 'MAKE', growthStart: 'TRYING_OUT', situationGroup: 'WW' })).length, 4);
assert.equal(questionsBeforeFirstResult(state({ activityChoice: 'MAKE', growthStart: 'TRYING_OUT', situationGroup: 'BIJSTAND' })).length, 4);
assert.equal(questionsBeforeFirstResult(state({ activityChoice: 'MAKE', growthStart: 'BUILDING_BUSINESS', situationGroup: 'EXISTING_ENTREPRENEUR' })).length, 4);

const starterMoney = money({ activityChoice: 'MAKE', growthStart: 'TRYING_OUT', situationGroup: 'NONE' });
const employeeMoney = money({ activityChoice: 'MAKE', growthStart: 'OCCASIONAL_EARNING', situationGroup: 'EMPLOYEE' });
assert.equal(visibleSteps(starterMoney).includes('currentIncome'), true);
assert.equal(visibleSteps(starterMoney).includes('incomeBases'), false);
assert.equal(visibleSteps(employeeMoney).includes('incomeBases'), false);
assert.equal(firstMoneyStep(starterMoney), 'currentIncome');
const moneyQuestionCount = visibleSteps(employeeMoney).filter((id) => id !== 'jurisdiction' && id !== 'result' && !questionsBeforeFirstResult(employeeMoney).includes(id)).length;
assert.ok(moneyQuestionCount <= 10, `employee money questions ${moneyQuestionCount}`);

const proxy = deriveIncomeBasesFromUserFacts(employeeBaseline());
assert.equal(proxy.derivation, 'EMPLOYMENT_PROXY');
assert.equal(proxy.baselineGrossEmploymentIncomeCents, 3200 * 12 * 100);
assert.equal(proxy.baselineBox1TaxableIncomeCents, proxy.baselineGrossEmploymentIncomeCents);

const unknown = deriveIncomeBasesFromUserFacts(employeeBaseline({ currentIncomeUnknown: true, currentIncomeEuro: '' }));
assert.equal(unknown.derivation, 'UNKNOWN');
assert.equal(unknown.baselineBox1TaxableIncomeCents, null);

const otherIncome = deriveIncomeBasesFromUserFacts(employeeBaseline({ hasOtherIncome: true, otherIncomeEuro: '500' }));
assert.equal(otherIncome.derivation, 'PARTIAL');
assert.equal(otherIncome.baselineBox1TaxableIncomeCents, null);
assert.equal(otherIncome.baselineGrossEmploymentIncomeCents, 3200 * 12 * 100);

const advanced = deriveIncomeBasesFromUserFacts(
  employeeBaseline({
    baselineGrossEmploymentEuro: '40000',
    baselineBox1Euro: '35000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(advanced.derivation, 'ADVANCED');
assert.equal(advanced.baselineGrossEmploymentIncomeCents, 40000 * 100);
assert.equal(advanced.baselineBox1TaxableIncomeCents, 35000 * 100);

const inputA = wizardStateToCalculatorInput(employeeBaseline({ scenarioPreset: 500 }));
const inputB = wizardStateToCalculatorInput(employeeBaseline({ scenarioPreset: 5000 }));
assert.ok(inputA && inputB);
assert.equal(inputA.baselineBox1TaxableIncomeCents, inputB.baselineBox1TaxableIncomeCents);
assert.notEqual(inputA.scenarioAdditionalResultCents, inputB.scenarioAdditionalResultCents);
const calcA = runCalculator(inputA);
const calcB = runCalculator(inputB);
assert.equal(calcA.status, 'READY');
assert.equal(calcB.status, 'READY');
if (calcA.status === 'READY' && calcB.status === 'READY') {
  assert.equal(calcA.commercialAdditionalResultCents, 500 * 100);
  assert.equal(calcB.commercialAdditionalResultCents, 5000 * 100);
}

const customMonthly = wizardStateToCalculatorInput(
  employeeBaseline({
    scenarioPreset: 'custom',
    customScenarioEuro: '5000',
    amountEntryPeriod: 'MONTH',
  }),
);
assert.ok(customMonthly);
assert.equal(customMonthly.scenarioAdditionalResultCents, 5000 * 100);
assert.equal(customMonthly.baselineBox1TaxableIncomeCents, 3200 * 12 * 100);

const comparison = compareScenarioPresets(employeeBaseline());
assert.ok(comparison);
assert.equal(comparison?.length, SCENARIO_PRESET_EUROS.length);

const cleared = clearFinancialDepth(employeeBaseline());
assert.equal(cleared.currentIncomeEuro, '');
assert.equal(cleared.scenarioPreset, null);
assert.equal(cleared.baselineBox1Euro, '');
assert.equal(cleared.advancedAccuracyRequested, false);

assert.equal(wizardHasInProgressAnswers(EMPTY_WIZARD_STATE), false);
assert.equal(wizardHasInProgressAnswers(employeeBaseline()), true);

const readyRoute = buildPersonalVerdienRoute({
  ctx: {
    jurisdiction: 'NL',
    year: 2026,
    personSituation: 'EMPLOYEE',
    allowances: ['NONE'],
    activity: {
      kinds: ['PRODUCT'],
      frequency: 'OCCASIONAL',
      customers: 'PUBLIC',
      commercialIntent: 'SIDE_INCOME',
      independence: true,
      continuity: false,
      timeOrMoneyInvested: 'UNKNOWN',
      listingCount: null,
      transactionCount: 12,
      typicalTicketCents: null,
      unitCount: null,
    },
    business: null,
    benefits: null,
    food: null,
  },
  calculator: null,
  declaredGrowth: 'OCCASIONAL_EARNING',
});
assert.equal(readyRoute.proceedSemantics, 'READY_TO_PROCEED');
assert.equal(readyRoute.now.some((c) => c.family === 'business_registration'), false);

const currentIncomeCopy = `${nl.steps.currentIncome?.title}\n${nl.steps.currentIncome?.help}`;
assert.doesNotMatch(currentIncomeCopy, /toetsingsinkomen|verzamelinkomen|Zvw|arbeidsinkomen/i);
assert.match(nl.steps.currentIncome?.title ?? '', /nu ongeveer/);
assert.doesNotMatch(nl.steps.currentIncome?.title ?? '', /HomeCheff/);
assert.match(nl.steps.scenario?.title ?? '', /extra resultaat/);
assert.match(nl.moneyResultTitle, /vooruit/);
assert.match(nl.moneyYes, /Bereken mijn geld/);
assert.match(wizardSrc, /copy\.moneyYes/);
assert.doesNotMatch(wizardSrc, /copy\.moneyNo/);
assert.match(wizardSrc, /requestRestart/);
assert.match(wizardSrc, /VerdienCheckRestartConfirm/);
assert.match(wizardSrc, /positionVerdienCheckActiveStep/);
assert.match(wizardSrc, /VERDIENCHECK_ACTIVE_STEP_ID/);
assert.match(ctaSrc, /restartCompleted|restartFromStart/);
assert.match(impactSrc, /onSelectPreset/);
assert.match(impactSrc, /comparison/);
assert.match(impactSrc, /aria-labelledby=\{VERDIENCHECK_STEP_HEADING_ID\}/);
assert.doesNotMatch(impactSrc, /<h2[^>]*>\{copy\.moneyResultTitle\}/);
assert.match(wizardSrc, /id=\{VERDIENCHECK_STEP_HEADING_ID\}/);
assert.match(focusSrc, /preventScroll:\s*true/);
assert.match(focusSrc, /const scrollTarget = input\.heading \?\? input\.container/);
assert.match(wizardSrc, /markMoneyDepthCompleted\(next, 'scenario'/);
{
  const fromIncome = employeeBaseline({ moneyDepthCompleted: false, scenarioPreset: null });
  const to = nextStep(fromIncome, 'currentIncome');
  assert.equal(to, 'result');
  assert.equal(markMoneyDepthCompleted(fromIncome, 'currentIncome', to).moneyDepthCompleted, true);
  assert.equal(visibleSteps(fromIncome).includes('scenario'), false);
  assert.equal(visibleSteps(fromIncome).includes('amounts'), false);
}
assert.match(nl.restartConfirmBody, /gewist/);
assert.doesNotMatch(nl.restartConfirmBody, /permanent|voorgoed|definitief/);

console.log(
  JSON.stringify(
    {
      GENERAL_QUICK_LENGTH: 4,
      FOOD_QUICK_LENGTH: 5,
      AFFILIATE_QUICK_LENGTH: 4,
      WW_QUICK_LENGTH: 4,
      BIJSTAND_QUICK_LENGTH: 4,
      ENTREPRENEUR_QUICK_LENGTH: 4,
      EMPLOYEE_MONEY_QUESTIONS: moneyQuestionCount,
      PROXY: proxy.derivation,
      COMPARISON_ROWS: comparison?.length ?? 0,
    },
    null,
    2,
  ),
);
console.log('verdiencheck final UX tests: PASS');
