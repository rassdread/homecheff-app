/**
 * Schema-driven wizard. Visibility lives here — not in scattered component ifs.
 */

import {
  hasAllowance,
  needsChildBudgetFields,
  needsChildcareFields,
  needsPartnerContext,
  needsRentFields,
  type AllowanceId,
} from '../domain/allowances';
import type { ActivityKind, CommercialIntent, CustomerScope, SaleFrequency } from '../domain/activity';
import type { SituationGroup, UwvBenefit } from '../domain/person';
import type {
  MunicipalPreparationPeriodStatus,
  ZwOrigin,
} from '../domain/benefits';
import type {
  HomecheffGrowthIntent,
} from '../domain/growth-intent';
import type {
  FoodSafetyPlanStatus,
  PackagingMode,
} from '../domain/food-activity';
import type { ScenarioPresetEuro } from '../domain/money';
import type { AgeTaxRegime2026 } from '../domain/income-bases';
import type { AowBirthCohort2026, AowMonth2026, SingleOlderPersonsCreditEligibility } from '../domain/aow';
import type {
  FiscalPartnerDuration,
  IackCoParentStatus,
  IackHouseholdDuration,
  IackRelativeAge,
} from '../domain/iack';
import type { AssetsEligibility, PartnerHealthcareInsuranceStatus } from '../calculator/types';
import type { ChildcareCareType, ChildcareProviderEligibility, ParentWorkStudyStatus } from '../domain/childcare';

export const WIZARD_STEP_IDS = [
  'jurisdiction',
  'activity',
  'growthStart',
  'foodSellingFrequency',
  'foodPackaging',
  'foodNvwa',
  'foodSafetyPlan',
  'foodAnimalOrigin',
  'situation',
  'uwvBenefit',
  'uwvDiscussedPlan',
  'wwStartPeriod',
  'wwRetainBenefit',
  'wwFormerEmployer',
  'wwUwvSupplement',
  'uwvResearchPeriod',
  'uwvPermission',
  'zwOrigin',
  'bijstandMunicipality',
  'bijstandPreparation',
  'aow',
  'aowBirthCohort',
  'aowMonth',
  'singleOlderAow',
  'allowances',
  'partner',
  'partnerInsurance',
  'partnerIncome',
  'housingRent',
  'housingHousehold',
  'housingAssets',
  'children',
  'youngChild',
  'iackHousehold',
  'iackCoParent',
  'fiscalPartner',
  'iackPartnerIncome',
  'iackRelativeAge',
  'childBudgetAssets',
  'childcare',
  'workStudy',
  'midYear',
  'frequency',
  'customers',
  'independentlyDeterminesWork',
  'customerAcquisition',
  'intent',
  'amounts',
  'otherVatTurnover',
  'existingRegistrations',
  'costAssumption',
  'rowAssumption',
  'incomeBases',
  'assets',
  'scenario',
  'result',
] as const;

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

export type TaxResidenceChoice = 'NL' | 'OTHER';

export type ActivityChoice = 'MAKE' | 'FOOD' | 'SERVICE' | 'GARDEN' | 'UNKNOWN';

