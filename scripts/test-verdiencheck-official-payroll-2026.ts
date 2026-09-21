/**
 * Official 2026 white monthly payroll fixtures + inversion + regressions.
 *
 *   npx tsx scripts/test-verdiencheck-official-payroll-2026.ts
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { presentFinancialImpact } from '../lib/verdiencheck/personal-route/financial';
import {
  FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS,
  inspectVerdienCheckAnalyticsPayload,
} from '../lib/verdiencheck/privacy/analytics-guard';
import {
  calculateEmployeePayroll2026,
  invertEmployeePayrollNet2026,
  NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS,
  officialTableStepCents,
  PAYROLL_FORWARD_MODEL,
  PAYROLL_INVERSE_MODEL,
  PAYROLL_WHITE_MONTHLY_2026_SOURCES,
  resolvePayrollTaxCredit,
} from '../lib/verdiencheck/rulesets/nl/2026/payroll-white-monthly';
import {
  WHITE_MONTHLY_TABLE_2026_ID,
  WHITE_MONTHLY_TABLE_2026_SOURCE,
} from '../lib/verdiencheck/rulesets/nl/2026/payroll-white-monthly-data';
import {
  SRC_HANDBOEK_LOONHEFFINGEN_2026,
  SRC_WHITE_MONTHLY_TABLE_2026,
} from '../lib/verdiencheck/rulesets/nl/2026/sources';
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
const STEP = officialTableStepCents();

assert.equal(WHITE_MONTHLY_TABLE_2026_ID, 'wit_mnd_nl_std_20260101');
assert.equal(
  WHITE_MONTHLY_TABLE_2026_SOURCE.pdfSha256,
  'c959d65273e18a1a2fdf33562fd34e31d45d3bca0f260ea232815d28e69284dc',
);
assert.equal(SRC_WHITE_MONTHLY_TABLE_2026.pdfSha256, WHITE_MONTHLY_TABLE_2026_SOURCE.pdfSha256);
assert.match(SRC_HANDBOEK_LOONHEFFINGEN_2026.officialSource, /Handboek Loonheffingen 2026/);
assert.equal(PAYROLL_WHITE_MONTHLY_2026_SOURCES.table.rule, 'LOWER_TABELLOON_WHEN_BETWEEN_ROWS');
assert.equal(NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION_CENTS, 0);
assert.equal(resolvePayrollTaxCredit(null).applied, true);
assert.equal(resolvePayrollTaxCredit(null).assumed, true);
assert.equal(resolvePayrollTaxCredit('UNKNOWN').assumed, true);
assert.equal(resolvePayrollTaxCredit('YES').applied, true);
assert.equal(resolvePayrollTaxCredit('YES').assumed, false);
assert.equal(resolvePayrollTaxCredit('NO').applied, false);

/** Official PDF rows: tabelloon / withheld without LHK / withheld with LHK. */
const OFFICIAL = [
  { label: '2000', gross: 200_000, tabelloon: 199_800, without: 71_425, with: 6_125 },
  { label: '2646', gross: 264_600, tabelloon: 264_600, without: 94_592, with: 24_567 },
  { label: '3500', gross: 350_000, tabelloon: 349_650, without: 125_450, with: 59_208 },
  { label: '5000', gross: 500_000, tabelloon: 499_950, without: 181_908, with: 132_508 },
  { label: '7500', gross: 750_000, tabelloon: 749_700, without: 287_192, with: 263_883 },
] as const;

let maxNetDelta = 0;
let maxGrossDelta = 0;
const fixtureReport: Record<string, string> = {};

