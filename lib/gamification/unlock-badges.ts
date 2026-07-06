import { prisma } from '@/lib/prisma';
import { hcpLevelFromTotal } from '@/lib/gamification/hcp-level';
import { BADGE_ROW_META, type HcpV2BadgeSlug, HCP_V2_BADGE_SLUGS } from '@/lib/gamification/badge-rules';
import { isProfileCompleteForHcp, type ProfileFieldsForHcp } from '@/lib/gamification/profile-completeness';

export type UnlockedBadge = { slug: string; name: string };

async function ensureBadgeRow(slug: HcpV2BadgeSlug) {
  const meta = BADGE_ROW_META[slug];
  await prisma.badge.upsert({
    where: { slug },
    create: {
      slug,
      name: meta.name,
      description: meta.description,
      iconKey: meta.iconKey,
    },
    update: {
      name: meta.name,
      description: meta.description,
      iconKey: meta.iconKey,
    },
  });
}

async function hasUserBadge(userId: string, slug: string): Promise<boolean> {
  const row = await prisma.userBadge.findFirst({
    where: { userId, badge: { slug } },
    select: { id: true },
  });
  return Boolean(row);
}

async function tryAwardBadge(userId: string, slug: HcpV2BadgeSlug): Promise<UnlockedBadge | null> {
  await ensureBadgeRow(slug);
  const badge = await prisma.badge.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!badge) return null;
  try {
    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
    return { slug, name: badge.name };
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2002') return null;
    throw e;
  }
}

const PAID_ORDER_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

/**
 * Evaluate V3 badge rules from database truth. Idempotent (unique UserBadge).
 * Returns newly unlocked badges for toasts / notifications.
 */
