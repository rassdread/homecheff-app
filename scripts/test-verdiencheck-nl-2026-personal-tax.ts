/**
 * VerdienCheck Fase 3C — NL-2026 IACK + AOW personal tax.
 *
 * Independent expected values use a 1e9 scale (production uses 1e6).
 *
 *   npx tsx scripts/test-verdiencheck-nl-2026-personal-tax.ts
 */
import assert from 'node:assert/strict';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorInput } from '../lib/verdiencheck/calculator/types';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { paintingOnceFiveThousand } from '../lib/verdiencheck/domain/activity';
import { V1_COST_SOURCE } from '../lib/verdiencheck/domain/costs';
import {
  resolveIackEligibility2026,
  type IackContext,
} from '../lib/verdiencheck/domain/iack';
import { OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED } from '../lib/verdiencheck/domain/aow';
import {
  calculateBox1Tax2026FullYearAow,
  calculateBox1Tax2026ReachesAow,
} from '../lib/verdiencheck/nl2026/box1';
import { calculateGeneralTaxCredit2026FullYearAow } from '../lib/verdiencheck/nl2026/general-tax-credit';
import { calculateEmploymentTaxCredit2026FullYearAow } from '../lib/verdiencheck/nl2026/employment-tax-credit';
import { calculateIack2026BelowAow, calculateIack2026FullYearAow } from '../lib/verdiencheck/nl2026/iack';
import { calculateOlderPersonsTaxCredit2026 } from '../lib/verdiencheck/nl2026/older-persons-credit';
import { calculateSingleOlderPersonsTaxCredit2026 } from '../lib/verdiencheck/nl2026/single-older-persons-credit';
import { calculatePersonalTax2026 } from '../lib/verdiencheck/nl2026/personal-tax';
import { netIncomeTaxAfterCredits } from '../lib/verdiencheck/nl2026/net-income-tax';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import { IACK_ZERO_THROUGH_CENTS } from '../lib/verdiencheck/rulesets/nl/2026/personal-tax-parameters';

const results: Record<string, 'PASS' | 'FAIL'> = {
  IACK_ELIGIBILITY: 'FAIL',
  IACK_BELOW_AOW_BOUNDARIES: 'FAIL',
  FULL_YEAR_AOW_BOX1: 'FAIL',
  FULL_YEAR_AOW_AHK: 'FAIL',
  FULL_YEAR_AOW_AK: 'FAIL',
  IACK_FULL_YEAR_AOW: 'FAIL',
  OUDERENKORTING: 'FAIL',
  SINGLE_OLDER: 'FAIL',
  TRANSITION_YEAR: 'FAIL',
  GOLDEN_PARENT: 'FAIL',
  GOLDEN_AOW: 'FAIL',
  MODULE_STATUS: 'FAIL',
};

function euro(euros: number): number {
  if (!Number.isInteger(euros)) throw new Error(`euro() whole euros only: ${euros}`);
  return euros * 100;
}

const ORACLE_SCALE = BigInt(1_000_000_000);
const BN0 = BigInt(0);
const BN2 = BigInt(2);

function oFrom(cents: number): bigint {
  return BigInt(cents) * ORACLE_SCALE;
}
function oMul(scaled: bigint, n: number, d: number): bigint {
  return (scaled * BigInt(n)) / BigInt(d);
}
function oRound(scaled: bigint): number {
  const half = ORACLE_SCALE / BN2;
  if (scaled >= BN0) return Number((scaled + half) / ORACLE_SCALE);
  return -Number((-scaled + half) / ORACLE_SCALE);
}
function oMax0(s: bigint): bigint {
  return s < BN0 ? BN0 : s;
}
function oClamp(s: bigint, lo: bigint, hi: bigint): bigint {
  if (s < lo) return lo;
  if (s > hi) return hi;
  return s;
}

function nearly(actual: number, expected: number, label: string): void {
  assert.equal(actual, expected, `${label}: actual=${actual} expected=${expected}`);
}

function qualifyingChild(over: Partial<IackContext['children'][number]> = {}) {
  return {
    bornAfter2013_12_31: true as const,
    childUnder12On2026_01_01: true as const,
    householdDurationEligibility: 'AT_LEAST_6_MONTHS' as const,
    coParentEligibility: 'HOUSEHOLD_MEMBER' as const,
    ...over,
  };
}

function iackCtx(over: Partial<IackContext> = {}): IackContext {
  return {
    children: [qualifyingChild()],
    fiscalPartnerDuration: 'NONE',
    partnerArbeidsinkomenCents: null,
    relativeAge: null,
    ...over,
  };
}

