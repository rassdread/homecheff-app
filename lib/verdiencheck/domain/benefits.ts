/**
 * Benefit guidance domain. Routes stay separate. No generic reduction formula.
 * Uitkering ≠ toeslag. commercialResult ≠ UWV-winstbegrip.
 */

import type { BenefitRouteFamily, UwvBenefit } from './person';
import type { TriState } from './tri-state';
import { UNKNOWN, type UnknownValue } from './unknown';

export const WW_START_ROUTES = [
  'WW_START_PERIOD',
  'WW_START_WITHOUT_START_PERIOD',
  'WW_START_WITHOUT_RETAINING_WW',
] as const;

export type WwStartRoute = (typeof WW_START_ROUTES)[number];

export type WwStartPeriodContext = {
  uwvPermission: TriState;
  startDate: string | null;
  receivesUwvSupplement: TriState;
  formerEmployerWorkPlanned: TriState;
};

export type WwContext = {
  discussedWithUwv: TriState;
  wantsStartPeriod: TriState;
  wantsToRetainWw: TriState;
  completedWwTraining: TriState;
  startPeriod: WwStartPeriodContext | null;
};

export type MunicipalPreparationPeriodStatus = 'AVAILABLE' | 'NOT_AVAILABLE' | 'UNKNOWN';

export type MunicipalityLocalPolicyStatus =
  | 'KNOWN'
  | 'UNKNOWN'
  | 'CHECK_WITH_MUNICIPALITY';

export type MunicipalityGuidanceContext = {
  municipalityKnown: boolean;
  municipalityName: string | null;
  localPolicyStatus: MunicipalityLocalPolicyStatus;
};

export type BijstandContext = {
  municipality: MunicipalityGuidanceContext;
  preparationPeriod: MunicipalPreparationPeriodStatus;
  wantsBbz: TriState;
};

export type ZwOrigin = 'FROM_OR_AFTER_WW' | 'OTHER' | 'UNKNOWN';

export type UwvDisabilityScheme = UwvBenefit;

export type UwvDisabilityContext = {
  scheme: UwvDisabilityScheme;
  discussedWithLabourExpert: TriState;
  wantsResearchPeriod: TriState;
  wantsStarterCredit: TriState;
  uwvPermissionForProgram: TriState;
  zwOrigin: ZwOrigin | null;
};

export type BenefitGuidanceFacts = {
  ww?: WwContext | null;
  bijstand?: BijstandContext | null;
  uwvDisability?: UwvDisabilityContext | null;
};

export const PRE_START_UWV_REVIEW_RECOMMENDED = 'PRE_START_UWV_REVIEW_RECOMMENDED';
export const WAIT_FOR_UWV_PERMISSION_FOR_PROGRAM_ACTIVITIES =
  'WAIT_FOR_UWV_PERMISSION_FOR_PROGRAM_ACTIVITIES';
export const MUNICIPAL_BBZ_REVIEW_REQUIRED = 'MUNICIPAL_BBZ_REVIEW_REQUIRED';
export const WW_NOT_RETAINING_BENEFIT_REVIEW = 'WW_NOT_RETAINING_BENEFIT_REVIEW';
export const BUSINESS_PLAN_HELP_AVAILABLE_FUTURE = true;

/** Order hours are not the full WW self-employment hours picture. */
export const selfEmploymentHoursMayIncludeNonOrderActivities = true;

/**
 * Never invent a euro delta. This phase explains reporting, not amounts.
 */
export function benefitAmountDeltaCents(): UnknownValue {
  return UNKNOWN;
}

/**
 * UWV profit = belastbare winst + mkb-winstvrijstelling + ondernemersaftrek.
 * Not commercialResult. No certified adapter in this phase.
 */
export function uwvBenefitProfitBasisCents(): UnknownValue {
  return UNKNOWN;
}

export function emptyWwStartPeriod(): WwStartPeriodContext {
  return {
    uwvPermission: 'UNKNOWN',
    startDate: null,
    receivesUwvSupplement: 'UNKNOWN',
    formerEmployerWorkPlanned: 'UNKNOWN',
  };
}

export function emptyWwContext(): WwContext {
  return {
    discussedWithUwv: 'UNKNOWN',
    wantsStartPeriod: 'UNKNOWN',
    wantsToRetainWw: 'UNKNOWN',
    completedWwTraining: 'UNKNOWN',
    startPeriod: emptyWwStartPeriod(),
  };
}

export function emptyBijstandContext(): BijstandContext {
  return {
    municipality: {
      municipalityKnown: false,
      municipalityName: null,
      localPolicyStatus: 'UNKNOWN',
    },
    preparationPeriod: 'UNKNOWN',
    wantsBbz: 'UNKNOWN',
  };
}

export function emptyUwvDisabilityContext(
  scheme: UwvDisabilityScheme,
): UwvDisabilityContext {
  return {
    scheme,
    discussedWithLabourExpert: 'UNKNOWN',
    wantsResearchPeriod: 'UNKNOWN',
    wantsStarterCredit: 'UNKNOWN',
    uwvPermissionForProgram: 'UNKNOWN',
    zwOrigin: scheme === 'ZW' ? 'UNKNOWN' : null,
  };
}

/**
 * Never auto-choose a WW route. Three official routes only.
 */
export function resolveWwStartRoute(ctx: WwContext): WwStartRoute | 'UNKNOWN' {
  if (ctx.wantsToRetainWw === 'NO') return 'WW_START_WITHOUT_RETAINING_WW';
  if (ctx.wantsStartPeriod === 'YES') return 'WW_START_PERIOD';
  if (ctx.wantsStartPeriod === 'NO') return 'WW_START_WITHOUT_START_PERIOD';
  return 'UNKNOWN';
}

export function wantsUwvProgramActivities(input: {
  routeFamily: BenefitRouteFamily | null;
  ww?: WwContext | null;
  disability?: UwvDisabilityContext | null;
}): TriState {
  if (input.routeFamily === 'WW') {
    if (input.ww?.wantsStartPeriod === 'YES') return 'YES';
    if (input.ww?.wantsStartPeriod === 'NO') return 'NO';
    return 'UNKNOWN';
  }
  const d = input.disability;
  if (!d) return 'UNKNOWN';
  if (d.wantsResearchPeriod === 'YES' || d.wantsStarterCredit === 'YES') return 'YES';
  if (d.wantsResearchPeriod === 'NO' && d.wantsStarterCredit === 'NO') return 'NO';
  return 'UNKNOWN';
}

export function needsWaitForUwvPermission(input: {
  routeFamily: BenefitRouteFamily | null;
  ww?: WwContext | null;
  disability?: UwvDisabilityContext | null;
}): boolean {
  const program = wantsUwvProgramActivities(input);
  if (program !== 'YES') return false;
  if (input.routeFamily === 'WW') {
    return (input.ww?.startPeriod?.uwvPermission ?? 'UNKNOWN') !== 'YES';
  }
  return (input.disability?.uwvPermissionForProgram ?? 'UNKNOWN') !== 'YES';
}
