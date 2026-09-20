/**
 * VerdienCheck Fase 3B — NL-2026 toeslagenengine.
 * Independent expected values use a 1e9 scale (production uses 1e6).
 *
 *   npx tsx scripts/test-verdiencheck-nl-2026-allowances.ts
 */
import assert from 'node:assert/strict';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorInput } from '../lib/verdiencheck/calculator/types';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { paintingOnceFiveThousand } from '../lib/verdiencheck/domain/activity';
import { V1_COST_SOURCE } from '../lib/verdiencheck/domain/costs';
import type { HousingHousehold, HousingResident } from '../lib/verdiencheck/domain/household';
import { calculateHousingAllowance2026 } from '../lib/verdiencheck/nl2026/housing-allowance';
import { calculateChildBudget2026 } from '../lib/verdiencheck/nl2026/child-budget';
import {
  calculateChildcareAllowance2026,
  classifyFirstChild,
  lookupChildcareBand2026,
} from '../lib/verdiencheck/nl2026/childcare-allowance';
import {
  detectAllowanceKink,
  DEFAULT_KINK_EXTRAS_CENTS,
} from '../lib/verdiencheck/nl2026/allowance-kink';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import { KOT_TABLE_2026 } from '../lib/verdiencheck/rulesets/nl/2026/childcare-allowance-parameters';
import {
  isVerdienCheckPublicEnabled,
  isVerdienCheckPersistenceEnabled,
} from '../lib/verdiencheck/flags';

