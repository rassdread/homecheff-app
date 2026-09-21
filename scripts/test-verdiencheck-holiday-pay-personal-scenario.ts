/**
 * VerdienCheck holiday-pay baseline + personal scenario fixtures.
 *
 *   npx tsx scripts/test-verdiencheck-holiday-pay-personal-scenario.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { estimateGrossFromNetSalary2026 } from '../lib/verdiencheck/nl2026/net-to-gross';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { presentFinancialImpact } from '../lib/verdiencheck/personal-route/financial';
import {
  SRC_HOLIDAY_PAY_2026,
  SRC_TOETSINGSINKOMEN_HOLIDAY_2026,
  SRC_WML_HOLIDAY_PAY_2026,
} from '../lib/verdiencheck/rulesets/nl/2026/sources';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applyRevenueCostHelperFields,
  applySituationGroup,
  clearFinancialDepth,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { deriveIncomeBasesFromUserFacts } from '../lib/verdiencheck/wizard/derive-income-bases';
import {
  holidayPayCents,
  reconstructAnnualWithHolidayPay,
  STATUTORY_HOLIDAY_PAY_PERCENT,
} from '../lib/verdiencheck/wizard/holiday-pay';
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
const baselineSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckBaselineCard.tsx'),
  'utf8',
);
const quickSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckQuickInsight.tsx'),
  'utf8',
);
const engineSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/calculator/engine.ts'),
  'utf8',
);
const box1Src = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/nl2026/personal-tax.ts'), 'utf8');
const zvwSrc = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/nl2026/zvw.ts'), 'utf8');
const nl = getVerdienCheckCopy('nl');

const MONTHLY_GROSS_2646_CENTS = 2646 * 100;
const BASE_SALARY_CENTS = MONTHLY_GROSS_2646_CENTS * 12;
const HOLIDAY_8_CENTS = holidayPayCents(BASE_SALARY_CENTS, 8);
const ANNUAL_INCL_8_CENTS = BASE_SALARY_CENTS + HOLIDAY_8_CENTS;

assert.equal(BASE_SALARY_CENTS, 3_175_200);
assert.equal(HOLIDAY_8_CENTS, 254_016);
assert.equal(ANNUAL_INCL_8_CENTS, 3_429_216);
assert.equal(STATUTORY_HOLIDAY_PAY_PERCENT, 8);

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
    assetsEligibility: 'ELIGIBLE',
    scenarioPreset: 1000,
    ...partial,
  };
  next = applyGrowthStartChoice(next, partial.growthStart ?? 'OCCASIONAL_EARNING');
  next = applySituationGroup(next, partial.situationGroup ?? 'EMPLOYEE');
  return applyMoneyDepthChoice({ ...next, ...partial, taxResidence: 'NL' }, 'YES');
}

assert.match(SRC_HOLIDAY_PAY_2026.officialSourceUrl, /^https:\/\/www\.rijksoverheid\.nl\//);
assert.match(SRC_WML_HOLIDAY_PAY_2026.officialSourceUrl, /^https:\/\/wetten\.overheid\.nl\//);
assert.match(SRC_TOETSINGSINKOMEN_HOLIDAY_2026.officialSourceUrl, /^https:\/\/www\.belastingdienst\.nl\//);

const excl8 = deriveIncomeBasesFromUserFacts(
  employee({
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
  }),
);
assert.equal(excl8.holidayPayUnresolved, false);
assert.equal(excl8.baselineGrossEmploymentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(excl8.baselineBox1TaxableIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(excl8.baselineAssessmentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(excl8.holidayPayCents, HOLIDAY_8_CENTS);
assert.equal(excl8.incomeSourcePrecedence, 'RECONSTRUCTED_MONTHLY_GROSS_PLUS_HOLIDAY');
const excl8Input = wizardStateToCalculatorInput(
  employee({ holidayPayIncluded: 'NO', holidayPayPercentMode: 'STATUTORY_8' }),
);
assert.ok(excl8Input);
assert.equal(excl8Input.baselineBox1TaxableIncomeCents, ANNUAL_INCL_8_CENTS);
const excl8Calc = runCalculator(excl8Input);
assert.equal(excl8Calc.status, 'READY');

const inclMonthly = deriveIncomeBasesFromUserFacts(employee({ holidayPayIncluded: 'YES' }));
assert.equal(inclMonthly.baselineGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(inclMonthly.holidayPayCents, null);
assert.notEqual(inclMonthly.baselineGrossEmploymentIncomeCents, ANNUAL_INCL_8_CENTS);

const annualInclusive = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeEuro: '34292,16',
    currentIncomePeriod: 'YEAR',
    holidayPayIncluded: 'YES',
  }),
);
assert.equal(annualInclusive.baselineGrossEmploymentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(annualInclusive.incomeSourcePrecedence, 'ANNUAL_GROSS_ALREADY_INCLUSIVE');
assert.equal(annualInclusive.holidayPayCents, null);

const custom9 = deriveIncomeBasesFromUserFacts(
  employee({
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'CUSTOM',
    holidayPayCustomPercent: '9',
  }),
);
const holiday9 = holidayPayCents(BASE_SALARY_CENTS, 9);
assert.equal(custom9.holidayPayCents, holiday9);
assert.equal(custom9.baselineGrossEmploymentIncomeCents, BASE_SALARY_CENTS + holiday9);
assert.notEqual(custom9.holidayPayCents, HOLIDAY_8_CENTS);

const unknownHoliday = deriveIncomeBasesFromUserFacts(
  employee({ holidayPayIncluded: 'UNKNOWN' }),
);
assert.equal(unknownHoliday.holidayPayUnresolved, true);
assert.equal(unknownHoliday.baselineBox1TaxableIncomeCents, null);
assert.equal(unknownHoliday.baselineAssessmentIncomeCents, null);
const unknownInput = wizardStateToCalculatorInput(employee({ holidayPayIncluded: 'UNKNOWN' }));
assert.ok(unknownInput);
const unknownCalc = runCalculator(unknownInput);
const unknownImpact = presentFinancialImpact(unknownCalc, { holidayPayUnresolved: true });
assert.equal(unknownImpact.status, 'PARTIAL');
assert.equal(isUnknown(unknownImpact.netExtraCents), true);
assert.notEqual(unknownImpact.netExtraCents, 0);
assert.match(unknownImpact.headline, /vakantiegeld|niet exact/i);

const legacyNull = deriveIncomeBasesFromUserFacts(employee({ holidayPayIncluded: null }));
assert.equal(legacyNull.holidayPayUnresolved, true);
assert.equal(legacyNull.baselineBox1TaxableIncomeCents, null);

const netMonthly = employee({
  currentIncomeBasis: 'NET',
  currentIncomeEuro: '2200',
  holidayPayIncluded: 'NO',
  holidayPayPercentMode: 'STATUTORY_8',
});
const netBases = deriveIncomeBasesFromUserFacts(netMonthly);
assert.equal(netBases.derivation, 'NET_EMPLOYMENT_ESTIMATE');
assert.equal(netBases.netToGrossMethod, 'BINARY_SEARCH_ANNUAL_IB_CREDITS');
assert.equal(netBases.netToGrossConfidence, 'ESTIMATE');
const inverted = estimateGrossFromNetSalary2026({
  netAnnualCents: 2200 * 12 * 100,
  regime: 'BELOW_AOW_2026',
  aowBirthCohort: null,
});
assert.equal(inverted.status, 'OK');
if (inverted.status === 'OK') {
  const reconstructed = reconstructAnnualWithHolidayPay(inverted.grossCents, netMonthly);
  assert.equal(reconstructed.status, 'ADDED');
  assert.equal(netBases.baselineGrossEmploymentIncomeCents, reconstructed.annualCents);
  assert.ok(reconstructed.annualCents > inverted.grossCents);
}
assert.match(nl.estimatedGrossIncomeLabel, /Geschat bruto/);
assert.match(nl.netToGrossPayslipNote, /schatting op basis van de belastingregels/);

const fiscalKnown = deriveIncomeBasesFromUserFacts(
  employee({
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    baselineGrossEmploymentEuro: '40000',
    baselineBox1Euro: '40000',
    baselineAssessmentEuro: '40000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(fiscalKnown.derivation, 'ADVANCED');
assert.equal(fiscalKnown.incomeSourcePrecedence, 'KNOWN_FISCAL_ASSESSMENT');
assert.equal(fiscalKnown.baselineGrossEmploymentIncomeCents, 4_000_000);
assert.equal(fiscalKnown.holidayPayCents, null);
assert.notEqual(fiscalKnown.baselineGrossEmploymentIncomeCents, 4_000_000 + holidayPayCents(4_000_000, 8));

const personalDirect = employee({
  holidayPayIncluded: 'YES',
  scenarioPreset: 'custom',
  customScenarioEuro: '1000',
  scenarioInputMode: 'RESULT',
});
const personalInput = wizardStateToCalculatorInput(personalDirect);
assert.ok(personalInput);
assert.equal(personalInput.scenarioAdditionalResultCents, 100_000);
const personalCalc = runCalculator(personalInput);
assert.equal(personalCalc.status, 'READY');
if (personalCalc.status === 'READY') {
  assert.equal(personalCalc.commercialAdditionalResultCents, 100_000);
  assert.notEqual(personalCalc.commercialAdditionalResultCents, 600_000);
}
const personalImpact = presentFinancialImpact(personalCalc);
assert.notEqual(personalImpact.extraResultCents, 600_000);
assert.equal(personalImpact.extraResultCents, 100_000);
assert.equal(isUnknown(personalImpact.netExtraCents), false);

const helperState = applyRevenueCostHelperFields(
  employee({ holidayPayIncluded: 'YES', scenarioPreset: null, customScenarioEuro: '' }),
  { helperRevenueEuro: '10000', helperCostsEuro: '4000', helperCostsUnknown: false },
);
const helperInput = wizardStateToCalculatorInput(helperState);
const directSix = wizardStateToCalculatorInput(
  employee({
    holidayPayIncluded: 'YES',
    scenarioInputMode: 'RESULT',
    scenarioPreset: 'custom',
    customScenarioEuro: '6000',
  }),
);
assert.ok(helperInput && directSix);
assert.equal(helperInput.scenarioAdditionalResultCents, 600_000);
assert.equal(directSix.scenarioAdditionalResultCents, 600_000);
const helperCalc = runCalculator(helperInput);
const directCalc = runCalculator(directSix);
assert.equal(helperCalc.status, directCalc.status);
if (helperCalc.status === 'READY' && directCalc.status === 'READY') {
  assert.equal(helperCalc.commercialAdditionalResultCents, directCalc.commercialAdditionalResultCents);
  assert.equal(helperCalc.netExtraCents, directCalc.netExtraCents);
  assert.equal(helperCalc.deltas.incomeTax, directCalc.deltas.incomeTax);
  assert.equal(helperCalc.deltas.zvw, directCalc.deltas.zvw);
}

assert.match(nl.whatIf, /van plan extra te verdienen/);
assert.match(nl.steps.scenario?.title ?? '', /van plan extra te verdienen/);
assert.match(nl.holidayPayQuestion, /vakantiegeld al in dit bedrag/);
assert.match(nl.holidayPayUnknownExplain, /minimaal 8%/);
assert.match(impactSrc, /showExample=\{false\}/);
assert.match(wizardSrc, /showExample=\{false\}/);
assert.match(quickSrc, /variant="example"/);
assert.doesNotMatch(impactSrc, /onApplyCustom/);
assert.doesNotMatch(impactSrc, /copy\.applyCustomAmount/);
assert.match(impactSrc, /onCustomChange/);
assert.match(impactSrc, /data-verdiencheck-personal-delta/);
assert.match(impactSrc, /nowColumn/);
assert.match(impactSrc, /withExtraColumn/);
assert.match(impactSrc, /differenceColumn/);
assert.match(wizardSrc, /VerdienCheckHolidayPayFields/);
assert.match(baselineSrc, /estimatedGrossIncomeLabel/);
assert.match(baselineSrc, /netToGrossPayslipNote/);

const restarted = { ...EMPTY_WIZARD_STATE };
assert.equal(restarted.holidayPayIncluded, null);
assert.equal(restarted.holidayPayPercentMode, null);
assert.equal(restarted.holidayPayCustomPercent, '');
const cleared = clearFinancialDepth(
  employee({ holidayPayIncluded: 'NO', holidayPayPercentMode: 'CUSTOM', holidayPayCustomPercent: '9' }),
);
assert.equal(cleared.holidayPayIncluded, null);
assert.equal(cleared.holidayPayCustomPercent, '');

assert.doesNotMatch(engineSrc, /holidayPay/);
assert.equal(box1Src.includes('vakantiegeld'), false);
assert.equal(zvwSrc.includes('vakantiegeld'), false);

console.log(
  JSON.stringify(
    {
      GROSS_MONTHLY_2646_EXCL_8_ANNUAL_CENTS: excl8.baselineGrossEmploymentIncomeCents,
      EXPECTED_ANNUAL_CENTS: ANNUAL_INCL_8_CENTS,
      PERSONAL_EXTRA_1000: personalImpact.extraResultCents,
      REVENUE_COST_PARITY: helperInput.scenarioAdditionalResultCents === directSix.scenarioAdditionalResultCents,
    },
    null,
    2,
  ),
);
console.log('verdiencheck holiday-pay personal scenario tests: PASS');
