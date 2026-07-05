import type { Agreement, CommunityOrder, Proposal } from '@prisma/client';
import type { AgreementDTO, CommunityOrderDTO, ProposalDTO } from './proposal-types';

export function serializeProposal(row: Proposal): ProposalDTO {
  return {
    id: row.id,
    conversationId: row.conversationId,
    createdById: row.createdById,
    sellerId: row.sellerId,
    buyerId: row.buyerId,
    productId: row.productId,
    listingId: row.listingId,
    title: row.title,
    description: row.description,
    quantity: row.quantity,
    amountCents: row.amountCents,
    currency: row.currency,
    requestedDate: row.requestedDate?.toISOString() ?? null,
    requestedTimeWindow: row.requestedTimeWindow,
    fulfillmentType: row.fulfillmentType,
    category: row.category,
    settlementMode: row.settlementMode,
    status: row.status,
    parentProposalId: row.parentProposalId,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeAgreement(row: Agreement): AgreementDTO {
  return {
    id: row.id,
    proposalId: row.proposalId,
    acceptedById: row.acceptedById,
    acceptedAt: row.acceptedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function serializeCommunityOrder(row: CommunityOrder): CommunityOrderDTO {
  return {
    id: row.id,
    agreementId: row.agreementId,
    proposalId: row.proposalId,
    conversationId: row.conversationId,
    buyerId: row.buyerId,
    sellerId: row.sellerId,
    status: row.status,
    checkoutOrderId: row.checkoutOrderId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
