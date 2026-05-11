import { appendPendingClientRewards } from '@/lib/gamification/hcp-pending-client';
import { unlockBadgesForUser } from '@/lib/gamification/unlock-badges';
import { maybeNotifyHcpActivity } from '@/lib/gamification/hcp-notifications';
import { bumpWeeklyChallengeForAction } from '@/lib/gamification/weekly-challenges';

function titleForAction(action: string, points: number): string {
  if (action === 'SEVEN_DAY_STREAK') return `+${points} HCP · 7 dagen op rij`;
  return `+${points} HCP`;
}

function subtitleForAction(action: string): string | undefined {
  const map: Record<string, string> = {
    PRODUCT_CREATED: 'Nieuw item op het Dorpsplein',
    FIRST_ITEM_PLACED: 'Eerste item op het Dorpsplein',
    PRODUCT_HAS_3_PHOTOS: 'Extra foto’s toegevoegd',
    PRODUCT_HAS_5_PHOTOS: 'Foto-milestone',
    CONTENT_POST_CREATED: 'Inspiratie geplaatst',
    REVIEW_RECEIVED: 'Positieve review ontvangen',
    PROFILE_COMPLETED: 'Profiel compleet',
    FIRST_SALE: 'Eerste verkoop',
    DAILY_LOGIN: 'Dagelijkse activiteit',
    SEVEN_DAY_STREAK: 'Je streak groeit',
    CONTENT_HAS_3_MEDIA: 'Meer beeld bij je inspiratie',
    CONTENT_HAS_VIDEO: 'Video toegevoegd',
    ACCOUNT_CREATED: 'Welkom bij HomeCheff',
    BETA_TESTER_JOINED: 'Beta-deelnemer',
    CONVERSATION_STARTED: 'Gesprek gestart',
    INTERACTION_COMMENT: 'Reactie geplaatst',
    ITEM_LIKED_OR_SAVED: 'Community-steun',
    CHAT_QUICK_RESPONSE: 'Snel geantwoord in chat',
    REVIEW_REPLY_PUBLISHED: 'Antwoord op review',
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
          subtitle: 'Zachte bonus voor je volharding.',
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
          title: `Badge: ${b.name}`,
          subtitle: 'Bekijk details op Mijn HCP',
          slug: b.slug,
        },
      ]);
    } else if (newBadges.length > 1) {
      await appendPendingClientRewards(userId, [
        {
          kind: 'badge',
          title: `${newBadges.length} nieuwe badges`,
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
