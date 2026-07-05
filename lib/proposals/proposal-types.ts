import type {
  ProposalCategory,
  ProposalFulfillmentType,
  ProposalStatus,
  SettlementMode,
  CommunityOrderStatus,
} from '@prisma/client';

export type ProposalDTO = {
  id: string;
  conversationId: string;
  createdById: string;
  sellerId: string;
  buyerId: string;
  productId: string | null;
  listingId: string | null;
  title: string;
  description: string | null;
  quantity: number | null;
  amountCents: number | null;
  currency: string;
  requestedDate: string | null;
  requestedTimeWindow: string | null;
  fulfillmentType: ProposalFulfillmentType | null;
  category: ProposalCategory;
  settlementMode: SettlementMode;
  status: ProposalStatus;
  parentProposalId: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AgreementDTO = {
  id: string;
  proposalId: string;
  acceptedById: string;
  acceptedAt: string;
  createdAt: string;
};

export type CommunityOrderDTO = {
  id: string;
  agreementId: string;
  proposalId: string;
  conversationId: string;
  buyerId: string;
  sellerId: string;
  status: CommunityOrderStatus;
  checkoutOrderId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateProposalInput = {
  title: string;
  description?: string | null;
  quantity?: number | null;
  amountCents?: number | null;
  currency?: string;
  requestedDate?: string | null;
  requestedTimeWindow?: string | null;
  fulfillmentType?: ProposalFulfillmentType | null;
  productId?: string | null;
  listingId?: string | null;
  sellerId?: string;
  buyerId?: string;
  category?: ProposalCategory;
  expiresAt?: string | null;
};

export type CounterProposalInput = Omit<
  CreateProposalInput,
  'sellerId' | 'buyerId'
> & {
  sellerId?: string;
  buyerId?: string;
};

export type ProposalActionResult = {
  proposal: ProposalDTO;
  message?: Record<string, unknown>;
  agreement?: AgreementDTO;
  communityOrder?: CommunityOrderDTO;
};

export type ProposalUpdatedEvent = {
  proposalId: string;
  status: ProposalStatus;
  proposal: ProposalDTO;
  triggeredBy: string;
  timestamp: string;
};