export type WizardState = {
  taxResidence: TaxResidenceChoice | null;
  activityChoice: ActivityChoice | null;
  growthStart: HomecheffGrowthIntent | null;
  situationGroup: SituationGroup | null;
  uwvBenefit: UwvBenefit | null;
  discussedWithUwv: boolean | 'UNKNOWN' | null;
  wantsStartPeriod: boolean | 'UNKNOWN' | null;
  wantsToRetainWw: boolean | 'UNKNOWN' | null;
  formerEmployerWorkPlanned: boolean | 'UNKNOWN' | null;
  receivesUwvSupplement: boolean | 'UNKNOWN' | null;
  uwvPermission: boolean | 'UNKNOWN' | null;
  wantsResearchPeriod: boolean | 'UNKNOWN' | null;
  zwOrigin: ZwOrigin | null;
  municipalityKnown: boolean | null;
  municipalityName: string;
  preparationPeriod: MunicipalPreparationPeriodStatus | null;
  ageTaxRegime: AgeTaxRegime2026 | null;
  aowBirthCohort: AowBirthCohort2026 | null;
  aowMonth: AowMonth2026 | null;
  singleOlderPersonsCreditEligibility: SingleOlderPersonsCreditEligibility | null;
  hasChildUnder12: boolean | null;
  iackHouseholdDuration: IackHouseholdDuration | null;
  iackCoParentStatus: IackCoParentStatus | null;
  fiscalPartnerDuration: FiscalPartnerDuration | null;
  partnerArbeidsinkomenEuro: string;
  iackRelativeAge: IackRelativeAge | null;
  allowances: AllowanceId[];
  hasPartner: boolean | 'UNKNOWN' | null;
  partnerHealthcareInsuranceStatus: PartnerHealthcareInsuranceStatus | null;
  partnerAssessmentEuro: string;
  activityKinds: ActivityKind[];
  foodUxFrequency: 'ONE_OFF' | 'OCCASIONAL_RECURRING' | 'REGULAR' | 'UNKNOWN' | null;
  packagingMode: PackagingMode | null;
  nvwaRegistered: boolean | 'UNKNOWN' | null;
  foodSafetyPlanStatus: FoodSafetyPlanStatus | null;
  handlesAnimalOriginProducts: boolean | 'UNKNOWN' | null;
  frequency: SaleFrequency | null;
  customers: CustomerScope | null;
  independentlyDeterminesWork: boolean | 'UNKNOWN' | null;
  customerAcquisition: boolean | 'UNKNOWN' | null;
  intent: CommercialIntent | null;
  estimatedTurnoverEuro: string;
  estimatedCostsEuro: string;
  estimatedAnnualTransactions: string;
  hasOtherBusinessTurnover: boolean | 'UNKNOWN' | null;
  otherRelevantVatTurnoverEuro: string;
  alreadyKvkRegistered: boolean | 'UNKNOWN' | null;
  vatRegistrationStatus: 'REGISTERED' | 'NOT_REGISTERED' | 'UNKNOWN' | null;
  korParticipating: boolean | 'UNKNOWN' | null;
  previousYearVatTurnoverEuro: string;
  assumeEstimatedCostsTaxDeductible: boolean | null;
  acceptRowAssumption: boolean;
  baselineGrossEmploymentEuro: string;
  baselineBox1Euro: string;
  baselineAggregateEuro: string;
  baselineArbeidsinkomenEuro: string;
  baselineAssessmentEuro: string;
  baselineZvwUsedEuro: string;
  assetsEligibility: AssetsEligibility | null;
  housingAssetsEligibility: AssetsEligibility | null;
  childBudgetAssetsEligibility: AssetsEligibility | null;
  bareRentEuro: string;
  onlyTotalRentKnown: boolean | null;
  housingHouseholdType: 'SINGLE' | 'MULTI' | null;
  oldestHouseholdResidentAge: string;
  housingHasThuiswonendKindUnder23: boolean | null;
  housingChildAssessmentEuro: string;
  childrenAges: string;
  childcareCareType: ChildcareCareType | null;
  childcareHoursPerMonth: string;
  childcareHourlyRateEuro: string;
  childcareProviderStatus: ChildcareProviderEligibility | null;
  parentWorkStudyStatus: ParentWorkStudyStatus | null;
  workedMonthsInYear: string;
  midYearHouseholdChange: boolean | null;
  scenarioPreset: ScenarioPresetEuro | 'custom' | null;
  customScenarioEuro: string;
};

