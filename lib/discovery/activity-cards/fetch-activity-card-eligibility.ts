/**
 * Batch-friendly eligibility snapshot for activity cards (Phase 3B).
 */

import { prisma } from '@/lib/prisma';
import type { ActivityCardEligibilityInput } from './activity-card-contract';

export type FetchActivityCardEligibilityOptions = {
  userId: string;
  nearbyRequestCount?: number;
};

export async function fetchActivityCardEligibilityInput(
  options: FetchActivityCardEligibilityOptions,
): Promise<ActivityCardEligibilityInput> {
  const { userId, nearbyRequestCount = 0 } = options;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      profileImage: true,
      image: true,
      place: true,
      lat: true,
      lng: true,
      city: true,
      emailVerified: true,
      sellerRoles: true,
      stripeConnectAccountId: true,
      stripeConnectOnboardingCompleted: true,
      SellerProfile: {
        select: {
          id: true,
          products: {
            select: {
              id: true,
              marketplaceCategory: true,
              specializations: true,
            },
            take: 50,
          },
          workplacePhotos: { select: { id: true }, take: 1 },
        },
      },
      DeliveryProfile: { select: { id: true } },
      Dish: { select: { id: true }, take: 1 },
    },
  });

  if (!user) {
    return {
      userId,
      loggedIn: false,
      profileImage: null,
      hasLocation: false,
      completenessPercent: 0,
      productCount: 0,
      dishCount: 0,
      hasWorkspacePhotos: false,
      hasStripe: false,
      hasAcceptedValues: false,
      hasDeliveryProfile: false,
      hasSellerRole: false,
      completedDealWithoutReview: false,
      nearbyRequestCount: 0,
      emailVerified: false,
      hasWorkshopListing: false,
    };
  }

  const profileImage = user.profileImage ?? user.image ?? null;
  const hasLocation = Boolean(
    user.place?.trim() ||
      user.city?.trim() ||
      (user.lat != null && user.lng != null),
  );
  const productCount = user.SellerProfile?.products?.length ?? 0;
  const dishCount = user.Dish?.length ?? 0;
  const hasWorkspacePhotos =
    (user.SellerProfile?.workplacePhotos?.length ?? 0) > 0;
  const hasStripe = Boolean(
    user.stripeConnectAccountId && user.stripeConnectOnboardingCompleted,
  );
  const hasSellerRole = (user.sellerRoles?.length ?? 0) > 0;
  const hasDeliveryProfile = Boolean(user.DeliveryProfile?.id);
  const hasWorkshopListing = Boolean(
    user.SellerProfile?.products?.some(
      (p) =>
        p.marketplaceCategory === 'KNOWLEDGE' ||
        p.specializations?.some((s) => s.startsWith('knowledge.')),
    ),
  );

  let completenessScore = 0;
  const completenessMax = 5;
  if (profileImage) completenessScore += 1;
  if (hasLocation) completenessScore += 1;
  if (hasSellerRole) completenessScore += 1;
  if (productCount > 0 || dishCount > 0) completenessScore += 1;
  if (hasStripe) completenessScore += 1;
  const completenessPercent = Math.round(
    (completenessScore / completenessMax) * 100,
  );

  const completedDealWithoutReview = await prisma.order
    .findFirst({
      where: {
        userId,
        status: { in: ['DELIVERED', 'SHIPPED'] },
        reviews: { none: { buyerId: userId } },
      },
      select: { id: true },
    })
    .then((o) => Boolean(o));

  const acceptedValuesRow = await prisma.product.findFirst({
    where: {
      sellerId: user.SellerProfile?.id ?? '__none__',
      acceptedSpecializations: { isEmpty: false },
    },
    select: { id: true },
  });

  return {
    userId,
    loggedIn: true,
    profileImage,
    hasLocation,
    completenessPercent,
    productCount,
    dishCount,
    hasWorkspacePhotos,
    hasStripe,
    hasAcceptedValues: Boolean(acceptedValuesRow),
    hasDeliveryProfile,
    hasSellerRole,
    completedDealWithoutReview,
    nearbyRequestCount,
    emailVerified: Boolean(user.emailVerified),
    hasWorkshopListing,
  };
}

export function countNearbyRequestsInPool(
  items: Array<{ discovery?: { listingKind?: string; listingIntent?: string } | null }>,
): number {
  return items.filter((item) => {
    const kind = String(item.discovery?.listingKind ?? '').toUpperCase();
    const intent = String(item.discovery?.listingIntent ?? '').toUpperCase();
    return kind === 'REQUEST' || intent === 'REQUEST';
  }).length;
}
