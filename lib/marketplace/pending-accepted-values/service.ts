import type { PrismaClient } from '@prisma/client';
import type { MarketplaceCategory } from '@prisma/client';
import { buildPendingAcceptedValueCanonicalKey } from './canonical-key';
import { toPendingAcceptedValueId } from './constants';
import type { PendingAcceptedValueRecord } from './types';

export function mapPendingAcceptedValueRow(
  row: {
    id: string;
    label: string;
    category: MarketplaceCategory;
    language: string;
    listingCount: number;
    userCount: number;
    firstUsedAt: Date;
    lastUsedAt: Date;
    status: PendingAcceptedValueRecord['status'];
    approvedTaxonomyId: string | null;
  },
): PendingAcceptedValueRecord {
  return {
    id: row.id,
    taxonomyId: toPendingAcceptedValueId(row.id),
    label: row.label,
    category: row.category,
    language: row.language,
    listingCount: row.listingCount,
    userCount: row.userCount,
    firstUsedAt: row.firstUsedAt.toISOString(),
    lastUsedAt: row.lastUsedAt.toISOString(),
    status: row.status,
    approvedTaxonomyId: row.approvedTaxonomyId,
  };
}

export async function listActivePendingAcceptedValues(
  prisma: PrismaClient,
): Promise<PendingAcceptedValueRecord[]> {
  const rows = await prisma.pendingAcceptedValueProposal.findMany({
    where: { status: 'PENDING' },
    orderBy: [{ listingCount: 'desc' }, { lastUsedAt: 'desc' }],
  });
  return rows.map(mapPendingAcceptedValueRow);
}

export async function upsertPendingAcceptedValueProposal(
  prisma: PrismaClient,
  input: {
    label: string;
    category: MarketplaceCategory;
    language: string;
    userId?: string | null;
  },
): Promise<PendingAcceptedValueRecord> {
  const trimmedLabel = input.label.trim();
  if (!trimmedLabel) {
    throw new Error('PENDING_VALUE_LABEL_REQUIRED');
  }
  const canonicalKey = buildPendingAcceptedValueCanonicalKey({
    category: input.category,
    label: trimmedLabel,
    language: input.language,
  });

  const existing = await prisma.pendingAcceptedValueProposal.findUnique({
    where: { canonicalKey },
  });

  if (existing) {
    const userId = input.userId?.trim();
    let userCountDelta = 0;
    if (userId) {
      const prior = await prisma.pendingAcceptedValueProposalUser.findUnique({
        where: {
          proposalId_userId: { proposalId: existing.id, userId },
        },
      });
      if (!prior) {
        await prisma.pendingAcceptedValueProposalUser.create({
          data: { proposalId: existing.id, userId },
        });
        userCountDelta = 1;
      }
    }

    const updated = await prisma.pendingAcceptedValueProposal.update({
      where: { id: existing.id },
      data: {
        listingCount: { increment: 1 },
        userCount: userCountDelta > 0 ? { increment: userCountDelta } : undefined,
        lastUsedAt: new Date(),
      },
    });
    return mapPendingAcceptedValueRow(updated);
  }

  const created = await prisma.pendingAcceptedValueProposal.create({
    data: {
      canonicalKey,
      label: trimmedLabel,
      category: input.category,
      language: input.language.trim().toLowerCase() || 'nl',
      listingCount: 1,
      userCount: input.userId ? 1 : 0,
      users: input.userId
        ? { create: { userId: input.userId } }
        : undefined,
    },
  });
  return mapPendingAcceptedValueRow(created);
}

export async function buildPendingAcceptedValueAuditReport(prisma: PrismaClient) {
  const pending = await prisma.pendingAcceptedValueProposal.findMany({
    where: { status: 'PENDING' },
    orderBy: [{ listingCount: 'desc' }, { userCount: 'desc' }],
    include: { _count: { select: { users: true } } },
  });

  const suggestedAdditions = pending
    .filter((row) => row.listingCount >= 3 || row.userCount >= 2)
    .slice(0, 25)
    .map((row) => ({
      label: row.label,
      category: row.category,
      language: row.language,
      listingCount: row.listingCount,
      userCount: row.userCount,
      canonicalKey: row.canonicalKey,
    }));

  return {
    generatedAt: new Date().toISOString(),
    totalPending: pending.length,
    mostRequested: pending.slice(0, 20).map((row) => ({
      id: row.id,
      taxonomyId: toPendingAcceptedValueId(row.id),
      label: row.label,
      category: row.category,
      listingCount: row.listingCount,
      userCount: row.userCount,
      uniqueUsers: row._count.users,
    })),
    duplicateGroups: [] as Array<{ label: string; category: string; count: number }>,
    suggestedTaxonomyAdditions: suggestedAdditions,
    mergeCandidates: pending
      .filter((row) => row.listingCount >= 2)
      .map((row) => ({
        canonicalKey: row.canonicalKey,
        label: row.label,
        category: row.category,
      })),
  };
}
