/**
 * VerdienCheck live net + allowance simulator (presentation on certified engine).
 *
 *   npx tsx scripts/test-verdiencheck-live-net-simulator.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runCalculator } from '../lib/verdiencheck/calculator/engine';
import type { CalculatorInput, CalculatorReadyResult } from '../lib/verdiencheck/calculator/types';
import { paintingOnceFiveThousand } from '../lib/verdiencheck/domain/activity';
import { V1_COST_SOURCE } from '../lib/verdiencheck/domain/costs';
import { isUnknown } from '../lib/verdiencheck/domain/unknown';
import { roundCentsToWholeEuroCents } from '../lib/verdiencheck/domain/money';
import { presentFinancialImpact } from '../lib/verdiencheck/personal-route/financial';
import { PERSONAL_ROUTE_COPY } from '../lib/verdiencheck/personal-route/copy';
import { getVerdienCheckCopy } from '../lib/verdiencheck/i18n/copy';
import { NL_2026_MODULE_STATUS } from '../lib/verdiencheck/rulesets/nl/2026/modules';
import {
  SRC_BOX1_2026,
  SRC_AHK_2026,
  SRC_AK_2026,
  SRC_ZVW_2026,
  SRC_ZORGTOESLAG_2026,
  SRC_HUURTOESLAG_WET_2026,
  SRC_KGB_WET_2026,
  SRC_KOT_BESLUIT_2026,
} from '../lib/verdiencheck/rulesets/nl/2026/sources';
import {
  EMPTY_WIZARD_STATE,
  applyActivityChoice,
  applyGrowthStartChoice,
  applySituationGroup,
  isBenefitSituation,
  questionsBeforeFirstResult,
  type WizardState,
} from '../lib/verdiencheck/wizard/schema';
import { ZT_MAX_INCOME_SINGLE_CENTS } from '../lib/verdiencheck/rulesets/nl/2026/core-constants';

const ROOT = process.cwd();
const impactSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckFinancialImpact.tsx'),
  'utf8',
);
const wizardSrc = fs.readFileSync(
  path.join(ROOT, 'components/verdiencheck/VerdienCheckWizard.tsx'),
  'utf8',
);
const financialSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/personal-route/financial.ts'),
  'utf8',
);
const engineSrc = fs.readFileSync(
  path.join(ROOT, 'lib/verdiencheck/calculator/engine.ts'),
  'utf8',
);
const nl = getVerdienCheckCopy('nl');

function euro(euros: number): number {
  return euros * 100;
}

function housingSingle(incomeEuro: number) {
  return {
    residents: [
      {
        localKey: 'a',
        role: 'APPLICANT' as const,
        ageYears: 40,
        assessmentIncomeCents: euro(incomeEuro),
      },
    ],
    housingAssetsEligibility: 'ELIGIBLE' as const,
    under18ExceptionGranted: false,
  };
}

function employee(input: {
  baselineEuro: number;
  extraEuro: number;
  allowances?: CalculatorInput['allowances'];
  assetsEligibility?: CalculatorInput['assetsEligibility'];
  situation?: CalculatorInput['personContext']['situation'];
} & Partial<CalculatorInput>): CalculatorInput {
  const base = euro(input.baselineEuro);
  const extra = euro(input.extraEuro);
  const { baselineEuro: _b, extraEuro: _e, situation, ...over } = input;
  return {
    jurisdiction: 'NL',
    calendarYear: 2026,
    personContext: { situation: situation ?? 'EMPLOYEE' },
    currentAnnualIncomeCents: null,
    ageTaxRegime: 'BELOW_AOW_2026',
    additionalIncomeClassification: 'RESULT_FROM_OTHER_WORK',
    assumeEstimatedCostsTaxDeductible: true,
    baselineGrossEmploymentIncomeCents: base,
    baselineBox1TaxableIncomeCents: base,
    baselineAggregateIncomeCents: base,
    baselineArbeidsinkomenCents: base,
    baselineAssessmentIncomeCents: base,
    baselineZvwContributionIncomeAlreadyUsedCents: base,
    assetsEligibility: input.assetsEligibility ?? 'ELIGIBLE',
    partnerContext: { hasPartner: false, partnerHealthcareInsuranceStatus: 'INSURED' },
    allowances: input.allowances ?? ['NONE'],
    activity: paintingOnceFiveThousand(),
    incomeSource: 'MARKETPLACE_SELLER',
    estimatedTurnoverCents: extra,
    estimatedCosts: { amountCents: 0, source: V1_COST_SOURCE },
    commercialResultCents: extra,
    scenarioAdditionalResultCents: extra,
    ...over,
  };
}

function ready(input: CalculatorInput): CalculatorReadyResult {
  const result = runCalculator(input);
  assert.equal(result.status, 'READY');
  if (result.status !== 'READY') throw new Error('not ready');
  return result;
}

function netFromParts(result: CalculatorReadyResult): number {
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

for (const src of [
  SRC_BOX1_2026,
  SRC_AHK_2026,
  SRC_AK_2026,
  SRC_ZVW_2026,
  SRC_ZORGTOESLAG_2026,
  SRC_HUURTOESLAG_WET_2026,
  SRC_KGB_WET_2026,
  SRC_KOT_BESLUIT_2026,
]) {
  assert.match(src.officialSourceUrl, /^https:\/\/(www\.)?(belastingdienst|wetten\.overheid|zoek\.officielebekendmakingen)\./);
  assert.match(src.officialSource, /2026|Wet |Besluit /);
}

assert.equal(NL_2026_MODULE_STATUS.incomeTax, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.healthcareAllowance, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.rentAllowance, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.childBudget, 'CERTIFIED');
assert.equal(NL_2026_MODULE_STATUS.childcareAllowance, 'CERTIFIED');

assert.doesNotMatch(nl.steps.currentIncome?.title ?? '', /HomeCheff/);
assert.match(nl.steps.currentIncome?.title ?? '', /nu ongeveer/);
assert.match(nl.steps.scenario?.title ?? '', /extra resultaat/);
assert.equal(nl.moneyResultTitle, 'Je gaat erop vooruit');
assert.match(PERSONAL_ROUTE_COPY.progressHeadline, /vooruit/);
assert.doesNotMatch(PERSONAL_ROUTE_COPY.unknownFinancial, /We kunnen het nog niet precies schatten/);
assert.match(impactSrc, /viewCalculation/);
assert.match(impactSrc, /taxAndAllowancesIncluded/);
assert.doesNotMatch(financialSrc, /netExtraCents.*=.*extra.*-.*tax/);
assert.match(financialSrc, /netFromEngine: true/);
assert.doesNotMatch(engineSrc, /UNKNOWN.*\?\? 0/);

const presets = [500, 1000, 2500, 5000, 10000] as const;

const personaA = presets.map((extra) => ready(employee({ baselineEuro: 38_400, extraEuro: extra, allowances: ['NONE'] })));
for (const row of personaA) {
  assert.equal(row.netExtraIsDefinitive, true);
  assert.equal(row.netExtraCents, netFromParts(row));
  assert.equal(row.baseline.healthcareAllowance, 0);
  assert.equal(row.scenario.healthcareAllowance, 0);
  const view = presentFinancialImpact(row, { allowances: ['NONE'] });
  assert.equal(view.simulator.netFromEngine, true);
  assert.equal(view.simulator.netExtraCents, row.netExtraCents);
  assert.equal(view.simulator.allowances.find((line) => line.id === 'HEALTHCARE')?.included, false);
  assert.equal(view.simulator.excludedNotes.some((note) => /zorgtoeslag|huurtoeslag|kindgebonden|kinderopvang/i.test(note)), false);
  assert.match(view.headline, /vooruit/);
}

const personaB = ready(employee({ baselineEuro: 32_000, extraEuro: 500, allowances: ['HEALTHCARE'] }));
assert.equal(typeof personaB.baseline.healthcareAllowance, 'number');
assert.ok((personaB.baseline.healthcareAllowance as number) > 0);
const viewB = presentFinancialImpact(personaB, { allowances: ['HEALTHCARE'] });
assert.equal(viewB.simulator.allowances.find((line) => line.id === 'HEALTHCARE')?.included, true);
assert.equal(viewB.simulator.allowances.find((line) => line.id === 'HEALTHCARE')?.rightLost, false);

const overLimit = Math.ceil(ZT_MAX_INCOME_SINGLE_CENTS / 100) + 100;
const personaD = ready(
  employee({
    baselineEuro: 38_400,
    extraEuro: overLimit - 38_400,
    allowances: ['HEALTHCARE'],
  }),
);
const hcA = personaD.baseline.healthcareAllowance;
const hcB = personaD.scenario.healthcareAllowance;
assert.equal(typeof hcA, 'number');
assert.ok((hcA as number) > 0);
assert.equal(hcB, 0);
const viewD = presentFinancialImpact(personaD, { allowances: ['HEALTHCARE'] });
assert.equal(viewD.simulator.allowances.find((line) => line.id === 'HEALTHCARE')?.rightLost, true);
assert.equal(viewD.simulator.netExtraCents, personaD.netExtraCents);

const unknownIncome = ready(
  employee({
    baselineEuro: 20_000,
    extraEuro: 1000,
    allowances: ['HEALTHCARE'],
    assetsEligibility: 'UNKNOWN',
  }),
);
assert.equal(isUnknown(unknownIncome.deltas.healthcareAllowance), true);
assert.notEqual(unknownIncome.deltas.healthcareAllowance, 0);
const viewUnknown = presentFinancialImpact(unknownIncome, { allowances: ['HEALTHCARE'] });
assert.equal(isUnknown(viewUnknown.netExtraCents), true);
assert.notEqual(viewUnknown.netExtraCents, 0);
assert.ok(viewUnknown.simulator.uncertaintyWhy);
assert.doesNotMatch(viewUnknown.simulator.uncertaintyWhy ?? '', /We kunnen het nog niet precies schatten/);

const liveSwitch = presets.map((extra) =>
  ready(employee({ baselineEuro: 32_000, extraEuro: extra, allowances: ['HEALTHCARE'] })),
);
for (let i = 0; i < liveSwitch.length; i += 1) {
  assert.equal(liveSwitch[i]?.baseline.incomeTax, liveSwitch[0]?.baseline.incomeTax);
  assert.equal(liveSwitch[i]?.baseline.healthcareAllowance, liveSwitch[0]?.baseline.healthcareAllowance);
  assert.equal(liveSwitch[i]?.commercialAdditionalResultCents, euro(presets[i] ?? 0));
  const view = presentFinancialImpact(liveSwitch[i] ?? personaB, { allowances: ['HEALTHCARE'] });
  assert.equal(view.simulator.allowances.find((line) => line.id === 'HEALTHCARE')?.included, true);
}

const personaC = ready(employee({ baselineEuro: 32_000, extraEuro: 2_500, allowances: ['HEALTHCARE'] }));
const hcC0 = personaC.baseline.healthcareAllowance as number;
const hcC1 = personaC.scenario.healthcareAllowance as number;
assert.ok(hcC0 > hcC1);
assert.ok(hcC1 > 0);
const viewC = presentFinancialImpact(personaC, { allowances: ['HEALTHCARE'] });
assert.equal(viewC.simulator.allowances.find((line) => line.id === 'HEALTHCARE')?.rightLost, false);

const custom = ready(employee({ baselineEuro: 38_400, extraEuro: 1_234, allowances: ['NONE'] }));
assert.equal(custom.commercialAdditionalResultCents, euro(1_234));
assert.equal(custom.netExtraCents, netFromParts(custom));

const personaE = presets.map((extra) =>
  ready(
    employee({
      baselineEuro: 20_000,
      extraEuro: extra,
      allowances: ['RENT'],
      housingHousehold: housingSingle(20_000),
      bareRentCentsPerMonth: 70_000,
      housingAssetsEligibility: 'ELIGIBLE',
    }),
  ),
);
for (const row of personaE) {
  assert.equal(typeof row.baseline.rentAllowance, 'number');
  assert.ok((row.baseline.rentAllowance as number) > 0);
  assert.equal(row.netExtraCents, netFromParts(row));
  const view = presentFinancialImpact(row, { allowances: ['RENT'] });
  assert.equal(view.simulator.allowances.find((line) => line.id === 'RENT')?.included, true);
  assert.equal(view.simulator.allowances.find((line) => line.id === 'HEALTHCARE')?.included, false);
}

const personaF = ready(
  employee({
    baselineEuro: 20_000,
    extraEuro: 1_000,
    allowances: ['HEALTHCARE', 'RENT'],
    housingHousehold: housingSingle(20_000),
    bareRentCentsPerMonth: 70_000,
    housingAssetsEligibility: 'ELIGIBLE',
  }),
);
const viewF = presentFinancialImpact(personaF, { allowances: ['HEALTHCARE', 'RENT'] });
assert.equal(viewF.simulator.allowances.find((line) => line.id === 'HEALTHCARE')?.included, true);
assert.equal(viewF.simulator.allowances.find((line) => line.id === 'RENT')?.included, true);
assert.equal(personaF.netExtraCents, netFromParts(personaF));

const personaG = ready(
  employee({
    baselineEuro: 20_000,
    extraEuro: 1_000,
    allowances: ['CHILD_BUDGET'],
    childBudgetHousehold: {
      children: [{ localKey: 'c', ageYears: 8, eligibilityStatus: 'ELIGIBLE' }],
      hasToeslagPartner: false,
      childBudgetAssetsEligibility: 'ELIGIBLE',
    },
    childBudgetAssetsEligibility: 'ELIGIBLE',
  }),
);
assert.equal(typeof personaG.baseline.childBudget, 'number');
assert.ok((personaG.baseline.childBudget as number) > 0);
const viewG = presentFinancialImpact(personaG, { allowances: ['CHILD_BUDGET'] });
assert.equal(viewG.simulator.allowances.find((line) => line.id === 'CHILD_BUDGET')?.included, true);
assert.equal(personaG.netExtraCents, netFromParts(personaG));

const personaI = ready(
  employee({
    baselineEuro: 25_000,
    extraEuro: 1_000,
    allowances: ['CHILDCARE'],
    childcareHousehold: {
      entries: [
        {
          localKey: 'c1',
          childKey: 'c1',
          childAgeYears: 3,
          careType: 'DAYCARE_CENTER',
          hoursPerMonth: 80,
          actualHourlyRateCents: 1_123,
          providerEligibilityStatus: 'REGISTERED_ELIGIBLE',
        },
      ],
      hasToeslagPartner: false,
      parentWorkStudyStatus: 'ELIGIBLE',
      workedMonthsInYear: 12,
    },
  }),
);
assert.equal(typeof personaI.baseline.childcareAllowance, 'number');
const viewI = presentFinancialImpact(personaI, { allowances: ['CHILDCARE'] });
assert.equal(viewI.simulator.allowances.find((line) => line.id === 'CHILDCARE')?.included, true);
assert.equal(personaI.netExtraCents, netFromParts(personaI));

const incompleteRent = ready(employee({ baselineEuro: 20_000, extraEuro: 1_000, allowances: ['RENT'] }));
assert.equal(isUnknown(incompleteRent.deltas.rentAllowance), true);
assert.notEqual(incompleteRent.deltas.rentAllowance, 0);
const viewH = presentFinancialImpact(incompleteRent, { allowances: ['RENT'] });
assert.equal(isUnknown(viewH.netExtraCents), true);
assert.notEqual(viewH.netExtraCents, 0);
assert.match(viewH.simulator.uncertaintyWhy ?? '', /huur/i);

const entrepreneur = ready(
  employee({
    baselineEuro: 38_400,
    extraEuro: 1_000,
    allowances: ['NONE'],
    situation: 'EXISTING_ENTREPRENEUR',
  }),
);
assert.equal(entrepreneur.netExtraCents, netFromParts(entrepreneur));
assert.equal(presentFinancialImpact(entrepreneur, { allowances: ['NONE'] }).simulator.netFromEngine, true);

const wwState: WizardState = applySituationGroup(
  applyGrowthStartChoice(
    {
      ...EMPTY_WIZARD_STATE,
      taxResidence: 'NL',
      activityChoice: 'MAKE',
      activityKinds: applyActivityChoice('MAKE'),
    },
    'TRYING_OUT',
  ),
  'WW',
);
assert.equal(questionsBeforeFirstResult(wwState).length, 4);
assert.equal(isBenefitSituation(wwState), true);

const bijstandState: WizardState = applySituationGroup(
  applyGrowthStartChoice(
    {
      ...EMPTY_WIZARD_STATE,
      taxResidence: 'NL',
      activityChoice: 'MAKE',
      activityKinds: applyActivityChoice('MAKE'),
    },
    'TRYING_OUT',
  ),
  'BIJSTAND',
);
assert.equal(isBenefitSituation(bijstandState), true);

assert.match(impactSrc, /houd je naar schatting/);
assert.match(impactSrc, /Bekijk de berekening|viewCalculation/);
assert.doesNotMatch(impactSrc, /Je verliest je zorgtoeslag|WINST/);
assert.doesNotMatch(wizardSrc, /onSelectPreset[\s\S]{0,180}currentIncomeEuro:\s*''/);
assert.match(financialSrc, /netFromEngine: true/);

let quick: WizardState = {
  ...EMPTY_WIZARD_STATE,
  taxResidence: 'NL',
  activityChoice: 'MAKE',
  activityKinds: applyActivityChoice('MAKE'),
};
quick = applyGrowthStartChoice(quick, 'TRYING_OUT');
quick = applySituationGroup(quick, 'NONE');
assert.equal(questionsBeforeFirstResult(quick).length, 4);

assert.equal(roundCentsToWholeEuroCents(461_552), 461_600);
assert.equal(roundCentsToWholeEuroCents(27_445), 27_400);

console.log(
  JSON.stringify(
    {
      PERSONA_A_NET_1000: personaA[1]?.netExtraCents,
      PERSONA_B_HC_CURRENT: personaB.baseline.healthcareAllowance,
      PERSONA_C_HC_DELTA: personaC.deltas.healthcareAllowance,
      PERSONA_D_RIGHT_LOST: true,
      PERSONA_E_RENT_CURRENT: personaE[1]?.baseline.rentAllowance,
      PERSONA_F_NET: personaF.netExtraCents,
      PERSONA_G_KGB_CURRENT: personaG.baseline.childBudget,
      PERSONA_I_KOT_CURRENT: personaI.baseline.childcareAllowance,
      CUSTOM_1234: custom.commercialAdditionalResultCents,
      UNKNOWN_NOT_ZERO: true,
      NO_DOUBLE_COUNTING: true,
      WW_BOUNDARY: true,
    },
    null,
    2,
  ),
);
console.log('verdiencheck live net simulator tests: PASS');