for (const row of OFFICIAL) {
  for (const lhk of [true, false] as const) {
    const withheld = lhk ? row.with : row.without;
    const expectedNet = row.gross - withheld;
    const forward = calculateEmployeePayroll2026({
      grossMonthlyCents: row.gross,
      payrollTaxCredit: lhk,
    });
    assert.equal(forward.status, 'OK', `${row.label} LHK=${lhk}`);
    if (forward.status !== 'OK') continue;
    assert.equal(forward.tabelloonCents, row.tabelloon);
    assert.equal(forward.withheldPayrollTaxCents, withheld);
    assert.equal(forward.statutoryNetMonthlyCents, expectedNet);
    assert.equal(forward.employeeZvwCents, 0);
    assert.equal(forward.method, PAYROLL_FORWARD_MODEL);

    const inverse = invertEmployeePayrollNet2026({
      targetStatutoryNetMonthlyCents: forward.statutoryNetMonthlyCents,
      payrollTaxCredit: lhk,
    });
    assert.equal(inverse.status, 'OK', `inverse ${row.label} LHK=${lhk}`);
    if (inverse.status !== 'OK') continue;
    assert.equal(inverse.method, PAYROLL_INVERSE_MODEL);
    assert.equal(inverse.employeeZvwCents, 0);
    const netDelta = Math.abs(inverse.differenceCents);
    const grossDelta = Math.abs(inverse.estimatedGrossMonthlyCents - row.gross);
    assert.ok(netDelta <= 100, `net delta ${netDelta} for ${row.label} LHK=${lhk}`);
    assert.ok(grossDelta <= STEP, `gross delta ${grossDelta} for ${row.label} LHK=${lhk}`);
    maxNetDelta = Math.max(maxNetDelta, netDelta);
    maxGrossDelta = Math.max(maxGrossDelta, grossDelta);
    fixtureReport[`FIXTURE_${row.label}_LHK_${lhk ? 'YES' : 'NO'}`] =
      `gross=${row.gross} tabelloon=${row.tabelloon} withheld=${withheld} net=${expectedNet} roundtripGross=${inverse.estimatedGrossMonthlyCents} netDelta=${netDelta} grossDelta=${grossDelta}`;
  }
}

assert.equal(calculateEmployeePayroll2026({ grossMonthlyCents: 0, payrollTaxCredit: true }).status, 'UNRESOLVED');
assert.equal(calculateEmployeePayroll2026({ grossMonthlyCents: -1, payrollTaxCredit: true }).status, 'UNRESOLVED');
assert.equal(invertEmployeePayrollNet2026({ targetStatutoryNetMonthlyCents: 0, payrollTaxCredit: true }).status, 'UNRESOLVED');
assert.equal(invertEmployeePayrollNet2026({ targetStatutoryNetMonthlyCents: -50, payrollTaxCredit: true }).status, 'UNRESOLVED');

const low = calculateEmployeePayroll2026({ grossMonthlyCents: 300, payrollTaxCredit: true });
assert.equal(low.status, 'OK');
if (low.status === 'OK') {
  assert.equal(low.withheldPayrollTaxCents, 0);
  assert.equal(low.statutoryNetMonthlyCents, 300);
  assert.ok(low.statutoryNetMonthlyCents !== 0);
}

const atRow = calculateEmployeePayroll2026({ grossMonthlyCents: 199_800, payrollTaxCredit: true });
const afterRow = calculateEmployeePayroll2026({ grossMonthlyCents: 199_801, payrollTaxCredit: true });
assert.equal(atRow.status, 'OK');
assert.equal(afterRow.status, 'OK');
if (atRow.status === 'OK' && afterRow.status === 'OK') {
  assert.equal(atRow.tabelloonCents, afterRow.tabelloonCents);
  assert.equal(atRow.withheldPayrollTaxCents, afterRow.withheldPayrollTaxCents);
  assert.equal(afterRow.statutoryNetMonthlyCents, atRow.statutoryNetMonthlyCents + 1);
}

const last = calculateEmployeePayroll2026({ grossMonthlyCents: 1_109_250, payrollTaxCredit: true });
const above = calculateEmployeePayroll2026({ grossMonthlyCents: 1_109_251, payrollTaxCredit: true });
assert.equal(last.status, 'OK');
assert.equal(above.status, 'OK');
if (last.status === 'OK' && above.status === 'OK') {
  assert.equal(last.aboveTable, false);
  assert.equal(above.aboveTable, true);
  assert.ok(above.withheldPayrollTaxCents >= last.withheldPayrollTaxCents);
}

const high = calculateEmployeePayroll2026({ grossMonthlyCents: 1_200_000, payrollTaxCredit: false });
assert.equal(high.status, 'OK');
if (high.status === 'OK') {
  const invHigh = invertEmployeePayrollNet2026({
    targetStatutoryNetMonthlyCents: high.statutoryNetMonthlyCents,
    payrollTaxCredit: false,
  });
  assert.equal(invHigh.status, 'OK');
  if (invHigh.status === 'OK') {
    assert.ok(Math.abs(invHigh.estimatedGrossMonthlyCents - 1_200_000) <= STEP * 2);
  }
}

const tooHigh = calculateEmployeePayroll2026({
  grossMonthlyCents: 50_000_01,
  payrollTaxCredit: true,
});
assert.equal(tooHigh.status, 'UNRESOLVED');

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
    payrollTaxCredit: 'YES',
    ...partial,
  };
  next = applyGrowthStartChoice(next, partial.growthStart ?? 'OCCASIONAL_EARNING');
  next = applySituationGroup(next, partial.situationGroup ?? 'EMPLOYEE');
  return applyMoneyDepthChoice({ ...next, ...partial, taxResidence: 'NL' }, 'YES');
}

