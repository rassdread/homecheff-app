import type { ActivityContext } from '../domain/activity';
import type { AllowanceSelection } from '../domain/allowances';
import type { TaxJurisdiction } from '../domain/jurisdiction';
import type { PersonSituation } from '../domain/person';
import { benefitRouteFamily, type BenefitRouteFamily } from '../domain/person';
import type { KvkContext } from '../domain/kvk';
import type { VatEntrepreneurshipContext, VatTurnoverInput } from '../domain/vat';
import type { KorContext } from '../domain/kor';
import type { Dac7ReportingContext } from '../domain/dac7';
import type { TriState } from '../domain/tri-state';
import type { BenefitGuidanceFacts } from '../domain/benefits';
import type { FoodActivityContext } from '../domain/food-activity';
import type { GuidanceTiming } from './principles';

export const GUIDANCE_SEVERITIES = [
  'INFO',
  'CHECK',
  'ACTION',
  'REQUIRED_BY_PLATFORM',
] as const;

export type GuidanceSeverity = (typeof GUIDANCE_SEVERITIES)[number];

export const RECHECK_TRIGGERS = [
  'NEW_SALE',
  'YEAR_CHANGE',
  'CONTEXT_CHANGE',
  'MANUAL',
  'FIRST_SALE',
  'TRANSACTION_COUNT_CHANGED',
  'TURNOVER_CHANGED',
  'SELLING_FREQUENCY_CHANGED',
  'CUSTOMER_SCOPE_CHANGED',
  'COMMERCIAL_INTENT_CHANGED',
  'KOR_STATUS_CHANGED',
  'KVK_STATUS_CHANGED',
  'VAT_STATUS_CHANGED',
  'CALENDAR_YEAR_CHANGED',
  'BENEFIT_STATUS_CHANGED',
  'UWV_ROUTE_SELECTED',
  'UWV_PERMISSION_CHANGED',
  'START_PERIOD_STARTED',
  'START_PERIOD_ENDING',
  'INCOME_ESTIMATE_CHANGED',
  'SELF_EMPLOYMENT_HOURS_CHANGED',
  'MUNICIPALITY_CHANGED',
  'MUNICIPAL_APPROVAL_CHANGED',
  'BUSINESS_STARTED',
  'BENEFIT_ENDED',
  'FOOD_SELLING_FREQUENCY_CHANGED',
  'FOOD_PACKAGING_CHANGED',
  'FOOD_ACTIVITY_CHANGED',
  'FOOD_PRODUCT_CHANGED',
  'NVWA_REGISTRATION_CHANGED',
  'FOOD_SAFETY_PLAN_CHANGED',
  'ALLERGENS_CHANGED',
  'ANIMAL_ORIGIN_ACTIVITY_CHANGED',
  'SALES_CHANNEL_CHANGED',
] as const;

export type RecheckTrigger = (typeof RECHECK_TRIGGERS)[number];

export type GuidanceCta = {
  label: string;
  href?: string | null;
  kind: 'official' | 'self' | 'later' | 'platform';
};

/**
 * Existing HomeCheff obligations only — VerdienCheck does not add blockers.
 * blocking stays false unless `platformObligation.enforced === true`.
 */
export const EXISTING_PLATFORM_OBLIGATIONS = [
  'COMMERCE_DECLARATION',
  'FOOD_ALLERGEN_CHECKOUT',
  'DELIVERY_AGE_18',
] as const;

export type ExistingPlatformObligationId =
  (typeof EXISTING_PLATFORM_OBLIGATIONS)[number];

export type GuidanceRule = {
  id: string;
  jurisdiction: TaxJurisdiction;
  year: number;
  conditions: {
    personSituation?: PersonSituation;
    benefitRoute?: BenefitRouteFamily;
    activity?: Partial<ActivityContext>;
  };
  severity: GuidanceSeverity;
  blocking: boolean;
  shortTitle: string;
  shortText: string;
  expandedExplanation: string;
  cta: GuidanceCta;
  officialSource: string | null;
  officialSourceUrl: string | null;
  verifiedAt: string | null;
  dismissible: boolean;
  recheckTrigger: RecheckTrigger;
  developmentFixture?: boolean;
  platformObligation?: {
    id: ExistingPlatformObligationId;
    enforced: boolean;
  };
};

export type BusinessGuidanceFacts = {
  calendarYear: number;
  kvk?: KvkContext | null;
  vatEntrepreneurship?: VatEntrepreneurshipContext | null;
  alreadyVatRegistered?: TriState;
  vatTurnover?: VatTurnoverInput | null;
  kor?: KorContext | null;
  dac7?: Dac7ReportingContext | null;
};

export type GuidanceContext = {
  jurisdiction: TaxJurisdiction;
  year: number;
  personSituation: PersonSituation;
  allowances: AllowanceSelection;
  activity: ActivityContext;
  business?: BusinessGuidanceFacts | null;
  benefits?: BenefitGuidanceFacts | null;
  food?: FoodActivityContext | null;
};

export type GuidanceHit = {
  rule: GuidanceRule;
  routeFamily: BenefitRouteFamily | null;
  timing?: GuidanceTiming;
};

export function defaultBlocking(rule: Partial<Pick<GuidanceRule, 'blocking' | 'platformObligation'>>): boolean {
  if (rule.platformObligation?.enforced === true) return true;
  return rule.blocking ?? false;
}
