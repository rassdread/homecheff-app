/**
 * VerdienCheck Phase 7 — auto van de zaak (bijtelling privégebruik + eigen bijdrage).
 *
 * Expected amounts are derived from the Handboek Loonheffingen 2026 (maart),
 * §23.3.1 t/m §23.3.22 and §11.2.4.
 *
 *   npx tsx scripts/test-verdiencheck-company-car-2026.ts
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
  calculateCompanyCarAddition2026,
  companyCarOwnContributionMonthlyCents,
  type CompanyCarInput,
} from '../lib/verdiencheck/rulesets/nl/2026/company-car';
import {
  calculateEmployeePayslip2026,
  invertEmployeePayslipNet2026,
} from '../lib/verdiencheck/rulesets/nl/2026/employee-payslip';
import {
  SRC_ARBEIDSINKOMEN_WET_IB,
  SRC_COMPANY_CAR_2026,
  SRC_COMPANY_CAR_RATES_2026,
} from '../lib/verdiencheck/rulesets/nl/2026/sources';
import {
  companyCarEntryValid,
  companyCarNeedsRegistrationDate,
  companyCarUsesMarketValue,
  deriveIncomeBasesFromUserFacts,
  shouldOfferCompanyCar,
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

/** Petrol car, catalogue € 30.000, first admitted 2022-03, > 500 private km. */
const STANDARD_CAR: Partial<WizardState> = {
  payslipAccuracyRequested: true,
  companyCarStatus: 'PROVIDED',
  companyCarPrivateUse: 'OVER_500',
  companyCarCategory: 'COMBUSTION_OR_OTHER',
  companyCarFirstAdmissionYear: '2022',
  companyCarFirstAdmissionMonth: '3',
  companyCarValueEuro: '30000',
  companyCarOwnContributionStatus: 'NONE',
};

function withCar(partial: Partial<WizardState> = {}): WizardState {
  return employee({ ...STANDARD_CAR, ...partial });
}

assert.equal(NL_2026_PACK.version, '2026.10-company-car');
assert.equal(NL_2026_MODULE_STATUS.companyCar, 'CERTIFIED_FOR_COMPANY_CAR_BIJTELLING_V1');
assert.equal(SRC_COMPANY_CAR_2026.officialSourceUrl.includes('handboek-loonheffingen'), true);
assert.match(SRC_COMPANY_CAR_2026.officialSource, /§23\.3\.7 eigen bijdrage/);
assert.match(SRC_COMPANY_CAR_RATES_2026.officialSourceUrl, /belastingdienst\.nl/);
assert.match(SRC_ARBEIDSINKOMEN_WET_IB.officialSource, /tegenwoordige arbeid/);

const ROOT = process.cwd();
const GROSS_2646 = euro(2646);
const BASE_SALARY_CENTS = GROSS_2646 * 12;
const HOLIDAY_8_CENTS = holidayPayCents(BASE_SALARY_CENTS, 8);
const ANNUAL_INCL_8_CENTS = BASE_SALARY_CENTS + HOLIDAY_8_CENTS;

function car(partial: Partial<CompanyCarInput> = {}) {
  return calculateCompanyCarAddition2026({
    status: 'PROVIDED',
    privateUse: 'OVER_500',
    vehicleCategory: 'COMBUSTION_OR_OTHER',
    firstAdmission: { year: 2022, month: 3 },
    catalogueValueCents: euro(30_000),
    ownContributionStatus: 'NONE',
    ...partial,
  });
}

// =========================================================== A. no company car
const noCar = calculateCompanyCarAddition2026({ status: 'NONE' });
assert.equal(noCar.resolution, 'NO_CAR');
assert.equal(noCar.taxableAdditionAnnualCents, 0);
assert.equal(noCar.explicitNone, true);
assert.equal(noCar.unknown, false);

const A = deriveIncomeBasesFromUserFacts(employee());
assert.equal(A.fiscalWageCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.baselineArbeidsinkomenCents, ANNUAL_INCL_8_CENTS);
assert.equal(A.companyCarTaxableAnnualCents, null);
assert.equal(A.companyCar.status, 'NOT_SUPPLIED');
assert.equal(A.payroll.companyCarAdditionCents, 0);

const explicitNoCar = deriveIncomeBasesFromUserFacts(
  employee({ payslipAccuracyRequested: true, companyCarStatus: 'NONE' }),
);
// Explicit "no car" must stay byte-equivalent to the certified payroll baseline.
assert.equal(explicitNoCar.fiscalWageCents, A.fiscalWageCents);
assert.equal(explicitNoCar.payroll.tabelloonCents, A.payroll.tabelloonCents);
assert.equal(explicitNoCar.payroll.withheldPayrollTaxCents, A.payroll.withheldPayrollTaxCents);
assert.equal(explicitNoCar.payroll.bankNetMonthlyCents, A.payroll.bankNetMonthlyCents);
assert.equal(explicitNoCar.companyCarTaxableAnnualCents, 0);
assert.equal(explicitNoCar.companyCar.explicitNone, true);