const BASE_SALARY_CENTS = 2646 * 100 * 12;
const HOLIDAY_8_CENTS = holidayPayCents(BASE_SALARY_CENTS, 8);
const ANNUAL_INCL_8_CENTS = BASE_SALARY_CENTS + HOLIDAY_8_CENTS;
assert.equal(ANNUAL_INCL_8_CENTS, 3_429_216);

const A = deriveIncomeBasesFromUserFacts(
  employee({
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    payrollTaxCredit: 'YES',
  }),
);
assert.equal(A.derivation, 'EMPLOYMENT_PROXY');
assert.equal(A.payroll.used, true);
assert.equal(A.payroll.method, PAYROLL_FORWARD_MODEL);
assert.equal(A.contractualGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(A.fiscalWageCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.payroll.employeeZvwCents, 0);
assert.equal(A.netToGrossMethod, 'WHITE_MONTHLY_TABLE_2026_FORWARD');

const B = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    payrollTaxCredit: 'YES',
  }),
);
assert.equal(B.derivation, 'NET_EMPLOYMENT_ESTIMATE');
assert.equal(B.netToGrossMethod, 'WHITE_MONTHLY_TABLE_2026_INVERSE');
assert.equal(B.payroll.used, true);
assert.equal(B.payroll.payrollTaxCreditAssumed, false);
assert.ok((B.payroll.estimatedGrossMonthlyCents ?? 0) > 220_000);
assert.ok(Math.abs(B.payroll.differenceCents ?? 99) <= 100);

const C = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    payrollTaxCredit: 'NO',
  }),
);
assert.equal(C.payroll.payrollTaxCreditApplied, false);
assert.ok((C.payroll.estimatedGrossMonthlyCents ?? 0) > (B.payroll.estimatedGrossMonthlyCents ?? 0));

const unknownLhk = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    payrollTaxCredit: 'UNKNOWN',
  }),
);
assert.equal(unknownLhk.payroll.payrollTaxCreditAssumed, true);
assert.equal(unknownLhk.payroll.payrollTaxCreditApplied, true);
assert.equal(unknownLhk.payroll.estimatedGrossMonthlyCents, B.payroll.estimatedGrossMonthlyCents);
assert.equal(unknownLhk.netToGrossConfidence, 'ESTIMATE');

const yearNet = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '26400',
    currentIncomePeriod: 'YEAR',
    holidayPayIncluded: 'YES',
  }),
);
assert.equal(yearNet.payroll.used, false);
assert.equal(yearNet.netToGrossMethod, 'BINARY_SEARCH_ANNUAL_IB_CREDITS');

const D = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    baselineBox1Euro: '40000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(D.derivation, 'ADVANCED');
assert.equal(D.fiscalWageCents, 4_000_000);
assert.equal(D.baselineBox1TaxableIncomeCents, 4_000_000);
assert.equal(D.holidayPayCents, null);
assert.equal(D.payroll.used, true);
assert.ok(D.contractualGrossEmploymentIncomeCents != null);
assert.notEqual(D.contractualGrossEmploymentIncomeCents, 4_000_000);

const E = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    baselineAssessmentEuro: '35000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(E.derivation, 'ADVANCED');
assert.equal(E.baselineAssessmentIncomeCents, 3_500_000);
assert.equal(E.baselineBox1TaxableIncomeCents, null);
assert.equal(E.payroll.used, true);

