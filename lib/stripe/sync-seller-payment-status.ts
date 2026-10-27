import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { matchesCurrentMode, stripe } from '@/lib/stripe';
import { financialStripeSecret, stripeSecretMode } from '@/lib/stripe-runtime-guard';
import { classifyConnectAccountRetrieve } from '@/lib/stripe/connect-link-guard';
import {
  deriveConnectAccountStatusFromDb,
  deriveConnectAccountStatusFromStripe,
  type ConnectAccountStatusSnapshot,
} from '@/lib/stripe/connect-account-status';
import type { SellerStripeSnapshot } from '@/lib/stripe/seller-payment-status';

export type { ConnectAccountStatusSnapshot };

/**
 * Live-retrieve the user's Connect account and refresh the onboarding flag.
 * A status read never removes User.stripeConnectAccountId. Account objects do
 * not expose livemode; a missing mode is not evidence of the wrong environment.
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
    const classification = classifyConnectAccountRetrieve({
      secretMode: stripeSecretMode(financialStripeSecret()),
      account: {
        id: account.id,
        livemode: (account as unknown as { livemode?: boolean | null }).livemode,
      },
    });
    if (classification.kind !== 'CURRENT') {
      return deriveConnectAccountStatusFromDb({
        stripeConnectAccountId: accountId,
        stripeConnectOnboardingCompleted: params.stripeConnectOnboardingCompleted,
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
      const updated = await prisma.user.updateMany({
        where: {
          id: params.userId,
          stripeConnectAccountId: accountId,
        },
        data: { stripeConnectOnboardingCompleted: snapshot.onboardingCompleted },
      });
      if (updated.count > 0 && snapshot.paymentReady && snapshot.onboardingCompleted) {
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
    const stripeError = error as {
      code?: string;
      type?: string;
      statusCode?: number;
    };
    const classification = classifyConnectAccountRetrieve({
      secretMode: stripeSecretMode(financialStripeSecret()),
      errorCode: stripeError.code,
      errorType: stripeError.type,
      errorStatus: stripeError.statusCode,
    });
    console.warn('[stripe] loadConnectAccountStatusForUser failed', {
      userId: params.userId,
      accountId: accountId.slice(0, 12),
      outcome: classification.kind,
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
