import { prisma } from '@/lib/prisma';
import { awardHcp } from '@/lib/gamification/award-hcp';
import { unlockBadgesForUser } from '@/lib/gamification/unlock-badges';
import { hasAndroidBetaDownloadCookie } from '@/lib/affiliate-attribution';

/**
 * Idempotent: één keer HCP + badge-pipeline na eerste kwalificatie als beta tester.
 */
export async function claimBetaTesterRewards(userId: string): Promise<{ claimed: boolean }> {
  const updated = await prisma.user.updateMany({
    where: { id: userId, betaTesterJoinedAt: null },
    data: { betaTesterJoinedAt: new Date() },
  });

  if (updated.count === 0) {
    await unlockBadgesForUser(userId);
    return { claimed: false };
  }

  await awardHcp({
    userId,
    action: 'BETA_TESTER_JOINED',
    points: 50,
    sourceType: 'beta_tester',
    sourceId: userId,
  });
  await unlockBadgesForUser(userId);
  return { claimed: true };
}

export async function maybeClaimBetaTesterFromSignupCookies(
  userId: string,
  cookieHeader: string | null,
): Promise<void> {
  if (!hasAndroidBetaDownloadCookie(cookieHeader)) return;
  await claimBetaTesterRewards(userId);
}
