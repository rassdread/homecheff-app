import type { CalculatorInput } from '../calculator/types';
import { hasAllowance } from '../domain/allowances';
import type { Child } from '../domain/children';
import type { ChildcareEntry } from '../domain/childcare';
import { CALCULATION_PERIOD, type HousingHousehold, type HousingResident } from '../domain/household';
import {
  iackChildFromAgeOn1Jan2026,
  type IackContext,
} from '../domain/iack';
import { V1_COST_SOURCE } from '../domain/costs';
import {
  commercialResultCents,
  parseEuroInputToCents,
  scenarioPresetToCents,
} from '../domain/money';
import type { BusinessGuidanceFacts } from '../guidance/types';
import type { TriState } from '../domain/tri-state';
import {
  emptyBijstandContext,
  emptyUwvDisabilityContext,
  emptyWwContext,
  type BenefitGuidanceFacts,
} from '../domain/benefits';
import { derivePersonSituation } from '../domain/person';
import { ADDITIONAL_INCOME_CLASSIFICATION } from '../nl2026/row';
import type { WizardState } from './schema';
import {
  parseWizardChildAges,
  wizardHasChildUnder12,
  growthStartToFields,
  isBenefitSituation,
} from './schema';
import {
  deriveKvkPrimaryFromActivity,
  deriveKvkSupportingFromActivity,
} from '../domain/kvk';
import { deriveVatEntrepreneurshipContext } from '../domain/vat';
import { activityKindsToDac7Category } from '../domain/dac7';
import { UNKNOWN } from '../domain/unknown';
import {
  classifyFoodActivityType,
  emptyFoodActivity,
  mapUxFoodFrequency,
  mapSaleFrequencyToFoodSellingFrequency,
  type FoodActivityContext,
} from '../domain/food-activity';

function annualizeEuro(raw: string, period: WizardState['amountEntryPeriod']): number | null {
  const cents = parseEuroInputToCents(raw);
  if (cents == null) return null;
  return period === 'MONTH' ? cents * 12 : cents;
}

function parseAges(raw: string): number[] {
  return parseWizardChildAges(raw);
}

function buildIackContext(state: WizardState): IackContext | null {
  if (!wizardHasChildUnder12(state)) return null;
  const ages = parseAges(state.childrenAges);
  const household = state.iackHouseholdDuration ?? 'UNKNOWN';
  const coParent = state.iackCoParentStatus ?? 'UNKNOWN';
  const children =
    ages.length > 0
      ? ages.map((age) =>
          iackChildFromAgeOn1Jan2026({
            ageYears: age,
            householdDurationEligibility: household,
            coParentEligibility: coParent,
          }),
        )
      : [
          {
            bornAfter2013_12_31: true as const,
            childUnder12On2026_01_01: true as const,
            householdDurationEligibility: household,
            coParentEligibility: coParent,
          },
        ];
  return {
    children,
    fiscalPartnerDuration: state.fiscalPartnerDuration ?? 'UNKNOWN',
    partnerArbeidsinkomenCents: annualizeEuro(state.partnerArbeidsinkomenEuro, state.amountEntryPeriod),
    relativeAge: state.iackRelativeAge,
  };
}

function effectiveAllowances(state: WizardState) {
  if (isBenefitSituation(state) || state.growthStart === 'TRYING_OUT') {
    return ['NONE'] as const;
  }
  return state.allowances;
}

function buildHousingHousehold(state: WizardState, userAssess: number | null): HousingHousehold | null {
  if (!hasAllowance(effectiveAllowances(state), 'RENT')) return null;
  const oldestRaw = state.oldestHouseholdResidentAge.trim();
  const oldest = oldestRaw === '' ? null : Number.parseInt(oldestRaw, 10);
  const applicantAge = Number.isInteger(oldest) ? oldest : null;
  const residents: HousingResident[] = [
    {
      localKey: 'applicant',
      role: 'APPLICANT',
      ageYears: applicantAge,
      assessmentIncomeCents: userAssess,
    },
  ];
  if (state.housingHouseholdType === 'MULTI') {
    if (state.hasPartner === true) {
      residents.push({
        localKey: 'partner',
        role: 'TOESLAGPARTNER',
        ageYears: applicantAge,
        assessmentIncomeCents: annualizeEuro(state.partnerAssessmentEuro, state.amountEntryPeriod),
      });
    } else {
      residents.push({
        localKey: 'medebewoner',
        role: 'MEDEBEWONER',
        ageYears: applicantAge,
        assessmentIncomeCents: annualizeEuro(state.partnerAssessmentEuro, state.amountEntryPeriod) ?? 0,
      });
    }
  }
  if (state.housingHasThuiswonendKindUnder23 === true) {
    residents.push({
      localKey: 'kind',
      role: 'THUISWONEND_KIND',
      ageYears: 16,
      assessmentIncomeCents: annualizeEuro(state.housingChildAssessmentEuro, state.amountEntryPeriod) ?? 0,
    });
  }
  return {
    residents,
    housingAssetsEligibility: state.housingAssetsEligibility,
    midYearHouseholdChange: state.midYearHouseholdChange === true,
  };
}

