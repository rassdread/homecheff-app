import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';
import type { PendingClientReward } from '@/lib/gamification/gamification-me-types';

export type { PendingClientReward } from '@/lib/gamification/gamification-me-types';

const MAX_QUEUE = 6;

function normalizeQueue(raw: unknown): PendingClientReward[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => x && typeof x === 'object' && typeof (x as PendingClientReward).title === 'string')
    .map((x) => x as PendingClientReward)
    .slice(-MAX_QUEUE);
}

export async function appendPendingClientRewards(
  userId: string,
  items: Omit<PendingClientReward, 'id'>[],
): Promise<void> {
  if (items.length === 0) return;
  const stamped: PendingClientReward[] = items.map((i) => ({
    ...i,
    id: randomUUID(),
  }));

  await prisma.$transaction(async (tx) => {
    const row = await tx.userHcpStats.findUnique({
      where: { userId },
      select: { pendingClientRewards: true },
    });
    const prev = normalizeQueue(row?.pendingClientRewards);
    const next = [...prev, ...stamped].slice(-MAX_QUEUE);
    await tx.userHcpStats.upsert({
      where: { userId },
      create: {
        userId,
        totalHcp: 0,
        pendingClientRewards: next as unknown as Prisma.InputJsonValue,
      },
      update: {
        pendingClientRewards: next as unknown as Prisma.InputJsonValue,
      },
    });
  });
}

export async function consumePendingClientRewards(userId: string): Promise<PendingClientReward[]> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.userHcpStats.findUnique({
      where: { userId },
      select: { pendingClientRewards: true },
    });
    const list = normalizeQueue(row?.pendingClientRewards);
    if (list.length === 0) return [];
    await tx.userHcpStats.upsert({
      where: { userId },
      create: {
        userId,
        totalHcp: 0,
        pendingClientRewards: [] as unknown as Prisma.InputJsonValue,
      },
      update: {
        pendingClientRewards: [] as unknown as Prisma.InputJsonValue,
      },
    });
    return list;
  });
}
