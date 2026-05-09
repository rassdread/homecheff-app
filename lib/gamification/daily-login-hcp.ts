import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { HCP_ACTION_POINTS } from './hcp-actions';

export function utcCalendarDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function utcYesterdayCalendarString(): string {
  const x = new Date();
  x.setUTCHours(0, 0, 0, 0);
  x.setUTCDate(x.getUTCDate() - 1);
  return x.toISOString().slice(0, 10);
}

export type DailyLoginResult = { recorded: boolean; duplicate?: boolean };

/**
 * Awards DAILY_LOGIN once per UTC day, updates streaks, may award SEVEN_DAY_STREAK on multiples of 7.
 * Idempotent and safe if called repeatedly (e.g. from GET /api/gamification/me).
 */
export async function recordDailyLoginIfNeeded(userId: string): Promise<DailyLoginResult> {
  const today = utcCalendarDateString();
  const yesterday = utcYesterdayCalendarString();
  const streakBox = { sevenPoints: 0 };

  try {
    await prisma.$transaction(async (tx) => {
      try {
        await tx.hcpEvent.create({
          data: {
            userId,
            action: 'DAILY_LOGIN',
            points: HCP_ACTION_POINTS.DAILY_LOGIN,
            sourceType: 'CALENDAR_DAY',
            sourceId: today,
          },
        });
      } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw Object.assign(new Error('duplicate_daily'), { code: 'DAILY_DUP' });
        }
        throw e;
      }

      const stats = await tx.userHcpStats.findUnique({ where: { userId } });
      const prevLast = stats?.lastDailyHcpDate ?? null;
      let streak = 1;
      if (prevLast === yesterday) {
        streak = (stats?.currentStreak ?? 0) + 1;
      } else if (prevLast === today) {
        streak = stats?.currentStreak ?? 1;
      } else if (prevLast) {
        streak = 1;
      }

      const longest = Math.max(stats?.longestStreak ?? 0, streak);
      const dailyPts = HCP_ACTION_POINTS.DAILY_LOGIN;

      await tx.userHcpStats.upsert({
        where: { userId },
        create: {
          userId,
          totalHcp: dailyPts,
          currentStreak: streak,
          longestStreak: longest,
          lastDailyHcpDate: today,
        },
        update: {
          totalHcp: { increment: dailyPts },
          currentStreak: streak,
          longestStreak: longest,
          lastDailyHcpDate: today,
        },
      });

      if (streak > 0 && streak % 7 === 0) {
        const seven = HCP_ACTION_POINTS.SEVEN_DAY_STREAK;
        try {
          await tx.hcpEvent.create({
            data: {
              userId,
              action: 'SEVEN_DAY_STREAK',
              points: seven,
              sourceType: 'STREAK_MILESTONE',
              sourceId: String(streak),
            },
          });
          await tx.userHcpStats.update({
            where: { userId },
            data: { totalHcp: { increment: seven } },
          });
          streakBox.sevenPoints = seven;
        } catch (e: unknown) {
          if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) {
            throw e;
          }
        }
      }
    });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'DAILY_DUP' || (e as Error)?.message === 'duplicate_daily') {
      return { recorded: false, duplicate: true };
    }
    throw e;
  }

  const { runPostHcpAwardEffects } = await import('@/lib/gamification/hcp-side-effects');
  await runPostHcpAwardEffects(userId, 'DAILY_LOGIN', HCP_ACTION_POINTS.DAILY_LOGIN);
  if (streakBox.sevenPoints > 0) {
    await runPostHcpAwardEffects(userId, 'SEVEN_DAY_STREAK', streakBox.sevenPoints);
  }

  return { recorded: true };
}