function buildChildren(state: WizardState): Child[] {
  return parseAges(state.childrenAges).map((age, i) => ({
    localKey: `child-${i + 1}`,
    ageYears: age,
    eligibilityStatus: 'ELIGIBLE' as const,
  }));
}

function buildChildcareEntries(state: WizardState): ChildcareEntry[] {
  const ages = parseAges(state.childrenAges);
  const hours = Number.parseInt(state.childcareHoursPerMonth, 10);
  const rate = parseEuroInputToCents(state.childcareHourlyRateEuro);
  if (!state.childcareCareType || !Number.isInteger(hours) || rate == null) return [];
  const childKey = ages[0] != null ? 'child-1' : 'child-1';
  return [
    {
      localKey: 'entry-1',
      childKey,
      childAgeYears: ages[0] ?? null,
      careType: state.childcareCareType,
      hoursPerMonth: hours,
      actualHourlyRateCents: rate,
      providerEligibilityStatus: state.childcareProviderStatus ?? 'UNKNOWN',
    },
  ];
}

export function wizardStateToCalculatorInput(state: WizardState): CalculatorInput | null {
  const personSituation = derivePersonSituation({
    group: state.situationGroup,
    uwvBenefit: state.uwvBenefit,
  });
  if (!state.taxResidence || !personSituation) return null;

  const derived = state.growthStart ? growthStartToFields(state.growthStart) : null;
  const frequency = state.frequency ?? derived?.frequency ?? 'UNKNOWN';
  const intent = state.intent ?? derived?.intent ?? 'UNKNOWN';
  const allowances = [...effectiveAllowances(state)];
  const period = state.amountEntryPeriod;
  const turnoverCents = annualizeEuro(state.estimatedTurnoverEuro, period) ?? 0;
  const costsCents = annualizeEuro(state.estimatedCostsEuro, period) ?? 0;
  const liveResult = commercialResultCents(turnoverCents, costsCents);
  const scenarioCents =
    state.scenarioPreset === 'custom'
      ? annualizeEuro(state.customScenarioEuro, period) ?? liveResult
      : state.scenarioPreset
        ? scenarioPresetToCents(state.scenarioPreset)
        : liveResult;
  const assessmentCents = annualizeEuro(state.baselineAssessmentEuro, period);
  const children = buildChildren(state);
  const monthsRaw = Number.parseInt(state.workedMonthsInYear, 10);

  return {
    jurisdiction: state.taxResidence === 'NL' ? 'NL' : 'OTHER',
    calendarYear: 2026,
    personContext: { situation: personSituation },
    currentAnnualIncomeCents: null,
    ageTaxRegime: state.ageTaxRegime,
    aowBirthCohort: state.aowBirthCohort,
    aowMonth: state.aowMonth,
    iackContext: buildIackContext(state),
    singleOlderPersonsCreditEligibility: state.singleOlderPersonsCreditEligibility,
    additionalIncomeClassification:
      state.acceptRowAssumption || state.growthStart != null
        ? ADDITIONAL_INCOME_CLASSIFICATION.RESULT_FROM_OTHER_WORK
        : null,
    assumeEstimatedCostsTaxDeductible: state.assumeEstimatedCostsTaxDeductible,
    baselineGrossEmploymentIncomeCents: annualizeEuro(state.baselineGrossEmploymentEuro, period),
    baselineBox1TaxableIncomeCents: annualizeEuro(state.baselineBox1Euro, period),
    baselineAggregateIncomeCents: annualizeEuro(state.baselineAggregateEuro, period),
    baselineArbeidsinkomenCents: annualizeEuro(state.baselineArbeidsinkomenEuro, period),
    baselineAssessmentIncomeCents: assessmentCents,
    baselineZvwContributionIncomeAlreadyUsedCents: annualizeEuro(state.baselineZvwUsedEuro, period),
    assetsEligibility: state.assetsEligibility,
    healthcareAssetsEligibility: state.assetsEligibility,
    housingAssetsEligibility: state.housingAssetsEligibility,
    childBudgetAssetsEligibility: state.childBudgetAssetsEligibility,
    partnerContext:
      state.hasPartner == null
        ? null
        : {
            hasPartner: state.hasPartner === 'UNKNOWN' ? 'UNKNOWN' : state.hasPartner,
            partnerAssessmentIncomeCents: annualizeEuro(state.partnerAssessmentEuro, period),
            partnerHealthcareInsuranceStatus: state.partnerHealthcareInsuranceStatus,
          },
    calculationPeriod: CALCULATION_PERIOD.FULL_YEAR_STABLE_SITUATION,
    midYearHouseholdChange: state.midYearHouseholdChange,
    housingHousehold: buildHousingHousehold(state, assessmentCents),
    bareRentCentsPerMonth: parseEuroInputToCents(state.bareRentEuro),
    onlyTotalRentKnown: state.onlyTotalRentKnown === true,
    childBudgetHousehold: hasAllowance(allowances, 'CHILD_BUDGET')
      ? {
          children,
          hasToeslagPartner: state.hasPartner,
          childBudgetAssetsEligibility: state.childBudgetAssetsEligibility,
          midYearHouseholdChange: state.midYearHouseholdChange === true,
        }
      : null,
    childcareHousehold: hasAllowance(allowances, 'CHILDCARE')
      ? {
          entries: buildChildcareEntries(state),
          hasToeslagPartner: state.hasPartner,
          parentWorkStudyStatus: state.parentWorkStudyStatus,
          workedMonthsInYear: Number.isInteger(monthsRaw) ? monthsRaw : null,
          midYearHouseholdChange: state.midYearHouseholdChange === true,
        }
      : null,
    allowances: allowances.length > 0 ? allowances : ['UNKNOWN'],
    activity: {
      kinds: state.activityKinds,
      frequency,
      customers: state.customers ?? 'UNKNOWN',
      commercialIntent: intent,
      independence:
        state.independentlyDeterminesWork == null
          ? 'UNKNOWN'
          : state.independentlyDeterminesWork,
      continuity:
        frequency === 'REGULAR'
          ? true
          : frequency === 'ONE_OFF'
            ? false
            : 'UNKNOWN',
      timeOrMoneyInvested: 'UNKNOWN',
      listingCount: null,
      transactionCount: (() => {
        const n = Number.parseInt(state.estimatedAnnualTransactions, 10);
        return Number.isInteger(n) && n >= 0 ? n : null;
      })(),
      typicalTicketCents: null,
      unitCount: null,
    },
    incomeSource: 'MARKETPLACE_SELLER',
    estimatedTurnoverCents: turnoverCents,
    estimatedCosts: { amountCents: costsCents, source: V1_COST_SOURCE },
    commercialResultCents: liveResult,
    scenarioAdditionalResultCents: scenarioCents,
  };
}

