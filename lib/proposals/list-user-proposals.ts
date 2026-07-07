import { prisma } from '@/lib/prisma';
import { serializeProposal } from './serialize-proposal';
import type { ProposalDTO } from './proposal-types';

/**
 * User-wide proposal listing (CE-2A.1) — surfaces proposals the user is involved
 * in outside a single conversation. Reuses `serializeProposal`; no duplicate
 * proposal logic.
 */
export const USER_PROPOSAL_STATUS_FILTERS = [
  'PENDING',
  'COUNTERED',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'EXPIRED',
] as const;

export type UserProposalStatusFilter =
  (typeof USER_PROPOSAL_STATUS_FILTERS)[number];

export type UserProposalListItem = ProposalDTO & {
  counterpartName: string | null;
  userRoleInDeal: 'BUYER' | 'SELLER';
  canRespond: boolean;
};

export async function listUserProposals(
  userId: string,
  status?: UserProposalStatusFilter,
): Promise<UserProposalListItem[]> {
  const rows = await prisma.proposal.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      Buyer: { select: { name: true, username: true } },
      Seller: { select: { name: true, username: true } },
    },
  });

  return rows.map((row) => {
    const isBuyer = row.buyerId === userId;
    const counterpart = isBuyer ? row.Seller : row.Buyer;
    const proposal = serializeProposal(row);
    const canRespond =
      (proposal.status === 'PENDING' || proposal.status === 'COUNTERED') &&
      proposal.createdById !== userId;

    return {
      ...proposal,
      counterpartName: counterpart?.name ?? counterpart?.username ?? null,
      userRoleInDeal: isBuyer ? 'BUYER' : 'SELLER',
      canRespond,
    };
  });
}
