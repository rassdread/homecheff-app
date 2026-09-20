/**
 * VerdienCheck Fase 3A — NL-2026 core calculator.
 *
 * Independent expected values use a 1e9 scale (production uses 1e6).
 * Official aanslag rounding is ROUNDING_PENDING_CERTIFICATION.
 *
 *   npx tsx scripts/test-verdiencheck-nl-2026-core.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  isVerdienCheckEnabled,
  isVerdienCheckPublicEnabled,
  isVerdienCheckPersistenceEnabled,
  isVerdienCheckReceiptVaultEnabled,
} from '../lib/verdiencheck/flags';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorInput } from '../lib/verdiencheck/calculator/types';
import { UNKNOWN, isUnknown } from '../lib/verdiencheck/domain/unknown';
import { paintingOnceFiveThousand } from '../lib/verdiencheck/domain/activity';
import { V1_COST_SOURCE } from '../lib/verdiencheck/domain/costs';
import { defaultBlocking } from '../lib/verdiencheck/guidance/types';
import { calculateBox1Tax2026BelowAow } from '../lib/verdiencheck/nl2026/box1';
import { calculateGeneralTaxCredit2026BelowAow } from '../lib/verdiencheck/nl2026/general-tax-credit';
import { calculateEmploymentTaxCredit2026BelowAow } from '../lib/verdiencheck/nl2026/employment-tax-credit';
import { calculateAdditionalZvw2026 } from '../lib/verdiencheck/nl2026/zvw';
import { calculateHealthcareAllowance2026 } from '../lib/verdiencheck/nl2026/healthcare-allowance';
import { resolveTaxableRowResult } from '../lib/verdiencheck/nl2026/row';
import { netIncomeTaxAfterCredits } from '../lib/verdiencheck/nl2026/net-income-tax';
import { NL_2026_PACK } from '../lib/verdiencheck/rulesets/nl/2026';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import { ROUNDING_STATUS, ROUNDING_STRATEGY } from '../lib/verdiencheck/math/scaled';
import { getRulePack } from '../lib/verdiencheck/rulesets/registry';

const ROOT = process.cwd();
const results: Record<string, 'PASS' | 'FAIL'> = {
  BOX1_2026: 'FAIL',
  GENERAL_TAX_CREDIT_2026: 'FAIL',
  EMPLOYMENT_TAX_CREDIT_2026: 'FAIL',
  ROW_EMPLOYMENT_INCOME_TREATMENT: 'FAIL',
  ZVW_2026: 'FAIL',
  HEALTHCARE_ALLOWANCE_2026: 'FAIL',
  A_VS_B: 'FAIL',
  UNKNOWN_PROPAGATION: 'FAIL',
  PARTIAL_RESULT_SAFETY: 'FAIL',
  JURISDICTION_ISOLATION: 'FAIL',
  NO_NEW_PLATFORM_BLOCKERS: 'FAIL',
};

function euro(euros: number): number {
  if (!Number.isInteger(euros)) throw new Error(`euro() whole euros only: ${euros}`);
  return euros * 100;
}

/** Independent scale — not the production CENT_SCALE. */
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

function oracleBox1(cents: number): number {
  const income = oFrom(cents);
  const b1 = oFrom(euro(38_883));
  const b2 = oFrom(euro(78_426));
  const s1 = income < b1 ? income : b1;
  const s2raw = income > b1 ? income - b1 : BN0;
  const s2cap = b2 - b1;
  const s2 = s2raw < s2cap ? s2raw : s2cap;
  const s3 = income > b2 ? income - b2 : BN0;
  return oRound(
    oMul(s1, 3575, 10_000) + oMul(s2, 3756, 10_000) + oMul(s3, 4950, 10_000),
  );
}

function oracleAhk(cents: number): number {
  if (cents >= euro(78_427)) return 0;
  if (cents <= euro(29_736)) return euro(3_115);
  const reduction = oMul(oFrom(cents - euro(29_736)), 6398, 100_000);
  const credit = oMax0(oFrom(euro(3_115)) - reduction);
  const max = oFrom(euro(3_115));
  const clamped = credit > max ? max : credit;
  return oRound(clamped);
}