function triFromBool(value: boolean | 'UNKNOWN' | null): TriState {
  if (value === true) return 'YES';
  if (value === false) return 'NO';
  return 'UNKNOWN';
}

export function wizardStateToBusinessFacts(state: WizardState): BusinessGuidanceFacts | null {
  const input = wizardStateToCalculatorInput(state);
  if (!input || state.taxResidence !== 'NL') return null;
  const activity = input.activity;
  const supporting = deriveKvkSupportingFromActivity(activity);
  if (state.customerAcquisition != null) {
    supporting.multipleCustomersOrAcquisition = triFromBool(state.customerAcquisition);
  }
  const otherKnown = state.hasOtherBusinessTurnover === false
    ? 0
    : annualizeEuro(state.otherRelevantVatTurnoverEuro, state.amountEntryPeriod);
  const other =
    state.hasOtherBusinessTurnover === 'UNKNOWN' || state.hasOtherBusinessTurnover == null
      ? UNKNOWN
      : otherKnown ?? UNKNOWN;
  const tx = activity.transactionCount;
  return {
    calendarYear: 2026,
    kvk: {
      primary: deriveKvkPrimaryFromActivity(activity),
      supporting,
      alreadyRegistered: triFromBool(state.alreadyKvkRegistered),
    },
    vatEntrepreneurship: deriveVatEntrepreneurshipContext(activity),
    alreadyVatRegistered:
      state.vatRegistrationStatus === 'REGISTERED'
        ? 'YES'
        : state.vatRegistrationStatus === 'NOT_REGISTERED'
          ? 'NO'
          : 'UNKNOWN',
    vatTurnover: {
      homeCheffVatTurnoverCents: input.estimatedTurnoverCents,
      otherRelevantVatTurnoverCents: other,
    },
    kor: {
      establishedInNetherlands: 'YES',
      currentYearRelevantTurnoverCents:
        typeof other === 'number' ? input.estimatedTurnoverCents + other : UNKNOWN,
      previousYearRelevantTurnoverCents:
        annualizeEuro(state.previousYearVatTurnoverEuro, state.amountEntryPeriod) ?? UNKNOWN,
      activityEligibility:
        activity.kinds.length === 0 ? 'UNKNOWN' : 'ELIGIBLE',
      currentlyParticipating: triFromBool(state.korParticipating),
    },
    dac7: {
      calendarYear: 2026,
      activityCategory: activityKindsToDac7Category(activity.kinds),
      transactionCount: tx,
      considerationCents: input.estimatedTurnoverCents,
    },
  };
}