// ========================================================== B. standard 22 %
// §23.3.3: 22 % for a datum 1e toelating on or after 1 January 2017.
const B_RULE = car();
assert.equal(B_RULE.resolution, 'CALCULATED');
assert.equal(B_RULE.valuationBasisKind, 'CATALOGUE_VALUE');
assert.equal(B_RULE.grossAdditionBeforeOwnContributionCents, euro(6_600));
assert.equal(B_RULE.taxableAdditionAnnualCents, euro(6_600));
assert.equal(B_RULE.taxableAdditionMonthlyCents, euro(550));
assert.equal(B_RULE.rateComponents.length, 1);
assert.equal(B_RULE.rateComponents[0].lowRateBps, 2200);
assert.ok(B_RULE.assumptions.includes('BIJTELLING_IS_NOT_CASH_SALARY'));
assert.ok(B_RULE.assumptions.includes('NO_PENSION_ACCRUAL_ON_BIJTELLING'));

// §23.3.3: 25 % before 2017.
assert.equal(
  car({ firstAdmission: { year: 2015, month: 6 } }).taxableAdditionAnnualCents,
  euro(7_500),
);

const B = deriveIncomeBasesFromUserFacts(withCar());
const B_EXPECTED = ANNUAL_INCL_8_CENTS + euro(6_600);
assert.equal(B.companyCarTaxableAnnualCents, euro(6_600));
// Cash wage is untouched; only the fiscal bases grow.
assert.equal(B.contractualGrossEmploymentIncomeCents, BASE_SALARY_CENTS);
assert.equal(B.baselineGrossEmploymentIncomeCents, ANNUAL_INCL_8_CENTS);
assert.equal(B.fiscalWageCents, B_EXPECTED);
assert.equal(B.baselineBox1TaxableIncomeCents, B_EXPECTED);
assert.equal(B.baselineArbeidsinkomenCents, B_EXPECTED);
assert.equal(B.baselineAssessmentIncomeCents, B_EXPECTED);
assert.equal(B.baselineZvwContributionIncomeAlreadyUsedCents, B_EXPECTED);

// ARBEIDSINKOMEN invariant: employment tax credits see the same wage as Box 1.
for (const bases of [A, B]) {
  assert.equal(bases.baselineArbeidsinkomenCents, bases.baselineBox1TaxableIncomeCents);
  assert.equal(bases.baselineArbeidsinkomenCents, bases.fiscalWageCents);
}

// ===================================================== C. ≤ 500 km evidenced
// §23.3.15: the value may be left out, but only with official evidence.
const C_RULE = car({ privateUse: 'AT_OR_BELOW_500_WITH_EVIDENCE' });
assert.equal(C_RULE.resolution, 'NO_ADDITION');
assert.equal(C_RULE.taxableAdditionAnnualCents, 0);
assert.equal(C_RULE.explicitNone, true);
assert.ok(C_RULE.assumptions.includes('NO_ADDITION_REQUIRES_OFFICIAL_EVIDENCE'));

const C = deriveIncomeBasesFromUserFacts(
  withCar({ companyCarPrivateUse: 'AT_OR_BELOW_500_WITH_EVIDENCE' }),
);
assert.equal(C.companyCarTaxableAnnualCents, 0);
assert.equal(C.fiscalWageCents, ANNUAL_INCL_8_CENTS);
assert.equal(C.payroll.companyCarAdditionCents, 0);

// An unproven "no" is not a factual zero.
const C_UNKNOWN = car({ privateUse: 'UNKNOWN' });
assert.equal(C_UNKNOWN.resolution, 'PARTIAL');
assert.equal(C_UNKNOWN.partialReason, 'PRIVATE_USE_UNKNOWN');
assert.equal(C_UNKNOWN.taxableAdditionAnnualCents, null);

// ================================================ D/E. zero emission 2026
// §23.3.4: 18 % up to € 30.000 grondslag, 22 % above, datum 1e toelating 2026.
const D_RULE = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2026, month: 1 },
  catalogueValueCents: euro(30_000),
});
assert.equal(D_RULE.taxableAdditionAnnualCents, euro(5_400));
assert.equal(D_RULE.rateComponents[0].capCents, euro(30_000));

const belowThreshold = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2026, month: 1 },
  catalogueValueCents: euro(25_000),
});
assert.equal(belowThreshold.taxableAdditionAnnualCents, euro(4_500));

const E_RULE = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2026, month: 2 },
  catalogueValueCents: euro(85_000),
});
// 30.000 × 18 % + 55.000 × 22 % = 5.400 + 12.100 (Handboek §23.3.4, voorbeeld 1).
assert.equal(E_RULE.taxableAdditionAnnualCents, euro(17_500));
assert.equal(E_RULE.taxableAdditionMonthlyCents, 145_833);