const results: Record<string, 'PASS' | 'FAIL'> = {
  HOUSING_BOUNDARIES: 'FAIL',
  HOUSING_GOLDEN: 'FAIL',
  CHILD_BUDGET_BOUNDARIES: 'FAIL',
  CHILD_BUDGET_GOLDEN: 'FAIL',
  CHILDCARE_BOUNDARIES: 'FAIL',
  CHILDCARE_GOLDEN: 'FAIL',
  A_VS_B: 'FAIL',
  UNKNOWN_PROPAGATION: 'FAIL',
  MID_YEAR: 'FAIL',
  KINK: 'FAIL',
  FULL_NET_EXTRA: 'FAIL',
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

function nearly(actual: number, expected: number, label: string, tol = 0): void {
  const diff = Math.abs(actual - expected);
  assert.ok(diff <= tol, `${label}: actual=${actual} expected=${expected} diff=${diff}`);
}

function oracleHousingAnnual(input: {
  bareRent: number;
  persons: number;
  income: number;
  youth: boolean;
}): number {
  const cap = input.youth ? 49_820 : 93_293;
  const calc = Math.min(input.bareRent, cap);
  const base = input.persons === 1 ? 20_252 : 20_071;
  const kkg = 49_820;
  const aftop = input.persons <= 2 ? 71_302 : 76_414;
  const s1 = Math.max(0, Math.min(calc, kkg) - base);
  const s2 = Math.max(0, Math.min(calc, aftop) - kkg);
  const s3 = Math.max(0, Math.min(calc, cap) - aftop);
  const raw = oFrom(s1) + oMul(oFrom(s2), 65, 100) + oMul(oFrom(s3), 40, 100);
  const ijk = input.persons === 1 ? 2_342_500 : 3_150_000;
  const pct = input.persons === 1 ? 27 : 22;
  const y = Math.max(0, input.income - ijk);
  const reduction = oMul(oMul(oFrom(y), pct, 100), 1, 12);
  const monthly = oRound(oMax0(raw - reduction));
  return monthly * 12;
}

function household(opts: {
  persons: 1 | 2 | 3;
  oldest: number;
  userIncome: number;
  child?: { age: number; income: number };
  assets?: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN' | null;
  under18Exception?: boolean | null;
}): HousingHousehold {
  const residents: HousingResident[] = [
    {
      localKey: 'a',
      role: 'APPLICANT',
      ageYears: opts.oldest,
      assessmentIncomeCents: opts.userIncome,
    },
  ];
  if (opts.persons >= 2) {
    residents.push({
      localKey: 'p',
      role: 'MEDEBEWONER',
      ageYears: opts.oldest,
      assessmentIncomeCents: 0,
    });
  }
  if (opts.persons >= 3) {
    residents.push({
      localKey: 'm2',
      role: 'MEDEBEWONER',
      ageYears: opts.oldest,
      assessmentIncomeCents: 0,
    });
  }
  if (opts.child) {
    residents.push({
      localKey: 'k',
      role: 'THUISWONEND_KIND',
      ageYears: opts.child.age,
      assessmentIncomeCents: opts.child.income,
    });
  }
  return {
    residents,
    housingAssetsEligibility: opts.assets === undefined ? 'ELIGIBLE' : opts.assets,
    under18ExceptionGranted: opts.under18Exception ?? false,
  };
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

assert.equal(NL_2026_MODULE_STATUS.rentAllowance, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.childBudget, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.childcareAllowance, 'CERTIFIED');
assert.equal(isVerdienCheckPublicEnabled(), false);
assert.equal(isVerdienCheckPersistenceEnabled(), false);

// --- HUURTOESLAG boundaries
{
  const base = {
    midYearHouseholdChange: false,
    onlyTotalRentKnown: false,
  };

  const under = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 93_292,
    household: household({ persons: 1, oldest: 30, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  const atCap = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 93_293,
    household: household({ persons: 1, oldest: 30, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  const overCap = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 93_294,
    household: household({ persons: 1, oldest: 30, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  const wayOver = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 150_000,
    household: household({ persons: 1, oldest: 30, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  assert.notEqual(overCap.status, 'UNKNOWN');
  assert.notEqual(wayOver.reason, 'NO_HOUSING_ALLOWANCE');
  assert.equal(typeof overCap.annualCents, 'number');
  assert.equal(atCap.annualCents, overCap.annualCents);
  assert.notEqual(under.annualCents, atCap.annualCents);

  for (const age of [20, 21, 22]) {
    const r = calculateHousingAllowance2026({
      ...base,
      bareRentCentsPerMonth: 70_000,
      household: household({ persons: 1, oldest: age, userIncome: euro(15_000) }),
      userAssessmentIncomeCents: euro(15_000),
    });
    assert.equal(typeof r.annualCents, 'number', `age ${age}`);
    if (age === 20) assert.equal(r.youthRegime, true);
    if (age === 21 || age === 22) assert.equal(r.youthRegime, false);
  }

  const svcA = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({ persons: 1, oldest: 30, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  const svcB = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({ persons: 1, oldest: 30, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  assert.equal(svcA.annualCents, svcB.annualCents);

  const single = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({ persons: 1, oldest: 40, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  const multi = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({ persons: 2, oldest: 40, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  assert.notEqual(single.annualCents, multi.annualCents);

  const childUnder = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({
      persons: 1,
      oldest: 40,
      userIncome: euro(32_000),
      child: { age: 16, income: 621_799 },
    }),
    userAssessmentIncomeCents: euro(32_000),
  });
  const childExact = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({
      persons: 1,
      oldest: 40,
      userIncome: euro(32_000),
      child: { age: 16, income: 621_800 },
    }),
    userAssessmentIncomeCents: euro(32_000),
  });
  const childOver = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({
      persons: 1,
      oldest: 40,
      userIncome: euro(32_000),
      child: { age: 16, income: 621_800 + 100 },
    }),
    userAssessmentIncomeCents: euro(32_000),
  });
  assert.equal(childUnder.annualCents, childExact.annualCents);
  assert.notEqual(childExact.annualCents, childOver.annualCents);

  const assetsOk = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({ persons: 1, oldest: 40, userIncome: euro(20_000), assets: 'ELIGIBLE' }),
    userAssessmentIncomeCents: euro(20_000),
  });
  const assetsNo = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({
      persons: 1,
      oldest: 40,
      userIncome: euro(20_000),
      assets: 'NOT_ELIGIBLE',
    }),
    userAssessmentIncomeCents: euro(20_000),
  });
  const assetsUnknown = calculateHousingAllowance2026({
    ...base,
    bareRentCentsPerMonth: 70_000,
    household: household({ persons: 1, oldest: 40, userIncome: euro(20_000), assets: 'UNKNOWN' }),
    userAssessmentIncomeCents: euro(20_000),
  });
  assert.equal(typeof assetsOk.annualCents, 'number');
  assert.equal(assetsNo.annualCents, 0);
  assert.equal(isUnknown(assetsUnknown.annualCents), true);

  const missingBare = calculateHousingAllowance2026({
    ...base,
    onlyTotalRentKnown: true,
    bareRentCentsPerMonth: 80_000,
    household: household({ persons: 1, oldest: 40, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  assert.equal(missingBare.status, 'MISSING_BARE_RENT');
  assert.equal(isUnknown(missingBare.annualCents), true);

  results.HOUSING_BOUNDARIES = 'PASS';
}

{
  const vectors = [
    {
      id: 'HT-G1',
      source: 'Wht art. 21 + Stcrt. 2025/39783 + Wet verlaging eigen bijdrage 2026',
      page: 'art. 13/17/20/21',
      bare: 70_000,
      persons: 1 as const,
      income: euro(20_000),
      youth: false,
    },
    {
      id: 'HT-G2',
      source: 'Wht art. 13 lid 1 onder b jongerenregime',
      page: 'art. 13',
      bare: 70_000,
      persons: 1 as const,
      income: euro(15_000),
      youth: true,
    },
    {
      id: 'HT-G3',
      source: 'Wht art. 21 lid 2 afbouw eenpersoons 27%',
      page: 'art. 21.2',
      bare: 93_293,
      persons: 1 as const,
      income: euro(24_425),
      youth: false,
    },
  ];
  for (const v of vectors) {
    const expected = oracleHousingAnnual({
      bareRent: v.bare,
      persons: v.persons,
      income: v.income,
      youth: v.youth,
    });
    const actual = calculateHousingAllowance2026({
      midYearHouseholdChange: false,
      onlyTotalRentKnown: false,
      bareRentCentsPerMonth: v.bare,
      household: household({
        persons: v.persons,
        oldest: v.youth ? 20 : 40,
        userIncome: v.income,
      }),
      userAssessmentIncomeCents: v.income,
    });
    assert.equal(typeof actual.annualCents, 'number', v.id);
    nearly(actual.annualCents as number, expected, v.id);
    assert.equal((actual.annualCents as number) - expected, 0, `${v.id} difference`);
  }
  results.HOUSING_GOLDEN = 'PASS';
}

// --- KGB
{
  const child = (age: number) => ({
    localKey: `c${age}`,
    ageYears: age,
    eligibilityStatus: 'ELIGIBLE' as const,
  });

  const one = calculateChildBudget2026({
    household: {
      children: [child(8)],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(20_000),
  });
  const two = calculateChildBudget2026({
    household: {
      children: [child(8), child(9)],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(20_000),
  });
  const three = calculateChildBudget2026({
    household: {
      children: [child(8), child(9), child(10)],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(20_000),
  });
  assert.equal(one.annualCents, euro(2_580) + euro(3_416));
  assert.equal(two.annualCents, euro(2_580) * 2 + euro(3_416));
  assert.equal(three.annualCents, euro(2_580) * 3 + euro(3_416));

  const ages: Array<[number, number]> = [
    [11, 0],
    [12, euro(724)],
    [15, euro(724)],
    [16, euro(964)],
    [17, euro(964)],
    [18, 0],
  ];
  for (const [age, raise] of ages) {
    const r = calculateChildBudget2026({
      household: {
        children: [child(age)],
        hasToeslagPartner: false,
        childBudgetAssetsEligibility: 'ELIGIBLE',
      },
      userAssessmentIncomeCents: euro(20_000),
    });
    const expectedBase = age >= 18 ? 0 : euro(2_580) + euro(3_416) + raise;
    assert.equal(r.annualCents, expectedBase, `kgb age ${age}`);
  }

  const partner = calculateChildBudget2026({
    household: {
      children: [child(8)],
      hasToeslagPartner: true,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(20_000),
    partnerAssessmentIncomeCents: euro(10_000),
  });
  assert.equal(partner.annualCents, euro(2_580));

  const under = calculateChildBudget2026({
    household: {
      children: [child(8)],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(29_735),
  });
  const exact = calculateChildBudget2026({
    household: {
      children: [child(8)],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(29_736),
  });
  const over = calculateChildBudget2026({
    household: {
      children: [child(8)],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(29_737),
  });
  assert.equal(under.annualCents, exact.annualCents);
  assert.ok((over.annualCents as number) < (exact.annualCents as number));

  const unknownAssets = calculateChildBudget2026({
    household: {
      children: [child(8)],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'UNKNOWN',
    },
    userAssessmentIncomeCents: euro(20_000),
  });
  const noAssets = calculateChildBudget2026({
    household: {
      children: [child(8)],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'NOT_ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(20_000),
  });
  assert.equal(isUnknown(unknownAssets.annualCents), true);
  assert.equal(noAssets.annualCents, 0);

  results.CHILD_BUDGET_BOUNDARIES = 'PASS';
}

{
  const child = (age: number, key: string) => ({
    localKey: key,
    ageYears: age,
    eligibilityStatus: 'ELIGIBLE' as const,
  });
  const golden = [
    {
      id: 'KGB-G1',
      source: 'Wet KGB art. 2 leden 2 en 6, drempel Dienst Toeslagen 2026',
      expected: euro(2_580) + euro(3_416),
      children: [child(8, 'a')],
      partner: false,
      income: euro(20_000),
      partnerIncome: 0,
    },
    {
      id: 'KGB-G2',
      source: 'Wet KGB art. 2 lid 4 leeftijdsverhoging 12–15',
      expected: euro(2_580) + euro(724) + euro(3_416),
      children: [child(12, 'a')],
      partner: false,
      income: euro(20_000),
      partnerIncome: 0,
    },
    {
      id: 'KGB-G3',
      source: 'Wet KGB art. 2 lid 7 afbouw 7,60% €1 boven drempel',
      expected: euro(2_580) + euro(3_416) - 8,
      children: [child(8, 'a')],
      partner: false,
      income: euro(29_737),
      partnerIncome: 0,
    },
  ];
  for (const g of golden) {
    const actual = calculateChildBudget2026({
      household: {
        children: g.children,
        hasToeslagPartner: g.partner,
        childBudgetAssetsEligibility: 'ELIGIBLE',
      },
      userAssessmentIncomeCents: g.income,
      partnerAssessmentIncomeCents: g.partnerIncome,
    });
    nearly(actual.annualCents as number, g.expected, g.id);
  }
  results.CHILD_BUDGET_GOLDEN = 'PASS';
}

// --- Kinderopvang
{
  assert.equal(lookupChildcareBand2026(euro(56_412)).firstTenths, 960);
  assert.equal(lookupChildcareBand2026(euro(56_413)).firstTenths, 955);
  assert.equal(lookupChildcareBand2026(euro(56_414)).firstTenths, 955);

  for (let i = 0; i < KOT_TABLE_2026.length - 1; i += 1) {
    const row = KOT_TABLE_2026[i];
    const next = KOT_TABLE_2026[i + 1];
    if (!row || !next) continue;
    assert.equal(lookupChildcareBand2026(row.fromCents).fromCents, row.fromCents);
    assert.equal(lookupChildcareBand2026(next.fromCents - 1).fromCents, row.fromCents);
    assert.equal(lookupChildcareBand2026(next.fromCents).fromCents, next.fromCents);
  }

  const entry = (
    childKey: string,
    type: 'DAYCARE_CENTER' | 'AFTER_SCHOOL_CENTER' | 'CHILDMINDER',
    hours: number,
    rate: number,
    provider: 'REGISTERED_ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN' = 'REGISTERED_ELIGIBLE',
  ) => ({
    localKey: childKey,
    childKey,
    childAgeYears: 4,
    careType: type,
    hoursPerMonth: hours,
    actualHourlyRateCents: rate,
    providerEligibilityStatus: provider,
  });

  const hh = (
    entries: ReturnType<typeof entry>[],
    extras: { work?: 'ELIGIBLE' | 'UNKNOWN'; months?: number } = {},
  ) => ({
    entries,
    hasToeslagPartner: false as const,
    parentWorkStudyStatus: extras.work ?? ('ELIGIBLE' as const),
    workedMonthsInYear: extras.months ?? 12,
  });

  const d22 = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'DAYCARE_CENTER', 100, 1_122)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  const d23 = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'DAYCARE_CENTER', 100, 1_123)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  const d24 = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'DAYCARE_CENTER', 100, 1_124)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  assert.notEqual(d22.annualCents, d23.annualCents);
  assert.equal(d23.annualCents, d24.annualCents);

  const bsoLow = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'AFTER_SCHOOL_CENTER', 80, 997)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  const bsoCap = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'AFTER_SCHOOL_CENTER', 80, 998)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  const bsoOver = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'AFTER_SCHOOL_CENTER', 80, 999)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  assert.notEqual(bsoLow.annualCents, bsoCap.annualCents);
  assert.equal(bsoCap.annualCents, bsoOver.annualCents);

  const goLow = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'CHILDMINDER', 80, 848)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  const goCap = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'CHILDMINDER', 80, 849)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  const goOver = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'CHILDMINDER', 80, 850)]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  assert.notEqual(goLow.annualCents, goCap.annualCents);
  assert.equal(goCap.annualCents, goOver.annualCents);

  const two = calculateChildcareAllowance2026({
    household: hh([
      entry('c1', 'DAYCARE_CENTER', 120, 1_123),
      entry('c2', 'DAYCARE_CENTER', 80, 1_123),
    ]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  assert.equal(two.firstChildKey, 'c1');

  const tie = classifyFirstChild([
    { childKey: 'a', hours: 100, eligibleCostMonthlyCents: 100_000 },
    { childKey: 'b', hours: 100, eligibleCostMonthlyCents: 100_000 },
  ]);
  assert.equal(tie.status, 'FIRST_CHILD_CLASSIFICATION_UNKNOWN');

  const unknownProv = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'DAYCARE_CENTER', 100, 1_123, 'UNKNOWN')]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  const notElig = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'DAYCARE_CENTER', 100, 1_123, 'NOT_ELIGIBLE')]),
    jointAssessmentIncomeCents: euro(40_000),
  });
  assert.equal(isUnknown(unknownProv.annualCents), true);
  assert.equal(notElig.annualCents, 0);

  const noWork = calculateChildcareAllowance2026({
    household: hh([entry('c1', 'DAYCARE_CENTER', 100, 1_123)], { work: 'UNKNOWN' }),
    jointAssessmentIncomeCents: euro(40_000),
  });
  assert.equal(isUnknown(noWork.annualCents), true);

  results.CHILDCARE_BOUNDARIES = 'PASS';
}

{
  const cost = 100 * 1_123 * 12;
  const at96 = calculateChildcareAllowance2026({
    household: {
      entries: [
        {
          localKey: 'c1',
          childKey: 'c1',
          childAgeYears: 3,
          careType: 'DAYCARE_CENTER',
          hoursPerMonth: 100,
          actualHourlyRateCents: 1_123,
          providerEligibilityStatus: 'REGISTERED_ELIGIBLE',
        },
      ],
      hasToeslagPartner: false,
      parentWorkStudyStatus: 'ELIGIBLE',
      workedMonthsInYear: 12,
    },
    jointAssessmentIncomeCents: euro(56_412),
  });
  const expected96 = oRound(oMul(oFrom(cost), 960, 1_000));
  nearly(at96.annualCents as number, expected96, 'KOT-G1 96%');
  const at955 = calculateChildcareAllowance2026({
    household: {
      entries: [
        {
          localKey: 'c1',
          childKey: 'c1',
          childAgeYears: 3,
          careType: 'DAYCARE_CENTER',
          hoursPerMonth: 100,
          actualHourlyRateCents: 1_123,
          providerEligibilityStatus: 'REGISTERED_ELIGIBLE',
        },
      ],
      hasToeslagPartner: false,
      parentWorkStudyStatus: 'ELIGIBLE',
      workedMonthsInYear: 12,
    },
    jointAssessmentIncomeCents: euro(56_413),
  });
  const expected955 = oRound(oMul(oFrom(cost), 955, 1_000));
  nearly(at955.annualCents as number, expected955, 'KOT-G2 95.5%');
  results.CHILDCARE_GOLDEN = 'PASS';
}

// --- A vs B
{
  const hh = household({ persons: 1, oldest: 40, userIncome: euro(20_000) });
  const a = calculateHousingAllowance2026({
    midYearHouseholdChange: false,
    onlyTotalRentKnown: false,
    bareRentCentsPerMonth: 70_000,
    household: hh,
    userAssessmentIncomeCents: euro(25_000),
  });
  const b = calculateHousingAllowance2026({
    midYearHouseholdChange: false,
    onlyTotalRentKnown: false,
    bareRentCentsPerMonth: 70_000,
    household: hh,
    userAssessmentIncomeCents: euro(26_000),
  });
  assert.ok((b.annualCents as number) < (a.annualCents as number));

  const kgbA = calculateChildBudget2026({
    household: {
      children: [{ localKey: 'c', ageYears: 8, eligibilityStatus: 'ELIGIBLE' }],
      hasToeslagPartner: true,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    userAssessmentIncomeCents: euro(30_000),
    partnerAssessmentIncomeCents: euro(15_000),
  });
  for (const extra of [500, 2_500, 5_000]) {
    const kgbB = calculateChildBudget2026({
      household: {
        children: [{ localKey: 'c', ageYears: 8, eligibilityStatus: 'ELIGIBLE' }],
        hasToeslagPartner: true,
        childBudgetAssetsEligibility: 'ELIGIBLE',
      },
      userAssessmentIncomeCents: euro(30_000 + extra),
      partnerAssessmentIncomeCents: euro(15_000),
    });
    assert.ok(
      (kgbB.annualCents as number) <= (kgbA.annualCents as number),
      `kgb A/B +${extra}`,
    );
  }

  const kotA = calculateChildcareAllowance2026({
    household: {
      entries: [
        {
          localKey: 'c1',
          childKey: 'c1',
          childAgeYears: 3,
          careType: 'DAYCARE_CENTER',
          hoursPerMonth: 100,
          actualHourlyRateCents: 1_123,
          providerEligibilityStatus: 'REGISTERED_ELIGIBLE',
        },
      ],
      hasToeslagPartner: false,
      parentWorkStudyStatus: 'ELIGIBLE',
      workedMonthsInYear: 12,
    },
    jointAssessmentIncomeCents: euro(56_000),
  });
  const kotB = calculateChildcareAllowance2026({
    household: {
      entries: [
        {
          localKey: 'c1',
          childKey: 'c1',
          childAgeYears: 3,
          careType: 'DAYCARE_CENTER',
          hoursPerMonth: 100,
          actualHourlyRateCents: 1_123,
          providerEligibilityStatus: 'REGISTERED_ELIGIBLE',
        },
      ],
      hasToeslagPartner: false,
      parentWorkStudyStatus: 'ELIGIBLE',
      workedMonthsInYear: 12,
    },
    jointAssessmentIncomeCents: euro(56_500),
  });
  assert.ok((kotB.annualCents as number) < (kotA.annualCents as number));
  results.A_VS_B = 'PASS';
}

{
  const rentUnknown = runCalculator(
    employeeCore(20_000, 1_000, { allowances: ['RENT'] }),
  );
  assert.equal(rentUnknown.status, 'READY');
  if (rentUnknown.status === 'READY') {
    assert.equal(isUnknown(rentUnknown.deltas.rentAllowance), true);
    assert.notEqual(rentUnknown.deltas.rentAllowance, 0);
    assert.equal(rentUnknown.netExtraIsDefinitive, false);
  }
  const kgbUnknown = runCalculator(
    employeeCore(20_000, 1_000, { allowances: ['CHILD_BUDGET'] }),
  );
  assert.equal(kgbUnknown.status, 'READY');
  if (kgbUnknown.status === 'READY') {
    assert.equal(isUnknown(kgbUnknown.deltas.childBudget), true);
    assert.equal(kgbUnknown.unsupportedTaxCredits.includes('IACK'), false);
  }
  results.UNKNOWN_PROPAGATION = 'PASS';
}

{
  const mid = calculateHousingAllowance2026({
    midYearHouseholdChange: true,
    onlyTotalRentKnown: false,
    bareRentCentsPerMonth: 70_000,
    household: household({ persons: 1, oldest: 40, userIncome: euro(20_000) }),
    userAssessmentIncomeCents: euro(20_000),
  });
  assert.equal(mid.status, 'MID_YEAR_CHANGE_NOT_SUPPORTED');
  assert.equal(isUnknown(mid.annualCents), true);
  results.MID_YEAR = 'PASS';
}

{
  const kink = detectAllowanceKink({
    baselineAllowanceCents: 100_000,
    probes: [
      { extraCents: 50_000, allowanceCents: 100_000 },
      { extraCents: 100_000, allowanceCents: 90_000 },
    ],
  });
  assert.equal(kink.detected, true);
  assert.equal(kink.avoidThresholdCents, null);
  assert.equal(kink.guidanceId, 'ALLOWANCE_CHANGES_IF_YOU_EARN_MORE');
  assert.ok(DEFAULT_KINK_EXTRAS_CENTS.includes(50_000));
  results.KINK = 'PASS';
}

{
  const calc = runCalculator(
    employeeCore(20_000, 1_000, {
      allowances: ['RENT'],
      housingHousehold: household({ persons: 1, oldest: 40, userIncome: euro(20_000) }),
      bareRentCentsPerMonth: 70_000,
      housingAssetsEligibility: 'ELIGIBLE',
    }),
  );
  assert.equal(calc.status, 'READY');
  if (calc.status === 'READY') {
    assert.equal(typeof calc.deltas.rentAllowance, 'number');
    assert.equal(typeof calc.netExtraCents, 'number');
    assert.equal(calc.netExtraIsDefinitive, true);
    assert.equal(calc.completeness, 'COMPLETE_FOR_CORE');
    const taxZvwHc =
      (calc.taxableAdditionalIncomeCents as number) -
      (calc.deltas.incomeTax as number) -
      (calc.deltas.zvw as number) +
      (calc.deltas.healthcareAllowance as number) +
      (calc.deltas.rentAllowance as number);
    assert.equal(calc.netExtraCents, taxZvwHc);
  }
  results.FULL_NET_EXTRA = 'PASS';
}

const failed = Object.entries(results).filter(([, v]) => v !== 'PASS');
if (failed.length > 0) {
  console.error(results);
  throw new Error(`FAIL: ${failed.map(([k]) => k).join(', ')}`);
}
console.log('verdiencheck NL-2026 allowances tests: PASS');
console.log(results);
