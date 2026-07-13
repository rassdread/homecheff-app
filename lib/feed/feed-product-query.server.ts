/**
 * Phase 3E+ — Product IDs-first pipeline (semantics-preserving).
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { FEED_DB_PRODUCT_CAP } from '@/lib/feed/feed-candidate-window';
import {
  batchHydrateFeedSellers,
  type FeedSellerHydrated,
} from '@/lib/feed/feed-seller-hydration.server';

export type FeedProductQueryStrategy =
  | 'or_single'
  | 'split_or'
  | 'trimmed_or'
  | 'ids_first';

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

export type FeedProductIdsFirstTiming = {
  idsMs: number;
  hydrateMs: number;
  sellerHydrateMs: number;
};

const PRODUCT_ID_SELECT = {
  id: true,
  createdAt: true,
  isActive: true,
  sellerId: true,
  priceCents: true,
  orderMethod: true,
  _count: { select: { Image: true } },
  seller: {
    select: {
      User: { select: { stripeConnectAccountId: true } },
    },
  },
} satisfies Prisma.ProductSelect;

const PRODUCT_BODY_SELECT = {
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
  sellerId: true,
  Image: {
    select: { sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
  },
  Video: {
    select: { url: true, thumbnail: true },
  },
} satisfies Prisma.ProductSelect;

export const FEED_PRODUCT_SELECT: Prisma.ProductSelect = {
  ...PRODUCT_BODY_SELECT,
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
};

type ProductIdRow = {
  id: string;
  createdAt: Date;
  isActive: boolean;
  sellerId: string;
  priceCents: number;
  orderMethod: string;
  _count: { Image: number };
  seller: { User: { stripeConnectAccountId: string | null } | null } | null;
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

function andWhere(
  base: Prisma.ProductWhereInput,
  extras?: Prisma.ProductWhereInput,
): Prisma.ProductWhereInput {
  if (!extras || Object.keys(extras).length === 0) return base;
  return { AND: [base, extras] };
}

function mergeIdRowsByCreatedAtDesc(
  rows: ProductIdRow[],
  cap: number,
): ProductIdRow[] {
  const seen = new Set<string>();
  const out: ProductIdRow[] = [];
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

async function fetchProductIdRows(
  prisma: PrismaClient,
  whereExtras?: Prisma.ProductWhereInput,
): Promise<ProductIdRow[]> {
  const idArgs = {
    orderBy: [{ createdAt: 'desc' as const }],
    take: FEED_DB_PRODUCT_CAP,
    select: PRODUCT_ID_SELECT,
  };
  const activeWhere = andWhere({ isActive: true }, whereExtras);
  const inactiveWhere = andWhere(
    {
      isActive: false,
      orderItems: {
        some: { Order: { stripeSessionId: { not: null } } },
      },
    },
    whereExtras,
  );

  const [activeRows, inactiveRows] = await Promise.all([
    prisma.product.findMany({ where: activeWhere, ...idArgs }),
    prisma.product.findMany({ where: inactiveWhere, ...idArgs }),
  ]);

  return mergeIdRowsByCreatedAtDesc(
    [...(activeRows as ProductIdRow[]), ...(inactiveRows as ProductIdRow[])],
    FEED_DB_PRODUCT_CAP,
  );
}

function attachSeller(
  sellerId: string,
  sellers: Map<string, FeedSellerHydrated>,
): FeedProductRow['seller'] {
  const s = sellers.get(sellerId);
  if (!s) return null;
  return {
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    kvk: s.kvk,
    companyName: s.companyName,
    User: s.User,
  };
}

async function hydrateProductsIdsFirst(
  prisma: PrismaClient,
  idRows: ProductIdRow[],
): Promise<{ rows: FeedProductRow[]; timing: FeedProductIdsFirstTiming }> {
  const idsStart = performance.now();
  const orderedIds = idRows.map((r) => r.id);
  const idsMs = Math.round(performance.now() - idsStart);

  if (orderedIds.length === 0) {
    return {
      rows: [],
      timing: { idsMs, hydrateMs: 0, sellerHydrateMs: 0 },
    };
  }

  const hydrateStart = performance.now();
  const bodies = await prisma.product.findMany({
    where: { id: { in: orderedIds } },
    select: PRODUCT_BODY_SELECT,
  });
  const hydrateMs = Math.round(performance.now() - hydrateStart);

  const sellerHydrateStart = performance.now();
  const sellerIds = [...new Set(bodies.map((b) => b.sellerId))];
  const sellers = await batchHydrateFeedSellers(prisma, sellerIds);
  const sellerHydrateMs = Math.round(performance.now() - sellerHydrateStart);

  const bodyById = new Map(bodies.map((b) => [b.id, b]));
  const rows: FeedProductRow[] = [];
  for (const id of orderedIds) {
    const body = bodyById.get(id);
    if (!body) continue;
    rows.push({
      id: body.id,
      title: body.title,
      description: body.description,
      priceCents: body.priceCents,
      orderMethod: body.orderMethod,
      acceptHomeCheffPayment: body.acceptHomeCheffPayment,
      acceptDirectContact: body.acceptDirectContact,
      listingIntent: body.listingIntent,
      priceModel: body.priceModel,
      delivery: body.delivery,
      category: body.category,
      marketplaceCategory: body.marketplaceCategory,
      specializations: body.specializations,
      acceptedSpecializations: body.acceptedSpecializations,
      subcategory: body.subcategory,
      barterOpenness: body.barterOpenness,
      createdAt: body.createdAt,
      pickupAddress: body.pickupAddress,
      pickupLat: body.pickupLat,
      pickupLng: body.pickupLng,
      seller: attachSeller(body.sellerId, sellers),
      Image: body.Image,
      Video: body.Video,
    });
  }

  return {
    rows,
    timing: { idsMs, hydrateMs, sellerHydrateMs },
  };
}

export type FeedProductQueryInput = {
  whereExtras?: Prisma.ProductWhereInput;
  strategy?: FeedProductQueryStrategy;
};

export type FeedProductQueryResult = {
  rows: FeedProductRow[];
  idsFirstTiming?: FeedProductIdsFirstTiming;
  /** Image count from ID phase (for linked-donor detection before full hydrate). */
  imageCountById?: Map<string, number>;
};

