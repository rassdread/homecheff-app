import type { Prisma, PrismaClient } from '@prisma/client';
import { audienceLabel, type AudienceId } from '@/lib/admin/notification-audience';
import {
  HISTORY_INCOMPLETE_NOTE,
  campaignRecordId,
  channelDisplayName,
  channelsFromMessageType,
  contentFingerprint,
  describeChannelOutcomes,
  filterHistorySends,
  priorFromStoredNotice,
  readStoredBroadcastNotice,
  rowsForHistoryQuery,
  type HistoryChannelStatus,
  type HistoryListSend,
  type HistoryMembership,
  type HistoryOutcome,
  duplicatePlanLines,
  isDeliveryChannel,
  planContentDeliveries,
  priorDeliveryId,
  type ContentDeliveryDecision,
  type DeliveryChannel,
  type DeliveryRecordStatus,
  type PriorDelivery,
} from '@/lib/admin/broadcast-history';

type HistoryDb = Pick<PrismaClient, 'auditLog' | 'user' | 'notification'>;

const PRIOR_KIND = 'admin_broadcast_prior';
const CAMPAIGN_KIND = 'admin_broadcast_campaign';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function parsePrior(meta: unknown, id: string): PriorDelivery | null {
  const record = asRecord(meta);
  if (!record || record.kind !== PRIOR_KIND || !isDeliveryChannel(record.channel)) return null;
  const status = record.status;
  if (status !== 'created' && status !== 'accepted' && status !== 'failed' && status !== 'unconfirmed') return null;
  const userId = typeof record.userId === 'string' ? record.userId : '';
  const at = typeof record.at === 'string' ? record.at : '';
  const campaignId = typeof record.campaignId === 'string' ? record.campaignId : '';
  if (!userId || !at) return null;
  return { userId, channel: record.channel, status, at, campaignId: campaignId || id };
}