export function wizardStateToBenefitFacts(state: WizardState): BenefitGuidanceFacts | null {
  if (state.taxResidence !== 'NL') return null;
  const situation = derivePersonSituation({
    group: state.situationGroup,
    uwvBenefit: state.uwvBenefit,
  });
  if (
    situation !== 'WW' &&
    situation !== 'BIJSTAND' &&
    situation !== 'WIA' &&
    situation !== 'WAJONG' &&
    situation !== 'ZW' &&
    situation !== 'WAO' &&
    situation !== 'WAZ'
  ) {
    return null;
  }

  if (situation === 'WW') {
    const ww = emptyWwContext();
    ww.discussedWithUwv = triFromBool(state.discussedWithUwv);
    ww.wantsStartPeriod = triFromBool(state.wantsStartPeriod);
    ww.wantsToRetainWw = triFromBool(state.wantsToRetainWw);
    ww.startPeriod = {
      uwvPermission: triFromBool(state.uwvPermission),
      startDate: null,
      receivesUwvSupplement: triFromBool(state.receivesUwvSupplement),
      formerEmployerWorkPlanned: triFromBool(state.formerEmployerWorkPlanned),
    };
    return { ww };
  }

  if (situation === 'BIJSTAND') {
    const bijstand = emptyBijstandContext();
    bijstand.municipality = {
      municipalityKnown: state.municipalityKnown === true,
      municipalityName: state.municipalityName.trim() || null,
      localPolicyStatus:
        state.municipalityKnown === true ? 'CHECK_WITH_MUNICIPALITY' : 'UNKNOWN',
    };
    bijstand.preparationPeriod = state.preparationPeriod ?? 'UNKNOWN';
    return { bijstand };
  }

  const disability = emptyUwvDisabilityContext(situation);
  disability.discussedWithLabourExpert = triFromBool(state.discussedWithUwv);
  disability.wantsResearchPeriod = triFromBool(state.wantsResearchPeriod);
  disability.uwvPermissionForProgram = triFromBool(state.uwvPermission);
  if (situation === 'ZW') {
    disability.zwOrigin = state.zwOrigin ?? 'UNKNOWN';
  }
  return { uwvDisability: disability };
}

export function wizardStateToFoodFacts(state: WizardState): FoodActivityContext | null {
  if (state.taxResidence !== 'NL') return null;
  if (!state.activityKinds.includes('FOOD') && state.activityChoice !== 'FOOD') return null;
  const type = classifyFoodActivityType(
    state.activityKinds.length > 0 ? state.activityKinds : ['FOOD'],
  );
  if (type === 'NOT_FOOD') return null;
  const food = emptyFoodActivity(type);
  const derived = state.growthStart ? growthStartToFields(state.growthStart) : null;
  food.sellingFrequency = state.foodUxFrequency
    ? mapUxFoodFrequency(state.foodUxFrequency)
    : mapSaleFrequencyToFoodSellingFrequency(state.frequency ?? derived?.frequency ?? 'UNKNOWN');
  food.preparationLocation = 'HOME';
  food.packagingMode = state.packagingMode ?? 'UNKNOWN';
  food.nvwaRegistrationStatus = triFromBool(state.nvwaRegistered);
  food.foodSafetyPlanStatus = state.foodSafetyPlanStatus ?? 'UNKNOWN';
  food.handlesAnimalOriginProducts = triFromBool(state.handlesAnimalOriginProducts);
  return food;
}