export async function fetchFeedProductIdRows(
  prisma: PrismaClient,
  whereExtras?: Prisma.ProductWhereInput,
): Promise<{
  idRows: ProductIdRow[];
  imageCountById: Map<string, number>;
}> {
  const idRows = await fetchProductIdRows(prisma, whereExtras);
  const imageCountById = new Map(idRows.map((r) => [r.id, r._count.Image]));
  return { idRows, imageCountById };
}

export async function hydrateFeedProductsFromIdRows(
  prisma: PrismaClient,
  idRows: ProductIdRow[],
): Promise<{ rows: FeedProductRow[]; timing: FeedProductIdsFirstTiming }> {
  return hydrateProductsIdsFirst(prisma, idRows);
}

export async function fetchFeedProducts(
  prisma: PrismaClient,
  input: FeedProductQueryInput = {},
): Promise<FeedProductQueryResult> {
  const strategy =
    input.strategy ??
    (process.env.FEED_PRODUCT_QUERY_STRATEGY as FeedProductQueryStrategy | undefined) ??
    'ids_first';

  if (strategy === 'ids_first') {
    const { idRows, imageCountById } = await fetchFeedProductIdRows(
      prisma,
      input.whereExtras,
    );
    const { rows, timing } = await hydrateFeedProductsFromIdRows(prisma, idRows);
    return { rows, idsFirstTiming: timing, imageCountById };
  }

  const where = andWhere(baseVisibilityWhere(), input.whereExtras);
  const args = {
    orderBy: [{ createdAt: 'desc' as const }],
    take: FEED_DB_PRODUCT_CAP,
    select: FEED_PRODUCT_SELECT,
  };

  if (strategy === 'or_single' || strategy === 'trimmed_or') {
    const rows = (await prisma.product.findMany({
      where,
      ...args,
    })) as FeedProductRow[];
    return { rows };
  }

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

  const merged = mergeLegacyRows(
    [...(activeRows as FeedProductRow[]), ...(inactiveRows as FeedProductRow[])],
    FEED_DB_PRODUCT_CAP,
  );
  return { rows: merged };
}

function mergeLegacyRows(
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

/** Stripe gate row from ID-phase (minimal). */
export type FeedProductStripeIdRow = {
  priceCents: number | null;
  orderMethod?: string | null;
  seller?: { User?: { stripeConnectAccountId?: string | null } | null } | null;
};

export function productIdRowToStripeRow(row: ProductIdRow): FeedProductStripeIdRow {
  return {
    priceCents: row.priceCents,
    orderMethod: row.orderMethod,
    seller: row.seller,
  };
}

export function productImageCountFromIdPhase(
  imageCountById: Map<string, number> | undefined,
  productId: string,
  hydratedImageLength: number,
): number {
  if (imageCountById?.has(productId)) {
    return imageCountById.get(productId) ?? 0;
  }
  return hydratedImageLength;
}
