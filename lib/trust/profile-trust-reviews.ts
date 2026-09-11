import { prisma } from '@/lib/prisma';

export type TrustReviewImage = {
  id: string;
  url: string;
  sortOrder: number;
};

export type TrustReviewItem = {
  id: string;
  channel: 'product' | 'deal' | 'courier';
  rating: number;
  title: string | null;
  /** Written review body (ProductReview.comment / DealReview.message / DeliveryReview.comment). */
  text: string | null;
  createdAt: string;
  isVerified: boolean;
  listingTitle: string | null;
  listingId: string | null;
  reviewer: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  images: TrustReviewImage[];
};

export type ProfileTrustReviewsPayload = {
  reviews: TrustReviewItem[];
  nextCursor: string | null;
  totals: {
    product: number;
    deal: number;
    courier: number;
  };
};

const DEFAULT_TAKE = 20;

/**
 * Public trust reviews for a profile user — submitted reviews only, with text + photos.
 * No private order amounts/addresses.
 */
export async function getProfileTrustReviews(
  userId: string,
  opts: { take?: number; cursor?: string | null } = {},
): Promise<ProfileTrustReviewsPayload> {
  const take = Math.min(Math.max(opts.take ?? DEFAULT_TAKE, 1), 50);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      SellerProfile: { select: { id: true } },
      DeliveryProfile: { select: { id: true } },
    },
  });

  if (!user) {
    return {
      reviews: [],
      nextCursor: null,
      totals: { product: 0, deal: 0, courier: 0 },
    };
  }

  const sellerId = user.SellerProfile?.id ?? null;
  const deliveryProfileId = user.DeliveryProfile?.id ?? null;

  const [productRows, dealRows, courierRows, productCount, dealCount, courierCount] =
    await Promise.all([
      sellerId
        ? prisma.productReview.findMany({
            where: {
              product: { sellerId },
              reviewSubmittedAt: { not: null },
              rating: { gt: 0 },
            },
            include: {
              buyer: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profileImage: true,
                  image: true,
                },
              },
              product: { select: { id: true, title: true } },
              images: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, sortOrder: true } },
            },
            orderBy: { reviewSubmittedAt: 'desc' },
            take: take + 5,
          })
        : Promise.resolve([]),
      prisma.dealReview.findMany({
        where: { revieweeId: userId, rating: { gt: 0 } },
        include: {
          Reviewer: {
            select: {
              id: true,
              name: true,
              username: true,
              profileImage: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: take + 5,
      }),
      deliveryProfileId
        ? prisma.deliveryReview.findMany({
            where: { deliveryProfileId, rating: { gt: 0 } },
            include: {
              reviewer: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  profileImage: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: take + 5,
          })
        : Promise.resolve([]),
      sellerId
        ? prisma.productReview.count({
            where: {
              product: { sellerId },
              reviewSubmittedAt: { not: null },
              rating: { gt: 0 },
            },
          })
        : Promise.resolve(0),
      prisma.dealReview.count({ where: { revieweeId: userId, rating: { gt: 0 } } }),
      deliveryProfileId
        ? prisma.deliveryReview.count({
            where: { deliveryProfileId, rating: { gt: 0 } },
          })
        : Promise.resolve(0),
    ]);

  const mapped: TrustReviewItem[] = [
    ...productRows.map((r) => ({
      id: r.id,
      channel: 'product' as const,
      rating: r.rating,
      title: r.title,
      text: r.comment?.trim() ? r.comment.trim() : null,
      createdAt: (r.reviewSubmittedAt ?? r.createdAt).toISOString(),
      isVerified: Boolean(r.isVerified),
      listingTitle: r.product?.title ?? null,
      listingId: r.product?.id ?? null,
      reviewer: {
        id: r.buyer.id,
        name: r.buyer.name,
        username: r.buyer.username,
        image: r.buyer.profileImage || r.buyer.image,
      },
      images: r.images.map((img) => ({
        id: img.id,
        url: img.url,
        sortOrder: img.sortOrder,
      })),
    })),
    ...dealRows.map((r) => ({
      id: r.id,
      channel: 'deal' as const,
      rating: r.rating,
      title: r.title,
      text: r.message?.trim() ? r.message.trim() : null,
      createdAt: r.createdAt.toISOString(),
      isVerified: true,
      listingTitle: null,
      listingId: null,
      reviewer: {
        id: r.Reviewer.id,
        name: r.Reviewer.name,
        username: r.Reviewer.username,
        image: r.Reviewer.profileImage || r.Reviewer.image,
      },
      images: [] as TrustReviewImage[],
    })),
    ...courierRows.map((r) => ({
      id: r.id,
      channel: 'courier' as const,
      rating: r.rating,
      title: null,
      text: r.comment?.trim() ? r.comment.trim() : null,
      createdAt: r.createdAt.toISOString(),
      isVerified: true,
      listingTitle: null,
      listingId: null,
      reviewer: {
        id: r.reviewer.id,
        name: r.reviewer.name,
        username: r.reviewer.username,
        image: r.reviewer.profileImage || r.reviewer.image,
      },
      images: [] as TrustReviewImage[],
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  let start = 0;
  if (opts.cursor) {
    const idx = mapped.findIndex((r) => r.id === opts.cursor);
    start = idx >= 0 ? idx + 1 : 0;
  }
  const page = mapped.slice(start, start + take);
  const nextCursor =
    start + take < mapped.length ? page[page.length - 1]?.id ?? null : null;

  return {
    reviews: page,
    nextCursor,
    totals: {
      product: productCount,
      deal: dealCount,
      courier: courierCount,
    },
  };
}
