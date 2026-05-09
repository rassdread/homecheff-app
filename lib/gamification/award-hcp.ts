import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { HcpAction } from './hcp-actions';

export type AwardHcpInput = {
  userId: string;
  action: HcpAction | string;
  points: number;
  sourceType: string;
  sourceId: string;
  metadata?: Record<string, unknown> | null;
};

export type AwardHcpResult = {
  awarded: boolean;
  duplicate?: boolean;
  points?: number;
  reason?: string;
};

function clampPoints(points: number): number {
  const n = Math.floor(Number(points) || 0);
  return Math.max(0, n);
}

/**
 * Idempotent HCP award: one ledger row per (userId, action, sourceType, sourceId).
 * Never applies negative points. Safe to call multiple times.
 */
export async function awardHcpTx(
  tx: Prisma.TransactionClient,
  input: AwardHcpInput,
): Promise<AwardHcpResult> {
  const safePoints = clampPoints(input.points);
  if (safePoints <= 0) {
    return { awarded: false, reason: 'non_positive_points' };
  }

  try {
    await tx.hcpEvent.create({
      data: {
        userId: input.userId,
        action: String(input.action),
        points: safePoints,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        metadata: input.metadata === null || input.metadata === undefined ? undefined : input.metadata,
      },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2002') {
      return { awarded: false, duplicate: true };
    }
    throw e;
  }

  await tx.userHcpStats.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      totalHcp: safePoints,
    },
    update: {
      totalHcp: { increment: safePoints },
    },
  });

  return { awarded: true, points: safePoints };
}

export async function awardHcp(input: AwardHcpInput): Promise<AwardHcpResult> {
  return prisma.$transaction((tx) => awardHcpTx(tx, input));
}
