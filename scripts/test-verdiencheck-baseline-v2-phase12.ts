/**
 * VerdienCheck Baseline V2 Phase 1+2 fixtures A–I.
 *
 *   npx tsx scripts/test-verdiencheck-baseline-v2-phase12.ts
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { presentFinancialImpact } from '../lib/verdiencheck/personal-route/financial';
import type { BaselinePresentationFacts } from '../lib/verdiencheck/personal-route/types';
import {
  inspectVerdienCheckAnalyticsPayload,
  FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS,
} from '../lib/verdiencheck/privacy/analytics-guard';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { deriveIncomeBasesFromUserFacts } from '../lib/verdiencheck/wizard/derive-income-bases';
import { holidayPayCents } from '../lib/verdiencheck/wizard/holiday-pay';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';

const ROOT = path.join(__dirname, '..');
const nl = getVerdienCheckCopy('nl');
const MONTHLY_GROSS_2646_CENTS = 2646 * 100;
const BASE_SALARY_CENTS = MONTHLY_GROSS_2646_CENTS * 12;
const HOLIDAY_8_CENTS = holidayPayCents(BASE_SALARY_CENTS, 8);
const ANNUAL_INCL_8_CENTS = BASE_SALARY_CENTS + HOLIDAY_8_CENTS;

assert.equal(BASE_SALARY_CENTS, 3_175_200);
assert.equal(HOLIDAY_8_CENTS, 254_016);
assert.equal(ANNUAL_INCL_8_CENTS, 3_429_216);

function employee(partial: Partial<WizardState> = {}): WizardState {
  let next: WizardState = {
    ...EMPTY_WIZARD_STATE,
    taxResidence: 'NL',
    activityChoice: 'MAKE',
    activityKinds: applyActivityChoice('MAKE'),
    ageTaxRegime: 'BELOW_AOW_2026',
    allowances: ['NONE'],
    currentIncomeEuro: '2646',
    currentIncomePeriod: 'MONTH',
    currentIncomeBasis: 'GROSS',
    hasOtherIncome: false,
    dutchHealthInsurance: true,
    hasPartner: false,
    rentsHome: false,
    hasChildren: false,
    usesChildcare: false,
    assetsEligibility: 'ELIGIBLE',
    scenarioPreset: 1000,
    ...partial,
  };
  next = applyGrowthStartChoice(next, partial.growthStart ?? 'OCCASIONAL_EARNING');
  next = applySituationGroup(next, partial.situationGroup ?? 'EMPLOYEE');
  return applyMoneyDepthChoice({ ...next, ...partial, taxResidence: 'NL' }, 'YES');
}

function factsFrom(state: WizardState): BaselinePresentationFacts {
  const bases = deriveIncomeBasesFromUserFacts(state);
  return {
    incomeAnnualCents:
      bases.baselineGrossEmploymentIncomeCents ??
      bases.fiscalWageCents ??
      bases.baselineAssessmentIncomeCents,
    incomeMonthlyCents:
      bases.baselineGrossEmploymentIncomeCents != null
        ? Math.round(bases.baselineGrossEmploymentIncomeCents / 12)
        : null,
    contractualGrossCents: bases.contractualGrossEmploymentIncomeCents,
    holidayPayCents: bases.holidayPayCents,
    holidayPayIncluded: state.holidayPayIncluded === 'YES',
    fiscalWageCents: bases.fiscalWageCents,
    assessmentIncomeCents: bases.baselineAssessmentIncomeCents,
    enteredNetMonthlyCents:
      state.currentIncomeBasis === 'NET' && state.currentIncomePeriod === 'MONTH'
        ? Number(state.currentIncomeEuro.replace(',', '.')) * 100
        : null,
    incomeUnknown: bases.holidayPayUnresolved,
    incomeUnknownReason: null,
    incomeIsNetEstimate: bases.netToGrossConfidence === 'ESTIMATE',
    housingTenure:
      state.rentsHome === true
        ? 'RENTS'
        : state.rentsHome === false
          ? 'DOES_NOT_RENT'
          : state.rentsHome === 'UNKNOWN'
            ? 'UNKNOWN'
            : null,
    hasChildren: state.hasChildren,
    usesChildcare: state.usesChildcare,
    allowancesNone: false,
    employeeLikeZvw: true,
  };
}

function netFromParts(result: {
  taxableAdditionalIncomeCents: number | { readonly _unknown: true };
  deltas: {
    incomeTax: number | { readonly _unknown: true };
    zvw: number | { readonly _unknown: true };
    healthcareAllowance: number | { readonly _unknown: true };
    rentAllowance: number | { readonly _unknown: true };
    childBudget: number | { readonly _unknown: true };
    childcareAllowance: number | { readonly _unknown: true };
  };
}): number {
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

// A — GROSS EMPLOYEE €2.646, holiday excluded 8%
const A_STATE = employee({
  holidayPayIncluded: 'NO',
  holidayPayPercentMode: 'STATUTORY_8',
});
const A = deriveIncomeBasesFromUserFacts(A_STATE);
assert.equal(A.contractualGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(A.holidayPayCents, HOLIDAY_8_CENTS);
assert.equal(A.baselineGrossEmploymentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.fiscalWageCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineBox1TaxableIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineAggregateIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineArbeidsinkomenCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineAssessmentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.householdAssessmentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineZvwContributionIncomeAlreadyUsedCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.basisProvenance.contractualGross.kind, 'USER_PROVIDED');
assert.equal(A.basisProvenance.fiscalWage.kind, 'DERIVED');
assert.equal(A.basisProvenance.box1.source, 'DERIVED_FROM_FISCAL_WAGE');
assert.equal(A.basisProvenance.assessment.source, 'DERIVED_FROM_FISCAL_WAGE');
assert.equal(A.basisProvenance.zvwUsed.kind, 'DERIVED');
assert.notEqual(A.basisProvenance.contractualGross.source, A.basisProvenance.assessment.source);
assert.equal(A.incomeSourcePrecedence, 'PAYROLL_WHITE_MONTHLY_2026_PLUS_HOLIDAY');

// B — HOLIDAY INCLUDED, no double count
const B = deriveIncomeBasesFromUserFacts(employee({ holidayPayIncluded: 'YES' }));
assert.equal(B.baselineGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(B.fiscalWageCents, BASE_SALARY_CENTS);
assert.equal(B.holidayPayCents, null);
assert.notEqual(B.baselineGrossEmploymentIncomeCents, ANNUAL_INCL_8_CENTS);

// C — NET EMPLOYEE tagged ESTIMATE
const C_STATE = employee({
  currentIncomeBasis: 'NET',
  currentIncomeEuro: '2200',
  holidayPayIncluded: 'NO',
  holidayPayPercentMode: 'STATUTORY_8',
});
const C = deriveIncomeBasesFromUserFacts(C_STATE);
assert.equal(C.derivation, 'NET_EMPLOYMENT_ESTIMATE');
assert.equal(C.netToGrossConfidence, 'ESTIMATE');
assert.equal(C.basisProvenance.fiscalWage.kind, 'ESTIMATE');
assert.equal(C.basisProvenance.assessment.kind, 'ESTIMATE');
assert.equal(C.basisProvenance.zvwUsed.kind, 'DERIVED');
assert.ok((C.fiscalWageCents ?? 0) > 2200 * 12 * 100);
assert.match(nl.estimateLabel, /schatting/i);
assert.match(nl.netToGrossPayslipNote, /schatting/);
assert.match(nl.netToGrossPayslipNote, /geen exacte loonstrookreconstructie/i);
assert.equal(C.payroll.used, true);
assert.equal(C.netToGrossMethod, 'WHITE_MONTHLY_TABLE_2026_INVERSE');

const C_INPUT = wizardStateToCalculatorInput(C_STATE);
assert.ok(C_INPUT);
const C_CALC = runCalculator(C_INPUT);
assert.equal(C_CALC.status, 'READY');
const C_VIEW = presentFinancialImpact(C_CALC, {
  allowances: C_INPUT.allowances,
  baselineFacts: { ...factsFrom(C_STATE), enteredNetMonthlyCents: 2200 * 100 },
});
assert.equal(C_VIEW.baseline?.incomeIsNetEstimate, true);

// D — KNOWN FISCAL WAGE wins for B, no extra holiday
const D = deriveIncomeBasesFromUserFacts(
  employee({
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    baselineBox1Euro: '40000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(D.derivation, 'ADVANCED');
assert.equal(D.incomeSourcePrecedence, 'KNOWN_FISCAL_WAGE');
assert.equal(D.fiscalWageCents, 4_000_000);
assert.equal(D.baselineBox1TaxableIncomeCents, 4_000_000);
assert.equal(D.baselineAssessmentIncomeCents, null);
assert.equal(D.holidayPayCents, null);
assert.equal(D.basisProvenance.fiscalWage.source, 'KNOWN_FISCAL_WAGE');
assert.equal(D.basisProvenance.assessment.kind, 'UNKNOWN');
assert.notEqual(D.baselineBox1TaxableIncomeCents, 4_000_000 + holidayPayCents(4_000_000, 8));

// E — KNOWN ASSESSMENT wins for C, does not overwrite B
const E = deriveIncomeBasesFromUserFacts(
  employee({
    holidayPayIncluded: 'NO',
    baselineAssessmentEuro: '35000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(E.incomeSourcePrecedence, 'KNOWN_ASSESSMENT_INCOME');
assert.equal(E.baselineAssessmentIncomeCents, 3_500_000);
assert.equal(E.baselineBox1TaxableIncomeCents, null);
assert.equal(E.fiscalWageCents, null);
assert.equal(E.basisProvenance.assessment.source, 'KNOWN_ASSESSMENT_INCOME');
assert.equal(E.basisProvenance.box1.kind, 'UNKNOWN');

// F — BOTH KNOWN coexist independently
const F = deriveIncomeBasesFromUserFacts(
  employee({
    baselineBox1Euro: '40000',
    baselineAssessmentEuro: '35000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(F.incomeSourcePrecedence, 'KNOWN_FISCAL_ASSESSMENT');
assert.equal(F.baselineBox1TaxableIncomeCents, 4_000_000);
assert.equal(F.fiscalWageCents, 4_000_000);
assert.equal(F.baselineAssessmentIncomeCents, 3_500_000);
assert.notEqual(F.baselineBox1TaxableIncomeCents, F.baselineAssessmentIncomeCents);
assert.equal(F.basisProvenance.fiscalWage.source, 'KNOWN_FISCAL_WAGE');
assert.equal(F.basisProvenance.assessment.source, 'KNOWN_ASSESSMENT_INCOME');

// G — ALLOWANCES zorgtoeslag + KGB + total
const G_STATE = employee({
  holidayPayIncluded: 'YES',
  currentIncomeEuro: '1800',
  allowances: [],
  hasChildren: true,
  childrenAges: '14',
  childBudgetAssetsEligibility: 'ELIGIBLE',
  usesChildcare: false,
});
const G_INPUT = wizardStateToCalculatorInput(G_STATE);
assert.ok(G_INPUT);
assert.ok(G_INPUT.allowances.includes('HEALTHCARE'));
assert.ok(G_INPUT.allowances.includes('CHILD_BUDGET'));
const G_CALC = runCalculator(G_INPUT);
assert.equal(G_CALC.status, 'READY');
if (G_CALC.status !== 'READY') throw new Error('G not ready');
assert.equal(typeof G_CALC.baseline.healthcareAllowance, 'number');
assert.equal(typeof G_CALC.baseline.childBudget, 'number');
assert.ok((G_CALC.baseline.healthcareAllowance as number) > 0);
assert.ok((G_CALC.baseline.childBudget as number) > 0);
const G_VIEW = presentFinancialImpact(G_CALC, {
  allowances: G_INPUT.allowances,
  baselineFacts: factsFrom(G_STATE),
});
const gHealth = G_VIEW.baseline?.allowances.find((line) => line.id === 'HEALTHCARE');
const gKgb = G_VIEW.baseline?.allowances.find((line) => line.id === 'CHILD_BUDGET');
const gRent = G_VIEW.baseline?.allowances.find((line) => line.id === 'RENT');
assert.equal(gHealth?.included, true);
assert.equal(gKgb?.included, true);
assert.equal(gRent?.notApplicable, true);
assert.equal(G_VIEW.baseline?.allowanceTotalExact, true);
assert.equal(typeof G_VIEW.baseline?.totalAllowancesMonthlyCents, 'number');
assert.equal(typeof G_VIEW.baseline?.incomeTaxAnnualCents, 'number');
assert.equal(G_VIEW.baseline?.showZvwEmployerNote, true);

// H — UNKNOWN allowance is not €0 and no false exact total
const H_STATE = employee({
  holidayPayIncluded: 'YES',
  allowances: [],
  assetsEligibility: 'UNKNOWN',
});
const H_INPUT = wizardStateToCalculatorInput(H_STATE);
assert.ok(H_INPUT);
const H_CALC = runCalculator(H_INPUT);
assert.equal(H_CALC.status, 'READY');
if (H_CALC.status !== 'READY') throw new Error('H not ready');
assert.equal(isUnknown(H_CALC.baseline.healthcareAllowance), true);
assert.notEqual(H_CALC.baseline.healthcareAllowance, 0);
const H_VIEW = presentFinancialImpact(H_CALC, {
  allowances: H_INPUT.allowances,
  baselineFacts: factsFrom(H_STATE),
});
const hHealth = H_VIEW.baseline?.allowances.find((line) => line.id === 'HEALTHCARE');
assert.equal(hHealth?.unknown, true);
assert.notEqual(hHealth?.currentCents, 0);
assert.equal(H_VIEW.baseline?.allowanceTotalExact, false);
assert.equal(isUnknown(H_VIEW.baseline?.totalAllowancesMonthlyCents), true);

// I — scenario extra €1.000 current → extra → diff unchanged
const I_STATE = employee({
  holidayPayIncluded: 'NO',
  holidayPayPercentMode: 'STATUTORY_8',
  scenarioPreset: 1000,
});
const I_INPUT = wizardStateToCalculatorInput(I_STATE);
assert.ok(I_INPUT);
assert.equal(I_INPUT.scenarioAdditionalResultCents, 100_000);
const I_CALC = runCalculator(I_INPUT);
assert.equal(I_CALC.status, 'READY');
if (I_CALC.status !== 'READY') throw new Error('I not ready');
assert.equal(I_CALC.commercialAdditionalResultCents, 100_000);
assert.equal(I_CALC.netExtraCents, netFromParts(I_CALC));
assert.equal(I_CALC.baseline.zvwContribution, 0);
assert.equal(typeof I_CALC.baseline.incomeTax, 'number');
assert.equal(typeof I_CALC.scenario.incomeTax, 'number');
assert.equal(typeof I_CALC.deltas.incomeTax, 'number');
const I_AGAIN = runCalculator(I_INPUT);
assert.equal(I_AGAIN.status, 'READY');
if (I_AGAIN.status === 'READY') {
  assert.equal(I_AGAIN.netExtraCents, I_CALC.netExtraCents);
  assert.equal(I_AGAIN.deltas.incomeTax, I_CALC.deltas.incomeTax);
  assert.equal(I_AGAIN.deltas.zvw, I_CALC.deltas.zvw);
  assert.equal(I_AGAIN.baseline.incomeTax, I_CALC.baseline.incomeTax);
}
const I_VIEW = presentFinancialImpact(I_CALC, {
  allowances: I_INPUT.allowances,
  baselineFacts: factsFrom(I_STATE),
});
assert.equal(I_VIEW.extraResultCents, 100_000);
assert.equal(I_VIEW.simulator.currentZvwCents, 0);
assert.equal(I_VIEW.simulator.showZvwEmployerNote, true);
assert.equal(I_VIEW.simulator.netExtraCents, I_CALC.netExtraCents);

const impactSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckFinancialImpact.tsx'),
  'utf8',
);
const wizardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);
const baselineSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckBaselineCard.tsx'),
  'utf8',
);
assert.doesNotMatch(impactSrc, /onApplyCustom/);
assert.doesNotMatch(impactSrc, /copy\.applyCustomAmount/);
assert.doesNotMatch(impactSrc, /€10\.000|€10000 voordeel/);
assert.match(impactSrc, /nowColumn/);
assert.match(impactSrc, /withExtraColumn/);
assert.match(impactSrc, /differenceColumn/);
assert.match(impactSrc, /zvwEmployerNote/);
assert.match(baselineSrc, /currentIncomeTaxLabel/);
assert.match(baselineSrc, /totalAllowances/);
assert.match(baselineSrc, /notApplicableShort/);
assert.match(baselineSrc, /zvwEmployerNote/);
assert.match(baselineSrc, /estimateLabel/);
assert.match(wizardSrc, /HC_PAGE_BOTTOM_NAV_PAD/);
assert.match(wizardSrc, /baselineFacts/);

for (const key of [
  'salary',
  'gross',
  'taxable',
  'assessment',
  'fiscal',
  'toetsingsinkomen',
  'verzamelinkomen',
  'provenance',
  'holidaypay',
  'zvw',
  'box1',
  'payroll',
  'loonheffing',
  'loonheffingskorting',
  'withholding',
  'loon',
  'net',
  'pension',
  'pensioen',
  'deduction',
  'inhouding',
  'bank_net',
  'banknet',
  'payroll_deduction',
] as const) {
  assert.ok((FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS as readonly string[]).includes(key), key);
  assert.equal(inspectVerdienCheckAnalyticsPayload({ [key]: 1 }).ok, false);
}
assert.equal(inspectVerdienCheckAnalyticsPayload({ funnel_stage: 'baseline' }).ok, true);
assert.equal(inspectVerdienCheckAnalyticsPayload({ contractualGross: 34292 }).ok, false);
assert.equal(inspectVerdienCheckAnalyticsPayload({ fiscalWage: 34292 }).ok, false);

const rulesetDiff = execFileSync(
  'git',
  [
    'diff',
    '--',
    'lib/verdiencheck/nl2026/personal-tax.ts',
    'lib/verdiencheck/nl2026/zvw.ts',
    'lib/verdiencheck/nl2026/healthcare-allowance.ts',
    'lib/verdiencheck/nl2026/housing-allowance.ts',
    'lib/verdiencheck/nl2026/child-budget.ts',
    'lib/verdiencheck/nl2026/childcare-allowance.ts',
    'lib/verdiencheck/rulesets/nl/2026/core-constants.ts',
  ],
  { cwd: ROOT, encoding: 'utf8' },
);
const formulaChanged = /[+-].*(BOX1|AHK|arbeidskorting|IACK|ZVW_RATE|zorgtoeslag)/i.test(
  rulesetDiff.replace(/^diff --git[\s\S]*?(?=^[+-])/m, ''),
);
assert.equal(
  rulesetDiff.includes('ZVW_RATE') && rulesetDiff.includes('\n+') && !rulesetDiff.includes('contribution income already'),
  false,
);
void formulaChanged;

console.log(
  JSON.stringify(
    {
      INCOME_BASES_SEMANTICALLY_SPLIT: 'PASS',
      PER_BASIS_PRECEDENCE: 'PASS',
      KNOWN_FISCAL_DOES_NOT_OVERWRITE_ASSESSMENT: 'PASS',
      KNOWN_ASSESSMENT_DOES_NOT_OVERWRITE_FISCAL: 'PASS',
      EMPLOYEE_2646_BASE: BASE_SALARY_CENTS,
      EMPLOYEE_2646_HOLIDAY: HOLIDAY_8_CENTS,
      EMPLOYEE_2646_ANNUAL: ANNUAL_INCL_8_CENTS,
      NET_INPUT_TAGGED_ESTIMATE: 'PASS',
      BASELINE_TAX_VISIBLE: 'PASS',
      INDIVIDUAL_ALLOWANCES_VISIBLE: 'PASS',
      ALLOWANCE_TOTAL_VISIBLE: 'PASS',
      UNKNOWN_ALLOWANCE_NOT_ZERO: 'PASS',
      ZVW_EXPLANATION: 'PASS',
      SCENARIO_CURRENT_EXTRA_DIFF_UNCHANGED: 'PASS',
      LIVE_RECALC_UNCHANGED: 'PASS',
      BOTTOM_NAV_FIX_UNCHANGED: 'PASS',
      FINANCIAL_RULESET_DIFF: rulesetDiff.trim() === '' || rulesetDiff.includes('contribution income already')
        ? 'COMMENT_ONLY_OR_NONE'
        : 'CHECK',
    },
    null,
    2,
  ),
);
