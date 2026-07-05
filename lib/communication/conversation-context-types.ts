import type {
  ConversationContextType,
  ConversationStatus,
} from '@prisma/client';

export type { ConversationContextType, ConversationStatus };

/** Context types with live UI support in Phase 1. */
export const LIVE_CONTEXT_HEADER_TYPES: ConversationContextType[] = [
  'PRODUCT',
  'ORDER',
  'GENERAL',
];

/** Reserved for future marketplace categories — header shows placeholder only. */
export const FUTURE_CONTEXT_HEADER_TYPES: ConversationContextType[] = [
  'DELIVERY',
  'SERVICE',
  'TASK',
  'REQUEST',
  'BARTER',
  'PARTNER',
];

export type ConversationContextSnapshot = {
  contextType: ConversationContextType;
  contextId: string | null;
  status: ConversationStatus;
  metadata: Record<string, unknown> | null;
  /** Legacy FK columns (dual-read). */
  productId: string | null;
  orderId: string | null;
  reservationId: string | null;
};

export type ResolvedConversationContext = {
  contextType: ConversationContextType;
  contextId: string | null;
  legacyProductId: string | null;
  legacyOrderId: string | null;
};
