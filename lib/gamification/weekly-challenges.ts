import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type WeeklyChallengeDef = {
  id: string;
  title: string;
  description: string;
  target: number;
};

export const WEEKLY_CHALLENGE_DEFINITIONS: WeeklyChallengeDef[] = [
  {
    id: 'insp_1',
    title: 'Plaats 1 inspiratie-item',
    description: 'Deel één inspiratiepost deze week.',
    target: 1,
  },
  {
    id: 'photos_5',
    title: 'Voeg 5 productfoto’s toe',
    description: 'Foto-milestones tellen mee (per product).',
    target: 5,
  },
  {
    id: 'login_7',
    title: 'Log 7 dagen in',
    description: 'Dagelijkse login telt mee (UTC-week).',
    target: 7,
  },
  {
    id: 'video_1',
    title: 'Plaats een video',
    description: 'Video bij inspiratie of product.',
    target: 1,
  },
];

export function hcpIsoWeekKeyUtc(d = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

type ChallengeState = { progress: number; completed: boolean };

type WeeklyJson = {
  weekKey: string;
  challenges: Record<string, ChallengeState>;
};

function defaultState(weekKey: string): WeeklyJson {
  const challenges: Record<string, ChallengeState> = {};
  for (const c of WEEKLY_CHALLENGE_DEFINITIONS) {
    challenges[c.id] = { progress: 0, completed: false };
  }
  return { weekKey, challenges };
}

export async function getWeeklyChallengesForUser(userId: string): Promise<{
  weekKey: string;
  items: Array<WeeklyChallengeDef & { progress: number; completed: boolean }>;
}> {
  const weekKey = hcpIsoWeekKeyUtc();
  const row = await prisma.userHcpStats.findUnique({
    where: { userId },
    select: { weeklyChallengesJson: true },
  });
  let parsed: WeeklyJson | null = null;
  const raw = row?.weeklyChallengesJson;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'weekKey' in raw) {
    parsed = raw as WeeklyJson;
  }
  if (!parsed || parsed.weekKey !== weekKey) {
    parsed = defaultState(weekKey);
    await prisma.userHcpStats.upsert({
      where: { userId },
      create: {
        userId,
        totalHcp: 0,
        weeklyChallengesJson: parsed as unknown as Prisma.InputJsonValue,
      },
      update: {
        weeklyChallengesJson: parsed as unknown as Prisma.InputJsonValue,
      },
    });
  }
  const items = WEEKLY_CHALLENGE_DEFINITIONS.map((def) => {
    const st = parsed!.challenges[def.id] ?? { progress: 0, completed: false };
    return { ...def, progress: st.progress, completed: st.completed };
  });
  return { weekKey, items };
}

export async function bumpWeeklyChallengeForAction(userId: string, action: string): Promise<void> {
  const weekKey = hcpIsoWeekKeyUtc();
  const row = await prisma.userHcpStats.findUnique({
    where: { userId },
    select: { weeklyChallengesJson: true },
  });
  let parsed: WeeklyJson = defaultState(weekKey);
  const raw = row?.weeklyChallengesJson;
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'weekKey' in raw) {
    parsed = raw as WeeklyJson;
  }
  if (parsed.weekKey !== weekKey) {
    parsed = defaultState(weekKey);
  }

  const bump = (id: string, n = 1) => {
    const cur = parsed.challenges[id] ?? { progress: 0, completed: false };
    const def = WEEKLY_CHALLENGE_DEFINITIONS.find((d) => d.id === id);
    if (!def || cur.completed) return;
    const next = Math.min(def.target, cur.progress + n);
    const completed = next >= def.target;
    parsed.challenges[id] = { progress: next, completed };
  };

  if (action === 'CONTENT_POST_CREATED') bump('insp_1', 1);
  if (action === 'PRODUCT_HAS_3_PHOTOS' || action === 'PRODUCT_HAS_5_PHOTOS') bump('photos_5', action === 'PRODUCT_HAS_5_PHOTOS' ? 2 : 1);
  if (action === 'DAILY_LOGIN') bump('login_7', 1);
  if (action === 'CONTENT_HAS_VIDEO') bump('video_1', 1);
  if (action === 'CONTENT_HAS_3_MEDIA') bump('photos_5', 1);

  await prisma.userHcpStats.upsert({
    where: { userId },
    create: {
      userId,
      totalHcp: 0,
      weeklyChallengesJson: parsed as unknown as Prisma.InputJsonValue,
    },
    update: {
      weeklyChallengesJson: parsed as unknown as Prisma.InputJsonValue,
    },
  });
}
