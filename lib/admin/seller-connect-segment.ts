/**
 * Read-only seller Connect classes for the admin composer.
 * A stored account id is not payout readiness.
 * UNKNOWN is never the same as "no Connect".
 */

export type SellerConnectClass =
  | 'NOT_STARTED'
  | 'STARTED_INCOMPLETE'
  | 'LINKED_PAYOUT_UNKNOWN'
  | 'REQUIREMENTS_DUE'
  | 'PAYOUT_READY'
  | 'RESTRICTED'
  | 'UNKNOWN';

export function classifySellerConnect(input: {
  stripeConnectAccountId: string | null | undefined;
  onboardingCompleted: boolean | null | undefined;
  payoutsEnabled: boolean | null;
  restricted?: boolean | null;
  requirementsDue?: boolean | null;
}): SellerConnectClass {
  if (input.payoutsEnabled === null && input.onboardingCompleted == null && input.stripeConnectAccountId === undefined) {
    return 'UNKNOWN';
  }
  const accountId = input.stripeConnectAccountId?.trim() || null;
  if (!accountId) return 'NOT_STARTED';
  if (input.restricted === true) return 'RESTRICTED';
  if (input.onboardingCompleted !== true) return 'STARTED_INCOMPLETE';
  if (input.requirementsDue === true) return 'REQUIREMENTS_DUE';
  if (input.payoutsEnabled === true) return 'PAYOUT_READY';
  return 'LINKED_PAYOUT_UNKNOWN';
}

export function sellerMatchesConnectFilter(
  value: SellerConnectClass,
  filter: SellerConnectClass | 'ANY',
): boolean {
  if (filter === 'ANY') return true;
  return value === filter;
}