export const EMPTY_WIZARD_STATE: WizardState = {
  taxResidence: null,
  activityChoice: null,
  growthStart: null,
  situationGroup: null,
  uwvBenefit: null,
  discussedWithUwv: null,
  wantsStartPeriod: null,
  wantsToRetainWw: null,
  formerEmployerWorkPlanned: null,
  receivesUwvSupplement: null,
  uwvPermission: null,
  wantsResearchPeriod: null,
  zwOrigin: null,
  municipalityKnown: null,
  municipalityName: '',
  preparationPeriod: null,
  ageTaxRegime: null,
  aowBirthCohort: null,
  aowMonth: null,
  singleOlderPersonsCreditEligibility: null,
  hasChildUnder12: null,
  iackHouseholdDuration: null,
  iackCoParentStatus: null,
  fiscalPartnerDuration: null,
  partnerArbeidsinkomenEuro: '',
  iackRelativeAge: null,
  allowances: [],
  hasPartner: null,
  partnerHealthcareInsuranceStatus: null,
  partnerAssessmentEuro: '',
  activityKinds: [],
  foodUxFrequency: null,
  packagingMode: null,
  nvwaRegistered: null,
  foodSafetyPlanStatus: null,
  handlesAnimalOriginProducts: null,
  frequency: null,
  customers: null,
  independentlyDeterminesWork: null,
  customerAcquisition: null,
  intent: null,
  estimatedTurnoverEuro: '',
  estimatedCostsEuro: '',
  estimatedAnnualTransactions: '',
  hasOtherBusinessTurnover: null,
  otherRelevantVatTurnoverEuro: '',
  alreadyKvkRegistered: null,
  vatRegistrationStatus: null,
  korParticipating: null,
  previousYearVatTurnoverEuro: '',
  assumeEstimatedCostsTaxDeductible: null,
  acceptRowAssumption: false,
  baselineGrossEmploymentEuro: '',
  baselineBox1Euro: '',
  baselineAggregateEuro: '',
  baselineArbeidsinkomenEuro: '',
  baselineAssessmentEuro: '',
  baselineZvwUsedEuro: '',
  assetsEligibility: null,
  housingAssetsEligibility: null,
  childBudgetAssetsEligibility: null,
  bareRentEuro: '',
  onlyTotalRentKnown: null,
  housingHouseholdType: null,
  oldestHouseholdResidentAge: '',
  housingHasThuiswonendKindUnder23: null,
  housingChildAssessmentEuro: '',
  childrenAges: '',
  childcareCareType: null,
  childcareHoursPerMonth: '',
  childcareHourlyRateEuro: '',
  childcareProviderStatus: null,
  parentWorkStudyStatus: null,
  workedMonthsInYear: '12',
  midYearHouseholdChange: false,
  scenarioPreset: null,
  customScenarioEuro: '',
};

export function parseWizardChildAges(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => Number.parseInt(p, 10))
    .filter((n) => Number.isInteger(n) && n >= 0);
}

export function applyActivityChoice(choice: ActivityChoice): ActivityKind[] {
  if (choice === 'FOOD') return ['FOOD'];
  if (choice === 'SERVICE') return ['SERVICE'];
  if (choice === 'MAKE' || choice === 'GARDEN') return ['PRODUCT'];
  return [];
}

export function growthStartToFields(growth: HomecheffGrowthIntent): {
  frequency: SaleFrequency;
  intent: CommercialIntent;
} {
  if (growth === 'TRYING_OUT') {
    return { frequency: 'ONE_OFF', intent: 'HOBBY_COST_RECOVERY' };
  }
  if (growth === 'OCCASIONAL_EARNING') {
    return { frequency: 'OCCASIONAL', intent: 'SIDE_INCOME' };
  }
  if (growth === 'REGULAR_EARNING') {
    return { frequency: 'REGULAR', intent: 'SIDE_INCOME' };
  }
  if (growth === 'SERIOUS_SIDE_INCOME') {
    return { frequency: 'REGULAR', intent: 'SERIOUS_SIDE_INCOME' };
  }
  return { frequency: 'REGULAR', intent: 'BUILD_BUSINESS' };
}

export function isBenefitSituation(state: WizardState): boolean {
  return (
    state.situationGroup === 'WW' ||
    state.situationGroup === 'BIJSTAND' ||
    state.situationGroup === 'OTHER_UWV'
  );
}

/** Drop incompatible household answers after Back/Edit so stale cards cannot linger. */
export function applySituationGroup(
  state: WizardState,
  key: SituationGroup,
): WizardState {
  const next: WizardState = {
    ...state,
    situationGroup: key,
    uwvBenefit: key === 'OTHER_UWV' ? state.uwvBenefit : null,
  };
  if (
    key === 'WW' ||
    key === 'BIJSTAND' ||
    key === 'OTHER_UWV'
  ) {
    next.allowances = ['NONE'];
    next.hasPartner = null;
    next.assetsEligibility = null;
  }
  return next;
}

