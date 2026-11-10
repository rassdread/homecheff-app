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
  'Oudere berichten zonder registratie. De geschiedenis kan onvolledig zijn.';

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

export function channelOutcomeLabel(channel: DeliveryChannel, status: DeliveryRecordStatus | 'missing' | 'no_token' | 'suppressed'): string {
  if (channel === 'inApp' && status === 'created') return 'In-appmelding aangemaakt';
  if (channel === 'push' && status === 'accepted') return 'Push geaccepteerd door de pushdienst. Aflevering op het toestel is niet bevestigd.';
  if (channel === 'email' && status === 'accepted') return 'E-mail geaccepteerd door de maildienst. Aflevering is niet bevestigd.';
  if (status === 'failed') return 'Definitief mislukt. Opnieuw proberen kan.';
  if (status === 'unconfirmed') return 'Uitkomst onbekend. Apart gezet voor controle.';
  if (status === 'no_token') return 'Geen geschikt apparaat. Niet aangeboden aan de pushdienst.';
  if (status === 'suppressed') return 'Niet aangeboden.';
  if (status === 'missing') return 'Niet geregistreerd.';
  return 'Geen registratie voor dit kanaal.';
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
