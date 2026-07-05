import type { ConversationContextType } from '@prisma/client';
import type {
  ConversationContextSnapshot,
  ResolvedConversationContext,
} from '@/lib/communication/conversation-context-types';

type LegacyConversationFields = {
  contextType?: ConversationContextType | null;
  contextId?: string | null;
  productId?: string | null;
  orderId?: string | null;
  reservationId?: string | null;
};

/**
 * Dual-read: prefer contextType/contextId; fall back to productId/orderId.
 */
export function resolveConversationContext(
  conversation: LegacyConversationFields,
): ResolvedConversationContext {
  const productId = conversation.productId?.trim() || null;
  const orderId = conversation.orderId?.trim() || null;
  const explicitType = conversation.contextType ?? null;
  const explicitId = conversation.contextId?.trim() || null;

  if (explicitType && explicitType !== 'GENERAL') {
    return {
      contextType: explicitType,
      contextId: explicitId,
      legacyProductId: productId,
      legacyOrderId: orderId,
    };
  }

  if (orderId) {
    return {
      contextType: 'ORDER',
      contextId: orderId,
      legacyProductId: productId,
      legacyOrderId: orderId,
    };
  }

  if (productId) {
    return {
      contextType: 'PRODUCT',
      contextId: productId,
      legacyProductId: productId,
      legacyOrderId: orderId,
    };
  }

  return {
    contextType: 'GENERAL',
    contextId: null,
    legacyProductId: productId,
    legacyOrderId: orderId,
  };
}

/** Dual-write payload for create/update — keeps legacy FKs in sync. */
export function buildConversationContextWrite(
  contextType: ConversationContextType,
  contextId: string | null,
): {
  contextType: ConversationContextType;
  contextId: string | null;
  productId?: string;
  orderId?: string;
} {
  const id = contextId?.trim() || null;

  if (contextType === 'PRODUCT' && id) {
    return { contextType, contextId: id, productId: id };
  }
  if (contextType === 'ORDER' && id) {
    return { contextType, contextId: id, orderId: id };
  }

  return { contextType, contextId: id };
}

export function conversationContextFromProduct(productId: string) {
  return buildConversationContextWrite('PRODUCT', productId);
}

export function conversationContextFromOrder(orderId: string) {
  return buildConversationContextWrite('ORDER', orderId);
}

export function toContextSnapshot(
  conversation: LegacyConversationFields & {
    status?: ConversationContextSnapshot['status'];
    metadata?: unknown;
  },
): ConversationContextSnapshot {
  const resolved = resolveConversationContext(conversation);
  const metadata =
    conversation.metadata &&
    typeof conversation.metadata === 'object' &&
    !Array.isArray(conversation.metadata)
      ? (conversation.metadata as Record<string, unknown>)
      : null;

  return {
    contextType: resolved.contextType,
    contextId: resolved.contextId,
    status: conversation.status ?? 'ACTIVE',
    metadata,
    productId: resolved.legacyProductId,
    orderId: resolved.legacyOrderId,
    reservationId: conversation.reservationId?.trim() || null,
  };
}
