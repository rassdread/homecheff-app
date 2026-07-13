/**
 * Phase 3E+ — Dish IDs-first pipeline (semantics-preserving).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { FEED_DB_DISH_CAP } from '@/lib/feed/feed-candidate-window';
import {
  batchHydrateFeedUsers,
  type FeedUserHydrated,
} from '@/lib/feed/feed-seller-hydration.server';

export type FeedDishQueryStrategy =
  | 'include_full'
  | 'trimmed_user'
  | 'ids_first';

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

export type FeedDishIdsFirstTiming = {
  idsMs: number;
  userHydrateMs: number;
};

const DISH_ID_SELECT = {
  id: true,
  createdAt: true,
  userId: true,
  title: true,
  description: true,
  priceCents: true,
  deliveryMode: true,
  category: true,
  status: true,
  lat: true,
  lng: true,
  place: true,
  stock: true,
  maxStock: true,
} satisfies Prisma.DishSelect;

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

type DishIdRow = {
  id: string;
  createdAt: Date;
  userId: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  deliveryMode: string | null;
  category: string | null;
  status: string;
  lat: number | null;
  lng: number | null;
  place: string | null;
  stock: number | null;
  maxStock: number | null;
};

function attachUser(
  userId: string,
  users: Map<string, FeedUserHydrated>,
): FeedDishRow['user'] {
  const u = users.get(userId);
  if (!u) {
    return {
      id: userId,
      name: null,
      username: null,
      profileImage: null,
      displayFullName: null,
      displayNameOption: null,
      place: null,
      city: null,
      lat: null,
      lng: null,
      stripeConnectAccountId: null,
      stripeConnectOnboardingCompleted: null,
    };
  }
  return u;
}

async function hydrateDishesIdsFirst(
  prisma: PrismaClient,
  idRows: DishIdRow[],
): Promise<{ rows: FeedDishRow[]; timing: FeedDishIdsFirstTiming }> {
  const idsStart = performance.now();
  const idsMs = Math.round(performance.now() - idsStart);

  if (idRows.length === 0) {
    return { rows: [], timing: { idsMs, userHydrateMs: 0 } };
  }

  const userHydrateStart = performance.now();
  const userIds = [...new Set(idRows.map((r) => r.userId))];
  const [users, photoRows, videoRows] = await Promise.all([
    batchHydrateFeedUsers(prisma, userIds),
    prisma.dishPhoto.findMany({
      where: { dishId: { in: idRows.map((r) => r.id) } },
      select: { dishId: true, idx: true },
      orderBy: { idx: 'asc' },
    }),
    prisma.dishVideo.findMany({
      where: { dishId: { in: idRows.map((r) => r.id) } },
      select: { dishId: true, url: true, thumbnail: true },
    }),
  ]);
  const userHydrateMs = Math.round(performance.now() - userHydrateStart);

  const photosByDish = new Map<string, { idx: number }[]>();
  for (const p of photoRows) {
    const list = photosByDish.get(p.dishId) ?? [];
    list.push({ idx: p.idx });
    photosByDish.set(p.dishId, list);
  }

  const videosByDish = new Map<string, { url: string; thumbnail: string | null }[]>();
  for (const v of videoRows) {
    const list = videosByDish.get(v.dishId) ?? [];
    list.push({ url: v.url, thumbnail: v.thumbnail });
    videosByDish.set(v.dishId, list);
  }

  const rows: FeedDishRow[] = idRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    priceCents: row.priceCents,
    deliveryMode: row.deliveryMode,
    category: row.category,
    status: row.status,
    createdAt: row.createdAt,
    lat: row.lat,
    lng: row.lng,
    place: row.place,
    stock: row.stock,
    maxStock: row.maxStock,
    user: attachUser(row.userId, users),
    photos: photosByDish.get(row.id) ?? [],
    videos: (videosByDish.get(row.id) ?? []).slice(0, 1),
  }));

  return { rows, timing: { idsMs, userHydrateMs } };
}

export type FeedDishQueryInput = {
  where: Prisma.DishWhereInput;
  strategy?: FeedDishQueryStrategy;
};

export type FeedDishQueryResult = {
  rows: FeedDishRow[];
  idsFirstTiming?: FeedDishIdsFirstTiming;
};

export async function fetchFeedPublishedDishes(
  prisma: PrismaClient,
  input: FeedDishQueryInput,
): Promise<FeedDishQueryResult> {
  const strategy =
    input.strategy ??
    (process.env.FEED_DISH_QUERY_STRATEGY as FeedDishQueryStrategy | undefined) ??
    'ids_first';

  if (strategy === 'ids_first') {
    const idsStart = performance.now();
    const idRows = (await prisma.dish.findMany({
      where: input.where,
      orderBy: [{ createdAt: 'desc' }],
      take: FEED_DB_DISH_CAP,
      select: DISH_ID_SELECT,
    })) as DishIdRow[];
    const idsMs = Math.round(performance.now() - idsStart);
    const { rows, timing } = await hydrateDishesIdsFirst(prisma, idRows);
    return {
      rows,
      idsFirstTiming: { ...timing, idsMs },
    };
  }

  if (strategy === 'include_full') {
    const rows = (await prisma.dish.findMany({
      where: input.where,
      orderBy: [{ createdAt: 'desc' }],
      take: FEED_DB_DISH_CAP,
      include: DISH_INCLUDE,
    })) as FeedDishRow[];
    return { rows };
  }

  const rows = (await prisma.dish.findMany({
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
  })) as FeedDishRow[];

  return { rows };
}
