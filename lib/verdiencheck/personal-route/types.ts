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
