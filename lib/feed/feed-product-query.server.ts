/**
 * Phase 3E — Feed Product.findMany strategies (semantics-preserving).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { FEED_DB_PRODUCT_CAP } from '@/lib/feed/feed-candidate-window';

export type FeedProductQueryStrategy = 'or_single' | 'split_or' | 'trimmed_or';

export type FeedProductRow = {
  id: string;
  title: string | null;
  description: string | null;
  priceCents: number | null;
  orderMethod: string | null;
  acceptHomeCheffPayment: boolean | null;
  acceptDirectContact: boolean | null;
  listingIntent: string | null;
  priceModel: string | null;
  delivery: string | null;
  category: string | null;
  marketplaceCategory: string | null;
  specializations: string[];
  acceptedSpecializations: string[];
  subcategory: string | null;
  barterOpenness: string | null;
  createdAt: Date;
  pickupAddress: string | null;
  pickupLat: number | null;
  pickupLng: number | null;
  seller: {
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
    } | null;
  } | null;
  Image: { sortOrder: number }[];
  Video: { url: string; thumbnail: string | null } | null;
};

export const FEED_PRODUCT_SELECT: Prisma.ProductSelect = {
  id: true,
  title: true,
  description: true,
  priceCents: true,
  orderMethod: true,
  acceptHomeCheffPayment: true,
  acceptDirectContact: true,
  listingIntent: true,
  priceModel: true,
  delivery: true,
  category: true,
  marketplaceCategory: true,
  specializations: true,
  acceptedSpecializations: true,
  subcategory: true,
  barterOpenness: true,
  createdAt: true,
  pickupAddress: true,
  pickupLat: true,
  pickupLng: true,
  seller: {
    select: {
      id: true,
      lat: true,
      lng: true,
      kvk: true,
      companyName: true,
      User: {
        select: {
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
        },
      },
    },
  },
  Image: {
    select: { sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  },
  Video: {
    select: { url: true, thumbnail: true },
  },
};

function baseVisibilityWhere(): Prisma.ProductWhereInput {
  return {
    OR: [
      { isActive: true },
      {
        isActive: false,
        orderItems: {
          some: {
            Order: { stripeSessionId: { not: null } },
          },
        },
      },
    ],
  };
}

function mergeByCreatedAtDesc(
  rows: FeedProductRow[],
  cap: number,
): FeedProductRow[] {
  const seen = new Set<string>();
  const out: FeedProductRow[] = [];
  for (const row of [...rows].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
    if (out.length >= cap) break;
  }
  return out;
}

function andWhere(
  base: Prisma.ProductWhereInput,
  extras?: Prisma.ProductWhereInput,
): Prisma.ProductWhereInput {
  if (!extras || Object.keys(extras).length === 0) return base;
  return { AND: [base, extras] };
}

export type FeedProductQueryInput = {
  whereExtras?: Prisma.ProductWhereInput;
  strategy?: FeedProductQueryStrategy;
};

export async function fetchFeedProducts(
  prisma: PrismaClient,
  input: FeedProductQueryInput = {},
): Promise<FeedProductRow[]> {
  const strategy =
    input.strategy ??
    (process.env.FEED_PRODUCT_QUERY_STRATEGY as FeedProductQueryStrategy | undefined) ??
    'split_or';
  const where = andWhere(baseVisibilityWhere(), input.whereExtras);
  const args = {
    orderBy: [{ createdAt: 'desc' as const }],
    take: FEED_DB_PRODUCT_CAP,
    select: FEED_PRODUCT_SELECT,
  };

  if (strategy === 'or_single' || strategy === 'trimmed_or') {
    return prisma.product.findMany({
      where,
      ...args,
    }) as Promise<FeedProductRow[]>;
  }

  // split_or — parallel active + paid-inactive, merge preserving order
  const activeWhere = andWhere({ isActive: true }, input.whereExtras);
  const inactiveWhere = andWhere(
    {
      isActive: false,
      orderItems: {
        some: { Order: { stripeSessionId: { not: null } } },
      },
    },
    input.whereExtras,
  );

  const [activeRows, inactiveRows] = await Promise.all([
    prisma.product.findMany({ where: activeWhere, ...args }),
    prisma.product.findMany({ where: inactiveWhere, ...args }),
  ]);

  return mergeByCreatedAtDesc(
    [...(activeRows as FeedProductRow[]), ...(inactiveRows as FeedProductRow[])],
    FEED_DB_PRODUCT_CAP,
  );
}
