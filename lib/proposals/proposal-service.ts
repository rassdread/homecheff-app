import { prisma } from '@/lib/prisma';
import { syncConversationStatusAfterMessage } from '@/lib/communication/sync-conversation-status';
import type { MessageType } from '@prisma/client';
import { notifyProposalAccepted, notifyProposalEvent, notifyProposalReceived } from './notify-proposal-event';
import {
  buildProposalSummary,
  deriveSettlementModeFromProduct,
  normalizeProposalTaxonomyIds,
  parseSettlementMode,
  resolveCommunityOrderFulfillment,
  validateProposalSettlement,
  type AgreementSummarySnapshot,
} from './proposal-settlement';
import {
  resolveAcceptNextAction,
  paymentPathFromSummary,
} from './proposal-accept-routing';
import {
  decrementProductStockOnAccept,
  defaultPaymentPath,
  loadProductProposalContext,
  parsePaymentPath,
  resolveConversationProductId,
  validateFulfillmentForProduct,
  validatePaymentPath,
  validateProposalQuantityAgainstStock,
} from './proposal-product-binding';
import { validateSettlementAgainstBarterOpenness } from '@/lib/marketplace/commerce/barter-commerce-alignment';
import { DeliveryRequestService } from '@/lib/delivery/delivery-request-service';
import { serializeDeliveryRequest } from '@/lib/delivery/serialize-delivery-marketplace';
import type { DeliveryRequestDTO } from '@/lib/delivery/delivery-marketplace-types';
import { PROPOSAL_SYSTEM_MESSAGE_KEYS } from './proposal-i18n-keys';
import { emitNewMessage, emitProposalUpdated } from './proposal-realtime';
import {
  serializeAgreement,
  serializeCommunityOrder,
  serializeProposal,
} from './serialize-proposal';
import type {
  CommunityOrderDTO,
  CounterProposalInput,
  CreateProposalInput,
  ProposalActionResult,
  ProposalDTO,
} from './proposal-types';

const MESSAGE_USER_SELECT = {
  id: true,
  name: true,
  username: true,
  profileImage: true,
  displayFullName: true,
  displayNameOption: true,
} as const;

export class ProposalServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ProposalServiceError';
  }
}

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId, userId },
    select: { id: true },
  });
  if (!participant) {
    throw new ProposalServiceError('Access denied', 403);
  }
}

async function getConversationParticipantIds(
  conversationId: string,
): Promise<string[]> {
  const rows = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
}

async function resolveSellerBuyer(
  conversationId: string,
  createdById: string,
  input: { sellerId?: string; buyerId?: string; productId?: string | null },
): Promise<{ sellerId: string; buyerId: string }> {
  const participantIds = await getConversationParticipantIds(conversationId);
  if (participantIds.length !== 2 || !participantIds.includes(createdById)) {
    throw new ProposalServiceError('Invalid conversation participants', 400);
  }
  const otherId = participantIds.find((id) => id !== createdById)!;

  if (input.productId) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { sellerId: true, seller: { select: { userId: true } } },
    });
    if (!product) {
      throw new ProposalServiceError('Product not found', 404);
    }
    const productSellerUserId = product.seller.userId;
    const buyerId =
      input.buyerId ??
      (createdById === productSellerUserId ? otherId : createdById);
    const sellerId = input.sellerId ?? productSellerUserId;
    if (
      !participantIds.includes(sellerId) ||
      !participantIds.includes(buyerId) ||
      sellerId === buyerId
    ) {
      throw new ProposalServiceError('Invalid seller/buyer for conversation', 400);
    }
    return { sellerId, buyerId };
  }

  const sellerId = input.sellerId ?? createdById;
  const buyerId = input.buyerId ?? otherId;
  if (
    !participantIds.includes(sellerId) ||
    !participantIds.includes(buyerId) ||
    sellerId === buyerId
  ) {
    throw new ProposalServiceError('sellerId and buyerId must be conversation participants', 400);
  }
  return { sellerId, buyerId };
}