function oracleAk(cents: number): number {
  if (cents <= 0) return 0;
  if (cents >= euro(132_921)) return 0;
  let scaled: bigint;
  if (cents <= euro(11_965)) {
    scaled = oMul(oFrom(cents), 8324, 100_000);
  } else if (cents <= euro(25_845)) {
    scaled = oFrom(euro(996)) + oMul(oFrom(cents - euro(11_965)), 31009, 100_000);
  } else if (cents <= euro(45_592)) {
    scaled = oFrom(euro(5_300)) + oMul(oFrom(cents - euro(25_845)), 1950, 100_000);
  } else if (cents <= euro(132_920)) {
    scaled = oMax0(
      oFrom(euro(5_685)) - oMul(oFrom(cents - euro(45_592)), 6510, 100_000),
    );
  } else {
    return 0;
  }
  return oRound(scaled < BN0 ? BN0 : scaled);
}

function oracleNetTax(box1: number, agg: number, arb: number): number {
  const net =
    oracleBox1(box1) - oracleAhk(agg) - oracleAk(arb);
  return net < 0 ? 0 : net;
}

function oracleZvw(row: number, used: number): {
  remaining: number;
  base: number;
  contrib: number;
} {
  const remaining = Math.max(0, euro(79_409) - used);
  const base = Math.min(row, remaining);
  return {
    remaining,
    base,
    contrib: oRound(oMul(oFrom(base), 485, 10_000)),
  };
}

function oracleHealthcare(input: {
  hasPartner: boolean;
  assessment: number;
  partnerAssessment?: number;
  partnerInsurance?: 'INSURED' | 'NOT_INSURED';
}): number {
  const threshold = euro(29_736);
  const premium = euro(2_119);
  if (!input.hasPartner) {
    if (input.assessment > euro(40_857)) return 0;
    const above = oMax0(oFrom(input.assessment) - oFrom(threshold));
    const norm =
      oMul(oFrom(threshold), 1912, 100_000) + oMul(above, 13730, 100_000);
    return oRound(oMax0(oFrom(premium) - norm));
  }
  const joint = input.assessment + (input.partnerAssessment ?? 0);
  if (joint > euro(51_142)) return 0;
  const above = oMax0(oFrom(joint) - oFrom(threshold));
  const norm =
    oMul(oFrom(threshold), 4289, 100_000) + oMul(above, 13730, 100_000);
  let allowance = oMax0(oFrom(premium) + oFrom(premium) - norm);
  if (input.partnerInsurance === 'NOT_INSURED') {
    allowance = oMul(allowance, 1, 2);
  }
  return oRound(allowance);
}

function nearly(actual: number, expected: number, label: string, tol = 0): void {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= tol,
    `${label}: actual=${actual} expected=${expected} diff=${diff} tol=${tol}`,
  );
}

function activity() {
  return paintingOnceFiveThousand();
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
    allowances: ['HEALTHCARE'],
    activity: activity(),
    incomeSource: 'MARKETPLACE_SELLER',
    estimatedTurnoverCents: extra,
    estimatedCosts: { amountCents: 0, source: V1_COST_SOURCE },
    commercialResultCents: extra,
    scenarioAdditionalResultCents: extra,
    ...over,
  };
}

// --- rounding metadata
assert.equal(ROUNDING_STRATEGY, 'ROUND_HALF_UP_TO_CENTS');
assert.equal(ROUNDING_STATUS, 'ROUNDING_PENDING_CERTIFICATION');
assert.equal(NL_2026_PACK.parameters['rounding.status']?.value, ROUNDING_STATUS);
assert.equal(NL_2026_PACK.status, 'DRAFT');
assert.equal(NL_2026_MODULE_STATUS.incomeTax, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.row, 'CERTIFIED_FOR_ASSUMPTION_MODE');
assert.equal(NL_2026_MODULE_STATUS.rentAllowance, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.childBudget, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.childcareAllowance, 'CERTIFIED');
assert.notEqual(NL_2026_PACK.parameters['zt.standardPremiumCents']?.value, euro(2_143));
assert.equal(NL_2026_PACK.parameters['zt.standardPremiumCents']?.value, euro(2_119));

