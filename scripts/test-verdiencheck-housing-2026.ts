/**
 * VerdienCheck Phase 4 — official 2026 owner-occupied home + housing tenure.
 *
 *   npx tsx scripts/test-verdiencheck-housing-2026.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { calculateHealthcareAllowance2026 } from '../lib/verdiencheck/nl2026/healthcare-allowance';
import { calculateHousingAllowance2026 } from '../lib/verdiencheck/nl2026/housing-allowance';
import { calculateChildBudget2026 } from '../lib/verdiencheck/nl2026/child-budget';
import { inspectVerdienCheckAnalyticsPayload } from '../lib/verdiencheck/privacy/analytics-guard';
import {
  calculatorHousingTenure,
  resolveHousingTenure,
  rentsHomeFromTenure,
} from '../lib/verdiencheck/domain/housing';
import {
  calculateEigenwoningforfait2026,
  calculateHillenAftrek2026,
  calculateOwnerOccupiedHome2026,
  calculateTariefsaanpassingEigenWoning2026,
  HILLEN_2026_NUMERATOR,
  OWNER_OCCUPIED_HOME_2026_SOURCES,
  TARIEFSAANPASSING_2026_NUMERATOR,
  WOZ_VALUE_DATE,
} from '../lib/verdiencheck/rulesets/nl/2026/owner-occupied-home';
import { deriveIncomeBasesFromUserFacts } from '../lib/verdiencheck/wizard/derive-income-bases';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applyMoneyDepthChoice,
  applySituationGroup,
  derivedWizardAllowances,
  visibleSteps,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { wizardStateToCalculatorInput } from '../lib/verdiencheck/wizard/to-calculator-input';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';

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

assert.equal(NL_2026_PACK.version, '2026.7-owner-occupied-home');
assert.equal(NL_2026_MODULE_STATUS.ownerOccupiedHome, 'CERTIFIED_FOR_OWNER_OCCUPIED_HOME_V1');
assert.equal(WOZ_VALUE_DATE, '2025-01-01');
assert.equal(HILLEN_2026_NUMERATOR, 71_867);
assert.equal(TARIEFSAANPASSING_2026_NUMERATOR, 1_194);
assert.match(OWNER_OCCUPIED_HOME_2026_SOURCES.ewf.officialSourceUrl, /belastingdienst\.nl/);
assert.match(OWNER_OCCUPIED_HOME_2026_SOURCES.hillen.officialSourceUrl, /belastingdienst\.nl/);
assert.match(OWNER_OCCUPIED_HOME_2026_SOURCES.tariefsaanpassing.officialSourceUrl, /belastingdienst\.nl/);

const ewf280 = calculateEigenwoningforfait2026(euro(280_000));
assert.equal(ewf280?.eigenwoningforfaitCents, euro(980));
assert.equal(ewf280?.ruleBand, '0_35');
const ewf400 = calculateEigenwoningforfait2026(euro(400_000));
assert.equal(ewf400?.eigenwoningforfaitCents, euro(1_400));
const ewf12 = calculateEigenwoningforfait2026(euro(12_500));
assert.equal(ewf12?.eigenwoningforfaitCents, 0);
const ewf12501 = calculateEigenwoningforfait2026(euro(12_501));
assert.equal(ewf12501?.rateNumer, 10);
const ewfHigh = calculateEigenwoningforfait2026(euro(1_500_000));
assert.equal(ewfHigh?.ruleBand, 'HIGH_VALUE');
assert.equal(ewfHigh?.eigenwoningforfaitCents, euro(8_250));
const ewfCap = calculateEigenwoningforfait2026(euro(1_350_000));
assert.equal(ewfCap?.eigenwoningforfaitCents, euro(4_725));

assert.equal(calculateHillenAftrek2026(euro(200)), euro(144));
assert.equal(calculateHillenAftrek2026(euro(500)), euro(359));

const ta = calculateTariefsaanpassingEigenWoning2026({
  box1TaxableCents: euro(80_140),
  deductibleOwnHomeCostsCents: euro(3_500),
});
assert.equal(ta.grondslagCents, euro(3_500));
assert.equal(ta.extraTaxCents, euro(417));

const below = calculateTariefsaanpassingEigenWoning2026({
  box1TaxableCents: euro(40_000),
  deductibleOwnHomeCostsCents: euro(8_000),
});
assert.equal(below.extraTaxCents, 0);

function ownerCalc(input: {
  woz: number | null;
  interest: number | null | 'UNKNOWN';
  knownBox1?: boolean;
  knownAssessment?: boolean;
}) {
  return calculateOwnerOccupiedHome2026({
    tenure: 'OWNER_OCCUPIED',
    wozCents: input.woz == null ? null : euro(input.woz),
    interestStatus:
      input.interest === 'UNKNOWN' ? 'UNKNOWN' : input.interest == null ? 'NONE' : 'KNOWN',
    deductibleInterestCents: typeof input.interest === 'number' ? euro(input.interest) : null,
    shareBps: 10_000,
    shareAssumed: false,
    knownBox1: input.knownBox1 === true,
    knownAssessment: input.knownAssessment === true,
  });
}

const ownerA = ownerCalc({ woz: 400_000, interest: null });
assert.equal(ownerA.status, 'COMPLETE');
assert.equal(ownerA.eigenwoningforfaitCents, euro(1_400));
assert.equal(ownerA.deductibleInterestCents, 0);
assert.equal(ownerA.hillenAdjustmentCents, calculateHillenAftrek2026(euro(1_400)));
assert.equal(
  ownerA.netOwnHomeBox1AdjustmentCents,
  euro(1_400) - (ownerA.hillenAdjustmentCents ?? 0),
);
assert.ok((ownerA.netOwnHomeBox1AdjustmentCents ?? 0) > 0);

const ownerB = ownerCalc({ woz: 400_000, interest: 8_000 });
assert.equal(ownerB.status, 'COMPLETE');
assert.equal(ownerB.netOwnHomeBox1AdjustmentCents, euro(1_400) - euro(8_000));
assert.ok((ownerB.netOwnHomeBox1AdjustmentCents ?? 0) < 0);
assert.equal(ownerB.hillenAdjustmentCents, 0);

const ownerC = ownerCalc({ woz: 400_000, interest: 1_000 });
assert.equal(ownerC.hillenAdjustmentCents, calculateHillenAftrek2026(euro(400)));
assert.equal(
  ownerC.netOwnHomeBox1AdjustmentCents,
  euro(400) - (ownerC.hillenAdjustmentCents ?? 0),
);

const ownerE = ownerCalc({ woz: 1_500_000, interest: 0 });
assert.equal(ownerE.eigenwoningforfaitCents, euro(8_250));

const ownerF = ownerCalc({ woz: 400_000, interest: 'UNKNOWN' });
assert.equal(ownerF.status, 'PARTIAL');
assert.notEqual(ownerF.deductibleInterestCents, 0);
assert.equal(ownerF.deductibleInterestCents, null);
assert.equal(ownerF.eigenwoningforfaitCents, euro(1_400));
assert.ok(ownerF.assumptions.includes('MORTGAGE_INTEREST_UNKNOWN_NOT_ZERO'));

const notOwner = calculateOwnerOccupiedHome2026({
  tenure: 'OTHER',
  wozCents: euro(400_000),
  interestStatus: 'NONE',
  deductibleInterestCents: 0,
  shareBps: 10_000,
  shareAssumed: false,
  knownBox1: false,
  knownAssessment: false,
});
assert.equal(notOwner.status, 'NOT_APPLICABLE');
assert.equal(notOwner.netOwnHomeBox1AdjustmentCents, null);

const renterHh = {
  residents: [
    { localKey: 'a', role: 'APPLICANT' as const, ageYears: 30, assessmentIncomeCents: euro(20_000) },
  ],
  housingAssetsEligibility: 'ELIGIBLE' as const,
  midYearHouseholdChange: false,
};
const renterBefore = calculateHousingAllowance2026({
  midYearHouseholdChange: false,
  onlyTotalRentKnown: false,
  bareRentCentsPerMonth: 70_000,
  household: renterHh,
  userAssessmentIncomeCents: euro(20_000),
});
const renterAfter = calculateHousingAllowance2026({
  midYearHouseholdChange: false,
  onlyTotalRentKnown: false,
  bareRentCentsPerMonth: 70_000,
  household: renterHh,
  userAssessmentIncomeCents: euro(20_000),
});
assert.equal(renterAfter.annualCents, renterBefore.annualCents);

const renterState = employee({
  housingTenure: 'RENT',
  rentsHome: true,
  bareRentEuro: '700',
  housingHouseholdType: 'SINGLE',
  oldestHouseholdResidentAge: '30',
  housingAssetsEligibility: 'ELIGIBLE',
});
assert.ok(derivedWizardAllowances(renterState).includes('RENT'));
const renterMapped = wizardStateToCalculatorInput(renterState);
assert.equal(renterMapped?.housingTenure, 'RENTS');
assert.equal(renterMapped?.bareRentCentsPerMonth, 70_000);

const otherState = employee({ housingTenure: 'OTHER', rentsHome: false, bareRentEuro: '700' });
assert.equal(derivedWizardAllowances(otherState).includes('RENT'), false);
const otherMapped = wizardStateToCalculatorInput(otherState);
assert.equal(otherMapped?.housingTenure, 'DOES_NOT_RENT');
assert.equal(deriveIncomeBasesFromUserFacts(otherState).ownerHome.status, 'NOT_APPLICABLE');

const switched = employee({
  housingTenure: 'OWNER_OCCUPIED',
  rentsHome: false,
  bareRentEuro: '700',
  wozValueEuro: '400000',
  mortgageInterestStatus: 'KNOWN',
  deductibleMortgageInterestEuro: '8000',
});
assert.equal(derivedWizardAllowances(switched).includes('RENT'), false);
assert.equal(deriveIncomeBasesFromUserFacts(switched).ownerHome.status, 'COMPLETE');
assert.equal(wizardStateToCalculatorInput(switched)?.bareRentCentsPerMonth, 70_000);
assert.equal(wizardStateToCalculatorInput(switched)?.housingHousehold, null);

const backToRent = { ...switched, housingTenure: 'RENT' as const, rentsHome: true as const };
assert.ok(derivedWizardAllowances(backToRent).includes('RENT'));
assert.equal(deriveIncomeBasesFromUserFacts(backToRent).ownerHome.status, 'NOT_APPLICABLE');

const payrollOnly = deriveIncomeBasesFromUserFacts(employee());
assert.equal(payrollOnly.fiscalWageCents, 3_429_216);
assert.equal(payrollOnly.contractualGrossEmploymentIncomeCents, 3_175_200);
assert.equal(payrollOnly.payroll.used, true);

const withHome = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'KNOWN',
    deductibleMortgageInterestEuro: '8000',
  }),
);
assert.equal(withHome.contractualGrossEmploymentIncomeCents, payrollOnly.contractualGrossEmploymentIncomeCents);
assert.equal(withHome.fiscalWageCents, payrollOnly.fiscalWageCents);
assert.equal(withHome.payroll.used, true);
assert.equal(
  withHome.baselineBox1TaxableIncomeCents,
  (payrollOnly.baselineBox1TaxableIncomeCents ?? 0) + (ownerB.netOwnHomeBox1AdjustmentCents ?? 0),
);
assert.equal(withHome.baselineArbeidsinkomenCents, payrollOnly.baselineArbeidsinkomenCents);
assert.equal(withHome.baselineAssessmentIncomeCents, withHome.baselineBox1TaxableIncomeCents);

const noMortgage = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'NONE',
  }),
);
assert.equal(noMortgage.ownerHome.status, 'COMPLETE');
assert.ok((noMortgage.ownerHome.netOwnHomeBox1AdjustmentCents ?? 0) > 0);
assert.ok((noMortgage.ownerHome.hillenAdjustmentCents ?? 0) > 0);

const unknownInterest = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'UNKNOWN',
  }),
);
assert.equal(unknownInterest.ownerHome.status, 'PARTIAL');
assert.equal(unknownInterest.ownerHome.deductibleInterestCents, null);
assert.notEqual(unknownInterest.baselineBox1TaxableIncomeCents, payrollOnly.baselineBox1TaxableIncomeCents);

const knownFiscal = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'KNOWN',
    deductibleMortgageInterestEuro: '5000',
    advancedAccuracyRequested: true,
    baselineGrossEmploymentEuro: '40000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(knownFiscal.fiscalWageCents, euro(40_000));
assert.equal(
  knownFiscal.baselineBox1TaxableIncomeCents,
  euro(40_000) + euro(1_400) - euro(5_000),
);
assert.equal(knownFiscal.baselineAssessmentIncomeCents, knownFiscal.baselineBox1TaxableIncomeCents);
assert.equal(knownFiscal.basisProvenance.fiscalWage.kind, 'USER_PROVIDED');

const knownAssess = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'KNOWN',
    deductibleMortgageInterestEuro: '5000',
    advancedAccuracyRequested: true,
    baselineAssessmentEuro: '35000',
    amountEntryPeriod: 'MONTH',
  }),
);
assert.equal(knownAssess.baselineAssessmentIncomeCents, euro(35_000));
assert.equal(knownAssess.basisProvenance.assessment.kind, 'USER_PROVIDED');
assert.equal(knownAssess.ownerHome.applyToAssessment, false);
assert.notEqual(knownAssess.baselineAssessmentIncomeCents, euro(35_000) * 12);

const knownBoth = deriveIncomeBasesFromUserFacts(
  employee({
    housingTenure: 'OWNER_OCCUPIED',
    wozValueEuro: '400000',
    mortgageInterestStatus: 'KNOWN',
    deductibleMortgageInterestEuro: '5000',
    advancedAccuracyRequested: true,
    baselineGrossEmploymentEuro: '40000',
    baselineAssessmentEuro: '35000',
    amountEntryPeriod: 'YEAR',
  }),
);
assert.equal(knownBoth.fiscalWageCents, euro(40_000));
assert.equal(knownBoth.baselineAssessmentIncomeCents, euro(35_000));

const ztWithout = calculateHealthcareAllowance2026({
  hasPartner: false,
  assessmentIncomeCents: payrollOnly.baselineAssessmentIncomeCents ?? 0,
  partnerAssessmentIncomeCents: 0,
  partnerInsurance: 'INSURED',
});
const ztWith = calculateHealthcareAllowance2026({
  hasPartner: false,
  assessmentIncomeCents: withHome.baselineAssessmentIncomeCents ?? 0,
  partnerAssessmentIncomeCents: 0,
  partnerInsurance: 'INSURED',
});
assert.notEqual(ztWith, ztWithout);

const kgbHousehold = {
  children: [{ localKey: 'c', ageYears: 8, eligibilityStatus: 'ELIGIBLE' as const }],
  hasToeslagPartner: false as const,
  childBudgetAssetsEligibility: 'ELIGIBLE' as const,
  midYearHouseholdChange: false,
};
const kgbWithout = calculateChildBudget2026({
  household: kgbHousehold,
  userAssessmentIncomeCents: payrollOnly.baselineAssessmentIncomeCents ?? 0,
  partnerAssessmentIncomeCents: 0,
});
const kgbWith = calculateChildBudget2026({
  household: kgbHousehold,
  userAssessmentIncomeCents: withHome.baselineAssessmentIncomeCents ?? 0,
  partnerAssessmentIncomeCents: 0,
});
assert.notEqual(kgbWith.annualCents, kgbWithout.annualCents);

const highState = employee({
  currentIncomeEuro: '9000',
  housingTenure: 'OWNER_OCCUPIED',
  wozValueEuro: '400000',
  mortgageInterestStatus: 'KNOWN',
  deductibleMortgageInterestEuro: '10000',
});
const high = deriveIncomeBasesFromUserFacts(highState);
const highInput = wizardStateToCalculatorInput(highState);
assert.ok(highInput);
assert.ok((highInput?.ownerHomeDeductibleInterestCents ?? 0) > 0);
assert.ok((high.baselineBox1TaxableIncomeCents ?? 0) > euro(78_426));
const highCalc = runCalculator(highInput!);
assert.equal(highCalc.status, 'READY');
if (highCalc.status === 'READY') {
  const extra = calculateTariefsaanpassingEigenWoning2026({
    box1TaxableCents: high.baselineBox1TaxableIncomeCents ?? 0,
    deductibleOwnHomeCostsCents: high.ownerHome.deductibleInterestCents ?? 0,
  });
  assert.ok(extra.extraTaxCents > 0);
}

assert.equal(resolveHousingTenure({ rentsHome: false }), 'OTHER');
assert.equal(rentsHomeFromTenure('OWNER_OCCUPIED'), false);
assert.equal(calculatorHousingTenure('OWNER_OCCUPIED'), 'DOES_NOT_RENT');
assert.equal(visibleSteps(employee({ housingTenure: 'OWNER_OCCUPIED', moneyDepthRequested: true })).includes('housingWoz'), true);
assert.equal(visibleSteps(employee({ housingTenure: 'OWNER_OCCUPIED', moneyDepthRequested: true })).includes('housingRent'), false);
assert.equal(visibleSteps(employee({ housingTenure: 'RENT', rentsHome: true, moneyDepthRequested: true })).includes('housingWoz'), false);

for (const key of ['woz', 'mortgage', 'hypotheek', 'interest', 'rente', 'eigenwoning', 'eigenwoningforfait', 'housing_value']) {
  assert.equal(inspectVerdienCheckAnalyticsPayload({ [key]: 1 }).ok, false);
}
assert.equal(inspectVerdienCheckAnalyticsPayload({ funnel_stage: 'baseline' }).ok, true);

const payrollSrc = fs.readFileSync(
  path.join(process.cwd(), 'lib/verdiencheck/rulesets/nl/2026/payroll-white-monthly.ts'),
  'utf8',
);
assert.doesNotMatch(payrollSrc, /eigenwoning|mortgage|woz/i);

const extraSrc = fs.readFileSync(path.join(process.cwd(), 'lib/verdiencheck/calculator/engine.ts'), 'utf8');
assert.match(extraSrc, /taxableRow/);
assert.match(extraSrc, /calculateTariefsaanpassingEigenWoning2026/);

console.log('PASS test-verdiencheck-housing-2026');
console.log(
  JSON.stringify(
    {
      OWNER_A: ownerA.netOwnHomeBox1AdjustmentCents,
      OWNER_B: ownerB.netOwnHomeBox1AdjustmentCents,
      OWNER_C: ownerC.netOwnHomeBox1AdjustmentCents,
      OWNER_E: ownerE.eigenwoningforfaitCents,
      OWNER_F: ownerF.status,
      ZT_WITHOUT: ztWithout,
      ZT_WITH: ztWith,
      HOLIDAY: payrollOnly.fiscalWageCents,
    },
    null,
    2,
  ),
);
