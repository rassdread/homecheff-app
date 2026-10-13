import { getAccountRequirements } from '@/lib/account-requirements';
import { parseHcCampaignCodeFromCookieHeader } from '@/lib/acquisition/hc-campaign-code';
import { isListingPubliclyDiscoverable } from '@/lib/marketplace/public-listing-eligibility';
import { evaluateFirstValidListing } from '@/lib/hc/first-valid-listing';
import { qualifyListingOnGrowth, resolveCentralUserId } from '@/lib/hc/growth-campaign-client';
import { campaignGrantAttemptSettled } from '@/lib/hc/campaign-grant-attempt';
import { prisma } from '@/lib/prisma';
import { loadConnectAccountStatusForUser } from '@/lib/stripe/sync-seller-payment-status';

/**
 * Records the first valid listing once, then asks Growth to grant or pend the campaign.
 * A Growth outage does not fail the publish. The same product id can retry.
 */
export async function qualifyFirstValidListingReward(input: {
  userId: string;
  productId: string;
  isActive: boolean;
  integrityStatus?: string | null;
  qualityScore: number;
  cookieHeader?: string | null;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      id: true,
      email: true,
      bio: true,
      emailVerified: true,
      username: true,
      termsAccepted: true,
      passwordHash: true,
      Account: { select: { provider: true } },
      suspendedAt: true,
      accountDeletedAt: true,
      hcCampaignCode: true,
      hcCampaignGrantPending: true,
      firstValidListingAt: true,
      firstValidListingProductId: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      stripeConnectTrack: true,
    },
  });
  if (!user) return;

  const cookieCode = parseHcCampaignCodeFromCookieHeader(input.cookieHeader);
  if (!user.hcCampaignCode && cookieCode) {
    await prisma.user.updateMany({
      where: { id: user.id, hcCampaignCode: null },
      data: { hcCampaignCode: cookieCode },
    });
  }
  const promoCode = user.hcCampaignCode ?? cookieCode;
  if (!promoCode) return;

  const completingKnownFact =
    Boolean(user.firstValidListingAt) && user.firstValidListingProductId === input.productId;

  if (!completingKnownFact) {
  const requirements = getAccountRequirements(user);
  const decision = evaluateFirstValidListing({
    isActive: input.isActive,
    integrityPublic: isListingPubliclyDiscoverable({
      isActive: input.isActive,
      integrityStatus: input.integrityStatus ?? 'ACTIVE',
      sellerEmail: user.email,
      sellerBio: user.bio,
      sellerSuspendedAt: user.suspendedAt,
      sellerAccountDeletedAt: user.accountDeletedAt,
    }),
    qualityScore: input.qualityScore,
    canPostItem: requirements.canPostItem,
    sellerSuspended: Boolean(user.suspendedAt),
    sellerDeleted: Boolean(user.accountDeletedAt),
    existingFirstProductId: user.firstValidListingProductId,
    productId: input.productId,
  });
  if (!decision.eligible) return;

  if (!user.firstValidListingAt) {
    const stamped = await prisma.user.updateMany({
      where: { id: user.id, firstValidListingAt: null },
      data: {
        firstValidListingAt: new Date(),
        firstValidListingProductId: input.productId,
        hcCampaignGrantPending: true,
      },
    });
    if (stamped.count === 0) {
      const again = await prisma.user.findUnique({
        where: { id: user.id },
        select: { firstValidListingProductId: true },
      });
      if (again?.firstValidListingProductId !== input.productId) return;
    }
  }
  }

  const stripe = await loadConnectAccountStatusForUser({
    userId: user.id,
    stripeConnectAccountId: user.stripeConnectAccountId,
    stripeConnectOnboardingCompleted: user.stripeConnectOnboardingCompleted,
    stripeConnectTrack: user.stripeConnectTrack,
  });
  const centralUserId = await resolveCentralUserId(user.id);
  if (!centralUserId) return;
  const result = await qualifyListingOnGrowth({
    centralUserId,
    promoCode,
    stripeConnectVerified: stripe.paymentReady === true && Boolean(user.stripeConnectAccountId),
  });
  if (campaignGrantAttemptSettled(result)) {
    await prisma.user.update({
      where: { id: user.id },
      data: { hcCampaignGrantPending: false },
    });
  } else if (!user.hcCampaignGrantPending) {
    await prisma.user.updateMany({
      where: { id: user.id, hcCampaignGrantPending: false },
      data: { hcCampaignGrantPending: true },
    });
  }
}

/** Completes a pending grant after Stripe becomes payment-ready. Does not invent a listing. */
export async function resumePendingListingCampaign(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hcCampaignCode: true,
      firstValidListingAt: true,
      firstValidListingProductId: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
    },
  });
  if (!user?.hcCampaignCode || !user.firstValidListingAt || !user.firstValidListingProductId) return;
  if (!user.stripeConnectAccountId || !user.stripeConnectOnboardingCompleted) return;
  await qualifyFirstValidListingReward({
    userId,
    productId: user.firstValidListingProductId,
    isActive: true,
    qualityScore: 0,
  });
}

/** Retries a grant that survived a Growth outage. Does not create a new first-listing fact. */
export async function retryPendingCampaignGrant(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      hcCampaignGrantPending: true,
      firstValidListingAt: true,
      firstValidListingProductId: true,
    },
  });
  if (!user?.hcCampaignGrantPending || !user.firstValidListingAt || !user.firstValidListingProductId) return;
  await qualifyFirstValidListingReward({
    userId,
    productId: user.firstValidListingProductId,
    isActive: true,
    qualityScore: 0,
  });
}
