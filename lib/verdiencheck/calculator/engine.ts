import { isV1IncomeSourceEnabled } from '../domain/income-source';
import { UNKNOWN, isUnknown } from '../domain/unknown';
import type { UnsupportedTaxCreditId } from '../domain/income-bases';
import { hasAllowance } from '../domain/allowances';
import { packAllowsCoreNl2026Computation } from '../rulesets/types';
import { getRulePack } from '../rulesets/registry';
import { resolveTaxJurisdiction } from '../domain/jurisdiction';
import { calculateAdditionalZvw2026 } from '../nl2026/zvw';
import { calculateHealthcareAllowance2026 } from '../nl2026/healthcare-allowance';
import { calculateHousingAllowance2026 } from '../nl2026/housing-allowance';
import { calculateChildBudget2026 } from '../nl2026/child-budget';
import { calculateChildcareAllowance2026 } from '../nl2026/childcare-allowance';
import {
  calculatePersonalTax2026,
  isUnknownMaterialPersonalTax,
} from '../nl2026/personal-tax';
import { resolveTaxableRowResult } from '../nl2026/row';
import { CALCULATION_PERIOD } from '../domain/household';
import { fromCents, toCentsRoundHalfUp } from '../math/scaled';
import type {
  CalculatorInput,
  CalculatorReadyResult,
  CalculatorResult,
  SituationSnapshot,
} from './types';
import type { CentsOrUnknown } from '../domain/unknown';

function packMetaFromLookup(year: number) {
  const found = getRulePack('NL', year);
  if (!found.ok) return null;
  const pack = found.pack;
  return {
    id: pack.id,
    jurisdiction: pack.jurisdiction,
    year: pack.year,
    version: pack.version,
    status: pack.status,
    verifiedAt: pack.verifiedAt,
  };
}

function collectUnsupportedCredits(input: CalculatorInput): UnsupportedTaxCreditId[] {
  const out: UnsupportedTaxCreditId[] = [];
  const sit = input.personContext.situation;
  const regime = input.ageTaxRegime;
  if (sit === 'WAJONG' && regime !== 'FULL_YEAR_AOW_2026') {
    out.push('JONGGEHANDICAPTENKORTING');
  }
  return out;
}

function emptySnapshot(commercial: number): SituationSnapshot {
  return {
    commercialResultCents: commercial,
    incomeTax: UNKNOWN,
    zvwContribution: UNKNOWN,
    generalTaxCredit: UNKNOWN,
    employmentTaxCredit: UNKNOWN,
    iack: UNKNOWN,
    olderPersonsTaxCredit: UNKNOWN,
    singleOlderPersonsTaxCredit: UNKNOWN,
    healthcareAllowance: UNKNOWN,
    rentAllowance: UNKNOWN,
    childBudget: UNKNOWN,
    childcareAllowance: UNKNOWN,
  };
}

/**
 * A vs B is computed inside the engine (never only in UI).
 * Unimplemented modules stay UNKNOWN — never silent €0.
 */
