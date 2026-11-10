import type { Prisma, PrismaClient } from '@prisma/client';
import { audienceLabel, type AudienceId } from '@/lib/admin/notification-audience';
import {
  HISTORY_INCOMPLETE_NOTE,
  campaignRecordId,
  channelOutcomeLabel,
  contentFingerprint,
  priorFromStoredNotice,
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

export type HistorySummary = {
  id: string;
  subject: string;
  at: string;
  audience: string;
  channels: string[];
  incomplete: boolean;
  note: string | null;
};

export type HistoryRecipient = {
  id: string;
  name: string;
  email: string | null;
  message: string;
  channels: Array<{ channel: string; status: string }>;
};

function channelNames(channels: { inApp?: boolean; push?: boolean; email?: boolean } | null): string[] {
  const names: string[] = [];
  if (channels?.inApp) names.push('In-app');
  if (channels?.push) names.push('Push');
  if (channels?.email) names.push('E-mail');
  return names;
}

function summaryFromMeta(id: string, meta: Record<string, unknown>, createdAt: Date): HistorySummary {
  const channels = asRecord(meta.channels);
  const incomplete = meta.incomplete === true;
  return {
    id,
    subject: typeof meta.subject === 'string' && meta.subject.trim() ? meta.subject : typeof meta.title === 'string' ? meta.title : 'Bericht zonder onderwerp',
    at: typeof meta.at === 'string' ? meta.at : createdAt.toISOString(),
    audience: typeof meta.audience === 'string' ? meta.audience : 'Niet geregistreerd',
    channels: channelNames({
      inApp: channels?.inApp === true,
      push: channels?.push === true,
      email: channels?.email === true,
    }),
    incomplete,
    note: incomplete ? HISTORY_INCOMPLETE_NOTE : null,
  };
}

export async function listBroadcastHistory(db: HistoryDb, query: string): Promise<HistorySummary[]> {
  const q = query.trim().toLowerCase();
  const campaigns = await db.auditLog.findMany({
    where: { action: CAMPAIGN_KIND },
    orderBy: { createdAt: 'desc' },
    take: 80,
    select: { id: true, meta: true, createdAt: true },
  });
  const summaries = campaigns.flatMap((row) => {
    const meta = asRecord(row.meta);
    if (!meta || meta.kind !== CAMPAIGN_KIND) return [];
    return [summaryFromMeta(row.id.replace(/^abc:/, ''), meta, row.createdAt)];
  });
  const known = new Set(summaries.map((item) => item.id));
  const notices = await db.notification.findMany({
    where: { type: 'ADMIN_NOTICE' },
    orderBy: { createdAt: 'desc' },
    take: 150,
    select: { id: true, payload: true, createdAt: true },
  });
  const reconstructed = new Map<string, HistorySummary>();
  for (const notice of notices) {
    const payload = asRecord(notice.payload);
    const broadcastId = typeof payload?.broadcastId === 'string' ? payload.broadcastId : '';
    if (!broadcastId || known.has(broadcastId) || reconstructed.has(broadcastId)) continue;
    const title = typeof payload?.title === 'string' ? payload.title : 'Bericht zonder onderwerp';
    reconstructed.set(broadcastId, {
      id: broadcastId,
      subject: title,
      at: notice.createdAt.toISOString(),
      audience: 'Niet geregistreerd',
      channels: ['In-app'],
      incomplete: true,
      note: HISTORY_INCOMPLETE_NOTE,
    });
  }
  const combined = [...summaries, ...reconstructed.values()];
  if (!q) return combined.slice(0, 50);
  const users = await db.user.findMany({
    where: {
      OR: [
        { name: { contains: query.trim(), mode: 'insensitive' } },
        { email: { contains: query.trim(), mode: 'insensitive' } },
        { username: { contains: query.trim(), mode: 'insensitive' } },
      ],
    },
    select: { id: true },
    take: 20,
  });
  const userIds = new Set(users.map((user) => user.id));
  const recipientHits = userIds.size
    ? await db.auditLog.findMany({
        where: { userId: { in: [...userIds] }, action: { in: [PRIOR_KIND, 'admin_broadcast_recipient'] } },
        select: { meta: true, id: true },
        take: 200,
      })
    : [];
  const campaignHits = new Set<string>();
  if (userIds.size) {
    const notes = await db.notification.findMany({
      where: { userId: { in: [...userIds] }, type: 'ADMIN_NOTICE' },
      select: { payload: true },
      take: 100,
    });
    for (const note of notes) {
      const payload = asRecord(note.payload);
      if (typeof payload?.broadcastId === 'string') campaignHits.add(payload.broadcastId);
    }
  }
  for (const row of recipientHits) {
    const meta = asRecord(row.meta);
    if (typeof meta?.campaignId === 'string') campaignHits.add(meta.campaignId);
    const ledger = row.id.match(/^abr:([^:]+):/);
    if (ledger?.[1]) campaignHits.add(ledger[1]);
  }
  return combined
    .filter((item) => {
      const text = `${item.subject} ${item.audience}`.toLowerCase();
      return text.includes(q) || campaignHits.has(item.id);
    })
    .slice(0, 50);
}

export async function readBroadcastHistory(db: HistoryDb, campaignId: string): Promise<{
  summary: HistorySummary;
  message: string;
  recipients: HistoryRecipient[];
} | null> {
  const header = await db.auditLog.findUnique({
    where: { id: campaignRecordId(campaignId) },
    select: { meta: true, createdAt: true },
  });
  const headerMeta = asRecord(header?.meta);
  if (header && headerMeta?.kind === CAMPAIGN_KIND) {
    const summary = summaryFromMeta(campaignId, headerMeta, header.createdAt);
    const message = typeof headerMeta.message === 'string' ? headerMeta.message : '';
    const ledgers = await db.auditLog.findMany({
      where: { id: { startsWith: `abr:${campaignId.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 80)}:` } },
      select: { id: true, userId: true, meta: true },
      take: 500,
    });
    const userIds = ledgers.map((row) => row.userId).filter((id): id is string => Boolean(id));
    const users = userIds.length
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, email: true, username: true },
        })
      : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    const recipients: HistoryRecipient[] = ledgers.flatMap((row) => {
      if (!row.userId) return [];
      const meta = asRecord(row.meta);
      const user = byId.get(row.userId);
      const channels = [
        { channel: 'In-app', status: meta?.inApp === true ? channelOutcomeLabel('inApp', 'created') : channelOutcomeLabel('inApp', 'missing') },
        {
          channel: 'Push',
          status: channelOutcomeLabel(
            'push',
            meta?.push === 'offered' ? 'accepted' : meta?.push === 'failed' ? 'failed' : meta?.push === 'no_token' ? 'no_token' : 'missing',
          ),
        },
        {
          channel: 'E-mail',
          status: channelOutcomeLabel(
            'email',
            meta?.email === 'accepted'
              ? 'accepted'
              : meta?.email === 'failed'
                ? 'failed'
                : meta?.email === 'unconfirmed'
                  ? 'unconfirmed'
                  : meta?.email === 'suppressed'
                    ? 'suppressed'
                    : 'missing',
          ),
        },
      ];
      return [{
        id: row.userId,
        name: user?.name || user?.username || 'Gebruiker',
        email: user?.email || null,
        message,
        channels,
      }];
    });
    return { summary, message, recipients };
  }

  const notices = await db.notification.findMany({
    where: { type: 'ADMIN_NOTICE' },
    orderBy: { createdAt: 'desc' },
    take: 300,
    select: { userId: true, payload: true, createdAt: true },
  });
  const matched = notices.filter((notice) => asRecord(notice.payload)?.broadcastId === campaignId);
  if (matched.length === 0) return null;
  const first = asRecord(matched[0]?.payload);
  const message = typeof first?.message === 'string' ? first.message : '';
  const title = typeof first?.title === 'string' ? first.title : 'Bericht zonder onderwerp';
  const users = await db.user.findMany({
    where: { id: { in: matched.map((notice) => notice.userId) } },
    select: { id: true, name: true, email: true, username: true },
  });
  const byId = new Map(users.map((user) => [user.id, user]));
  return {
    summary: {
      id: campaignId,
      subject: title,
      at: matched[0]?.createdAt.toISOString() || new Date(0).toISOString(),
      audience: 'Niet geregistreerd',
      channels: ['In-app'],
      incomplete: true,
      note: HISTORY_INCOMPLETE_NOTE,
    },
    message,
    recipients: matched.map((notice) => {
      const user = byId.get(notice.userId);
      return {
        id: notice.userId,
        name: user?.name || user?.username || 'Gebruiker',
        email: user?.email || null,
        message,
        channels: [
          { channel: 'In-app', status: channelOutcomeLabel('inApp', 'created') },
          { channel: 'Push', status: channelOutcomeLabel('push', 'missing') },
          { channel: 'E-mail', status: channelOutcomeLabel('email', 'missing') },
        ],
      };
    }),
  };
}
