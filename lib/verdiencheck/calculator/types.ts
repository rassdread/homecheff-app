import type { ActivityContext } from '../domain/activity';
import type { AllowanceSelection } from '../domain/allowances';
import type { ChildBudgetHousehold } from '../domain/children';
import type { ChildcareHousehold } from '../domain/childcare';
import type { CostInput } from '../domain/costs';
import type { CalculationPeriod, HousingHousehold } from '../domain/household';
import type {
  AowBirthCohort2026,
  AowMonth2026,
  SingleOlderPersonsCreditEligibility,
} from '../domain/aow';
import type { IackContext } from '../domain/iack';
import type { AgeTaxRegime2026, UnsupportedTaxCreditId } from '../domain/income-bases';
import type { IncomeSource } from '../domain/income-source';
import type { TaxJurisdiction } from '../domain/jurisdiction';
import type { PersonSituation } from '../domain/person';
import type { Cents } from '../domain/money';
import type { CentsOrUnknown, UnknownValue } from '../domain/unknown';
import type { AdditionalIncomeClassification } from '../nl2026/row';
import type { RulePack } from '../rulesets/types';

export type PartnerHealthcareInsuranceStatus =
  | 'INSURED'
  | 'NOT_INSURED'
  | 'UNKNOWN';

export type AssetsEligibility = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN';

export type PartnerContext = {
  hasPartner: boolean | 'UNKNOWN';
  partnerAnnualIncomeCents?: Cents | null;
  partnerAssessmentIncomeCents?: Cents | null;
  partnerHealthcareInsuranceStatus?: PartnerHealthcareInsuranceStatus | null;
};

export type PersonContext = {
  situation: PersonSituation;
};

export type CalculationCompleteness =
  | 'COMPLETE_FOR_CORE'
  | 'PARTIAL_PERSONAL_TAX_CREDITS'
  | 'PARTIAL_UNIMPLEMENTED_ALLOWANCES'
  | 'PARTIAL';

export type CalculatorInput = {
  jurisdiction: TaxJurisdiction;
  calendarYear: number;
  personContext: PersonContext;
  /** Legacy — must never stand in for box1/aggregate/arbeidsinkomen/assessment/Zvw. */
  currentAnnualIncomeCents: Cents | null;
  ageTaxRegime?: AgeTaxRegime2026 | null;
  aowBirthCohort?: AowBirthCohort2026 | null;
  aowMonth?: AowMonth2026 | null;
  iackContext?: IackContext | null;
  singleOlderPersonsCreditEligibility?: SingleOlderPersonsCreditEligibility | null;
  additionalIncomeClassification?: AdditionalIncomeClassification | null;
  assumeEstimatedCostsTaxDeductible?: boolean | null;
  baselineGrossEmploymentIncomeCents?: Cents | null;
  baselineBox1TaxableIncomeCents?: Cents | null;
  baselineAggregateIncomeCents?: Cents | null;
  baselineArbeidsinkomenCents?: Cents | null;
  baselineAssessmentIncomeCents?: Cents | null;
  baselineZvwContributionIncomeAlreadyUsedCents?: Cents | null;
  /** Healthcare vermogen. Do not reuse for huurtoeslag or KGB. */
  assetsEligibility?: AssetsEligibility | null;
  healthcareAssetsEligibility?: AssetsEligibility | null;
  housingAssetsEligibility?: AssetsEligibility | null;
  childBudgetAssetsEligibility?: AssetsEligibility | null;
  partnerContext?: PartnerContext | null;
  calculationPeriod?: CalculationPeriod | null;
  midYearHouseholdChange?: boolean | null;
  housingHousehold?: HousingHousehold | null;
  bareRentCentsPerMonth?: Cents | null;
  onlyTotalRentKnown?: boolean | null;
  childBudgetHousehold?: ChildBudgetHousehold | null;
  childcareHousehold?: ChildcareHousehold | null;
  /** Omitted in older tests: treated as insured. UNKNOWN never maps to €0. */
  userHealthcareInsuranceStatus?: PartnerHealthcareInsuranceStatus | null;
  housingTenure?: 'RENTS' | 'DOES_NOT_RENT' | 'UNKNOWN' | null;
  /** Known deductible own-home interest (0 = none). Omit/null = unknown or not an owner. */
  ownerHomeDeductibleInterestCents?: Cents | null;
  hasChildren?: boolean | 'UNKNOWN' | null;
  usesChildcare?: boolean | 'UNKNOWN' | null;
  allowances: AllowanceSelection;
  activity: ActivityContext;
  incomeSource: IncomeSource;
  estimatedTurnoverCents: Cents;
  estimatedCosts: CostInput;
  commercialResultCents: Cents;
  scenarioAdditionalResultCents: Cents;
};

export type SituationSnapshot = {
  commercialResultCents: Cents;
  incomeTax: CentsOrUnknown;
  zvwContribution: CentsOrUnknown;
  generalTaxCredit: CentsOrUnknown;
  employmentTaxCredit: CentsOrUnknown;
  iack: CentsOrUnknown;
  olderPersonsTaxCredit: CentsOrUnknown;
  singleOlderPersonsTaxCredit: CentsOrUnknown;
  healthcareAllowance: CentsOrUnknown;
  rentAllowance: CentsOrUnknown;
  childBudget: CentsOrUnknown;
  childcareAllowance: CentsOrUnknown;
};

export type CalculatorDeltas = {
  incomeTax: CentsOrUnknown;
  zvw: CentsOrUnknown;
  healthcareAllowance: CentsOrUnknown;
  rentAllowance: CentsOrUnknown;
  childBudget: CentsOrUnknown;
  childcareAllowance: CentsOrUnknown;
};

export type CalculatorReadyResult = {
  status: 'READY';
  baseline: SituationSnapshot;
  scenario: SituationSnapshot;
  deltas: CalculatorDeltas;
  commercialAdditionalResultCents: Cents;
  taxableAdditionalIncomeCents: CentsOrUnknown;
  netExtraCents: CentsOrUnknown;
  netExtraPerMonthCents: CentsOrUnknown;
  netExtraIsDefinitive: boolean;
  completeness: CalculationCompleteness;
  unsupportedTaxCredits: UnsupportedTaxCreditId[];
  assumptions: string[];
  missingInputs: string[];
  packMetadata: Pick<RulePack, 'id' | 'jurisdiction' | 'year' | 'version' | 'status' | 'verifiedAt'>;
};

export type CalculatorBlockedResult = {
  status:
    | 'PACK_NOT_CERTIFIED'
    | 'JURISDICTION_NOT_SUPPORTED'
    | 'ASK_JURISDICTION'
    | 'INCOME_SOURCE_DISABLED'
    | 'TAX_REGIME_NOT_YET_SUPPORTED'
    | 'SOURCE_OF_INCOME_REVIEW_REQUIRED';
  commercialAdditionalResultCents: Cents;
  taxableAdditionalIncomeCents: UnknownValue;
  netExtraCents: UnknownValue;
  netExtraPerMonthCents: UnknownValue;
  netExtraIsDefinitive: false;
  missingInputs: string[];
  assumptions: string[];
  packMetadata: CalculatorReadyResult['packMetadata'] | null;
};

export type CalculatorResult = CalculatorReadyResult | CalculatorBlockedResult;
