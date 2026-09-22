/**
 * VerdienCheck Phase 5 — pension + actual bank net.
 *
 *   npx tsx scripts/test-verdiencheck-pension-bank-net-2026.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { calculateHealthcareAllowance2026 } from '../lib/verdiencheck/nl2026/healthcare-allowance';
import { inspectVerdienCheckAnalyticsPayload } from '../lib/verdiencheck/privacy/analytics-guard';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import {
  calculateEmployeePayslip2026,
  invertEmployeePayslipNet2026,
} from '../lib/verdiencheck/rulesets/nl/2026/employee-payslip';
import {
  calculateEmployeePayroll2026,
  invertEmployeePayrollNet2026,
  officialTableStepCents,
} from '../lib/verdiencheck/rulesets/nl/2026/payroll-white-monthly';
import { SRC_PENSION_PAYROLL_2026 } from '../lib/verdiencheck/rulesets/nl/2026/sources';
import {
  deriveIncomeBasesFromUserFacts,
  shouldOfferPayslipAccuracy,
} from '../lib/verdiencheck/wizard/derive-income-bases';
import { holidayPayCents } from '../lib/verdiencheck/wizard/holiday-pay';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  nextStep,
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

assert.equal(NL_2026_PACK.version, '2026.10-company-car');
assert.equal(NL_2026_MODULE_STATUS.employeePayslip, 'CERTIFIED_FOR_PENSION_BANK_NET_V1');
assert.equal(NL_2026_MODULE_STATUS.payrollWhiteMonthly, 'CERTIFIED_FOR_STANDARD_WHITE_MONTHLY');
assert.equal(SRC_PENSION_PAYROLL_2026.officialSourceUrl.includes('handboek-loonheffingen'), true);

const ROOT = process.cwd();
const STEP = officialTableStepCents();
const GROSS_2646 = euro(2646);
const PENSION = euro(150);
const OTHER = euro(40);
const BASE_SALARY_CENTS = GROSS_2646 * 12;
const HOLIDAY_8_CENTS = holidayPayCents(BASE_SALARY_CENTS, 8);
const ANNUAL_INCL_8_CENTS = BASE_SALARY_CENTS + HOLIDAY_8_CENTS;

const table2646 = calculateEmployeePayroll2026({
  grossMonthlyCents: GROSS_2646,
  payrollTaxCredit: true,
});
assert.equal(table2646.status, 'OK');
if (table2646.status !== 'OK') throw new Error('table');

const noPension = calculateEmployeePayslip2026({
  contractualGrossMonthlyCents: GROSS_2646,
  payrollTaxCredit: true,
  pensionStatus: 'NOT_SUPPLIED',
  employeePensionCents: null,
});
assert.equal(noPension.status, 'OK');
if (noPension.status !== 'OK') throw new Error('noPension');
assert.equal(noPension.statutoryNetMonthlyCents, table2646.statutoryNetMonthlyCents);
assert.equal(noPension.bankNetMonthlyCents, table2646.statutoryNetMonthlyCents);
assert.equal(noPension.withheldPayrollTaxCents, table2646.withheldPayrollTaxCents);
assert.equal(noPension.employeePensionCents, null);
assert.equal(noPension.pensionExplicitZero, false);
assert.ok(noPension.assumptions.includes('PENSION_NOT_SUPPLIED_STANDARD_TABLE'));

const A = deriveIncomeBasesFromUserFacts(employee());
assert.equal(A.payroll.used, true);
assert.equal(A.payroll.statutoryNetMonthlyCents, table2646.statutoryNetMonthlyCents);
assert.equal(A.payroll.bankNetMonthlyCents, table2646.statutoryNetMonthlyCents);
assert.equal(A.payroll.employeePensionCents, null);
assert.equal(A.payroll.pensionStatus, 'NOT_SUPPLIED');
assert.equal(A.payroll.pensionExplicitZero, false);
assert.equal(A.contractualGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(A.fiscalWageCents, ANNUAL_INCL_8_CENTS);

const knownPension = calculateEmployeePayslip2026({
  contractualGrossMonthlyCents: GROSS_2646,
  payrollTaxCredit: true,
  pensionStatus: 'AMOUNT',
  employeePensionCents: PENSION,
});
assert.equal(knownPension.status, 'OK');
if (knownPension.status !== 'OK') throw new Error('knownPension');
assert.equal(knownPension.tabelloonInputCents, GROSS_2646 - PENSION);
assert.equal(knownPension.employeePensionCents, PENSION);
assert.ok(knownPension.assumptions.includes('EMPLOYEE_PENSION_REDUCES_TABELLOON'));
assert.ok(knownPension.bankNetMonthlyCents < noPension.bankNetMonthlyCents);
assert.ok(knownPension.withheldPayrollTaxCents < table2646.withheldPayrollTaxCents);
assert.equal(
  knownPension.bankNetMonthlyCents,
  knownPension.statutoryNetMonthlyCents,
);

const Bstate = employee({
  pensionDeductionStatus: 'AMOUNT',
  pensionDeductionEuro: '150',
  payslipAccuracyRequested: true,
});
const B = deriveIncomeBasesFromUserFacts(Bstate);
assert.equal(B.payroll.employeePensionCents, PENSION);
assert.equal(B.payroll.statutoryNetMonthlyCents, knownPension.statutoryNetMonthlyCents);
assert.equal(B.payroll.bankNetMonthlyCents, knownPension.bankNetMonthlyCents);
assert.equal(B.contractualGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(B.fiscalWageCents, ANNUAL_INCL_8_CENTS - PENSION * 12);
assert.equal(B.baselineAssessmentIncomeCents, B.fiscalWageCents);
// Arbeidsinkomen is taxable wage from current employment, so it follows the
// pension-adjusted fiscal wage instead of the contractual gross.
assert.equal(B.baselineArbeidsinkomenCents, B.fiscalWageCents);
assert.equal(B.basisProvenance.arbeidsinkomen.kind, 'ESTIMATE');
assert.equal(A.baselineArbeidsinkomenCents, A.fiscalWageCents);
assert.equal(B.basisProvenance.fiscalWage.kind, 'ESTIMATE');
assert.notEqual(B.fiscalWageCents, A.fiscalWageCents);

const bankInverse = invertEmployeePayslipNet2026({
  targetNetMonthlyCents: knownPension.bankNetMonthlyCents,
  netKind: 'BANK_NET',
  payrollTaxCredit: true,
  pensionStatus: 'AMOUNT',
  employeePensionCents: PENSION,
});
assert.equal(bankInverse.status, 'OK');
if (bankInverse.status !== 'OK') throw new Error('bankInverse');
assert.ok(Math.abs(bankInverse.estimatedGrossMonthlyCents - GROSS_2646) <= STEP);
assert.ok(Math.abs(bankInverse.differenceCents) <= 100);
assert.ok(bankInverse.assumptions.includes('BANK_NET_INVERSE_VIA_TABELLOON'));

const C = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: (knownPension.bankNetMonthlyCents / 100).toFixed(2).replace('.', ','),
    netDepositKind: 'BANK_NET',
    pensionDeductionStatus: 'AMOUNT',
    pensionDeductionEuro: '150',
    payslipAccuracyRequested: true,
    holidayPayIncluded: 'YES',
  }),
);
assert.ok(Math.abs((C.payroll.estimatedGrossMonthlyCents ?? 0) - GROSS_2646) <= STEP);

const statutoryTableInverse = invertEmployeePayrollNet2026({
  targetStatutoryNetMonthlyCents: table2646.statutoryNetMonthlyCents,
  payrollTaxCredit: true,
});
assert.equal(statutoryTableInverse.status, 'OK');
const statutoryPayslipInverse = invertEmployeePayslipNet2026({
  targetNetMonthlyCents: table2646.statutoryNetMonthlyCents,
  netKind: 'STATUTORY_NET',
  payrollTaxCredit: true,
  pensionStatus: 'NOT_SUPPLIED',
  employeePensionCents: null,
});
assert.equal(statutoryPayslipInverse.status, 'OK');
if (statutoryTableInverse.status === 'OK' && statutoryPayslipInverse.status === 'OK') {
  assert.equal(
    statutoryPayslipInverse.estimatedGrossMonthlyCents,
    statutoryTableInverse.estimatedGrossMonthlyCents,
  );
}

const D = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
  }),
);
const Dlegacy = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    holidayPayIncluded: 'NO',
    holidayPayPercentMode: 'STATUTORY_8',
    netDepositKind: 'STATUTORY_NET',
  }),
);
assert.equal(D.payroll.estimatedGrossMonthlyCents, Dlegacy.payroll.estimatedGrossMonthlyCents);

const withOther = calculateEmployeePayslip2026({
  contractualGrossMonthlyCents: GROSS_2646,
  payrollTaxCredit: true,
  pensionStatus: 'NOT_SUPPLIED',
  employeePensionCents: null,
  otherBankDeductionCents: OTHER,
});
assert.equal(withOther.status, 'OK');
if (withOther.status !== 'OK') throw new Error('withOther');
assert.equal(withOther.statutoryNetMonthlyCents, noPension.statutoryNetMonthlyCents);
assert.equal(withOther.bankNetMonthlyCents, noPension.bankNetMonthlyCents - OTHER);
assert.ok(withOther.assumptions.includes('OTHER_DEDUCTION_BANK_ONLY'));

const E = deriveIncomeBasesFromUserFacts(
  employee({
    otherPayslipDeductionEuro: '40',
    payslipAccuracyRequested: true,
  }),
);
assert.equal(E.payroll.otherBankDeductionCents, OTHER);
assert.equal(E.payroll.statutoryNetMonthlyCents, A.payroll.statutoryNetMonthlyCents);
assert.equal(E.payroll.bankNetMonthlyCents, (A.payroll.bankNetMonthlyCents ?? 0) - OTHER);
assert.equal(E.fiscalWageCents, A.fiscalWageCents);

const F = deriveIncomeBasesFromUserFacts(
  employee({
    pensionDeductionStatus: 'AMOUNT',
    pensionDeductionEuro: '150',
    advancedAccuracyRequested: true,
    baselineBox1Euro: '40000',
  }),
);
assert.equal(F.fiscalWageCents, euro(40_000));
assert.equal(F.basisProvenance.fiscalWage.kind, 'USER_PROVIDED');
assert.equal(F.payroll.employeePensionCents, PENSION);
assert.equal(F.payroll.bankNetMonthlyCents, knownPension.bankNetMonthlyCents);

const G = deriveIncomeBasesFromUserFacts(
  employee({
    pensionDeductionStatus: 'AMOUNT',
    pensionDeductionEuro: '150',
    advancedAccuracyRequested: true,
    baselineAssessmentEuro: '35000',
  }),
);
assert.equal(G.baselineAssessmentIncomeCents, euro(35_000));
assert.equal(G.basisProvenance.assessment.kind, 'USER_PROVIDED');
assert.notEqual(G.baselineAssessmentIncomeCents, G.fiscalWageCents);

const ownerFields = {
  housingTenure: 'OWNER_OCCUPIED' as const,
  wozValueEuro: '400000',
  mortgageInterestStatus: 'KNOWN' as const,
  deductibleMortgageInterestEuro: '8000',
};
const ownerNoPension = deriveIncomeBasesFromUserFacts(employee(ownerFields));
const ownerWithPension = deriveIncomeBasesFromUserFacts(
  employee({
    ...ownerFields,
    pensionDeductionStatus: 'AMOUNT',
    pensionDeductionEuro: '150',
  }),
);
assert.equal(ownerNoPension.ownerHome.status, ownerWithPension.ownerHome.status);
assert.equal(
  ownerNoPension.ownerHome.netOwnHomeBox1AdjustmentCents,
  ownerWithPension.ownerHome.netOwnHomeBox1AdjustmentCents,
);
assert.ok(ownerWithPension.fiscalWageCents != null);
assert.ok(ownerNoPension.fiscalWageCents != null);
assert.equal(
  (ownerWithPension.baselineBox1TaxableIncomeCents ?? 0) -
    (ownerWithPension.fiscalWageCents ?? 0) +
    (ownerWithPension.ownerHome.applyToBox1
      ? 0
      : 0),
  (ownerWithPension.baselineBox1TaxableIncomeCents ?? 0) -
    (ownerWithPension.fiscalWageCents ?? 0),
);
const ownerAdj = ownerWithPension.ownerHome.netOwnHomeBox1AdjustmentCents ?? 0;
assert.equal(
  ownerWithPension.baselineBox1TaxableIncomeCents,
  (ownerWithPension.fiscalWageCents ?? 0) + ownerAdj,
);
assert.ok((ownerWithPension.fiscalWageCents ?? 0) < (ownerNoPension.fiscalWageCents ?? 0));

const ztWithout = calculateHealthcareAllowance2026({
  hasPartner: false,
  assessmentIncomeCents: A.baselineAssessmentIncomeCents ?? 0,
  partnerAssessmentIncomeCents: 0,
  partnerInsurance: 'INSURED',
});
const ztWith = calculateHealthcareAllowance2026({
  hasPartner: false,
  assessmentIncomeCents: B.baselineAssessmentIncomeCents ?? 0,
  partnerAssessmentIncomeCents: 0,
  partnerInsurance: 'INSURED',
});
assert.notEqual(ztWith, ztWithout);

const extraState = employee({
  pensionDeductionStatus: 'AMOUNT',
  pensionDeductionEuro: '150',
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
const extraInput = wizardStateToCalculatorInput(extraState);
assert.ok(extraInput);
const extraCalc = runCalculator(extraInput!);
assert.equal(extraCalc.status, 'READY');
if (extraCalc.status === 'READY') {
  assert.equal(typeof extraCalc.deltas.incomeTax, 'number');
  assert.notEqual(extraCalc.scenario.incomeTax, extraCalc.baseline.incomeTax);
}

const none = deriveIncomeBasesFromUserFacts(
  employee({ pensionDeductionStatus: 'NONE', payslipAccuracyRequested: true }),
);
assert.equal(none.payroll.pensionExplicitZero, true);
assert.equal(none.payroll.employeePensionCents, 0);
assert.equal(none.payroll.statutoryNetMonthlyCents, A.payroll.statutoryNetMonthlyCents);

const unknown = deriveIncomeBasesFromUserFacts(
  employee({
    currentIncomeBasis: 'NET',
    currentIncomeEuro: '2200',
    netDepositKind: 'UNKNOWN',
    pensionDeductionStatus: 'UNKNOWN',
    payslipAccuracyRequested: true,
    holidayPayIncluded: 'YES',
  }),
);
assert.equal(unknown.payroll.employeePensionCents, null);
assert.equal(unknown.payroll.pensionExplicitZero, false);
assert.equal(unknown.payroll.pensionStatus, 'UNKNOWN');
assert.equal(unknown.netToGrossConfidence, 'ESTIMATE');

let maxBankNetDelta = 0;
let maxGrossDelta = 0;
for (const grossEuro of [2000, 2646, 3500, 5000]) {
  const gross = euro(grossEuro);
  const forward = calculateEmployeePayslip2026({
    contractualGrossMonthlyCents: gross,
    payrollTaxCredit: true,
    pensionStatus: 'AMOUNT',
    employeePensionCents: PENSION,
  });
  assert.equal(forward.status, 'OK', `forward ${grossEuro}`);
  if (forward.status !== 'OK') continue;
  const inverse = invertEmployeePayslipNet2026({
    targetNetMonthlyCents: forward.bankNetMonthlyCents,
    netKind: 'BANK_NET',
    payrollTaxCredit: true,
    pensionStatus: 'AMOUNT',
    employeePensionCents: PENSION,
  });
  assert.equal(inverse.status, 'OK', `inverse ${grossEuro}`);
  if (inverse.status !== 'OK') continue;
  maxBankNetDelta = Math.max(maxBankNetDelta, Math.abs(inverse.differenceCents));
  maxGrossDelta = Math.max(maxGrossDelta, Math.abs(inverse.estimatedGrossMonthlyCents - gross));
}
assert.ok(maxBankNetDelta <= 100, `MAX_BANK_NET_DELTA ${maxBankNetDelta}`);
assert.ok(maxGrossDelta <= STEP, `MAX_GROSS_DELTA ${maxGrossDelta}`);

const nl = getVerdienCheckCopy('nl');
assert.match(nl.payslipAccuracyCta, /Maak mijn loonstrook nauwkeuriger/);
assert.match(nl.pensionNotIncluded, /Pensioen niet meegenomen/);
assert.doesNotMatch(nl.pensionNotIncluded, /€0/);
assert.match(nl.bankNetEstimateLabel, /Geschat op je rekening/);
assert.match(nl.netDepositKindQuestion, /rekening/);
assert.match(nl.otherPayslipDeductionCompanyCarNote, /auto van de zaak/);
assert.doesNotMatch(`${nl.payslipAccuracyTitle}\n${nl.pensionDeductionAmountAsk}`, /percentage/i);

const wizardSrc = fs.readFileSync(path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'), 'utf8');
const cardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckBaselineCard.tsx'),
  'utf8',
);
assert.match(wizardSrc, /payslipDeductions/);
assert.match(wizardSrc, /netDepositKind/);
assert.doesNotMatch(wizardSrc, /Ik weet alleen het percentage/);
assert.match(cardSrc, /pensionNotIncluded/);
assert.match(cardSrc, /incomeIsNetEstimate && baseline\?\.payrollUsed && !pensionKnown/);
assert.match(cardSrc, /viewPayslipBreakdown/);
assert.match(cardSrc, /payslipWithholdingLabel/);
assert.doesNotMatch(cardSrc, /Pensioen €0/);

const defaultSteps = visibleSteps(employee({ moneyDepthRequested: true }));
assert.equal(defaultSteps.includes('payslipDeductions'), false);
assert.equal(nextStep(employee({ moneyDepthRequested: true }), 'currentIncome') !== 'payslipDeductions', true);
assert.equal(
  visibleSteps(
    employee({ moneyDepthRequested: true, payslipAccuracyRequested: true }),
  ).includes('payslipDeductions'),
  true,
);
assert.equal(shouldOfferPayslipAccuracy(employee()), true);

for (const key of [
  'pension',
  'pensioen',
  'deduction',
  'inhouding',
  'bank_net',
  'banknet',
  'payroll_deduction',
] as const) {
  assert.equal(inspectVerdienCheckAnalyticsPayload({ [key]: 1 }).ok, false, key);
}

const renter = deriveIncomeBasesFromUserFacts(
  employee({ housingTenure: 'RENT', rentsHome: true, pensionDeductionStatus: 'AMOUNT', pensionDeductionEuro: '150' }),
);
assert.equal(renter.ownerHome.applyToBox1, false);
const ownerUnknownInterest = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'UNKNOWN',
    pensionDeductionStatus: 'AMOUNT',
    pensionDeductionEuro: '150',
  }),
);
assert.ok(
  ownerUnknownInterest.ownerHome.status === 'PARTIAL' ||
    ownerUnknownInterest.ownerHome.status === 'COMPLETE',
);
const ownerNoMortgage = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'NONE',
    pensionDeductionStatus: 'AMOUNT',
    pensionDeductionEuro: '150',
  }),
);
assert.ok(ownerNoMortgage.ownerHome.netOwnHomeBox1AdjustmentCents != null);

console.log('PASS test-verdiencheck-pension-bank-net-2026');
console.log(
  JSON.stringify(
    {
      NO_PENSION_FIXTURE: A.payroll.statutoryNetMonthlyCents,
      PENSION_FIXTURE_BANK_NET: knownPension.bankNetMonthlyCents,
      PENSION_FIXTURE_WITHHELD: knownPension.withheldPayrollTaxCents,
      BANK_NET_INVERSE_GROSS: bankInverse.status === 'OK' ? bankInverse.estimatedGrossMonthlyCents : null,
      STATUTORY_NET_INVERSE: D.payroll.estimatedGrossMonthlyCents,
      OTHER_DEDUCTION_BANK_NET: E.payroll.bankNetMonthlyCents,
      KNOWN_FISCAL: F.fiscalWageCents,
      KNOWN_ASSESSMENT: G.baselineAssessmentIncomeCents,
      OWNER_BOX1: ownerWithPension.baselineBox1TaxableIncomeCents,
      ALLOWANCE_ZT_WITHOUT: ztWithout,
      ALLOWANCE_ZT_WITH: ztWith,
      ROUNDTRIP_MAX_BANK_NET_DELTA: maxBankNetDelta,
      ROUNDTRIP_MAX_GROSS_DELTA: maxGrossDelta,
      UNKNOWN_PENSION_NOT_ZERO: unknown.payroll.employeePensionCents === null,
      NO_PENSION_EXPLICIT_ZERO: none.payroll.pensionExplicitZero,
      ABP_PRESET_FEASIBLE: false,
      PFZW_PRESET_FEASIBLE: false,
      PENSION_SOURCE: SRC_PENSION_PAYROLL_2026.officialSourceUrl,
    },
    null,
    2,
  ),
);