// --- BOX 1 boundaries + monotonicity
{
  const pts = [0, 38_882, 38_883, 38_884, 78_425, 78_426, 78_427].map(euro);
  let prev = -1;
  for (const p of pts) {
    const actual = calculateBox1Tax2026BelowAow(p);
    nearly(actual, oracleBox1(p), `box1@${p}`);
    assert.ok(actual >= prev, `box1 not monotonic at ${p}`);
    prev = actual;
  }
  assert.equal(calculateBox1Tax2026BelowAow(0), 0);
  assert.ok(calculateBox1Tax2026BelowAow(euro(38_884)) > calculateBox1Tax2026BelowAow(euro(38_883)));
  results.BOX1_2026 = 'PASS';
}

// --- AHK boundaries
{
  const pts = [29_735, 29_736, 29_737, 78_425, 78_426, 78_427].map(euro);
  for (const p of pts) {
    const actual = calculateGeneralTaxCredit2026BelowAow(p);
    nearly(actual, oracleAhk(p), `ahk@${p}`);
    assert.ok(actual >= 0);
    assert.ok(actual <= euro(3_115));
  }
  assert.equal(calculateGeneralTaxCredit2026BelowAow(euro(29_736)), euro(3_115));
  assert.equal(calculateGeneralTaxCredit2026BelowAow(euro(78_427)), 0);
  assert.ok(calculateGeneralTaxCredit2026BelowAow(euro(29_737)) < euro(3_115));
  results.GENERAL_TAX_CREDIT_2026 = 'PASS';
}

// --- AK boundaries
{
  const pts = [
    0, 11_964, 11_965, 11_966, 25_844, 25_845, 25_846, 45_591, 45_592, 45_593,
    132_919, 132_920, 132_921,
  ].map(euro);
  for (const p of pts) {
    const actual = calculateEmploymentTaxCredit2026BelowAow(p);
    nearly(actual, oracleAk(p), `ak@${p}`);
    assert.ok(actual >= 0);
  }
  assert.equal(calculateEmploymentTaxCredit2026BelowAow(0), 0);
  assert.equal(calculateEmploymentTaxCredit2026BelowAow(euro(132_921)), 0);
  results.EMPLOYMENT_TAX_CREDIT_2026 = 'PASS';
}

// --- ZVW boundaries
{
  const cases: Array<[number, number, number]> = [
    [0, euro(1_000), euro(1_000)],
    [euro(79_408), euro(1_000), euro(1)],
    [euro(79_409), euro(1_000), 0],
    [euro(79_410), euro(1_000), 0],
    [euro(40_000), euro(50_000), euro(39_409)],
    [euro(80_000), euro(15_000), 0],
  ];
  for (const [used, row, expectedBase] of cases) {
    const z = calculateAdditionalZvw2026({
      positiveTaxableRowCents: row,
      baselineZvwContributionIncomeAlreadyUsedCents: used,
    });
    const o = oracleZvw(row, used);
    assert.equal(z.additionalBaseCents, expectedBase, `zvw base used=${used} row=${row}`);
    nearly(z.additionalBaseCents, o.base, `zvw oracle base used=${used}`);
    nearly(z.additionalZvwCents, o.contrib, `zvw contrib used=${used}`);
  }
  results.ZVW_2026 = 'PASS';
}

