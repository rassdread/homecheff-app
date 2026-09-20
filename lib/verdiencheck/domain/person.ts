/**
 * Benefit types stay separate. Never collapse UWV routes into OTHER_BENEFIT.
 */

export const PERSON_SITUATIONS = [
  'EMPLOYEE',
  'WW',
  'BIJSTAND',
  'WIA',
  'WAJONG',
  'ZW',
  'WAO',
  'WAZ',
  'PENSION_AOW',
  'NONE',
  'EXISTING_ENTREPRENEUR',
  'OTHER',
] as const;

export type PersonSituation = (typeof PERSON_SITUATIONS)[number];

/** Wizard group before UWV detail. OTHER_UWV is not a PersonSituation. */
export const SITUATION_GROUPS = [
  'EMPLOYEE',
  'WW',
  'BIJSTAND',
  'OTHER_UWV',
  'EXISTING_ENTREPRENEUR',
  'NONE',
  'OTHER',
] as const;

export type SituationGroup = (typeof SITUATION_GROUPS)[number];

export const UWV_BENEFITS = ['WIA', 'WAJONG', 'ZW', 'WAO', 'WAZ'] as const;
export type UwvBenefit = (typeof UWV_BENEFITS)[number];

export const BENEFIT_ROUTE_FAMILIES = [
  'WW',
  'BIJSTAND',
  'WIA',
  'WAJONG',
  'ZW',
  'WAO',
  'WAZ',
] as const;

export type BenefitRouteFamily = (typeof BENEFIT_ROUTE_FAMILIES)[number];

export function isBenefitRouteFamily(
  v: string,
): v is BenefitRouteFamily {
  return (BENEFIT_ROUTE_FAMILIES as readonly string[]).includes(v);
}

export function benefitRouteFamily(
  situation: PersonSituation,
): BenefitRouteFamily | null {
  if (isBenefitRouteFamily(situation)) return situation;
  return null;
}

export function derivePersonSituation(input: {
  group: SituationGroup | null;
  uwvBenefit: UwvBenefit | null;
}): PersonSituation | null {
  if (!input.group) return null;
  if (input.group === 'OTHER_UWV') {
    return input.uwvBenefit;
  }
  return input.group;
}

/** Forbidden alias — must not exist in this domain. */
export const FORBIDDEN_OTHER_BENEFIT_ALIAS = 'OTHER_BENEFIT';
