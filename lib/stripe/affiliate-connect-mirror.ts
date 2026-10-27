/**
 * One Connect account per HomeCheff user.
 * Affiliate.* Stripe fields are a legacy mirror — User is canonical.
 */

/** Effective Connect destination for affiliate payouts (User wins). */
export function resolveAffiliateConnectDestination(input: {
  userStripeConnectAccountId?: string | null;
  userStripeConnectOnboardingCompleted?: boolean | null;
  affiliateStripeConnectAccountId?: string | null;
  affiliateStripeConnectOnboardingCompleted?: boolean | null;
}): {
  accountId: string | null;
  onboardingCompleted: boolean;
  source: 'user' | 'affiliate' | 'none';
} {
  if (input.userStripeConnectAccountId) {
    return {
      accountId: input.userStripeConnectAccountId,
      onboardingCompleted: Boolean(input.userStripeConnectOnboardingCompleted),
      source: 'user',
    };
  }
  if (input.affiliateStripeConnectAccountId) {
    return {
      accountId: input.affiliateStripeConnectAccountId,
      onboardingCompleted: Boolean(
        input.affiliateStripeConnectOnboardingCompleted,
      ),
      source: 'affiliate',
    };
  }
  return { accountId: null, onboardingCompleted: false, source: 'none' };
}

export async function syncAffiliateConnectMirrorFromUser(
  userId: string,
): Promise<void> {
  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      affiliate: { select: { id: true } },
    },
  });
  if (!user?.affiliate?.id || !user.stripeConnectAccountId) return;

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: user.affiliate.id },
    select: {
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
    },
  });
  const onboarding = Boolean(user.stripeConnectOnboardingCompleted);
  if (
    affiliate?.stripeConnectAccountId === user.stripeConnectAccountId &&
    affiliate.stripeConnectOnboardingCompleted === onboarding
  ) {
    return;
  }

  await prisma.affiliate.update({
    where: { id: user.affiliate.id },
    data: {
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingCompleted: onboarding,
    },
  });
}

/** Intentional canonical clears may erase the mirror. Status reads must not. */
export async function clearAffiliateConnectMirror(userId: string): Promise<void> {
  const { prisma } = await import('@/lib/prisma');
  const affiliate = await prisma.affiliate.findUnique({
    where: { userId },
    select: { id: true, stripeConnectAccountId: true },
  });
  if (!affiliate?.stripeConnectAccountId) return;
  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: {
      stripeConnectAccountId: null,
      stripeConnectOnboardingCompleted: false,
    },
  });
}
