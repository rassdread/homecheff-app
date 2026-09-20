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
