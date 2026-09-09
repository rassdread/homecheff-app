import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { matchesCurrentMode, stripe } from '@/lib/stripe';
import {
  deriveConnectAccountStatusFromDb,
  deriveConnectAccountStatusFromStripe,
  type ConnectAccountStatusSnapshot,
} from '@/lib/stripe/connect-account-status';
import type { SellerStripeSnapshot } from '@/lib/stripe/seller-payment-status';

export type { ConnectAccountStatusSnapshot };

/**
 * Live-retrieve the user's Connect account, sync DB onboardingCompleted, return
 * normalized HomeCheff Connect status. Defensive — never throws to callers.
 */
export async function loadConnectAccountStatusForUser(params: {
  userId: string;
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean | null;
  /** Force live retrieve even if DB says completed */
  forceLive?: boolean;
}): Promise<ConnectAccountStatusSnapshot> {
  const accountId = params.stripeConnectAccountId ?? null;

  if (!accountId) {
    return deriveConnectAccountStatusFromDb({
      stripeConnectAccountId: null,
      stripeConnectOnboardingCompleted: false,
    });
  }

  if (!stripe || !matchesCurrentMode(accountId)) {
    return deriveConnectAccountStatusFromDb({
      stripeConnectAccountId: accountId,
      stripeConnectOnboardingCompleted: params.stripeConnectOnboardingCompleted,
    });
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    const snapshot = deriveConnectAccountStatusFromStripe(account);

    if (
      snapshot.onboardingCompleted !==
      Boolean(params.stripeConnectOnboardingCompleted)
    ) {
      await prisma.user.update({
        where: { id: params.userId },
        data: { stripeConnectOnboardingCompleted: snapshot.onboardingCompleted },
      });
    }

    return snapshot;
  } catch (error) {
    console.warn('[stripe] loadConnectAccountStatusForUser failed', {
      userId: params.userId,
      accountId: accountId.slice(0, 12),
      error,
    });
    return deriveConnectAccountStatusFromDb({
      stripeConnectAccountId: accountId,
      stripeConnectOnboardingCompleted: params.stripeConnectOnboardingCompleted,
    });
  }
}

/**
 * Haal live Stripe-accountstatus op en werk DB bij.
 * Always refreshes when incomplete OR when live capability flags are missing,
 * so return UX can distinguish PENDING vs INCOMPLETE.
 */
export async function refreshSellerStripeSnapshotIfStale(
  userId: string,
  seller: SellerStripeSnapshot,
): Promise<SellerStripeSnapshot> {
  const accountId = seller.stripeConnectAccountId;
  if (!accountId) {
    return seller;
  }

  // Always live-verify linked accounts so CTAs never trust a stale DB completed flag.
  const live = await loadConnectAccountStatusForUser({
    userId,
    stripeConnectAccountId: accountId,
    stripeConnectOnboardingCompleted: seller.stripeConnectOnboardingCompleted,
    forceLive: true,
  });

  return {
    stripeConnectAccountId: accountId,
    stripeConnectOnboardingCompleted: live.onboardingCompleted,
    chargesEnabled: live.chargesEnabled,
    payoutsEnabled: live.payoutsEnabled,
    detailsSubmitted: live.detailsSubmitted,
    currentlyDueCount: live.currentlyDueCount,
    pastDueCount: live.pastDueCount,
    pendingVerificationCount: live.pendingVerificationCount,
    connectUiStatus: live.uiStatus,
  };
}

export function snapshotFromStripeAccount(
  account: Stripe.Account,
): SellerStripeSnapshot {
  const live = deriveConnectAccountStatusFromStripe(account);
  return {
    stripeConnectAccountId: live.accountId,
    stripeConnectOnboardingCompleted: live.onboardingCompleted,
    chargesEnabled: live.chargesEnabled,
    payoutsEnabled: live.payoutsEnabled,
    detailsSubmitted: live.detailsSubmitted,
    currentlyDueCount: live.currentlyDueCount,
    pastDueCount: live.pastDueCount,
    pendingVerificationCount: live.pendingVerificationCount,
    connectUiStatus: live.uiStatus,
  };
}