async function resolveProposalFields(
  input: CreateProposalInput,
  title: string,
  boundProductId: string | null,
) {
  const productCtx = boundProductId
    ? await loadProductProposalContext(boundProductId)
    : null;

  const acceptedValueTaxonomyIds = normalizeProposalTaxonomyIds(
    input.acceptedValueTaxonomyIds ??
      (productCtx?.acceptedSpecializations?.length
        ? productCtx.acceptedSpecializations
        : []),
  );
  const requestedValueTaxonomyIds = normalizeProposalTaxonomyIds(
    input.requestedValueTaxonomyIds,
  );
  const settlementMode = input.settlementMode
    ? parseSettlementMode(input.settlementMode)
    : productCtx
      ? deriveSettlementModeFromProduct(productCtx)
      : parseSettlementMode('MONEY');

  const paymentPath = input.paymentPath
    ? parsePaymentPath(input.paymentPath)
    : defaultPaymentPath({ settlementMode, productCtx });

  const validation = validateProposalSettlement({
    settlementMode,
    amountCents: input.amountCents,
    requestedValueTaxonomyIds,
  });
  if (!validation.ok) {
    throw new ProposalServiceError(validation.errorKey, 400);
  }

  if (productCtx) {
    const barterValidation = validateSettlementAgainstBarterOpenness({
      barterOpenness: productCtx.barterOpenness,
      settlementMode,
    });
    if (!barterValidation.ok) {
      throw new ProposalServiceError(barterValidation.errorKey, 400);
    }
  }

  const paymentValidation = validatePaymentPath({
    paymentPath,
    settlementMode,
    productCtx,
  });
  if (!paymentValidation.ok) {
    throw new ProposalServiceError(paymentValidation.errorKey, 400);
  }

  if (productCtx) {
    const stockCheck = validateProposalQuantityAgainstStock(
      productCtx.availableStock,
      input.quantity,
    );
    if (!stockCheck.ok) {
      throw new ProposalServiceError(stockCheck.errorKey, 400);
    }
    const fulfillmentCheck = validateFulfillmentForProduct(
      productCtx,
      input.fulfillmentType,
    );
    if (!fulfillmentCheck.ok) {
      throw new ProposalServiceError(fulfillmentCheck.errorKey, 400);
    }
  }

  const proposalSummary = buildProposalSummary({
    settlementMode,
    amountCents: input.amountCents,
    currency: input.currency,
    acceptedValueTaxonomyIds,
    requestedValueTaxonomyIds,
    title,
    quantity: input.quantity,
    fulfillmentType: input.fulfillmentType ?? null,
    paymentPath,
    priceModel: productCtx?.priceModel ?? null,
    productId: boundProductId,
  });

  return {
    settlementMode,
    acceptedValueTaxonomyIds,
    requestedValueTaxonomyIds,
    proposalSummary,
    boundProductId,
  };
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new ProposalServiceError('Invalid date', 400);
  }
  return d;
}

async function touchConversation(conversationId: string) {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: new Date(), isActive: true },
  });
  await prisma.conversationParticipant.updateMany({
    where: { conversationId },
    data: { isHidden: false },
  });
}

async function createProposalMessage(
  conversationId: string,
  senderId: string,
  proposalId: string,
  messageType: MessageType = 'PROPOSAL',
  text: string | null = null,
) {
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      proposalId,
      messageType,
      text,
      isEncrypted: false,
    },
    include: { User: { select: MESSAGE_USER_SELECT } },
  });
  await touchConversation(conversationId);
  void syncConversationStatusAfterMessage(conversationId).catch((e) =>
    console.warn('[proposal-service] status sync', e),
  );
  return message;
}

async function broadcastProposal(
  proposal: ProposalDTO,
  triggeredBy: string,
  message?: Record<string, unknown>,
) {
  await emitProposalUpdated(proposal.conversationId, {
    proposalId: proposal.id,
    status: proposal.status,
    proposal,
    triggeredBy,
    timestamp: new Date().toISOString(),
  });
  if (message) {
    await emitNewMessage(proposal.conversationId, message);
  }
}

function counterpartyId(proposal: { createdById: string; sellerId: string; buyerId: string }, actorId: string): string {
  if (proposal.createdById === actorId) {
    return proposal.sellerId === actorId ? proposal.buyerId : proposal.sellerId;
  }
  return proposal.createdById;
}