// Handboek §23.3.4 voorbeeld 1 including the € 200 monthly own contribution.
const E_OWN = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2026, month: 2 },
  catalogueValueCents: euro(85_000),
  ownContributionStatus: 'AMOUNT',
  ownContributionAnnualCents: euro(2_400),
});
assert.equal(E_OWN.taxableAdditionAnnualCents, euro(17_500) - euro(2_400));
assert.equal(Math.round(E_OWN.taxableAdditionAnnualCents! / 12), 125_833);

// 2025 registration keeps 17 %, 2022 keeps the € 35.000 cap.
assert.equal(
  car({
    vehicleCategory: 'ZERO_EMISSION',
    firstAdmission: { year: 2025, month: 5 },
    catalogueValueCents: euro(30_000),
  }).taxableAdditionAnnualCents,
  euro(5_100),
);
assert.equal(
  car({
    vehicleCategory: 'ZERO_EMISSION',
    firstAdmission: { year: 2022, month: 5 },
    catalogueValueCents: euro(40_000),
  }).taxableAdditionAnnualCents,
  euro(35_000 * 0.16 + 5_000 * 0.22),
);

// =========================================== F. hydrogen / solar: no cap
const F_RULE = car({
  vehicleCategory: 'HYDROGEN',
  firstAdmission: { year: 2026, month: 2 },
  catalogueValueCents: euro(85_000),
});
assert.equal(F_RULE.rateComponents[0].capCents, null);
assert.equal(F_RULE.taxableAdditionAnnualCents, euro(15_300));
// Handboek §23.3.4 voorbeeld 3: zonnecelauto € 85.000, eigen bijdrage € 200/mnd.
const F_SOLAR = car({
  vehicleCategory: 'QUALIFYING_SOLAR',
  firstAdmission: { year: 2026, month: 2 },
  catalogueValueCents: euro(85_000),
  ownContributionStatus: 'AMOUNT',
  ownContributionAnnualCents: euro(2_400),
});
assert.equal(Math.round(F_SOLAR.taxableAdditionAnnualCents! / 12), euro(1_075));

// ================================================= G/H. 60-month rate term
// §23.3.4: the term starts on the first day of the month after admission.
const G_RULE = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2021, month: 12 },
  catalogueValueCents: euro(50_000),
});
// Term runs to 2027-01, so all of 2026 keeps 12 % up to € 40.000.
assert.equal(G_RULE.rateComponents.length, 1);
assert.equal(G_RULE.rateComponents[0].lowRateBps, 1200);
assert.equal(G_RULE.taxableAdditionAnnualCents, euro(40_000 * 0.12 + 10_000 * 0.22));
assert.ok(G_RULE.assumptions.includes('SIXTY_MONTH_TERM_FROM_MONTH_AFTER_ADMISSION'));

// Handboek §23.3.4 voorbeeld 2: DET 2016-02, DTN 2021-05, grondslag € 60.000.
const H_RULE = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2016, month: 2 },
  firstRegistrationNl: { year: 2021, month: 5 },
  catalogueValueCents: euro(60_000),
  ownContributionStatus: 'AMOUNT',
  ownContributionAnnualCents: euro(600),
});
assert.equal(H_RULE.rateComponents.length, 2);
assert.equal(H_RULE.rateComponents[0].toMonth, 5);
assert.equal(H_RULE.rateComponents[0].monthlyValueCents, euro(916.67));
assert.equal(H_RULE.rateComponents[1].fromMonth, 6);
assert.equal(H_RULE.rateComponents[1].monthlyValueCents, euro(1_150));
// The handbook shows € 866,67 (jan-mei) and € 1.100 (jun-dec) after € 50 per month.
assert.equal(H_RULE.rateComponents[0].monthlyValueCents - euro(50), euro(866.67));
assert.equal(H_RULE.rateComponents[1].monthlyValueCents - euro(50), euro(1_100));
assert.equal(
  H_RULE.grossAdditionBeforeOwnContributionCents,
  5 * euro(916.67) + 7 * euro(1_150),
);
assert.equal(
  H_RULE.taxableAdditionAnnualCents,
  H_RULE.grossAdditionBeforeOwnContributionCents! - euro(600),
);

// A term that expired before 2026 falls back to the current percentages.
const EXPIRED = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2019, month: 6 },
  catalogueValueCents: euro(50_000),
});
assert.equal(EXPIRED.rateComponents.length, 1);
assert.equal(EXPIRED.rateComponents[0].lowRateBps, 1800);
assert.equal(EXPIRED.taxableAdditionAnnualCents, euro(30_000 * 0.18 + 20_000 * 0.22));

// A zero-emission car before 2017 needs the datum 1e tenaamstelling.
const MISSING_DTN = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2016, month: 2 },
  catalogueValueCents: euro(60_000),
});
assert.equal(MISSING_DTN.resolution, 'PARTIAL');
assert.equal(MISSING_DTN.partialReason, 'FIRST_REGISTRATION_UNKNOWN');

