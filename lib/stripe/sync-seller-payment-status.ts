import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { isTestMode, matchesCurrentMode, stripe } from '@/lib/stripe';
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
  stripeConnectTrack?: string | null;
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
    const livemode = Boolean(
      (account as unknown as { livemode?: boolean }).livemode,
    );
    if (livemode === isTestMode) {
      await prisma.user.update({
        where: { id: params.userId },
        data: {
          stripeConnectAccountId: null,
          stripeConnectOnboardingCompleted: false,
          stripeConnectTrack: null,
        },
      });
      return deriveConnectAccountStatusFromDb({
        stripeConnectAccountId: null,
        stripeConnectOnboardingCompleted: false,
      });
    }
    const track =
      params.stripeConnectTrack === 'PARTICULAR' ||
      params.stripeConnectTrack === 'BUSINESS'
        ? params.stripeConnectTrack
        : null;
    const snapshot = deriveConnectAccountStatusFromStripe(account, {
      connectTrack: track,
    });

    if (
      snapshot.onboardingCompleted !==
      Boolean(params.stripeConnectOnboardingCompleted)
    ) {
      await prisma.user.update({
        where: { id: params.userId },
        data: { stripeConnectOnboardingCompleted: snapshot.onboardingCompleted },
      });
      if (snapshot.paymentReady && snapshot.onboardingCompleted) {
        const { resumePendingListingCampaign } = await import('@/lib/hc/qualify-first-listing');
        void resumePendingListingCampaign(params.userId).catch((e) =>
          console.warn('[hc-campaign] resume after stripe', e),
        );
      }
    }

    // Keep legacy Affiliate mirror in sync (one Connect account per user).
    try {
      const { syncAffiliateConnectMirrorFromUser } = await import(
        '@/lib/stripe/affiliate-connect-mirror'
      );
      await syncAffiliateConnectMirrorFromUser(params.userId);
    } catch (mirrorErr) {
      console.warn('[stripe] affiliate connect mirror sync failed', mirrorErr);
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
    stripeConnectTrack: (seller as { stripeConnectTrack?: string | null })
      .stripeConnectTrack,
    forceLive: true,
  });

  return {
    stripeConnectAccountId: accountId,
    stripeConnectOnboardingCompleted: live.onboardingCompleted,
    stripeConnectTrack: seller.stripeConnectTrack ?? null,
    chargesEnabled: live.chargesEnabled,
    payoutsEnabled: live.payoutsEnabled,
    detailsSubmitted: live.detailsSubmitted,
    currentlyDueCount: live.currentlyDueCount,
    pastDueCount: live.pastDueCount,
    pendingVerificationCount: live.pendingVerificationCount,
    connectUiStatus: live.uiStatus,
    canCreateOnboardingLink: live.canCreateOnboardingLink,
  };
}

export function snapshotFromStripeAccount(
  account: Stripe.Account,
): SellerStripeSnapshot {
  const live = deriveConnectAccountStatusFromStripe(account);
  return {
    stripeConnectAccountId: live.accountId,
    stripeConnectOnboardingCompleted: live.onboardingCompleted,
    stripeConnectTrack: live.connectTrack,
    chargesEnabled: live.chargesEnabled,
    payoutsEnabled: live.payoutsEnabled,
    detailsSubmitted: live.detailsSubmitted,
    currentlyDueCount: live.currentlyDueCount,
    pastDueCount: live.pastDueCount,
    pendingVerificationCount: live.pendingVerificationCount,
    connectUiStatus: live.uiStatus,
    canCreateOnboardingLink: live.canCreateOnboardingLink,
  };
}