export class ProposalService {
  static async createProposal(
    userId: string,
    conversationId: string,
    input: CreateProposalInput,
  ): Promise<ProposalActionResult> {
    await assertParticipant(conversationId, userId);

    const title = input.title?.trim();
    if (!title) {
      throw new ProposalServiceError('Title is required', 400);
    }

    const { sellerId, buyerId } = await resolveSellerBuyer(conversationId, userId, input);

    const boundProductId = await resolveConversationProductId(
      conversationId,
      input.productId,
    );

    const fields = await resolveProposalFields(input, title, boundProductId);

    const proposal = await prisma.proposal.create({
      data: {
        conversationId,
        createdById: userId,
        sellerId,
        buyerId,
        productId: fields.boundProductId,
        listingId: input.listingId ?? null,
        title,
        description: input.description?.trim() || null,
        quantity: input.quantity ?? null,
        amountCents: input.amountCents ?? null,
        currency: input.currency?.trim() || 'EUR',
        requestedDate: parseOptionalDate(input.requestedDate),
        requestedTimeWindow: input.requestedTimeWindow?.trim() || null,
        fulfillmentType: input.fulfillmentType ?? null,
        category: input.category ?? 'PRODUCT',
        settlementMode: fields.settlementMode,
        acceptedValueTaxonomyIds: fields.acceptedValueTaxonomyIds,
        requestedValueTaxonomyIds: fields.requestedValueTaxonomyIds,
        proposalSummary: fields.proposalSummary as object,
        expiresAt: parseOptionalDate(input.expiresAt),
        status: 'PENDING',
      },
    });

    const message = await createProposalMessage(
      conversationId,
      userId,
      proposal.id,
      'PROPOSAL',
    );

    const dto = serializeProposal(proposal);
    const recipientId = counterpartyId(
      { createdById: userId, sellerId, buyerId },
      userId,
    );

    await broadcastProposal(dto, userId, message as unknown as Record<string, unknown>);
    await notifyProposalReceived(recipientId, userId, dto);

    return { proposal: dto, message: message as unknown as Record<string, unknown> };
  }

