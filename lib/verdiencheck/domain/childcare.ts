import type { Cents } from './money';

export const CHILDCARE_CARE_TYPES = [
  'DAYCARE_CENTER',
  'AFTER_SCHOOL_CENTER',
  'CHILDMINDER',
] as const;

export type ChildcareCareType = (typeof CHILDCARE_CARE_TYPES)[number];

export type ChildcareProviderEligibility =
  | 'REGISTERED_ELIGIBLE'
  | 'NOT_ELIGIBLE'
  | 'UNKNOWN';

export type ParentWorkStudyStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN';

export type ChildcareEntry = {
  localKey: string;
  childKey: string;
  childAgeYears: number | null;
  careType: ChildcareCareType;
  hoursPerMonth: number | null;
  actualHourlyRateCents: Cents | null;
  providerEligibilityStatus: ChildcareProviderEligibility;
};

export type ChildcareHousehold = {
  entries: readonly ChildcareEntry[];
  hasToeslagPartner: boolean | 'UNKNOWN' | null;
  parentWorkStudyStatus: ParentWorkStudyStatus | null;
  workedMonthsInYear: number | null;
  midYearHouseholdChange?: boolean;
};
