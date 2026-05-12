/**
 * WhatsApp-achtige sortering: nieuwste **berichtactiviteit** bovenaan.
 * Bron: max(lastMessageAt, lastMessage.createdAt); zonder berichten: conversation.createdAt.
 */

export type ConversationActivityInput = {
  lastMessageAt?: string | Date | null;
  lastMessage?: { createdAt?: string | Date | null } | null;
  /** Alleen voor client-weergave / toekomstige edge cases; sortering zonder berichten blijft op createdAt. */
  updatedAt?: string | Date | null;
  createdAt: string | Date;
};

function toMs(v: string | Date | null | undefined): number {
  if (v == null) return 0;
  if (typeof v === 'string') {
    const n = Date.parse(v);
    return Number.isFinite(n) ? n : 0;
  }
  if (v instanceof Date) {
    const n = v.getTime();
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === 'object' && typeof (v as Date).getTime === 'function') {
    const n = (v as Date).getTime();
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Milliseconden sinds epoch; hoger = recenter. */
export function conversationActivityMs(c: ConversationActivityInput): number {
  if (c == null || typeof c !== 'object') return 0;
  const msgAt = toMs(c.lastMessage?.createdAt ?? null);
  const convLast = toMs(c.lastMessageAt ?? null);
  const hasMessageActivity = msgAt > 0 || convLast > 0;
  if (hasMessageActivity) {
    return Math.max(msgAt, convLast);
  }
  return toMs(c.createdAt ?? null);
}

export function compareConversationsNewestFirst(
  a: ConversationActivityInput,
  b: ConversationActivityInput
): number {
  return conversationActivityMs(b) - conversationActivityMs(a);
}

export function sortConversationsByActivity<T extends ConversationActivityInput>(
  list: readonly T[]
): T[] {
  const safe = (list ?? []).filter((c): c is T => c != null && typeof c === 'object');
  return [...safe].sort(compareConversationsNewestFirst);
}

/** Event voor optimistische lijst-update (eigen verzenden + Pusher in open thread). */
export const CONVERSATION_LIST_ACTIVITY_EVENT = 'conversationListActivity' as const;

export type ConversationListActivityDetail = {
  conversationId: string;
  /** ISO — gelijk aan server `lastMessageAt` update (meestal ≈ message.createdAt). */
  lastMessageAt: string;
  lastMessage: {
    id: string;
    text: string | null;
    messageType: string;
    createdAt: string;
    readAt?: string | null;
    orderNumber?: string | null;
    /** Voor legacy/partial payloads zonder User-blok. */
    senderId?: string | null;
    User: {
      id: string;
      name?: string | null;
      username?: string | null;
      profileImage?: string | null;
      displayFullName?: boolean | null;
      displayNameOption?: string | null;
    };
  };
};

export function dispatchConversationListActivity(detail: ConversationListActivityDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CONVERSATION_LIST_ACTIVITY_EVENT, { detail }));
}