// ================================================== I. youngtimer (> 16 jaar)
// §23.3.20: 35 % of the waarde in het economische verkeer.
const I_RULE = car({
  firstAdmission: { year: 2008, month: 5 },
  catalogueValueCents: euro(60_000),
  marketValueCents: euro(15_000),
});
assert.equal(I_RULE.valuationBasisKind, 'MARKET_VALUE');
assert.equal(I_RULE.valuationBasisCents, euro(15_000));
assert.equal(I_RULE.taxableAdditionAnnualCents, euro(5_250));
assert.ok(I_RULE.assumptions.includes('YOUNGTIMER_MARKET_VALUE_BASIS'));

// Overgangsrecht: admitted in 2010 and already provided in 2025.
const I_TRANSITION = car({
  firstAdmission: { year: 2010, month: 6 },
  marketValueCents: euro(15_000),
  availableSince2025: true,
});
assert.equal(I_TRANSITION.taxableAdditionAnnualCents, euro(5_250));
assert.ok(I_TRANSITION.assumptions.includes('YOUNGTIMER_TRANSITIONAL_RULE_2026'));

// Without that confirmation the rule is not applied silently.
const I_UNRESOLVED = car({ firstAdmission: { year: 2010, month: 6 }, marketValueCents: euro(15_000) });
assert.equal(I_UNRESOLVED.resolution, 'PARTIAL');
assert.equal(I_UNRESOLVED.partialReason, 'YOUNGTIMER_TRANSITION_UNRESOLVED');

// Zero-emission youngtimers keep the discount from §23.3.4.
const I_EV = car({
  vehicleCategory: 'ZERO_EMISSION',
  firstAdmission: { year: 2008, month: 5 },
  firstRegistrationNl: { year: 2024, month: 4 },
  marketValueCents: euro(20_000),
});
assert.equal(I_EV.taxableAdditionAnnualCents, euro(20_000 * 0.29));

const youngtimerState = withCar({
  companyCarFirstAdmissionYear: '2008',
  companyCarFirstAdmissionMonth: '5',
  companyCarValueEuro: '15000',
});
assert.equal(companyCarUsesMarketValue(youngtimerState), true);
assert.equal(companyCarUsesMarketValue(withCar()), false);
assert.equal(
  deriveIncomeBasesFromUserFacts(youngtimerState).companyCarTaxableAnnualCents,
  euro(5_250),
);

// ============================================= J. own contribution (§23.3.7)
const J_RULE = car({
  ownContributionStatus: 'AMOUNT',
  ownContributionAnnualCents: euro(1_200),
});
assert.equal(J_RULE.grossAdditionBeforeOwnContributionCents, euro(6_600));
assert.equal(J_RULE.ownContributionAppliedCents, euro(1_200));
assert.equal(J_RULE.taxableAdditionAnnualCents, euro(5_400));
assert.equal(companyCarOwnContributionMonthlyCents(J_RULE), euro(100));

// The calendar-year balance may not become negative and gives no extra relief.
const J_EXCESS = car({
  ownContributionStatus: 'AMOUNT',
  ownContributionAnnualCents: euro(9_000),
});
assert.equal(J_EXCESS.taxableAdditionAnnualCents, 0);
assert.equal(J_EXCESS.ownContributionAppliedCents, euro(6_600));
assert.equal(J_EXCESS.ownContributionEnteredCents, euro(9_000));

const J = deriveIncomeBasesFromUserFacts(
  withCar({ companyCarOwnContributionStatus: 'AMOUNT', companyCarOwnContributionEuro: '1200' }),
);
assert.equal(J.fiscalWageCents, ANNUAL_INCL_8_CENTS + euro(5_400));
assert.equal(J.payroll.companyCarAdditionCents, euro(450));
assert.equal(J.payroll.companyCarOwnContributionCents, euro(100));
// The same euro is not subtracted twice: once from the taxable addition,
// once from the bank deposit.
assert.equal(
  B.payroll.bankNetMonthlyCents! - J.payroll.bankNetMonthlyCents!,
  euro(100) - (B.payroll.withheldPayrollTaxCents! - J.payroll.withheldPayrollTaxCents!),
);

// Unknown own contribution is an estimate, never a factual zero.
const J_UNKNOWN = car({ ownContributionStatus: 'UNKNOWN' });
assert.equal(J_UNKNOWN.ownContributionUnknown, true);
assert.equal(J_UNKNOWN.ownContributionEnteredCents, null);
assert.equal(J_UNKNOWN.provenance, 'ESTIMATE');
assert.equal(J_UNKNOWN.taxableAdditionAnnualCents, euro(6_600));

// ========================================================== K. unknown facts
const K_RULE = calculateCompanyCarAddition2026({ status: 'UNKNOWN' });
assert.equal(K_RULE.resolution, 'UNKNOWN');
assert.equal(K_RULE.taxableAdditionAnnualCents, null);
assert.equal(K_RULE.explicitNone, false);
assert.equal(K_RULE.unknown, true);

