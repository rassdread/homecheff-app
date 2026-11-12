import type { DeliveryProfile } from '@prisma/client';
import { DELIVERY_AGREEMENT_DOCUMENT_ID } from '@/lib/delivery/delivery-agreement';
import {
  assertDelivererCanAccept,
  type DelivererAcceptProfile,
  type DelivererAcceptResult,
} from '@/lib/delivery/delivery-eligibility';

export const STRIPE_LINK_RESTORE_REQUIRED_NL =
  'Herstel eerst je Stripe-koppeling voordat je een betaalde bezorging kunt aannemen.';

export const STRIPE_LINK_REVIEW_NL = 'Stripe-koppeling controleren';

export const STRIPE_PAYOUT_NOT_READY_NL =
  'Je Stripe-account is nog niet gereed voor uitbetalingen.';

export type PaidDeliveryStripeState = {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
  payoutsEnabled?: boolean | null;
  transfersCapability?: string | null;
  identityBlocked?: boolean | null;
  reviewRequired?: boolean | null;
};

export type PaidDeliveryProfile = DelivererAcceptProfile & {
  deliveryAgreementAcceptedAt?: Date | string | null;
  deliveryAgreementDocumentId?: string | null;
};

export function deliveryAgreementIsCurrent(input: {
  acceptedAt?: Date | string | null;
  documentId?: string | null;
}): boolean {
  if (input.acceptedAt == null || input.acceptedAt === '') return false;
  return (input.documentId || '').trim() === DELIVERY_AGREEMENT_DOCUMENT_ID;
}

/** Current HomeCheff payout link. An audit-only account id is not current. */
export function currentStripePayoutReady(stripe: PaidDeliveryStripeState): boolean {
  const accountId = stripe.stripeConnectAccountId?.trim() || '';
  if (!accountId) return false;
  if (!stripe.stripeConnectOnboardingCompleted) return false;
  if (stripe.payoutsEnabled === false) return false;
  if (stripe.transfersCapability != null && stripe.transfersCapability !== 'active') return false;
  if (stripe.identityBlocked) return false;
  return true;
}

export type DeliveryPayoutConnectStatus = 'READY' | 'NO_CURRENT_LINK' | 'NOT_READY' | 'REVIEW';

export function deliveryPayoutConnectStatus(
  stripe: PaidDeliveryStripeState,
): DeliveryPayoutConnectStatus {
  const accountId = stripe.stripeConnectAccountId?.trim() || '';
  if (!accountId) return stripe.reviewRequired ? 'REVIEW' : 'NO_CURRENT_LINK';
  return currentStripePayoutReady(stripe) ? 'READY' : 'NOT_READY';
}

type PaidDenialCode =
  | 'DELIVERY_AGREEMENT_REQUIRED'
  | 'STRIPE_LINK_MISSING'
  | 'STRIPE_LINK_REVIEW'
  | 'STRIPE_NOT_READY';

export type PaidDeliveryAcceptResult =
  | DelivererAcceptResult
  | {
      ok: false;
      status: 403;
      error: string;
      code: PaidDenialCode;
    };

export function assertDelivererCanAcceptPaidJob(
  profile: PaidDeliveryProfile | null | undefined,
  options: {
    dateOfBirth?: Date | string | null;
    now?: Date;
    ageGateEnabled?: boolean;
    stripe: PaidDeliveryStripeState;
  },
): PaidDeliveryAcceptResult {
  const base = assertDelivererCanAccept(profile, options);
  if (!base.ok) return base;
  if (
    !deliveryAgreementIsCurrent({
      acceptedAt: profile?.deliveryAgreementAcceptedAt,
      documentId: profile?.deliveryAgreementDocumentId,
    })
  ) {
    return {
      ok: false,
      status: 403,
      error: 'Accepteer eerst de huidige bezorgovereenkomst.',
      code: 'DELIVERY_AGREEMENT_REQUIRED',
    };
  }
  const payout = deliveryPayoutConnectStatus(options.stripe);
  if (payout === 'REVIEW') {
    return { ok: false, status: 403, error: STRIPE_LINK_REVIEW_NL, code: 'STRIPE_LINK_REVIEW' };
  }
  if (payout === 'NO_CURRENT_LINK') {
    return {
      ok: false,
      status: 403,
      error: STRIPE_LINK_RESTORE_REQUIRED_NL,
      code: 'STRIPE_LINK_MISSING',
    };
  }
  if (payout === 'NOT_READY') {
    return { ok: false, status: 403, error: STRIPE_PAYOUT_NOT_READY_NL, code: 'STRIPE_NOT_READY' };
  }
  return { ok: true };
}

export function paidDeliveryDashboardState(input: {
  profile: Pick<DeliveryProfile, 'isActive' | 'isVerified'> | null;
  stripe: PaidDeliveryStripeState;
}): { ready: boolean; message: string | null } {
  if (!input.profile) return { ready: false, message: null };
  const payout = deliveryPayoutConnectStatus(input.stripe);
  if (payout === 'READY') return { ready: true, message: null };
  if (payout === 'REVIEW') return { ready: false, message: STRIPE_LINK_REVIEW_NL };
  if (payout === 'NO_CURRENT_LINK') {
    return { ready: false, message: STRIPE_LINK_RESTORE_REQUIRED_NL };
  }
  return { ready: false, message: STRIPE_PAYOUT_NOT_READY_NL };
}