function oracleIack(
  cents: number,
  rateN: number,
  rateD: number,
  maxCents: number,
): number {
  if (cents <= euro(6_239)) return 0;
  if (cents >= euro(32_711)) return maxCents;
  return oRound(oMul(oFrom(cents - euro(6_239)), rateN, rateD));
}

function oracleBox1Aow(cents: number, b1Euro: number): number {
  const income = oFrom(cents);
  const b1 = oFrom(euro(b1Euro));
  const b2 = oFrom(euro(78_426));
  const s1 = income < b1 ? income : b1;
  const s2raw = income > b1 ? income - b1 : BN0;
  const s2cap = b2 - b1;
  const s2 = s2raw < s2cap ? s2raw : s2cap;
  const s3 = income > b2 ? income - b2 : BN0;
  return oRound(oMul(s1, 1785, 10_000) + oMul(s2, 3756, 10_000) + oMul(s3, 4950, 10_000));
}

function oracleAhkAow(cents: number): number {
  if (cents >= euro(78_427)) return 0;
  if (cents <= euro(29_736)) return euro(1_556);
  const red = oMul(oFrom(cents - euro(29_736)), 3195, 100_000);
  return oRound(oClamp(oMax0(oFrom(euro(1_556)) - red), BN0, oFrom(euro(1_556))));
}

function oracleAkAow(cents: number): number {
  if (cents === 0 || cents >= euro(132_921)) return 0;
  let scaled: bigint;
  if (cents <= euro(11_965)) {
    scaled = oMul(oFrom(cents), 4156, 100_000);
  } else if (cents <= euro(25_845)) {
    scaled = oFrom(euro(498)) + oMul(oFrom(cents - euro(11_965)), 15483, 100_000);
  } else if (cents <= euro(45_592)) {
    scaled = oFrom(euro(2_647)) + oMul(oFrom(cents - euro(25_845)), 974, 100_000);
  } else if (cents <= euro(132_920)) {
    scaled = oMax0(
      oFrom(euro(2_840)) - oMul(oFrom(cents - euro(45_592)), 3250, 100_000),
    );
  } else {
    return 0;
  }
  return oRound(oClamp(scaled, BN0, oFrom(1_000_000_000)));
}

function oracleOlder(cents: number): number {
  if (cents >= euro(59_783)) return 0;
  if (cents <= euro(46_002)) return euro(2_067);
  const red = oMul(oFrom(cents - euro(46_002)), 15, 100);
  return oRound(oClamp(oMax0(oFrom(euro(2_067)) - red), BN0, oFrom(euro(2_067))));
}

function employeeCore(
  baselineEuro: number,
  extraEuro: number,
  over: Partial<CalculatorInput> = {},
): CalculatorInput {
  const base = euro(baselineEuro);
  const extra = euro(extraEuro);
  return {
    jurisdiction: 'NL',
    calendarYear: 2026,
    personContext: { situation: 'EMPLOYEE' },
    currentAnnualIncomeCents: 99_999_999,
    ageTaxRegime: 'BELOW_AOW_2026',
    additionalIncomeClassification: 'RESULT_FROM_OTHER_WORK',
    assumeEstimatedCostsTaxDeductible: true,
    baselineGrossEmploymentIncomeCents: base,
    baselineBox1TaxableIncomeCents: base,
    baselineAggregateIncomeCents: base,
    baselineArbeidsinkomenCents: base,
    baselineAssessmentIncomeCents: base,
    baselineZvwContributionIncomeAlreadyUsedCents: base,
    assetsEligibility: 'ELIGIBLE',
    partnerContext: { hasPartner: false, partnerHealthcareInsuranceStatus: 'INSURED' },
    allowances: ['NONE'],
    activity: paintingOnceFiveThousand(),
    incomeSource: 'MARKETPLACE_SELLER',
    estimatedTurnoverCents: extra,
    estimatedCosts: { amountCents: 0, source: V1_COST_SOURCE },
    commercialResultCents: extra,
    scenarioAdditionalResultCents: extra,
    ...over,
  };
}

