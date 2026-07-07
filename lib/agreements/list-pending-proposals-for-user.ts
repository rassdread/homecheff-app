import { prisma } from '@/lib/prisma';
import { serializeProposal } from '@/lib/proposals/serialize-proposal';
import type { ProposalDTO } from '@/lib/proposals/proposal-types';
import {
  agreementKindLabelKey,
  resolveAgreementDisplayKind,
  type AgreementProductContext,
} from './agreement-display-kind';
import {
  buildProposalAgreementTimeline,
  buildProposalHubPresentation,
} from './agreement-timeline';
import { buildProposalAgenda } from './agreement-agenda';
import { attachProposalFacets } from './agreements-hub-filters';
import type { AgreementHubProposalItem } from './agreements-hub-types';

/** Terminal proposal history is bounded to the last ~90 days to stay light. */
const HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Proposals for the agreements hub (CE-2B.1) — surfaces open voorstellen outside
 * chat: PENDING + COUNTERED (active) plus recent EXPIRED / REJECTED / CANCELLED
 * for unified history. Proposals that became agreements are represented by their
 * deal, so those are excluded (`Agreement: null`). Reuses `serializeProposal`.
 */
export async function listPendingProposalsForUser(
  userId: string,
): Promise<AgreementHubProposalItem[]> {
  const historyCutoff = new Date(Date.now() - HISTORY_WINDOW_MS);
  const rows = await prisma.proposal.findMany({
    where: {
      Agreement: { is: null },
      AND: [
        { OR: [{ buyerId: userId }, { sellerId: userId }] },
        {
          OR: [
            { status: { in: ['PENDING', 'COUNTERED'] } },
            {
              status: { in: ['EXPIRED', 'REJECTED', 'CANCELLED'] },
              updatedAt: { gte: historyCutoff },
            },
          ],
        },
      ],
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: {
      Buyer: { select: { name: true, username: true } },
      Seller: { select: { name: true, username: true } },
      Product: {
        select: {
          marketplaceCategory: true,
          listingIntent: true,
          specializations: true,
          subcategory: true,
          category: true,
        },
      },
    },
  });

  return rows.map((row) => {
    const proposal = serializeProposal(row);
    const isBuyer = row.buyerId === userId;
    const counterpart = isBuyer ? row.Seller : row.Buyer;
    const product: AgreementProductContext = row.Product
      ? {
          marketplaceCategory: row.Product.marketplaceCategory,
          listingIntent: row.Product.listingIntent,
          specializations: row.Product.specializations,
          subcategory: row.Product.subcategory,
          category: row.Product.category,
        }
      : null;

    const displayKind = resolveAgreementDisplayKind({ proposal, product });
    const presentation = buildProposalHubPresentation(
      proposal,
      userId,
      counterpart.name ?? counterpart.username,
    );

    const base: AgreementHubProposalItem = {
      kind: 'proposal',
      id: proposal.id,
      updatedAt: proposal.updatedAt,
      conversationId: proposal.conversationId,
      displayKind,
      proposal,
      counterpartName: counterpart.name ?? counterpart.username,
      userRoleInDeal: isBuyer ? 'BUYER' : 'SELLER',
      timeline: buildProposalAgreementTimeline(proposal),
      facets: [],
      agenda: buildProposalAgenda(proposal),
      ...presentation,
    };

    return attachProposalFacets(base, userId);
  });
}

export { agreementKindLabelKey };