const K = deriveIncomeBasesFromUserFacts(
  employee({ payslipAccuracyRequested: true, companyCarStatus: 'UNKNOWN' }),
);
assert.equal(K.companyCarTaxableAnnualCents, null);
assert.equal(K.companyCar.status, 'UNKNOWN');
assert.equal(K.fiscalWageCents, ANNUAL_INCL_8_CENTS);
assert.equal(K.basisProvenance.fiscalWage.kind, 'ESTIMATE');

for (const missing of [
  { vehicleCategory: 'UNKNOWN' as const, expected: 'VEHICLE_CATEGORY_UNKNOWN' },
  { firstAdmission: null, expected: 'FIRST_ADMISSION_UNKNOWN' },
  { catalogueValueCents: null, expected: 'VALUATION_UNKNOWN' },
]) {
  const { expected, ...override } = missing;
  const partial = car(override as Partial<CompanyCarInput>);
  assert.equal(partial.resolution, 'PARTIAL', expected);
  assert.equal(partial.partialReason, expected);
  assert.equal(partial.taxableAdditionAnnualCents, null);
}

// ===================================== payroll: cash gross versus taxable wage
const noCarPayslip = calculateEmployeePayslip2026({
  contractualGrossMonthlyCents: GROSS_2646,
  payrollTaxCredit: true,
  pensionStatus: 'NOT_SUPPLIED',
  employeePensionCents: null,
});
const carPayslip = calculateEmployeePayslip2026({
  contractualGrossMonthlyCents: GROSS_2646,
  payrollTaxCredit: true,
  pensionStatus: 'NOT_SUPPLIED',
  employeePensionCents: null,
  companyCarAdditionCents: euro(550),
});
assert.equal(noCarPayslip.status, 'OK');
assert.equal(carPayslip.status, 'OK');
if (noCarPayslip.status !== 'OK' || carPayslip.status !== 'OK') throw new Error('payslip');
assert.equal(carPayslip.contractualGrossMonthlyCents, GROSS_2646);
assert.equal(carPayslip.tabelloonInputCents, GROSS_2646 + euro(550));
assert.ok(carPayslip.withheldPayrollTaxCents > noCarPayslip.withheldPayrollTaxCents);
// The bank deposit only drops by the extra withholding, never by the addition.
assert.equal(
  noCarPayslip.bankNetMonthlyCents - carPayslip.bankNetMonthlyCents,
  carPayslip.withheldPayrollTaxCents - noCarPayslip.withheldPayrollTaxCents,
);
assert.equal(
  carPayslip.statutoryNetMonthlyCents,
  GROSS_2646 - carPayslip.withheldPayrollTaxCents,
);
assert.ok(carPayslip.assumptions.includes('COMPANY_CAR_ADDITION_NOT_PAID_IN_CASH'));

const B_PAYROLL = deriveIncomeBasesFromUserFacts(withCar());
assert.equal(B_PAYROLL.payroll.estimatedGrossMonthlyCents, A.payroll.estimatedGrossMonthlyCents);
assert.equal(B_PAYROLL.payroll.tabelloonCents! > A.payroll.tabelloonCents!, true);
assert.equal(B_PAYROLL.payroll.companyCarAdditionCents, euro(550));

// =============================================== net → gross round trip
let maxBankNetDelta = 0;
let maxCashGrossDelta = 0;
for (const grossEuro of [2646, 3500, 5000]) {
  const gross = euro(grossEuro);
  const forward = calculateEmployeePayslip2026({
    contractualGrossMonthlyCents: gross,
    payrollTaxCredit: true,
    pensionStatus: 'NOT_SUPPLIED',
    employeePensionCents: null,
    companyCarAdditionCents: euro(550),
  });
  assert.equal(forward.status, 'OK');
  if (forward.status !== 'OK') throw new Error('forward');
  const back = invertEmployeePayslipNet2026({
    targetNetMonthlyCents: forward.bankNetMonthlyCents,
    netKind: 'BANK_NET',
    payrollTaxCredit: true,
    pensionStatus: 'NOT_SUPPLIED',
    employeePensionCents: null,
    companyCarAdditionCents: euro(550),
  });
  assert.equal(back.status, 'OK');
  if (back.status !== 'OK') throw new Error('inverse');
  maxBankNetDelta = Math.max(maxBankNetDelta, Math.abs(back.differenceCents));
  maxCashGrossDelta = Math.max(
    maxCashGrossDelta,
    Math.abs(back.estimatedGrossMonthlyCents - gross),
  );
  // The addition never lands in the bank deposit.
  assert.ok(back.estimatedGrossMonthlyCents < gross + euro(550));
}
assert.ok(maxBankNetDelta <= 200, `bank net delta ${maxBankNetDelta}`);
assert.ok(maxCashGrossDelta <= 5_000, `cash gross delta ${maxCashGrossDelta}`);