export function applyGrowthStartChoice(
  state: WizardState,
  key: HomecheffGrowthIntent,
): WizardState {
  const fields = growthStartToFields(key);
  const next: WizardState = {
    ...state,
    growthStart: key,
    frequency: fields.frequency,
    intent: fields.intent,
    foodUxFrequency:
      state.activityChoice === 'FOOD' && key === 'TRYING_OUT'
        ? 'ONE_OFF'
        : state.foodUxFrequency,
  };
  if (key === 'TRYING_OUT') {
    next.allowances = ['NONE'];
    next.hasPartner = null;
    next.assetsEligibility = null;
    next.scenarioPreset = null;
  }
  return next;
}

export function allowanceFollowUpsVisible(state: WizardState): boolean {
  return (
    state.taxResidence === 'NL' &&
    !isBenefitSituation(state) &&
    state.growthStart !== 'TRYING_OUT'
  );
}

export function isFoodActivity(state: WizardState): boolean {
  return state.activityChoice === 'FOOD' || state.activityKinds.includes('FOOD');
}

export function isOneOffFood(state: WizardState): boolean {
  if (!isFoodActivity(state)) return false;
  if (state.foodUxFrequency === 'ONE_OFF') return true;
  if (state.growthStart === 'TRYING_OUT' && state.foodUxFrequency == null) return true;
  return false;
}

export function needsSeriousAdminQuestions(state: WizardState): boolean {
  if (state.growthStart === 'TRYING_OUT' || state.growthStart === 'OCCASIONAL_EARNING') {
    return false;
  }
  return (
    state.growthStart === 'REGULAR_EARNING' ||
    state.growthStart === 'SERIOUS_SIDE_INCOME' ||
    state.growthStart === 'BUILDING_BUSINESS' ||
    state.frequency === 'REGULAR' ||
    state.intent === 'BUILD_BUSINESS' ||
    state.intent === 'SERIOUS_SIDE_INCOME' ||
    state.foodUxFrequency === 'OCCASIONAL_RECURRING' ||
    state.foodUxFrequency === 'REGULAR'
  );
}

export function wantsFinancialDetailQuestions(state: WizardState): boolean {
  if (isBenefitSituation(state)) return false;
  if (state.growthStart === 'TRYING_OUT') return false;
  return (
    state.situationGroup === 'EMPLOYEE' ||
    state.situationGroup === 'EXISTING_ENTREPRENEUR' ||
    state.allowances.some((id) => id !== 'NONE' && id !== 'UNKNOWN')
  );
}

export function wizardHasChildUnder12(state: WizardState): boolean {
  if (parseWizardChildAges(state.childrenAges).some((age) => age < 12)) return true;
  return state.hasChildUnder12 === true;
}

export function wizardIackQuestionsNeeded(state: WizardState): boolean {
  return wizardHasChildUnder12(state);
}

export type StepDefinition = {
  id: WizardStepId;
  visible: (state: WizardState) => boolean;
};

