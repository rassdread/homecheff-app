import { createHash } from 'crypto';

export type DeliveryChannel = 'inApp' | 'push' | 'email';

/** Created in HomeCheff, or accepted by the push or mail service. Not device or inbox delivery. */
export type DeliveryRecordStatus = 'created' | 'accepted' | 'failed' | 'unconfirmed';

export type PriorDelivery = {
  userId: string;
  channel: DeliveryChannel;
  status: DeliveryRecordStatus;
  at: string;
  campaignId: string;
};

export type ContentDeliveryDecision = {
  userId: string;
  channel: DeliveryChannel;
  action: 'send' | 'skip' | 'repeat' | 'review';
  at?: string;
};

export const HISTORY_INCOMPLETE_NOTE =
  'Oudere verzendingen zijn onvolledig geregistreerd. Ontbrekende tekst of uitkomsten zijn niet als ontvangen geteld.';

const CHANNELS: DeliveryChannel[] = ['inApp', 'push', 'email'];

export function isDeliveryChannel(value: unknown): value is DeliveryChannel {
  return value === 'inApp' || value === 'push' || value === 'email';
}

export function channelContentLabel(channel: DeliveryChannel, title: string, subject: string): string {
  if (channel === 'email') return subject.trim();
  const label = title.trim();
  return label || 'HomeCheff';
}

export function contentFingerprint(channel: DeliveryChannel, title: string, subject: string, message: string): string {
  const label = channelContentLabel(channel, title, subject);
  const body = message.replace(/\r\n/g, '\n').trim();
  return createHash('sha256').update(`${channel}\n${label}\n${body}`).digest('hex').slice(0, 24);
}

export function safeRecordToken(value: string): string {
  return value.replace(/[^0-9a-zA-Z_-]/g, '').slice(0, 80);
}

export function priorDeliveryId(userId: string, channel: DeliveryChannel, fingerprint: string): string {
  return `abp:${safeRecordToken(userId)}:${channel}:${fingerprint}`;
}

export function campaignRecordId(campaignId: string): string {
  return `abc:${safeRecordToken(campaignId)}`;
}

export function deliveryBlocksResend(status: DeliveryRecordStatus): boolean {
  return status === 'created' || status === 'accepted';
}

export function keepStrongerStatus(current: DeliveryRecordStatus | null, incoming: DeliveryRecordStatus): DeliveryRecordStatus {
  if (current && deliveryBlocksResend(current)) return current;
  return incoming;
}

export function planContentDeliveries(input: {
  userIds: string[];
  channels: DeliveryChannel[];
  priors: PriorDelivery[];
  confirmRepeat: boolean;
}): ContentDeliveryDecision[] {
  const users = [...new Set(input.userIds)];
  const decisions: ContentDeliveryDecision[] = [];
  for (const userId of users) {
    for (const channel of input.channels) {
      const rows = input.priors.filter((prior) => prior.userId === userId && prior.channel === channel);
      const blocking = rows
        .filter((prior) => deliveryBlocksResend(prior.status))
        .sort((a, b) => b.at.localeCompare(a.at))[0];
      if (blocking) {
        decisions.push({
          userId,
          channel,
          action: input.confirmRepeat ? 'repeat' : 'skip',
          at: blocking.at,
        });
        continue;
      }
      const review = rows
        .filter((prior) => prior.status === 'unconfirmed')
        .sort((a, b) => b.at.localeCompare(a.at))[0];
      if (review) {
        decisions.push({ userId, channel, action: 'review', at: review.at });
        continue;
      }
      decisions.push({ userId, channel, action: 'send' });
    }
  }
  return decisions;
}

export function countDecisions(decisions: ContentDeliveryDecision[], action: ContentDeliveryDecision['action']): Record<DeliveryChannel, number> {
  const counts: Record<DeliveryChannel, number> = { inApp: 0, push: 0, email: 0 };
  for (const decision of decisions) {
    if (decision.action === action) counts[decision.channel] += 1;
  }
  return counts;
}