{
  const none = resolveIackEligibility2026({
    context: iackCtx({ children: [] }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(none.status, 'NOT_ELIGIBLE');

  const oldChild = resolveIackEligibility2026({
    context: iackCtx({
      children: [qualifyingChild({ childUnder12On2026_01_01: false })],
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(oldChild.status, 'NOT_ELIGIBLE');

  const noPartner = resolveIackEligibility2026({
    context: iackCtx(),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(noPartner.status, 'ELIGIBLE');

  const shortPartner = resolveIackEligibility2026({
    context: iackCtx({ fiscalPartnerDuration: 'LESS_THAN_6_MONTHS' }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(shortPartner.status, 'ELIGIBLE');

  const longLower = resolveIackEligibility2026({
    context: iackCtx({
      fiscalPartnerDuration: 'MORE_THAN_6_MONTHS',
      partnerArbeidsinkomenCents: euro(25_000),
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(longLower.status, 'ELIGIBLE');

  const longHigher = resolveIackEligibility2026({
    context: iackCtx({
      fiscalPartnerDuration: 'MORE_THAN_6_MONTHS',
      partnerArbeidsinkomenCents: euro(15_000),
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(longHigher.status, 'NOT_ELIGIBLE');

  const equalUserOlder = resolveIackEligibility2026({
    context: iackCtx({
      fiscalPartnerDuration: 'MORE_THAN_6_MONTHS',
      partnerArbeidsinkomenCents: euro(20_000),
      relativeAge: 'USER_OLDER',
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(equalUserOlder.status, 'ELIGIBLE');

  const equalPartnerOlder = resolveIackEligibility2026({
    context: iackCtx({
      fiscalPartnerDuration: 'MORE_THAN_6_MONTHS',
      partnerArbeidsinkomenCents: euro(20_000),
      relativeAge: 'PARTNER_OLDER',
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(equalPartnerOlder.status, 'NOT_ELIGIBLE');

  const equalUnknown = resolveIackEligibility2026({
    context: iackCtx({
      fiscalPartnerDuration: 'MORE_THAN_6_MONTHS',
      partnerArbeidsinkomenCents: euro(20_000),
      relativeAge: 'UNKNOWN',
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(equalUnknown.status, 'UNKNOWN');

  const missingPartnerIncome = resolveIackEligibility2026({
    context: iackCtx({ fiscalPartnerDuration: 'MORE_THAN_6_MONTHS' }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(missingPartnerIncome.status, 'UNKNOWN');

  const coUnknown = resolveIackEligibility2026({
    context: iackCtx({
      children: [
        qualifyingChild({
          householdDurationEligibility: 'LESS_THAN_6_MONTHS',
          coParentEligibility: 'UNKNOWN',
        }),
      ],
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(coUnknown.status, 'UNKNOWN');

  const coYes = resolveIackEligibility2026({
    context: iackCtx({
      children: [
        qualifyingChild({
          householdDurationEligibility: 'LESS_THAN_6_MONTHS',
          coParentEligibility: 'QUALIFYING_CO_PARENT',
        }),
      ],
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(coYes.status, 'ELIGIBLE');

  const coNo = resolveIackEligibility2026({
    context: iackCtx({
      children: [
        qualifyingChild({
          householdDurationEligibility: 'LESS_THAN_6_MONTHS',
          coParentEligibility: 'NOT_QUALIFYING',
        }),
      ],
    }),
    userArbeidsinkomenCents: euro(20_000),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(coNo.status, 'NOT_ELIGIBLE');

  const lowIncome = resolveIackEligibility2026({
    context: iackCtx(),
    userArbeidsinkomenCents: euro(6_239),
    incomeThresholdCents: IACK_ZERO_THROUGH_CENTS,
  });
  assert.equal(lowIncome.status, 'NOT_ELIGIBLE');
  results.IACK_ELIGIBILITY = 'PASS';
}

{
  const pts = [6_238, 6_239, 6_240, 32_709, 32_710, 32_711].map(euro);
  for (const p of pts) {
    nearly(
      calculateIack2026BelowAow(p),
      oracleIack(p, 11_450, 100_000, euro(3_032)),
      `iack-below@${p}`,
    );
  }
  assert.equal(calculateIack2026BelowAow(euro(6_239)), 0);
  assert.equal(calculateIack2026BelowAow(euro(32_711)), euro(3_032));
  assert.ok(calculateIack2026BelowAow(euro(6_240)) > 0);
  results.IACK_BELOW_AOW_BOUNDARIES = 'PASS';
}

{
  const before = [41_122, 41_123, 41_124, 78_425, 78_426, 78_427].map(euro);
  for (const p of before) {
    nearly(
      calculateBox1Tax2026FullYearAow(p, 'BORN_BEFORE_1946'),
      oracleBox1Aow(p, 41_123),
      `box1-aow-pre1946@${p}`,
    );
  }
  const after = [38_882, 38_883, 38_884, 78_425, 78_426, 78_427].map(euro);
  for (const p of after) {
    nearly(
      calculateBox1Tax2026FullYearAow(p, 'BORN_ON_OR_AFTER_1946'),
      oracleBox1Aow(p, 38_883),
      `box1-aow-1946@${p}`,
    );
  }
  assert.ok(
    calculateBox1Tax2026FullYearAow(euro(41_124), 'BORN_BEFORE_1946') >
      calculateBox1Tax2026FullYearAow(euro(41_123), 'BORN_BEFORE_1946'),
  );
  results.FULL_YEAR_AOW_BOX1 = 'PASS';
}

{
  const pts = [29_735, 29_736, 29_737, 78_425, 78_426, 78_427].map(euro);
  for (const p of pts) {
    nearly(calculateGeneralTaxCredit2026FullYearAow(p), oracleAhkAow(p), `ahk-aow@${p}`);
  }
  assert.equal(calculateGeneralTaxCredit2026FullYearAow(euro(29_736)), euro(1_556));
  assert.equal(calculateGeneralTaxCredit2026FullYearAow(euro(78_427)), 0);
  results.FULL_YEAR_AOW_AHK = 'PASS';
}

{
  const pts = [
    11_964, 11_965, 11_966, 25_844, 25_845, 25_846, 45_591, 45_592, 45_593, 132_919,
    132_920, 132_921,
  ].map(euro);
  for (const p of pts) {
    nearly(
      calculateEmploymentTaxCredit2026FullYearAow(p),
      oracleAkAow(p),
      `ak-aow@${p}`,
    );
  }
  assert.equal(calculateEmploymentTaxCredit2026FullYearAow(0), 0);
  assert.equal(calculateEmploymentTaxCredit2026FullYearAow(euro(132_921)), 0);
  results.FULL_YEAR_AOW_AK = 'PASS';
}

{
  const pts = [6_238, 6_239, 6_240, 32_709, 32_710, 32_711].map(euro);
  for (const p of pts) {
    nearly(
      calculateIack2026FullYearAow(p),
      oracleIack(p, 572, 10_000, euro(1_513)),
      `iack-aow@${p}`,
    );
  }
  assert.equal(calculateIack2026FullYearAow(euro(32_711)), euro(1_513));
  assert.ok(
    calculateIack2026FullYearAow(euro(20_000)) <
      calculateIack2026BelowAow(euro(20_000)),
  );
  results.IACK_FULL_YEAR_AOW = 'PASS';
}

{
  const pts = [46_001, 46_002, 46_003, 59_781, 59_782, 59_783].map(euro);
  for (const p of pts) {
    nearly(calculateOlderPersonsTaxCredit2026(p), oracleOlder(p), `older@${p}`);
  }
  assert.equal(calculateOlderPersonsTaxCredit2026(euro(46_002)), euro(2_067));
  assert.equal(calculateOlderPersonsTaxCredit2026(euro(59_783)), 0);
  results.OUDERENKORTING = 'PASS';
}

{
  assert.equal(isUnknown(calculateSingleOlderPersonsTaxCredit2026('UNKNOWN')), true);
  assert.equal(isUnknown(calculateSingleOlderPersonsTaxCredit2026(null)), true);
  assert.equal(calculateSingleOlderPersonsTaxCredit2026('NOT_ELIGIBLE'), 0);
  assert.equal(calculateSingleOlderPersonsTaxCredit2026('ELIGIBLE'), euro(540));
  results.SINGLE_OLDER = 'PASS';
}

{
  const jan = calculateBox1Tax2026ReachesAow(euro(38_883), 'JANUARY');
  const dec = calculateBox1Tax2026ReachesAow(euro(38_883), 'DECEMBER');
  assert.ok(dec > jan);
  const slice = calculatePersonalTax2026({
    regime: 'REACHES_AOW_IN_2026',
    aowMonth: 'JULY',
    box1Cents: euro(20_000),
    aggregateCents: euro(20_000),
    arbeidsinkomenCents: euro(20_000),
    singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
  });
  assert.equal(typeof slice.taxBeforeCredits, 'number');
  assert.equal(isUnknown(slice.generalTaxCredit), true);
  assert.equal(isUnknown(slice.employmentTaxCredit), true);
  assert.equal(isUnknown(slice.iack), false);
  assert.equal(slice.iack, 0);
  assert.equal(isUnknown(slice.incomeTaxAfterCredits), true);
  assert.ok(slice.missingInputs.some((m) => m.includes(OFFICIAL_TRANSITION_FORMULA_NOT_CERTIFIED)));

  const withIack = calculatePersonalTax2026({
    regime: 'REACHES_AOW_IN_2026',
    aowMonth: 'JULY',
    box1Cents: euro(20_000),
    aggregateCents: euro(20_000),
    arbeidsinkomenCents: euro(20_000),
    iackContext: iackCtx(),
    singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
  });
  assert.equal(isUnknown(withIack.iack), true);

  const engine = runCalculator(
    employeeCore(20_000, 1_000, {
      ageTaxRegime: 'REACHES_AOW_IN_2026',
      aowMonth: 'JULY',
      singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
    }),
  );
  assert.equal(engine.status, 'READY');
  if (engine.status === 'READY') {
    assert.equal(engine.netExtraIsDefinitive, false);
    assert.equal(isUnknown(engine.deltas.incomeTax), true);
    assert.equal(isUnknown(engine.netExtraCents), true);
  }
  results.TRANSITION_YEAR = 'PASS';
}

{
  const ctx = iackCtx();
  const rise = runCalculator(
    employeeCore(15_000, 5_000, { iackContext: ctx }),
  );
  assert.equal(rise.status, 'READY');
  if (rise.status === 'READY') {
    assert.equal(typeof rise.baseline.iack, 'number');
    assert.equal(typeof rise.scenario.iack, 'number');
    assert.ok((rise.scenario.iack as number) > (rise.baseline.iack as number));
    const taxA = netIncomeTaxAfterCredits({
      taxBeforeCreditsCents: rise.baseline.incomeTax as number,
      generalTaxCreditCents: 0,
      employmentTaxCreditCents: 0,
    });
    void taxA;
    const sliceA = calculatePersonalTax2026({
      regime: 'BELOW_AOW_2026',
      box1Cents: euro(15_000),
      aggregateCents: euro(15_000),
      arbeidsinkomenCents: euro(15_000),
      iackContext: ctx,
    });
    const sliceB = calculatePersonalTax2026({
      regime: 'BELOW_AOW_2026',
      box1Cents: euro(20_000),
      aggregateCents: euro(20_000),
      arbeidsinkomenCents: euro(20_000),
      iackContext: ctx,
    });
    assert.equal(rise.deltas.incomeTax, (sliceB.incomeTaxAfterCredits as number) - (sliceA.incomeTaxAfterCredits as number));
    assert.ok((sliceB.iack as number) > (sliceA.iack as number));
    assert.ok((sliceB.generalTaxCredit as number) !== (sliceA.generalTaxCredit as number) || (sliceB.employmentTaxCredit as number) !== (sliceA.employmentTaxCredit as number) || (sliceB.iack as number) !== (sliceA.iack as number));
  }

  const hitsMax = runCalculator(
    employeeCore(32_000, 2_000, { iackContext: ctx }),
  );
  if (hitsMax.status === 'READY') {
    assert.equal(hitsMax.scenario.iack, euro(3_032));
    assert.ok((hitsMax.scenario.iack as number) > (hitsMax.baseline.iack as number));
  }

  const alreadyMax = runCalculator(
    employeeCore(40_000, 1_000, { iackContext: ctx }),
  );
  if (alreadyMax.status === 'READY') {
    assert.equal(alreadyMax.baseline.iack, euro(3_032));
    assert.equal(alreadyMax.scenario.iack, euro(3_032));
  }

  const ineligible = runCalculator(
    employeeCore(15_000, 5_000, {
      iackContext: iackCtx({ children: [] }),
    }),
  );
  if (ineligible.status === 'READY') {
    assert.equal(ineligible.baseline.iack, 0);
    assert.equal(ineligible.scenario.iack, 0);
  }
  results.GOLDEN_PARENT = 'PASS';
}

{
  const aow20 = runCalculator(
    employeeCore(20_000, 1_000, {
      ageTaxRegime: 'FULL_YEAR_AOW_2026',
      aowBirthCohort: 'BORN_ON_OR_AFTER_1946',
      singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
    }),
  );
  assert.equal(aow20.status, 'READY');
  if (aow20.status === 'READY') {
    const a = calculatePersonalTax2026({
      regime: 'FULL_YEAR_AOW_2026',
      aowBirthCohort: 'BORN_ON_OR_AFTER_1946',
      box1Cents: euro(20_000),
      aggregateCents: euro(20_000),
      arbeidsinkomenCents: euro(20_000),
      singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
    });
    const b = calculatePersonalTax2026({
      regime: 'FULL_YEAR_AOW_2026',
      aowBirthCohort: 'BORN_ON_OR_AFTER_1946',
      box1Cents: euro(21_000),
      aggregateCents: euro(21_000),
      arbeidsinkomenCents: euro(21_000),
      singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
    });
    assert.equal(aow20.baseline.olderPersonsTaxCredit, euro(2_067));
    assert.equal(aow20.scenario.olderPersonsTaxCredit, euro(2_067));
    assert.equal(aow20.deltas.incomeTax, (b.incomeTaxAfterCredits as number) - (a.incomeTaxAfterCredits as number));
    assert.equal(aow20.netExtraIsDefinitive, true);
  }

  const aow45 = runCalculator(
    employeeCore(45_000, 2_000, {
      ageTaxRegime: 'FULL_YEAR_AOW_2026',
      aowBirthCohort: 'BORN_ON_OR_AFTER_1946',
      singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
    }),
  );
  if (aow45.status === 'READY') {
    assert.ok((aow45.scenario.olderPersonsTaxCredit as number) < (aow45.baseline.olderPersonsTaxCredit as number) || (aow45.baseline.olderPersonsTaxCredit as number) === euro(2_067));
    assert.equal(typeof aow45.deltas.incomeTax, 'number');
  }

  const aow59 = runCalculator(
    employeeCore(59_000, 2_000, {
      ageTaxRegime: 'FULL_YEAR_AOW_2026',
      aowBirthCohort: 'BORN_ON_OR_AFTER_1946',
      singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
    }),
  );
  if (aow59.status === 'READY') {
    assert.ok((aow59.scenario.olderPersonsTaxCredit as number) < (aow59.baseline.olderPersonsTaxCredit as number));
    assert.equal(aow59.scenario.olderPersonsTaxCredit, 0);
  }

  const pre1946 = runCalculator(
    employeeCore(41_123, 1, {
      ageTaxRegime: 'FULL_YEAR_AOW_2026',
      aowBirthCohort: 'BORN_BEFORE_1946',
      singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
    }),
  );
  if (pre1946.status === 'READY') {
    const taxA = calculateBox1Tax2026FullYearAow(euro(41_123), 'BORN_BEFORE_1946');
    const taxB = calculateBox1Tax2026FullYearAow(euro(41_123) + 100, 'BORN_BEFORE_1946');
    assert.ok(taxB > taxA);
    assert.equal(typeof pre1946.deltas.incomeTax, 'number');
  }

  const aowIack = runCalculator(
    employeeCore(20_000, 1_000, {
      ageTaxRegime: 'FULL_YEAR_AOW_2026',
      aowBirthCohort: 'BORN_ON_OR_AFTER_1946',
      singleOlderPersonsCreditEligibility: 'NOT_ELIGIBLE',
      iackContext: iackCtx(),
    }),
  );
  if (aowIack.status === 'READY') {
    assert.ok((aowIack.scenario.iack as number) > 0);
    assert.ok((aowIack.scenario.iack as number) < euro(3_032));
  }
  results.GOLDEN_AOW = 'PASS';
}

{
  assert.equal(NL_2026_MODULE_STATUS.iackBelowAow, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.box1FullYearAow, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.generalTaxCreditFullYearAow, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.employmentTaxCreditFullYearAow, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.iackFullYearAow, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.olderPersonsTaxCredit, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.singleOlderPersonsTaxCredit, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.aowTransitionYearBox1, 'CERTIFIED');
  assert.equal(NL_2026_MODULE_STATUS.aowTransitionYearCredits, 'DRAFT');
  assert.equal(NL_2026_MODULE_STATUS.jonggehandicaptenkorting, 'DRAFT');
  assert.equal(NL_2026_PACK.status, 'DRAFT');
  assert.equal(NL_2026_PACK.version, '2026.6-official-payroll-white-monthly');
  results.MODULE_STATUS = 'PASS';
}

const failed = Object.entries(results).filter(([, v]) => v !== 'PASS');
if (failed.length > 0) {
  console.error(results);
  throw new Error(`FAIL: ${failed.map(([k]) => k).join(', ')}`);
}
console.log('verdiencheck NL-2026 personal tax tests: PASS');
console.log(results);