export async function unlockBadgesForUser(userId: string): Promise<UnlockedBadge[]> {
  const unlocked: UnlockedBadge[] = [];

  const [
    user,
    stats,
    seller,
    dishCount,
    hasAccountCreatedEvent,
    hasProfileCompletedEvent,
    hasFirstSaleEvent,
    completedDealsTotal,
    completedDealsAsSeller,
    completedCourierAssignments,
    hasRepeatPartner,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        city: true,
        place: true,
        profileImage: true,
        image: true,
        createdAt: true,
        betaTesterJoinedAt: true,
      },
    }),
    prisma.userHcpStats.findUnique({
      where: { userId },
      select: { totalHcp: true, currentStreak: true, longestStreak: true },
    }),
    prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true },
    }),
    prisma.dish.count({ where: { userId, status: 'PUBLISHED' } }),
    prisma.hcpEvent.findFirst({
      where: { userId, action: 'ACCOUNT_CREATED' },
      select: { id: true },
    }),
    prisma.hcpEvent.findFirst({
      where: { userId, action: 'PROFILE_COMPLETED' },
      select: { id: true },
    }),
    prisma.hcpEvent.findFirst({
      where: { userId, action: 'FIRST_SALE' },
      select: { id: true },
    }),
    prisma.communityOrder.count({
      where: {
        status: 'COMPLETED',
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
    }),
    prisma.communityOrder.count({
      where: { sellerId: userId, status: 'COMPLETED' },
    }),
    prisma.courierAssignment.count({
      where: { courierId: userId, status: 'COMPLETED' },
    }),
    prisma.communityOrder
      .groupBy({
        by: ['buyerId'],
        where: { sellerId: userId, status: 'COMPLETED' },
        _count: { id: true },
      })
      .then((rows) => rows.some((r) => r._count.id >= 2))
      .then(async (asSeller) => {
        if (asSeller) return true;
        const asBuyer = await prisma.communityOrder.groupBy({
          by: ['sellerId'],
          where: { buyerId: userId, status: 'COMPLETED' },
          _count: { id: true },
        });
        return asBuyer.some((r) => r._count.id >= 2);
      }),
  ]);

  if (!user) return unlocked;

  const totalHcp = stats?.totalHcp ?? 0;
  const level = hcpLevelFromTotal(totalHcp);
  const streak = Math.max(stats?.currentStreak ?? 0, stats?.longestStreak ?? 0);

  const productCount = seller
    ? await prisma.product.count({ where: { sellerId: seller.id, isActive: true } })
    : 0;

  const [
    productImageCount,
    dishPhotoCount,
    workspacePhotoCount,
    productVideoCount,
    dishVideoCount,
    reviewCount,
    favCount,
    propsReceived,
    hasSellerPaidOrder,
  ] = await Promise.all([
    seller
      ? prisma.image.count({
          where: { Product: { sellerId: seller.id } },
        })
      : Promise.resolve(0),
    prisma.dishPhoto.count({
      where: { dish: { userId, status: 'PUBLISHED' } },
    }),
    prisma.workspaceContentPhoto.count({
      where: { workspaceContent: { sellerProfile: { userId } } },
    }),
    seller
      ? prisma.productVideo.count({
          where: { product: { sellerId: seller.id } },
        })
      : Promise.resolve(0),
    prisma.dishVideo.count({
      where: { dish: { userId, status: 'PUBLISHED' } },
    }),
    seller
      ? prisma.productReview.count({
          where: {
            product: { sellerId: seller.id },
            reviewSubmittedAt: { not: null },
            rating: { gt: 0 },
          },
        })
      : Promise.resolve(0),
    Promise.all([
      prisma.favorite.count({ where: { Dish: { userId } } }),
      seller
        ? prisma.favorite.count({
            where: { Product: { sellerId: seller.id } },
          })
        : Promise.resolve(0),
    ]).then(([a, b]) => a + b),
    prisma.workspaceContentProp.count({
      where: {
        workspaceContent: { sellerProfile: { userId } },
        userId: { not: userId },
      },
    }),
    seller
      ? prisma.orderItem
          .findFirst({
            where: {
              Product: { sellerId: seller.id },
              Order: { status: { in: [...PAID_ORDER_STATUSES] } },
            },
            select: { id: true },
          })
          .then(Boolean)
      : Promise.resolve(false),
  ]);

  const totalMediaCount =
    productImageCount + dishPhotoCount + workspacePhotoCount + productVideoCount + dishVideoCount;

  const hasFirstSale = Boolean(hasFirstSaleEvent || hasSellerPaidOrder);

  const profileFields: ProfileFieldsForHcp = {
    name: user.name,
    username: user.username,
    city: user.city,
    place: user.place,
    profileImage: user.profileImage,
    image: user.image,
  };
  const profileComplete = isProfileCompleteForHcp(profileFields) || Boolean(hasProfileCompletedEvent);

  const hasWelcomeSignal = Boolean(hasAccountCreatedEvent || totalHcp > 0);

  const checks: Array<[HcpV2BadgeSlug, boolean]> = [
    ['welkom-homecheff', hasWelcomeSignal],
    ['eerste-product', productCount >= 1],
    ['fotokoning', totalMediaCount >= 5],
    ['streak-starter', streak >= 7],
    ['eerste-review', reviewCount >= 1],
    ['eerste-verkoop', hasFirstSale],
    ['inspiratie-maker', dishCount >= 5],
    ['profiel-compleet', profileComplete],
    ['hcp-100', totalHcp >= 100],
    ['community-actief', favCount >= 5 || propsReceived >= 5],
    ['early-homecheff', level >= 4],
    ['beta-tester', Boolean(user.betaTesterJoinedAt)],
    ['eerste-afspraak', completedDealsTotal >= 1],
    ['betrouwbare-verkoper', completedDealsAsSeller >= 5],
    ['betrouwbare-bezorger', completedCourierAssignments >= 3],
    ['vaste-klant', hasRepeatPartner],
  ];

  for (const [slug, ok] of checks) {
    if (!ok) continue;
    if (!HCP_V2_BADGE_SLUGS.includes(slug)) continue;
    if (await hasUserBadge(userId, slug)) continue;
    const u = await tryAwardBadge(userId, slug);
    if (u) unlocked.push(u);
  }

  return unlocked;
}

/** Alias voor scripts en documentatie — zelfde pipeline als na elke `awardHcp`. */
export async function runBadgeEvaluationForUser(userId: string): Promise<UnlockedBadge[]> {
  return unlockBadgesForUser(userId);
}
