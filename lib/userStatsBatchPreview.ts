/**
 * Batch-compute user stats for feed statsPreview (eerste zichtbare verkopers).
 * Logica gelijk aan app/api/user/[userId]/stats/route.ts, met gefaseerde queries i.p.v. N× losse user-roundtrips.
 */

import { prisma } from "@/lib/prisma";
import type { UserStatsPayload } from "@/lib/userStatsClientCache";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function emptyStats(): UserStatsPayload {
  return {
    fansCount: 0,
    totalFavorites: 0,
    totalReviews: 0,
    averageRating: 0,
    totalViews: 0,
    totalProps: 0,
  };
}

/**
 * Retourneert stats per userId (alleen voor opgegeven ids).
 * Bij fout: leeg object (feed blijft werken zonder preview).
 */
export async function batchComputeUserStatsPreview(
  userIds: string[]
): Promise<Record<string, UserStatsPayload>> {
  const ids = [...new Set(userIds)].filter((id) => UUID_REGEX.test(id));
  if (ids.length === 0) return {};

  const out: Record<string, UserStatsPayload> = {};
  for (const id of ids) {
    out[id] = emptyStats();
  }

  try {
    const [products, dishes] = await Promise.all([
      prisma.product.findMany({
        where: { seller: { userId: { in: ids } }, isActive: true },
        select: { id: true, seller: { select: { userId: true } } },
      }),
      prisma.dish.findMany({
        where: { userId: { in: ids }, status: "PUBLISHED" },
        select: { id: true, userId: true },
      }),
    ]);

    const productToUser = new Map<string, string>();
    for (const p of products) {
      const uid = p.seller?.userId;
      if (uid) productToUser.set(p.id, uid);
    }
    const dishToUser = new Map<string, string>();
    for (const d of dishes) {
      dishToUser.set(d.id, d.userId);
    }

    const allProductIds = products.map((p) => p.id);
    const allDishIds = dishes.map((d) => d.id);
    const allItemIds = [...allProductIds, ...allDishIds];

    const [followGroups, favRows, prodReviews, dishReviews, viewGroups] =
      await Promise.all([
        prisma.follow.groupBy({
          by: ["sellerId"],
          where: { sellerId: { in: ids } },
          _count: { _all: true },
        }),
        (() => {
          type FavOr = { productId: { in: string[] } } | { dishId: { in: string[] } } | { listingId: { in: string[] } };
          const or: FavOr[] = [];
          if (allProductIds.length > 0) {
            or.push({ productId: { in: allProductIds } });
          }
          if (allDishIds.length > 0) {
            or.push({ dishId: { in: allDishIds } });
            or.push({ listingId: { in: allDishIds } });
          }
          if (or.length === 0) return Promise.resolve([]);
          return prisma.favorite.findMany({
            where: { OR: or },
            select: { productId: true, dishId: true, listingId: true },
          });
        })(),
        allProductIds.length > 0
          ? prisma.productReview.findMany({
              where: { productId: { in: allProductIds } },
              select: { productId: true, rating: true },
            })
          : Promise.resolve([]),
        allDishIds.length > 0
          ? prisma.dishReview.findMany({
              where: { dishId: { in: allDishIds } },
              select: { dishId: true, rating: true },
            })
          : Promise.resolve([]),
        allItemIds.length > 0
          ? prisma.analyticsEvent.groupBy({
              by: ["entityId"],
              where: {
                entityId: { in: allItemIds },
                eventType: { in: ["VIEW", "PRODUCT_VIEW"] },
                entityType: { in: ["PRODUCT", "DISH"] },
              },
              _count: { _all: true },
            })
          : Promise.resolve([]),
      ]);

    for (const row of followGroups) {
      const u = out[row.sellerId];
      if (u) u.fansCount = row._count._all;
    }

    for (const f of favRows) {
      if (f.productId) {
        const uid = productToUser.get(f.productId);
        if (uid && out[uid]) {
          out[uid].totalFavorites += 1;
          out[uid].totalProps += 1;
        }
      }
      if (f.dishId) {
        const uid = dishToUser.get(f.dishId);
        if (uid && out[uid]) {
          out[uid].totalProps += 1;
        }
      }
      if (f.listingId) {
        const uid = dishToUser.get(f.listingId);
        if (uid && out[uid]) {
          out[uid].totalFavorites += 1;
        }
      }
    }

    type ReviewAgg = { sum: number; count: number };
    const reviewAgg = new Map<string, ReviewAgg>();
    function addReview(uid: string, rating: number) {
      let a = reviewAgg.get(uid);
      if (!a) {
        a = { sum: 0, count: 0 };
        reviewAgg.set(uid, a);
      }
      a.sum += rating;
      a.count += 1;
    }

    for (const r of prodReviews) {
      const uid = productToUser.get(r.productId);
      if (uid) addReview(uid, r.rating ?? 0);
    }
    for (const r of dishReviews) {
      const uid = dishToUser.get(r.dishId);
      if (uid) addReview(uid, r.rating ?? 0);
    }

    for (const id of ids) {
      const a = reviewAgg.get(id);
      const u = out[id];
      if (u && a && a.count > 0) {
        u.totalReviews = a.count;
        u.averageRating = Math.round((a.sum / a.count) * 10) / 10;
      }
    }

    for (const g of viewGroups) {
      const uid =
        productToUser.get(g.entityId) ?? dishToUser.get(g.entityId);
      if (uid && out[uid]) {
        out[uid].totalViews += g._count._all;
      }
    }

    return out;
  } catch (e) {
    console.error("[batchComputeUserStatsPreview]", e);
    return {};
  }
}