// --- Zorgtoeslag boundaries
{
  const singles = [29_735, 29_736, 29_737, 40_856, 40_857, 40_858];
  for (const e of singles) {
    const actual = calculateHealthcareAllowance2026({
      hasPartner: false,
      assessmentIncomeCents: euro(e),
    });
    nearly(actual, oracleHealthcare({ hasPartner: false, assessment: euro(e) }), `zt single ${e}`);
    assert.ok(actual >= 0);
  }
  assert.equal(
    calculateHealthcareAllowance2026({
      hasPartner: false,
      assessmentIncomeCents: euro(40_858),
    }),
    0,
  );
  const formulaAtMax = oracleHealthcare({
    hasPartner: false,
    assessment: euro(40_857),
  });
  assert.ok(
    formulaAtMax > 0,
    'official max income is inclusive; formula remainder at the cap is not €0',
  );
  const partners = [29_735, 29_736, 29_737, 51_141, 51_142, 51_143];
  for (const e of partners) {
    const actual = calculateHealthcareAllowance2026({
      hasPartner: true,
      assessmentIncomeCents: euro(e),
      partnerAssessmentIncomeCents: 0,
      partnerInsurance: 'INSURED',
    });
    nearly(
      actual,
      oracleHealthcare({ hasPartner: true, assessment: euro(e), partnerInsurance: 'INSURED' }),
      `zt partner ${e}`,
    );
  }
  assert.equal(
    calculateHealthcareAllowance2026({
      hasPartner: true,
      assessmentIncomeCents: euro(51_143),
      partnerAssessmentIncomeCents: 0,
      partnerInsurance: 'INSURED',
    }),
    0,
  );
  const insured = calculateHealthcareAllowance2026({
    hasPartner: true,
    assessmentIncomeCents: euro(30_000),
    partnerAssessmentIncomeCents: 0,
    partnerInsurance: 'INSURED',
  });
  const notInsured = calculateHealthcareAllowance2026({
    hasPartner: true,
    assessmentIncomeCents: euro(30_000),
    partnerAssessmentIncomeCents: 0,
    partnerInsurance: 'NOT_INSURED',
  });
  nearly(notInsured * 2, insured, 'partner not insured is 50%', 1);
  results.HEALTHCARE_ALLOWANCE_2026 = 'PASS';
}

// --- ROW: commercial is not taxable without assumption; negative review
{
  const unknown = resolveTaxableRowResult({
    classification: 'RESULT_FROM_OTHER_WORK',
    commercialResultCents: euro(1_000),
    assumeEstimatedCostsTaxDeductible: false,
  });
  assert.equal(unknown.status, 'UNKNOWN');
  const ok = resolveTaxableRowResult({
    classification: 'RESULT_FROM_OTHER_WORK',
    commercialResultCents: euro(1_000),
    assumeEstimatedCostsTaxDeductible: true,
  });
  assert.equal(ok.status, 'OK');
  if (ok.status === 'OK') assert.equal(ok.taxableROWResultCents, euro(1_000));
  const neg = resolveTaxableRowResult({
    classification: 'RESULT_FROM_OTHER_WORK',
    commercialResultCents: 0,
    assumeEstimatedCostsTaxDeductible: true,
  });
  assert.equal(neg.status, 'SOURCE_OF_INCOME_REVIEW_REQUIRED');
}

// --- ROW counts as arbeidsinkomen
{
  const a = calculateEmploymentTaxCredit2026BelowAow(euro(20_000));
  const b = calculateEmploymentTaxCredit2026BelowAow(euro(21_000));
  assert.notEqual(a, b);
  const calc = runCalculator(employeeCore(20_000, 1_000));
  assert.equal(calc.status, 'READY');
  if (calc.status === 'READY') {
    assert.equal(calc.baseline.employmentTaxCredit, a);
    assert.equal(calc.scenario.employmentTaxCredit, b);
  }
  results.ROW_EMPLOYMENT_INCOME_TREATMENT = 'PASS';
}

