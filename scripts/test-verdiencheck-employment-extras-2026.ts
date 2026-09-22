/**
 * VerdienCheck Phase 6 — bonus / 13th month / other taxable employment pay.
 *
 *   npx tsx scripts/test-verdiencheck-employment-extras-2026.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { inspectVerdienCheckAnalyticsPayload } from '../lib/verdiencheck/privacy/analytics-guard';
import {
  buildVerdienCheckShareUrl,
  shareUrlContainsFinancialState,
} from '../lib/verdiencheck/share-url';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import {
  annualEmploymentExtrasCents,
  thirteenthMonthFromContractualMonth,
} from '../lib/verdiencheck/rulesets/nl/2026/employment-extras';
import { SRC_EMPLOYMENT_EXTRAS_2026 } from '../lib/verdiencheck/rulesets/nl/2026/sources';
import {
  deriveIncomeBasesFromUserFacts,
  employmentExtrasEntryValid,
  shouldOfferEmploymentExtras,
  thirteenthMonthHelperAvailable,
} from '../lib/verdiencheck/wizard/derive-income-bases';
import { holidayPayCents } from '../lib/verdiencheck/wizard/holiday-pay';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  visibleSteps,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';

function euro(n: number): number {
  return Math.round(n * 100);
}

function employee(partial: Partial<WizardState> = {}): WizardState {
  let next: WizardState = {
    ...EMPTY_WIZARD_STATE,
    taxResidence: 'NL',
    activityChoice: 'MAKE',
    activityKinds: applyActivityChoice('MAKE'),
    ageTaxRegime: 'BELOW_AOW_2026',
    currentIncomeEuro: '2646',
    currentIncomePeriod: 'MONTH',
    currentIncomeBasis: 'GROSS',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    payrollTaxCredit: 'YES',
    hasOtherIncome: false,
    dutchHealthInsurance: true,
    hasPartner: false,
    hasChildren: false,
    assetsEligibility: 'ELIGIBLE',
    situationGroup: 'EMPLOYEE',
    acceptRowAssumption: true,
    assumeEstimatedCostsTaxDeductible: true,
    scenarioPreset: 1000,
    ...partial,
  };
  next = applyGrowthStartChoice(next, partial.growthStart ?? 'OCCASIONAL_EARNING');
  next = applySituationGroup(next, partial.situationGroup ?? 'EMPLOYEE');
  return applyMoneyDepthChoice({ ...next, ...partial, taxResidence: 'NL' }, 'YES');
}

function withExtras(partial: Partial<WizardState> = {}): WizardState {
  return employee({ payslipAccuracyRequested: true, extraPayStatus: 'PROVIDED', ...partial });
}

assert.equal(NL_2026_PACK.version, '2026.10-company-car');
assert.equal(NL_2026_MODULE_STATUS.employmentExtras, 'CERTIFIED_FOR_EXTRA_EMPLOYMENT_PAY_V1');
assert.equal(SRC_EMPLOYMENT_EXTRAS_2026.officialSourceUrl.includes('handboek-loonheffingen'), true);
assert.match(SRC_EMPLOYMENT_EXTRAS_2026.officialSource, /bijzondere beloningen/);

const ROOT = process.cwd();
const GROSS_2646 = euro(2646);
const BASE_SALARY_CENTS = GROSS_2646 * 12;
const HOLIDAY_8_CENTS = holidayPayCents(BASE_SALARY_CENTS, 8);
const ANNUAL_INCL_8_CENTS = BASE_SALARY_CENTS + HOLIDAY_8_CENTS;
const BONUS_5000 = euro(5000);
const BONUS_2000 = euro(2000);
const OVERTIME_750 = euro(750);

// ---------------------------------------------------------------- rules unit
assert.equal(thirteenthMonthFromContractualMonth(GROSS_2646), GROSS_2646);
assert.equal(thirteenthMonthFromContractualMonth(-1), null);

const none = annualEmploymentExtrasCents({ status: 'NONE' });
assert.equal(none.totalAnnualCents, 0);
assert.equal(none.explicitNone, true);
assert.equal(none.unknown, false);

const unknownExtras = annualEmploymentExtrasCents({ status: 'UNKNOWN' });
assert.equal(unknownExtras.unknown, true);
assert.equal(unknownExtras.explicitNone, false);
assert.equal(unknownExtras.thirteenthMonthAnnualCents, null);
assert.ok(unknownExtras.assumptions.includes('EXTRAS_UNKNOWN_NOT_COUNTED'));

const summed = annualEmploymentExtrasCents({
  status: 'PROVIDED',
  thirteenthMonthAnnualCents: GROSS_2646,
  bonusCommissionAnnualCents: BONUS_2000,
  overtimeOtherAnnualCents: OVERTIME_750,
});
assert.equal(summed.totalAnnualCents, GROSS_2646 + BONUS_2000 + OVERTIME_750);
assert.ok(summed.assumptions.includes('SPECIAL_RATE_WITHHOLDING_IS_PAYROLL_ONLY'));
assert.ok(summed.assumptions.includes('NO_PENSION_DEDUCTION_APPLIED_TO_EXTRAS'));

// -------------------------------------------------- A. no extra pay (frozen)
const A = deriveIncomeBasesFromUserFacts(employee());
assert.equal(A.contractualGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(A.holidayPayCents, HOLIDAY_8_CENTS);
assert.equal(A.fiscalWageCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineGrossEmploymentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineArbeidsinkomenCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineAssessmentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.employmentExtrasCents, null);
assert.equal(A.employmentExtras.status, 'NOT_SUPPLIED');

const explicitNone = deriveIncomeBasesFromUserFacts(
  employee({ payslipAccuracyRequested: true, extraPayStatus: 'NONE' }),
);
assert.equal(explicitNone.fiscalWageCents, ANNUAL_INCL_8_CENTS);
assert.equal(explicitNone.employmentExtrasCents, 0);
assert.equal(explicitNone.employmentExtras.explicitNone, true);

// ------------------------------------------------------------ B. 13th month
const B = deriveIncomeBasesFromUserFacts(withExtras({ thirteenthMonthMode: 'ONE_MONTH' }));
const B_EXPECTED = ANNUAL_INCL_8_CENTS + GROSS_2646;
assert.equal(B.employmentExtrasCents, GROSS_2646);
assert.equal(B.employmentExtras.thirteenthMonthAnnualCents, GROSS_2646);
// Contractual monthly wage must not absorb the extras.
assert.equal(B.contractualGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(B.holidayPayCents, HOLIDAY_8_CENTS);
assert.equal(B.baselineGrossEmploymentIncomeCents, B_EXPECTED);
assert.equal(B.fiscalWageCents, B_EXPECTED);
assert.equal(B.baselineBox1TaxableIncomeCents, B_EXPECTED);
assert.equal(B.baselineArbeidsinkomenCents, B_EXPECTED);
assert.equal(B.baselineAssessmentIncomeCents, B_EXPECTED);
// Payroll cashflow keeps using the ordinary monthly table.
assert.equal(B.payroll.used, true);
assert.equal(B.payroll.estimatedGrossMonthlyCents, A.payroll.estimatedGrossMonthlyCents);
assert.equal(B.payroll.withheldPayrollTaxCents, A.payroll.withheldPayrollTaxCents);

const B_AMOUNT = deriveIncomeBasesFromUserFacts(
  withExtras({ thirteenthMonthMode: 'AMOUNT', thirteenthMonthEuro: '2646' }),
);
assert.equal(B_AMOUNT.fiscalWageCents, B_EXPECTED);

// ----------------------------------------------------------------- C. bonus
const C = deriveIncomeBasesFromUserFacts(
  withExtras({ thirteenthMonthMode: 'NONE', bonusCommissionEuro: '5000' }),
);
const C_EXPECTED = ANNUAL_INCL_8_CENTS + BONUS_5000;
assert.equal(C.employmentExtrasCents, BONUS_5000);
assert.equal(C.fiscalWageCents, C_EXPECTED);
assert.equal(C.baselineBox1TaxableIncomeCents, C_EXPECTED);
assert.equal(C.baselineArbeidsinkomenCents, C_EXPECTED);
assert.equal(C.baselineAssessmentIncomeCents, C_EXPECTED);
assert.equal(C.baselineZvwContributionIncomeAlreadyUsedCents, C_EXPECTED);
assert.equal(C.basisProvenance.arbeidsinkomen.kind, 'DERIVED');

// ARBEIDSINKOMEN invariant: employment tax credits see the same wage as Box 1.
for (const bases of [A, B, C]) {
  assert.equal(bases.baselineArbeidsinkomenCents, bases.baselineBox1TaxableIncomeCents);
  assert.equal(bases.baselineArbeidsinkomenCents, bases.fiscalWageCents);
}

// -------------------------------------------------------- D. multiple extras
const D = deriveIncomeBasesFromUserFacts(
  withExtras({
    thirteenthMonthMode: 'ONE_MONTH',
    bonusCommissionEuro: '2000',
    overtimeOtherPayEuro: '750',
  }),
);
const D_EXTRAS = GROSS_2646 + BONUS_2000 + OVERTIME_750;
assert.equal(D.employmentExtrasCents, D_EXTRAS);
assert.equal(D.fiscalWageCents, ANNUAL_INCL_8_CENTS + D_EXTRAS);
// Summed exactly once, no component counted twice anywhere downstream.
assert.equal(
  D.fiscalWageCents! - A.fiscalWageCents!,
  D.employmentExtras.thirteenthMonthAnnualCents! +
    D.employmentExtras.bonusCommissionAnnualCents! +
    D.employmentExtras.overtimeOtherAnnualCents!,
);

// ------------------------------------------------------- E. pension + bonus
const PENSION_MONTHLY = euro(150);
const pensionOnly = deriveIncomeBasesFromUserFacts(
  employee({ pensionDeductionStatus: 'AMOUNT', pensionDeductionEuro: '150' }),
);
const E = deriveIncomeBasesFromUserFacts(
  withExtras({
    pensionDeductionStatus: 'AMOUNT',
    pensionDeductionEuro: '150',
    thirteenthMonthMode: 'NONE',
    bonusCommissionEuro: '5000',
  }),
);
assert.equal(pensionOnly.fiscalWageCents, ANNUAL_INCL_8_CENTS - PENSION_MONTHLY * 12);
// Only the regular payroll pension is deducted; nothing is invented on the bonus.
assert.equal(E.fiscalWageCents, pensionOnly.fiscalWageCents! + BONUS_5000);
assert.equal(E.baselineArbeidsinkomenCents, E.fiscalWageCents);
assert.equal(E.payroll.employeePensionCents, PENSION_MONTHLY);
assert.equal(E.payroll.bankNetMonthlyCents, pensionOnly.payroll.bankNetMonthlyCents);
assert.equal(E.basisProvenance.fiscalWage.kind, 'ESTIMATE');

// --------------------------------------------------------- F. owner + bonus
const ownerNoBonus = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'AMOUNT',
    deductibleMortgageInterestEuro: '8000',
  }),
);
const F = deriveIncomeBasesFromUserFacts(
  withExtras({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'AMOUNT',
    deductibleMortgageInterestEuro: '8000',
    thirteenthMonthMode: 'NONE',
    bonusCommissionEuro: '5000',
  }),
);
const ownerAdjustment = ownerNoBonus.ownerHome.netOwnHomeBox1AdjustmentCents;
assert.ok(ownerAdjustment != null && ownerAdjustment !== 0);
// Bonus enters the employment wage first; the housing adjustment stays downstream.
assert.equal(F.fiscalWageCents, C_EXPECTED);
assert.equal(F.baselineBox1TaxableIncomeCents, C_EXPECTED + ownerAdjustment!);
assert.equal(F.baselineAssessmentIncomeCents, C_EXPECTED + ownerAdjustment!);
assert.equal(
  F.baselineBox1TaxableIncomeCents! - ownerNoBonus.baselineBox1TaxableIncomeCents!,
  BONUS_5000,
);

// ------------------------------------------------- G. known fiscal wage wins
const G = deriveIncomeBasesFromUserFacts(
  withExtras({
    baselineGrossEmploymentEuro: '40000',
    thirteenthMonthMode: 'ONE_MONTH',
    bonusCommissionEuro: '5000',
    overtimeOtherPayEuro: '750',
  }),
);
assert.equal(G.derivation, 'ADVANCED');
assert.equal(G.fiscalWageCents, euro(40000));
assert.equal(G.baselineGrossEmploymentIncomeCents, euro(40000));
assert.equal(G.employmentExtrasCents, null);
assert.equal(G.employmentExtras.status, 'NOT_SUPPLIED');
assert.equal(G.holidayPayCents, null);
assert.equal(G.basisProvenance.fiscalWage.kind, 'USER_PROVIDED');

// -------------------------------------------------- H. known assessment wins
const H = deriveIncomeBasesFromUserFacts(
  withExtras({
    baselineAssessmentEuro: '35000',
    thirteenthMonthMode: 'NONE',
    bonusCommissionEuro: '5000',
  }),
);
assert.equal(H.baselineAssessmentIncomeCents, euro(35000));
assert.equal(H.employmentExtrasCents, null);
assert.equal(H.basisProvenance.assessment.source, 'KNOWN_ASSESSMENT_INCOME');

// ------------------------------------------------------- I. allowance effect
function healthcareAllowanceAnnual(state: WizardState): number | null {
  const input = wizardStateToCalculatorInput(state);
  if (!input) return null;
  const result = runCalculator(input);
  if (result.status !== 'READY') return null;
  const value = result.baseline.healthcareAllowance;
  return typeof value === 'number' ? value : null;
}

const allowanceBase: Partial<WizardState> = {
  currentIncomeEuro: '2100',
  rentsHome: false,
  housingTenure: 'OTHER',
  hasChildren: false,
  usesChildcare: false,
  allowances: [],
};
const ztWithoutBonus = healthcareAllowanceAnnual(employee(allowanceBase));
const ztWithBonus = healthcareAllowanceAnnual(
  withExtras({ ...allowanceBase, thirteenthMonthMode: 'NONE', bonusCommissionEuro: '5000' }),
);
assert.ok(ztWithoutBonus != null && ztWithBonus != null);
// Higher assessment income from the bonus lowers zorgtoeslag via the existing engine.
assert.ok(ztWithBonus! < ztWithoutBonus!);

// ------------------------------------------- J. HomeCheff extra on top of it
const scenarioState = withExtras({
  thirteenthMonthMode: 'NONE',
  bonusCommissionEuro: '5000',
  scenarioLayerRequested: true,
  scenarioPreset: 1000,
});
const scenarioInput = wizardStateToCalculatorInput(scenarioState);
assert.ok(scenarioInput);
assert.equal(scenarioInput!.baselineBox1TaxableIncomeCents, C_EXPECTED);
assert.equal(scenarioInput!.baselineArbeidsinkomenCents, C_EXPECTED);
const scenarioResult = runCalculator(scenarioInput!);
assert.equal(scenarioResult.status, 'READY');
if (scenarioResult.status !== 'READY') throw new Error('scenario');
// The bonus belongs to NU, not to the HomeCheff delta.
assert.equal(scenarioResult.scenario.commercialResultCents, euro(1000));
assert.equal(scenarioResult.baseline.commercialResultCents, 0);
assert.ok(
  typeof scenarioResult.baseline.incomeTax === 'number' &&
    typeof scenarioResult.scenario.incomeTax === 'number' &&
    scenarioResult.scenario.incomeTax > scenarioResult.baseline.incomeTax,
);

// ------------------------------------------------------------- UNKNOWN != €0
const unknownState = employee({ payslipAccuracyRequested: true, extraPayStatus: 'UNKNOWN' });
const U = deriveIncomeBasesFromUserFacts(unknownState);
assert.equal(U.employmentExtrasCents, null);
assert.equal(U.employmentExtras.status, 'UNKNOWN');
assert.equal(U.fiscalWageCents, ANNUAL_INCL_8_CENTS);
assert.equal(U.basisProvenance.fiscalWage.kind, 'ESTIMATE');

// "Ja" without any usable component stays unknown rather than a factual zero.
const emptyProvided = deriveIncomeBasesFromUserFacts(withExtras());
assert.equal(emptyProvided.employmentExtrasCents, null);
assert.equal(emptyProvided.employmentExtras.unknown, true);
assert.equal(employmentExtrasEntryValid(withExtras()), false);
assert.equal(employmentExtrasEntryValid(withExtras({ bonusCommissionEuro: '5000' })), true);
assert.equal(employmentExtrasEntryValid(withExtras({ bonusCommissionEuro: 'abc' })), false);

// ------------------------------------------------------------ net input path
const netWithBonus = deriveIncomeBasesFromUserFacts(
  withExtras({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    netDepositKind: 'BANK_NET',
    thirteenthMonthMode: 'NONE',
    bonusCommissionEuro: '5000',
  }),
);
const netNoBonus = deriveIncomeBasesFromUserFacts(
  employee({ currentIncomeBasis: 'NET', currentIncomeEuro: '2200', netDepositKind: 'BANK_NET' }),
);
assert.equal(
  netWithBonus.fiscalWageCents! - netNoBonus.fiscalWageCents!,
  BONUS_5000,
);
assert.equal(netWithBonus.payroll.estimatedGrossMonthlyCents, netNoBonus.payroll.estimatedGrossMonthlyCents);
assert.equal(netWithBonus.basisProvenance.fiscalWage.kind, 'ESTIMATE');

// ---------------------------------------------------- holiday pay unchanged
for (const bases of [B, C, D, E, F]) {
  assert.equal(bases.holidayPayCents, HOLIDAY_8_CENTS);
}
const holidayIncluded = deriveIncomeBasesFromUserFacts(
  withExtras({ holidayPayIncluded: 'YES', thirteenthMonthMode: 'NONE', bonusCommissionEuro: '5000' }),
);
assert.equal(holidayIncluded.holidayPayCents, null);
assert.equal(holidayIncluded.fiscalWageCents, BASE_SALARY_CENTS + BONUS_5000);

// ------------------------------------------------------------- flow / copy
const defaultSteps = visibleSteps(employee({ moneyDepthRequested: true }));
assert.equal(defaultSteps.includes('employmentExtras'), false);
assert.equal(
  visibleSteps(employee({ moneyDepthRequested: true, payslipAccuracyRequested: true })).includes(
    'employmentExtras',
  ),
  true,
);
assert.equal(shouldOfferEmploymentExtras(employee()), true);
assert.equal(shouldOfferEmploymentExtras(employee({ baselineGrossEmploymentEuro: '40000' })), false);
assert.equal(thirteenthMonthHelperAvailable(employee()), true);

const nl = getVerdienCheckCopy('nl');
const en = getVerdienCheckCopy('en');
assert.equal(nl.extraPayQuestion, 'Krijg je naast je gewone salaris nog ander belastbaar loon?');
assert.match(nl.extraPayGrossHint, /bruto bedrag/);
assert.match(nl.extraPaySpecialRateNote, /bijzonder loonheffingstarief/);
assert.match(nl.overtimeOtherPayHelp, /belast overwerk/);
assert.equal(nl.extraPayNotIncluded, 'Extra loon niet meegenomen');
assert.ok(en.extraPayQuestion.length > 0);
assert.ok(nl.steps.employmentExtras?.title === 'Extra loon');
assert.match(nl.steps.employmentExtras!.help!, /Vakantiegeld/);
// Holiday pay and extra pay stay distinct in the UI wording.
assert.notEqual(nl.holidayPayAmountLabel, nl.extraPayLabel);

const wizardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);
const cardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckBaselineCard.tsx'),
  'utf8',
);
assert.match(wizardSrc, /step === 'employmentExtras'/);
assert.match(wizardSrc, /thirteenthMonthHelperAvailable/);
assert.match(cardSrc, /viewExtraPayBreakdown/);
assert.match(cardSrc, /extraPayNotIncluded/);
assert.doesNotMatch(cardSrc, /Bonus €0/);

// ---------------------------------------------------------------- privacy
for (const key of [
  'bonus',
  'commission',
  'commissie',
  'overtime',
  'overwerk',
  'thirteenth',
  '13th',
  'dertiende',
  'eindejaarsuitkering',
  'extra_wage',
  'extra_pay',
] as const) {
  assert.equal(inspectVerdienCheckAnalyticsPayload({ [key]: 1 }).ok, false, key);
}
// Legitimate non-financial events stay allowed.
assert.equal(
  inspectVerdienCheckAnalyticsPayload({
    entry_point: 'direct',
    progress_bucket: 'MIDDLE',
    funnel_stage: 'baseline',
  }).ok,
  true,
);
assert.equal(
  shareUrlContainsFinancialState('https://homecheff.eu/verdiencheck?bonus=5000'),
  true,
);
assert.equal(
  shareUrlContainsFinancialState('https://homecheff.eu/verdiencheck?extra_pay=1'),
  true,
);
assert.equal(shareUrlContainsFinancialState(buildVerdienCheckShareUrl({})), false);

console.log('PASS test-verdiencheck-employment-extras-2026');
console.log(
  JSON.stringify(
    {
      NO_EXTRA_PAY_FIXTURE: A.fiscalWageCents,
      THIRTEENTH_MONTH_FIXTURE: B.fiscalWageCents,
      BONUS_FIXTURE: C.fiscalWageCents,
      MULTIPLE_EXTRAS_FIXTURE: D.fiscalWageCents,
      PENSION_PLUS_BONUS: E.fiscalWageCents,
      OWNER_PLUS_BONUS: F.baselineBox1TaxableIncomeCents,
      KNOWN_FISCAL_PRECEDENCE: G.fiscalWageCents,
      KNOWN_ASSESSMENT_PRECEDENCE: H.baselineAssessmentIncomeCents,
      ALLOWANCE_ZT_WITHOUT: ztWithoutBonus,
      ALLOWANCE_ZT_WITH: ztWithBonus,
      SCENARIO_ADDITIONAL: scenarioResult.scenario.commercialResultCents,
      UNKNOWN_NOT_ZERO: U.employmentExtrasCents === null,
      SPECIAL_RATE_TABLE_IMPLEMENTED: false,
      EXTRA_WAGE_SOURCE: SRC_EMPLOYMENT_EXTRAS_2026.officialSourceUrl,
    },
    null,
    2,
  ),
);
