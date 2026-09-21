/**
 * VerdienCheck Money: baseline current situation first, live simulator second.
 *
 *   npx tsx scripts/test-verdiencheck-baseline-first-simulator.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  firstMoneyStep,
  isFinancialScenarioQuestion,
  markMoneyDepthCompleted,
  moneyQuestionIds,
  nextStep,
  previousStep,
  type WizardState,
  type WizardStepId,
} from '../lib/verdiencheck/wizard/schema';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';

const ROOT = process.cwd();
const schemaSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/wizard/schema.ts'), 'utf8');
const wizardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);
const impactSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckFinancialImpact.tsx'),
  'utf8',
);
const engineSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/calculator/engine.ts'),
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
  return applyMoneyDepthChoice(
    { ...next, ...partial, taxResidence: 'NL', activityKinds: next.activityKinds },
    'YES',
  );
}

function titles(ids: readonly WizardStepId[]): string[] {
  return ids.map((id) => `${id}:${nl.steps[id]?.title ?? id}`);
}

function count(ids: readonly WizardStepId[], id: WizardStepId): number {
  return ids.filter((item) => item === id).length;
}

const FUTURE_SALES = /verkopen dit jaar|binnen te krijgen dit jaar|HomeCheff verdienen|extra resultaat verdient|Hoeveel wilt u via/i;

const employeeRegular = {
  activityChoice: 'MAKE' as const,
  growthStart: 'REGULAR_EARNING' as const,
  situationGroup: 'EMPLOYEE' as const,
};

const A = moneyQuestionIds(state({ ...employeeRegular, allowances: ['HEALTHCARE'], hasPartner: false }));
const B = moneyQuestionIds(state({ ...employeeRegular, allowances: ['HEALTHCARE'], hasPartner: true }));
const C = moneyQuestionIds(state({ ...employeeRegular, allowances: ['NONE'] }));
const D = moneyQuestionIds(state({ ...employeeRegular, allowances: ['HEALTHCARE'], hasPartner: false }));
const E = moneyQuestionIds(state({ ...employeeRegular, allowances: ['RENT'], hasPartner: false }));
const F = moneyQuestionIds(
  state({
    ...employeeRegular,
    allowances: ['CHILD_BUDGET'],
    hasPartner: false,
    childrenAges: '8',
    fiscalPartnerDuration: 'MORE_THAN_6_MONTHS',
  }),
);
const G = moneyQuestionIds(
  state({ ...employeeRegular, allowances: ['CHILDCARE'], hasPartner: false, childrenAges: '4' }),
);
const H = moneyQuestionIds(
  state({ ...employeeRegular, allowances: ['HEALTHCARE', 'RENT'], hasPartner: true }),
);
const I = moneyQuestionIds(
  state({ ...employeeRegular, allowances: ['NONE'], currentIncomeUnknown: true }),
);
const J = moneyQuestionIds(
  state({
    activityChoice: 'MAKE',
    growthStart: 'BUILDING_BUSINESS',
    situationGroup: 'EXISTING_ENTREPRENEUR',
    allowances: ['NONE'],
  }),
);
const K = moneyQuestionIds(
  state({
    activityChoice: 'MAKE',
    growthStart: 'REGULAR_EARNING',
    situationGroup: 'WW',
    allowances: ['NONE'],
  }),
);
const L = moneyQuestionIds(
  state({
    activityChoice: 'MAKE',
    growthStart: 'TRYING_OUT',
    situationGroup: 'EMPLOYEE',
    allowances: ['NONE'],
  }),
);

for (const [label, ids] of Object.entries({ A, B, C, D, E, F, G, H, I, J, L })) {
  assert.equal(count(ids, 'currentIncome'), 1, `${label} user income once`);
  assert.equal(ids.some(isFinancialScenarioQuestion), false, `${label} no scenario in baseline`);
  assert.equal(ids.includes('amounts'), false, `${label} no amounts in baseline`);
  assert.equal(ids.includes('customers'), false, `${label} no customers in baseline`);
  assert.doesNotMatch(titles(ids).join('\n'), FUTURE_SALES, `${label} no future sales copy`);
}

assert.equal(A.includes('partnerIncome'), false);
assert.equal(A.includes('iackPartnerIncome'), false);
assert.equal(B.includes('partner'), true);
assert.equal(B.includes('partnerIncome'), true);
assert.equal(count(B, 'partnerIncome'), 1);
assert.equal(C.includes('partner'), false);
assert.equal(C.includes('partnerIncome'), false);
assert.equal(E.includes('partnerIncome'), false);
assert.equal(F.includes('partnerIncome'), false);
assert.equal(F.includes('iackPartnerIncome'), false);
assert.equal(G.includes('partnerIncome'), false);
assert.equal(H.includes('partnerIncome'), true);
assert.equal(K.length, 0);
assert.deepEqual(L, ['currentIncome']);
assert.equal(firstMoneyStep(state({ ...employeeRegular, allowances: ['NONE'] })), 'aow');
assert.equal(
  firstMoneyStep(
    state({
      activityChoice: 'MAKE',
      growthStart: 'TRYING_OUT',
      situationGroup: 'EMPLOYEE',
    }),
  ),
  'currentIncome',
);

const partnerPath = state({ ...employeeRegular, allowances: ['HEALTHCARE'], hasPartner: true });
assert.ok(moneyQuestionIds(partnerPath).indexOf('currentIncome') < moneyQuestionIds(partnerPath).indexOf('partnerIncome'));

const noPartnerLast = state({ ...employeeRegular, allowances: ['NONE'] });
assert.equal(nextStep(noPartnerLast, 'currentIncome'), 'result');
assert.equal(markMoneyDepthCompleted(noPartnerLast, 'currentIncome', 'result').moneyDepthCompleted, true);
const healthcareLast = state({ ...employeeRegular, allowances: ['HEALTHCARE'], hasPartner: false });
assert.equal(nextStep(healthcareLast, 'assets'), 'result');
assert.equal(markMoneyDepthCompleted(healthcareLast, 'assets', 'result').moneyDepthCompleted, true);
assert.equal(previousStep({ ...noPartnerLast, moneyDepthRequested: true }, 'currentIncome'), 'allowances');

const input500 = wizardStateToCalculatorInput(
  state({
    ...employeeRegular,
    allowances: ['NONE'],
    ageTaxRegime: 'BELOW_AOW_2026',
    currentIncomeEuro: '3200',
    amountEntryPeriod: 'MONTH',
    hasOtherIncome: false,
    scenarioPreset: 500,
  }),
);
const input2500 = wizardStateToCalculatorInput(
  state({
    ...employeeRegular,
    allowances: ['NONE'],
    ageTaxRegime: 'BELOW_AOW_2026',
    currentIncomeEuro: '3200',
    amountEntryPeriod: 'MONTH',
    hasOtherIncome: false,
    scenarioPreset: 2500,
  }),
);
assert.ok(input500 && input2500);
assert.equal(input500.baselineBox1TaxableIncomeCents, input2500.baselineBox1TaxableIncomeCents);
assert.notEqual(input500.scenarioAdditionalResultCents, input2500.scenarioAdditionalResultCents);
const calc500 = runCalculator(input500);
const calc2500 = runCalculator(input2500);
assert.equal(calc500.status, 'READY');
assert.equal(calc2500.status, 'READY');
if (calc500.status === 'READY' && calc2500.status === 'READY') {
  assert.equal(calc500.baseline.incomeTax, calc2500.baseline.incomeTax);
}

assert.match(nl.moneyPhaseNowTitle, /situatie nu/i);
assert.match(nl.baselineCompleteTitle, /uitgangssituatie is compleet/i);
assert.match(nl.steps.partnerIncome?.title ?? '', /toeslagpartner/i);
assert.doesNotMatch(nl.steps.partnerIncome?.title ?? '', /gezamenlijk/i);
assert.match(wizardSrc, /function advanceFrom/);
assert.match(wizardSrc, /advanceFrom\(next, 'assets'\)/);
assert.match(wizardSrc, /baselineCompleteTitle/);
assert.match(impactSrc, /copy\.whatIf/);
assert.doesNotMatch(schemaSrc, /moneyLayerVisible\(s\) && needsSeriousAdminQuestions/);
assert.doesNotMatch(engineSrc, /UNKNOWN.*\?\? 0/);

const unknownPartner = wizardStateToCalculatorInput(
  state({
    ...employeeRegular,
    allowances: ['HEALTHCARE'],
    hasPartner: false,
    ageTaxRegime: 'BELOW_AOW_2026',
    currentIncomeEuro: '3200',
    amountEntryPeriod: 'MONTH',
    hasOtherIncome: false,
    partnerAssessmentEuro: '99999',
  }),
);
assert.ok(unknownPartner);
assert.equal(unknownPartner.partnerContext.hasPartner, false);

console.log(
  JSON.stringify(
    {
      PERSONA_A: { BEFORE: 12, AFTER: A.length, qs: A },
      PERSONA_B: { BEFORE: 14, AFTER: B.length, qs: B },
      PERSONA_C: { BEFORE: 10, AFTER: C.length, qs: C },
      PERSONA_D: { BEFORE: 12, AFTER: D.length, qs: D },
      PERSONA_E: { BEFORE: 15, AFTER: E.length, qs: E },
      PERSONA_F: { BEFORE: 17, AFTER: F.length, qs: F },
      PERSONA_G: { BEFORE: 18, AFTER: G.length, qs: G },
      PERSONA_H: { BEFORE: 18, AFTER: H.length, qs: H },
      PERSONA_I: { BEFORE: 10, AFTER: I.length, qs: I },
      PERSONA_J: { BEFORE: 9, AFTER: J.length, qs: J },
      PERSONA_K: { BEFORE: 0, AFTER: K.length, qs: K },
      PERSONA_L: { BEFORE: 2, AFTER: L.length, qs: L },
      DUPLICATE_INCOME_AFTER: 0,
      IRRELEVANT_PARTNER_QUESTIONS_AFTER: 0,
      SCENARIO_QUESTIONS_DURING_BASELINE_AFTER: 0,
    },
    null,
    2,
  ),
);
console.log('verdiencheck baseline-first live simulator tests: PASS');