export async function findPriorDeliveries(
  db: HistoryDb,
  userIds: string[],
  content: { title: string; subject: string; message: string; channels: DeliveryChannel[] },
): Promise<PriorDelivery[]> {
  const ids: string[] = [];
  for (const userId of [...new Set(userIds)]) {
    for (const channel of content.channels) {
      ids.push(priorDeliveryId(userId, channel, contentFingerprint(channel, content.title, content.subject, content.message)));
    }
  }
  const found: PriorDelivery[] = [];
  for (let i = 0; i < ids.length; i += 500) {
    const slice = ids.slice(i, i + 500);
    const rows = await db.auditLog.findMany({
      where: { id: { in: slice } },
      select: { id: true, meta: true },
    });
    for (const row of rows) {
      const prior = parsePrior(row.meta, row.id);
      if (prior) found.push(prior);
    }
  }
  const uniqueUsers = [...new Set(userIds)];
  for (let i = 0; i < uniqueUsers.length; i += 200) {
    const slice = uniqueUsers.slice(i, i + 200);
    const text = content.message.replace(/\r\n/g, '\n').trim();
    const notices = await db.notification.findMany({
      where: {
        userId: { in: slice },
        type: 'ADMIN_NOTICE',
        OR: [
          { payload: { path: ['message'], equals: text } },
          { payload: { path: ['body'], equals: text } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { userId: true, payload: true, createdAt: true },
    });
    for (const notice of notices) {
      const prior = priorFromStoredNotice({
        userId: notice.userId,
        payload: notice.payload,
        at: notice.createdAt.toISOString(),
        content,
      });
      if (!prior || !content.channels.includes(prior.channel)) continue;
      if (found.some((item) => item.userId === prior.userId && item.channel === prior.channel && deliveryBlocks(item.status))) continue;
      found.push(prior);
    }
  }
  return found;
}

function deliveryBlocks(status: PriorDelivery['status']): boolean {
  return status === 'created' || status === 'accepted';
}

export function decideContentDeliveries(input: {
  userIds: string[];
  channels: DeliveryChannel[];
  priors: PriorDelivery[];
  confirmRepeat: boolean;
}): { decisions: ContentDeliveryDecision[]; lines: string[] } {
  const decisions = planContentDeliveries(input);
  return { decisions, lines: duplicatePlanLines(decisions) };
}

export function shouldSendChannel(decisions: ContentDeliveryDecision[], userId: string, channel: DeliveryChannel): boolean {
  const decision = decisions.find((item) => item.userId === userId && item.channel === channel);
  return !decision || decision.action === 'send' || decision.action === 'repeat';
}

export async function recordPriorDelivery(
  db: HistoryDb,
  input: {
    userId: string;
    channel: DeliveryChannel;
    status: DeliveryRecordStatus;
    at: string;
    campaignId: string;
    title: string;
    subject: string;
    message: string;
  },
): Promise<void> {
  const id = priorDeliveryId(
    input.userId,
    input.channel,
    contentFingerprint(input.channel, input.title, input.subject, input.message),
  );
  const existing = await db.auditLog.findUnique({ where: { id }, select: { meta: true } });
  const current = parsePrior(existing?.meta, id);
  const status = current && (current.status === 'created' || current.status === 'accepted') ? current.status : input.status;
  const at = current && (current.status === 'created' || current.status === 'accepted') ? current.at : input.at;
  const meta: Prisma.InputJsonValue = {
    kind: PRIOR_KIND,
    userId: input.userId,
    channel: input.channel,
    status,
    at,
    campaignId: input.campaignId,
  };
  await db.auditLog.upsert({
    where: { id },
    create: { id, userId: input.userId, action: PRIOR_KIND, meta },
    update: { meta },
  });
}

export async function recordBroadcastCampaign(
  db: HistoryDb,
  input: {
    campaignId: string;
    source: 'notifications' | 'users';
    subject: string;
    title: string;
    message: string;
    audience: string;
    channels: { inApp: boolean; push: boolean; email: boolean };
    at: string;
  },
): Promise<void> {
  const id = campaignRecordId(input.campaignId);
  const audience = (['applicable', 'all', 'buyers', 'sellers', 'delivery'] as AudienceId[]).includes(input.audience as AudienceId)
    ? audienceLabel(input.audience as AudienceId)
    : input.audience || 'Gekozen ontvangers';
  const meta: Prisma.InputJsonValue = {
    kind: CAMPAIGN_KIND,
    source: input.source,
    subject: input.subject,
    title: input.title,
    message: input.message,
    audience,
    channels: input.channels,
    at: input.at,
    incomplete: false,
  };
  await db.auditLog.upsert({
    where: { id },
    create: { id, action: CAMPAIGN_KIND, meta },
    update: { meta },
  });
}

export type HistoryFocus = {
  userId: string;
  name: string;
  email: string | null;
  channels: HistoryChannelStatus[];
};

export type HistorySummary = {
  id: string;
  subject: string;
  at: string;
  audience: string;
  channels: string[];
  recipientCount: number;
  incomplete: boolean;
  note: string | null;
  focus: HistoryFocus | null;
};

export type HistoryRecipient = {
  id: string;
  name: string;
  email: string | null;
  channels: HistoryChannelStatus[];
};

export type HistoryDetail = {
  summary: HistorySummary;
  message: string;
  messageMissing: boolean;
  recipients: HistoryRecipient[];
};

type BuiltSend = {
  list: HistoryListSend;
  message: string;
  recipients: HistoryRecipient[];
};

function channelIdsFromMeta(meta: Record<string, unknown> | null): DeliveryChannel[] | null {
  const channels = asRecord(meta?.channels);
  if (!channels) return null;
  const ids: DeliveryChannel[] = [];
  if (channels.inApp === true) ids.push('inApp');
  if (channels.push === true) ids.push('push');
  if (channels.email === true) ids.push('email');
  return ids.length > 0 ? ids : null;
}

function emailOutcome(value: unknown): HistoryOutcome | null {
  if (value === 'accepted' || value === 'failed' || value === 'unconfirmed' || value === 'suppressed' || value === 'skipped_duplicate') {
    return value;
  }
  return null;
}

function pushOutcome(value: unknown): HistoryOutcome | null {
  if (value === 'offered' || value === 'accepted') return 'accepted';
  if (value === 'failed' || value === 'no_token' || value === 'skipped_duplicate') return value;
  return null;
}

function toSummary(send: HistoryListSend, focus: HistoryFocus | null): HistorySummary {
  return {
    id: send.id,
    subject: send.subject,
    at: send.at,
    audience: send.audience,
    channels: send.channels,
    recipientCount: send.recipientCount,
    incomplete: send.incomplete,
    note: send.note,
    focus,
  };
}

type NoticeRow = { userId: string; payload: unknown; createdAt: Date };
type LedgerRow = { id: string; userId: string | null; meta: unknown };
type UserRow = { id: string; name: string | null; email: string | null; username: string | null };

function ledgerCampaignId(id: string): { campaignId: string; userId: string } | null {
  const match = id.match(/^abr:([^:]+):([^:]+)$/);
  if (!match?.[1] || !match[2]) return null;
  return { campaignId: match[1], userId: match[2] };
}

function buildSend(input: {
  id: string;
  at: string;
  subject: string;
  message: string;
  audience: string;
  channels: DeliveryChannel[];
  incomplete: boolean;
  notices: NoticeRow[];
  ledgers: LedgerRow[];
  users: Map<string, UserRow>;
}): BuiltSend {
  const noticeByUser = new Map<string, NoticeRow>();
  for (const notice of input.notices) {
    if (!noticeByUser.has(notice.userId)) noticeByUser.set(notice.userId, notice);
  }
  const ledgerByUser = new Map<string, LedgerRow>();
  for (const ledger of input.ledgers) {
    const parsed = ledgerCampaignId(ledger.id);
    const userId = ledger.userId || parsed?.userId || '';
    if (userId && !ledgerByUser.has(userId)) ledgerByUser.set(userId, ledger);
  }
  const userIds = [...new Set([...noticeByUser.keys(), ...ledgerByUser.keys()])];
  const recipients: HistoryRecipient[] = userIds.map((userId) => {
    const user = input.users.get(userId);
    const ledger = asRecord(ledgerByUser.get(userId)?.meta);
    const state: Partial<Record<DeliveryChannel, HistoryOutcome>> = {};
    if (input.channels.includes('inApp')) {
      state.inApp = ledger?.inApp === true || noticeByUser.has(userId) ? 'created' : 'missing';
    }
    if (input.channels.includes('email')) state.email = emailOutcome(ledger?.email) ?? 'missing';
    if (input.channels.includes('push')) state.push = pushOutcome(ledger?.push) ?? 'missing';
    return {
      id: userId,
      name: user?.name || user?.username || 'Gebruiker',
      email: user?.email || null,
      channels: describeChannelOutcomes(input.channels, state),
    };
  }).sort((left, right) => left.name.localeCompare(right.name, 'nl'));
  const list: HistoryListSend = {
    id: input.id,
    subject: input.subject,
    at: input.at,
    audience: input.audience,
    channels: input.channels.map(channelDisplayName),
    channelIds: input.channels,
    recipientCount: userIds.length,
    incomplete: input.incomplete,
    note: input.incomplete ? HISTORY_INCOMPLETE_NOTE : null,
  };
  return { list, message: input.message, recipients };
}

async function loadBroadcastSends(db: HistoryDb): Promise<BuiltSend[]> {
  const [campaigns, notices, ledgers] = await Promise.all([
    db.auditLog.findMany({
      where: { action: CAMPAIGN_KIND },
      orderBy: { createdAt: 'desc' },
      take: 80,
      select: { id: true, meta: true, createdAt: true },
    }),
    db.notification.findMany({
      where: { type: 'ADMIN_NOTICE' },
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: { userId: true, payload: true, createdAt: true },
    }),
    db.auditLog.findMany({
      where: { action: 'admin_broadcast_recipient' },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: { id: true, userId: true, meta: true },
    }),
  ]);
  const noticesBySend = new Map<string, NoticeRow[]>();
  const storedBySend = new Map<string, ReturnType<typeof readStoredBroadcastNotice>>();
  for (const notice of notices) {
    const stored = readStoredBroadcastNotice(notice.payload);
    if (!stored) continue;
    const rows = noticesBySend.get(stored.broadcastId) || [];
    rows.push(notice);
    noticesBySend.set(stored.broadcastId, rows);
    if (!storedBySend.has(stored.broadcastId)) storedBySend.set(stored.broadcastId, stored);
  }
  const ledgersBySend = new Map<string, LedgerRow[]>();
  for (const ledger of ledgers) {
    const parsed = ledgerCampaignId(ledger.id);
    if (!parsed) continue;
    const rows = ledgersBySend.get(parsed.campaignId) || [];
    rows.push(ledger);
    ledgersBySend.set(parsed.campaignId, rows);
  }
  const headers = new Map<string, { meta: Record<string, unknown>; createdAt: Date }>();
  for (const campaign of campaigns) {
    const meta = asRecord(campaign.meta);
    if (!meta || meta.kind !== CAMPAIGN_KIND) continue;
    headers.set(campaign.id.replace(/^abc:/, ''), { meta, createdAt: campaign.createdAt });
  }
  const ids = new Set<string>([...headers.keys(), ...noticesBySend.keys(), ...ledgersBySend.keys()]);
  const userIds = new Set<string>();
  for (const rows of noticesBySend.values()) {
    for (const row of rows) userIds.add(row.userId);
  }
  for (const rows of ledgersBySend.values()) {
    for (const row of rows) {
      const parsed = ledgerCampaignId(row.id);
      const userId = row.userId || parsed?.userId;
      if (userId) userIds.add(userId);
    }
  }
  const users = userIds.size
    ? await db.user.findMany({
        where: { id: { in: [...userIds] } },
        select: { id: true, name: true, email: true, username: true },
      })
    : [];
  const userMap = new Map(users.map((user) => [user.id, user]));
  const built: BuiltSend[] = [];
  for (const id of ids) {
    const header = headers.get(id);
    const stored = storedBySend.get(id);
    const headerChannels = channelIdsFromMeta(header?.meta ?? null);
    const channels = headerChannels || channelsFromMessageType(stored?.messageType ?? null);
    const headerMessage = typeof header?.meta.message === 'string' ? header.meta.message : '';
    const message = headerMessage.trim() ? headerMessage : stored?.message || '';
    const subject = typeof header?.meta.subject === 'string' && header.meta.subject.trim()
      ? header.meta.subject
      : typeof header?.meta.title === 'string' && header.meta.title.trim()
        ? header.meta.title
        : stored?.title || 'Bericht zonder onderwerp';
    const at = typeof header?.meta.at === 'string'
      ? header.meta.at
      : header?.createdAt.toISOString()
        || noticesBySend.get(id)?.reduce((earliest, notice) => (
          notice.createdAt.toISOString() < earliest ? notice.createdAt.toISOString() : earliest
        ), noticesBySend.get(id)?.[0]?.createdAt.toISOString() || new Date(0).toISOString())
        || new Date(0).toISOString();
    built.push(buildSend({
      id,
      at,
      subject,
      message,
      audience: typeof header?.meta.audience === 'string' ? header.meta.audience : 'Niet geregistreerd',
      channels,
      incomplete: !header || header.meta.incomplete === true,
      notices: noticesBySend.get(id) || [],
      ledgers: ledgersBySend.get(id) || [],
      users: userMap,
    }));
  }
  return built;
}

export async function listBroadcastHistory(
  db: HistoryDb,
  input: { query: string; from: string | null; to: string | null; channel: 'all' | DeliveryChannel },
): Promise<HistorySummary[]> {
  const sends = await loadBroadcastSends(db);
  const visible = filterHistorySends(sends.map((send) => send.list), input);
  const visibleIds = new Set(visible.map((send) => send.id));
  const membership: HistoryMembership[] = sends.flatMap((send) => {
    if (!visibleIds.has(send.list.id)) return [];
    return send.recipients.map((recipient) => ({
      sendId: send.list.id,
      userId: recipient.id,
      channels: recipient.channels,
    }));
  });
  const query = input.query.trim();
  const people = query
    ? await db.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { username: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: { id: true, name: true, email: true, username: true },
        take: 20,
      })
    : [];
  return rowsForHistoryQuery({
    sends: visible,
    membership,
    people,
    query,
  }).slice(0, 50).map((row) => toSummary(row, row.focus));
}

export async function readBroadcastHistory(db: HistoryDb, campaignId: string): Promise<HistoryDetail | null> {
  const sends = await loadBroadcastSends(db);
  const send = sends.find((item) => item.list.id === campaignId);
  if (!send) return null;
  return {
    summary: toSummary(send.list, null),
    message: send.message,
    messageMissing: send.message.trim().length === 0,
    recipients: send.recipients,
  };
}
