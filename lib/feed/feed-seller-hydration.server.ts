/**
 * Phase 3E+ — Batch seller profile + User hydration for feed tiles.
 */

import type { PrismaClient } from '@prisma/client';

export const FEED_SELLER_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  profileImage: true,
  displayFullName: true,
  displayNameOption: true,
  stripeConnectAccountId: true,
  stripeConnectOnboardingCompleted: true,
  lat: true,
  lng: true,
  place: true,
  city: true,
} as const;

export const FEED_SELLER_PROFILE_SELECT = {
  id: true,
  lat: true,
  lng: true,
  kvk: true,
  companyName: true,
  userId: true,
} as const;

export type FeedSellerHydrated = {
  id: string;
  lat: number | null;
  lng: number | null;
  kvk: string | null;
  companyName: string | null;
  User: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName: boolean | null;
    displayNameOption: string | null;
    stripeConnectAccountId: string | null;
    stripeConnectOnboardingCompleted: boolean | null;
    lat: number | null;
    lng: number | null;
    place: string | null;
    city: string | null;
  };
};

export type FeedUserHydrated = FeedSellerHydrated['User'];

export async function batchHydrateFeedSellers(
  prisma: PrismaClient,
  sellerProfileIds: string[],
): Promise<Map<string, FeedSellerHydrated>> {
  const unique = [...new Set(sellerProfileIds.filter(Boolean))];
  const out = new Map<string, FeedSellerHydrated>();
  if (unique.length === 0) return out;

  const rows = await prisma.sellerProfile.findMany({
    where: { id: { in: unique } },
    select: {
      ...FEED_SELLER_PROFILE_SELECT,
      User: { select: FEED_SELLER_USER_SELECT },
    },
  });

  for (const row of rows) {
    if (!row.User) continue;
    out.set(row.id, {
      id: row.id,
      lat: row.lat,
      lng: row.lng,
      kvk: row.kvk,
      companyName: row.companyName,
      User: row.User,
    });
  }
  return out;
}

export async function batchHydrateFeedUsers(
  prisma: PrismaClient,
  userIds: string[],
): Promise<Map<string, FeedUserHydrated>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out = new Map<string, FeedUserHydrated>();
  if (unique.length === 0) return out;

  const rows = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: FEED_SELLER_USER_SELECT,
  });

  for (const row of rows) {
    out.set(row.id, row);
  }
  return out;
}
