/**
 * Per-child model for kindgebonden budget. No flat children × amount.
 */

import type { AssetsEligibility } from '../calculator/types';

export type ChildEligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'UNKNOWN';

export type Child = {
  localKey: string;
  ageYears: number | null;
  eligibilityStatus: ChildEligibilityStatus;
  receivesKinderbijslag?: boolean | null;
};

export type ChildBudgetHousehold = {
  children: readonly Child[];
  hasToeslagPartner: boolean | 'UNKNOWN' | null;
  childBudgetAssetsEligibility: AssetsEligibility | null;
  midYearHouseholdChange?: boolean;
};
