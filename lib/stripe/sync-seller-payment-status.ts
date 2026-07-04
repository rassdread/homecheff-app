import { prisma } from '@/lib/prisma';
import { matchesCurrentMode, stripe } from '@/lib/stripe';
import type { SellerStripeSnapshot } from '@/lib/stripe/seller-payment-status';

/**
 * Haal live Stripe-accountstatus op en werk DB bij als onboarding nog open staat.
 * Faalt defensief — productdetail mag nooit breken door Stripe API-fouten.
 */
export async function refreshSellerStripeSnapshotIfStale(
  userId: string,
  seller: SellerStripeSnapshot,
): Promise<SellerStripeSnapshot> {
  const accountId = seller.stripeConnectAccountId;
  if (!accountId) {
    return seller;
  }

  const needsRefresh =
    !seller.stripeConnectOnboardingCompleted ||
    seller.chargesEnabled == null ||
    seller.payoutsEnabled == null;

  if (!needsRefresh) {
    return seller;
  }

  if (!stripe || !matchesCurrentMode(accountId)) {
    return seller;
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    const chargesEnabled = Boolean(account.charges_enabled);
    const payoutsEnabled = Boolean(account.payouts_enabled);
    const isCompleted = chargesEnabled && payoutsEnabled;

    if (isCompleted !== Boolean(seller.stripeConnectOnboardingCompleted)) {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeConnectOnboardingCompleted: isCompleted },
      });
    }

    return {
      stripeConnectAccountId: accountId,
      stripeConnectOnboardingCompleted: isCompleted,
      chargesEnabled,
      payoutsEnabled,
    };
  } catch (error) {
    console.warn('[stripe] refresh seller payment status failed', {
      userId,
      accountId: accountId.slice(0, 12),
      error,
    });
    return seller;
  }
}
