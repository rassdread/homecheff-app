import type { ChatThreadMessage, ChatThreadUser } from '@/components/chat/chatThreadTypes';
import { reportMessagingDiagnostic } from '@/lib/chat/messagingDiagnostics';

function str(v: unknown, max = 400): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > max ? s.slice(0, max) : s;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown): boolean {
  return v === true || v === 'true';
}

/** Participant row for conversation list / header (never undefined id when returned). */
export type NormalizedParticipant = {
  id: string;
  name: string | null;
  username: string | null;
  profileImage: string | null;
  displayFullName: boolean | null;
  displayNameOption: string | null;
  /** Alleen relevant op gesprekspartner; ontbreekt vaak in lijst-payloads. */
  sellerVerified?: boolean | null;
};

export function normalizeParticipant(
  raw: unknown,
  fallbackId?: string | null
): NormalizedParticipant | null {
  if (!raw || typeof raw !== 'object') {
    const fid = str(fallbackId, 64);
    if (!fid) return null;
    reportMessagingDiagnostic('conv_participant_stub', { reason: 'empty' });
    return {
      id: fid,
      name: null,
      username: null,
      profileImage: null,
      displayFullName: null,
      displayNameOption: null,
    };
  }
  const o = raw as Record<string, unknown>;
  const id = str(o.id, 64) ?? str(fallbackId, 64) ?? str(o.userId, 64);
  if (!id) return null;
  const sv = o.sellerVerified;
  return {
    id,
    name: str(o.name, 200),
    username: str(o.username, 80),
    profileImage: str(o.profileImage, 2000),
    displayFullName:
      o.displayFullName === null || o.displayFullName === undefined
        ? null
        : Boolean(o.displayFullName),
    displayNameOption: str(o.displayNameOption, 64),
    sellerVerified:
      sv === true ? true : sv === false ? false : undefined,
  };
}

export type NormalizedLastMessageUser = {
  id: string;
  name: string | null;
  username: string | null;
  profileImage: string | null;
  displayFullName: boolean | null;
  displayNameOption: string | null;
};

export type NormalizedLastMessage = {
  id: string;
  text: string | null;
  messageType: string;
  createdAt: string;
  readAt: string | null;
  orderNumber?: string | null;
  User: NormalizedLastMessageUser;
};

export function normalizeLastMessage(raw: unknown): NormalizedLastMessage | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id, 80);
  const senderId = str(o.senderId, 64);
  if (!id) {
    reportMessagingDiagnostic('conv_last_message_invalid', { reason: 'no_id' });
    return null;
  }
  let createdAt = str(o.createdAt, 80);
  if (!createdAt || !Number.isFinite(Date.parse(createdAt))) {
    createdAt = new Date().toISOString();
  }
  const uRaw = o.User;
  let user: NormalizedLastMessageUser;
  if (uRaw && typeof uRaw === 'object') {
    const u = uRaw as Record<string, unknown>;
    const uid = str(u.id, 64) ?? senderId ?? 'unknown';
    user = {
      id: uid,
      name: str(u.name, 200),
      username: str(u.username, 80),
      profileImage: str(u.profileImage, 2000),
      displayFullName:
        u.displayFullName === null || u.displayFullName === undefined
          ? null
          : Boolean(u.displayFullName),
      displayNameOption: str(u.displayNameOption, 64),
    };
  } else {
    const sid = senderId ?? 'unknown';
    user = {
      id: sid,
      name: null,
      username: null,
      profileImage: null,
      displayFullName: null,
      displayNameOption: null,
    };
  }
  const mt = str(o.messageType, 48) ?? 'TEXT';
  return {
    id,
    text: o.text === undefined || o.text === null ? null : String(o.text),
    messageType: mt,
    createdAt,
    readAt:
      o.readAt === null || o.readAt === undefined
        ? null
        : str(o.readAt, 80) ?? null,
    orderNumber: str(o.orderNumber, 64),
    User: user,
  };
}

export type NormalizedRelationshipContext = {
  youFollowThem: boolean;
  theyFollowYou: boolean;
  messageCount: number;
  productTitle: string | null;
  productCategory: string | null;
};

