/**
 * Server-side fetch van inspiratie-items. Zelfde logica als /api/inspiratie.
 * Gebruikt o.a. op de homepage zodat de feed direct met data wordt geserveerd (geen lege skeleton).
 */
import { prisma } from '@/lib/prisma';

export type GetInspiratieOptions = {
  category?: string | null;
  subcategory?: string | null;
  region?: string | null;
  sortBy?: string;
  take?: number;
  skip?: number;
};

export async function getInspiratieItems(options: GetInspiratieOptions = {}) {
  const { category = 'all', subcategory, region = 'all', sortBy = 'newest', take = 24, skip = 0 } = options;
  const where: Record<string, unknown> = { status: 'PUBLISHED' };
  if (category && category !== 'all') where.category = category;
  if (subcategory) where.subcategory = subcategory;
  if (region && region !== 'all') where.tags = { has: region };

  const dishes = await prisma.dish.findMany({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      subcategory: true,
      status: true,
      createdAt: true,
      tags: true,
      lat: true,
      lng: true,
      place: true,
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
          displayFullName: true,
          displayNameOption: true,
          lat: true,
          lng: true,
          place: true,
        },
      },
      photos: {
        select: { id: true, url: true, idx: true },
        orderBy: { idx: 'asc' as const },
      },
      videos: {
        select: { id: true, url: true, thumbnail: true, duration: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

  if (dishes.length === 0) return { items: [] };

  const dishIds = dishes.map((d) => d.id);
  const [viewCounts, propsCounts, reviewCounts, avgRatings] = await Promise.all([
    prisma.analyticsEvent.groupBy({
      by: ['entityId'],
      where: { entityId: { in: dishIds }, eventType: 'VIEW', entityType: 'DISH' },
      _count: { entityId: true },
    }).catch(() => []),
    prisma.favorite.groupBy({
      by: ['dishId'],
      where: { dishId: { in: dishIds } },
      _count: { dishId: true },
    }).catch(() => []),
    prisma.dishReview.groupBy({
      by: ['dishId'],
      where: { dishId: { in: dishIds } },
      _count: { dishId: true },
    }).catch(() => []),
    prisma.dishReview.groupBy({
      by: ['dishId'],
      where: { dishId: { in: dishIds } },
      _avg: { rating: true },
    }).catch(() => []),
  ]);

  const viewCountMap = new Map<string, number>();
  viewCounts.forEach((item: { entityId: string; _count: { entityId: number } }) => viewCountMap.set(item.entityId, item._count.entityId));
  const propsCountMap = new Map<string, number>();
  (propsCounts as Array<{ dishId: string; _count: { dishId: number } }>).forEach((item) => { if (item.dishId) propsCountMap.set(item.dishId, item._count.dishId); });
  const reviewCountMap = new Map<string, number>();
  reviewCounts.forEach((item: { dishId: string; _count: { dishId: number } }) => reviewCountMap.set(item.dishId, item._count.dishId));
  const avgRatingMap = new Map<string, number>();
  avgRatings.forEach((item: { dishId: string; _avg: { rating: number | null } }) => { if (item._avg?.rating) avgRatingMap.set(item.dishId, Math.round(item._avg.rating * 10) / 10); });

  let items = dishes.map((dish) => ({
    id: dish.id,
    title: dish.title,
    description: dish.description,
    category: dish.category,
    subcategory: dish.subcategory,
    status: dish.status,
    tags: dish.tags || [],
    createdAt: dish.createdAt.toISOString(),
    viewCount: viewCountMap.get(dish.id) || 0,
    propsCount: propsCountMap.get(dish.id) || 0,
    reviewCount: reviewCountMap.get(dish.id) || 0,
    averageRating: avgRatingMap.get(dish.id) || 0,
    location: {
      lat: dish.lat ?? dish.user.lat ?? null,
      lng: dish.lng ?? dish.user.lng ?? null,
      place: dish.place ?? dish.user.place ?? null,
    },
    user: {
      id: dish.user.id,
      name: dish.user.name,
      username: dish.user.username,
      profileImage: dish.user.image,
      displayFullName: dish.user.displayFullName,
      displayNameOption: dish.user.displayNameOption,
    },
    photos: dish.photos.map((p) => ({ id: p.id, url: p.url, isMain: p.idx === 0 })),
    videos: dish.videos?.length ? dish.videos.map((v) => ({ id: v.id, url: v.url, thumbnail: v.thumbnail ?? null, duration: v.duration ?? null, autoplay: true })) : [],
  }));

  if (sortBy === 'popular') {
    items.sort((a, b) => {
      const ap = a.viewCount + (a.propsCount * 2) + (a.reviewCount * 3) + (a.averageRating * 10);
      const bp = b.viewCount + (b.propsCount * 2) + (b.reviewCount * 3) + (b.averageRating * 10);
      if (ap !== bp) return bp - ap;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } else {
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return { items };
}