  static async acceptProposal(
    userId: string,
    proposalId: string,
    options?: { commitmentAccepted?: boolean },
  ): Promise<ProposalActionResult> {
    const existing = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });
    if (!existing) {
      throw new ProposalServiceError('Proposal not found', 404);
    }

    await assertParticipant(existing.conversationId, userId);

    if (existing.status !== 'PENDING') {
      throw new ProposalServiceError(`Proposal is ${existing.status}`, 409);
    }
    if (existing.createdById === userId) {
      throw new ProposalServiceError('Cannot accept your own proposal', 403);
    }
    if (options?.commitmentAccepted !== true) {
      throw new ProposalServiceError('proposal.errors.commitmentRequired', 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.proposal.updateMany({
        where: { id: proposalId, status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      });
      if (updated.count !== 1) {
        throw new ProposalServiceError('Proposal is no longer pending', 409);
      }

      const proposal = await tx.proposal.findUniqueOrThrow({
        where: { id: proposalId },
      });

      const summaryBase = proposal.proposalSummary as AgreementSummarySnapshot | null;
      const paymentPath = paymentPathFromSummary(summaryBase);

      const agreementSnapshot: AgreementSummarySnapshot = {
        ...buildProposalSummary({
          settlementMode: proposal.settlementMode,
          amountCents: proposal.amountCents,
          currency: proposal.currency,
          acceptedValueTaxonomyIds: proposal.acceptedValueTaxonomyIds,
          requestedValueTaxonomyIds: proposal.requestedValueTaxonomyIds,
          title: proposal.title,
          quantity: proposal.quantity,
          fulfillmentType: proposal.fulfillmentType,
          paymentPath,
          priceModel: summaryBase?.priceModel ?? null,
          productId: proposal.productId,
        }),
        acceptedById: userId,
        acceptedAt: new Date().toISOString(),
        proposalId: proposal.id,
        commitmentAcceptedAt: new Date().toISOString(),
        commitmentAcceptedById: userId,
      };

      if (
        proposal.productId &&
        proposal.quantity &&
        proposal.quantity > 0 &&
        paymentPath !== 'HOMECHEFF_CHECKOUT'
      ) {
        try {
          await decrementProductStockOnAccept(
            tx,
            proposal.productId,
            proposal.quantity,
          );
        } catch {
          throw new ProposalServiceError(
            'proposal.productBinding.stockUnavailableOnAccept',
            409,
          );
        }
      }

      const agreement = await tx.agreement.create({
        data: {
          proposalId: proposal.id,
          acceptedById: userId,
          agreementSummary: agreementSnapshot as object,
        },
      });

      const fulfillment = resolveCommunityOrderFulfillment(proposal.fulfillmentType);

      const communityOrder = await tx.communityOrder.create({
        data: {
          agreementId: agreement.id,
          proposalId: proposal.id,
          conversationId: proposal.conversationId,
          buyerId: proposal.buyerId,
          sellerId: proposal.sellerId,
          status: 'OPEN',
          fulfillmentMode: fulfillment.fulfillmentMode,
          deliveryRequested: fulfillment.deliveryRequested,
          deliveryAssigned: false,
        },
      });

      const systemMessage = await tx.message.create({
        data: {
          conversationId: proposal.conversationId,
          senderId: userId,
          messageType: 'PROPOSAL_SYSTEM',
          text: PROPOSAL_SYSTEM_MESSAGE_KEYS.communityOrderCreated,
          isEncrypted: false,
        },
        include: { User: { select: MESSAGE_USER_SELECT } },
      });

      await tx.conversation.update({
        where: { id: proposal.conversationId },
        data: { lastMessageAt: new Date(), isActive: true },
      });

      return { proposal, agreement, communityOrder, systemMessage };
    });

    void syncConversationStatusAfterMessage(existing.conversationId).catch((e) =>
      console.warn('[proposal-service] status sync', e),
    );

    const dto = serializeProposal(result.proposal);
    await broadcastProposal(
      dto,
      userId,
      result.systemMessage as unknown as Record<string, unknown>,
    );
    await notifyProposalAccepted(
      result.proposal.createdById,
      userId,
      dto,
      result.communityOrder.id,
    );

    let deliveryRequest = null;
    let deliveryRequestReady = false;

    if (result.communityOrder.deliveryRequested) {
      const auto = await DeliveryRequestService.tryAutoCreateAfterAccept(
        userId,
        result.communityOrder.id,
        {
          pickupDate: result.proposal.requestedDate?.toISOString() ?? null,
          pickupTimeWindow: result.proposal.requestedTimeWindow,
          deliveryDate: result.proposal.requestedDate?.toISOString() ?? null,
          deliveryTimeWindow: result.proposal.requestedTimeWindow,
        },
      );
      deliveryRequest = auto.deliveryRequest;
      deliveryRequestReady = auto.readyWithoutCreate;
    }

    const summaryBase = result.proposal.proposalSummary as AgreementSummarySnapshot | null;
    const routing = resolveAcceptNextAction({
      settlementMode: result.proposal.settlementMode,
      paymentPath: paymentPathFromSummary(summaryBase),
      productId: result.proposal.productId,
      quantity: result.proposal.quantity,
      communityOrderId: result.communityOrder.id,
      deliveryRequested: result.communityOrder.deliveryRequested,
      deliveryRequestId: deliveryRequest?.id ?? null,
      deliveryRequestReady,
    });

    return {
      proposal: dto,
      agreement: serializeAgreement(result.agreement),
      communityOrder: serializeCommunityOrder(result.communityOrder),
      message: result.systemMessage as unknown as Record<string, unknown>,
      nextAction: routing.nextAction,
      checkoutUrl: routing.checkoutUrl,
      deliveryRequest,
    };
  }

  static async rejectProposal(
    userId: string,
    proposalId: string,
  ): Promise<ProposalActionResult> {
    const existing = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });
    if (!existing) {
      throw new ProposalServiceError('Proposal not found', 404);
    }

    await assertParticipant(existing.conversationId, userId);

    if (existing.status !== 'PENDING') {
      throw new ProposalServiceError(`Proposal is ${existing.status}`, 409);
    }
    if (existing.createdById === userId) {
      throw new ProposalServiceError('Cannot reject your own proposal', 403);
    }

    const updated = await prisma.proposal.updateMany({
      where: { id: proposalId, status: 'PENDING' },
      data: { status: 'REJECTED' },
    });
    if (updated.count !== 1) {
      throw new ProposalServiceError('Proposal is no longer pending', 409);
    }

    const proposal = await prisma.proposal.findUniqueOrThrow({
      where: { id: proposalId },
    });

    const systemMessage = await createProposalMessage(
      proposal.conversationId,
      userId,
      proposal.id,
      'PROPOSAL_SYSTEM',
      PROPOSAL_SYSTEM_MESSAGE_KEYS.rejected,
    );

    const dto = serializeProposal(proposal);
    await broadcastProposal(
      dto,
      userId,
      systemMessage as unknown as Record<string, unknown>,
    );
    await notifyProposalEvent(
      proposal.createdById,
      userId,
      'PROPOSAL_REJECTED',
      dto,
    );

    return {
      proposal: dto,
      message: systemMessage as unknown as Record<string, unknown>,
    };
  }

  static async counterProposal(
    userId: string,
    proposalId: string,
    input: CounterProposalInput,
  ): Promise<ProposalActionResult> {
    const parent = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });
    if (!parent) {
      throw new ProposalServiceError('Proposal not found', 404);
    }

    await assertParticipant(parent.conversationId, userId);

    if (parent.status !== 'PENDING') {
      throw new ProposalServiceError(`Proposal is ${parent.status}`, 409);
    }
    if (parent.createdById === userId) {
      throw new ProposalServiceError('Cannot counter your own proposal', 403);
    }

    const title = input.title?.trim() || parent.title;
    if (!title) {
      throw new ProposalServiceError('Title is required', 400);
    }

    const { sellerId, buyerId } = await resolveSellerBuyer(parent.conversationId, userId, {
      sellerId: input.sellerId ?? parent.sellerId,
      buyerId: input.buyerId ?? parent.buyerId,
      productId: input.productId ?? parent.productId,
    });

    const counterInput: CreateProposalInput = {
      title,
      description:
        input.description !== undefined
          ? input.description
          : parent.description,
      quantity: input.quantity ?? parent.quantity,
      amountCents: input.amountCents ?? parent.amountCents,
      currency: input.currency ?? parent.currency,
      requestedDate:
        input.requestedDate !== undefined
          ? input.requestedDate
          : parent.requestedDate?.toISOString() ?? null,
      requestedTimeWindow:
        input.requestedTimeWindow !== undefined
          ? input.requestedTimeWindow
          : parent.requestedTimeWindow,
      fulfillmentType: input.fulfillmentType ?? parent.fulfillmentType,
      category: input.category ?? parent.category,
      expiresAt:
        input.expiresAt !== undefined
          ? input.expiresAt
          : parent.expiresAt?.toISOString() ?? null,
      productId: input.productId ?? parent.productId,
      listingId: input.listingId ?? parent.listingId,
      settlementMode: input.settlementMode ?? parent.settlementMode,
      acceptedValueTaxonomyIds:
        input.acceptedValueTaxonomyIds ?? parent.acceptedValueTaxonomyIds,
      requestedValueTaxonomyIds:
        input.requestedValueTaxonomyIds ?? parent.requestedValueTaxonomyIds,
      paymentPath:
        input.paymentPath ??
        paymentPathFromSummary(
          parent.proposalSummary as AgreementSummarySnapshot | null,
        ),
    };
    const boundProductId = input.productId ?? parent.productId;
    const fields = await resolveProposalFields(counterInput, title, boundProductId);

    const result = await prisma.$transaction(async (tx) => {
      const parentUpdate = await tx.proposal.updateMany({
        where: { id: proposalId, status: 'PENDING' },
        data: { status: 'COUNTERED' },
      });
      if (parentUpdate.count !== 1) {
        throw new ProposalServiceError('Proposal is no longer pending', 409);
      }

      const child = await tx.proposal.create({
        data: {
          conversationId: parent.conversationId,
          createdById: userId,
          sellerId,
          buyerId,
          productId: fields.boundProductId,
          listingId: input.listingId ?? parent.listingId,
          title,
          description:
            input.description !== undefined
              ? input.description?.trim() || null
              : parent.description,
          quantity: input.quantity ?? parent.quantity,
          amountCents: input.amountCents ?? parent.amountCents,
          currency: input.currency?.trim() || parent.currency,
          requestedDate:
            input.requestedDate !== undefined
              ? parseOptionalDate(input.requestedDate)
              : parent.requestedDate,
          requestedTimeWindow:
            input.requestedTimeWindow !== undefined
              ? input.requestedTimeWindow?.trim() || null
              : parent.requestedTimeWindow,
          fulfillmentType: input.fulfillmentType ?? parent.fulfillmentType,
          category: input.category ?? parent.category,
          settlementMode: fields.settlementMode,
          acceptedValueTaxonomyIds: fields.acceptedValueTaxonomyIds,
          requestedValueTaxonomyIds: fields.requestedValueTaxonomyIds,
          proposalSummary: fields.proposalSummary as object,
          expiresAt:
            input.expiresAt !== undefined
              ? parseOptionalDate(input.expiresAt)
              : parent.expiresAt,
          parentProposalId: parent.id,
          status: 'PENDING',
        },
      });

      const message = await tx.message.create({
        data: {
          conversationId: parent.conversationId,
          senderId: userId,
          proposalId: child.id,
          messageType: 'PROPOSAL',
          isEncrypted: false,
        },
        include: { User: { select: MESSAGE_USER_SELECT } },
      });

      await tx.conversation.update({
        where: { id: parent.conversationId },
        data: { lastMessageAt: new Date(), isActive: true },
      });

      return { child, message, parentCreatorId: parent.createdById };
    });

    void syncConversationStatusAfterMessage(parent.conversationId).catch((e) =>
      console.warn('[proposal-service] status sync', e),
    );

    const parentDto = serializeProposal(
      await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId } }),
    );
    const childDto = serializeProposal(result.child);

    await emitProposalUpdated(parent.conversationId, {
      proposalId: parentDto.id,
      status: parentDto.status,
      proposal: parentDto,
      triggeredBy: userId,
      timestamp: new Date().toISOString(),
    });
    await broadcastProposal(
      childDto,
      userId,
      result.message as unknown as Record<string, unknown>,
    );
    await notifyProposalEvent(
      result.parentCreatorId,
      userId,
      'PROPOSAL_COUNTERED',
      childDto,
    );

    return {
      proposal: childDto,
      message: result.message as unknown as Record<string, unknown>,
    };
  }

  static async cancelProposal(
    userId: string,
    proposalId: string,
  ): Promise<ProposalActionResult> {
    const existing = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });
    if (!existing) {
      throw new ProposalServiceError('Proposal not found', 404);
    }

    await assertParticipant(existing.conversationId, userId);

    if (existing.createdById !== userId) {
      throw new ProposalServiceError('Only the creator can cancel', 403);
    }
    if (existing.status !== 'PENDING') {
      throw new ProposalServiceError(`Proposal is ${existing.status}`, 409);
    }

    const updated = await prisma.proposal.updateMany({
      where: { id: proposalId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    if (updated.count !== 1) {
      throw new ProposalServiceError('Proposal is no longer pending', 409);
    }

    const proposal = await prisma.proposal.findUniqueOrThrow({
      where: { id: proposalId },
    });

    const systemMessage = await createProposalMessage(
      proposal.conversationId,
      userId,
      proposal.id,
      'PROPOSAL_SYSTEM',
      PROPOSAL_SYSTEM_MESSAGE_KEYS.cancelled,
    );

    const dto = serializeProposal(proposal);
    await broadcastProposal(
      dto,
      userId,
      systemMessage as unknown as Record<string, unknown>,
    );

    return {
      proposal: dto,
      message: systemMessage as unknown as Record<string, unknown>,
    };
  }

  static async getProposal(userId: string, proposalId: string): Promise<ProposalDTO> {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    });
    if (!proposal) {
      throw new ProposalServiceError('Proposal not found', 404);
    }
    await assertParticipant(proposal.conversationId, userId);
    return serializeProposal(proposal);
  }

  static async listProposalsForConversation(
    userId: string,
    conversationId: string,
  ): Promise<ProposalDTO[]> {
    await assertParticipant(conversationId, userId);
    const rows = await prisma.proposal.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(serializeProposal);
  }

  static async listCommunityOrdersForConversation(
    userId: string,
    conversationId: string,
  ): Promise<CommunityOrderDTO[]> {
    await assertParticipant(conversationId, userId);
    const rows = await prisma.communityOrder.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(serializeCommunityOrder);
  }

  static async listDeliveryRequestsByProposalForConversation(
    userId: string,
    conversationId: string,
  ): Promise<Record<string, DeliveryRequestDTO>> {
    await assertParticipant(conversationId, userId);
    const orders = await prisma.communityOrder.findMany({
      where: { conversationId },
      select: { id: true, proposalId: true },
    });
    if (orders.length === 0) return {};

    const orderIdToProposalId = new Map(
      orders.map((o) => [o.id, o.proposalId]),
    );
    const requests = await prisma.deliveryRequest.findMany({
      where: { communityOrderId: { in: orders.map((o) => o.id) } },
      orderBy: { createdAt: 'desc' },
      include: {
        Assignments: {
          where: { status: { in: ['PENDING', 'ACCEPTED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const byProposal: Record<string, DeliveryRequestDTO> = {};
    for (const row of requests) {
      const proposalId = orderIdToProposalId.get(row.communityOrderId);
      if (!proposalId || byProposal[proposalId]) continue;
      byProposal[proposalId] = serializeDeliveryRequest(
        row,
        row.Assignments[0] ?? null,
      );
    }
    return byProposal;
  }
}