// The certified no-car inverse must not move.
const inverseNoCar = invertEmployeePayslipNet2026({
  targetNetMonthlyCents: noCarPayslip.bankNetMonthlyCents,
  netKind: 'BANK_NET',
  payrollTaxCredit: true,
  pensionStatus: 'NOT_SUPPLIED',
  employeePensionCents: null,
});
assert.equal(inverseNoCar.status, 'OK');
if (inverseNoCar.status !== 'OK') throw new Error('inverse no car');
// The table inverse returns the lowest gross of the matching bracket, so the
// certified tolerance is a table row, not an exact euro.
assert.ok(Math.abs(inverseNoCar.estimatedGrossMonthlyCents - GROSS_2646) <= 5_000);

const netWithCar = deriveIncomeBasesFromUserFacts(
  withCar({ currentIncomeBasis: 'NET', currentIncomeEuro: '2200', netDepositKind: 'BANK_NET' }),
);
const netNoCar = deriveIncomeBasesFromUserFacts(
  employee({ currentIncomeBasis: 'NET', currentIncomeEuro: '2200', netDepositKind: 'BANK_NET' }),
);
// A bank deposit of € 2.200 next to a company car implies a higher cash gross,
// because more payroll tax was withheld from that same cash salary.
assert.ok(netWithCar.payroll.estimatedGrossMonthlyCents! > netNoCar.payroll.estimatedGrossMonthlyCents!);
assert.equal(netWithCar.basisProvenance.fiscalWage.kind, 'ESTIMATE');

// ============================================================ pension + car
const PENSION_MONTHLY = euro(150);
const pensionOnly = deriveIncomeBasesFromUserFacts(
  employee({ pensionDeductionStatus: 'AMOUNT', pensionDeductionEuro: '150' }),
);
const pensionCar = deriveIncomeBasesFromUserFacts(
  withCar({ pensionDeductionStatus: 'AMOUNT', pensionDeductionEuro: '150' }),
);
assert.equal(pensionCar.fiscalWageCents, pensionOnly.fiscalWageCents! + euro(6_600));
assert.equal(pensionCar.baselineArbeidsinkomenCents, pensionCar.fiscalWageCents);
assert.equal(pensionCar.payroll.employeePensionCents, PENSION_MONTHLY);
// Ordering: cash gross − pension + car addition = tabelloon input.
assert.equal(
  pensionCar.payroll.tabelloonCents != null && pensionOnly.payroll.tabelloonCents != null,
  true,
);
const pensionCarPayslip = calculateEmployeePayslip2026({
  contractualGrossMonthlyCents: GROSS_2646,
  payrollTaxCredit: true,
  pensionStatus: 'AMOUNT',
  employeePensionCents: PENSION_MONTHLY,
  companyCarAdditionCents: euro(550),
});
if (pensionCarPayslip.status !== 'OK') throw new Error('pension car');
assert.equal(
  pensionCarPayslip.tabelloonInputCents,
  GROSS_2646 - PENSION_MONTHLY + euro(550),
);
assert.equal(
  pensionCarPayslip.statutoryNetMonthlyCents,
  GROSS_2646 - PENSION_MONTHLY - pensionCarPayslip.withheldPayrollTaxCents,
);

// ============================================================== bonus + car
const bonusCar = deriveIncomeBasesFromUserFacts(
  withCar({
    extraPayStatus: 'PROVIDED',
    thirteenthMonthMode: 'NONE',
    bonusCommissionEuro: '5000',
  }),
);
assert.equal(bonusCar.employmentExtrasCents, euro(5_000));
assert.equal(bonusCar.companyCarTaxableAnnualCents, euro(6_600));
// Both enter the annual fiscal wage exactly once and stay separate concepts.
assert.equal(bonusCar.fiscalWageCents, ANNUAL_INCL_8_CENTS + euro(5_000) + euro(6_600));
assert.equal(bonusCar.baselineGrossEmploymentIncomeCents, ANNUAL_INCL_8_CENTS + euro(5_000));

// ============================================================== owner + car
const ownerNoCar = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'KNOWN',
    deductibleMortgageInterestEuro: '9000',
  }),
);
const ownerCar = deriveIncomeBasesFromUserFacts(
  withCar({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'KNOWN',
    deductibleMortgageInterestEuro: '9000',
  }),
);
const ownerAdjustment = ownerNoCar.ownerHome.netOwnHomeBox1AdjustmentCents;
assert.ok(ownerAdjustment != null && ownerAdjustment !== 0);
// Car first in the employment layer, housing strictly downstream.
assert.equal(ownerCar.fiscalWageCents, B_EXPECTED);
assert.equal(ownerCar.baselineBox1TaxableIncomeCents, B_EXPECTED + ownerAdjustment!);
assert.equal(ownerCar.baselineAssessmentIncomeCents, B_EXPECTED + ownerAdjustment!);
assert.equal(
  ownerCar.baselineBox1TaxableIncomeCents! - ownerNoCar.baselineBox1TaxableIncomeCents!,
  euro(6_600),
);

// ================================================ known income precedence
const knownFiscal = deriveIncomeBasesFromUserFacts(
  withCar({ baselineGrossEmploymentEuro: '40000' }),
);
assert.equal(knownFiscal.derivation, 'ADVANCED');
assert.equal(knownFiscal.fiscalWageCents, euro(40_000));
assert.equal(knownFiscal.companyCarTaxableAnnualCents, null);
assert.equal(knownFiscal.companyCar.status, 'NOT_SUPPLIED');
assert.equal(shouldOfferCompanyCar(employee({ baselineGrossEmploymentEuro: '40000' })), false);