export function runCalculator(input: CalculatorInput): CalculatorResult {
  const commercialAdditional = input.scenarioAdditionalResultCents;
  const unknownTax = {
    commercialAdditionalResultCents: commercialAdditional,
    taxableAdditionalIncomeCents: UNKNOWN,
    netExtraCents: UNKNOWN,
    netExtraPerMonthCents: UNKNOWN,
    netExtraIsDefinitive: false as const,
    assumptions: [] as string[],
  };

  const jurisdiction = resolveTaxJurisdiction({
    confirmedResidence: input.jurisdiction,
  });

  if (jurisdiction.status === 'ASK_JURISDICTION') {
    return {
      status: 'ASK_JURISDICTION',
      ...unknownTax,
      missingInputs: ['jurisdiction'],
      packMetadata: null,
    };
  }

  if (jurisdiction.status === 'NOT_SUPPORTED') {
    return {
      status: 'JURISDICTION_NOT_SUPPORTED',
      ...unknownTax,
      missingInputs: [],
      packMetadata: null,
    };
  }

  if (!isV1IncomeSourceEnabled(input.incomeSource)) {
    return {
      status: 'INCOME_SOURCE_DISABLED',
      ...unknownTax,
      missingInputs: ['incomeSource'],
      packMetadata: packMetaFromLookup(input.calendarYear),
    };
  }

  const found = getRulePack('NL', input.calendarYear);
  const packMetadata = packMetaFromLookup(input.calendarYear);
  if (!found.ok || !packAllowsCoreNl2026Computation(found.pack)) {
    return {
      status: 'PACK_NOT_CERTIFIED',
      ...unknownTax,
      missingInputs: [],
      packMetadata,
    };
  }

  const missingInputs: string[] = [];
  const assumptions: string[] = [];

  const regime = input.ageTaxRegime ?? null;
  if (!regime) missingInputs.push('ageTaxRegime');

  const row = resolveTaxableRowResult({
    classification: input.additionalIncomeClassification ?? null,
    commercialResultCents: commercialAdditional,
    assumeEstimatedCostsTaxDeductible: input.assumeEstimatedCostsTaxDeductible,
  });

  if (row.status === 'SOURCE_OF_INCOME_REVIEW_REQUIRED') {
    return {
      status: 'SOURCE_OF_INCOME_REVIEW_REQUIRED',
      ...unknownTax,
      assumptions: [...row.assumptions],
      missingInputs: [],
      packMetadata,
    };
  }

  assumptions.push(...row.assumptions);
  const taxableRow = row.status === 'OK' ? row.taxableROWResultCents : UNKNOWN;

  const box1A = input.baselineBox1TaxableIncomeCents;
  const aggA = input.baselineAggregateIncomeCents;
  const arbA = input.baselineArbeidsinkomenCents;
  const zvwUsed = input.baselineZvwContributionIncomeAlreadyUsedCents;
  if (box1A == null) missingInputs.push('baselineBox1TaxableIncomeCents');
  if (aggA == null) missingInputs.push('baselineAggregateIncomeCents');
  if (arbA == null) missingInputs.push('baselineArbeidsinkomenCents');
  if (zvwUsed == null) missingInputs.push('baselineZvwContributionIncomeAlreadyUsedCents');

  const canTax =
    (regime === 'BELOW_AOW_2026' ||
      regime === 'FULL_YEAR_AOW_2026' ||
      regime === 'REACHES_AOW_IN_2026') &&
    !isUnknown(taxableRow) &&
    box1A != null &&
    aggA != null &&
    arbA != null &&
    zvwUsed != null;

  let incomeTaxA: CentsOrUnknown = UNKNOWN;
  let incomeTaxB: CentsOrUnknown = UNKNOWN;
  let creditGenA: CentsOrUnknown = UNKNOWN;
  let creditGenB: CentsOrUnknown = UNKNOWN;
  let creditEmpA: CentsOrUnknown = UNKNOWN;
  let creditEmpB: CentsOrUnknown = UNKNOWN;
  let iackA: CentsOrUnknown = UNKNOWN;
  let iackB: CentsOrUnknown = UNKNOWN;
  let olderA: CentsOrUnknown = UNKNOWN;
  let olderB: CentsOrUnknown = UNKNOWN;
  let singleOlderA: CentsOrUnknown = UNKNOWN;
  let singleOlderB: CentsOrUnknown = UNKNOWN;
  let zvwA: CentsOrUnknown = 0;
  let zvwB: CentsOrUnknown = UNKNOWN;
  let incomeTaxDelta: CentsOrUnknown = UNKNOWN;
  let zvwDelta: CentsOrUnknown = UNKNOWN;
  let personalTaxUnknown = false;

  if (canTax && typeof taxableRow === 'number' && regime) {
    const taxInputA = {
      regime,
      aowBirthCohort: input.aowBirthCohort ?? null,
      aowMonth: input.aowMonth ?? null,
      iackContext: input.iackContext ?? null,
      singleOlderPersonsCreditEligibility:
        input.singleOlderPersonsCreditEligibility ?? null,
    };
    const sliceA = calculatePersonalTax2026({
      ...taxInputA,
      box1Cents: box1A,
      aggregateCents: aggA,
      arbeidsinkomenCents: arbA,
    });
    const sliceB = calculatePersonalTax2026({
      ...taxInputA,
      box1Cents: box1A + taxableRow,
      aggregateCents: aggA + taxableRow,
      arbeidsinkomenCents: arbA + taxableRow,
    });
    creditGenA = sliceA.generalTaxCredit;
    creditGenB = sliceB.generalTaxCredit;
    creditEmpA = sliceA.employmentTaxCredit;
    creditEmpB = sliceB.employmentTaxCredit;
    iackA = sliceA.iack;
    iackB = sliceB.iack;
    olderA = sliceA.olderPersonsTaxCredit;
    olderB = sliceB.olderPersonsTaxCredit;
    singleOlderA = sliceA.singleOlderPersonsTaxCredit;
    singleOlderB = sliceB.singleOlderPersonsTaxCredit;
    incomeTaxA = sliceA.incomeTaxAfterCredits;
    incomeTaxB = sliceB.incomeTaxAfterCredits;
    if (
      typeof sliceA.incomeTaxAfterCredits === 'number' &&
      typeof sliceB.incomeTaxAfterCredits === 'number'
    ) {
      incomeTaxDelta = sliceB.incomeTaxAfterCredits - sliceA.incomeTaxAfterCredits;
    }
    missingInputs.push(...sliceA.missingInputs, ...sliceB.missingInputs);
    assumptions.push(...sliceA.assumptions);
    personalTaxUnknown =
      isUnknownMaterialPersonalTax(sliceA) || isUnknownMaterialPersonalTax(sliceB);
    const zvw = calculateAdditionalZvw2026({
      positiveTaxableRowCents: taxableRow,
      baselineZvwContributionIncomeAlreadyUsedCents: zvwUsed,
    });
    zvwB = zvw.additionalZvwCents;
    zvwDelta = zvw.additionalZvwCents;
  } else if (!input.additionalIncomeClassification) {
    missingInputs.push('additionalIncomeClassification');
  } else if (input.assumeEstimatedCostsTaxDeductible !== true) {
    missingInputs.push('assumeEstimatedCostsTaxDeductible');
  }

  const wantsHealthcare = hasAllowance(input.allowances, 'HEALTHCARE');
  const wantsRent = hasAllowance(input.allowances, 'RENT');
  const wantsChildBudget = hasAllowance(input.allowances, 'CHILD_BUDGET');
  const wantsChildcare = hasAllowance(input.allowances, 'CHILDCARE');
  const allowancesUnknown = input.allowances.includes('UNKNOWN');
  const allowancesNone = input.allowances.includes('NONE');
  const midYear = input.midYearHouseholdChange === true;
  assumptions.push(CALCULATION_PERIOD.FULL_YEAR_STABLE_SITUATION);

  let healthcareA: CentsOrUnknown = UNKNOWN;
  let healthcareB: CentsOrUnknown = UNKNOWN;
  let healthcareDelta: CentsOrUnknown = UNKNOWN;
  let rentA: CentsOrUnknown = UNKNOWN;
  let rentB: CentsOrUnknown = UNKNOWN;
  let rentDelta: CentsOrUnknown = UNKNOWN;
  let childBudgetA: CentsOrUnknown = UNKNOWN;
  let childBudgetB: CentsOrUnknown = UNKNOWN;
  let childBudgetDelta: CentsOrUnknown = UNKNOWN;
  let childcareA: CentsOrUnknown = UNKNOWN;
  let childcareB: CentsOrUnknown = UNKNOWN;
  let childcareDelta: CentsOrUnknown = UNKNOWN;

  const assessA = input.baselineAssessmentIncomeCents;
  const partner = input.partnerContext;
  const hasPartner = partner?.hasPartner;
  const healthcareAssets =
    input.healthcareAssetsEligibility ?? input.assetsEligibility ?? null;
  const rowCents = typeof taxableRow === 'number' ? taxableRow : null;

  const userInsurance = input.userHealthcareInsuranceStatus ?? null;
  const housingTenure = input.housingTenure ?? null;
  const hasChildrenFact = input.hasChildren ?? null;
  const usesChildcareFact = input.usesChildcare ?? null;

  if (allowancesNone) {
    healthcareA = 0;
    healthcareB = 0;
    healthcareDelta = 0;
    rentA = 0;
    rentB = 0;
    rentDelta = 0;
    childBudgetA = 0;
    childBudgetB = 0;
    childBudgetDelta = 0;
    childcareA = 0;
    childcareB = 0;
    childcareDelta = 0;
  } else if (allowancesUnknown) {
    missingInputs.push('allowances');
  }

  if (!allowancesNone && !wantsHealthcare && !allowancesUnknown) {
    healthcareA = 0;
    healthcareB = 0;
    healthcareDelta = 0;
  }

  if (wantsHealthcare) {
    if (userInsurance === 'NOT_INSURED') {
      healthcareA = 0;
      healthcareB = 0;
      healthcareDelta = 0;
    } else if (userInsurance === 'UNKNOWN') {
      missingInputs.push('userHealthcareInsuranceStatus');
    } else {
      if (assessA == null) missingInputs.push('baselineAssessmentIncomeCents');
      if (healthcareAssets == null || healthcareAssets === 'UNKNOWN') {
        missingInputs.push('healthcareAssetsEligibility');
      }
      if (hasPartner === 'UNKNOWN' || hasPartner == null) {
        missingInputs.push('partnerContext.hasPartner');
      }
      if (hasPartner === true) {
        const ins = partner?.partnerHealthcareInsuranceStatus;
        if (ins == null || ins === 'UNKNOWN') {
          missingInputs.push('partnerHealthcareInsuranceStatus');
        }
        if (partner?.partnerAssessmentIncomeCents == null) {
          missingInputs.push('partnerAssessmentIncomeCents');
        }
      }

      const partnerAssessKnown =
        hasPartner === false ||
        (hasPartner === true && partner?.partnerAssessmentIncomeCents != null);

      if (healthcareAssets === 'NOT_ELIGIBLE' && assessA != null) {
        healthcareA = 0;
        healthcareB = 0;
        healthcareDelta = 0;
      } else if (
        healthcareAssets === 'ELIGIBLE' &&
        assessA != null &&
        canTax &&
        rowCents != null &&
        partnerAssessKnown &&
        (hasPartner === false ||
          (hasPartner === true &&
            partner?.partnerHealthcareInsuranceStatus &&
            partner.partnerHealthcareInsuranceStatus !== 'UNKNOWN'))
      ) {
        const partnerAssess =
          hasPartner === true ? (partner?.partnerAssessmentIncomeCents ?? 0) : 0;
        const partnerIns =
          hasPartner === true
            ? partner?.partnerHealthcareInsuranceStatus === 'NOT_INSURED'
              ? 'NOT_INSURED'
              : 'INSURED'
            : 'INSURED';
        healthcareA = calculateHealthcareAllowance2026({
          hasPartner: hasPartner === true,
          assessmentIncomeCents: assessA,
          partnerAssessmentIncomeCents: partnerAssess,
          partnerInsurance: partnerIns,
        });
        healthcareB = calculateHealthcareAllowance2026({
          hasPartner: hasPartner === true,
          assessmentIncomeCents: assessA + rowCents,
          partnerAssessmentIncomeCents: partnerAssess,
          partnerInsurance: partnerIns,
        });
        healthcareDelta = healthcareB - healthcareA;
      }
    }
  }

  if (!allowancesNone && !wantsRent && !allowancesUnknown) {
    if (housingTenure === 'UNKNOWN') {
      missingInputs.push('housingTenure');
    } else {
      rentA = 0;
      rentB = 0;
      rentDelta = 0;
    }
  }
  if (wantsRent) {
    if (midYear) {
      rentDelta = UNKNOWN;
      missingInputs.push('midYearHouseholdChange');
    } else if (assessA == null) {
      missingInputs.push('baselineAssessmentIncomeCents');
    } else if (input.onlyTotalRentKnown === true || input.bareRentCentsPerMonth == null) {
      missingInputs.push('bareRentCentsPerMonth');
    } else if (!input.housingHousehold) {
      missingInputs.push('housingHousehold');
    } else if (rowCents == null) {
      missingInputs.push('taxableROWResult');
    } else {
      const hh = {
        ...input.housingHousehold,
        housingAssetsEligibility:
          input.housingHousehold.housingAssetsEligibility ??
          input.housingAssetsEligibility ??
          null,
      };
      const a = calculateHousingAllowance2026({
        midYearHouseholdChange: false,
        onlyTotalRentKnown: false,
        bareRentCentsPerMonth: input.bareRentCentsPerMonth,
        household: hh,
        userAssessmentIncomeCents: assessA,
      });
      const b = calculateHousingAllowance2026({
        midYearHouseholdChange: false,
        onlyTotalRentKnown: false,
        bareRentCentsPerMonth: input.bareRentCentsPerMonth,
        household: hh,
        userAssessmentIncomeCents: assessA + rowCents,
      });
      rentA = a.annualCents;
      rentB = b.annualCents;
      if (typeof a.annualCents === 'number' && typeof b.annualCents === 'number') {
        rentDelta = b.annualCents - a.annualCents;
      } else {
        rentDelta = UNKNOWN;
        if (a.reason) missingInputs.push(`housing:${a.reason}`);
        if (b.reason && b.reason !== a.reason) missingInputs.push(`housing:${b.reason}`);
      }
    }
  }

  if (!allowancesNone && !wantsChildBudget && !allowancesUnknown) {
    if (hasChildrenFact === 'UNKNOWN') {
      missingInputs.push('hasChildren');
    } else {
      childBudgetA = 0;
      childBudgetB = 0;
      childBudgetDelta = 0;
    }
  }
  if (wantsChildBudget) {
    if (midYear) {
      childBudgetDelta = UNKNOWN;
      missingInputs.push('midYearHouseholdChange');
    } else if (assessA == null) {
      missingInputs.push('baselineAssessmentIncomeCents');
    } else if (!input.childBudgetHousehold) {
      missingInputs.push('childBudgetHousehold');
    } else if (rowCents == null) {
      missingInputs.push('taxableROWResult');
    } else {
      const kgbHh = {
        ...input.childBudgetHousehold,
        childBudgetAssetsEligibility:
          input.childBudgetHousehold.childBudgetAssetsEligibility ??
          input.childBudgetAssetsEligibility ??
          null,
      };
      const partnerIncome = partner?.partnerAssessmentIncomeCents ?? null;
      const a = calculateChildBudget2026({
        midYearHouseholdChange: false,
        household: kgbHh,
        userAssessmentIncomeCents: assessA,
        partnerAssessmentIncomeCents: partnerIncome,
      });
      const b = calculateChildBudget2026({
        midYearHouseholdChange: false,
        household: kgbHh,
        userAssessmentIncomeCents: assessA + rowCents,
        partnerAssessmentIncomeCents: partnerIncome,
      });
      childBudgetA = a.annualCents;
      childBudgetB = b.annualCents;
      if (typeof a.annualCents === 'number' && typeof b.annualCents === 'number') {
        childBudgetDelta = b.annualCents - a.annualCents;
      } else {
        childBudgetDelta = UNKNOWN;
        if (a.reason) missingInputs.push(`childBudget:${a.reason}`);
      }
    }
  }

  if (!allowancesNone && !wantsChildcare && !allowancesUnknown) {
    if (usesChildcareFact === 'UNKNOWN' || hasChildrenFact === 'UNKNOWN') {
      missingInputs.push(usesChildcareFact === 'UNKNOWN' ? 'usesChildcare' : 'hasChildren');
    } else {
      childcareA = 0;
      childcareB = 0;
      childcareDelta = 0;
    }
  }
  if (wantsChildcare) {
    if (midYear) {
      childcareDelta = UNKNOWN;
      missingInputs.push('midYearHouseholdChange');
    } else if (assessA == null) {
      missingInputs.push('baselineAssessmentIncomeCents');
    } else if (!input.childcareHousehold) {
      missingInputs.push('childcareHousehold');
    } else if (rowCents == null) {
      missingInputs.push('taxableROWResult');
    } else {
      const kotHh = input.childcareHousehold;
      const partnerIncome =
        kotHh.hasToeslagPartner === true
          ? (partner?.partnerAssessmentIncomeCents ?? null)
          : 0;
      if (kotHh.hasToeslagPartner === true && partnerIncome == null) {
        missingInputs.push('partnerAssessmentIncomeCents');
      } else {
        const partnerPart = partnerIncome ?? 0;
        const a = calculateChildcareAllowance2026({
          midYearHouseholdChange: false,
          household: kotHh,
          jointAssessmentIncomeCents: assessA + partnerPart,
        });
        const b = calculateChildcareAllowance2026({
          midYearHouseholdChange: false,
          household: kotHh,
          jointAssessmentIncomeCents: assessA + partnerPart + rowCents,
        });
        childcareA = a.annualCents;
        childcareB = b.annualCents;
        if (typeof a.annualCents === 'number' && typeof b.annualCents === 'number') {
          childcareDelta = b.annualCents - a.annualCents;
        } else {
          childcareDelta = UNKNOWN;
          if (a.reason) missingInputs.push(`childcare:${a.reason}`);
        }
      }
    }
  }

  const unsupportedTaxCredits = collectUnsupportedCredits(input);
  const selectedUnknown =
    (wantsHealthcare && isUnknown(healthcareDelta)) ||
    ((wantsRent || housingTenure === 'UNKNOWN') && isUnknown(rentDelta)) ||
    ((wantsChildBudget || hasChildrenFact === 'UNKNOWN') && isUnknown(childBudgetDelta)) ||
    ((wantsChildcare || usesChildcareFact === 'UNKNOWN' || hasChildrenFact === 'UNKNOWN') &&
      isUnknown(childcareDelta));

  let completeness: CalculatorReadyResult['completeness'] = 'COMPLETE_FOR_CORE';
  if (unsupportedTaxCredits.length > 0) completeness = 'PARTIAL_PERSONAL_TAX_CREDITS';
  if (
    missingInputs.length > 0 ||
    isUnknown(incomeTaxDelta) ||
    isUnknown(zvwDelta) ||
    selectedUnknown ||
    personalTaxUnknown
  ) {
    completeness = 'PARTIAL';
  }

  let netExtra: CentsOrUnknown = UNKNOWN;
  let netMonth: CentsOrUnknown = UNKNOWN;
  let coreKnown = false;
  if (
    typeof taxableRow === 'number' &&
    typeof incomeTaxDelta === 'number' &&
    typeof zvwDelta === 'number' &&
    typeof healthcareDelta === 'number' &&
    typeof rentDelta === 'number' &&
    typeof childBudgetDelta === 'number' &&
    typeof childcareDelta === 'number' &&
    !selectedUnknown
  ) {
    const extra =
      taxableRow -
      incomeTaxDelta -
      zvwDelta +
      healthcareDelta +
      rentDelta +
      childBudgetDelta +
      childcareDelta;
    netExtra = extra;
    netMonth = toCentsRoundHalfUp(fromCents(extra) / BigInt(12));
    coreKnown = true;
  }

  const netExtraIsDefinitive =
    coreKnown &&
    completeness === 'COMPLETE_FOR_CORE' &&
    !selectedUnknown &&
    !personalTaxUnknown &&
    unsupportedTaxCredits.length === 0;

  const baseline = emptySnapshot(0);
  baseline.incomeTax = incomeTaxA;
  baseline.zvwContribution = canTax ? zvwA : UNKNOWN;
  baseline.generalTaxCredit = creditGenA;
  baseline.employmentTaxCredit = creditEmpA;
  baseline.iack = iackA;
  baseline.olderPersonsTaxCredit = olderA;
  baseline.singleOlderPersonsTaxCredit = singleOlderA;
  baseline.healthcareAllowance = healthcareA;
  baseline.rentAllowance = rentA;
  baseline.childBudget = childBudgetA;
  baseline.childcareAllowance = childcareA;

  const scenario = emptySnapshot(commercialAdditional);
  scenario.incomeTax = incomeTaxB;
  scenario.zvwContribution = zvwB;
  scenario.generalTaxCredit = creditGenB;
  scenario.employmentTaxCredit = creditEmpB;
  scenario.iack = iackB;
  scenario.olderPersonsTaxCredit = olderB;
  scenario.singleOlderPersonsTaxCredit = singleOlderB;
  scenario.healthcareAllowance = healthcareB;
  scenario.rentAllowance = rentB;
  scenario.childBudget = childBudgetB;
  scenario.childcareAllowance = childcareB;

  return {
    status: 'READY',
    baseline,
    scenario,
    deltas: {
      incomeTax: incomeTaxDelta,
      zvw: zvwDelta,
      healthcareAllowance: healthcareDelta,
      rentAllowance: rentDelta,
      childBudget: childBudgetDelta,
      childcareAllowance: childcareDelta,
    },
    commercialAdditionalResultCents: commercialAdditional,
    taxableAdditionalIncomeCents: taxableRow,
    netExtraCents: netExtra,
    netExtraPerMonthCents: netMonth,
    netExtraIsDefinitive,
    completeness,
    unsupportedTaxCredits,
    assumptions,
    missingInputs,
    packMetadata: packMetadata ?? {
      id: 'NL-2026',
      jurisdiction: 'NL',
      year: 2026,
      version: 'unknown',
      status: 'DRAFT',
      verifiedAt: null,
    },
  };
}
