import type { UserHcpReward } from '@prisma/client';
import { HcpRewardStatus } from '@prisma/client';
import type { GamificationRewardDto } from '@/lib/gamification/gamification-me-types';
import { HCP_V2_REWARD_CATALOG } from '@/lib/gamification/v2-reward-catalog';
import { HCP_REWARD_SLUGS } from '@/lib/gamification/hcp-rewards-engine';

function eligibilityHints(totalHcp: number, weeklyRank: number | null, streakMax: number) {
  return {
    profileBoost: totalHcp >= 500,
    featured: totalHcp >= 1000,
    weeklyTop3: weeklyRank != null && weeklyRank <= 3,
    streak30: streakMax >= 30,
  };
}

function slugForCatalogId(id: string): string | null {
  const map: Record<string, string> = {
    'boost-500': HCP_REWARD_SLUGS.PROFILE_BOOST_500,
    'featured-1000': HCP_REWARD_SLUGS.FEATURED_CREATOR_1000,
    'weekly-top3': HCP_REWARD_SLUGS.WEEKLY_SPOTLIGHT_TOP3,
    'streak-30': HCP_REWARD_SLUGS.STREAK_GLOW_30,
  };
  return map[id] ?? null;
}

function displayStatusForRow(
  row: UserHcpReward | undefined,
  eligible: boolean,
  now: Date
): GamificationRewardDto['displayStatus'] {
  if (!row) {
    return eligible ? 'unlocked' : 'locked';
  }
  if (row.status === HcpRewardStatus.EXPIRED) return 'expired';
  if (row.expiresAt && row.expiresAt <= now) return 'expired';
  if (row.status === HcpRewardStatus.ACTIVE) return 'active';
  return 'coming_soon';
}

/** Bouwt stabiele reward-DTO’s voor `/api/gamification/me` (catalog + DB). */
export function buildGamificationRewardsDto(opts: {
  totalHcp: number;
  weeklyRank: number | null;
  currentStreak: number;
  longestStreak: number;
  dbRewards: UserHcpReward[];
}): GamificationRewardDto[] {
  const now = new Date();
  const streakMax = Math.max(opts.currentStreak, opts.longestStreak);
  const elig = eligibilityHints(opts.totalHcp, opts.weeklyRank, streakMax);
  const bySlug = new Map(opts.dbRewards.map((r) => [r.slug, r]));

  const eligForSlug = (slug: string): boolean => {
    if (slug === HCP_REWARD_SLUGS.PROFILE_BOOST_500) return elig.profileBoost;
    if (slug === HCP_REWARD_SLUGS.FEATURED_CREATOR_1000) return elig.featured;
    if (slug === HCP_REWARD_SLUGS.WEEKLY_SPOTLIGHT_TOP3) return elig.weeklyTop3;
    if (slug === HCP_REWARD_SLUGS.STREAK_GLOW_30) return elig.streak30;
    return false;
  };

  return HCP_V2_REWARD_CATALOG.map((c) => {
    const slug = slugForCatalogId(c.id);
    if (!slug) {
      return {
        id: c.id,
        slug: c.id,
        title: c.title,
        description: c.description,
        requirement: c.requirement,
        kind: c.kind,
        displayStatus: 'coming_soon' as const,
      };
    }
    const row = bySlug.get(slug);
    const eligible = eligForSlug(slug);
    const displayStatus = displayStatusForRow(row, eligible, now);
    return {
      id: c.id,
      slug,
      title: c.title,
      description: c.description,
      requirement: c.requirement,
      kind: c.kind,
      displayStatus,
      grantedAt: row?.grantedAt?.toISOString() ?? null,
      expiresAt: row?.expiresAt?.toISOString() ?? null,
    };
  });
}
