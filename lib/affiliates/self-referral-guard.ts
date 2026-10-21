/**
 * Accrual-time identity check.
 * Signup already refuses to create a self-attribution. This stops a stored
 * self-attribution, or a missing owner, from becoming commission.
 * A blocked parent override is not paid to the partner. That share stays
 * with HomeCheff. Valid partner and direct amounts are unchanged.
 */

export function beneficiaryUserIdBlocked(
  beneficiaryUserId: string | null | undefined,
  partyUserIds: ReadonlyArray<string | null | undefined>,
): boolean {
  const beneficiary = beneficiaryUserId?.trim() ?? '';
  if (!beneficiary) return true;
  return partyUserIds.some((party) => (party?.trim() ?? '') === beneficiary);
}

export function parentOverrideAllowed(input: {
  affiliateId: string;
  affiliateUserId: string;
  parentAffiliateId: string | null | undefined;
  parentUserId: string | null | undefined;
  partyUserIds: ReadonlyArray<string | null | undefined>;
}): boolean {
  const parentAffiliateId = input.parentAffiliateId?.trim() ?? '';
  const parentUserId = input.parentUserId?.trim() ?? '';
  const affiliateUserId = input.affiliateUserId.trim();
  if (!parentAffiliateId || !parentUserId || !affiliateUserId) return false;
  if (parentAffiliateId === input.affiliateId) return false;
  if (parentUserId === affiliateUserId) return false;
  if (beneficiaryUserIdBlocked(parentUserId, input.partyUserIds)) return false;
  return true;
}
