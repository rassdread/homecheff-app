import { appendPendingClientRewards } from '@/lib/gamification/hcp-pending-client';
import { unlockBadgesForUser } from '@/lib/gamification/unlock-badges';
import { maybeNotifyHcpActivity } from '@/lib/gamification/hcp-notifications';
import { bumpWeeklyChallengeForAction } from '@/lib/gamification/weekly-challenges';

function titleForAction(action: string, points: number): string {
  if (action === 'SEVEN_DAY_STREAK') return '🔥 7 dagen streak';
  if (action === 'DAILY_LOGIN') return `+${points} HomeCheff Points`;
  return `+${points} HomeCheff Points`;
}

function subtitleForAction(action: string): string | undefined {
  const map: Record<string, string> = {
    PRODUCT_CREATED: 'Product toegevoegd',
    CONTENT_POST_CREATED: 'Inspiratie geplaatst',
    REVIEW_RECEIVED: 'Review ontvangen',
    PROFILE_COMPLETED: 'Profiel compleet',
    FIRST_SALE: 'Eerste verkoop',
    DAILY_LOGIN: 'Dagelijkse login',
    SEVEN_DAY_STREAK: 'Streak-bonus',
    PRODUCT_HAS_3_PHOTOS: 'Extra foto’s',
    PRODUCT_HAS_5_PHOTOS: 'Foto-milestone',
    CONTENT_HAS_3_MEDIA: 'Media-milestone',
    CONTENT_HAS_VIDEO: 'Video toegevoegd',
    ACCOUNT_CREATED: 'Welkom',
    BETA_TESTER_JOINED: 'Beta tester bonus',
  };
  return map[action];
}

/**
 * Post-award pipeline: client toasts, badge rules, weekly challenges, in-app notifications (throttled).
 * Await from daily-login (same request as `/me`) to avoid races with `pendingClientRewards`.
 */
export async function runPostHcpAwardEffects(userId: string, action: string, points: number): Promise<void> {
  try {
    if (action === 'SEVEN_DAY_STREAK') {
      await appendPendingClientRewards(userId, [
        {
          kind: 'streak',
          title: titleForAction(action, points),
          subtitle: 'Ga zo door met je login-streak',
          points,
        },
      ]);
    } else {
      await appendPendingClientRewards(userId, [
        {
          kind: 'hcp',
          title: titleForAction(action, points),
          subtitle: subtitleForAction(action),
          points,
        },
      ]);
    }

    const newBadges = await unlockBadgesForUser(userId);
    const { evaluateHcpRewardsForUser } = await import('@/lib/gamification/hcp-rewards-engine');
    await evaluateHcpRewardsForUser(userId);
    if (newBadges.length === 1) {
      const b = newBadges[0];
      await appendPendingClientRewards(userId, [
        {
          kind: 'badge',
          title: `Badge behaald: ${b.name}`,
          subtitle: 'Bekijk je competenties op Mijn HCP',
          slug: b.slug,
        },
      ]);
    } else if (newBadges.length > 1) {
      await appendPendingClientRewards(userId, [
        {
          kind: 'badge',
          title: `${newBadges.length} badges behaald`,
          subtitle: newBadges.map((x) => x.name).slice(0, 3).join(' · '),
        },
      ]);
    }

    await bumpWeeklyChallengeForAction(userId, action);
    await maybeNotifyHcpActivity(userId, newBadges);
  } catch (e) {
    console.warn('[hcp-side-effects]', e);
  }
}
