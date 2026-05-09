/**
 * Idempotent backfill of HomeCheff Points (HCP) from existing data.
 * Only creates HcpEvent / UserHcpStats via the same server helpers as production (no deletes or updates to business tables).
 *
 * Usage: npx tsx scripts/backfill-hcp.ts
 */
import { prisma } from '@/lib/prisma';
import { tryAwardAccountCreated } from '@/lib/gamification/award-account-created';
import { awardProductLifecycleHcp } from '@/lib/gamification/product-hcp';
import { tryAwardReviewReceivedHcp } from '@/lib/gamification/review-hcp';
import { tryAwardProfileCompleted } from '@/lib/gamification/profile-hcp';
import { tryAwardFirstSaleForSeller } from '@/lib/gamification/award-first-sale';
import {
  awardDishInspirationContentHcp,
  awardWorkspaceContentHcp,
  getDishContentMetrics,
  getWorkspaceContentMetrics,
} from '@/lib/gamification/content-hcp';

const PAID_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

async function main() {
  const startEvents = await prisma.hcpEvent.count();
  const startStatsRows = await prisma.userHcpStats.count();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      city: true,
      place: true,
      profileImage: true,
      image: true,
    },
  });

  for (const u of users) {
    await tryAwardAccountCreated(u.id).catch(() => {});
    await tryAwardProfileCompleted(u.id, {
      name: u.name,
      username: u.username,
      city: u.city,
      place: u.place,
      profileImage: u.profileImage,
      image: u.image,
    }).catch(() => {});
  }

  const products = await prisma.product.findMany({
    include: {
      Image: true,
      seller: { select: { userId: true } },
    },
  });

  for (const p of products) {
    const sellerUserId = p.seller?.userId;
    if (!sellerUserId) continue;
    await awardProductLifecycleHcp(sellerUserId, p.id, p.Image?.length ?? 0).catch(() => {});
  }

  const reviews = await prisma.productReview.findMany({
    where: {
      reviewSubmittedAt: { not: null },
      rating: { gt: 0 },
    },
    include: {
      product: {
        include: {
          seller: { select: { userId: true } },
        },
      },
    },
  });

  for (const r of reviews) {
    await tryAwardReviewReceivedHcp(r.product?.seller?.userId, r.id).catch(() => {});
  }

  const inspirationDishes = await prisma.dish.findMany({
    select: { id: true, userId: true },
  });
  for (const d of inspirationDishes) {
    const m = await getDishContentMetrics(d.id);
    await awardDishInspirationContentHcp(d.userId, d.id, m.imageLikeCount, m.hasVideo).catch(() => {});
  }

  const workspacePosts = await prisma.workspaceContent.findMany({
    include: { sellerProfile: { select: { userId: true } } },
  });
  for (const w of workspacePosts) {
    const uid = w.sellerProfile?.userId;
    if (!uid) continue;
    const m = await getWorkspaceContentMetrics(w.id);
    await awardWorkspaceContentHcp(uid, w.id, m.imageLikeCount, m.hasVideo).catch(() => {});
  }

  const sellerProfiles = await prisma.sellerProfile.findMany({
    select: { userId: true },
  });

  for (const sp of sellerProfiles) {
    const firstOrder = await prisma.order.findFirst({
      where: {
        status: { in: [...PAID_STATUSES] },
        items: {
          some: {
            Product: {
              seller: { userId: sp.userId },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (firstOrder) {
      await tryAwardFirstSaleForSeller(sp.userId, firstOrder.id).catch(() => {});
    }
  }

  const endEvents = await prisma.hcpEvent.count();
  const endStatsRows = await prisma.userHcpStats.count();
  const totals = await prisma.userHcpStats.aggregate({ _sum: { totalHcp: true } });

  console.log('[backfill-hcp] complete', {
    users: users.length,
    products: products.length,
    reviews: reviews.length,
    inspirationDishes: inspirationDishes.length,
    workspaceContent: workspacePosts.length,
    sellersChecked: sellerProfiles.length,
    hcpEventsBefore: startEvents,
    hcpEventsAfter: endEvents,
    userHcpStatsRowsBefore: startStatsRows,
    userHcpStatsRowsAfter: endStatsRows,
    sumTotalHcpAcrossUsers: totals._sum.totalHcp ?? 0,
  });
}

main()
  .catch((e) => {
    console.error('[backfill-hcp] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
