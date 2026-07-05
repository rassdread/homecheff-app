import type { ConversationStatus } from '@prisma/client';

type StatusInput = {
  status?: ConversationStatus | null;
  isActive?: boolean;
  lastMessageSenderId?: string | null;
  currentUserId: string;
  hasUnreadFromOther?: boolean;
};

/**
 * Derive effective status when DB status is still ACTIVE (default).
 * AWAITING_RESPONSE when the other party sent the last message and user should reply.
 */
export function resolveConversationStatus(input: StatusInput): ConversationStatus {
  const stored = input.status ?? 'ACTIVE';
  if (stored !== 'ACTIVE') {
    return stored;
  }

  if (!input.isActive) {
    return 'CLOSED';
  }

  const lastFromOther =
    input.lastMessageSenderId &&
    input.lastMessageSenderId !== input.currentUserId;

  if (lastFromOther && input.hasUnreadFromOther !== false) {
    return 'AWAITING_RESPONSE';
  }

  return 'ACTIVE';
}

export function isConversationAwaitingUserResponse(
  status: ConversationStatus,
): boolean {
  return status === 'AWAITING_RESPONSE';
}