export function normalizeRelationshipContext(
  raw: unknown
): NormalizedRelationshipContext | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const mc = num(o.messageCount, 0);
  const title = str(o.productTitle, 200);
  const catRaw = o.productCategory;
  const productCategory =
    catRaw == null || catRaw === undefined
      ? null
      : str(String(catRaw), 80);
  return {
    youFollowThem: bool(o.youFollowThem),
    theyFollowYou: bool(o.theyFollowYou),
    messageCount: mc < 0 ? 0 : mc > 1_000_000 ? 1_000_000 : Math.floor(mc),
    productTitle: title,
    productCategory,
  };
}

export type NormalizedProductSnippet = {
  id: string;
  title: string;
  priceCents: number;
  Image: Array<{ fileUrl: string; sortOrder: number }>;
  category?: string | null;
};

export function normalizeProductSnippet(raw: unknown): NormalizedProductSnippet | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id, 64);
  if (!id) return null;
  const title = str(o.title, 300) ?? '';
  const priceCents = Math.max(0, Math.floor(num(o.priceCents, 0)));
  const images: Array<{ fileUrl: string; sortOrder: number }> = [];
  if (Array.isArray(o.Image)) {
    for (const row of o.Image) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const fileUrl = str(r.fileUrl, 2000);
      if (!fileUrl) continue;
      images.push({
        fileUrl,
        sortOrder: Math.floor(num(r.sortOrder, 0)),
      });
    }
  }
  return {
    id,
    title,
    priceCents,
    Image: images,
    category: str(o.category, 64),
  };
}

export type NormalizedOrderSnippet = {
  id: string;
  orderNumber: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
};

export function normalizeOrderSnippet(raw: unknown): NormalizedOrderSnippet | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id, 64);
  if (!id) return null;
  let createdAt = str(o.createdAt, 80) ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(createdAt))) createdAt = new Date().toISOString();
  return {
    id,
    orderNumber: str(o.orderNumber, 64),
    status: str(o.status, 64) ?? 'UNKNOWN',
    totalAmount: num(o.totalAmount, 0),
    createdAt,
  };
}

/** Full list row: stable shape for ConversationsList + caches. */
export type NormalizedConversationListItem = {
  id: string;
  title: string;
  product: NormalizedProductSnippet | null;
  order: NormalizedOrderSnippet | null;
  lastMessage: NormalizedLastMessage | null;
  participants: NormalizedParticipant[];
  otherParticipant: NormalizedParticipant | null;
  lastMessageAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  relationshipContext?: NormalizedRelationshipContext | null;
};

function isoDate(raw: unknown): string {
  if (raw instanceof Date) return raw.toISOString();
  const s = str(raw, 80);
  if (s && Number.isFinite(Date.parse(s))) return s;
  return new Date().toISOString();
}

function isoDateOrNull(raw: unknown): string | null {
  if (raw == null) return null;
  if (raw instanceof Date) return raw.toISOString();
  const s = str(raw, 80);
  if (!s) return null;
  return Number.isFinite(Date.parse(s)) ? s : null;
}

/**
 * Normalize any conversation-like payload from API, cache, or realtime (best-effort).
 */
export function normalizeConversationListItem(
  raw: unknown
): NormalizedConversationListItem | null {
  if (raw == null || typeof raw !== 'object') {
    reportMessagingDiagnostic('conv_list_invalid_root', {});
    return null;
  }
  const o = raw as Record<string, unknown>;
  const id = str(o.id, 64);
  if (!id) {
    reportMessagingDiagnostic('conv_list_missing_id', {});
    return null;
  }

  const participantsRaw = Array.isArray(o.participants) ? o.participants : [];
  const participants: NormalizedParticipant[] = [];
  for (const p of participantsRaw) {
    const pr = p as Record<string, unknown>;
    const n = normalizeParticipant(p, str(pr.userId, 64));
    if (n) participants.push(n);
  }

  let other: NormalizedParticipant | null = normalizeParticipant(
    o.otherParticipant,
    null
  );
  if (!other && participants.length > 0) {
    other = participants[0];
  }

  const titleFromRow = str(o.title, 400);
  const fromPeer =
    other &&
    ((other.name && other.name.trim()) || (other.username && other.username.trim()));
  const title = titleFromRow || fromPeer || 'Gesprek';

  const product = normalizeProductSnippet(o.product);
  const order = normalizeOrderSnippet(o.order);
  const lastMessage = o.lastMessage != null ? normalizeLastMessage(o.lastMessage) : null;

  const rel = o.relationshipContext != null ? normalizeRelationshipContext(o.relationshipContext) : null;

  return {
    id,
    title,
    product,
    order,
    lastMessage,
    participants,
    otherParticipant: other,
    lastMessageAt: isoDateOrNull(o.lastMessageAt),
    isActive: o.isActive !== false,
    createdAt: isoDate(o.createdAt),
    updatedAt: isoDateOrNull(o.updatedAt),
    relationshipContext: rel,
  };
}

