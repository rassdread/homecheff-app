/**
 * Presentation orchestration only. No legal thresholds, no second rule engine.
 */

import type { GuidanceCta, GuidanceSeverity } from '../guidance/types';
import type { GuidanceTiming } from '../guidance/principles';
import type {
  AssessmentLayer,
  HomecheffGrowthIntent,
  ObservedActivity,
} from '../domain/growth-intent';
import type { CentsOrUnknown } from '../domain/unknown';
import type { Cents } from '../domain/money';
import type { OwnerOccupiedHomeResult } from '../rulesets/nl/2026/owner-occupied-home';
import type { HousingTenure } from '../domain/housing';

export const ACTION_SEMANTICS = [
  'PRE_START_REQUIRED',
  'CURRENT_ACTION',
  'RECOMMENDED_CHECK',
  'TRACKING',
  'FUTURE_ACTION',
] as const;
export type ActionSemantics = (typeof ACTION_SEMANTICS)[number];

export const MAX_PRIMARY_NOW_CARDS = 3;

export const PROCEED_SEMANTICS = [
  'READY_TO_PROCEED',
  'PROCEED_AFTER_ACTION',
  'CHECK_FIRST',
  'INSUFFICIENT_CONTEXT',
] as const;
export type ProceedSemantics = (typeof PROCEED_SEMANTICS)[number];

export const CARD_FAMILIES = [
  'benefit_prestart',
  'food_safety',
  'food_allergen',
  'food_registration',
  'business_registration',
  'reporting',
  'optimization',
  'tracking',
  'start',
  'other',
] as const;
export type CardFamily = (typeof CARD_FAMILIES)[number];

export type PersonalRouteCard = {
  id: string;
  family: CardFamily;
  timing: GuidanceTiming;
  severity: GuidanceSeverity;
  title: string;
  body: string;
  sourceRuleIds: readonly string[];
  cta: GuidanceCta | null;
  officialSource: string | null;
  officialSourceUrl: string | null;
  primary: boolean;
};

export type SimulatorAllowanceId = 'HEALTHCARE' | 'RENT' | 'CHILD_BUDGET' | 'CHILDCARE';

export type SimulatorAllowanceLine = {
  id: SimulatorAllowanceId;
  included: boolean;
  currentCents: CentsOrUnknown | null;
  scenarioCents: CentsOrUnknown | null;
  deltaCents: CentsOrUnknown | null;
  rightLost: boolean;
  unchanged: boolean;
  unknown: boolean;
  notApplicable: boolean;
  excludedReason: string | null;
};

export type BaselinePresentationFacts = {
  incomeAnnualCents: number | null;
  incomeMonthlyCents: number | null;
  contractualGrossCents: number | null;
  holidayPayCents: number | null;
  holidayPayIncluded: boolean | null;
  employmentExtrasCents?: number | null;
  employmentExtrasStatus?: 'NONE' | 'PROVIDED' | 'UNKNOWN' | 'NOT_SUPPLIED' | null;
  thirteenthMonthCents?: number | null;
  bonusCommissionCents?: number | null;
  overtimeOtherPayCents?: number | null;
  companyCarTaxableAnnualCents?: number | null;
  companyCarTaxableMonthlyCents?: number | null;
  companyCarStatus?: 'NONE' | 'PROVIDED' | 'UNKNOWN' | 'NOT_SUPPLIED' | null;
  companyCarResolution?:
    | 'NO_CAR'
    | 'NO_ADDITION'
    | 'CALCULATED'
    | 'PARTIAL'
    | 'UNKNOWN'
    | 'NOT_SUPPLIED'
    | null;
  companyCarGrossAdditionCents?: number | null;
  companyCarOwnContributionCents?: number | null;
  companyCarOwnContributionUnknown?: boolean;
  payrollCompanyCarAdditionCents?: number | null;
  payrollCompanyCarOwnContributionCents?: number | null;
  fiscalWageCents: number | null;
  assessmentIncomeCents: number | null;
  enteredNetMonthlyCents: number | null;
  enteredGrossMonthlyCents?: number | null;
  estimatedGrossMonthlyCents?: number | null;
  statutoryNetMonthlyCents?: number | null;
  bankNetMonthlyCents?: number | null;
  withheldPayrollTaxCents?: number | null;
  employeePensionCents?: number | null;
  pensionStatus?: 'NONE' | 'AMOUNT' | 'UNKNOWN' | 'NOT_SUPPLIED' | null;
  pensionExplicitZero?: boolean;
  otherBankDeductionCents?: number | null;
  payrollUsed?: boolean;
  payrollTaxCredit?: 'YES' | 'NO' | 'UNKNOWN' | null;
  payrollTaxCreditAssumed?: boolean;
  incomeUnknown: boolean;
  incomeUnknownReason: string | null;
  incomeIsNetEstimate: boolean;
  housingTenure?: HousingTenure | 'RENTS' | 'DOES_NOT_RENT' | 'UNKNOWN' | null;
  ownerHome?: OwnerOccupiedHomeResult | null;
  hasChildren?: boolean | 'UNKNOWN' | null;
  usesChildcare?: boolean | 'UNKNOWN' | null;
  allowancesNone?: boolean;
  employeeLikeZvw?: boolean;
};

