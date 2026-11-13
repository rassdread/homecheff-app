/**
 * Server-side fetch van inspiratie-items. Zelfde logica als /api/inspiratie.
 * Gebruikt o.a. op de homepage zodat de feed direct met data wordt geserveerd (geen lege skeleton).
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { fetchAuthorBadgeSummariesByUserIds } from '@/lib/gamification/author-badge-summaries';
import { buildDishTextSearchWhere } from '@/lib/search';
import {
  discoveryEnrichmentFromBundle,
  fetchSellerTrustBundles,
  mapDishToDiscoveryReadModel,
} from '@/lib/discovery';
import { INSPIRATION_LISTING_KIND } from '@/lib/marketplace/contracts/listing-kind-contract';
import { inspirationEligibleForFeedScope } from '@/lib/feed/feed-composition-policy';
import {
  INSPIRATION_FEED_PAGE_TAKE,
  decodeInspirationCursor,
  encodeInspirationCursor,
} from '@/lib/feed/inspiration-feed-page';

export type GetInspiratieOptions = {
  category?: string | null;
  subcategory?: string | null;
  region?: string | null;
  sortBy?: string;
  take?: number;
  skip?: number;
  q?: string | null;
  /** Feed discovery scope. When set, pagination is a keyset cursor instead of skip. */
  feedScope?: 'nearby' | 'national' | 'international' | null;
  cursor?: string | null;
  viewerLat?: number | null;
  viewerLng?: number | null;
  radiusKm?: number | null;
};

export async function getInspiratieItems(options: GetInspiratieOptions = {}) {
  const { category = 'all', subcategory, region = 'all', sortBy = 'newest', take = 24, skip = 0, q } = options;
  const where: Prisma.DishWhereInput = { status: 'PUBLISHED' };
  if (category && category !== 'all') where.category = category;
  if (subcategory) where.subcategory = subcategory;
  if (region && region !== 'all') where.tags = { has: region };
  if (q?.trim()) Object.assign(where, buildDishTextSearchWhere(q.trim()));

  const discoveryScope = options.feedScope;
  const pageTake = discoveryScope
    ? Math.min(Math.max(take || INSPIRATION_FEED_PAGE_TAKE, 1), INSPIRATION_FEED_PAGE_TAKE)
    : take;
  let hasMore = false;
  let nextCursor: string | null = null;

  const dishSelect = {
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
  };

  let dishes;
  if (discoveryScope) {
    const cursor = decodeInspirationCursor(options.cursor);
    const keyset = cursor
      ? {
          OR: [
            { createdAt: { lt: new Date(cursor.createdAt) } },
            {
              AND: [
                { createdAt: new Date(cursor.createdAt) },
                { id: { lt: cursor.id } },
              ],
            },
          ],
        }
      : null;
    const scanned = await prisma.dish.findMany({
      where: keyset ? { AND: [where, keyset] } : where,
      select: dishSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: pageTake + 1,
    });
    hasMore = scanned.length > pageTake;
    const window = hasMore ? scanned.slice(0, pageTake) : scanned;
    const last = window[window.length - 1];
    nextCursor =
      hasMore && last
        ? encodeInspirationCursor({
            createdAt: last.createdAt.toISOString(),
            id: last.id,
          })
        : null;
    const viewer =
      typeof options.viewerLat === 'number' &&
      typeof options.viewerLng === 'number'
        ? { lat: options.viewerLat, lng: options.viewerLng }
        : null;
    dishes = window.filter((dish) => {
      const lat = dish.lat ?? dish.user.lat ?? null;
      const lng = dish.lng ?? dish.user.lng ?? null;
      return inspirationEligibleForFeedScope({
        scope: discoveryScope,
        item: {
          lat,
          lng,
          place: dish.place ?? dish.user.place ?? null,
        },
        viewer,
        radiusKm: options.radiusKm ?? 0,
      });
    });
  } else {
    const scanned = await prisma.dish.findMany({
      where,
      select: dishSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageTake + 1,
    });
    hasMore = scanned.length > pageTake;
    dishes = hasMore ? scanned.slice(0, pageTake) : scanned;
  }

  if (dishes.length === 0) return { items: [], hasMore, nextCursor };

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
    listingKind: INSPIRATION_LISTING_KIND,
    listingIntent: null,
    marketplaceCategory: null,
    specializations: [] as string[],
    entityType: 'dish' as const,
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

  const authorIds: string[] = [];
  const seenAuthorIds = new Set<string>();
  for (const item of items) {
    const authorId = item.user.id;
    if (typeof authorId !== 'string' || seenAuthorIds.has(authorId)) continue;
    seenAuthorIds.add(authorId);
    authorIds.push(authorId);
  }
  const badgeMap = await fetchAuthorBadgeSummariesByUserIds(authorIds, 2);
  const trustBundles = await fetchSellerTrustBundles(authorIds, badgeMap);
  items = items.map((it) => ({
    ...it,
    discovery: mapDishToDiscoveryReadModel({
      id: it.id,
      title: it.title,
      description: it.description,
      category: it.category,
      subcategory: it.subcategory,
      status: it.status,
      place: it.location.place,
      photos: it.photos.map((photo) => ({ url: photo.url })),
      videos: it.videos.map((video) => ({ url: video.url })),
    }, {
      favoriteCount: it.propsCount,
      ...discoveryEnrichmentFromBundle(trustBundles.get(it.user.id), {
        listingIsActive: it.status !== 'PRIVATE',
      }),
    }),
    user: {
      ...it.user,
      badges: badgeMap.get(it.user.id) ?? [],
    },
  }));

  return { items, hasMore, nextCursor };
}