export function normalizeConversationList(
  raw: unknown
): NormalizedConversationListItem[] {
  if (!Array.isArray(raw)) return [];
  const out: NormalizedConversationListItem[] = [];
  for (const row of raw) {
    const n = normalizeConversationListItem(row);
    if (n) out.push(n);
  }
  return out;
}

function normalizeMessageUser(raw: unknown, senderId: string): ChatThreadUser {
  if (!raw || typeof raw !== 'object') {
    return {
      id: senderId,
      name: null,
      username: null,
      profileImage: null,
      displayFullName: null,
      displayNameOption: null,
    };
  }
  const u = raw as Record<string, unknown>;
  const id = str(u.id, 64) ?? senderId;
  return {
    id,
    name: str(u.name, 200),
    username: str(u.username, 80),
    profileImage: str(u.profileImage, 2000),
    displayFullName:
      u.displayFullName === null || u.displayFullName === undefined
        ? null
        : Boolean(u.displayFullName),
    displayNameOption: str(u.displayNameOption, 64),
  };
}

const ALLOWED_MT = new Set([
  'TEXT',
  'IMAGE',
  'FILE',
  'PRODUCT_SHARE',
  'SYSTEM',
  'ORDER_STATUS_UPDATE',
  'ORDER_PICKUP_INFO',
  'ORDER_DELIVERY_INFO',
  'ORDER_ADDRESS_UPDATE',
]);

/**
 * Normalize a thread message for ChatBox / merge layers.
 */
export function normalizeChatThreadMessage(raw: unknown): ChatThreadMessage | null {
  if (!raw || typeof raw !== 'object') {
    reportMessagingDiagnostic('chat_msg_invalid', { reason: 'not_object' });
    return null;
  }
  const m = raw as Record<string, unknown>;
  const id = str(m.id, 120);
  const senderId = str(m.senderId, 64);
  if (!id || !senderId) {
    reportMessagingDiagnostic('chat_msg_invalid', { reason: 'id_or_sender' });
    return null;
  }
  let createdAt = str(m.createdAt, 80);
  if (!createdAt || !Number.isFinite(Date.parse(createdAt))) {
    createdAt = new Date().toISOString();
  }
  let mt = str(m.messageType, 48) ?? 'TEXT';
  if (!ALLOWED_MT.has(mt)) mt = 'TEXT';
  const User = normalizeMessageUser(m.User, senderId);
  return {
    id,
    text: m.text === undefined || m.text === null ? null : String(m.text),
    senderId,
    createdAt,
    readAt:
      m.readAt === null || m.readAt === undefined ? undefined : str(m.readAt, 80) ?? undefined,
    deliveredAt:
      m.deliveredAt === null || m.deliveredAt === undefined
        ? undefined
        : str(m.deliveredAt, 80) ?? undefined,
    messageType: mt as ChatThreadMessage['messageType'],
    attachmentUrl: str(m.attachmentUrl, 2000) ?? undefined,
    attachmentName: str(m.attachmentName, 400) ?? undefined,
    orderNumber: str(m.orderNumber, 64) ?? undefined,
    User,
  };
}

export function normalizeChatThreadMessageList(raw: unknown): ChatThreadMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatThreadMessage[] = [];
  for (const row of raw) {
    const n = normalizeChatThreadMessage(row);
    if (n) out.push(n);
  }
  return out;
}