export function duplicatePlanLines(decisions: ContentDeliveryDecision[]): string[] {
  const lines: string[] = [];
  const skipped = countDecisions(decisions, 'skip');
  const repeated = countDecisions(decisions, 'repeat');
  const review = countDecisions(decisions, 'review');
  for (const channel of CHANNELS) {
    const name = channel === 'inApp' ? 'In-app' : channel === 'push' ? 'Push' : 'E-mail';
    if (skipped[channel] > 0) {
      lines.push(`${name}: ${skipped[channel]} ontvanger(s) worden overgeslagen omdat ze dit bericht al kregen.`);
    }
    if (repeated[channel] > 0) {
      lines.push(`${name}: herhaling bevestigd voor ${repeated[channel]} ontvanger(s) die dit bericht al kregen.`);
    }
    if (review[channel] > 0) {
      lines.push(`${name}: ${review[channel]} eerdere poging(en) met onbekende uitkomst blijven apart en worden niet verstuurd.`);
    }
  }
  return lines;
}

export type HistoryOutcome =
  | DeliveryRecordStatus
  | 'delivered'
  | 'skipped_duplicate'
  | 'missing'
  | 'no_token'
  | 'suppressed';

export function channelDisplayName(channel: DeliveryChannel): string {
  if (channel === 'inApp') return 'In-app';
  if (channel === 'push') return 'Push';
  return 'E-mail';
}

export function channelOutcomeLabel(channel: DeliveryChannel, status: HistoryOutcome): string {
  if (status === 'delivered') return 'Afgeleverd';
  if (channel === 'inApp' && status === 'created') return 'In-appmelding aangemaakt';
  if (channel === 'push' && status === 'accepted') return 'Push geaccepteerd door de pushdienst';
  if (channel === 'email' && status === 'accepted') return 'E-mail geaccepteerd door maildienst';
  if (status === 'skipped_duplicate') return 'Overgeslagen als duplicaat';
  if (status === 'failed') return 'Mislukt';
  if (status === 'unconfirmed') return 'Uitkomst onbekend';
  if (status === 'no_token') return 'Geen geschikt apparaat';
  if (status === 'suppressed') return 'Niet aangeboden';
  return 'Niet geregistreerd';
}

export function outcomeWasReceived(status: HistoryOutcome): boolean {
  return status === 'created' || status === 'accepted' || status === 'delivered';
}

export type HistoryChannelStatus = {
  channel: string;
  status: string;
  received: boolean;
};

export function describeChannelOutcomes(
  channels: DeliveryChannel[],
  state: Partial<Record<DeliveryChannel, HistoryOutcome>>,
): HistoryChannelStatus[] {
  return channels.map((channel) => {
    const outcome = state[channel] ?? 'missing';
    return {
      channel: channelDisplayName(channel),
      status: channelOutcomeLabel(channel, outcome),
      received: outcomeWasReceived(outcome),
    };
  });
}

export function channelsFromMessageType(messageType: string | null): DeliveryChannel[] {
  if (messageType === 'push') return ['inApp', 'push'];
  if (messageType === 'both') return ['inApp', 'push', 'email'];
  if (messageType === 'email') return ['inApp', 'email'];
  return ['inApp'];
}