const knownAssessment = deriveIncomeBasesFromUserFacts(
  withCar({ baselineAssessmentEuro: '35000' }),
);
assert.equal(knownAssessment.baselineAssessmentIncomeCents, euro(35_000));
assert.notEqual(knownAssessment.companyCarTaxableAnnualCents, null);
assert.notEqual(
  knownAssessment.baselineAssessmentIncomeCents,
  knownAssessment.fiscalWageCents,
);
const carWithoutAssessment = deriveIncomeBasesFromUserFacts(withCar({}));
assert.equal(
  knownAssessment.companyCarTaxableAnnualCents,
  carWithoutAssessment.companyCarTaxableAnnualCents,
);

// ========================================================= allowance persona
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
const ztWithoutCar = healthcareAllowanceAnnual(employee(allowanceBase));
const ztWithCar = healthcareAllowanceAnnual(withCar(allowanceBase));
assert.ok(ztWithoutCar != null && ztWithCar != null);
// The allowance changes only through the higher assessment income.
assert.ok(ztWithCar! < ztWithoutCar!);
const assessmentWithoutCar = deriveIncomeBasesFromUserFacts(employee(allowanceBase))
  .baselineAssessmentIncomeCents;
const assessmentWithCar = deriveIncomeBasesFromUserFacts(withCar(allowanceBase))
  .baselineAssessmentIncomeCents;
assert.equal(assessmentWithCar! - assessmentWithoutCar!, euro(6_600));

// ====================================================== HomeCheff scenario
const scenarioState = withCar({ scenarioLayerRequested: true, scenarioPreset: 1000 });
const scenarioInput = wizardStateToCalculatorInput(scenarioState);
assert.ok(scenarioInput);
assert.equal(scenarioInput!.baselineBox1TaxableIncomeCents, B_EXPECTED);
assert.equal(scenarioInput!.baselineArbeidsinkomenCents, B_EXPECTED);
const scenarioResult = runCalculator(scenarioInput!);
assert.equal(scenarioResult.status, 'READY');
if (scenarioResult.status !== 'READY') throw new Error('scenario');
// The bijtelling belongs to NU, never to the HomeCheff delta.
assert.equal(scenarioResult.scenario.commercialResultCents, euro(1_000));
assert.equal(scenarioResult.baseline.commercialResultCents, 0);
assert.ok(
  typeof scenarioResult.baseline.incomeTax === 'number' &&
    typeof scenarioResult.scenario.incomeTax === 'number' &&
    scenarioResult.scenario.incomeTax > scenarioResult.baseline.incomeTax,
);

// ============================================================== flow / copy
const defaultSteps = visibleSteps(employee({ moneyDepthRequested: true }));
assert.equal(defaultSteps.includes('companyCar'), false);
assert.equal(
  visibleSteps(employee({ moneyDepthRequested: true, payslipAccuracyRequested: true })).includes(
    'companyCar',
  ),
  true,
);
assert.equal(shouldOfferCompanyCar(employee()), true);
assert.equal(companyCarEntryValid(employee({ companyCarStatus: 'NONE' })), true);
assert.equal(companyCarEntryValid(employee({ companyCarStatus: 'PROVIDED' })), false);
assert.equal(companyCarEntryValid(withCar()), true);
assert.equal(companyCarEntryValid(withCar({ companyCarValueEuro: 'abc' })), false);
assert.equal(
  companyCarEntryValid(
    withCar({ companyCarOwnContributionStatus: 'AMOUNT', companyCarOwnContributionEuro: '' }),
  ),
  false,
);
assert.equal(
  companyCarNeedsRegistrationDate(
    withCar({ companyCarCategory: 'ZERO_EMISSION', companyCarFirstAdmissionYear: '2016' }),
  ),
  true,
);
assert.equal(companyCarNeedsRegistrationDate(withCar()), false);

const nl = getVerdienCheckCopy('nl');
const en = getVerdienCheckCopy('en');
assert.equal(nl.companyCarQuestion, 'Heb je een auto van de zaak die je ook privé kunt gebruiken?');
assert.equal(nl.companyCarPrivateUseQuestion, 'Rijd je meer dan 500 km per jaar privé met deze auto?');
assert.equal(nl.companyCarPrivateUseUnder, 'Nee, en ik kan dit aantonen');
assert.match(nl.companyCarPrivateUseEvidenceNote, /Verklaring geen privégebruik auto/);
assert.match(nl.companyCarCatalogueValueHelp, /niet de aanschafprijs/);
assert.match(nl.companyCarMarketValueHelp, /economisch verkeer/);
assert.match(nl.companyCarOwnContributionHelp, /nettoloon/);
assert.match(nl.companyCarWhyBody, /Je ontvangt dat bedrag niet op je rekening/);
assert.equal(nl.companyCarWhyTitle, 'Waarom telt een auto van de zaak mee?');
assert.equal(nl.companyCarNotIncluded, 'Auto van de zaak niet meegenomen');
assert.match(nl.companyCarIncomplete, /Weet ik niet/);
assert.ok(en.companyCarIncomplete.length > 0);
assert.ok(en.companyCarQuestion.length > 0);
assert.equal(nl.steps.companyCar?.title, 'Auto van de zaak');
// Never framed as a fine or a fee.
for (const text of [nl.companyCarWhyBody, nl.companyCarQuestion, nl.companyCarLabel]) {
  assert.doesNotMatch(text, /boete|straf|heffing op/i);
}

const wizardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);
const cardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckBaselineCard.tsx'),
  'utf8',
);
assert.match(wizardSrc, /step === 'companyCar'/);
assert.match(wizardSrc, /companyCarUsesMarketValue/);
assert.match(cardSrc, /viewCompanyCarBreakdown/);
assert.match(cardSrc, /companyCarNotIncluded/);
assert.match(cardSrc, /payslipCompanyCarLabel/);
assert.doesNotMatch(cardSrc, /Bijtelling €0/);
// An incomplete car form must say so instead of silently ignoring "Verder".
assert.match(wizardSrc, /setCompanyCarError\(true\)/);
assert.match(wizardSrc, /copy\.companyCarIncomplete/);
// No percentages or caps inside React components.
for (const src of [wizardSrc, cardSrc]) {
  assert.doesNotMatch(src, /\b(0\.22|0\.18|2200|1800)\b/);
}

// =================================================================== privacy
for (const key of [
  'company_car',
  'companycar',
  'bijtelling',
  'car_value',
  'catalogus',
  'cataloguswaarde',
  'youngtimer',
  'vehicle_value',
  'own_contribution',
  'eigen_bijdrage_auto',
  'kenteken',
] as const) {
  assert.equal(inspectVerdienCheckAnalyticsPayload({ [key]: 1 }).ok, false, key);
}
assert.equal(
  inspectVerdienCheckAnalyticsPayload({
    entry_point: 'direct',
    progress_bucket: 'MIDDLE',
    funnel_stage: 'baseline',
  }).ok,
  true,
);
assert.equal(
  shareUrlContainsFinancialState('https://homecheff.eu/verdiencheck?bijtelling=550'),
  true,
);
assert.equal(
  shareUrlContainsFinancialState('https://homecheff.eu/verdiencheck?cataloguswaarde=30000'),
  true,
);
assert.equal(shareUrlContainsFinancialState(buildVerdienCheckShareUrl({})), false);

console.log('PASS test-verdiencheck-company-car-2026');
console.log(
  JSON.stringify(
    {
      NO_CAR_FIXTURE: A.fiscalWageCents,
      STANDARD_CAR_FIXTURE: B_RULE.taxableAdditionAnnualCents,
      UNDER_500_FIXTURE: C_RULE.taxableAdditionAnnualCents,
      EV_BELOW_THRESHOLD: D_RULE.taxableAdditionAnnualCents,
      EV_ABOVE_THRESHOLD: E_RULE.taxableAdditionAnnualCents,
      HYDROGEN_SOLAR_FIXTURE: F_RULE.taxableAdditionAnnualCents,
      SIXTY_MONTH_FIXTURE: G_RULE.taxableAdditionAnnualCents,
      MIDYEAR_EXPIRY_FIXTURE: H_RULE.taxableAdditionAnnualCents,
      YOUNGTIMER_FIXTURE: I_RULE.taxableAdditionAnnualCents,
      OWN_CONTRIBUTION_FIXTURE: J_RULE.taxableAdditionAnnualCents,
      UNKNOWN_FIXTURE: K_RULE.taxableAdditionAnnualCents,
      PAYROLL_WITH_CAR_TABELLOON: carPayslip.tabelloonInputCents,
      BANK_NET_WITH_CAR: carPayslip.bankNetMonthlyCents,
      ROUNDTRIP_MAX_BANK_NET_DELTA: maxBankNetDelta,
      ROUNDTRIP_MAX_CASH_GROSS_DELTA: maxCashGrossDelta,
      PENSION_PLUS_CAR: pensionCar.fiscalWageCents,
      BONUS_PLUS_CAR: bonusCar.fiscalWageCents,
      OWNER_PLUS_CAR: ownerCar.baselineBox1TaxableIncomeCents,
      ALLOWANCE_ZT_WITHOUT: ztWithoutCar,
      ALLOWANCE_ZT_WITH: ztWithCar,
      KNOWN_FISCAL_PRECEDENCE: knownFiscal.fiscalWageCents,
      KNOWN_ASSESSMENT_PRECEDENCE: knownAssessment.baselineAssessmentIncomeCents,
      COMPANY_CAR_SOURCE: SRC_COMPANY_CAR_2026.officialSourceUrl,
    },
    null,
    2,
  ),
);
