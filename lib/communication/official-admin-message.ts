/**
 * A private inbox copy of an admin send. Each recipient is the only participant,
 * so nobody else in the selection is visible. Replies stay off.
 */

export const TEAM_HOMECHEFF_LABEL = "Team HomeCheff";
export const OFFICIAL_MESSAGE_BADGE = "Officieel";

export type OfficialAdminAction = {
  label: string;
  url: string;
};

export type OfficialConversationView = {
  senderLabel: string;
  badge: string;
  subject: string;
  repliesDisabled: boolean;
  action: OfficialAdminAction | null;
};

export type OfficialAdminCopy = {
  recipientId: string;
  conversationId: string;
  participantId: string;
  messageId: string;
  subject: string;
  text: string;
  senderId: string;
  participantUserIds: string[];
  metadata: {
    official: true;
    senderLabel: typeof TEAM_HOMECHEFF_LABEL;
    badge: typeof OFFICIAL_MESSAGE_BADGE;
    subject: string;
    repliesDisabled: true;
    action: OfficialAdminAction | null;
    broadcastId: string;
  };
  pushRoute: string;
};

const SAFE_ID = /^[a-zA-Z0-9_-]{6,}$/;

export function officialMessageRoute(conversationId: string): string {
  return `/messages/${conversationId}/`;
}

export function readOfficialConversation(raw: unknown): OfficialConversationView | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  if (record.official !== true || record.repliesDisabled !== true) return null;
  const subject = typeof record.subject === "string" ? record.subject.trim() : "";
  if (!subject) return null;
  const actionRaw = record.action;
  let action: OfficialAdminAction | null = null;
  if (actionRaw && typeof actionRaw === "object") {
    const candidate = actionRaw as Record<string, unknown>;
    const label = typeof candidate.label === "string" ? candidate.label.trim() : "";
    const url = typeof candidate.url === "string" ? candidate.url.trim() : "";
    if (label && isHomeCheffHttpsUrl(url)) action = { label, url };
  }
  return {
    senderLabel: TEAM_HOMECHEFF_LABEL,
    badge: OFFICIAL_MESSAGE_BADGE,
    subject,
    repliesDisabled: true,
    action,
  };
}

export function isHomeCheffHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "homecheff.eu" || host === "www.homecheff.eu") &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

export function buildOfficialAdminCopy(input: {
  recipientId: string;
  adminUserId: string;
  subject: string;
  message: string;
  action: OfficialAdminAction | null;
  broadcastId: string;
  conversationId: string;
  participantId: string;
  messageId: string;
}): OfficialAdminCopy {
  const subject = input.subject.trim() || "Bericht van Team HomeCheff";
  const text = input.message.trim();
  const action =
    input.action &&
    input.action.label.trim() &&
    isHomeCheffHttpsUrl(input.action.url.trim())
      ? { label: input.action.label.trim(), url: input.action.url.trim() }
      : null;
  return {
    recipientId: input.recipientId,
    conversationId: input.conversationId,
    participantId: input.participantId,
    messageId: input.messageId,
    subject,
    text,
    senderId: input.adminUserId,
    participantUserIds: [input.recipientId],
    metadata: {
      official: true,
      senderLabel: TEAM_HOMECHEFF_LABEL,
      badge: OFFICIAL_MESSAGE_BADGE,
      subject,
      repliesDisabled: true,
      action,
      broadcastId: input.broadcastId,
    },
    pushRoute: officialMessageRoute(input.conversationId),
  };
}

export function officialCopiesArePrivate(copies: OfficialAdminCopy[]): boolean {
  const ids = copies.map((copy) => copy.conversationId);
  if (new Set(ids).size !== ids.length) return false;
  return copies.every((copy) => {
    if (copy.participantUserIds.length !== 1) return false;
    if (copy.participantUserIds[0] !== copy.recipientId) return false;
    return copies.every(
      (other) =>
        other.recipientId === copy.recipientId ||
        !copy.participantUserIds.includes(other.recipientId)
    );
  });
}

type CopyWriter = (copy: OfficialAdminCopy) => Promise<void>;

export async function createOfficialAdminCopies(
  input: {
    adminUserId: string;
    recipientIds: string[];
    subject: string;
    message: string;
    action: OfficialAdminAction | null;
    broadcastId: string;
  },
  write: CopyWriter = writeOfficialAdminCopy,
  ids: () => string = () => crypto.randomUUID()
): Promise<OfficialAdminCopy[]> {
  const uniqueRecipients = [...new Set(input.recipientIds.filter(Boolean))];
  const copies: OfficialAdminCopy[] = [];
  for (const recipientId of uniqueRecipients) {
    const conversationId = ids();
    if (!SAFE_ID.test(conversationId)) {
      throw new Error("Official conversation id is not a safe path segment.");
    }
    const copy = buildOfficialAdminCopy({
      recipientId,
      adminUserId: input.adminUserId,
      subject: input.subject,
      message: input.message,
      action: input.action,
      broadcastId: input.broadcastId,
      conversationId,
      participantId: ids(),
      messageId: ids(),
    });
    await write(copy);
    copies.push(copy);
  }
  return copies;
}

async function writeOfficialAdminCopy(copy: OfficialAdminCopy): Promise<void> {
  const { prisma } = await import("@/lib/prisma");
  await prisma.conversation.create({
    data: {
      id: copy.conversationId,
      title: copy.subject,
      lastMessageAt: new Date(),
      metadata: copy.metadata,
      ConversationParticipant: {
        create: { id: copy.participantId, userId: copy.recipientId },
      },
      Message: {
        create: {
          id: copy.messageId,
          senderId: copy.senderId,
          text: copy.text,
          messageType: "TEXT",
        },
      },
    },
  });
}

export async function officialRepliesAreDisabled(conversationId: string): Promise<boolean> {
  const { prisma } = await import("@/lib/prisma");
  const row = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { metadata: true },
  });
  return readOfficialConversation(row?.metadata)?.repliesDisabled === true;
}
