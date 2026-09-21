export const ALLOWANCE_IDS = [
  'HEALTHCARE',
  'RENT',
  'CHILD_BUDGET',
  'CHILDCARE',
  'NONE',
  'UNKNOWN',
] as const;

export type AllowanceId = (typeof ALLOWANCE_IDS)[number];

export type AllowanceSelection = readonly AllowanceId[];

export function hasAllowance(
  selection: AllowanceSelection,
  id: Exclude<AllowanceId, 'NONE' | 'UNKNOWN'>,
): boolean {
  if (selection.includes('NONE') || selection.includes('UNKNOWN')) return false;
  return selection.includes(id);
}

export function needsPartnerContext(selection: AllowanceSelection): boolean {
  return (
    hasAllowance(selection, 'HEALTHCARE') ||
    hasAllowance(selection, 'RENT') ||
    hasAllowance(selection, 'CHILD_BUDGET') ||
    hasAllowance(selection, 'CHILDCARE')
  );
}

export function needsRentFields(selection: AllowanceSelection): boolean {
  return hasAllowance(selection, 'RENT');
}

export function needsChildcareFields(selection: AllowanceSelection): boolean {
  return hasAllowance(selection, 'CHILDCARE');
}

export function needsChildBudgetFields(selection: AllowanceSelection): boolean {
  return hasAllowance(selection, 'CHILD_BUDGET');
}

export type AllowanceFactState = {
  allowances: AllowanceSelection;
  rentsHome: boolean | 'UNKNOWN' | null;
  housingTenure?: 'RENT' | 'OWNER_OCCUPIED' | 'OTHER' | 'UNKNOWN' | null;
  hasChildren: boolean | 'UNKNOWN' | null;
  usesChildcare: boolean | 'UNKNOWN' | null;
};

/**
 * Engine decides which 2026 allowances to attempt from household facts.
 * User multi-select is not the primary calculation switch.
 * NONE remains an explicit skip (benefits / trying-out).
 */
export function deriveAllowancesFromFacts(state: AllowanceFactState): AllowanceId[] {
  if (state.allowances.includes('NONE')) return ['NONE'];
  if (state.allowances.includes('UNKNOWN')) return ['UNKNOWN'];
  const ids: AllowanceId[] = ['HEALTHCARE'];
  const rents =
    state.housingTenure === 'RENT' ||
    (state.housingTenure == null && (state.rentsHome === true || hasAllowance(state.allowances, 'RENT')));
  if (rents) {
    ids.push('RENT');
  }
  if (state.hasChildren === true || hasAllowance(state.allowances, 'CHILD_BUDGET')) {
    ids.push('CHILD_BUDGET');
  }
  if (state.usesChildcare === true || hasAllowance(state.allowances, 'CHILDCARE')) {
    ids.push('CHILDCARE');
  }
  return ids;
}
