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

/**
 * Evaluate V2 badge rules once. Idempotent (unique UserBadge).
 * Returns newly unlocked badges for toasts / notifications.
 */
export async function unlockBadgesForUser(userId: string): Promise<UnlockedBadge[]> {
  const unlocked: UnlockedBadge[] = [];

  const [user, stats, seller, dishCount, hcpEvents] = await Promise.all([
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
    prisma.hcpEvent.findMany({
      where: { userId, action: { in: ['FIRST_SALE', 'PROFILE_COMPLETED'] } },
      select: { action: true },
      take: 20,
    }),
  ]);

  if (!user) return unlocked;

  const totalHcp = stats?.totalHcp ?? 0;
  const level = hcpLevelFromTotal(totalHcp);
  const streak = Math.max(stats?.currentStreak ?? 0, stats?.longestStreak ?? 0);

  const productCount = seller
    ? await prisma.product.count({ where: { sellerId: seller.id, isActive: true } })
    : 0;

  const productImageCount = seller
    ? await prisma.image.count({
        where: { product: { sellerId: seller.id } },
      })
    : 0;

  const reviewCount = seller
    ? await prisma.productReview.count({
        where: {
          product: { sellerId: seller.id },
          reviewSubmittedAt: { not: null },
          rating: { gt: 0 },
        },
      })
    : 0;

  const favCount =
    (await prisma.favorite.count({ where: { dish: { userId } } })) +
    (seller
      ? await prisma.favorite.count({
          where: { product: { sellerId: seller.id } },
        })
      : 0);

  const hasFirstSale = hcpEvents.some((e) => e.action === 'FIRST_SALE');
  const hasProfileCompleted = hcpEvents.some((e) => e.action === 'PROFILE_COMPLETED');

  const profileFields: ProfileFieldsForHcp = {
    name: user.name,
    username: user.username,
    city: user.city,
    place: user.place,
    profileImage: user.profileImage,
    image: user.image,
  };
  const profileComplete = isProfileCompleteForHcp(profileFields) || hasProfileCompleted;

  const checks: Array<[HcpV2BadgeSlug, boolean]> = [
    ['eerste-product', productCount >= 1],
    ['fotokoning', productImageCount >= 5],
    ['streak-starter', streak >= 7],
    ['eerste-review', reviewCount >= 1],
    ['eerste-verkoop', hasFirstSale],
    ['inspiratie-maker', dishCount >= 5],
    ['profiel-compleet', profileComplete],
    ['hcp-100', totalHcp >= 100],
    ['community-actief', favCount >= 5],
    ['early-homecheff', level >= 4],
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