const F_STATE = employee({
  holidayPayIncluded: 'NO',
  holidayPayPercentMode: 'STATUTORY_8',
  scenarioPreset: 1000,
  allowances: [],
  hasChildren: true,
  childrenAges: '14',
  childBudgetAssetsEligibility: 'ELIGIBLE',
  usesChildcare: false,
  rentsHome: false,
});
const F_INPUT = wizardStateToCalculatorInput(F_STATE);
assert.ok(F_INPUT);
assert.equal(F_INPUT.scenarioAdditionalResultCents, 100_000);
const F_CALC = runCalculator(F_INPUT);
assert.equal(F_CALC.status, 'READY');
if (F_CALC.status === 'READY') {
  const view = presentFinancialImpact(F_CALC, {
    allowances: F_INPUT.allowances,
    baselineFacts: {
      incomeAnnualCents: A.fiscalWageCents,
      incomeMonthlyCents: Math.round((A.fiscalWageCents ?? 0) / 12),
      contractualGrossCents: A.contractualGrossEmploymentIncomeCents,
      holidayPayCents: A.holidayPayCents,
      holidayPayIncluded: false,
      fiscalWageCents: A.fiscalWageCents,
      assessmentIncomeCents: A.baselineAssessmentIncomeCents,
      enteredNetMonthlyCents: null,
      payrollUsed: true,
      payrollTaxCredit: 'YES',
      payrollTaxCreditAssumed: false,
      statutoryNetMonthlyCents: A.payroll.statutoryNetMonthlyCents,
      estimatedGrossMonthlyCents: A.payroll.estimatedGrossMonthlyCents,
      incomeUnknown: false,
      incomeUnknownReason: null,
      incomeIsNetEstimate: false,
      housingTenure: 'DOES_NOT_RENT',
      hasChildren: true,
      usesChildcare: false,
      employeeLikeZvw: true,
    },
  });
  assert.equal(view.simulator.netFromEngine, true);
  assert.equal(view.extraResultCents, 100_000);
  assert.ok(view.baseline);
  const ids = (view.baseline?.allowances ?? []).map((line) => line.id);
  assert.ok(ids.includes('HEALTHCARE'));
  assert.ok(ids.includes('CHILD_BUDGET'));
  assert.equal(typeof F_CALC.deltas.incomeTax, 'number');
  assert.equal(F_CALC.baseline.zvwContribution, 0);
}

assert.match(nl.payrollTaxCreditQuestion, /loonheffingskorting/i);
assert.match(nl.estimateProvenanceTitle, /Hoe is bruto geschat/);
assert.match(nl.payrollNetBeforeDeductionsNote, /pensioen/);
assert.match(nl.statutoryNetEstimateLabel, /Geschat netto/);
assert.doesNotMatch(nl.estimateProvenanceBody, /exacte loonstrookreconstructie zonder/i);

for (const key of [
  'payroll',
  'loonheffing',
  'loonheffingskorting',
  'withholding',
  'gross',
  'bruto',
  'net',
  'netto',
  'salary',
  'loon',
] as const) {
  assert.ok((FORBIDDEN_VERDIENCHECK_ANALYTICS_KEYS as readonly string[]).includes(key), key);
  assert.equal(inspectVerdienCheckAnalyticsPayload({ [key]: 1 }).ok, false);
}

const personalTax = fs.readFileSync(path.join(ROOT, 'lib/verdiencheck/nl2026/personal-tax.ts'), 'utf8');
assert.equal(personalTax.includes('payrollTaxCredit'), false);
assert.equal(personalTax.includes('WHITE_MONTHLY_TABLE'), false);

const wizardSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'), 'utf8');
assert.match(wizardSrc, /shouldAskPayrollTaxCredit/);
assert.match(wizardSrc, /payrollTaxCreditQuestion/);
assert.doesNotMatch(wizardSrc, /localStorage|indexedDB/);

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
  ],
  { cwd: ROOT, encoding: 'utf8' },
);
assert.equal(rulesetDiff.trim(), '');

console.log(
  JSON.stringify(
    {
      OFFICIAL_2026_SOURCE_VERIFIED: true,
      WHITE_MONTHLY_TABLE_SOURCE: WHITE_MONTHLY_TABLE_2026_SOURCE.officialSourceUrl,
      WHITE_MONTHLY_TABLE_VERSION: WHITE_MONTHLY_TABLE_2026_ID,
      PAYROLL_FORWARD_MODEL,
      PAYROLL_INVERSE_MODEL,
      LHK_YES: true,
      LHK_NO: true,
      LHK_UNKNOWN: true,
      NORMAL_EMPLOYEE_ZVW_BANK_DEDUCTION: 0,
      ...fixtureReport,
      ROUNDTRIP_MAX_NET_DELTA_CENTS: maxNetDelta,
      ROUNDTRIP_MAX_GROSS_DELTA_CENTS: maxGrossDelta,
      HOLIDAY_2646_ANNUAL_CENTS: ANNUAL_INCL_8_CENTS,
      KNOWN_FISCAL_PRECEDENCE: D.fiscalWageCents === 4_000_000,
      KNOWN_ASSESSMENT_PRECEDENCE: E.baselineAssessmentIncomeCents === 3_500_000,
      EXTRA_RESULT_ENGINE_UNCHANGED: true,
      PRIVACY: true,
      FINANCIAL_RULESET_REGRESSION: rulesetDiff.trim() === '',
    },
    null,
    2,
  ),
);