export function historyDay(at: string, timeZone = 'Europe/Amsterdam'): string {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function withinHistoryPeriod(at: string, from: string | null, to: string | null): boolean {
  const day = historyDay(at);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function recipientCountLabel(count: number, incomplete: boolean): string {
  if (count === 0 && incomplete) return 'Ontvangers niet geregistreerd';
  if (count === 1) return '1 ontvanger';
  return `${count} ontvangers`;
}

export function readStoredBroadcastNotice(payload: unknown): {
  broadcastId: string;
  title: string;
  message: string;
  messageType: string | null;
} | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;
  const data = record.data && typeof record.data === 'object' && !Array.isArray(record.data)
    ? record.data as Record<string, unknown>
    : null;
  if (data?.kind === 'HCP_BADGE' || data?.orderId || data?.proposalId || data?.shiftId || data?.conversationId) return null;
  const broadcastId = typeof record.broadcastId === 'string' ? record.broadcastId.trim() : '';
  if (!broadcastId) return null;
  const message = typeof record.message === 'string' && record.message.trim()
    ? record.message
    : typeof record.body === 'string'
      ? record.body
      : '';
  const title = typeof record.title === 'string' && record.title.trim() ? record.title.trim() : 'Bericht zonder onderwerp';
  const messageType = record.messageType === 'email' || record.messageType === 'push' || record.messageType === 'both'
    ? record.messageType
    : null;
  return { broadcastId, title, message, messageType };
}

export type HistoryListSend = {
  id: string;
  subject: string;
  at: string;
  audience: string;
  channels: string[];
  channelIds: DeliveryChannel[];
  recipientCount: number;
  incomplete: boolean;
  note: string | null;
};

export type HistoryMembership = {
  sendId: string;
  userId: string;
  channels: HistoryChannelStatus[];
};

export function filterHistorySends(
  sends: HistoryListSend[],
  input: { from: string | null; to: string | null; channel: 'all' | DeliveryChannel },
): HistoryListSend[] {
  return sends
    .filter((send) => withinHistoryPeriod(send.at, input.from, input.to))
    .filter((send) => input.channel === 'all' || send.channelIds.includes(input.channel))
    .sort((left, right) => right.at.localeCompare(left.at));
}

export function rowsForHistoryQuery(input: {
  sends: HistoryListSend[];
  membership: HistoryMembership[];
  people: Array<{ id: string; name: string | null; email: string | null; username: string | null }>;
  query: string;
}): Array<HistoryListSend & { focus: { userId: string; name: string; email: string | null; channels: HistoryChannelStatus[] } | null }> {
  const q = input.query.trim().toLowerCase();
  const ordered = filterHistorySends(input.sends, { from: null, to: null, channel: 'all' });
  if (!q) return ordered.map((send) => ({ ...send, focus: null }));
  const people = input.people.filter((person) =>
    [person.name, person.email || '', person.username || ''].join(' ').toLowerCase().includes(q),
  );
  const personIds = new Set(people.map((person) => person.id));
  const byId = new Map(people.map((person) => [person.id, person]));
  const bySend = new Map(ordered.map((send) => [send.id, send]));
  const focused = input.membership.flatMap((item) => {
    const send = bySend.get(item.sendId);
    const person = byId.get(item.userId);
    if (!send || !person || !personIds.has(item.userId)) return [];
    return [{
      ...send,
      focus: {
        userId: person.id,
        name: person.name || person.username || 'Gebruiker',
        email: person.email,
        channels: item.channels,
      },
    }];
  });
  const focusedIds = new Set(focused.map((row) => row.id));
  const subjects = ordered
    .filter((send) => !focusedIds.has(send.id) && `${send.subject} ${send.audience}`.toLowerCase().includes(q))
    .map((send) => ({ ...send, focus: null }));
  return [...focused, ...subjects].sort((left, right) => right.at.localeCompare(left.at));
}

export function alreadySentLabel(channel: DeliveryChannel, at: string): string {
  const name = channel === 'inApp' ? 'in-app' : channel === 'push' ? 'push' : 'e-mail';
  return `Dit bericht al verstuurd via ${name} op ${at}.`;
}

function sameText(left: string, right: string): boolean {
  return left.replace(/\r\n/g, '\n').trim() === right.replace(/\r\n/g, '\n').trim();
}

/** An existing in-app admin notice is a created delivery when title and message match. */
export function priorFromStoredNotice(input: {
  userId: string;
  payload: unknown;
  at: string;
  content: { title: string; subject: string; message: string };
}): PriorDelivery | null {
  if (!input.payload || typeof input.payload !== 'object' || Array.isArray(input.payload)) return null;
  const payload = input.payload as Record<string, unknown>;
  const storedMessage = typeof payload.message === 'string' ? payload.message : typeof payload.body === 'string' ? payload.body : '';
  const storedTitle = typeof payload.title === 'string' ? payload.title : '';
  if (!sameText(storedMessage, input.content.message)) return null;
  const inAppLabel = channelContentLabel('inApp', input.content.title, input.content.subject);
  if (!sameText(storedTitle, inAppLabel) && !sameText(storedTitle, input.content.subject) && !sameText(storedTitle, input.content.title)) {
    return null;
  }
  return {
    userId: input.userId,
    channel: 'inApp',
    status: 'created',
    at: input.at,
    campaignId: typeof payload.broadcastId === 'string' ? payload.broadcastId : 'stored-notice',
  };
}