// --- Golden A–F
{
  const scenarios: Array<{ id: string; base: number; extra: number }> = [
    { id: 'A', base: 20_000, extra: 1_000 },
    { id: 'B', base: 29_500, extra: 1_000 },
    { id: 'C', base: 38_500, extra: 1_000 },
    { id: 'D', base: 45_500, extra: 1_000 },
    { id: 'E', base: 78_000, extra: 2_000 },
    { id: 'F', base: 80_000, extra: 5_000 },
  ];
  for (const s of scenarios) {
    const baseC = euro(s.base);
    const extraC = euro(s.extra);
    const taxA = oracleNetTax(baseC, baseC, baseC);
    const taxB = oracleNetTax(baseC + extraC, baseC + extraC, baseC + extraC);
    const ahkA = oracleAhk(baseC);
    const ahkB = oracleAhk(baseC + extraC);
    const akA = oracleAk(baseC);
    const akB = oracleAk(baseC + extraC);
    const zvw = oracleZvw(extraC, baseC);
    const hcA = oracleHealthcare({ hasPartner: false, assessment: baseC });
    const hcB = oracleHealthcare({ hasPartner: false, assessment: baseC + extraC });
    const incomeTaxDelta = taxB - taxA;
    const hcDelta = hcB - hcA;
    const net = extraC - incomeTaxDelta - zvw.contrib + hcDelta;

    const calc = runCalculator(employeeCore(s.base, s.extra));
    assert.equal(calc.status, 'READY', `${s.id} status`);
    if (calc.status !== 'READY') continue;
    assert.equal(calc.completeness, 'COMPLETE_FOR_CORE', `${s.id} completeness`);
    assert.equal(calc.netExtraIsDefinitive, true, `${s.id} definitive`);
    assert.equal(calc.taxableAdditionalIncomeCents, extraC);
    nearly(calc.baseline.incomeTax as number, taxA, `${s.id} taxA`);
    nearly(calc.scenario.incomeTax as number, taxB, `${s.id} taxB`);
    nearly(calc.baseline.generalTaxCredit as number, ahkA, `${s.id} ahkA`);
    nearly(calc.scenario.generalTaxCredit as number, ahkB, `${s.id} ahkB`);
    nearly(calc.baseline.employmentTaxCredit as number, akA, `${s.id} akA`);
    nearly(calc.scenario.employmentTaxCredit as number, akB, `${s.id} akB`);
    nearly(calc.deltas.incomeTax as number, incomeTaxDelta, `${s.id} dTax`);
    nearly(calc.deltas.zvw as number, zvw.contrib, `${s.id} zvw`);
    nearly(calc.deltas.healthcareAllowance as number, hcDelta, `${s.id} hc`);
    nearly(calc.netExtraCents as number, net, `${s.id} net`);
    assert.notEqual(calc.deltas.incomeTax, extraC);
    assert.equal(
      netIncomeTaxAfterCredits({
        taxBeforeCreditsCents: calculateBox1Tax2026BelowAow(baseC),
        generalTaxCreditCents: calculateGeneralTaxCredit2026BelowAow(baseC),
        employmentTaxCreditCents: calculateEmploymentTaxCredit2026BelowAow(baseC),
      }) >= 0,
      true,
    );
  }
  results.A_VS_B = 'PASS';
}

// --- UNKNOWN propagation
{
  const noCosts = runCalculator(
    employeeCore(20_000, 1_000, { assumeEstimatedCostsTaxDeductible: false }),
  );
  assert.equal(noCosts.status, 'READY');
  if (noCosts.status === 'READY') {
    assert.equal(isUnknown(noCosts.taxableAdditionalIncomeCents), true);
    assert.equal(isUnknown(noCosts.netExtraCents), true);
    assert.equal(noCosts.completeness, 'PARTIAL');
  }

  const assetsUnknown = runCalculator(
    employeeCore(20_000, 1_000, { assetsEligibility: 'UNKNOWN' }),
  );
  assert.equal(assetsUnknown.status, 'READY');
  if (assetsUnknown.status === 'READY') {
    assert.equal(isUnknown(assetsUnknown.deltas.healthcareAllowance), true);
    assert.equal(isUnknown(assetsUnknown.netExtraCents), true);
  }

  const partnerUnknown = runCalculator(
    employeeCore(20_000, 1_000, {
      partnerContext: {
        hasPartner: true,
        partnerHealthcareInsuranceStatus: 'UNKNOWN',
        partnerAssessmentIncomeCents: euro(10_000),
      },
    }),
  );
  assert.equal(partnerUnknown.status, 'READY');
  if (partnerUnknown.status === 'READY') {
    assert.equal(isUnknown(partnerUnknown.deltas.healthcareAllowance), true);
  }

  const aow = runCalculator(
    employeeCore(20_000, 1_000, { ageTaxRegime: 'REACHES_AOW_IN_2026' }),
  );
  assert.equal(aow.status, 'READY');
  assert.equal(isUnknown(aow.netExtraCents), true);
  if (aow.status === 'READY') {
    assert.equal(aow.netExtraIsDefinitive, false);
    assert.equal(isUnknown(aow.deltas.incomeTax), true);
  }

  const fullAow = runCalculator(
    employeeCore(20_000, 1_000, { ageTaxRegime: 'FULL_YEAR_AOW_2026' }),
  );
  assert.equal(fullAow.status, 'READY');
  if (fullAow.status === 'READY') {
    assert.equal(fullAow.netExtraIsDefinitive, false);
  }

  const hobby = runCalculator(employeeCore(20_000, 0));
  assert.equal(hobby.status, 'SOURCE_OF_INCOME_REVIEW_REQUIRED');

  results.UNKNOWN_PROPAGATION = 'PASS';
}

