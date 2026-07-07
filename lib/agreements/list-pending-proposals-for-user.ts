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

export async function listPendingProposalsForUser(
  userId: string,
): Promise<AgreementHubProposalItem[]> {
  const rows = await prisma.proposal.findMany({
    where: {
      OR: [{ buyerId: userId }, { sellerId: userId }],
      status: 'PENDING',
      Agreement: { is: null },
    },
    orderBy: { updatedAt: 'desc' },
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
