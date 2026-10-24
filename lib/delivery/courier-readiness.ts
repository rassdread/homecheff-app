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
};

export function resolveCourierReadiness(input: {
  hasProfile: boolean;
  isBlocked?: boolean | null;
  isActive?: boolean | null;
  profileComplete?: boolean | null;
  ageEligible?: boolean | null;
  transfersActive?: boolean | null;
  payoutsEnabled?: boolean | null;
  stripeIdentity?: 'RESTRICTED' | null;
}): CourierReadiness {
  if (!input.hasProfile) {
    return {
      stage: 'REGISTERED',
      canAcceptAssignments: false,
      canReceiveTransfer: false,
      canReceiveExternalPayout: false,
      identitySource: 'PROFILE_ONLY',
    };
  }
  if (input.isBlocked) {
    return {
      stage: 'SUSPENDED',
      canAcceptAssignments: false,
      canReceiveTransfer: false,
      canReceiveExternalPayout: false,
      identitySource: input.transfersActive ? 'STRIPE_CONNECT' : 'PROFILE_ONLY',
    };
  }
  const accountReady = Boolean(input.profileComplete && input.ageEligible && input.isActive);
  if (!accountReady) {
    return {
      stage: 'VERIFICATION_PENDING',
      canAcceptAssignments: false,
      canReceiveTransfer: false,
      canReceiveExternalPayout: false,
      identitySource: input.transfersActive ? 'STRIPE_CONNECT' : 'PROFILE_ONLY',
    };
  }
  if (input.transfersActive && input.payoutsEnabled) {
    return restricted({
      stage: 'ELIGIBLE_FOR_EXTERNAL_PAYOUT',
      canAcceptAssignments: true,
      canReceiveTransfer: true,
      canReceiveExternalPayout: true,
      identitySource: 'STRIPE_CONNECT',
    }, input.stripeIdentity);
  }
  if (input.transfersActive) {
    return restricted({
      stage: 'ELIGIBLE_FOR_TRANSFER',
      canAcceptAssignments: true,
      canReceiveTransfer: true,
      canReceiveExternalPayout: false,
      identitySource: 'STRIPE_CONNECT',
    }, input.stripeIdentity);
  }
  return {
    stage: 'ELIGIBLE_TO_ACCEPT',
    canAcceptAssignments: true,
    canReceiveTransfer: false,
    canReceiveExternalPayout: false,
    identitySource: 'PROFILE_ONLY',
  };
}

function restricted(result: CourierReadiness, stripeIdentity?: 'RESTRICTED' | null): CourierReadiness {
  if (stripeIdentity !== 'RESTRICTED') return result;
  return {
    ...result,
    stage: result.canAcceptAssignments ? 'ELIGIBLE_TO_ACCEPT' : result.stage,
    canReceiveTransfer: false,
    canReceiveExternalPayout: false,
    identitySource: 'STRIPE_CONNECT',
  };
}
