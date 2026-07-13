/**
 * Phase 3E — Feed Dish.findMany strategies (semantics-preserving).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { FEED_DB_DISH_CAP } from '@/lib/feed/feed-candidate-window';

export type FeedDishQueryStrategy = 'include_full' | 'trimmed_user';

export type FeedDishRow = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  deliveryMode: string | null;
  category: string | null;
  status: string;
  createdAt: Date;
  lat: number | null;
  lng: number | null;
  place: string | null;
  stock: number | null;
  maxStock: number | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    profileImage: string | null;
    displayFullName: boolean | null;
    displayNameOption: string | null;
    place: string | null;
    city: string | null;
    lat: number | null;
    lng: number | null;
    stripeConnectAccountId: string | null;
    stripeConnectOnboardingCompleted: boolean | null;
  };
  photos: { idx: number }[];
  videos: { url: string; thumbnail: string | null }[];
};

const DISH_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  profileImage: true,
  displayFullName: true,
  displayNameOption: true,
  place: true,
  city: true,
  lat: true,
  lng: true,
  stripeConnectAccountId: true,
  stripeConnectOnboardingCompleted: true,
} as const;

const DISH_INCLUDE = {
  user: { select: DISH_USER_SELECT },
  photos: {
    select: { idx: true },
    orderBy: { idx: 'asc' as const },
  },
  videos: {
    select: { url: true, thumbnail: true },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
};

export type FeedDishQueryInput = {
  where: Prisma.DishWhereInput;
  strategy?: FeedDishQueryStrategy;
};

export async function fetchFeedPublishedDishes(
  prisma: PrismaClient,
  input: FeedDishQueryInput,
): Promise<FeedDishRow[]> {
  const strategy =
    input.strategy ??
    (process.env.FEED_DISH_QUERY_STRATEGY as FeedDishQueryStrategy | undefined) ??
    'trimmed_user';

  if (strategy === 'include_full') {
    return prisma.dish.findMany({
      where: input.where,
      orderBy: [{ createdAt: 'desc' }],
      take: FEED_DB_DISH_CAP,
      include: DISH_INCLUDE,
    }) as Promise<FeedDishRow[]>;
  }

  return prisma.dish.findMany({
    where: input.where,
    orderBy: [{ createdAt: 'desc' }],
    take: FEED_DB_DISH_CAP,
    select: {
      id: true,
      title: true,
      description: true,
      priceCents: true,
      deliveryMode: true,
      category: true,
      status: true,
      createdAt: true,
      lat: true,
      lng: true,
      place: true,
      stock: true,
      maxStock: true,
      user: { select: DISH_USER_SELECT },
      photos: DISH_INCLUDE.photos,
      videos: DISH_INCLUDE.videos,
    },
  }) as Promise<FeedDishRow[]>;
}