export type CurrentBaselineView = {
  incomeAnnualCents: number | null;
  incomeMonthlyCents: number | null;
  contractualGrossCents: number | null;
  holidayPayCents: number | null;
  holidayPayIncluded: boolean | null;
  employmentExtrasCents: number | null;
  employmentExtrasStatus: 'NONE' | 'PROVIDED' | 'UNKNOWN' | 'NOT_SUPPLIED' | null;
  thirteenthMonthCents: number | null;
  bonusCommissionCents: number | null;
  overtimeOtherPayCents: number | null;
  companyCarTaxableAnnualCents: number | null;
  companyCarTaxableMonthlyCents: number | null;
  companyCarStatus: 'NONE' | 'PROVIDED' | 'UNKNOWN' | 'NOT_SUPPLIED' | null;
  companyCarResolution:
    | 'NO_CAR'
    | 'NO_ADDITION'
    | 'CALCULATED'
    | 'PARTIAL'
    | 'UNKNOWN'
    | 'NOT_SUPPLIED'
    | null;
  companyCarGrossAdditionCents: number | null;
  companyCarOwnContributionCents: number | null;
  companyCarOwnContributionUnknown: boolean;
  payrollCompanyCarAdditionCents: number | null;
  payrollCompanyCarOwnContributionCents: number | null;
  fiscalWageCents: number | null;
  assessmentIncomeCents: number | null;
  enteredNetMonthlyCents: number | null;
  enteredGrossMonthlyCents: number | null;
  estimatedGrossMonthlyCents: number | null;
  statutoryNetMonthlyCents: number | null;
  bankNetMonthlyCents: number | null;
  withheldPayrollTaxCents: number | null;
  employeePensionCents: number | null;
  pensionStatus: 'NONE' | 'AMOUNT' | 'UNKNOWN' | 'NOT_SUPPLIED' | null;
  pensionExplicitZero: boolean;
  otherBankDeductionCents: number;
  payrollUsed: boolean;
  payrollTaxCredit: 'YES' | 'NO' | 'UNKNOWN' | null;
  payrollTaxCreditAssumed: boolean;
  ownerHome: OwnerOccupiedHomeResult | null;
  housingTenure: HousingTenure | 'RENTS' | 'DOES_NOT_RENT' | 'UNKNOWN' | null;
  incomeUnknown: boolean;
  incomeUnknownReason: string | null;
  incomeIsNetEstimate: boolean;
  showDistinctFiscal: boolean;
  showDistinctAssessment: boolean;
  incomeTaxAnnualCents: CentsOrUnknown | null;
  showZvwEmployerNote: boolean;
  allowances: SimulatorAllowanceLine[];
  totalAllowancesAnnualCents: CentsOrUnknown | null;
  totalAllowancesMonthlyCents: CentsOrUnknown | null;
  allowanceTotalExact: boolean;
};

export type MoneySimulatorView = {
  extraResultCents: Cents | null;
  taxDeltaCents: CentsOrUnknown | null;
  incomeTaxDeltaCents: CentsOrUnknown | null;
  zvwDeltaCents: CentsOrUnknown | null;
  currentIncomeTaxCents: CentsOrUnknown | null;
  scenarioIncomeTaxCents: CentsOrUnknown | null;
  currentZvwCents: CentsOrUnknown | null;
  scenarioZvwCents: CentsOrUnknown | null;
  allowances: SimulatorAllowanceLine[];
  netExtraCents: CentsOrUnknown | null;
  monthlyApproxCents: CentsOrUnknown | null;
  netFromEngine: true;
  includedNotes: string[];
  excludedNotes: string[];
  uncertaintyWhy: string | null;
  showZvwEmployerNote: boolean;
};

export type FinancialImpactPresentation = {
  status: 'EXACT' | 'PARTIAL' | 'UNKNOWN' | 'NOT_APPLICABLE';
  extraResultCents: Cents | null;
  taxDeltaCents: CentsOrUnknown | null;
  allowanceDeltaCents: CentsOrUnknown | null;
  netExtraCents: CentsOrUnknown | null;
  monthlyApproxCents: CentsOrUnknown | null;
  headline: string;
  explanation: string;
  turnoverVsResultNote: string;
  simulator: MoneySimulatorView;
  baseline: CurrentBaselineView | null;
};

export type PersonalVerdienRoute = {
  headline: string;
  summary: string;
  canStartMessage: string;
  proceedSemantics: ProceedSemantics;
  now: PersonalRouteCard[];
  soon: PersonalRouteCard[];
  later: PersonalRouteCard[];
  restDetails: PersonalRouteCard[];
  financialImpact: FinancialImpactPresentation;
  trackingMessage: string;
  officialActions: GuidanceCta[];
  unknowns: string[];
  contextCompleteness: 'COMPLETE' | 'PARTIAL' | 'INSUFFICIENT';
  declaredIntent: HomecheffGrowthIntent | null;
  observedActivity: ObservedActivity;
  assessmentOrder: 'INTENT → ACTIVITY → CONTEXT → APPLICABLE RULES → NEXT ACTION';
  laterCollapsedByDefault: true;
  soonCompactByDefault: true;
  layers: {
    declared: AssessmentLayer;
    observed: AssessmentLayer;
    legal: AssessmentLayer;
  };
};

export type PersonalRouteContradiction = {
  code: string;
  message: string;
};