export const WIZARD_SCHEMA: readonly StepDefinition[] = [
  {
    id: 'jurisdiction',
    visible: () => true,
  },
  {
    id: 'activity',
    visible: (s) => s.taxResidence === 'NL',
  },
  {
    id: 'growthStart',
    visible: (s) => s.taxResidence === 'NL',
  },
  {
    id: 'foodSellingFrequency',
    visible: (s) => s.taxResidence === 'NL' && isFoodActivity(s),
  },
  {
    id: 'foodPackaging',
    visible: (s) => s.taxResidence === 'NL' && isFoodActivity(s),
  },
  {
    id: 'foodNvwa',
    visible: (s) =>
      s.taxResidence === 'NL' && isFoodActivity(s) && !isOneOffFood(s),
  },
  {
    id: 'foodSafetyPlan',
    visible: (s) =>
      s.taxResidence === 'NL' && isFoodActivity(s) && !isOneOffFood(s),
  },
  {
    id: 'foodAnimalOrigin',
    visible: (s) =>
      s.taxResidence === 'NL' && isFoodActivity(s) && !isOneOffFood(s),
  },
  {
    id: 'situation',
    visible: (s) => s.taxResidence === 'NL',
  },
  {
    id: 'uwvBenefit',
    visible: (s) => s.taxResidence === 'NL' && s.situationGroup === 'OTHER_UWV',
  },
  {
    id: 'uwvDiscussedPlan',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      (s.situationGroup === 'WW' || s.situationGroup === 'OTHER_UWV'),
  },
  {
    id: 'wwStartPeriod',
    visible: (s) => s.taxResidence === 'NL' && s.situationGroup === 'WW',
  },
  {
    id: 'wwRetainBenefit',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      s.situationGroup === 'WW' &&
      s.wantsStartPeriod === false,
  },
  {
    id: 'wwFormerEmployer',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      s.situationGroup === 'WW' &&
      s.wantsStartPeriod === true,
  },
  {
    id: 'wwUwvSupplement',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      s.situationGroup === 'WW' &&
      s.wantsStartPeriod === true,
  },
  {
    id: 'uwvResearchPeriod',
    visible: (s) => s.taxResidence === 'NL' && s.situationGroup === 'OTHER_UWV',
  },
  {
    id: 'uwvPermission',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      ((s.situationGroup === 'WW' && s.wantsStartPeriod === true) ||
        (s.situationGroup === 'OTHER_UWV' && s.wantsResearchPeriod === true)),
  },
  {
    id: 'zwOrigin',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      s.situationGroup === 'OTHER_UWV' &&
      s.uwvBenefit === 'ZW',
  },
  {
    id: 'bijstandMunicipality',
    visible: (s) => s.taxResidence === 'NL' && s.situationGroup === 'BIJSTAND',
  },
  {
    id: 'bijstandPreparation',
    visible: (s) => s.taxResidence === 'NL' && s.situationGroup === 'BIJSTAND',
  },
  {
    id: 'aow',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      !isBenefitSituation(s) &&
      s.growthStart !== 'TRYING_OUT',
  },
  {
    id: 'aowBirthCohort',
    visible: (s) => s.taxResidence === 'NL' && s.ageTaxRegime === 'FULL_YEAR_AOW_2026',
  },
  {
    id: 'aowMonth',
    visible: (s) => s.taxResidence === 'NL' && s.ageTaxRegime === 'REACHES_AOW_IN_2026',
  },
  {
    id: 'singleOlderAow',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      (s.ageTaxRegime === 'FULL_YEAR_AOW_2026' ||
        s.ageTaxRegime === 'REACHES_AOW_IN_2026'),
  },
  {
    id: 'allowances',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      !isBenefitSituation(s) &&
      s.growthStart !== 'TRYING_OUT',
  },
  {
    id: 'partner',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && needsPartnerContext(s.allowances),
  },
  {
    id: 'partnerInsurance',
    visible: (s) =>
      allowanceFollowUpsVisible(s) &&
      s.hasPartner === true &&
      hasAllowance(s.allowances, 'HEALTHCARE'),
  },
  {
    id: 'partnerIncome',
    visible: (s) =>
      allowanceFollowUpsVisible(s) &&
      s.hasPartner === true &&
      (hasAllowance(s.allowances, 'HEALTHCARE') ||
        hasAllowance(s.allowances, 'CHILD_BUDGET') ||
        hasAllowance(s.allowances, 'CHILDCARE') ||
        hasAllowance(s.allowances, 'RENT')),
  },
  {
    id: 'housingRent',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && needsRentFields(s.allowances),
  },
  {
    id: 'housingHousehold',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && needsRentFields(s.allowances),
  },
  {
    id: 'housingAssets',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && needsRentFields(s.allowances),
  },
  {
    id: 'children',
    visible: (s) =>
      allowanceFollowUpsVisible(s) &&
      (needsChildBudgetFields(s.allowances) || needsChildcareFields(s.allowances)),
  },
  {
    id: 'youngChild',
    visible: (s) =>
      allowanceFollowUpsVisible(s) &&
      parseWizardChildAges(s.childrenAges).length === 0 &&
      (needsChildBudgetFields(s.allowances) || needsChildcareFields(s.allowances)),
  },
  {
    id: 'iackHousehold',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && wizardIackQuestionsNeeded(s),
  },
  {
    id: 'iackCoParent',
    visible: (s) =>
      allowanceFollowUpsVisible(s) &&
      wizardIackQuestionsNeeded(s) &&
      s.iackHouseholdDuration !== 'AT_LEAST_6_MONTHS',
  },
  {
    id: 'fiscalPartner',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && wizardIackQuestionsNeeded(s),
  },
  {
    id: 'iackPartnerIncome',
    visible: (s) =>
      allowanceFollowUpsVisible(s) &&
      wizardIackQuestionsNeeded(s) &&
      s.fiscalPartnerDuration === 'MORE_THAN_6_MONTHS',
  },
  {
    id: 'iackRelativeAge',
    visible: (s) =>
      allowanceFollowUpsVisible(s) &&
      wizardIackQuestionsNeeded(s) &&
      s.fiscalPartnerDuration === 'MORE_THAN_6_MONTHS',
  },
  {
    id: 'childBudgetAssets',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && needsChildBudgetFields(s.allowances),
  },
  {
    id: 'childcare',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && needsChildcareFields(s.allowances),
  },
  {
    id: 'workStudy',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && needsChildcareFields(s.allowances),
  },
  {
    id: 'midYear',
    visible: (s) =>
      allowanceFollowUpsVisible(s) &&
      (needsRentFields(s.allowances) ||
        needsChildBudgetFields(s.allowances) ||
        needsChildcareFields(s.allowances)),
  },
  {
    id: 'frequency',
    visible: (s) => s.taxResidence === 'NL' && s.growthStart == null,
  },
  {
    id: 'customers',
    visible: (s) => s.taxResidence === 'NL',
  },
  {
    id: 'independentlyDeterminesWork',
    visible: (s) => s.taxResidence === 'NL' && needsSeriousAdminQuestions(s),
  },
  {
    id: 'customerAcquisition',
    visible: (s) => s.taxResidence === 'NL' && needsSeriousAdminQuestions(s),
  },
  {
    id: 'intent',
    visible: (s) => s.taxResidence === 'NL' && s.growthStart == null,
  },
  {
    id: 'amounts',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      !isBenefitSituation(s) &&
      s.growthStart !== 'TRYING_OUT',
  },
  {
    id: 'otherVatTurnover',
    visible: (s) => s.taxResidence === 'NL' && needsSeriousAdminQuestions(s),
  },
  {
    id: 'existingRegistrations',
    visible: (s) => s.taxResidence === 'NL' && needsSeriousAdminQuestions(s),
  },
  {
    id: 'costAssumption',
    visible: (s) => s.taxResidence === 'NL' && wantsFinancialDetailQuestions(s),
  },
  {
    id: 'rowAssumption',
    visible: (s) => s.taxResidence === 'NL' && wantsFinancialDetailQuestions(s),
  },
  {
    id: 'incomeBases',
    visible: (s) => s.taxResidence === 'NL' && wantsFinancialDetailQuestions(s),
  },
  {
    id: 'assets',
    visible: (s) =>
      allowanceFollowUpsVisible(s) && hasAllowance(s.allowances, 'HEALTHCARE'),
  },
  {
    id: 'scenario',
    visible: (s) =>
      s.taxResidence === 'NL' &&
      !isBenefitSituation(s) &&
      s.growthStart !== 'TRYING_OUT',
  },
  {
    id: 'result',
    visible: (s) => s.taxResidence === 'NL' || s.taxResidence === 'OTHER',
  },
];

export function visibleSteps(state: WizardState): WizardStepId[] {
  return WIZARD_SCHEMA.filter((step) => step.visible(state)).map((step) => step.id);
}

export function questionSteps(state: WizardState): WizardStepId[] {
  return visibleSteps(state).filter((id) => id !== 'jurisdiction' && id !== 'result');
}

export function shouldAskRentFields(state: WizardState): boolean {
  return needsRentFields(state.allowances);
}

export function shouldAskChildcareFields(state: WizardState): boolean {
  return needsChildcareFields(state.allowances);
}

export function nextStep(
  state: WizardState,
  current: WizardStepId,
): WizardStepId | null {
  const steps = visibleSteps(state);
  const i = steps.indexOf(current);
  if (i < 0 || i >= steps.length - 1) return null;
  return steps[i + 1] ?? null;
}

export function previousStep(
  state: WizardState,
  current: WizardStepId,
): WizardStepId | null {
  const steps = visibleSteps(state);
  const i = steps.indexOf(current);
  if (i <= 0) return null;
  return steps[i - 1] ?? null;
}