// --- PARTIAL: unimplemented allowances never become €0 in net extra
{
  const partial = runCalculator(
    employeeCore(20_000, 1_000, { allowances: ['HEALTHCARE', 'RENT'] }),
  );
  assert.equal(partial.status, 'READY');
  if (partial.status === 'READY') {
    assert.equal(partial.completeness, 'PARTIAL');
    assert.equal(partial.netExtraIsDefinitive, false);
    assert.equal(isUnknown(partial.deltas.rentAllowance), true);
    assert.notEqual(partial.deltas.rentAllowance, 0);
    assert.equal(typeof partial.deltas.healthcareAllowance, 'number');
    assert.equal(typeof partial.netExtraCents, 'number');
  }

  const child = runCalculator(
    employeeCore(20_000, 1_000, { allowances: ['CHILD_BUDGET'] }),
  );
  assert.equal(child.status, 'READY');
  if (child.status === 'READY') {
    assert.equal(isUnknown(child.deltas.childBudget), true);
    assert.equal(child.unsupportedTaxCredits.includes('IACK'), false);
    assert.equal(child.netExtraIsDefinitive, false);
  }

  const none = runCalculator(employeeCore(20_000, 1_000, { allowances: ['NONE'] }));
  assert.equal(none.status, 'READY');
  if (none.status === 'READY') {
    assert.equal(none.deltas.healthcareAllowance, 0);
    assert.equal(none.deltas.rentAllowance, 0);
    assert.equal(none.netExtraIsDefinitive, true);
  }

  results.PARTIAL_RESULT_SAFETY = 'PASS';
}

// --- jurisdiction isolation
{
  for (const j of ['BE', 'SR', 'OTHER'] as const) {
    const pack = getRulePack(j, 2026);
    assert.equal(pack.ok, false);
    const calc = runCalculator(employeeCore(20_000, 1_000, { jurisdiction: j }));
    assert.equal(calc.status, 'JURISDICTION_NOT_SUPPORTED');
    assert.equal(isUnknown(calc.netExtraCents), true);
  }
  results.JURISDICTION_ISOLATION = 'PASS';
}

// --- platform blockers / production flags
{
  assert.equal(defaultBlocking({}), false);
  assert.equal(isVerdienCheckEnabled(), false);
  assert.equal(isVerdienCheckPublicEnabled(), false);
  assert.equal(isVerdienCheckPersistenceEnabled(), false);
  assert.equal(isVerdienCheckReceiptVaultEnabled(), false);
  assert.notEqual(UNKNOWN, 0);
  results.NO_NEW_PLATFORM_BLOCKERS = 'PASS';
}

const failed = Object.entries(results).filter(([, v]) => v !== 'PASS');
if (failed.length > 0) {
  console.error(results);
  throw new Error(`NL-2026 core failed: ${failed.map(([k]) => k).join(', ')}`);
}

const faq = fs.readFileSync(
  path.join(ROOT, 'docs/verdiencheck/FAQ-COMPLIANCE-INVENTORY.md'),
  'utf8',
);
assert.match(faq, /FASE 3A/);

console.log('verdiencheck NL-2026 core: PASS');
console.log(results);
