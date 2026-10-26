/**
 * Courier stages used by operations.
 *
 * HomeCheff does not collect government identity documents.
 * DeliveryProfile.isVerified means the courier profile is complete.
 * Stripe Connect capabilities decide whether a transfer or a bank payout can happen.
 * This module does not change the 88/12 split or affiliate percentages.
 */

export type CourierReadinessStage =
  | 'REGISTERED'
  | 'VERIFICATION_PENDING'
  | 'ELIGIBLE_TO_ACCEPT'
  | 'ELIGIBLE_FOR_TRANSFER'
  | 'ELIGIBLE_FOR_EXTERNAL_PAYOUT'
  | 'SUSPENDED';

export type CourierReadiness = {
  stage: CourierReadinessStage;
  canAcceptAssignments: boolean;
  canReceiveTransfer: boolean;
  canReceiveExternalPayout: boolean;
  identitySource: 'STRIPE_CONNECT' | 'PROFILE_ONLY';
  paidDeliveryAllowed: boolean;
};

export function resolveCourierReadiness(input: {
  hasProfile: boolean;
  isBlocked?: boolean | null;
  isActive?: boolean | null;
  profileComplete?: boolean | null;
  ageEligible?: boolean | null;
  transfersActive?: boolean | null;
  payoutsEnabled?: boolean | null;
  stripeIdentity?: 'VERIFIED' | 'RESTRICTED' | string | null;
}): CourierReadiness {
  if (!input.hasProfile) {
    return decorate({
      stage: 'REGISTERED',
      canAcceptAssignments: false,
      canReceiveTransfer: false,
      canReceiveExternalPayout: false,
      identitySource: 'PROFILE_ONLY',
    }, input.stripeIdentity);
  }
  if (input.isBlocked) {
    return decorate({
      stage: 'SUSPENDED',
      canAcceptAssignments: false,
      canReceiveTransfer: false,
      canReceiveExternalPayout: false,
      identitySource: input.transfersActive ? 'STRIPE_CONNECT' : 'PROFILE_ONLY',
    }, input.stripeIdentity);
  }
  const accountReady = Boolean(input.profileComplete && input.ageEligible && input.isActive);
  if (!accountReady) {
    return decorate({
      stage: 'VERIFICATION_PENDING',
      canAcceptAssignments: false,
      canReceiveTransfer: false,
      canReceiveExternalPayout: false,
      identitySource: input.transfersActive ? 'STRIPE_CONNECT' : 'PROFILE_ONLY',
    }, input.stripeIdentity);
  }
  if (input.transfersActive && input.payoutsEnabled) {
    return decorate({
      stage: 'ELIGIBLE_FOR_EXTERNAL_PAYOUT',
      canAcceptAssignments: true,
      canReceiveTransfer: true,
      canReceiveExternalPayout: true,
      identitySource: 'STRIPE_CONNECT',
    }, input.stripeIdentity);
  }
  if (input.transfersActive) {
    return decorate({
      stage: 'ELIGIBLE_FOR_TRANSFER',
      canAcceptAssignments: true,
      canReceiveTransfer: true,
      canReceiveExternalPayout: false,
      identitySource: 'STRIPE_CONNECT',
    }, input.stripeIdentity);
  }
  return decorate({
    stage: 'ELIGIBLE_TO_ACCEPT',
    canAcceptAssignments: true,
    canReceiveTransfer: false,
    canReceiveExternalPayout: false,
    identitySource: 'PROFILE_ONLY',
  }, input.stripeIdentity);
}

function decorate(
  result: Omit<CourierReadiness, 'paidDeliveryAllowed'>,
  stripeIdentity?: string | null,
): CourierReadiness {
  const restricted = stripeIdentity === 'RESTRICTED';
  const next = restricted
    ? {
        ...result,
        stage: result.canAcceptAssignments ? 'ELIGIBLE_TO_ACCEPT' as const : result.stage,
        canReceiveTransfer: false,
        canReceiveExternalPayout: false,
        identitySource: 'STRIPE_CONNECT' as const,
      }
    : result;
  return {
    ...next,
    paidDeliveryAllowed: next.canAcceptAssignments && stripeIdentity === 'VERIFIED',
  };
}
